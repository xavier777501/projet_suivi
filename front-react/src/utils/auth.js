// Utilitaires pour la gestion de l'authentification

export const saveAuthData = (token, userData) => {
  sessionStorage.setItem('authToken', token);
  sessionStorage.setItem('userData', JSON.stringify(userData));
};

export const getAuthData = () => {
  const token = sessionStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');
  
  if (token && userData) {
    return {
      token,
      user: JSON.parse(userData)
    };
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
  return !!sessionStorage.getItem('authToken');
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