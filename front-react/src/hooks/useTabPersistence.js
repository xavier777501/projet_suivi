/**
 * Hook personnalisé pour la persistance des données par onglet
 * Utilise sessionStorage pour maintenir les données spécifiques à chaque onglet
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour persister des données dans sessionStorage avec un préfixe de session
 * @param {string} key - Clé de stockage
 * @param {any} defaultValue - Valeur par défaut
 * @param {string} sessionId - Identifiant de session (optionnel)
 * @returns {[any, function]} [valeur, setter]
 */
export const useTabPersistence = (key, defaultValue = null, sessionId = null) => {
  // Générer une clé unique pour cet onglet
  const getStorageKey = useCallback(() => {
    const tabId = sessionId || sessionStorage.getItem('current_session_id') || 'default';
    return `tab_${tabId}_${key}`;
  }, [key, sessionId]);

  // État local
  const [value, setValue] = useState(() => {
    try {
      const storageKey = getStorageKey();
      const item = sessionStorage.getItem(storageKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Erreur lors de la lecture de ${key}:`, error);
      return defaultValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setStoredValue = useCallback((newValue) => {
    try {
      const storageKey = getStorageKey();
      
      // Permettre les fonctions de mise à jour comme useState
      const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
      
      setValue(valueToStore);
      
      if (valueToStore === null || valueToStore === undefined) {
        sessionStorage.removeItem(storageKey);
      } else {
        sessionStorage.setItem(storageKey, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de ${key}:`, error);
    }
  }, [key, value, getStorageKey]);

  // Écouter les changements dans d'autres onglets (même si sessionStorage est isolé)
  useEffect(() => {
    const handleStorageChange = (e) => {
      const storageKey = getStorageKey();
      if (e.key === storageKey && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Erreur lors de la synchronisation de ${key}:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, getStorageKey]);

  return [value, setStoredValue];
};

/**
 * Hook pour gérer l'état de l'onglet (actif/inactif, focus, etc.)
 * @returns {object} État de l'onglet
 */
export const useTabState = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isFocused, setIsFocused] = useState(document.hasFocus());
  const [lastActivity, setLastActivity] = useTabPersistence('lastActivity', Date.now());

  // Mettre à jour la visibilité
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible) {
        setLastActivity(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [setLastActivity]);

  // Mettre à jour le focus
  useEffect(() => {
    const handleFocus = () => {
      setIsFocused(true);
      setLastActivity(Date.now());
    };
    
    const handleBlur = () => {
      setIsFocused(false);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [setLastActivity]);

  // Mettre à jour l'activité sur les interactions utilisateur
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now());
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [setLastActivity]);

  return {
    isVisible,
    isFocused,
    lastActivity,
    isActive: isVisible && isFocused,
    updateActivity: () => setLastActivity(Date.now())
  };
};

/**
 * Hook pour synchroniser des données entre onglets de la même session
 * @param {string} key - Clé de synchronisation
 * @param {any} defaultValue - Valeur par défaut
 * @returns {[any, function]} [valeur, setter]
 */
export const useTabSync = (key, defaultValue = null) => {
  const [value, setValue] = useState(defaultValue);
  const [sessionId] = useTabPersistence('sessionId');

  // Clé de synchronisation globale (localStorage)
  const syncKey = `sync_${sessionId}_${key}`;

  // Initialiser la valeur depuis localStorage
  useEffect(() => {
    try {
      const item = localStorage.getItem(syncKey);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Erreur lors de la lecture de ${syncKey}:`, error);
    }
  }, [syncKey]);

  // Fonction pour mettre à jour et synchroniser
  const setSyncedValue = useCallback((newValue) => {
    try {
      const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
      
      setValue(valueToStore);
      
      if (valueToStore === null || valueToStore === undefined) {
        localStorage.removeItem(syncKey);
      } else {
        localStorage.setItem(syncKey, JSON.stringify(valueToStore));
      }
      
      // Déclencher un événement personnalisé pour notifier les autres onglets
      window.dispatchEvent(new CustomEvent('tabSync', {
        detail: { key: syncKey, value: valueToStore }
      }));
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${key}:`, error);
    }
  }, [key, value, syncKey]);

  // Écouter les changements depuis d'autres onglets
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === syncKey && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Erreur lors de la synchronisation de ${key}:`, error);
        }
      }
    };

    const handleTabSync = (e) => {
      if (e.detail.key === syncKey) {
        setValue(e.detail.value);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tabSync', handleTabSync);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tabSync', handleTabSync);
    };
  }, [key, syncKey]);

  return [value, setSyncedValue];
};

/**
 * Hook pour détecter les onglets dupliqués
 * @returns {object} Informations sur les onglets
 */
export const useTabDetection = () => {
  const [tabId] = useTabPersistence('tabId', () => `tab_${Date.now()}_${Math.random()}`);
  const [allTabs, setAllTabs] = useTabSync('activeTabs', []);

  // Enregistrer cet onglet
  useEffect(() => {
    const currentTab = {
      id: tabId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    setAllTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      return [...filtered, currentTab];
    });

    // Nettoyer lors de la fermeture
    const handleBeforeUnload = () => {
      setAllTabs(prev => prev.filter(tab => tab.id !== tabId));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tabId, setAllTabs]);

  // Nettoyer les onglets inactifs
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      setAllTabs(prev => 
        prev.filter(tab => now - tab.timestamp < maxAge)
      );
    }, 60000); // Nettoyer chaque minute

    return () => clearInterval(cleanupInterval);
  }, [setAllTabs]);

  return {
    currentTabId: tabId,
    allTabs,
    tabCount: allTabs.length,
    isDuplicate: allTabs.length > 1
  };
};