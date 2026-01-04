import React, { useState, useEffect } from 'react';
import { espacesPedagogiquesAPI } from '../../services/api';
import {
    X,
    Users,
    BookOpen,
    Calendar,
    User,
    Mail,
    Hash,
    TrendingUp,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Award,
    Info
} from 'lucide-react';
import './ConsulterEspace.css';

const ConsulterEspace = ({ espace, onClose }) => {
    const [statistiques, setStatistiques] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'etudiants', 'travaux'

    useEffect(() => {
        chargerStatistiques();
    }, [espace.id_espace]);

    const chargerStatistiques = async () => {
        try {
            setLoading(true);
            const response = await espacesPedagogiquesAPI.consulterStatistiques(espace.id_espace);
            setStatistiques(response.data);
        } catch (err) {
            console.error('Erreur lors du chargement des statistiques:', err);
            setError('Impossible de charger les statistiques de l\'espace');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content consulter-espace-modal">
                    <div className="modal-header">
                        <h2>Chargement des statistiques...</h2>
                        <button onClick={onClose} className="btn-close">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Chargement en cours...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-overlay">
                <div className="modal-content consulter-espace-modal">
                    <div className="modal-header">
                        <h2>Erreur</h2>
                        <button onClick={onClose} className="btn-close">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="error-container">
                        <AlertCircle size={48} color="#ef4444" />
                        <p>{error}</p>
                        <button onClick={chargerStatistiques} className="btn btn-primary">
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { espace: espaceData, statistiques: stats, etudiants, travaux } = statistiques;

    const renderGeneralTab = () => (
        <div className="tab-content">
            {/* Informations générales */}
            <div className="info-section">
                <h3><Info size={20} /> Informations générales</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <BookOpen size={16} />
                        <div>
                            <label>Matière</label>
                            <span>{espaceData.matiere.nom}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <Users size={16} />
                        <div>
                            <label>Promotion</label>
                            <span>{espaceData.promotion.libelle}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <Hash size={16} />
                        <div>
                            <label>Code d'accès</label>
                            <span className="code-acces">{espaceData.code_acces}</span>
                        </div>
                    </div>
                    <div className="info-item">
                        <Calendar size={16} />
                        <div>
                            <label>Date de création</label>
                            <span>{new Date(espaceData.date_creation).toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formateur assigné */}
            <div className="info-section">
                <h3><User size={20} /> Formateur assigné</h3>
                {espaceData.formateur ? (
                    <div className="formateur-info">
                        <div className="formateur-details">
                            <h4>{espaceData.formateur.prenom} {espaceData.formateur.nom}</h4>
                            <p><Mail size={14} /> {espaceData.formateur.email}</p>
                            <p><Hash size={14} /> {espaceData.formateur.numero_employe}</p>
                        </div>
                    </div>
                ) : (
                    <div className="no-formateur">
                        <AlertCircle size={16} color="#f59e0b" />
                        <span>Aucun formateur assigné</span>
                    </div>
                )}
            </div>

            {/* Statistiques rapides */}
            <div className="info-section">
                <h3><TrendingUp size={20} /> Statistiques</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Users size={24} color="#3b82f6" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{stats.nb_etudiants_inscrits}</span>
                            <span className="stat-label">Étudiants inscrits</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FileText size={24} color="#10b981" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{stats.nb_travaux}</span>
                            <span className="stat-label">Travaux créés</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <CheckCircle size={24} color="#8b5cf6" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{stats.assignations.rendues}</span>
                            <span className="stat-label">Travaux rendus</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <Award size={24} color="#f59e0b" />
                        </div>
                        <div className="stat-info">
                            <span className="stat-number">{stats.assignations.notees}</span>
                            <span className="stat-label">Travaux notés</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEtudiantsTab = () => (
        <div className="tab-content">
            <div className="section-header">
                <h3><Users size={20} /> Étudiants inscrits ({etudiants.length})</h3>
            </div>
            
            {etudiants.length > 0 ? (
                <div className="etudiants-list">
                    {etudiants.map((etudiant, index) => (
                        <div key={index} className="etudiant-card">
                            <div className="etudiant-info">
                                <h4>{etudiant.prenom} {etudiant.nom}</h4>
                                <p><Mail size={14} /> {etudiant.email}</p>
                                <p><Hash size={14} /> {etudiant.matricule}</p>
                            </div>
                            <div className="etudiant-meta">
                                <span className={`statut-badge ${etudiant.statut.toLowerCase()}`}>
                                    {etudiant.statut}
                                </span>
                                <small>
                                    Inscrit le {new Date(etudiant.date_inscription).toLocaleDateString('fr-FR')}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Users size={48} color="#9ca3af" />
                    <p>Aucun étudiant inscrit dans cet espace</p>
                </div>
            )}
        </div>
    );

    const renderTravauxTab = () => (
        <div className="tab-content">
            <div className="section-header">
                <h3><FileText size={20} /> Travaux ({travaux.length})</h3>
            </div>
            
            {travaux.length > 0 ? (
                <div className="travaux-list">
                    {travaux.map((travail, index) => (
                        <div key={index} className="travail-card">
                            <div className="travail-header">
                                <h4>{travail.titre}</h4>
                                <span className={`type-badge ${travail.type_travail.toLowerCase()}`}>
                                    {travail.type_travail}
                                </span>
                            </div>
                            
                            {travail.description && (
                                <p className="travail-description">{travail.description}</p>
                            )}
                            
                            <div className="travail-meta">
                                <div className="meta-item">
                                    <Calendar size={14} />
                                    <span>Créé le {new Date(travail.date_creation).toLocaleDateString('fr-FR')}</span>
                                </div>
                                {travail.date_echeance && (
                                    <div className="meta-item">
                                        <Clock size={14} />
                                        <span>Échéance: {new Date(travail.date_echeance).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                )}
                                {travail.note_max && (
                                    <div className="meta-item">
                                        <Award size={14} />
                                        <span>Note max: {travail.note_max}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="assignations-stats">
                                <div className="assignation-item">
                                    <span className="assignation-count">{travail.assignations.assignees}</span>
                                    <span className="assignation-label">Assignées</span>
                                </div>
                                <div className="assignation-item">
                                    <span className="assignation-count">{travail.assignations.en_cours}</span>
                                    <span className="assignation-label">En cours</span>
                                </div>
                                <div className="assignation-item">
                                    <span className="assignation-count">{travail.assignations.rendues}</span>
                                    <span className="assignation-label">Rendues</span>
                                </div>
                                <div className="assignation-item">
                                    <span className="assignation-count">{travail.assignations.notees}</span>
                                    <span className="assignation-label">Notées</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileText size={48} color="#9ca3af" />
                    <p>Aucun travail créé dans cet espace</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content consulter-espace-modal">
                <div className="modal-header">
                    <div className="modal-title">
                        <BookOpen size={24} />
                        <div>
                            <h2>Statistiques - {espaceData.matiere.nom}</h2>
                            <p>{espaceData.promotion.libelle} • {espaceData.promotion.filiere}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-close">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Info size={16} />
                        Général
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'etudiants' ? 'active' : ''}`}
                        onClick={() => setActiveTab('etudiants')}
                    >
                        <Users size={16} />
                        Étudiants ({etudiants.length})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'travaux' ? 'active' : ''}`}
                        onClick={() => setActiveTab('travaux')}
                    >
                        <FileText size={16} />
                        Travaux ({travaux.length})
                    </button>
                </div>

                <div className="modal-body">
                    {activeTab === 'general' && renderGeneralTab()}
                    {activeTab === 'etudiants' && renderEtudiantsTab()}
                    {activeTab === 'travaux' && renderTravauxTab()}
                </div>
            </div>
        </div>
    );
};

export default ConsulterEspace;