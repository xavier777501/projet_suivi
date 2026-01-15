import React, { useState } from 'react';
import { BookOpen, FileText, BarChart3, LogOut, User, Layout, Bell, Sun, Moon } from 'lucide-react';
import QuickAccessFab from '../common/QuickAccessFab';
import { useTheme } from '../../contexts/ThemeContext';
import MesTravaux from '../forms/MesTravaux';
import './EtudiantDashboard.css';

const EtudiantDashboard = ({ onLogout }) => {
    const { theme, toggleTheme } = useTheme();

    // Restaurer l'onglet actif depuis sessionStorage ou utiliser 'dashboard' par défaut
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('etudiant_activeTab') || 'dashboard';
    });

    // État pour gérer l'affichage de la page MesTravaux
    const [showMesTravaux, setShowMesTravaux] = useState(false);
    const [showProfilePopup, setShowProfilePopup] = useState(false);

    // Référence pour le conteneur du profil
    const profileRef = React.useRef(null);

    // Effet pour fermer le popup quand on clique en dehors
    React.useEffect(() => {
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

    // Fonction pour changer d'onglet et persister l'état
    const changeActiveTab = (newTab) => {
        setActiveTab(newTab);
        sessionStorage.setItem('etudiant_activeTab', newTab);
    };

    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'view-travaux':
                console.log('Voir mes travaux');
                changeActiveTab('travaux');
                break;
            case 'view-planning':
                console.log('Voir le planning');
                changeActiveTab('planning');
                break;
            default:
                console.log('Action non reconnue:', actionId);
        }
    };

    const handleOpenMesTravaux = () => {
        changeActiveTab('travaux');
    };

    const handleCloseMesTravaux = () => {
        setShowMesTravaux(false);
        if (activeTab === 'travaux') {
            changeActiveTab('dashboard');
        }
    };

    // Si on affiche MesTravaux, on retourne uniquement ce composant
    if (showMesTravaux || activeTab === 'travaux') {
        return <MesTravaux onBack={handleCloseMesTravaux} />;
    }

    const renderDashboard = () => (
        <div className="etudiant-overview">
            <div className="welcome-section">
                <h2>Bienvenue dans votre espace étudiant</h2>
                <p>Consultez vos travaux, notes et planning depuis cette interface.</p>
            </div>

            <div className="etudiant-stats-grid">
                <div className="etudiant-stat-card clickable" onClick={handleOpenMesTravaux}>
                    <div className="etudiant-stat-icon blue">
                        <FileText size={24} />
                    </div>
                    <div className="etudiant-stat-details">
                        <span className="etudiant-stat-label">Mes Travaux</span>
                        <span className="etudiant-stat-value">Consulter</span>
                    </div>
                </div>



                <div className="etudiant-stat-card">
                    <div className="etudiant-stat-icon orange">
                        <BookOpen size={24} />
                    </div>
                    <div className="etudiant-stat-details">
                        <span className="etudiant-stat-label">Cours suivis</span>
                        <span className="etudiant-stat-value">-</span>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h3>Actions rapides</h3>
                <div className="actions-grid">
                    <button className="action-card" onClick={handleOpenMesTravaux}>
                        <FileText size={32} />
                        <span>Consulter mes travaux</span>
                    </button>
                    <button className="action-card" onClick={() => changeActiveTab('planning')}>
                        <BookOpen size={32} />
                        <span>Mon planning</span>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderPlanning = () => (
        <div className="etudiant-content">
            <h2>Mon Planning</h2>
            <p>Fonctionnalité à implémenter - Planning des cours</p>
        </div>
    );

    return (
        <div className="etudiant-dashboard-container">
            {/* Sidebar */}
            <aside className="etudiant-sidebar">
                <div className="etudiant-sidebar-header">
                    <div className="etudiant-logo-container">
                        <div className="etudiant-logo-icon">E</div>
                        <span>Espace Étudiant</span>
                    </div>
                </div>

                <nav className="etudiant-sidebar-nav">
                    <button
                        className={`etudiant-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('dashboard')}
                    >
                        <Layout size={20} />
                        <span>Tableau de bord</span>
                    </button>
                    <button
                        className={`etudiant-nav-item ${activeTab === 'travaux' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('travaux')}
                    >
                        <FileText size={20} />
                        <span>Mes Travaux</span>
                    </button>
                    <button
                        className={`etudiant-nav-item ${activeTab === 'planning' ? 'active' : ''}`}
                        onClick={() => changeActiveTab('planning')}
                    >
                        <BookOpen size={20} />
                        <span>Planning</span>
                    </button>
                </nav>

                <div className="etudiant-sidebar-footer">
                    <button onClick={onLogout} className="etudiant-logout-button">
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="etudiant-main-content">
                <header className="etudiant-main-header">
                    <div className="etudiant-header-title">
                        <h1>
                            {activeTab === 'dashboard' && 'Tableau de bord'}
                            {activeTab === 'travaux' && 'Mes Travaux'}
                            {activeTab === 'planning' && 'Mon Planning'}
                        </h1>
                    </div>

                    <div className="etudiant-header-actions">
                        <button className="etudiant-icon-button">
                            <Bell size={20} />
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
                                            <div className="profile-name">Étudiant</div>
                                            <div className="profile-role">Espace personnel</div>
                                        </div>
                                    </div>

                                    <div className="profile-popup-content">
                                        <button className="profile-menu-item">
                                            <Bell size={18} />
                                            <span>Notifications</span>
                                        </button>

                                        <button className="profile-menu-item" onClick={toggleTheme}>
                                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                                            <span>{theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}</span>
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

                <div className="etudiant-dashboard-content">
                    {activeTab === 'dashboard' && renderDashboard()}
                    {activeTab === 'planning' && renderPlanning()}
                </div>
            </main>

            {/* Bouton d'accès rapide flottant */}
            <QuickAccessFab
                onAction={handleQuickAction}
                userRole="ETUDIANT"
            />
        </div>
    );
};

export default EtudiantDashboard;
