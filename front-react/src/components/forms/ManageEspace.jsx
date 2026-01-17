import { useState, useEffect } from 'react';
import { X, User, Users, Plus } from 'lucide-react';
import { gestionComptesAPI, espacesPedagogiquesAPI } from '../../services/api';
import './CreateFormateur.css';

const ManageEspace = ({ espace, onClose, onSuccess }) => {
  const [formateurs, setFormateurs] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [etudiantsInscrits, setEtudiantsInscrits] = useState([]);
  const [filteredEtudiants, setFilteredEtudiants] = useState([]);
  const [selectedFormateur, setSelectedFormateur] = useState(espace.id_formateur || '');
  const [selectedEtudiants, setSelectedEtudiants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrer les étudiants selon le terme de recherche
    if (searchTerm.trim() === '') {
      setFilteredEtudiants(etudiants);
    } else {
      const filtered = etudiants.filter(etudiant => {
        const fullName = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower) ||
          etudiant.email.toLowerCase().includes(searchLower) ||
          (etudiant.matricule && etudiant.matricule.toLowerCase().includes(searchLower));
      });
      setFilteredEtudiants(filtered);
    }
  }, [etudiants, searchTerm]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [formateursRes, etudiantsRes] = await Promise.all([
        gestionComptesAPI.getFormateurs(),
        espacesPedagogiquesAPI.listerEtudiantsCandidats(espace.id_promotion)
      ]);

      setFormateurs(formateursRes.data.formateurs || []);
      setEtudiants(etudiantsRes.data.etudiants || []);

      // Récupérer aussi les étudiants déjà inscrits dans cet espace
      try {
        const statistiquesRes = await espacesPedagogiquesAPI.consulterStatistiques(espace.id_espace);
        setEtudiantsInscrits(statistiquesRes.data.etudiants || []);
      } catch (err) {
        console.log('Pas de statistiques disponibles pour cet espace');
        setEtudiantsInscrits([]);
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleEtudiant = (idEtudiant) => {
    setSelectedEtudiants(prev =>
      prev.includes(idEtudiant)
        ? prev.filter(id => id !== idEtudiant)
        : [...prev, idEtudiant]
    );
  };

  const handleAssignFormateur = async () => {
    // Validation : vérifier qu'un formateur est sélectionné
    if (!selectedFormateur) {
      setError('Veuillez sélectionner un formateur');
      return;
    }

    // Vérifier qu'on ne réassigne pas le même formateur
    if (selectedFormateur === espace.id_formateur) {
      setError('Ce formateur est déjà assigné à cet espace');
      return;
    }

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
                disabled={loading || !selectedFormateur || selectedFormateur === espace.id_formateur}
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

            {/* Champ de recherche */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Rechercher un étudiant (nom, prénom, email)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Affichage des étudiants déjà inscrits */}
            {etudiantsInscrits.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                  Étudiants déjà inscrits ({etudiantsInscrits.length})
                </h4>
                <div style={{
                  maxHeight: '100px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb'
                }}>
                  {etudiantsInscrits.map((etudiant) => (
                    <div key={etudiant.email} style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      padding: '0.25rem 0'
                    }}>
                      ✓ {etudiant.prenom} {etudiant.nom} - {etudiant.email}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des étudiants disponibles pour sélection */}
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              {filteredEtudiants.length > 0 ? (
                <>
                  {/* Bouton Tout sélectionner */}
                  <div style={{
                    padding: '0.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    marginBottom: '0.5rem',
                    borderRadius: '4px'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedEtudiants.length === filteredEtudiants.length && filteredEtudiants.length > 0}
                        onChange={() => {
                          if (selectedEtudiants.length === filteredEtudiants.length) {
                            setSelectedEtudiants([]);
                          } else {
                            setSelectedEtudiants(filteredEtudiants.map(e => e.id_etudiant));
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Tout sélectionner ({filteredEtudiants.length} étudiants)
                    </label>
                  </div>

                  {/* Liste des étudiants */}
                  {filteredEtudiants.map((etudiant) => {
                    const isSelected = selectedEtudiants.includes(etudiant.id_etudiant);
                    return (
                      <div
                        key={etudiant.id_etudiant}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.875rem 1rem',
                          borderBottom: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          borderRadius: '8px',
                          margin: '0.4rem 0',
                          transition: 'all 0.2s ease',
                          border: isSelected ? '1px solid var(--accent-color)' : '1px solid transparent',
                          boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                        }}
                        onClick={() => handleToggleEtudiant(etudiant.id_etudiant)}
                        className="student-selection-item"
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          border: `2px solid ${isSelected ? 'var(--accent-color)' : '#d1d5db'}`,
                          backgroundColor: isSelected ? 'var(--accent-color)' : 'transparent',
                          marginRight: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}>
                          {isSelected && <Plus size={16} color="white" />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: isSelected ? '600' : '500',
                            fontSize: '0.9375rem',
                            color: 'var(--text-primary)'
                          }}>
                            {etudiant.prenom} {etudiant.nom}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {etudiant.email}
                            {etudiant.matricule && ` • ${etudiant.matricule}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  padding: '2rem',
                  fontSize: '0.875rem'
                }}>
                  {searchTerm ?
                    `Aucun étudiant trouvé pour "${searchTerm}"` :
                    'Aucun étudiant disponible dans cette promotion'
                  }
                </div>
              )}
            </div>

            {/* Bouton pour ajouter les étudiants sélectionnés */}
            {selectedEtudiants.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddEtudiants}
                disabled={loading}
                style={{
                  marginTop: '1rem',
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                <Plus size={16} style={{ marginRight: '0.5rem' }} />
                {loading ? 'Ajout en cours...' : `Ajouter ${selectedEtudiants.length} étudiant(s) sélectionné(s)`}
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