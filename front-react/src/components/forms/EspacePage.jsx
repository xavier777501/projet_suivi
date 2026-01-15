import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BookOpen, Users, FileText, Plus, Calendar, Clock,
    CheckCircle, AlertTriangle, Eye, Edit, Trash2, UserPlus,
    BarChart3, TrendingUp, Award, Target
} from 'lucide-react';
import { espacesPedagogiquesAPI, travauxAPI } from '../../services/api';
import CreateTravail from './CreateTravail';
import AssignerTravail from './AssignerTravail';
import EvaluerTravail from './EvaluerTravail';
import CircularChart from '../common/CircularChart';
import './EspacePage.css';

const EspacePage = ({ espace, onBack }) => {
    console.log('EspacePage - espace reçu:', espace); // Debug
    
    const [activeTab, setActiveTab] = useState('general');
    const [statistiques, setStatistiques] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedTravail, setSelectedTravail] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        loadEspaceData();
    }, [espace.id_espace]);

    const loadEspaceData = async () => {
        try {
            setLoading(true);
            // Pour l'instant, utilisons les données de l'espace directement
            // Plus tard, on pourra implémenter l'API consulterStatistiques
            const mockStatistiques = {
                espace: espace,
                statistiques: {
                    nb_etudiants: espace.nombre_etudiants || 0,
                    nb_travaux: espace.nombre_travaux || 0,
                    assignations: {
                        total: 0,
                        rendues: 0,
                        notees: 0
                    },
                    activite: {
                        travaux_rendus_aujourd_hui: 0,
                        travaux_en_retard: 0
                    },
                    moyenne_generale: 'N/A'
                },
                etudiants: espace.etudiants || [],
                travaux: espace.travaux || []
            };
            
            setStatistiques(mockStatistiques);
            setError(null);
        } catch (err) {
            console.error('Erreur chargement espace:', err);
            setError('Impossible de charger les données de l\'espace');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = (message) => {
        setSuccessMessage(message);
        loadEspaceData();
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="espace-page-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Chargement de l'espace pédagogique...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="espace-page-container">
                <div className="error-state">
                    <AlertTriangle size={48} />
                    <h3>Erreur</h3>
                    <p>{error}</p>
                    <button onClick={loadEspaceData} className="btn btn-primary">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const { espace: espaceData, statistiques: stats, etudiants, travaux } = statistiques;

    const renderGeneralTab = () => (
        <div className="tab-content animate-fade-in">
            {/* En-tête de l'espace */}
            <div className="espace-header-card">
                <div className="espace-header-info">
                    <div className="espace-icon-large">
                        <BookOpen size={32} />
                    </div>
                    <div className="espace-details">
                        <h2>{espaceData.matiere}</h2>
                        <p className="espace-promotion">{espaceData.promotion}</p>
                        <p className="espace-description">{espaceData.description || 'Aucune description disponible'}</p>
                        <div className="espace-meta">
                            <span><Calendar size={16} /> Créé le {new Date(espaceData.date_creation).toLocaleDateString('fr-FR')}</span>
                            <span><Users size={16} /> Code d'accès: {espaceData.code_acces}</span>
                        </div>
                    </div>
                </div>
                <div className="espace-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setActiveModal('create-travail')}
                    >
                        <Plus size={16} />
                        Nouveau Travail
                    </button>
                    <button className="btn btn-outline">
                        <Edit size={16} />
                        Modifier
                    </button>
                </div>
            </div>

            {/* Statistiques principales */}
            <div className="stats-grid">
                <div className="stat-card">
                    <CircularChart
                        value={stats.nb_etudiants}
                        maxValue={50}
                        size={70}
                        strokeWidth={6}
                        color="#3b82f6"
                        showPercentage={true}
                    />
                    <div className="stat-info">
                        <span className="stat-number">{stats.nb_etudiants}</span>
                        <span className="stat-label">Étudiants inscrits</span>
                    </div>
                </div>

                <div className="stat-card">
                    <CircularChart
                        value={stats.nb_travaux}
                        maxValue={20}
                        size={70}
                        strokeWidth={6}
                        color="#10b981"
                        showPercentage={true}
                    />
                    <div className="stat-info">
                        <span className="stat-number">{stats.nb_travaux}</span>
                        <span className="stat-label">Travaux créés</span>
                    </div>
                </div>

                <div className="stat-card">
                    <CircularChart
                        value={stats.assignations.rendues}
                        maxValue={stats.assignations.total}
                        size={70}
                        strokeWidth={6}
                        color="#f59e0b"
                        showPercentage={true}
                    />
                    <div className="stat-info">
                        <span className="stat-number">{stats.assignations.rendues}</span>
                        <span className="stat-label">Travaux rendus</span>
                    </div>
                </div>

                <div className="stat-card">
                    <CircularChart
                        value={stats.assignations.notees}
                        maxValue={stats.assignations.total}
                        size={70}
                        strokeWidth={6}
                        color="#8b5cf6"
                        showPercentage={true}
                    />
                    <div className="stat-info">
                        <span className="stat-number">{stats.assignations.notees}</span>
                        <span className="stat-label">Travaux notés</span>
                    </div>
                </div>
            </div>

            {/* Activité récente */}
            <div className="activity-section">
                <div className="section-header">
                    <h3><TrendingUp size={20} /> Activité récente</h3>
                </div>
                <div className="activity-grid">
                    <div className="activity-card">
                        <div className="activity-icon success">
                            <CheckCircle size={20} />
                        </div>
                        <div className="activity-content">
                            <h4>Travaux rendus aujourd'hui</h4>
                            <p>{stats.activite?.travaux_rendus_aujourd_hui || 0} nouveaux rendus</p>
                        </div>
                    </div>
                    <div className="activity-card">
                        <div className="activity-icon warning">
                            <Clock size={20} />
                        </div>
                        <div className="activity-content">
                            <h4>Travaux en retard</h4>
                            <p>{stats.activite?.travaux_en_retard || 0} travaux non rendus</p>
                        </div>
                    </div>
                    <div className="activity-card">
                        <div className="activity-icon info">
                            <Award size={20} />
                        </div>
                        <div className="activity-content">
                            <h4>Moyenne générale</h4>
                            <p>{stats.moyenne_generale || 'N/A'}/20</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEtudiantsTab = () => (
        <div className="tab-content animate-fade-in">
            <div className="section-header">
                <h3><Users size={20} /> Étudiants ({etudiants.length})</h3>
                <button className="btn btn-secondary">
                    <UserPlus size={16} />
                    Ajouter des étudiants
                </button>
            </div>

            {etudiants.length > 0 ? (
                <div className="etudiants-grid">
                    {etudiants.map((etudiant, index) => (
                        <div key={index} className="etudiant-card">
                            <div className="etudiant-header">
                                <div className="etudiant-avatar">
                                    <Users size={24} />
                                </div>
                                <div className="etudiant-info">
                                    <h4>{etudiant.prenom} {etudiant.nom}</h4>
                                    <p>{etudiant.email}</p>
                                </div>
                            </div>
                            <div className="etudiant-stats">
                                <div className="stat-item">
                                    <span className="stat-value">{etudiant.travaux_rendus || 0}</span>
                                    <span className="stat-label">Rendus</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{etudiant.moyenne || 'N/A'}</span>
                                    <span className="stat-label">Moyenne</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{etudiant.presence || 'N/A'}%</span>
                                    <span className="stat-label">Présence</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <Users size={64} opacity={0.3} />
                    <h3>Aucun étudiant inscrit</h3>
                    <p>Aucun étudiant n'est encore inscrit à cet espace pédagogique.</p>
                </div>
            )}
        </div>
    );

    const renderTravauxTab = () => (
        <div className="tab-content animate-fade-in">
            <div className="section-header">
                <h3><FileText size={20} /> Travaux ({travaux.length})</h3>
                <button 
                    className="btn btn-primary"
                    onClick={() => setActiveModal('create-travail')}
                >
                    <Plus size={16} />
                    Nouveau Travail
                </button>
            </div>

            {travaux.length > 0 ? (
                <div className="travaux-grid">
                    {travaux.map((travail, index) => (
                        <div key={index} className="travail-card">
                            <div className="travail-header">
                                <h4>{travail.titre}</h4>
                                <div className="travail-status">
                                    {travail.statut === 'actif' && <span className="badge badge-success">Actif</span>}
                                    {travail.statut === 'termine' && <span className="badge badge-info">Terminé</span>}
                                    {travail.statut === 'brouillon' && <span className="badge badge-warning">Brouillon</span>}
                                </div>
                            </div>
                            <div className="travail-body">
                                <p>{travail.description}</p>
                                <div className="travail-meta">
                                    <span><Calendar size={14} /> Créé le {new Date(travail.date_creation).toLocaleDateString('fr-FR')}</span>
                                    <span><Clock size={14} /> Limite: {new Date(travail.date_limite).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="travail-progress">
                                    <div className="progress-info">
                                        <span>Progression: {travail.assignations_rendues || 0}/{travail.total_assignations || 0}</span>
                                        <span>{Math.round(((travail.assignations_rendues || 0) / (travail.total_assignations || 1)) * 100)}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ width: `${Math.round(((travail.assignations_rendues || 0) / (travail.total_assignations || 1)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="travail-actions">
                                <button className="btn btn-outline">
                                    <Eye size={14} />
                                    Détails
                                </button>
                                {travail.assignations_rendues > 0 && (
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setSelectedTravail(travail);
                                            setActiveModal('evaluer-travail');
                                        }}
                                    >
                                        <CheckCircle size={14} />
                                        Corriger
                                    </button>
                                )}
                                <button className="btn btn-secondary">
                                    <Edit size={14} />
                                    Modifier
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <FileText size={64} opacity={0.3} />
                    <h3>Aucun travail créé</h3>
                    <p>Vous n'avez pas encore créé de travaux pour cet espace.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setActiveModal('create-travail')}
                    >
                        <Plus size={16} />
                        Créer le premier travail
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="espace-page-container">
            {/* Header avec bouton retour */}
            <div className="espace-page-header">
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} />
                    Retour aux espaces
                </button>
                <div className="page-title">
                    <h1>{espaceData.matiere}</h1>
                    <p>{espaceData.promotion}</p>
                </div>
            </div>

            {/* Messages de succès */}
            {successMessage && (
                <div className="success-banner">
                    {successMessage}
                </div>
            )}

            {/* Navigation par onglets */}
            <div className="tabs-navigation">
                <button 
                    className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <BarChart3 size={16} />
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

            {/* Contenu des onglets */}
            <div className="tab-content-container">
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'etudiants' && renderEtudiantsTab()}
                {activeTab === 'travaux' && renderTravauxTab()}
            </div>

            {/* Modals */}
            {activeModal === 'create-travail' && (
                <CreateTravail 
                    spaces={[espace]}
                    initialSpaceId={espace.id_espace}
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {activeModal === 'evaluer-travail' && selectedTravail && (
                <EvaluerTravail 
                    travail={selectedTravail}
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedTravail(null);
                    }}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default EspacePage;