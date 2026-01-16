/**
 * Composant de démonstration pour tester l'isolation des onglets
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTabIsolation } from './TabIsolationWrapper.jsx';
import { useTabPersistence, useTabSync } from '../../hooks/useTabPersistence.js';

const MultiTabDemo = () => {
  const auth = useAuth();
  const tabIsolation = useTabIsolation();
  const [localData, setLocalData] = useTabPersistence('demoData', { counter: 0, notes: '' });
  const [sharedData, setSharedData] = useTabSync('sharedCounter', 0);
  const [testResults, setTestResults] = useState([]);

  // Tests automatiques d'isolation
  useEffect(() => {
    const runIsolationTests = () => {
      const tests = [];

      // Test 1: Vérifier l'unicité de l'ID de session
      tests.push({
        name: 'ID de session unique',
        passed: !!tabIsolation.sessionId && tabIsolation.sessionId.length > 10,
        details: `Session ID: ${tabIsolation.sessionId?.substring(0, 8)}...`
      });

      // Test 2: Vérifier l'isolation des données locales
      tests.push({
        name: 'Isolation des données locales',
        passed: localData !== null,
        details: `Données locales: ${JSON.stringify(localData)}`
      });

      // Test 3: Vérifier la persistance sessionStorage
      tests.push({
        name: 'Persistance sessionStorage',
        passed: sessionStorage.getItem('current_session_id') === tabIsolation.sessionId,
        details: 'Session ID persisté dans sessionStorage'
      });

      // Test 4: Vérifier l'état d'authentification isolé
      tests.push({
        name: 'État d\'authentification isolé',
        passed: typeof auth.isAuthenticated === 'boolean',
        details: `Authentifié: ${auth.isAuthenticated ? 'Oui' : 'Non'}`
      });

      setTestResults(tests);
    };

    runIsolationTests();
    const interval = setInterval(runIsolationTests, 10000); // Re-tester toutes les 10s
    return () => clearInterval(interval);
  }, [tabIsolation.sessionId, localData, auth.isAuthenticated]);

  const handleLocalIncrement = () => {
    setLocalData(prev => ({
      ...prev,
      counter: prev.counter + 1
    }));
  };

  const handleSharedIncrement = () => {
    setSharedData(prev => prev + 1);
  };

  const handleNotesChange = (e) => {
    setLocalData(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };

  const simulateLogin = async () => {
    const mockUser = {
      nom: 'Test',
      prenom: `Utilisateur${Math.floor(Math.random() * 1000)}`,
      role: ['DE', 'FORMATEUR', 'ETUDIANT'][Math.floor(Math.random() * 3)],
      email: `test${Math.floor(Math.random() * 1000)}@example.com`
    };

    const mockToken = `token_${Date.now()}_${Math.random()}`;
    
    await auth.login(mockToken, mockUser);
  };

  const simulateLogout = async () => {
    await auth.logout();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: '#f9f9f9',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '400px',
      fontSize: '12px',
      zIndex: 9998
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
        🧪 Test d'isolation des onglets
      </h4>

      {/* Informations de l'onglet */}
      <div style={{ marginBottom: '10px', background: '#fff', padding: '8px', borderRadius: '4px' }}>
        <strong>Onglet actuel:</strong><br />
        <small>ID: {tabIsolation.tabId?.substring(0, 12)}...</small><br />
        <small>Session: {tabIsolation.sessionId?.substring(0, 12)}...</small><br />
        <small>Multi-onglet: {tabIsolation.isMultiTab ? '✅ Oui' : '❌ Non'}</small><br />
        <small>Actif: {tabIsolation.tabState.isActive ? '✅' : '❌'}</small>
      </div>

      {/* État d'authentification */}
      <div style={{ marginBottom: '10px', background: '#fff', padding: '8px', borderRadius: '4px' }}>
        <strong>Authentification:</strong><br />
        {auth.isAuthenticated ? (
          <div>
            <small>✅ Connecté: {auth.user?.prenom} {auth.user?.nom}</small><br />
            <small>Rôle: {auth.user?.role}</small><br />
            <button onClick={simulateLogout} style={{ fontSize: '10px', padding: '2px 5px', marginTop: '3px' }}>
              Déconnexion
            </button>
          </div>
        ) : (
          <div>
            <small>❌ Non connecté</small><br />
            <button onClick={simulateLogin} style={{ fontSize: '10px', padding: '2px 5px', marginTop: '3px' }}>
              Connexion test
            </button>
          </div>
        )}
      </div>

      {/* Tests de données isolées */}
      <div style={{ marginBottom: '10px', background: '#fff', padding: '8px', borderRadius: '4px' }}>
        <strong>Données isolées (cet onglet uniquement):</strong><br />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <span>Compteur: {localData.counter}</span>
          <button onClick={handleLocalIncrement} style={{ fontSize: '10px', padding: '1px 3px' }}>
            +1
          </button>
        </div>
        <textarea
          value={localData.notes}
          onChange={handleNotesChange}
          placeholder="Notes privées à cet onglet..."
          style={{ width: '100%', height: '40px', fontSize: '10px', marginTop: '3px' }}
        />
      </div>

      {/* Tests de données partagées */}
      <div style={{ marginBottom: '10px', background: '#fff', padding: '8px', borderRadius: '4px' }}>
        <strong>Données partagées (tous les onglets):</strong><br />
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
          <span>Compteur global: {sharedData}</span>
          <button onClick={handleSharedIncrement} style={{ fontSize: '10px', padding: '1px 3px' }}>
            +1
          </button>
        </div>
      </div>

      {/* Résultats des tests */}
      <div style={{ background: '#fff', padding: '8px', borderRadius: '4px' }}>
        <strong>Tests d'isolation:</strong><br />
        {testResults.map((test, index) => (
          <div key={index} style={{ marginTop: '2px' }}>
            <span style={{ color: test.passed ? 'green' : 'red' }}>
              {test.passed ? '✅' : '❌'} {test.name}
            </span>
            <br />
            <small style={{ color: '#666', marginLeft: '15px' }}>
              {test.details}
            </small>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        💡 Dupliquez cet onglet (Ctrl+Shift+K) pour tester l'isolation
      </div>
    </div>
  );
};

export default MultiTabDemo;