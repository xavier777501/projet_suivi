import { useState, useEffect } from 'react';
import { X, BookOpen, Users, GraduationCap, User } from 'lucide-react';
import { gestionComptesAPI, espacesPedagogiquesAPI } from '../../services/api';
import './CreateFormateur.css'; // Réutiliser les mêmes styles

const CreateEspacePedagogique = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    id_promotion: '',
    id_matiere: '',
    description: ''
  });

  const [filieres, setFilieres] = useState([]);
  const [activeFiliere, setActiveFiliere] = useState('');
  const [matieres, setMatieres] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      const [filieresRes, promotionsRes] = await Promise.all([
        gestionComptesAPI.getFilieres(),
        gestionComptesAPI.getPromotions()
      ]);

      setFilieres(filieresRes.data.filieres);
      setPromotions(promotionsRes.data.promotions);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Impossible de charger les données nécessaires');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si on change la promotion, on peut déduire la filière et charger les matières
    if (name === 'id_promotion') {
      const promo = promotions.find(p => p.id_promotion === value);
      if (promo && promo.id_filiere) {
        setActiveFiliere(promo.id_filiere);
        loadMatieres(promo.id_filiere);
      } else {
        setMatieres([]);
      }
    }
  };

  const loadMatieres = async (filiereId) => {
    try {
      const res = await gestionComptesAPI.getMatieres(filiereId);
      setMatieres(res.data.matieres);
    } catch (err) {
      console.error("Erreur chargement matières", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await espacesPedagogiquesAPI.creerEspace(formData);
      setSuccess('Espace pédagogique créé avec succès !');

      // Attendre 2 secondes puis fermer
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err) {
      console.error('Erreur création espace:', err);
      setError(
        err.response?.data?.detail ||
        'Erreur lors de la création de l\'espace pédagogique'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Créer un espace pédagogique</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="create-form">
            <div className="loading-select">Chargement des données...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Créer un espace pédagogique</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="id_promotion">
              <GraduationCap size={16} />
              Promotion (Filière)
            </label>
            <select
              id="id_promotion"
              name="id_promotion"
              value={formData.id_promotion}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner une promotion</option>
              {promotions.map((promotion) => (
                <option key={promotion.id_promotion} value={promotion.id_promotion}>
                  {promotion.libelle} ({promotion.filiere || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="id_matiere">
              <BookOpen size={16} />
              Matière
            </label>
            <select
              id="id_matiere"
              name="id_matiere"
              value={formData.id_matiere}
              onChange={handleChange}
              required
              disabled={!matieres.length}
            >
              <option value="">
                {matieres.length ? 'Sélectionner une matière' : 'Sélectionnez une promotion d\'abord'}
              </option>
              {matieres.map((matiere) => (
                <option key={matiere.id_matiere} value={matiere.id_matiere}>
                  {matiere.nom_matiere}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <BookOpen size={16} />
              Description (optionnel)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description du cours, objectifs, prérequis..."
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer l\'espace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEspacePedagogique;