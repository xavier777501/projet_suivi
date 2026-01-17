import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://projet-suivi-1.onrender.com';
console.log('API Base URL used by Frontend:', API_BASE_URL);

import { getAuthToken } from '../utils/auth';

// Instance axios avec configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ne pas rediriger si c'est une tentative de connexion (erreur normale)
      if (!error.config.url.includes('/auth/login')) {
        // Token expiré ou invalide pour les autres requêtes
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('current_session_id'); // Force une nouvelle session

        // Nettoyer aussi le localStorage pour éviter une remigration de données invalides
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (email, mot_de_passe) =>
    api.post('/api/auth/login', { email, mot_de_passe }),

  changePassword: (token, nouveau_mot_de_passe, confirmation_mot_de_passe) =>
    api.post('/api/auth/changer-mot-de-passe', {
      token,
      nouveau_mot_de_passe,
      confirmation_mot_de_passe
    }),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getDashboard: () => api.get('/api/dashboard/'),
  getDEDashboard: () => api.get('/api/dashboard/de'),
  getFormateurDashboard: () => api.get('/api/dashboard/formateur'),
  getEtudiantDashboard: () => api.get('/api/dashboard/etudiant'),
  getClassement: () => api.get('/api/dashboard/etudiant/classement'),
};

// ==================== GESTION COMPTES ====================
export const gestionComptesAPI = {
  // Années académiques
  getAnneesAcademiques: () => api.get('/api/gestion-comptes/annees-academiques'),

  // Promotions
  getPromotions: () => api.get('/api/gestion-comptes/promotions'),
  createPromotion: (data) => api.post('/api/gestion-comptes/creer-promotion', data),

  // Filieres
  getFilieres: () => api.get('/api/gestion-comptes/filieres'),

  // Matières
  getMatieres: (idFiliere) => api.get('/api/gestion-comptes/matieres', { params: { id_filiere: idFiliere } }),

  // Formateurs
  getFormateurs: () => api.get('/api/gestion-comptes/formateurs'),

  // Étudiants
  getEtudiants: () => api.get('/api/gestion-comptes/etudiants'),

  // Création formateur
  createFormateur: (data) => api.post('/api/gestion-comptes/creer-formateur', data),

  // Création étudiant
  createEtudiant: (data) => api.post('/api/gestion-comptes/creer-etudiant', data),
};

// ==================== ESPACES PEDAGOGIQUES ====================
export const espacesPedagogiquesAPI = {
  // DE - Gestion espaces
  creerEspace: (data) => api.post('/api/espaces-pedagogiques/creer', data),
  listerEspaces: () => api.get('/api/espaces-pedagogiques/liste'),

  // DE - Gestion formateur et étudiants
  assignerFormateur: (idEspace, idFormateur) =>
    api.put(`/api/espaces-pedagogiques/${idEspace}/formateur`, { id_formateur: idFormateur }),
  ajouterEtudiants: (idEspace, etudiantsIds) =>
    api.post(`/api/espaces-pedagogiques/${idEspace}/etudiants`, { etudiants_ids: etudiantsIds }),
  listerEtudiantsCandidats: (idPromotion) =>
    api.get(`/api/espaces-pedagogiques/promotion/${idPromotion}/etudiants`),

  // Formateur - Mes espaces
  mesEspaces: () => api.get('/api/espaces-pedagogiques/mes-espaces'),
  listerEtudiantsEspace: (idEspace) => api.get(`/api/espaces-pedagogiques/espace/${idEspace}/etudiants`),

  // DE - Gestion avancée espace
  consulterStatistiques: (idEspace) => api.get(`/api/espaces-pedagogiques/${idEspace}/statistiques`),


  creerTravail: (data) => api.post('/api/espaces-pedagogiques/travaux/creer', data),

  // Étudiant - Mes cours
  mesCours: () => api.get('/api/espaces-pedagogiques/mes-cours'),
  mesTravaux: () => api.get('/api/espaces-pedagogiques/travaux/mes-travaux'),
};

// ==================== TRAVAUX ====================
export const travauxAPI = {
  creerTravail: (data) => api.post('/api/travaux/creer', data),
  mesTravaux: () => api.get('/api/travaux/mes-travaux'),
  evaluerTravail: (idLivraison, data) => api.post(`/api/travaux/evaluer/${idLivraison}`, data),
  telechargerLivraison: (idLivraison) => api.get(`/api/travaux/telecharger/${idLivraison}`, { responseType: 'blob' }),
  assignerTravail: (data) => api.post('/api/travaux/assigner', data),
  getTravailDetails: (idTravail) => api.get(`/api/travaux/${idTravail}`),
  listerLivraisonsTravail: (idTravail) => api.get(`/api/travaux/travail/${idTravail}/livraisons`),
  livrerTravail: (idAssignation, fichier, commentaire) => {
    const formData = new FormData();
    formData.append('fichier', fichier);
    if (commentaire) formData.append('commentaire', commentaire);

    return api.post(`/api/travaux/livrer/${idAssignation}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;