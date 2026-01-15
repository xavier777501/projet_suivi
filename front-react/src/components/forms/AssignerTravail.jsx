import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, X, Send, AlertCircle } from 'lucide-react';
import { travauxAPI, espacesPedagogiquesAPI } from '../../services/api';
import './AssignerTravail.css';

const AssignerTravail = ({ travail, onClose, onSuccess }) => {
    const [etudiants, setEtudiants] = useState([]);
    const [selectedEtudiants, setSelectedEtudiants] = useState([]);
    const [dateEcheance, setDateEcheance] = useState('');
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('AssignerTravail - travail reçu:', travail);
        loadEtudiants();
        // Initialiser avec la date d'échéance du travail
        if (travail.date_echeance) {
            const date = new Date(travail.date_echeance);
            setDateEcheance(date.toISOString().slice(0, 16));
        }
    }, [travail]);

    const loadEtudiants = async () => {
        try {
            setLoading(true);
            const response = await espacesPedagogiquesAPI.listerEtudiantsEspace(travail.id_espace);
            setEtudiants(response.data.etudiants || []);
        } catch (err) {
            console.error('Erreur chargement étudiants:', err);
            setError('Impossible de charger la liste des étudiants');
        } finally {
            setLoading(false);
        }
    };

    const handleEtudiantToggle = (idEtudiant) => {
        setSelectedEtudiants(prev => {
            if (prev.includes(idEtudiant)) {
                return prev.filter(id => id !== idEtudiant);
            } else {
                // Pour un travail individuel, ne permettre qu'un seul étudiant
                if (travail.type_travail === 'INDIVIDUEL') {
                    return [idEtudiant];
                }
                return [...prev, idEtudiant];
            }
        });
    };

    const handleSelectAll = () => {
        if (travail.type_travail === 'INDIVIDUEL') {
            return; // Pas de sélection multiple pour les travaux individuels
        }
        
        if (selectedEtudiants.length === etudiants.length) {
            setSelectedEtudiants([]);
        } else {
            setSelectedEtudiants(etudiants.map(e => e.id_etudiant));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedEtudiants.length === 0) {
            setError('Veuillez sélectionner au moins un étudiant');
            return;
        }

        if (travail.type_travail === 'INDIVIDUEL' && selectedEtudiants.length > 1) {
            setError('Un travail individuel ne peut être assigné qu\'à un seul étudiant');
            return;
        }

        if (!dateEcheance) {
            setError('Veuillez définir une date d\'échéance');
            return;
        }

        // Vérifier que la date d'échéance est dans le futur
        if (new Date(dateEcheance) <= new Date()) {
            setError('La date d\'échéance doit être dans le futur');
            return;
        }

        setAssigning(true);
        setError('');

        try {
            const assignationData = {
                id_travail: travail.id_travail,
                etudiants_ids: selectedEtudiants,
                date_echeance: new Date(dateEcheance).toISOString()
            };

            await travauxAPI.assignerTravail(assignationData);
            onSuccess(`Travail assigné avec succès à ${selectedEtudiants.length} étudiant(s) !`);
            onClose();
        } catch (err) {
            console.error('Erreur assignation:', err);
            setError(err.response?.data?.detail || 'Erreur lors de l\'assignation');
        } finally {
            setAssigning(false);
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

    // Date minimale : maintenant
    const getMinDate = () => {
        const now = new Date();
        return now.toISOString().slice(0, 16);
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content assigner-travail-modal">
                    <div className="loading-state">
                        <div className="spinner-large"></div>
                        <p>Chargement des étudiants...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content assigner-travail-modal">
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h2>Assigner le travail</h2>
                        <p className="modal-subtitle">{travail.titre}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Informations du travail */}
                    <div className="travail-info-card">
                        <div className="info-row">
                            <div className="info-item">
                                <span className="info-label">Type:</span>
                                <span className={`type-badge ${travail.type_travail.toLowerCase()}`}>
                                    {travail.type_travail}
                                </span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Note max:</span>
                                <span>{travail.note_max}</span>
                            </div>
                        </div>
                        
                        <div className="description-section">
                            <h4>Description:</h4>
                            <p>{travail.description}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="assignation-form">
                        {/* Date d'échéance */}
                        <div className="form-group">
                            <label htmlFor="dateEcheance">Date et heure d'échéance *</label>
                            <input
                                type="datetime-local"
                                id="dateEcheance"
                                value={dateEcheance}
                                onChange={(e) => setDateEcheance(e.target.value)}
                                min={getMinDate()}
                                className="form-input"
                                required
                            />
                        </div>

                        {/* Sélection des étudiants */}
                        <div className="form-group">
                            <div className="etudiants-header">
                                <label>
                                    Étudiants à assigner * 
                                    {travail.type_travail === 'INDIVIDUEL' && (
                                        <span className="type-info">(Un seul étudiant pour un travail individuel)</span>
                                    )}
                                </label>
                                {travail.type_travail === 'COLLECTIF' && etudiants.length > 0 && (
                                    <button
                                        type="button"
                                        className="btn-select-all"
                                        onClick={handleSelectAll}
                                    >
                                        {selectedEtudiants.length === etudiants.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                                    </button>
                                )}
                            </div>
                            
                            {etudiants.length > 0 ? (
                                <div className="etudiants-list">
                                    {etudiants.map((etudiant) => (
                                        <div 
                                            key={etudiant.id_etudiant}
                                            className={`etudiant-item ${selectedEtudiants.includes(etudiant.id_etudiant) ? 'selected' : ''}`}
                                            onClick={() => handleEtudiantToggle(etudiant.id_etudiant)}
                                        >
                                            <div className="etudiant-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEtudiants.includes(etudiant.id_etudiant)}
                                                    onChange={() => handleEtudiantToggle(etudiant.id_etudiant)}
                                                />
                                            </div>
                                            <div className="etudiant-info">
                                                <span className="etudiant-name">
                                                    {etudiant.prenom} {etudiant.nom}
                                                </span>
                                                <span className="etudiant-email">
                                                    {etudiant.email}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Users size={48} opacity={0.3} />
                                    <p>Aucun étudiant inscrit dans cet espace</p>
                                </div>
                            )}
                        </div>

                        {/* Résumé de la sélection */}
                        {selectedEtudiants.length > 0 && (
                            <div className="selection-summary">
                                <h4>Résumé de l'assignation:</h4>
                                <div className="summary-items">
                                    <div className="summary-item">
                                        <Users size={16} />
                                        <span>{selectedEtudiants.length} étudiant(s) sélectionné(s)</span>
                                    </div>
                                    <div className="summary-item">
                                        <Calendar size={16} />
                                        <span>Échéance: {formatDate(dateEcheance)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Boutons d'action */}
                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={assigning}
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={assigning || selectedEtudiants.length === 0}
                            >
                                {assigning ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Assignation...
                                    </span>
                                ) : (
                                    <span className="button-content">
                                        <Send size={16} />
                                        Assigner le travail
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AssignerTravail;