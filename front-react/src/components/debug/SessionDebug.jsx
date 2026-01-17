/**
 * Composant de debug pour tester le système de sessions multiples
 */

import React, { useState, useEffect } from 'react';
import { 
  getSessionDebugInfo, 
  getCurrentSessionId, 
  cleanExpiredSessions,
  forceMigration,
  getSessionManagerInstance
} from '../../utils/auth.js';

const SessionDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshDebugInfo = async () => {
    try {
      const info = getSessionDebugInfo();
      setDebugInfo(info);
      
      // Obtenir les statistiques détaillées
      if (window.sessionManager) {
        const stats = window.sessionManager.getAllSessionsStats();
        setDetailedStats(stats);
      }
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des infos de debug:', error);
    }
  };

  useEffect(() => {
    // Exposer le sessionManager globalement pour le debug
    try {
      window.sessionManager = getSessionManagerInstance();
      refreshDebugInfo();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du debug:', error);
    }
    
    // Rafraîchir automatiquement toutes les 5 secondes
    const interval = setInterval(refreshDebugInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCleanSessions = () => {
    const cleaned = cleanExpiredSessions();
    refreshDebugInfo();
    alert(`${cleaned} sessions expirées nettoyées`);
  };

  const handleForceMigration = () => {
    const migrated = forceMigration();
    refreshDebugInfo();
    alert(migrated ? 'Migration effectuée' : 'Aucune migration nécessaire');
  };

  const handleClearLocalStorage = () => {
    localStorage.clear();
    refreshDebugInfo();
    alert('localStorage vidé');
  };

  const handleForceCleanSession = (sessionId) => {
    if (window.sessionManager && confirm(`Nettoyer la session ${sessionId.substring(0, 8)}... ?`)) {
      const cleaned = window.sessionManager.forceCleanSession(sessionId);
      refreshDebugInfo();
      alert(cleaned ? 'Session nettoyée' : 'Session non trouvée');
    }
  };

  const handleCreateBackup = () => {
    if (window.sessionManager) {
      const backup = window.sessionManager.createSessionsBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sessions-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!debugInfo) {
    return <div>Chargement des informations de debug...</div>;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '15px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '350px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h4>🔍 Debug Sessions (#{refreshKey})</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Session ID:</strong><br />
        <code style={{ fontSize: '10px' }}>{debugInfo.sessionId.substring(0, 8)}...</code>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Authentifié:</strong> {debugInfo.isAuthenticated ? '✅ Oui' : '❌ Non'}<br />
        <strong>Rôle:</strong> {debugInfo.userRole || 'Aucun'}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Sessions actives:</strong> {debugInfo.allSessions.length}
        {detailedStats && (
          <span> ({Math.round(detailedStats.totalStorageUsedKB)} KB)</span>
        )}
        <br />
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{ fontSize: '10px', padding: '2px 5px', marginTop: '3px' }}
        >
          {showDetails ? '▼ Masquer' : '▶ Détails'}
        </button>
      </div>

      {showDetails && detailedStats && (
        <div style={{ 
          marginBottom: '10px', 
          background: '#fff', 
          padding: '8px', 
          borderRadius: '3px',
          border: '1px solid #ddd',
          fontSize: '10px'
        }}>
          <strong>Détails des sessions:</strong>
          {detailedStats.sessions.map(session => (
            <div key={session.sessionId} style={{ 
              marginTop: '5px', 
              padding: '5px', 
              background: session.isCurrentSession ? '#e8f5e8' : '#f8f8f8',
              borderRadius: '2px'
            }}>
              <div>
                <strong>{session.sessionId.substring(0, 8)}...</strong>
                {session.isCurrentSession && ' (actuelle)'}
              </div>
              {session.user && (
                <div>{session.user.prenom} {session.user.nom} ({session.user.role})</div>
              )}
              <div>
                Taille: {session.totalSizeKB} KB | 
                Âge: {session.ageMinutes || 0}min |
                Inactif: {session.inactiveMinutes || 0}min
              </div>
              {!session.isCurrentSession && (
                <button 
                  onClick={() => handleForceCleanSession(session.sessionId)}
                  style={{ fontSize: '9px', padding: '1px 3px', marginTop: '2px', background: '#ffcccc' }}
                >
                  🗑️ Nettoyer
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <button onClick={refreshDebugInfo} style={{ fontSize: '11px', padding: '3px' }}>
          🔄 Actualiser
        </button>
        <button onClick={handleCleanSessions} style={{ fontSize: '11px', padding: '3px' }}>
          🧹 Nettoyer expirées
        </button>
        <button onClick={handleCreateBackup} style={{ fontSize: '11px', padding: '3px' }}>
          💾 Sauvegarder
        </button>
        <button onClick={handleForceMigration} style={{ fontSize: '11px', padding: '3px' }}>
          📦 Forcer migration
        </button>
        <button onClick={handleClearLocalStorage} style={{ fontSize: '11px', padding: '3px', background: '#ffcccc' }}>
          🗑️ Vider localStorage
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        💡 Ouvrez plusieurs onglets pour tester les sessions multiples
      </div>
    </div>
  );
};

export default SessionDebug;