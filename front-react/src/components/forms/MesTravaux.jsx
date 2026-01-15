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
        console.log(message);
        loadMesAssignations(); // Recharger les données
        setSelectedAssignation(null);
    };

    const handleDownloadFile = async (idLivraison) => {
        try {
            const response = await travauxAPI.telechargerLivraison(idLivraison);

            // Axios renvoie le blob directement dans response.data quand responseType: 'blob'
            const blob = response.data;
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'fichier_livraison';

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) filename = filenameMatch[1];
            }

            // MÉTHODE 1 : File System Access API (Anti-IDM)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                }
            }

            // MÉTHODE 2 : Fallback via Blob URL (plus robuste qu'une Data URL)
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            link.setAttribute('idm', 'false');
            link.setAttribute('rel', 'noopener noreferrer');
            link.style.display = 'none';
            document.body.appendChild(link);

            setTimeout(() => {
                link.click();
                setTimeout(() => {
                    if (link.parentNode) document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 1000);
            }, 50);
        } catch (err) {
            console.error('Erreur téléchargement:', err);
            setError(err.response?.data?.detail || 'Erreur lors du téléchargement du fichier');
        }
    };

    const getStatutBadge = (assignation) => {
        if (assignation.livraison?.date_livraison) {
            return <span className="badge badge-warning"><Clock size={14} /> Rendu</span>;
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
                return !assignation.livraison?.date_livraison && new Date(assignation.date_echeance) >= new Date();
            case 'rendus':
                return assignation.livraison?.date_livraison && (assignation.livraison?.note_attribuee === null || assignation.livraison?.note_attribuee === undefined);
            case 'notes':
                return assignation.livraison?.note_attribuee !== null && assignation.livraison?.note_attribuee !== undefined;
            default:
                return true;
        }
    });

    const getFilterCount = (filter) => {
        return assignations.filter(assignation => {
            switch (filter) {
                case 'en_cours':
                    return !assignation.livraison?.date_livraison && new Date(assignation.date_echeance) >= new Date();
                case 'rendus':
                    return assignation.livraison?.date_livraison && (assignation.livraison?.note_attribuee === null || assignation.livraison?.note_attribuee === undefined);
                case 'notes':
                    return assignation.livraison?.note_attribuee !== null && assignation.livraison?.note_attribuee !== undefined;
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
                                {!assignation.livraison?.date_livraison && new Date(assignation.date_echeance) >= new Date() && (
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