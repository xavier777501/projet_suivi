/**
 * Index des utilitaires - facilite les imports
 */

// Authentification
export * from './auth.js';

// Gestion des sessions
export { SessionManager } from './SessionManager.js';
export { SessionStorage } from './SessionStorage.js';
export * from './sessionUtils.js';

// Hooks
export * from '../hooks/useTabPersistence.js';

// Contextes
export { AuthProvider, useAuth } from '../contexts/AuthContext.jsx';

// Composants de session
export { default as TabIsolationWrapper, useTabIsolation } from '../components/session/TabIsolationWrapper.jsx';
export { default as MultiTabDemo } from '../components/session/MultiTabDemo.jsx';
export { default as SessionDebug } from '../components/debug/SessionDebug.jsx';