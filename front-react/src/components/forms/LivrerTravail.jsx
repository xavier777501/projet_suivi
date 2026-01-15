import React, { useState } from 'react';
import { Upload, FileText, Calendar, Clock, X, Send } from 'lucide-react';
import { travauxAPI } from '../../services/api';
import './LivrerTravail.css';

const LivrerTravail = ({ assignation, onClose, onSuccess }) => {
    const [fichier, setFichier] = useState(null);
    const [commentaire, setCommentaire] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (file) => {
        if (file) {
            // Vérifier la taille du fichier (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Le fichier ne doit pas dépasser 10MB');
                return;
            }
            setFichier(file);
            setError('');
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!fichier) {
            setError('Veuillez sélectionner un fichier');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await travauxAPI.livrerTravail(assignation.id_assignation, fichier, commentaire);
            onSuccess('Travail livré avec succès !');
            onClose();
        } catch (err) {
            console.error('Erreur livraison:', err);
            setError(err.response?.data?.detail || 'Erreur lors de la livraison');
        } finally {
            setLoading(false);
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

    const isEcheanceDepassee = () => {
        return new Date() > new Date(assignation.date_echeance);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content livrer-travail-modal">
                <div className="modal-header">
                    <div className="modal-title-section">
                        <h2>Livrer le travail</h2>
                        <p className="modal-subtitle">{assignation.titre_travail}</p>
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
                                <FileText size={16} />
                                <span>Matière: {assignation.nom_matiere}</span>
                            </div>
                            <div className="info-item">
                                <Calendar size={16} />
                                <span>Échéance: {formatDate(assignation.date_echeance)}</span>
                            </div>
                        </div>
                        
                        {isEcheanceDepassee() && (
                            <div className="alert alert-warning">
                                <Clock size={16} />
                                <span>Attention: L'échéance est dépassée</span>
                            </div>
                        )}
                        
                        <div className="description-section">
                            <h4>Description du travail:</h4>
                            <p>{assignation.description}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="livraison-form">
                        {/* Zone de dépôt de fichier */}
                        <div className="form-group">
                            <label>Fichier à livrer *</label>
                            <div 
                                className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${fichier ? 'has-file' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                {fichier ? (
                                    <div className="file-selected">
                                        <FileText size={32} />
                                        <div className="file-info">
                                            <p className="file-name">{fichier.name}</p>
                                            <p className="file-size">
                                                {(fichier.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="remove-file-btn"
                                            onClick={() => setFichier(null)}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="file-drop-content">
                                        <Upload size={48} />
                                        <p>Glissez-déposez votre fichier ici</p>
                                        <p className="file-drop-subtitle">ou</p>
                                        <label className="file-select-btn">
                                            Choisir un fichier
                                            <input
                                                type="file"
                                                onChange={(e) => handleFileChange(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                        <p className="file-constraints">
                                            Taille maximale: 10MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Commentaire optionnel */}
                        <div className="form-group">
                            <label htmlFor="commentaire">Commentaire (optionnel)</label>
                            <textarea
                                id="commentaire"
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                placeholder="Ajoutez un commentaire sur votre travail..."
                                rows={4}
                                className="form-textarea"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="modal-actions">
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
                                disabled={loading || !fichier}
                            >
                                {loading ? (
                                    <span className="loading-content">
                                        <div className="spinner"></div>
                                        Envoi en cours...
                                    </span>
                                ) : (
                                    <span className="button-content">
                                        <Send size={16} />
                                        Livrer le travail
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

export default LivrerTravail;