import React, { useState, useEffect } from 'react';
import { dashboardAPI, gestionComptesAPI, espacesPedagogiquesAPI } from '../../services/api';
import {
    Users,
    GraduationCap,
    BookOpen,
    Building,
    FileText,
    TrendingUp,
    AlertTriangle,
    Calendar,
    BarChart3,
    LogOut,
    RefreshCw,
    Settings,
    Plus,
    Layers,
    Eye
} from 'lucide-react';
import CreateEspacePedagogique from '../forms/CreateEspacePedagogique';
import CreateFormateur from '../forms/CreateFormateur';
import CreateEtudiant from '../forms/CreateEtudiant';
import CreatePromotion from '../forms/CreatePromotion';
import ManageEspace from '../forms/ManageEspace';

import CircularChart from '../common/CircularChart';
import './DEDashboard.css';

const DEDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'promotions' | 'espaces'
    const [dashboardData, setDashboardData] = useState(null);

    // Data States
    const [promotions, setPromotions] = useState([]);
    const [espaces, setEspaces] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedEspace, setSelectedEspace] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'dashboard') {
                const res = await dashboardAPI.getDEDashboard();
                setDashboardData(res.data);
            } else if (activeTab === 'promotions') {
                const res = await gestionComptesAPI.getPromotions();
                setPromotions(res.data.promotions);
            } else if (activeTab === 'espaces') {
                const res = await espacesPedagogiquesAPI.listerEspaces();
                setEspaces(res.data.espaces);
            }
        } catch (err) {
            console.error('Erreur chargement:', err);
            setError("Impossible de charger les données");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = () => {
        setActiveModal(null);
        setSelectedEspace(null);
        loadData(); // Recharger les données
    };

    if (loading) {
        return (
            <div className="de-dashboard loading">
                <div className="loading-spinner">
                    <RefreshCw className="animate-spin" size={32} />
                </div>
                <p>Chargement du tableau de bord...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="de-dashboard error">
                <div className="error-message">
                    <AlertTriangle size={48} />
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={loadData} className="btn btn-primary">
                        <RefreshCw size={16} />
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const renderDashboard = () => {
        if (!dashboardData) return null;

        const {
            statistiques_generales,
            repartition_filieres,
            activite_recente,
            espaces_sans_formateur,
            statistiques_travaux,
            promotions_actives
        } = dashboardData;

        return (
            <div className="dashboard-content animate-fade-in">
                {/* Statistiques principales avec diagrammes circulaires */}
                <section className="stats-grid-compact">
                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.etudiants_actifs}
                            maxValue={statistiques_generales.total_etudiants}
                            size={60}
                            strokeWidth={6}
                            color="#3b82f6"
                            showPercentage={false}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_etudiants}</div>
                            <div className="stat-label">Étudiants</div>
                            <div className="stat-detail">{statistiques_generales.etudiants_actifs} actifs</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_formateurs}
                            maxValue={Math.max(statistiques_generales.total_formateurs, 20)}
                            size={60}
                            strokeWidth={6}
                            color="#10b981"
                            showPercentage={false}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_formateurs}</div>
                            <div className="stat-label">Formateurs</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_espaces}
                            maxValue={Math.max(statistiques_generales.total_espaces, 10)}
                            size={60}
                            strokeWidth={6}
                            color="#8b5cf6"
                            showPercentage={false}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_espaces}</div>
                            <div className="stat-label">Espaces</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_travaux}
                            maxValue={Math.max(statistiques_generales.total_travaux, 50)}
                            size={60}
                            strokeWidth={6}
                            color="#f59e0b"
                            showPercentage={false}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_travaux}</div>
                            <div className="stat-label">Travaux</div>
                        </div>
                    </div>
                </section>

                {/* Contenu principal */}
                <div className="dashboard-main">
                    {/* Colonne gauche */}
                    <div className="dashboard-left">
                        {/* Répartition par filière */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <BarChart3 size={20} />
                                <h2>Répartition par filière</h2>
                            </div>
                            <div className="card-content">
                                {repartition_filieres.length > 0 ? (
                                    <div className="filiere-stats">
                                        {repartition_filieres.map((filiere, index) => (
                                            <div key={index} className="filiere-item">
                                                <div className="filiere-info">
                                                    <span className="filiere-name">{filiere.filiere}</span>
                                                    <span className="filiere-count">{filiere.nombre_etudiants} étudiants</span>
                                                </div>
                                                <div className="filiere-bar">
                                                    <div
                                                        className="filiere-progress"
                                                        style={{
                                                            width: `${(filiere.nombre_etudiants / Math.max(...repartition_filieres.map(f => f.nombre_etudiants))) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">Aucune donnée disponible</p>
                                )}
                            </div>
                        </div>

                        {/* Promotions actives */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <Calendar size={20} />
                                <h2>Promotions actives</h2>
                            </div>
                            <div className="card-content">
                                {promotions_actives.length > 0 ? (
                                    <div className="promotions-list">
                                        {promotions_actives.map((promotion, index) => (
                                            <div key={index} className="promotion-item">
                                                <div className="promotion-info">
                                                    <h4>{promotion.libelle}</h4>
                                                    <p>{promotion.filiere}</p>
                                                    <small>{promotion.annee_academique}</small>
                                                </div>
                                                <div className="promotion-count">
                                                    <span>{promotion.nombre_etudiants}</span>
                                                    <small>étudiants</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">Aucune promotion active</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="dashboard-right">
                        {/* Statistiques des travaux avec diagrammes circulaires */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <TrendingUp size={20} />
                                <h2>Statistiques des travaux</h2>
                            </div>
                            <div className="card-content">
                                <div className="travaux-stats-circular">
                                    <div className="travaux-item-circular">
                                        <CircularChart
                                            value={statistiques_travaux.en_cours}
                                            maxValue={statistiques_travaux.total}
                                            size={70}
                                            strokeWidth={6}
                                            color="#f59e0b"
                                            showPercentage={true}
                                        />
                                        <div className="travaux-info">
                                            <div className="travaux-number">{statistiques_travaux.en_cours}</div>
                                            <div className="travaux-label">En cours</div>
                                        </div>
                                    </div>

                                    <div className="travaux-item-circular">
                                        <CircularChart
                                            value={statistiques_travaux.rendus}
                                            maxValue={statistiques_travaux.total}
                                            size={70}
                                            strokeWidth={6}
                                            color="#10b981"
                                            showPercentage={true}
                                        />
                                        <div className="travaux-info">
                                            <div className="travaux-number">{statistiques_travaux.rendus}</div>
                                            <div className="travaux-label">Rendus</div>
                                        </div>
                                    </div>

                                    <div className="travaux-item-circular">
                                        <CircularChart
                                            value={statistiques_travaux.notes}
                                            maxValue={statistiques_travaux.total}
                                            size={70}
                                            strokeWidth={6}
                                            color="#8b5cf6"
                                            showPercentage={true}
                                        />
                                        <div className="travaux-info">
                                            <div className="travaux-number">{statistiques_travaux.notes}</div>
                                            <div className="travaux-label">Notés</div>
                                        </div>
                                    </div>

                                    <div className="travaux-item-circular total">
                                        <CircularChart
                                            value={statistiques_travaux.total}
                                            maxValue={statistiques_travaux.total}
                                            size={70}
                                            strokeWidth={6}
                                            color="#3b82f6"
                                            showPercentage={false}
                                        />
                                        <div className="travaux-info">
                                            <div className="travaux-number">{statistiques_travaux.total}</div>
                                            <div className="travaux-label">Total</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Activité récente */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <FileText size={20} />
                                <h2>Activité récente</h2>
                            </div>
                            <div className="card-content">
                                {activite_recente.length > 0 ? (
                                    <div className="activite-list">
                                        {activite_recente.map((activite, index) => (
                                            <div key={index} className="activite-item">
                                                <div className="activite-info">
                                                    <h4>{activite.titre}</h4>
                                                    <p>{activite.matiere} - {activite.promotion}</p>
                                                    <small>{new Date(activite.date_creation).toLocaleDateString('fr-FR')}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">Aucune activité récente</p>
                                )}
                            </div>
                        </div>

                        {/* Alertes */}
                        {espaces_sans_formateur.length > 0 && (
                            <div className="dashboard-card alert-card">
                                <div className="card-header">
                                    <AlertTriangle size={20} />
                                    <h2>Espaces sans formateur</h2>
                                </div>
                                <div className="card-content">
                                    <div className="alert-list">
                                        {espaces_sans_formateur.map((espace, index) => (
                                            <div key={index} className="alert-item">
                                                <AlertTriangle size={16} />
                                                <div>
                                                    <p><strong>{espace.matiere}</strong></p>
                                                    <small>{espace.promotion}</small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderEspaces = () => (
        <div className="dashboard-content animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1>Espaces Pédagogiques</h1>
                    <p>Gérez les cours et les assignations</p>
                </div>
                <button className="btn btn-green" onClick={() => setActiveModal('create_espace')}>
                    <BookOpen size={18} /> Créer un espace
                </button>
            </div>

            <div className="grid-cards">
                {espaces.map(espace => (
                    <div key={espace.id_espace} className="card-espace">
                        <div className="card-header-espace">
                            <h3>{espace.nom_matiere}</h3>
                            <span className="badge badge-purple">{espace.promotion}</span>
                        </div>
                        <div className="card-body-espace">
                            <p><strong>Filière:</strong> {espace.filiere}</p>
                            <p><strong>Formateur:</strong> {espace.formateur || <span style={{ color: 'red' }}>Non assigné</span>}</p>
                            <p><strong>Étudiants inscrits:</strong> {espace.nb_etudiants}</p>
                            <p><strong>Code d'accès:</strong> <code>{espace.code_acces}</code></p>
                        </div>
                        <div className="card-actions-espace">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    setSelectedEspace(espace);
                                    setActiveModal('manage_espace');
                                }}
                            >
                                <Settings size={14} />
                                Gérer
                            </button>

                        </div>

                    </div>
                ))}
                {espaces.length === 0 && <div className="text-center w-full">Aucun espace pédagogique créé.</div>}
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            {/* Header avec navigation */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <Building size={32} />
                        <div>
                            <h1>Tableau de bord Directeur</h1>
                            <p>Vue d'ensemble de l'établissement</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => setActiveModal('formateur')}>
                            <Plus size={16} />
                            Nouveau Formateur
                        </button>
                        <button className="btn btn-blue" onClick={() => setActiveModal('etudiant')}>
                            <Plus size={16} />
                            Nouvel Étudiant
                        </button>
                        <button className="btn btn-green" onClick={() => setActiveModal('promotion')}>
                            <Plus size={16} />
                            Nouvelle Promotion
                        </button>
                        <button onClick={loadData} className="btn btn-secondary">
                            <RefreshCw size={16} />
                            Actualiser
                        </button>
                        <button onClick={onLogout} className="btn btn-danger">
                            <LogOut size={16} />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation par onglets */}
            <nav className="dashboard-nav">
                <button
                    className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <BarChart3 size={18} />
                    Tableau de bord
                </button>
                <button
                    className={`nav-tab ${activeTab === 'promotions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('promotions')}
                >
                    <GraduationCap size={18} />
                    Promotions
                </button>
                <button
                    className={`nav-tab ${activeTab === 'espaces' ? 'active' : ''}`}
                    onClick={() => setActiveTab('espaces')}
                >
                    <BookOpen size={18} />
                    Espaces Pédagogiques
                </button>
            </nav>

            {/* Contenu des onglets */}
            {loading ? (
                <div className="loading-container">
                    <RefreshCw className="animate-spin" size={32} />
                    <p>Chargement...</p>
                </div>
            ) : (
                <>
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'promotions' && (
                        <div className="dashboard-content animate-fade-in">
                            <div className="dashboard-header">
                                <div>
                                    <h1>Gestion des Promotions</h1>
                                    <p>Gérez les promotions et les étudiants</p>
                                </div>
                            </div>
                            <div className="promotions-grid">
                                {promotions.map(promotion => (
                                    <div key={promotion.id_promotion} className="promotion-card">
                                        <h3>{promotion.libelle}</h3>
                                        <p>{promotion.filiere}</p>
                                        <small>{promotion.annee_academique}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'espaces' && renderEspaces()}
                </>
            )}

            {/* Modals */}
            {activeModal === 'create_espace' && (
                <CreateEspacePedagogique
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {activeModal === 'manage_espace' && selectedEspace && (
                <ManageEspace
                    espace={selectedEspace}
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}





            {activeModal === 'formateur' && (
                <CreateFormateur
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {activeModal === 'etudiant' && (
                <CreateEtudiant
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {activeModal === 'promotion' && (
                <CreatePromotion
                    onClose={() => setActiveModal(null)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default DEDashboard;
