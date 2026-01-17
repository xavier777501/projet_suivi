/**
 * Tests unitaires pour SessionManager
 */

import { SessionManager } from '../SessionManager.js';
import { SessionStorage } from '../SessionStorage.js';
import { isValidUUIDv4, generateUniqueUUIDs } from '../sessionUtils.js';

// Mock sessionStorage pour les tests
const mockSessionStorage = {
  data: {},
  getItem: jest.fn((key) => mockSessionStorage.data[key] || null),
  setItem: jest.fn((key, value) => { mockSessionStorage.data[key] = value; }),
  removeItem: jest.fn((key) => { delete mockSessionStorage.data[key]; }),
  clear: jest.fn(() => { mockSessionStorage.data = {}; })
};

// Mock localStorage pour les tests
const mockLocalStorage = {
  data: {},
  getItem: jest.fn((key) => mockLocalStorage.data[key] || null),
  setItem: jest.fn((key, value) => { mockLocalStorage.data[key] = value; }),
  removeItem: jest.fn((key) => { delete mockLocalStorage.data[key]; }),
  key: jest.fn((index) => Object.keys(mockLocalStorage.data)[index]),
  get length() { return Object.keys(mockLocalStorage.data).length; }
};

// Remplacer les objets globaux pour les tests
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('SessionManager', () => {
  let sessionManager;

  beforeEach(() => {
    // Réinitialiser les mocks
    mockSessionStorage.data = {};
    mockLocalStorage.data = {};
    jest.clearAllMocks();
    
    sessionManager = new SessionManager();
  });

  describe('generateSessionId', () => {
    test('génère un UUID v4 valide', () => {
      const sessionId = sessionManager.generateSessionId();
      expect(isValidUUIDv4(sessionId)).toBe(true);
    });

    test('génère des IDs uniques', () => {
      const ids = generateUniqueUUIDs(100);
      expect(ids.length).toBe(100);
      expect(new Set(ids).size).toBe(100); // Tous uniques
    });
  });

  describe('isValidSessionId', () => {
    test('valide correctement les UUIDs v4', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const invalidUuid = 'invalid-uuid';
      
      expect(sessionManager.isValidSessionId(validUuid)).toBe(true);
      expect(sessionManager.isValidSessionId(invalidUuid)).toBe(false);
    });
  });

  describe('saveAuthData et getAuthData', () => {
    test('sauvegarde et récupère les données d\'authentification', () => {
      const token = 'test-token-123';
      const userData = { nom: 'Test', role: 'ETUDIANT' };
      
      sessionManager.saveAuthData(token, userData);
      const authData = sessionManager.getAuthData();
      
      expect(authData).toEqual({
        token: token,
        user: userData
      });
    });

    test('retourne null si aucune donnée d\'authentification', () => {
      const authData = sessionManager.getAuthData();
      expect(authData).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    test('efface toutes les données d\'authentification', () => {
      const token = 'test-token-123';
      const userData = { nom: 'Test', role: 'ETUDIANT' };
      
      sessionManager.saveAuthData(token, userData);
      expect(sessionManager.isAuthenticated()).toBe(true);
      
      sessionManager.clearAuthData();
      expect(sessionManager.isAuthenticated()).toBe(false);
      expect(sessionManager.getAuthData()).toBeNull();
    });
  });

  describe('migrateExistingData', () => {
    test('migre les données du localStorage vers le système de sessions', () => {
      // Simuler des données existantes dans localStorage
      mockLocalStorage.data['authToken'] = 'old-token';
      mockLocalStorage.data['userData'] = JSON.stringify({ nom: 'OldUser' });
      
      const migrated = sessionManager.migrateExistingData();
      
      expect(migrated).toBe(true);
      expect(sessionManager.isAuthenticated()).toBe(true);
      expect(mockLocalStorage.data['authToken']).toBeUndefined();
      expect(mockLocalStorage.data['userData']).toBeUndefined();
    });

    test('ne migre pas si déjà authentifié', () => {
      // Connecter d'abord
      sessionManager.saveAuthData('current-token', { nom: 'CurrentUser' });
      
      // Ajouter des données anciennes
      mockLocalStorage.data['authToken'] = 'old-token';
      mockLocalStorage.data['userData'] = JSON.stringify({ nom: 'OldUser' });
      
      const migrated = sessionManager.migrateExistingData();
      
      expect(migrated).toBe(false);
      expect(sessionManager.getAuthData().user.nom).toBe('CurrentUser');
    });
  });

  describe('getUserRole', () => {
    test('retourne le rôle de l\'utilisateur connecté', () => {
      const userData = { nom: 'Test', role: 'FORMATEUR' };
      sessionManager.saveAuthData('token', userData);
      
      expect(sessionManager.getUserRole()).toBe('FORMATEUR');
    });

    test('retourne null si non connecté', () => {
      expect(sessionManager.getUserRole()).toBeNull();
    });
  });

  describe('redirectToDashboard', () => {
    test('retourne la bonne URL selon le rôle', () => {
      expect(sessionManager.redirectToDashboard('DE')).toBe('/dashboard/de');
      expect(sessionManager.redirectToDashboard('FORMATEUR')).toBe('/dashboard/formateur');
      expect(sessionManager.redirectToDashboard('ETUDIANT')).toBe('/dashboard/etudiant');
      expect(sessionManager.redirectToDashboard('UNKNOWN')).toBe('/');
    });
  });
});

describe('SessionStorage', () => {
  let sessionStorage;
  const testSessionId = 'test-session-123';

  beforeEach(() => {
    mockLocalStorage.data = {};
    jest.clearAllMocks();
    sessionStorage = new SessionStorage(testSessionId);
  });

  test('préfixe correctement les clés', () => {
    sessionStorage.setItem('testKey', 'testValue');
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'session_test-session-123_testKey',
      'testValue'
    );
  });

  test('isole les données par session', () => {
    const session1 = new SessionStorage('session-1');
    const session2 = new SessionStorage('session-2');
    
    session1.setItem('key', 'value1');
    session2.setItem('key', 'value2');
    
    expect(session1.getItem('key')).toBe('value1');
    expect(session2.getItem('key')).toBe('value2');
  });

  test('efface seulement les données de la session', () => {
    const session1 = new SessionStorage('session-1');
    const session2 = new SessionStorage('session-2');
    
    session1.setItem('key', 'value1');
    session2.setItem('key', 'value2');
    
    session1.clear();
    
    expect(session1.getItem('key')).toBeNull();
    expect(session2.getItem('key')).toBe('value2');
  });
});