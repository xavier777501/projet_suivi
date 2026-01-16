/**
 * Wrapper pour l'isolation des onglets
 * Assure que chaque onglet maintient son propre contexte de session
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '../../contexts/AuthContext.jsx';
import { useTabDetection, useTabState } from '../../hooks/useTabPersistence.js';

const TabIsolationWrapper = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isolationInfo, setIsolationInfo] = useState(null);
  const tabDetection = useTabDetection();
  const tabState = useTabState();

  useEffect(() => {
    // Initialiser l'isolation des onglets
    const initializeTabIsolation = () => {
      const info = {
        tabId: tabDetection.currentTabId,
        sessionId: sessionStorage.getItem('current_session_id'),
        isMultiTab: tabDetection.isDuplicate,
        tabCount: tabDetection.tabCount,
        createdAt: Date.now(),
        url: window.location.href
      };

      // Générer un session ID unique si nécessaire
      if (!info.sessionId) {
        info.sessionId = crypto.randomUUID ? crypto.randomUUID() : 
          'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        
        sessionStorage.setItem('current_session_id', info.sessionId);
      }

      setIsolationInfo(info);
      setIsInitialized(true);

      console.log('🔒 Isolation des onglets initialisée:', info);
    };

    initializeTabIsolation();
  }, [tabDetection.currentTabId, tabDetection.isDuplicate, tabDetection.tabCount]);

  // Gérer les changements de focus/visibilité pour optimiser les performances
  useEffect(() => {
    if (!tabState.isActive) {
      // Réduire la fréquence des mises à jour quand l'onglet n'est pas actif
      console.log('🔇 Onglet inactif, réduction des mises à jour');
    } else {
      console.log('🔊 Onglet actif, mises à jour normales');
    }
  }, [tabState.isActive]);

  // Nettoyer lors de la fermeture de l'onglet
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🗑️ Nettoyage de l\'onglet:', isolationInfo?.tabId);
      
      // Marquer la session comme fermée
      if (isolationInfo?.sessionId) {
        try {
          localStorage.setItem(`session_${isolationInfo.sessionId}_closed`, Date.now().toString());
        } catch (error) {
          console.warn('Erreur lors du marquage de fermeture:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isolationInfo]);

  // Afficher un indicateur de chargement pendant l'initialisation
  if (!isInitialized || !isolationInfo) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div>🔄 Initialisation de la session...</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Configuration de l'isolation des onglets
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <TabIsolationProvider isolationInfo={isolationInfo} tabState={tabState}>
        {children}
      </TabIsolationProvider>
    </AuthProvider>
  );
};

/**
 * Provider pour les informations d'isolation des onglets
 */
const TabIsolationContext = React.createContext(null);

export const useTabIsolation = () => {
  const context = React.useContext(TabIsolationContext);
  if (!context) {
    throw new Error('useTabIsolation doit être utilisé dans un TabIsolationProvider');
  }
  return context;
};

const TabIsolationProvider = ({ children, isolationInfo, tabState }) => {
  const [sessionStats, setSessionStats] = useState(null);

  // Mettre à jour les statistiques périodiquement
  useEffect(() => {
    const updateStats = () => {
      if (tabState.isActive) {
        const stats = {
          ...isolationInfo,
          lastUpdate: Date.now(),
          isActive: tabState.isActive,
          isVisible: tabState.isVisible,
          isFocused: tabState.isFocused,
          lastActivity: tabState.lastActivity,
          uptime: Date.now() - isolationInfo.createdAt
        };
        setSessionStats(stats);
      }
    };

    updateStats();
    
    // Mettre à jour moins fréquemment si l'onglet n'est pas actif
    const interval = setInterval(updateStats, tabState.isActive ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [isolationInfo, tabState]);

  const contextValue = {
    isolationInfo,
    tabState,
    sessionStats,
    
    // Utilitaires
    isMultiTab: isolationInfo.isMultiTab,
    tabId: isolationInfo.tabId,
    sessionId: isolationInfo.sessionId,
    
    // Méthodes
    forceRefresh: () => window.location.reload(),
    closeTab: () => window.close(),
    
    // Événements
    onTabFocus: tabState.updateActivity,
    onTabActivity: tabState.updateActivity
  };

  return (
    <TabIsolationContext.Provider value={contextValue}>
      {children}
    </TabIsolationContext.Provider>
  );
};

export default TabIsolationWrapper;