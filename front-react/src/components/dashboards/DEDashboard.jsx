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
import ConsulterEspace from '../forms/ConsulterEspace';
import QuickAccessFab from '../common/QuickAccessFab';

import CircularChart from '../common/CircularChart';
import './DEDashboard.css';

const DEDashboard = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'etudiants' | 'formateurs' | 'promotions' | 'espaces'
    const [dashboardData, setDashboardData] = useState(null);

    // Data States
    const [etudiants, setEtudiants] = useState([]);
    const [formateurs, setFormateurs] = useState([]);
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
            } else if (activeTab === 'etudiants') {
                console.log('Tentative de chargement des étudiants...');
                try {
                    // Essayer d'abord l'endpoint direct
                    const res = await gestionComptesAPI.getEtudiants();
                    console.log('Réponse étudiants:', res.data);
                    setEtudiants(res.data.etudiants || []);
                } catch (directError) {
                    console.log('Endpoint direct échoué, essai via promotions...', directError);
                    // Si l'endpoint direct n'existe pas, utiliser une approche alternative
                    try {
                        const promotionsRes = await gestionComptesAPI.getPromotions();
                        const promotions = promotionsRes.data.promotions || [];
                        
                        let allEtudiants = [];
                        for (const promotion of promotions) {
                            try {
                                const etudiantsRes = await espacesPedagogiquesAPI.listerEtudiantsCandidats(promotion.id_promotion);
                                const etudiantsPromo = etudiantsRes.data.etudiants || [];
                                // Ajouter les infos de promotion à chaque étudiant
                                const etudiantsAvecPromo = etudiantsPromo.map(etudiant => ({
                                    ...etudiant,
                                    promotion: promotion.libelle,
                                    filiere: promotion.filiere,
                                    actif: true // Valeur par défaut
                                }));
                                allEtudiants = [...allEtudiants, ...etudiantsAvecPromo];
                            } catch (promoError) {
                                console.log(`Erreur pour promotion ${promotion.libelle}:`, promoError);
                            }
                        }
                        setEtudiants(allEtudiants);
                    } catch (alternativeError) {
                        throw alternativeError;
                    }
                }
            } else if (activeTab === 'formateurs') {
                console.log('Tentative de chargement des formateurs...');
                const res = await gestionComptesAPI.getFormateurs();
                console.log('Réponse formateurs:', res.data);
                setFormateurs(res.data.formateurs || []);
            } else if (activeTab === 'promotions') {
                const res = await gestionComptesAPI.getPromotions();
                setPromotions(res.data.promotions);
            } else if (activeTab === 'espaces') {
                const res = await espacesPedagogiquesAPI.listerEspaces();
                setEspaces(res.data.espaces);
            }
        } catch (err) {
            console.error('Erreur chargement détaillée:', err);
            console.error('Erreur response:', err.response);
            console.error('Erreur status:', err.response?.status);
            console.error('Erreur data:', err.response?.data);
            setError(`Impossible de charger les données: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSuccess = async () => {
        const currentEspaceId = selectedEspace?.id_espace;
        setActiveModal(null);

        // Recharger les données
        if (activeTab === 'espaces') {
            try {
                const res = await espacesPedagogiquesAPI.listerEspaces();
                setEspaces(res.data.espaces);

                // Si un espace était sélectionné, le remettre à jour avec les nouvelles données
                if (currentEspaceId) {
                    const updatedEspace = res.data.espaces.find(e => e.id_espace === currentEspaceId);
                    setSelectedEspace(updatedEspace || null);
                } else {
                    setSelectedEspace(null);
                }
            } catch (err) {
                console.error('Erreur rechargement espaces:', err);
                setSelectedEspace(null);
            }
        } else {
            setSelectedEspace(null);
            loadData(); // Pour les autres onglets
        }
    };

    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'create-etudiant':
                setActiveModal('etudiant');
                break;
            case 'create-formateur':
                setActiveModal('formateur');
                break;
            case 'create-promotion':
                setActiveModal('promotion');
                break;
            case 'create-espace':
                setActiveModal('create_espace');
                break;
            default:
                console.log('Action non reconnue:', actionId);
        }
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
                            value={statistiques_generales.total_etudiants}
                            maxValue={500}
                            size={60}
                            strokeWidth={6}
                            color="#3b82f6"
                            showPercentage={true}
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
                            maxValue={500}
                            size={60}
                            strokeWidth={6}
                            color="#10b981"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_formateurs}</div>
                            <div className="stat-label">Formateurs</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_espaces}
                            maxValue={500}
                            size={60}
                            strokeWidth={6}
                            color="#8b5cf6"
                            showPercentage={true}
                        />
                        <div className="stat-info">
                            <div className="stat-number">{statistiques_generales.total_espaces}</div>
                            <div className="stat-label">Espaces</div>
                        </div>
                    </div>

                    <div className="stat-card-compact">
                        <CircularChart
                            value={statistiques_generales.total_travaux}
                            maxValue={500}
                            size={60}
                            strokeWidth={6}
                            color="#f59e0b"
                            showPercentage={true}
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

    const renderEtudiants = () => {
        const etudiantsPremiers = etudiants.slice(0, 4);
        const etudiantsRestants = etudiants.slice(4);

        return (
            <div className="dashboard-content animate-fade-in">
                <div className="dashboard-header">
                    <div>
                        <h1>Gestion des Étudiants</h1>
                        <p>Gérez les comptes étudiants</p>
                    </div>
                    <button className="btn btn-blue" onClick={() => setActiveModal('etudiant')}>
                        <Plus size={18} /> Nouvel Étudiant
                    </button>
                </div>

                {/* Affichage des 4 premiers étudiants en cartes */}
                {etudiantsPremiers.length > 0 && (
                    <div className="grid-cards">
                        {etudiantsPremiers.map(etudiant => (
                            <div key={etudiant.id_etudiant} className="card-espace">
                                <div className="card-header-espace">
                                    <h3>{etudiant.prenom} {etudiant.nom}</h3>
                                    <span className="badge badge-blue">{etudiant.promotion}</span>
                                </div>
                                <div className="card-body-espace">
                                    <p><strong>Email:</strong> {etudiant.email}</p>
                                    <p><strong>Filière:</strong> {etudiant.filiere}</p>
                                    <p><strong>Téléphone:</strong> {etudiant.telephone || 'Non renseigné'}</p>
                                    <p><strong>Statut:</strong> <span style={{ color: etudiant.actif ? 'green' : 'red' }}>{etudiant.actif ? 'Actif' : 'Inactif'}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Affichage des étudiants restants en tableau */}
                {etudiantsRestants.length > 0 && (
                    <div className="table-section">
                        <h2>Autres étudiants</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Prénom</th>
                                        <th>Email</th>
                                        <th>Promotion</th>
                                        <th>Filière</th>
                                        <th>Téléphone</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {etudiantsRestants.map(etudiant => (
                                        <tr key={etudiant.id_etudiant}>
                                            <td>{etudiant.nom}</td>
                                            <td>{etudiant.prenom}</td>
                                            <td>{etudiant.email}</td>
                                            <td>{etudiant.promotion}</td>
                                            <td>{etudiant.filiere}</td>
                                            <td>{etudiant.telephone || 'Non renseigné'}</td>
                                            <td>
                                                <span style={{ color: etudiant.actif ? 'green' : 'red' }}>
                                                    {etudiant.actif ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {etudiants.length === 0 && <div className="text-center w-full">Aucun étudiant enregistré.</div>}
            </div>
        );
    };

    const renderFormateurs = () => {
        const formateursPremiers = formateurs.slice(0, 4);
        const formateursRestants = formateurs.slice(4);

        return (
            <div className="dashboard-content animate-fade-in">
                <div className="dashboard-header">
                    <div>
                        <h1>Gestion des Formateurs</h1>
                        <p>Gérez les comptes formateurs</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setActiveModal('formateur')}>
                        <Plus size={18} /> Nouveau Formateur
                    </button>
                </div>

                {/* Affichage des 4 premiers formateurs en cartes */}
                {formateursPremiers.length > 0 && (
                    <div className="grid-cards">
                        {formateursPremiers.map(formateur => (
                            <div key={formateur.id_formateur} className="card-espace">
                                <div className="card-header-espace">
                                    <h3>{formateur.prenom} {formateur.nom}</h3>
                                    <span className="badge badge-green">Formateur</span>
                                </div>
                                <div className="card-body-espace">
                                    <p><strong>Email:</strong> {formateur.email}</p>
                                    <p><strong>Spécialité:</strong> {formateur.specialite || 'Non renseignée'}</p>
                                    <p><strong>Téléphone:</strong> {formateur.telephone || 'Non renseigné'}</p>
                                    <p><strong>Statut:</strong> <span style={{ color: formateur.actif ? 'green' : 'red' }}>{formateur.actif ? 'Actif' : 'Inactif'}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Affichage des formateurs restants en tableau */}
                {formateursRestants.length > 0 && (
                    <div className="table-section">
                        <h2>Autres formateurs</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Prénom</th>
                                        <th>Email</th>
                                        <th>Spécialité</th>
                                        <th>Téléphone</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formateursRestants.map(formateur => (
                                        <tr key={formateur.id_formateur}>
                                            <td>{formateur.nom}</td>
                                            <td>{formateur.prenom}</td>
                                            <td>{formateur.email}</td>
                                            <td>{formateur.specialite || 'Non renseignée'}</td>
                                            <td>{formateur.telephone || 'Non renseigné'}</td>
                                            <td>
                                                <span style={{ color: formateur.actif ? 'green' : 'red' }}>
                                                    {formateur.actif ? 'Actif' : 'Inactif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {formateurs.length === 0 && <div className="text-center w-full">Aucun formateur enregistré.</div>}
            </div>
        );
    };

    const renderPromotions = () => {
        const promotionsPremiers = promotions.slice(0, 4);
        const promotionsRestants = promotions.slice(4);

        return (
            <div className="dashboard-content animate-fade-in">
                <div className="dashboard-header">
                    <div>
                        <h1>Gestion des Promotions</h1>
                        <p>Gérez les promotions et les étudiants</p>
                    </div>
                    <button className="btn btn-green" onClick={() => setActiveModal('promotion')}>
                        <Plus size={18} /> Nouvelle Promotion
                    </button>
                </div>

                {/* Affichage des 4 premières promotions en cartes */}
                {promotionsPremiers.length > 0 && (
                    <div className="grid-cards">
                        {promotionsPremiers.map(promotion => (
                            <div key={promotion.id_promotion} className="card-espace">
                                <div className="card-header-espace">
                                    <h3>{promotion.libelle}</h3>
                                    <span className="badge badge-purple">{promotion.filiere}</span>
                                </div>
                                <div className="card-body-espace">
                                    <p><strong>Filière:</strong> {promotion.filiere}</p>
                                    <p><strong>Année académique:</strong> {promotion.annee_academique}</p>
                                    <p><strong>Date de début:</strong> {promotion.date_debut ? new Date(promotion.date_debut).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                                    <p><strong>Date de fin:</strong> {promotion.date_fin ? new Date(promotion.date_fin).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Affichage des promotions restantes en tableau */}
                {promotionsRestants.length > 0 && (
                    <div className="table-section">
                        <h2>Autres promotions</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Libellé</th>
                                        <th>Filière</th>
                                        <th>Année académique</th>
                                        <th>Date de début</th>
                                        <th>Date de fin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promotionsRestants.map(promotion => (
                                        <tr key={promotion.id_promotion}>
                                            <td>{promotion.libelle}</td>
                                            <td>{promotion.filiere}</td>
                                            <td>{promotion.annee_academique}</td>
                                            <td>{promotion.date_debut ? new Date(promotion.date_debut).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                                            <td>{promotion.date_fin ? new Date(promotion.date_fin).toLocaleDateString('fr-FR') : 'Non définie'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {promotions.length === 0 && <div className="text-center w-full">Aucune promotion créée.</div>}
            </div>
        );
    };

    const renderEspaces = () => {
        const espacesPremiers = espaces.slice(0, 4);
        const espacesRestants = espaces.slice(4);

        return (
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

                {/* Affichage des 4 premiers espaces en cartes */}
                {espacesPremiers.length > 0 && (
                    <div className="grid-cards">
                        {espacesPremiers.map(espace => (
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
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            setSelectedEspace(espace);
                                            setActiveModal('consulter_espace');
                                        }}
                                    >
                                        <Eye size={14} />
                                        Consulter
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Affichage des espaces restants en tableau */}
                {espacesRestants.length > 0 && (
                    <div className="table-section">
                        <h2>Autres espaces pédagogiques</h2>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Matière</th>
                                        <th>Promotion</th>
                                        <th>Filière</th>
                                        <th>Formateur</th>
                                        <th>Étudiants</th>
                                        <th>Code d'accès</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {espacesRestants.map(espace => (
                                        <tr key={espace.id_espace}>
                                            <td>{espace.nom_matiere}</td>
                                            <td>{espace.promotion}</td>
                                            <td>{espace.filiere}</td>
                                            <td>{espace.formateur || <span style={{ color: 'red' }}>Non assigné</span>}</td>
                                            <td>{espace.nb_etudiants}</td>
                                            <td><code>{espace.code_acces}</code></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => {
                                                            setSelectedEspace(espace);
                                                            setActiveModal('manage_espace');
                                                        }}
                                                    >
                                                        <Settings size={12} />
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => {
                                                            setSelectedEspace(espace);
                                                            setActiveModal('consulter_espace');
                                                        }}
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {espaces.length === 0 && <div className="text-center w-full">Aucun espace pédagogique créé.</div>}
            </div>
        );
    };

    return (
        <div className="dashboard-container">
            {/* Header avec navigation */}
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="header-title">
                        <div className="header-logo-container">
                            <img
                                src="/cropped-logos-vers-corrige-UATM.png"
                                alt="UATM Logo"
                                className="dashboard-logo"
                            />
                        </div>
                        <div>
                            <h1>Tableau de bord Directeur</h1>
                            <p>Espace de gestion UATM</p>
                        </div>
                    </div>
                    <div className="header-actions">
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
                    className={`nav-tab ${activeTab === 'etudiants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('etudiants')}
                >
                    <Users size={18} />
                    Étudiants
                </button>
                <button
                    className={`nav-tab ${activeTab === 'formateurs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('formateurs')}
                >
                    <Users size={18} />
                    Formateurs
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
                    {activeTab === 'etudiants' && renderEtudiants()}
                    {activeTab === 'formateurs' && renderFormateurs()}
                    {activeTab === 'promotions' && renderPromotions()}
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

            {activeModal === 'consulter_espace' && selectedEspace && (
                <ConsulterEspace
                    espace={selectedEspace}
                    onClose={() => setActiveModal(null)}
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

            {activeModal === 'statistiques' && selectedEspace && (
                <StatistiquesModal
                    espace={selectedEspace}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {/* Bouton d'accès rapide flottant */}
            <QuickAccessFab 
                onAction={handleQuickAction}
                userRole="DE"
            />
        </div>
    );
};

export default DEDashboard;
