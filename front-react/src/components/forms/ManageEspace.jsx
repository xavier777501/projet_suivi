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

  const handleToggleEtudiant = (id) => {
    setSelectedEtudiants(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrer les étudiants selon le terme de recherche et exclure ceux déjà inscrits
    const inscritsIds = new Set(etudiantsInscrits.map(e => e.id_etudiant));
    const disponibles = etudiants.filter(e => !inscritsIds.has(e.id_etudiant));
    
    if (searchTerm.trim() === '') {
      setFilteredEtudiants(disponibles);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = disponibles.filter(etudiant => {
        const fullName = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
        return fullName.includes(searchLower) || 
               etudiant.email.toLowerCase().includes(searchLower) ||
               (etudiant.matricule && etudiant.matricule.toLowerCase().includes(searchLower));
      });
      setFilteredEtudiants(filtered);
    }
  }, [etudiants, etudiantsInscrits, searchTerm]);

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

  const handleAssignFormateur = async () => {
    setError(null);
    setSuccess(null);

    // Validation : vérifier qu'un formateur est sélectionné
    if (!selectedFormateur) {
      setError('Veuillez sélectionner un formateur');
      return;
    }

    // Vérifier si un formateur est déjà assigné (restriction : "il refuse")
    if (espace.id_formateur && selectedFormateur && selectedFormateur !== espace.id_formateur) {
      setError('Action refusée : Un formateur est déjà assigné à cet espace. Désassignez-le d\'abord.');
      return;
    }

    // Vérifier qu'on ne réassigne pas le même formateur
    if (selectedFormateur === espace.id_formateur) {
      setError('Ce formateur est déjà assigné à cet espace');
      return;
    }

    setLoading(true);

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
      
      // Rafraîchir les données locales pour masquer les étudiants ajoutés
      const statistiquesRes = await espacesPedagogiquesAPI.consulterStatistiques(espace.id_espace);
      setEtudiantsInscrits(statistiquesRes.data.etudiants || []);
      setSelectedEtudiants([]);
      
      setTimeout(() => {
        setSuccess(null);
        onSuccess(); // Notifie le parent pour mettre à jour le compteur
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
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={16} />
                Ajouter des étudiants ({selectedEtudiants.length} sélectionné(s))
              </div>
              {selectedEtudiants.length > 0 && (
                <button 
                  onClick={() => setSelectedEtudiants([])}
                  style={{ 
                    fontSize: '0.75rem', 
                    color: '#ef4444', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Tout désélectionner
                </button>
              )}
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
              maxHeight: '280px', 
              overflowY: 'auto', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px',
              padding: '0.5rem',
              backgroundColor: '#ffffff'
            }}>
              {filteredEtudiants.length > 0 ? (
                <>
                  {/* Bouton Tout sélectionner */}
                  <div 
                    onClick={() => {
                      if (selectedEtudiants.length === filteredEtudiants.length) {
                        setSelectedEtudiants([]);
                      } else {
                        setSelectedEtudiants(filteredEtudiants.map(e => e.id_etudiant));
                      }
                    }}
                    style={{
                      padding: '0.75rem',
                      borderBottom: '2px solid #e5e7eb',
                      backgroundColor: '#f8fafc',
                      marginBottom: '0.5rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '2px solid',
                      borderColor: selectedEtudiants.length === filteredEtudiants.length && filteredEtudiants.length > 0 ? '#3b82f6' : '#d1d5db',
                      backgroundColor: selectedEtudiants.length === filteredEtudiants.length && filteredEtudiants.length > 0 ? '#3b82f6' : 'transparent',
                      marginRight: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}>
                      {selectedEtudiants.length === filteredEtudiants.length && filteredEtudiants.length > 0 && (
                        <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '1px' }} />
                      )}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                      Tout sélectionner ({filteredEtudiants.length} étudiants disponibles)
                    </span>
                  </div>
                  
                  {/* Liste des étudiants */}
                  {filteredEtudiants.map((etudiant) => (
                    <div 
                      key={etudiant.id_etudiant}
                      className={`student-selection-item ${selectedEtudiants.includes(etudiant.id_etudiant) ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem',
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: selectedEtudiants.includes(etudiant.id_etudiant) ? '#eff6ff' : 'transparent',
                        borderRadius: '8px',
                        margin: '0.25rem 0',
                        transition: 'all 0.2s ease',
                        border: selectedEtudiants.includes(etudiant.id_etudiant) ? '1px solid #3b82f6' : '1px solid transparent'
                      }}
                      onClick={() => handleToggleEtudiant(etudiant.id_etudiant)}
                      onMouseEnter={(e) => {
                        if (!selectedEtudiants.includes(etudiant.id_etudiant)) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedEtudiants.includes(etudiant.id_etudiant)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: '2px solid',
                        borderColor: selectedEtudiants.includes(etudiant.id_etudiant) ? '#3b82f6' : '#d1d5db',
                        backgroundColor: selectedEtudiants.includes(etudiant.id_etudiant) ? '#3b82f6' : 'transparent',
                        marginRight: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}>
                        {selectedEtudiants.includes(etudiant.id_etudiant) && (
                          <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '1px' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>
                          {etudiant.prenom} {etudiant.nom}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {etudiant.email}
                          {etudiant.matricule && ` • ${etudiant.matricule}`}
                        </div>
                      </div>
                    </div>
                  ))}
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