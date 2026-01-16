/**
 * SessionManager - Gestionnaire principal des sessions multiples
 * 
 * Permet à plusieurs utilisateurs de se connecter simultanément dans différents onglets
 * en isolant leurs données d'authentification par session.
 */

import { SessionStorage } from './SessionStorage.js';

export class SessionManager {
  constructor() {
    this.currentSessionId = this.initializeSessionId();
    this.sessionStorage = new SessionStorage(this.currentSessionId);
  }

  /**
   * Génère un identifiant de session unique au format UUID v4
   * @returns {string} UUID v4 cryptographiquement sécurisé
   */
  generateSessionId() {
    // Utiliser crypto.randomUUID() si disponible (navigateurs modernes)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback pour les navigateurs plus anciens
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Valide qu'un identifiant respecte le format UUID v4
   * @param {string} sessionId - L'identifiant à valider
   * @returns {boolean} True si valide, false sinon
   */
  isValidSessionId(sessionId) {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof sessionId === 'string' && uuidV4Regex.test(sessionId);
  }

  /**
   * Initialise ou récupère l'identifiant de session pour l'onglet actuel
   * @returns {string} L'identifiant de session
   */
  initializeSessionId() {
    // Vérifier si un session ID existe déjà pour cet onglet (sessionStorage)
    let sessionId = sessionStorage.getItem('current_session_id');
    
    if (!sessionId || !this.isValidSessionId(sessionId)) {
      // Générer un nouveau session ID
      sessionId = this.generateSessionId();
      sessionStorage.setItem('current_session_id', sessionId);
    }
    
    return sessionId;
  }

  /**
   * Obtient l'identifiant de session actuel
   * @returns {string} L'identifiant de session
   */
  getCurrentSessionId() {
    return this.currentSessionId;
  }

  /**
   * Sauvegarde les données d'authentification pour la session actuelle
   * @param {string} token - Le token JWT
   * @param {object} userData - Les données utilisateur
   */
  saveAuthData(token, userData) {
    const sessionData = {
      sessionId: this.currentSessionId,
      authToken: token,
      userData: userData,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.sessionStorage.setItem('authToken', token);
    this.sessionStorage.setItem('userData', JSON.stringify(userData));
    this.sessionStorage.setItem('createdAt', sessionData.createdAt.toString());
    this.sessionStorage.setItem('lastActivity', sessionData.lastActivity.toString());
  }

  /**
   * Récupère les données d'authentification pour la session actuelle
   * @returns {object|null} Les données d'authentification ou null
   */
  getAuthData() {
    const token = this.sessionStorage.getItem('authToken');
    const userData = this.sessionStorage.getItem('userData');
    
    if (token && userData) {
      // Mettre à jour la dernière activité
      this.updateLastActivity();
      
      return {
        token,
        user: JSON.parse(userData)
      };
    }
    
    return null;
  }

  /**
   * Efface les données d'authentification pour la session actuelle
   */
  clearAuthData() {
    this.sessionStorage.clear();
  }

  /**
   * Vérifie si l'utilisateur est authentifié dans la session actuelle
   * @returns {boolean} True si authentifié, false sinon
   */
  isAuthenticated() {
    return !!this.sessionStorage.getItem('authToken');
  }

  /**
   * Obtient le rôle de l'utilisateur connecté
   * @returns {string|null} Le rôle ou null
   */
  getUserRole() {
    const authData = this.getAuthData();
    return authData?.user?.role || null;
  }

  /**
   * Met à jour le timestamp de dernière activité
   */
  updateLastActivity() {
    this.sessionStorage.setItem('lastActivity', Date.now().toString());
  }

  /**
   * Migre les données existantes du localStorage vers le système de sessions
   */
  migrateExistingData() {
    // Vérifier s'il y a des données dans l'ancien format
    const oldToken = localStorage.getItem('authToken');
    const oldUserData = localStorage.getItem('userData');
    
    if (oldToken && oldUserData && !this.isAuthenticated()) {
      console.log('Migration des données d\'authentification existantes...');
      
      try {
        const userData = JSON.parse(oldUserData);
        this.saveAuthData(oldToken, userData);
        
        // Nettoyer les anciennes données
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        console.log('Migration terminée avec succès');
        return true;
      } catch (error) {
        console.error('Erreur lors de la migration:', error);
        return false;
      }
    }
    
    return false;
  }

  /**
   * Nettoie les sessions expirées (plus de 24h d'inactivité)
   */
  cleanExpiredSessions() {
    const now = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    
    // Obtenir toutes les clés de session dans localStorage
    const sessionKeys = this.getAllSessionKeys();
    let cleanedCount = 0;
    
    sessionKeys.forEach(sessionId => {
      if (sessionId === this.currentSessionId) {
        // Ne pas nettoyer la session actuelle
        return;
      }
      
      const sessionStorage = new SessionStorage(sessionId);
      const cleaned = sessionStorage.cleanOldData(expirationTime);
      
      if (cleaned) {
        cleanedCount++;
      }
    });
    
    console.log(`Nettoyage terminé: ${cleanedCount} sessions expirées supprimées`);
    return cleanedCount;
  }

  /**
   * Obtient des statistiques détaillées sur toutes les sessions
   * @returns {object} Statistiques complètes
   */
  getAllSessionsStats() {
    const sessionKeys = this.getAllSessionKeys();
    const stats = {
      totalSessions: sessionKeys.length,
      currentSessionId: this.currentSessionId,
      sessions: [],
      totalStorageUsed: 0
    };
    
    sessionKeys.forEach(sessionId => {
      const sessionStorage = new SessionStorage(sessionId);
      const sessionStats = sessionStorage.getStorageStats();
      
      // Ajouter des informations temporelles
      const lastActivity = sessionStorage.getItem('lastActivity');
      const createdAt = sessionStorage.getItem('createdAt');
      const userData = sessionStorage.getItem('userData');
      
      let userInfo = null;
      if (userData) {
        try {
          const user = JSON.parse(userData);
          userInfo = {
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
            email: user.email
          };
        } catch (e) {
          // Ignore les erreurs de parsing
        }
      }
      
      const sessionInfo = {
        ...sessionStats,
        lastActivity: lastActivity ? new Date(parseInt(lastActivity)) : null,
        createdAt: createdAt ? new Date(parseInt(createdAt)) : null,
        isCurrentSession: sessionId === this.currentSessionId,
        isAuthenticated: !!sessionStorage.getItem('authToken'),
        user: userInfo,
        ageMinutes: createdAt ? Math.round((Date.now() - parseInt(createdAt)) / 1000 / 60) : null,
        inactiveMinutes: lastActivity ? Math.round((Date.now() - parseInt(lastActivity)) / 1000 / 60) : null
      };
      
      stats.sessions.push(sessionInfo);
      stats.totalStorageUsed += sessionStats.totalSizeBytes;
    });
    
    // Trier par dernière activité
    stats.sessions.sort((a, b) => {
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
    
    stats.totalStorageUsedKB = Math.round(stats.totalStorageUsed / 1024 * 100) / 100;
    
    return stats;
  }

  /**
   * Force le nettoyage d'une session spécifique
   * @param {string} sessionId - ID de la session à nettoyer
   * @returns {boolean} True si nettoyée, false si non trouvée
   */
  forceCleanSession(sessionId) {
    if (sessionId === this.currentSessionId) {
      console.warn('Impossible de nettoyer la session actuelle');
      return false;
    }
    
    const sessionStorage = new SessionStorage(sessionId);
    if (sessionStorage.length() > 0) {
      sessionStorage.clear();
      console.log(`Session ${sessionId} nettoyée manuellement`);
      return true;
    }
    
    return false;
  }

  /**
   * Vérifie et libère de l'espace de stockage si nécessaire
   * @returns {object} Résultat du nettoyage
   */
  ensureStorageSpace() {
    const result = {
      wasNearLimit: false,
      sessionsCleaned: 0,
      spaceFreed: 0
    };
    
    // Vérifier si on approche de la limite
    if (this.sessionStorage.isStorageNearLimit()) {
      result.wasNearLimit = true;
      console.warn('Stockage proche de la limite, nettoyage automatique...');
      
      const statsBefore = this.getAllSessionsStats();
      result.sessionsCleaned = this.cleanExpiredSessions();
      const statsAfter = this.getAllSessionsStats();
      
      result.spaceFreed = statsBefore.totalStorageUsed - statsAfter.totalStorageUsed;
      
      console.log(`Espace libéré: ${Math.round(result.spaceFreed / 1024 * 100) / 100} KB`);
    }
    
    return result;
  }

  /**
   * Crée une sauvegarde de toutes les sessions actives
   * @returns {object} Données de sauvegarde
   */
  createSessionsBackup() {
    const stats = this.getAllSessionsStats();
    const backup = {
      createdAt: new Date().toISOString(),
      totalSessions: stats.totalSessions,
      sessions: {}
    };
    
    stats.sessions.forEach(session => {
      if (session.isAuthenticated) {
        const sessionStorage = new SessionStorage(session.sessionId);
        backup.sessions[session.sessionId] = sessionStorage.exportSessionData();
      }
    });
    
    return backup;
  }

  /**
   * Restaure des sessions depuis une sauvegarde
   * @param {object} backup - Données de sauvegarde
   * @returns {number} Nombre de sessions restaurées
   */
  restoreSessionsFromBackup(backup) {
    if (!backup || !backup.sessions) {
      throw new Error('Sauvegarde invalide');
    }
    
    let restoredCount = 0;
    
    Object.entries(backup.sessions).forEach(([sessionId, sessionData]) => {
      try {
        const sessionStorage = new SessionStorage(sessionId);
        sessionStorage.importSessionData(sessionData);
        restoredCount++;
        console.log(`Session ${sessionId} restaurée`);
      } catch (error) {
        console.error(`Erreur lors de la restauration de la session ${sessionId}:`, error);
      }
    });
    
    console.log(`${restoredCount} sessions restaurées depuis la sauvegarde`);
    return restoredCount;
  }

  /**
   * Obtient toutes les clés de session existantes
   * @returns {string[]} Liste des identifiants de session
   */
  getAllSessionKeys() {
    const sessionKeys = [];
    const prefix = 'session_';
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const sessionId = key.split('_')[1];
        if (sessionId && !sessionKeys.includes(sessionId)) {
          sessionKeys.push(sessionId);
        }
      }
    }
    
    return sessionKeys;
  }

  /**
   * Redirige vers le dashboard approprié selon le rôle
   * @param {string} role - Le rôle de l'utilisateur
   * @returns {string} L'URL du dashboard
   */
  redirectToDashboard(role) {
    switch (role) {
      case 'DE':
        return '/dashboard/de';
      case 'FORMATEUR':
        return '/dashboard/formateur';
      case 'ETUDIANT':
        return '/dashboard/etudiant';
      default:
        return '/';
    }
  }
}