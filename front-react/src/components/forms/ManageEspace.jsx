import { useState, useEffect } from 'react';
import { X, Settings, User, Users, Plus, Trash2 } from 'lucide-react';
import { gestionComptesAPI, espacesPedagogiquesAPI } from '../../services/api';
import './CreateFormateur.css';

const ManageEspace = ({ espace, onClose, onSuccess }) => {
  const [formateurs, setFormateurs] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsInscrits, setEtudiantsInscrits] = useState([]);
  const [selectedFormateur, setSelectedFormateur] = useState(espace.id_formateur || '');
  const [selectedEtudiants, setSelectedEtudiants] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [formateursRes, etudiantsRes] = await Promise.all([
        gestionComptesAPI.getFormateurs(),
        espacesPedagogiquesAPI.listerEtudiantsCandidats(espace.id_promotion)
      ]);

      setFormateurs(formateursRes.data.formateurs || []);
      setEtudiants(etudiantsRes.data.etudiants || []);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssignFormateur = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await espacesPedagogiquesAPI.assignerFormateur(espace.id_espace, selectedFormateur);
      setSuccess('Formateur assigné avec succès !');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Erreur assignation formateur:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'assignation du formateur');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEtudiants = async () => {
    if (selectedEtudiants.length === 0) {
      setError('Veuillez sélectionner au moins un étudiant');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await espacesPedagogiquesAPI.ajouterEtudiants(espace.id_espace, selectedEtudiants);
      setSuccess(`${selectedEtudiants.length} étudiant(s) ajouté(s) avec succès !`);
      setSelectedEtudiants([]);
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Erreur ajout étudiants:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'ajout des étudiants');
    } finally {
      setLoading(false);
    }
  };

  const toggleEtudiantSelection = (idEtudiant) => {
    setSelectedEtudiants(prev => 
      prev.includes(idEtudiant) 
        ? prev.filter(id => id !== idEtudiant)
        : [...prev, idEtudiant]
    );
  };

  if (loadingData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Gérer l'espace pédagogique</h2>
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
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>Gérer l'espace pédagogique</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="create-form">
          {/* Informations de l'espace */}
          <div className="form-group">
            <h3 style={{ marginBottom: '0.5rem', color: '#374151' }}>
              {espace.nom_matiere} - {espace.promotion}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Filière: {espace.filiere} | Code d'accès: <code>{espace.code_acces}</code>
            </p>
          </div>

          {/* Assignation formateur */}
          <div className="form-group">
            <label htmlFor="formateur">
              <User size={16} />
              Formateur assigné
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                id="formateur"
                value={selectedFormateur}
                onChange={(e) => setSelectedFormateur(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">Aucun formateur</option>
                {formateurs.map((formateur) => (
                  <option key={formateur.id_formateur} value={formateur.id_formateur}>
                    {formateur.prenom} {formateur.nom}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAssignFormateur}
                disabled={loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {loading ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>

          {/* Gestion des étudiants */}
          <div className="form-group">
            <label>
              <Users size={16} />
              Ajouter des étudiants ({selectedEtudiants.length} sélectionné(s))
            </label>
            
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto', 
              border: '1px solid #d1d5db', 
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              {etudiants.length > 0 ? (
                etudiants.map((etudiant) => (
                  <div 
                    key={etudiant.id_etudiant}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleEtudiantSelection(etudiant.id_etudiant)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEtudiants.includes(etudiant.id_etudiant)}
                      onChange={() => toggleEtudiantSelection(etudiant.id_etudiant)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500' }}>
                        {etudiant.prenom} {etudiant.nom}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {etudiant.email}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '1rem' }}>
                  Aucun étudiant disponible dans cette promotion
                </p>
              )}
            </div>

            {selectedEtudiants.length > 0 && (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleAddEtudiants}
                disabled={loading}
                style={{ marginTop: '0.5rem', width: '100%' }}
              >
                <Plus size={16} />
                {loading ? 'Ajout...' : `Ajouter ${selectedEtudiants.length} étudiant(s)`}
              </button>
            )}
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
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEspace;