// Utilitaires pour la gestion de l'authentification

export const getAuthToken = () => {
  // 1. Essayer le token simple (legacy/simple session)
  let token = sessionStorage.getItem('authToken');

  // 2. Si pas trouvé, essayer via le système de multi-session
  if (!token) {
    const sessionId = sessionStorage.getItem('current_session_id');
    if (sessionId) {
      token = localStorage.getItem(`session_${sessionId}_authToken`);
    }
  }

  return token;
};

export const saveAuthData = (token, userData) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('userData', JSON.stringify(userData));
};

export const getAuthData = () => {
  const token = getAuthToken();
  let userData = sessionStorage.getItem('userData');

  // Si pas de userData dans sessionStorage, chercher dans localStorage (multi-session)
  if (!userData) {
    const sessionId = sessionStorage.getItem('current_session_id');
    if (sessionId) {
      userData = localStorage.getItem(`session_${sessionId}_userData`);
    }
  }

  if (token && userData) {
    try {
      return {
        token,
        user: JSON.parse(userData)
      };
    } catch (e) {
      console.error('Erreur parse userData:', e);
      return null;
    }
  }

  return null;
};

export const clearAuthData = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
  // Nettoyer aussi l'état de navigation des dashboards
  sessionStorage.removeItem('de_activeTab');
  sessionStorage.removeItem('formateur_activeTab');
  sessionStorage.removeItem('etudiant_activeTab');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getUserRole = () => {
  const authData = getAuthData();
  return authData?.user?.role || null;
};

export const redirectToDashboard = (role) => {
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
};