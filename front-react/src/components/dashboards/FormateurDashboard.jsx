import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Users, ClipboardList, Plus, LogOut, User, Layout, 
    MessageSquare, Bell, Search, BarChart3, FileText, CheckCircle,
    Clock, AlertTriangle, TrendingUp, Calendar, Eye, Edit, Sun, Moon
} from 'lucide-react';
import { dashboardAPI, espacesPedagogiquesAPI, travauxAPI } from '../../services/api';
import CreateTravail from '../forms/CreateTravail';
import AssignerTravail from '../forms/AssignerTravail';
import EvaluerTravail from '../forms/EvaluerTravail';
import EspacePage from '../forms/EspacePage';
import CircularChart from '../common/CircularChart';
import QuickAccessFab from '../common/QuickAccessFab';
import { useTheme } from '../../contexts/ThemeContext';
import './FormateurDashboard.css';

const FormateurDashboard = ({ onLogout }) => {
    const { theme, toggleTheme } = useTheme();
    
    // Restaurer l'onglet actif depuis sessionStorage ou utiliser 'dashboard' par défaut
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('formateur_activeTab') || 'dashboard';
    });

    // Fonction pour changer d'onglet et persister l'état
    const changeActiveTab = (newTab) => {
        setActiveTab(newTab);
        sessionStorage.setItem('formateur_activeTab', newTab);
    };

    const [selectedEspace, setSelectedEspace] = useState(null);
    const [showEspacePage, setShowEspacePage] = useState(false);
    const [stats, setStats] = useState({
        mes_espaces: [],
        formateur: { nom: '', prenom: '', matiere: '' },
        statistiques_generales: {
            total_espaces: 0,
            total_etudiants: 0,
            total_travaux: 0,
            travaux_a_corriger: 0
        },
        travaux_recents: [],
        evaluations_en_attente: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [preselectedSpaceId, setPreselectedSpaceId] = useState(null);
    const [selectedTravail, setSelectedTravail] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showProfilePopup, setShowProfilePopup] = useState(false);

    // Référence pour le conteneur du profil
    const profileRef = React.useRef(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Effet pour fermer le popup quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfilePopup(false);
            }
        };

        if (showProfilePopup) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfilePopup]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await dashboardAPI.getFormateurDashboard();
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error("Erreur chargement dashboard:", err);
            setError("Impossible de charger les données du tableau de bord");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = (message) => {
        setSuccessMessage(message);
        loadData();
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'create-travail':
                setActiveModal('create-travail');
                break;
            case 'view-evaluations':
                changeActiveTab('evaluations');
                break;
            case 'view-espaces':
                changeActiveTab('espaces');
                break;
            default:
                console.log('Action non reconnue:', actionId);
        }
    };

    const handleOpenEspacePage = (espace) => {
        console.log('Ouverture de la page d\'espace:', espace);
        setSelectedEspace(espace);
        setShowEspacePage(true);
    };

    const handleCloseEspacePage = () => {
        setSelectedEspace(null);
        setShowEspacePage(false);
    };

    // Si on affiche la page d'espace, on retourne uniquement ce composant
    if (showEspacePage && selectedEspace) {
        return <EspacePage espace={selectedEspace} onBack={handleCloseEspacePage} />;
    }

    const filteredEspaces = stats.mes_espaces.filter(espace => 
        espace.matiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        espace.promotion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="formateur-dashboard loading">
                <div className="loading-spinner">
                    <Clock className="animate-spin" size={32} />
                </div>
                <p>Chargement du tableau de bord...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="formateur-dashboard error">
                <div className="error-message">
                    <AlertTriangle size={48} />
                    <h2>Erreur</h2>
                    <p>{error}</p>
                    <button onClick={loadData} className="btn btn-primary">
                        <Clock size={16} />
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const renderDashboard = () => {
        const {
            statistiques_generales = {
                total_espaces: stats.mes_espaces.length,
                total_etudiants: stats.mes_espaces.reduce((acc, esp) => acc + (esp.nombre_etudiants || 0), 0),
                total_travaux: stats.mes_espaces.reduce((acc, esp) => acc + (esp.nombre_travaux || 0), 0),
                travaux_a_corriger: 0
            },
            travaux_recents = [],
            evaluations_en_attente = []
        } = stats;

        return (
            <div className="dashboard-content animate-fade-in">
                {/* Statistiques principales avec diagrammes circulaires */}
                <section className="stats-grid-compact">
                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_espaces}
                            maxValue={20}
                            size={60}
                            strokeWidth={6}
                            color="#8b5cf6"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_espaces}</div>
                            <div className="stat-label">Mes Espaces</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_etudiants}
                            maxValue={200}
                            size={60}
                            strokeWidth={6}
                            color="#3b82f6"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_etudiants}</div>
                            <div className="stat-label">Étudiants</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_travaux}
                            maxValue={100}
                            size={60}
                            strokeWidth={6}
                            color="#10b981"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_travaux}</div>
                            <div className="stat-label">Travaux</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.travaux_a_corriger}
                            maxValue={50}
                            size={60}
                            strokeWidth={6}
                            color="#f59e0b"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.travaux_a_corriger}</div>
                            <div className="stat-label">À corriger</div>
                        </div>
                    </div>
                </section>

                {/* Contenu principal */}
                <div className="dashboard-main">
                    {/* Colonne gauche */}
                    <div className="dashboard-left">
                        {/* Mes espaces récents */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <BookOpen size={20} />
                                <h2>Mes Espaces Pédagogiques</h2>
                            </div>
                            <div className="card-content">
                                {stats.mes_espaces.length > 0 ? (
                                    <div className="espaces-list">
                                        {stats.mes_espaces.slice(0, 4).map((espace, index) => (
                                            <div key={index} className="espace-item" onClick={() => handleOpenEspacePage(espace)}>
                                                <div className="espace-info">
                                                    <h4>{espace.matiere}</h4>
                                                    <p>{espace.promotion}</p>
                                                </div>
                                                <div className="espace-stats">
                                                    <span>{espace.nombre_etudiants} étudiants</span>
                                                    <span>{espace.nombre_travaux} travaux</span>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.mes_espaces.length > 4 && (
                                            <button 
                                                className="voir-plus-btn"
                                                onClick={() => changeActiveTab('espaces')}
                                            >
                                                Voir tous mes espaces ({stats.mes_espaces.length})
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="no-data">Aucun espace assigné</p>
                                )}
                            </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <Plus size={20} />
                                <h2>Actions rapides</h2>
                            </div>
                            <div className="card-content">
                                <div className="quick-actions-grid">
                                    <button 
                                        className="quick-action-btn"
                                        onClick={() => setActiveModal('create-travail')}
                                    >
                                        <FileText size={24} />
                                        <span>Créer un travail</span>
                                    </button>
                                    <button 
                                        className="quick-action-btn"
                                        onClick={() => changeActiveTab('evaluations')}
                                    >
                                        <CheckCircle size={24} />
                                        <span>Évaluer travaux</span>
                                    </button>
                                    <button 
                                        className="quick-action-btn"
                                        onClick={() => changeActiveTab('espaces')}
                                    >
                                        <Eye size={24} />
                                        <span>Consulter espaces</span>
                                    </button>
                                    <button 
                                        className="quick-action-btn"
                                        onClick={() => changeActiveTab('etudiants')}
                                    >
                                        <Users size={24} />
                                        <span>Voir étudiants</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colonne droite */}
                    <div className="dashboard-right">
                        {/* Travaux récents */}
                        <div className="dashboard-card">
                            <div className="card-header">
                                <Clock size={20} />
                                <h2>Travaux récents</h2>
                            </div>
                            <div className="card-content">
                                {travaux_recents.length > 0 ? (
                                    <div className="travaux-list">
                                        {travaux_recents.map((travail, index) => (
                                            <div key={index} className="travail-item">
                                                <div className="travail-info">
                                                    <h4>{travail.titre}</h4>
                                                    <p>{travail.matiere} - {travail.promotion}</p>
                                                    <small>{new Date(travail.date_creation).toLocaleDateString('fr-FR')}</small>
                                                </div>
                                                <div className="travail-status">
                                                    <span className="badge badge-info">{travail.statut}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">Aucun travail récent</p>
                                )}
                            </div>
                        </div>

                        {/* Évaluations en attente */}
                        {evaluations_en_attente.length > 0 && (
                            <div className="dashboard-card alert-card">
                                <div className="card-header">
                                    <AlertTriangle size={20} />
                                    <h2>Évaluations en attente</h2>
                                </div>
                                <div className="card-content">
                                    <div className="alert-list">
                                        {evaluations_en_attente.map((evaluation, index) => (
                                            <div key={index} className="alert-item">
                                                <AlertTriangle size={16} />
                                                <div>
                                                    <p><strong>{evaluation.titre}</strong></p>
                                                    <small>{evaluation.nombre_copies} copies à corriger</small>
                                                </div>
                                                <button 
                                                    className="btn-small btn-warning"
                                                    onClick={() => {
                                                        setSelectedTravail(evaluation);
                                                        setActiveModal('evaluer-travail');
                                                    }}
                                                >
                                                    Corriger
                                                </button>
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
        <div className="formateur-espaces-view animate-fade-in">
            <div className="formateur-espaces-grid">
                {filteredEspaces.length > 0 ? (
                    filteredEspaces.map((espace) => (
                        <div 
                            key={espace.id_espace} 
                            className="formateur-espace-card clickable"
                            onClick={() => handleOpenEspacePage(espace)}
                        >
                            <div className="formateur-espace-card-header">
                                <div className="formateur-espace-icon">
                                    <BookOpen size={24} />
                                </div>
                                <span className="formateur-promotion-tag">{espace.promotion}</span>
                            </div>
                            
                            <h3>{espace.matiere}</h3>
                            
                            <div className="formateur-espace-stats">
                                <div className="formateur-espace-stat">
                                    <Users size={16} />
                                    <span>{espace.nombre_etudiants} étudiants</span>
                                </div>
                                <div className="formateur-espace-stat">
                                    <ClipboardList size={16} />
                                    <span>{espace.nombre_travaux} travaux</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="formateur-empty-state">
                        <BookOpen size={48} opacity={0.5} />
                        <p>
                            {searchTerm 
                                ? "Aucun espace ne correspond à votre recherche." 
                                : "Vous n'avez pas encore d'espaces pédagogiques assignés."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTravaux = () => (
        <div className="dashboard-content animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1>Mes Travaux</h1>
                    <p>Gérez tous vos travaux créés</p>
                </div>
                <button className="btn btn-primary" onClick={() => setActiveModal('create-travail')}>
                    <Plus size={18} /> Nouveau Travail
                </button>
            </div>
            
            <div className="travaux-grid">
                {stats.mes_espaces.map(espace => 
                    espace.travaux && espace.travaux.map((travail, index) => (
                        <div key={`${espace.id_espace}-${index}`} className="travail-card">
                            <div className="travail-header">
                                <h3>{travail.titre}</h3>
                                <span className="badge badge-blue">{espace.matiere}</span>
                            </div>
                            <div className="travail-body">
                                <p>{travail.description}</p>
                                <div className="travail-meta">
                                    <span><Calendar size={14} /> {new Date(travail.date_limite).toLocaleDateString('fr-FR')}</span>
                                    <span><Users size={14} /> {travail.assignations || 0} assignations</span>
                                </div>
                            </div>
                            <div className="travail-actions">
                                <button className="btn btn-outline">
                                    <Eye size={16} /> Voir détails
                                </button>
                                <button className="btn btn-secondary">
                                    <Edit size={16} /> Modifier
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderEvaluations = () => (
        <div className="dashboard-content animate-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1>Évaluations</h1>
                    <p>Corrigez les travaux rendus par vos étudiants</p>
                </div>
            </div>
            
            <div className="evaluations-list">
                {stats.evaluations_en_attente && stats.evaluations_en_attente.length > 0 ? (
                    stats.evaluations_en_attente.map((evaluation, index) => (
                        <div key={index} className="evaluation-card">
                            <div className="evaluation-header">
                                <h3>{evaluation.titre}</h3>
                                <span className="badge badge-warning">{evaluation.nombre_copies} à corriger</span>
                            </div>
                            <div className="evaluation-body">
                                <p>{evaluation.matiere} - {evaluation.promotion}</p>
                                <div className="evaluation-meta">
                                    <span><Calendar size={14} /> Limite: {new Date(evaluation.date_limite).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>
                            <div className="evaluation-actions">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSelectedTravail(evaluation);
                                        setActiveModal('evaluer-travail');
                                    }}
                                >
                                    <CheckCircle size={16} /> Commencer la correction
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <CheckCircle size={64} opacity={0.3} />
                        <h3>Aucune évaluation en attente</h3>
                        <p>Tous vos travaux sont à jour !</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderEtudiants = () => {
        const allEtudiants = stats.mes_espaces.flatMap(espace => 
            (espace.etudiants || []).map(etudiant => ({
                ...etudiant,
                espace: espace.matiere,
                promotion: espace.promotion
            }))
        );

        return (
            <div className="dashboard-content animate-fade-in">
                <div className="dashboard-header">
                    <div>
                        <h1>Mes Étudiants</h1>
                        <p>Vue d'ensemble de tous vos étudiants</p>
                    </div>
                </div>
                
                {allEtudiants.length > 0 ? (
                    <div className="etudiants-grid">
                        {allEtudiants.map((etudiant, index) => (
                            <div key={index} className="etudiant-card">
                                <div className="etudiant-header">
                                    <div className="etudiant-avatar">
                                        <User size={24} />
                                    </div>
                                    <div className="etudiant-info">
                                        <h3>{etudiant.prenom} {etudiant.nom}</h3>
                                        <p>{etudiant.email}</p>
                                    </div>
                                </div>
                                <div className="etudiant-body">
                                    <div className="etudiant-meta">
                                        <span><BookOpen size={14} /> {etudiant.espace}</span>
                                        <span><Users size={14} /> {etudiant.promotion}</span>
                                    </div>
                                    <div className="etudiant-stats">
                                        <div className="stat-item">
                                            <span className="stat-value">{etudiant.travaux_rendus || 0}</span>
                                            <span className="stat-label">Travaux rendus</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{etudiant.moyenne || '-'}</span>
                                            <span className="stat-label">Moyenne</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <Users size={64} opacity={0.3} />
                        <h3>Aucun étudiant</h3>
                        <p>Vous n'avez pas encore d'étudiants assignés à vos espaces.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="formateur-dashboard-container">
            {/* Sidebar */}
            <aside className="formateur-sidebar">
                <div className="formateur-sidebar-header">
                    <div className="formateur-logo-container">
                        <div className="formateur-logo-icon">F</div>
                        <span>Formateur Hub</span>
                    </div>
                </div>

                <nav className="formateur-sidebar-nav">
                    <button 
                        className={`formateur-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => {
                            changeActiveTab('dashboard');
                            setSelectedEspace(null);
                        }}
                    >
                        <BarChart3 size={20} />
                        <span>Tableau de bord</span>
                    </button>
                    <button 
                        className={`formateur-nav-item ${activeTab === 'espaces' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('espaces')}
                    >
                        <BookOpen size={20} />
                        <span>Mes Espaces</span>
                    </button>
                    <button 
                        className={`formateur-nav-item ${activeTab === 'travaux' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('travaux')}
                    >
                        <FileText size={20} />
                        <span>Mes Travaux</span>
                    </button>
                    <button 
                        className={`formateur-nav-item ${activeTab === 'evaluations' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('evaluations')}
                    >
                        <CheckCircle size={20} />
                        <span>Évaluations</span>
                    </button>
                    <button 
                        className={`formateur-nav-item ${activeTab === 'etudiants' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('etudiants')}
                    >
                        <Users size={20} />
                        <span>Mes Étudiants</span>
                    </button>
                </nav>

                <div className="formateur-sidebar-footer">
                    <button onClick={onLogout} className="formateur-logout-button">
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="formateur-main-content">
                <header className="formateur-main-header">
                    <div className="formateur-search-bar">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un espace..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="formateur-header-actions">
                        <button className="formateur-icon-button">
                            <Bell size={20} />
                            <span className="formateur-badge">3</span>
                        </button>
                        
                        {/* Profil avec popup */}
                        <div className="profile-container" ref={profileRef}>
                            <button
                                onClick={() => setShowProfilePopup(!showProfilePopup)}
                                className="profile-avatar"
                                title="Profil"
                            >
                                👤
                            </button>

                            {/* Popup du profil */}
                            {showProfilePopup && (
                                <div className="profile-popup">
                                    <div className="profile-popup-header">
                                        <div className="profile-avatar-large">
                                            👤
                                        </div>
                                        <div className="profile-info">
                                            <div className="profile-name">
                                                {stats.formateur.prenom} {stats.formateur.nom}
                                            </div>
                                            <div className="profile-role">
                                                Formateur {stats.formateur.matiere && `• ${stats.formateur.matiere}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="profile-popup-content">
                                        <button className="profile-menu-item">
                                            <Bell size={18} />
                                            <span>Notifications</span>
                                        </button>

                                        <button className="profile-menu-item" onClick={toggleTheme}>
                                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                                            <span>{theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}</span>
                                        </button>

                                        <div className="profile-menu-divider"></div>

                                        <button className="profile-menu-item logout" onClick={onLogout}>
                                            <LogOut size={18} />
                                            <span>Déconnexion</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="formateur-dashboard-content">
                    {successMessage && (
                        <div className="formateur-success-banner">
                            {successMessage}
                        </div>
                    )}

                    <div className="formateur-content-header">
                        <div>
                            <h1>
                                {activeTab === 'dashboard' && "Tableau de bord"}
                                {activeTab === 'espaces' && "Mes Espaces Pédagogiques"}
                                {activeTab === 'travaux' && "Mes Travaux"}
                                {activeTab === 'evaluations' && "Évaluations"}
                                {activeTab === 'etudiants' && "Mes Étudiants"}
                            </h1>
                            <p className="formateur-subtitle">
                                {activeTab === 'dashboard' && "Vue d'ensemble de vos activités pédagogiques"}
                                {activeTab === 'espaces' && "Gérez vos espaces et créez des travaux pour vos étudiants"}
                                {activeTab === 'travaux' && "Consultez et gérez tous vos travaux créés"}
                                {activeTab === 'evaluations' && "Corrigez les travaux rendus par vos étudiants"}
                                {activeTab === 'etudiants' && "Vue d'ensemble de tous vos étudiants"}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'espaces' && renderEspaces()}
                    {activeTab === 'travaux' && renderTravaux()}
                    {activeTab === 'evaluations' && renderEvaluations()}
                    {activeTab === 'etudiants' && renderEtudiants()}
                </div>
            </main>

            {/* Bouton d'accès rapide flottant */}
            <QuickAccessFab 
                onAction={handleQuickAction}
                userRole="FORMATEUR"
            />

            {/* Modals */}
            {activeModal === 'create-travail' && (
                <CreateTravail 
                    spaces={stats.mes_espaces}
                    initialSpaceId={preselectedSpaceId}
                    onClose={() => {
                        setActiveModal(null);
                        setPreselectedSpaceId(null);
                    }}
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

export default FormateurDashboard;