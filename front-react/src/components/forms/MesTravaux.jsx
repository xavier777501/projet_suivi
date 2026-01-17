import React, { useState, useEffect } from 'react';
import {
    FileText, Calendar, Clock, CheckCircle, AlertCircle,
    Upload, Eye, Download, User, BookOpen, ArrowLeft
} from 'lucide-react';
import { travauxAPI } from '../../services/api';
import LivrerTravail from './LivrerTravail';
import './MesTravaux.css';

const MesTravaux = ({ onBack }) => {
    const [assignations, setAssignations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAssignation, setSelectedAssignation] = useState(null);
    const [activeFilter, setActiveFilter] = useState('tous'); // 'tous', 'en_cours', 'rendus', 'notes'

    useEffect(() => {
        loadMesAssignations();
    }, []);

    const loadMesAssignations = async () => {
        try {
            setLoading(true);
            const response = await travauxAPI.mesTravaux();
            setAssignations(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement assignations:', err);
            setError('Impossible de charger vos travaux');
        } finally {
            setLoading(false);
        }
    };

    const handleLivrerSuccess = (message) => {
        loadMesAssignations(); // Recharger les données
        setSelectedAssignation(null);
    };

    const handleDownloadFile = (idLivraison) => {
        // SOLUTION ANTI-IDM v2: Téléchargement via iframe caché

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

            iframe.src = downloadUrl;

        } catch (err) {
            console.error('Erreur téléchargement:', err);
            setError('Erreur lors du téléchargement du fichier.');
        }
    };

    const getStatutBadge = (assignation) => {
        if (assignation.livraison?.date_livraison) {
            return <span className="badge badge-warning"><Clock size={14} /> Rendu</span>;
        } else if (assignation.statut === 'ASSIGNE') {
            return <span className="badge badge-info"><Clock size={14} /> Assigné</span>;
        } else if (new Date(assignation.date_echeance) < new Date()) {
            return <span className="badge badge-danger"><AlertCircle size={14} /> En retard</span>;
        } else {
            return <span className="badge badge-info"><Clock size={14} /> En cours</span>;
        }
    };

    const getStatutColor = (assignation) => {
        if (assignation.livraison?.date_livraison) return 'warning';
        if (new Date(assignation.date_echeance) < new Date()) return 'danger';
        return 'info';
    };

    const filteredAssignations = assignations.filter(assignation => {
        switch (activeFilter) {
            case 'en_cours':
                return assignation.statut === 'ASSIGNE' || assignation.statut === 'EN_COURS';
            case 'rendus':
                return assignation.statut === 'RENDU';
            case 'notes':
                return assignation.statut === 'NOTE';
            default:
                return true;
        }
    });

    const getFilterCount = (filter) => {
        return assignations.filter(assignation => {
            switch (filter) {
                case 'en_cours':
                    return assignation.statut === 'ASSIGNE' || assignation.statut === 'EN_COURS';
                case 'rendus':
                    return assignation.statut === 'RENDU';
                case 'notes':
                    return assignation.statut === 'NOTE';
                default:
                    return true;
            }
        }).length;
    };

    if (loading) {
        return (
            <div className="mes-travaux-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Chargement de vos travaux...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mes-travaux-container">
                <div className="error-state">
                    <AlertCircle size={48} />
                    <h3>Erreur</h3>
                    <p>{error}</p>
                    <button onClick={loadMesAssignations} className="btn btn-primary">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mes-travaux-container">
            <div className="mes-travaux-header">
                {onBack && (
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={20} />
                        Retour
                    </button>
                )}
                <div className="header-title">
                    <FileText size={24} />
                    <div>
                        <h1>Mes Travaux</h1>
                        <p>Consultez vos travaux et gérez vos rendus</p>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="travaux-filters">
                <button
                    className={`filter-btn ${activeFilter === 'tous' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('tous')}
                >
                    Tous ({getFilterCount('tous')})
                </button>
                <button
                    className={`filter-btn ${activeFilter === 'en_cours' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('en_cours')}
                >
                    En cours ({getFilterCount('en_cours')})
                </button>
                <button
                    className={`filter-btn ${activeFilter === 'rendus' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('rendus')}
                >
                    Rendus ({getFilterCount('rendus')})
                </button>

            </div>

            {/* Liste des travaux */}
            <div className="travaux-list">
                {filteredAssignations.length > 0 ? (
                    filteredAssignations.map((assignation) => (
                        <div key={assignation.id_assignation} className={`travail-card ${getStatutColor(assignation)}`}>
                            <div className="travail-header">
                                <div className="travail-title">
                                    <h3>{assignation.titre_travail}</h3>
                                    {getStatutBadge(assignation)}
                                </div>
                                <div className="travail-meta">
                                    <span className="matiere">
                                        <BookOpen size={16} />
                                        {assignation.nom_matiere}
                                    </span>
                                    <span className="type-travail">
                                        <FileText size={16} />
                                        {assignation.type_travail}
                                    </span>
                                </div>
                            </div>

                            <div className="travail-content">
                                <p className="travail-description">
                                    {assignation.description}
                                </p>

                                <div className="travail-dates">
                                    <div className="date-item">
                                        <Calendar size={16} />
                                        <span>
                                            <strong>Assigné le:</strong> {' '}
                                            {new Date(assignation.date_assignment).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="date-item">
                                        <Clock size={16} />
                                        <span>
                                            <strong>Date limite:</strong> {' '}
                                            {new Date(assignation.date_echeance).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                    {assignation.livraison?.date_livraison && (
                                        <div className="date-item">
                                            <CheckCircle size={16} />
                                            <span>
                                                <strong>Rendu le:</strong> {' '}
                                                {new Date(assignation.livraison.date_livraison).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    )}
                                </div>



                                {assignation.livraison?.commentaire && (
                                    <div className="commentaire-etudiant">
                                        <strong>Votre commentaire:</strong>
                                        <p>{assignation.livraison.commentaire}</p>
                                    </div>
                                )}
                            </div>

                            <div className="travail-actions">
                                {(assignation.statut === 'ASSIGNE' || assignation.statut === 'EN_COURS') && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setSelectedAssignation(assignation)}
                                    >
                                        <Upload size={16} />
                                        Rendre le travail
                                    </button>
                                )}

                                {assignation.livraison?.date_livraison && assignation.livraison?.chemin_fichier && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDownloadFile(assignation.livraison.id_livraison)}
                                    >
                                        <Download size={16} />
                                        Télécharger ma copie
                                    </button>
                                )}

                                <button className="btn btn-outline">
                                    <Eye size={16} />
                                    Voir détails
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <FileText size={64} opacity={0.3} />
                        <h3>Aucun travail trouvé</h3>
                        <p>
                            {activeFilter === 'tous'
                                ? "Vous n'avez pas encore de travaux assignés."
                                : `Aucun travail ${activeFilter.replace('_', ' ')} pour le moment.`
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de livraison */}
            {selectedAssignation && (
                <LivrerTravail
                    assignation={selectedAssignation}
                    onClose={() => setSelectedAssignation(null)}
                    onSuccess={handleLivrerSuccess}
                />
            )}
        </div>
    );
};

export default MesTravaux;