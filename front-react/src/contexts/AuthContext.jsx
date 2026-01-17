/**
 * Contexte d'authentification avec support des sessions multiples
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { SessionManager } from '../utils/SessionManager.js';

// Actions pour le reducer
const AUTH_ACTIONS = {
  INITIALIZE: 'INITIALIZE',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// État initial
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  sessionId: null,
  isLoading: true,
  error: null,
  isInitialized: false
};

// Reducer pour gérer l'état d'authentification
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        token: action.payload.token,
        sessionId: action.payload.sessionId,
        isLoading: false,
        isInitialized: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        sessionId: action.payload.sessionId,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null
        // sessionId reste le même pour maintenir l'identité de l'onglet
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

// Création du contexte
const AuthContext = createContext(null);

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [sessionManager] = React.useState(() => new SessionManager());

  // Initialisation du contexte
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        // Migrer les données existantes si nécessaire
        sessionManager.migrateExistingData();

        // Nettoyer les sessions expirées
        sessionManager.cleanExpiredSessions();

        // Vérifier l'authentification actuelle
        const authData = sessionManager.getAuthData();
        const sessionId = sessionManager.getCurrentSessionId();

        if (authData) {
          dispatch({
            type: AUTH_ACTIONS.INITIALIZE,
            payload: {
              isAuthenticated: true,
              user: authData.user,
              token: authData.token,
              sessionId: sessionId
            }
          });
        } else {
          dispatch({
            type: AUTH_ACTIONS.INITIALIZE,
            payload: {
              isAuthenticated: false,
              user: null,
              token: null,
              sessionId: sessionId
            }
          });
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        dispatch({
          type: AUTH_ACTIONS.SET_ERROR,
          payload: 'Erreur lors de l\'initialisation'
        });
      }
    };

    initializeAuth();
  }, [sessionManager]);

  // Fonction de connexion
  const login = async (token, userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      // Sauvegarder les données dans le gestionnaire de sessions
      sessionManager.saveAuthData(token, userData);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: userData,
          token: token,
          sessionId: sessionManager.getCurrentSessionId()
        }
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Erreur lors de la connexion'
      });
      return false;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Effacer les données de session
      sessionManager.clearAuthData();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      return true;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Erreur lors de la déconnexion'
      });
      return false;
    }
  };

  // Fonction de mise à jour des données utilisateur
  const updateUser = (userData) => {
    try {
      // Mettre à jour dans le gestionnaire de sessions
      const currentAuth = sessionManager.getAuthData();
      if (currentAuth) {
        const updatedUser = { ...currentAuth.user, ...userData };
        sessionManager.saveAuthData(currentAuth.token, updatedUser);

        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: userData
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour utilisateur:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Erreur lors de la mise à jour'
      });
    }
  };

  // Fonction pour vérifier et rafraîchir l'authentification
  const refreshAuth = () => {
    const authData = sessionManager.getAuthData();
    const sessionId = sessionManager.getCurrentSessionId();

    if (authData && !state.isAuthenticated) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: authData.user,
          token: authData.token,
          sessionId: sessionId
        }
      });
    } else if (!authData && state.isAuthenticated) {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Fonction pour obtenir le rôle utilisateur
  const getUserRole = () => {
    return state.user?.role || null;
  };

  // Fonction pour vérifier les permissions
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Fonction pour obtenir l'URL de redirection selon le rôle
  const getDashboardUrl = () => {
    return sessionManager.redirectToDashboard(state.user?.role);
  };

  // Fonction pour nettoyer l'erreur
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Fonctions de debug et gestion avancée
  const getSessionInfo = () => {
    return {
      sessionId: state.sessionId,
      isAuthenticated: state.isAuthenticated,
      userRole: getUserRole(),
      allSessions: sessionManager.getAllSessionKeys(),
      sessionStats: sessionManager.getAllSessionsStats()
    };
  };

  const cleanExpiredSessions = () => {
    return sessionManager.cleanExpiredSessions();
  };

  const ensureStorageSpace = () => {
    return sessionManager.ensureStorageSpace();
  };

  // Valeur du contexte
  const contextValue = {
    // État
    ...state,
    
    // Actions principales
    login,
    logout,
    updateUser,
    refreshAuth,
    clearError,
    
    // Utilitaires
    getUserRole,
    hasRole,
    getDashboardUrl,
    
    // Gestion des sessions
    sessionManager,
    getSessionInfo,
    cleanExpiredSessions,
    ensureStorageSpace,
    
    // Constantes
    AUTH_ACTIONS
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;