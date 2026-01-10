import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Users, ClipboardList, Plus, 
    LogOut, User, Layout, MessageSquare, Bell, Search
} from 'lucide-react';
import { dashboardAPI, espacesPedagogiquesAPI } from '../../services/api';
import CreateTravail from '../forms/CreateTravail';
import ConsulterEspace from '../forms/ConsulterEspace';
import './FormateurDashboard.css';

const FormateurDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'espaces'
    const [selectedEspace, setSelectedEspace] = useState(null);
    const [stats, setStats] = useState({
        mes_espaces: [],
        formateur: { nom: '', prenom: '', matiere: '' }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeModal, setActiveModal] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
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
        loadDashboardData();
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const filteredEspaces = stats.mes_espaces.filter(espace => 
        espace.matiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        espace.promotion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="dashboard-loading">Chargement...</div>;

    const renderOverview = () => (
        <div className="formateur-overview animate-fade-in">
            <div className="formateur-stats-grid">
                <div className="formateur-stat-card">
                    <div className="formateur-stat-icon purple">
                        <BookOpen size={24} />
                    </div>
                    <div className="formateur-stat-details">
                        <span className="formateur-stat-label">Mes Espaces</span>
                        <span className="formateur-stat-value">{stats.mes_espaces.length}</span>
                    </div>
                </div>

                <div className="formateur-stat-card">
                    <div className="formateur-stat-icon blue">
                        <Users size={24} />
                    </div>
                    <div className="formateur-stat-details">
                        <span className="formateur-stat-label">Total Étudiants</span>
                        <span className="formateur-stat-value">
                            {stats.mes_espaces.reduce((acc, esp) => acc + (esp.nombre_etudiants || 0), 0)}
                        </span>
                    </div>
                </div>

                <div className="formateur-stat-card">
                    <div className="formateur-stat-icon orange">
                        <ClipboardList size={24} />
                    </div>
                    <div className="formateur-stat-details">
                        <span className="formateur-stat-label">Travaux Créés</span>
                        <span className="formateur-stat-value">
                            {stats.mes_espaces.reduce((acc, esp) => acc + (esp.nombre_travaux || 0), 0)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEspaces = () => (
        <div className="formateur-espaces-view animate-fade-in">
            <div className="formateur-espaces-grid">
                {filteredEspaces.length > 0 ? (
                    filteredEspaces.map((espace) => (
                        <div 
                            key={espace.id_espace} 
                            className="formateur-espace-card clickable"
                            onClick={() => setSelectedEspace(espace)}
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
                        className={`formateur-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('overview');
                            setSelectedEspace(null);
                        }}
                    >
                        <Layout size={20} />
                        <span>Vue d'ensemble</span>
                    </button>
                    <button 
                        className={`formateur-nav-item ${activeTab === 'espaces' ? 'active' : ''}`}
                        onClick={() => setActiveTab('espaces')}
                    >
                        <BookOpen size={20} />
                        <span>Mes Espaces</span>
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
                        
                        <div className="formateur-user-profile">
                            <div className="formateur-user-info">
                                <span className="formateur-user-name">
                                    {stats.formateur.prenom} {stats.formateur.nom}
                                </span>
                                <span className="formateur-user-role">
                                    Formateur {stats.formateur.matiere && `• ${stats.formateur.matiere}`}
                                </span>
                            </div>
                            <div className="formateur-user-avatar">
                                <User size={24} />
                            </div>
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
                                {activeTab === 'overview' ? "Vue d'ensemble" : "Mes Espaces Pédagogiques"}
                            </h1>
                            <p className="formateur-subtitle">
                                {activeTab === 'overview' 
                                    ? "Statistiques globales de vos activités pédagogiques" 
                                    : "Gérez vos espaces et créez des travaux pour vos étudiants"}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'overview' ? renderOverview() : renderEspaces()}
                </div>
            </main>

            {/* Modals */}
            {activeModal === 'create-travail' && (
                <CreateTravail 
                    spaces={stats.mes_espaces}
                    initialSpaceId={selectedEspace?.id_espace}
                    onClose={() => {
                        setActiveModal(null);
                    }}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {selectedEspace && (
                <ConsulterEspace 
                    espace={selectedEspace}
                    onClose={() => setSelectedEspace(null)}
                    onAddTravail={(espace) => {
                        setSelectedEspace(null); // Fermer le modal de consultation
                        setActiveModal('create-travail');
                    }}
                />
            )}
        </div>
    );
};

export default FormateurDashboard;
