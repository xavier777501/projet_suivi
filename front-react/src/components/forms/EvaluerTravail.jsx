import React, { useState, useEffect } from 'react';
import {
    FileText, Download, User, Calendar, Clock,
    Star, MessageSquare, X, Save, Eye
} from 'lucide-react';
import { travauxAPI } from '../../services/api';
import './EvaluerTravail.css';

const EvaluerTravail = ({ travail, onClose, onSuccess, initialAssignationId }) => {
    const [livraisons, setLivraisons] = useState([]);
    const [selectedLivraison, setSelectedLivraison] = useState(null);
    const [note, setNote] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadLivraisons();
    }, [travail.id_travail]);

    const loadLivraisons = async () => {
        try {
            setLoading(true);
            const response = await travauxAPI.listerLivraisonsTravail(travail.id_travail);
            const allLivraisons = response.data.assignations;
            setLivraisons(allLivraisons);

            // Si on a une assignation initiale, on la sélectionne
            if (initialAssignationId) {
                const initial = allLivraisons.find(a => a.id_assignation === initialAssignationId);
                if (initial) {
                    handleSelectLivraison(initial);
                }
            }
        } catch (err) {
            console.error('Erreur chargement livraisons:', err);
            setError('Erreur lors du chargement des livraisons');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLivraison = (assignation) => {
        setSelectedLivraison(assignation);
        if (assignation.livraison) {
            setNote(assignation.livraison.note_attribuee || '');
            setFeedback(assignation.livraison.feedback || '');
        } else {
            setNote('');
            setFeedback('');
        }
        setError('');
    };

    const handleEvaluer = async (e) => {
        e.preventDefault();

        if (!selectedLivraison?.livraison) {
            setError('Aucune livraison sélectionnée');
            return;
        }

        if (!note || isNaN(note) || note < 0 || note > travail.note_max) {
            setError(`La note doit être comprise entre 0 et ${travail.note_max}`);
            return;
        }

        setEvaluating(true);
        setError('');

        try {
            await travauxAPI.evaluerTravail(selectedLivraison.livraison.id_livraison, {
                note_attribuee: parseFloat(note),
                feedback: feedback
            });

            onSuccess('Évaluation enregistrée avec succès !');
            await loadLivraisons(); // Recharger pour voir les changements
            setSelectedLivraison(null);
            setNote('');
            setFeedback('');
        } catch (err) {
            console.error('Erreur évaluation:', err);
            setError(err.response?.data?.detail || 'Erreur lors de l\'évaluation');
        } finally {
            setEvaluating(false);
        }
    };

    const handleDownloadFile = (idLivraison) => {
        // SOLUTION ANTI-IDM v2: Téléchargement via iframe caché
        // Évite les problèmes de fermeture de fenêtre causés par IDM

        try {
            const token = sessionStorage.getItem('authToken');

            if (!token) {
                setError('Session expirée. Veuillez vous reconnecter.');
                return;
            }

            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const downloadUrl = `${baseUrl}/api/travaux/telecharger/${idLivraison}?token=${encodeURIComponent(token)}`;

            // Créer un iframe caché pour déclencher le téléchargement
            let iframe = document.getElementById('download-iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'download-iframe';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }

            // Déclencher le téléchargement via l'iframe
            iframe.src = downloadUrl;

        } catch (err) {
            console.error('Erreur téléchargement:', err);
            setError('Erreur lors du téléchargement du fichier.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'ASSIGNE': return 'var(--warning-color)';
            case 'RENDU': return 'var(--info-color)';
            case 'NOTE': return 'var(--success-color)';
            default: return 'var(--text-secondary)';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'ASSIGNE': return 'Assigné';
            case 'RENDU': return 'Rendu';
            case 'NOTE': return 'Noté';
            default: return statut;
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content evaluer-travail-modal">
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p>Chargement des livraisons...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content evaluer-travail-modal">
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h2>Évaluer les travaux</h2>
                        <p className="modal-subtitle">{travail.titre}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="evaluer-content">
                        {/* Liste des livraisons */}
                        <div className="livraisons-panel">
                            <h3>Livraisons ({livraisons.length})</h3>

                            {livraisons.length === 0 ? (
                                <div className="empty-state">
                                    <FileText size={48} opacity={0.3} />
                                    <p>Aucune livraison pour ce travail</p>
                                </div>
                            ) : (
                                <div className="livraisons-list">
                                    {livraisons.map((assignation) => (
                                        <div
                                            key={assignation.id_assignation}
                                            className={`livraison-item ${selectedLivraison?.id_assignation === assignation.id_assignation ? 'selected' : ''}`}
                                            onClick={() => handleSelectLivraison(assignation)}
                                        >
                                            <div className="livraison-header">
                                                <div className="etudiant-info">
                                                    <User size={16} />
                                                    <span className="etudiant-name">
                                                        {assignation.prenom_etudiant} {assignation.nom_etudiant}
                                                    </span>
                                                </div>
                                                <span
                                                    className="statut-badge"
                                                    style={{ color: getStatutColor(assignation.statut) }}
                                                >
                                                    {getStatutLabel(assignation.statut)}
                                                </span>
                                            </div>

                                            {assignation.livraison ? (
                                                <div className="livraison-details">
                                                    <div className="livraison-meta">
                                                        <span className="livraison-date">
                                                            <Calendar size={14} />
                                                            Livré le {formatDate(assignation.livraison.date_livraison)}
                                                        </span>
                                                        {assignation.livraison.note_attribuee && (
                                                            <span className="livraison-note">
                                                                <Star size={14} />
                                                                {assignation.livraison.note_attribuee}/{travail.note_max}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {assignation.livraison.commentaire && (
                                                        <p className="livraison-commentaire">
                                                            "{assignation.livraison.commentaire}"
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="no-livraison">
                                                    <Clock size={14} />
                                                    <span>Pas encore livré</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Panel d'évaluation */}
                        <div className="evaluation-panel">
                            {selectedLivraison ? (
                                selectedLivraison.livraison ? (
                                    <div className="evaluation-form-container">
                                        <div className="selected-livraison-info">
                                            <h4>
                                                Évaluation de {selectedLivraison.prenom_etudiant} {selectedLivraison.nom_etudiant}
                                            </h4>

                                            <div className="livraison-file-info">
                                                <FileText size={16} />
                                                <span>Fichier livré</span>
                                                <div
                                                    className="btn btn-secondary btn-sm"
                                                    style={{
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        marginLeft: '12px',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        backgroundColor: '#6b7280',
                                                        color: 'white',
                                                        fontSize: '0.85rem'
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDownloadFile(selectedLivraison.livraison.id_livraison);
                                                    }}
                                                >
                                                    <Download size={14} />
                                                    Récupérer le fichier
                                                </div>
                                            </div>

                                            {selectedLivraison.livraison.commentaire && (
                                                <div className="student-comment">
                                                    <h5>Commentaire de l'étudiant:</h5>
                                                    <p>"{selectedLivraison.livraison.commentaire}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {error && (
                                            <div className="alert alert-error">
                                                {error}
                                            </div>
                                        )}

                                        <form onSubmit={handleEvaluer} className="evaluation-form">
                                            <div className="form-group">
                                                <label htmlFor="note">Note * (sur {travail.note_max})</label>
                                                <input
                                                    type="number"
                                                    id="note"
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    min="0"
                                                    max={travail.note_max}
                                                    step="0.5"
                                                    className="form-input"
                                                    placeholder={`Note sur ${travail.note_max}`}
                                                    required
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="feedback">Commentaire d'évaluation</label>
                                                <textarea
                                                    id="feedback"
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Ajoutez vos commentaires et conseils pour l'étudiant..."
                                                    rows={4}
                                                    className="form-textarea"
                                                />
                                            </div>

                                            <div className="evaluation-actions">
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={evaluating}
                                                >
                                                    {evaluating ? (
                                                        <span className="loading-content">
                                                            <div className="spinner"></div>
                                                            Enregistrement...
                                                        </span>
                                                    ) : (
                                                        <span className="button-content">
                                                            <Save size={16} />
                                                            Enregistrer l'évaluation
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="no-livraison-selected">
                                        <Clock size={48} opacity={0.3} />
                                        <h4>Travail non livré</h4>
                                        <p>Cet étudiant n'a pas encore livré son travail.</p>
                                    </div>
                                )
                            ) : (
                                <div className="no-selection">
                                    <Eye size={48} opacity={0.3} />
                                    <h4>Sélectionnez une livraison</h4>
                                    <p>Choisissez une livraison dans la liste pour l'évaluer.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluerTravail;