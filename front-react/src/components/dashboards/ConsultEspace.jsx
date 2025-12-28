import { useState, useEffect } from 'react';
import { X, BookOpen, Users, TrendingUp, Calendar, FileText, User } from 'lucide-react';
import { espacesPedagogiquesAPI } from '../../services/api';
import './DEDashboard.css';

const ConsultEspace = ({ espace, onClose }) => {
  const [espaceDetails, setEspaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEspaceDetails();
  }, []);

  const loadEspaceDetails = async () => {
    try {
      setLoading(true);
      const response = await espacesPedagogiquesAPI.getEspaceDetails(espace.id_espace);
      setEspaceDetails(response.data);
    } catch (err) {
      console.error('Erreur chargement détails espace:', err);
      setError('Impossible de charger les détails de l\'espace');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '800px' }}>
          <div className="modal-header">
            <h2>Consultation de l'espace pédagogique</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="create-form">
            <div className="loading-select">Chargement des détails...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '800px' }}>
          <div className="modal-header">
            <h2>Consultation de l'espace pédagogique</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="create-form">
            <div className="alert alert-error">{error}</div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { info, statistiques } = espaceDetails;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Consultation de l'espace pédagogique</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="create-form">
          {/* Informations générales */}
          <div className="form-group">
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <BookOpen size={20} />
              {info.nom_matiere}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <strong>Promotion:</strong> {info.promotion}
              </div>
              <div>
                <strong>Filière:</strong> {info.filiere}
              </div>
              <div>
                <strong>Code d'accès:</strong> <code style={{ 
                  background: '#f3f4f6', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px',
                  fontFamily: 'monospace'
                }}>{info.code_acces}</code>
              </div>
              <div>
                <strong>Formateur:</strong> {info.formateur || 'Non assigné'}
              </div>
            </div>

            {info.description && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong>Description:</strong>
                <p style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: '#f9fafb', 
                  borderRadius: '6px',
                  color: '#374151'
                }}>
                  {info.description}
                </p>
              </div>
            )}

            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
              Créé le {new Date(info.date_creation).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Statistiques */}
          <div className="form-group">
            <h3 style={{ 
              marginBottom: '1rem', 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp size={20} />
              Statistiques
            </h3>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                background: '#dbeafe',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <Users size={24} />
                  {statistiques.nb_etudiants}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
                  Étudiants inscrits
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#dcfce7',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <FileText size={24} />
                  {statistiques.nb_travaux}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                  Travaux créés
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <TrendingUp size={24} />
                  {statistiques.moyenne_generale}/20
                </div>
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Moyenne générale
                </div>
              </div>

              <div style={{
                padding: '1rem',
                background: '#e0e7ff',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  color: '#3730a3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  📊
                  {statistiques.taux_completion}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#3730a3' }}>
                  Taux de complétion
                </div>
              </div>
            </div>

            {statistiques.nb_notes > 0 && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: '#f3f4f6', 
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#374151'
              }}>
                <strong>Informations supplémentaires:</strong> {statistiques.nb_notes} note(s) attribuée(s)
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultEspace;