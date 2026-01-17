/**
 * SessionStorage - Gestionnaire de stockage isolé par session
 * 
 * Fournit une interface de stockage qui isole les données par identifiant de session,
 * permettant à plusieurs sessions d'exister simultanément sans conflit.
 */

export class SessionStorage {
  constructor(sessionId) {
    if (!sessionId) {
      throw new Error('SessionStorage nécessite un identifiant de session');
    }
    this.sessionId = sessionId;
    this.keyPrefix = `session_${sessionId}_`;
  }

  /**
   * Génère une clé de stockage préfixée par la session
   * @param {string} key - La clé originale
   * @returns {string} La clé préfixée
   */
  _getStorageKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Stocke une valeur avec isolation par session
   * @param {string} key - La clé de stockage
   * @param {string} value - La valeur à stocker
   */
  setItem(key, value) {
    const storageKey = this._getStorageKey(key);
    localStorage.setItem(storageKey, value);
  }

  /**
   * Récupère une valeur pour la session actuelle
   * @param {string} key - La clé de stockage
   * @returns {string|null} La valeur ou null si non trouvée
   */
  getItem(key) {
    const storageKey = this._getStorageKey(key);
    return localStorage.getItem(storageKey);
  }

  /**
   * Supprime une valeur pour la session actuelle
   * @param {string} key - La clé de stockage
   */
  removeItem(key) {
    const storageKey = this._getStorageKey(key);
    localStorage.removeItem(storageKey);
  }

  /**
   * Efface toutes les données de la session actuelle
   */
  clear() {
    const keysToRemove = [];
    
    // Identifier toutes les clés de cette session
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Supprimer toutes les clés identifiées
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Obtient toutes les clés de stockage pour cette session
   * @returns {string[]} Liste des clés (sans préfixe)
   */
  getAllSessionKeys() {
    const sessionKeys = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        // Retirer le préfixe pour obtenir la clé originale
        const originalKey = key.substring(this.keyPrefix.length);
        sessionKeys.push(originalKey);
      }
    }
    
    return sessionKeys;
  }

  /**
   * Vérifie si une clé existe pour cette session
   * @param {string} key - La clé à vérifier
   * @returns {boolean} True si la clé existe, false sinon
   */
  hasItem(key) {
    return this.getItem(key) !== null;
  }

  /**
   * Obtient le nombre d'éléments stockés pour cette session
   * @returns {number} Le nombre d'éléments
   */
  length() {
    return this.getAllSessionKeys().length;
  }

  /**
   * Obtient l'identifiant de session
   * @returns {string} L'identifiant de session
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Exporte toutes les données de la session
   * @returns {object} Objet contenant toutes les données de la session
   */
  exportSessionData() {
    const data = {};
    const keys = this.getAllSessionKeys();
    
    keys.forEach(key => {
      data[key] = this.getItem(key);
    });
    
    return {
      sessionId: this.sessionId,
      data: data,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Importe des données dans la session
   * @param {object} sessionData - Les données à importer
   */
  importSessionData(sessionData) {
    if (!sessionData || !sessionData.data) {
      throw new Error('Données de session invalides');
    }
    
    Object.entries(sessionData.data).forEach(([key, value]) => {
      this.setItem(key, value);
    });
  }

  /**
   * Obtient des statistiques sur l'utilisation du stockage
   * @returns {object} Statistiques de stockage
   */
  getStorageStats() {
    const keys = this.getAllSessionKeys();
    let totalSize = 0;
    
    keys.forEach(key => {
      const value = this.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    });
    
    return {
      sessionId: this.sessionId,
      keyCount: keys.length,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      keys: keys
    };
  }

  /**
   * Vérifie si le stockage approche de la limite
   * @returns {boolean} True si proche de la limite
   */
  isStorageNearLimit() {
    try {
      // Tenter de stocker une chaîne de test
      const testKey = `${this.keyPrefix}__test__`;
      const testValue = 'x'.repeat(1024); // 1KB de test
      
      localStorage.setItem(testKey, testValue);
      localStorage.removeItem(testKey);
      
      return false;
    } catch (e) {
      // QuotaExceededError ou autre erreur de stockage
      return true;
    }
  }

  /**
   * Nettoie les données anciennes pour libérer de l'espace
   * @param {number} maxAge - Age maximum en millisecondes
   */
  cleanOldData(maxAge = 24 * 60 * 60 * 1000) { // 24h par défaut
    const now = Date.now();
    const lastActivityKey = 'lastActivity';
    const createdAtKey = 'createdAt';
    
    const lastActivity = this.getItem(lastActivityKey);
    const createdAt = this.getItem(createdAtKey);
    
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      if (now - lastActivityTime > maxAge) {
        console.log(`Nettoyage de la session ${this.sessionId} (inactivité: ${Math.round((now - lastActivityTime) / 1000 / 60)} min)`);
        this.clear();
        return true;
      }
    } else if (createdAt) {
      const createdTime = parseInt(createdAt);
      if (now - createdTime > maxAge) {
        console.log(`Nettoyage de la session ${this.sessionId} (âge: ${Math.round((now - createdTime) / 1000 / 60)} min)`);
        this.clear();
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clone les données vers une autre session
   * @param {string} targetSessionId - ID de la session cible
   * @returns {SessionStorage} Nouvelle instance de SessionStorage
   */
  cloneToSession(targetSessionId) {
    const targetStorage = new SessionStorage(targetSessionId);
    const data = this.exportSessionData();
    
    targetStorage.importSessionData(data);
    
    return targetStorage;
  }
}