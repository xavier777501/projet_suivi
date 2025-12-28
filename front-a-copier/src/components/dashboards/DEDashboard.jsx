import { useState, useEffect } from 'react';
import { Users, GraduationCap, Calendar, TrendingUp, UserPlus, Plus, BookOpen, Layers, Settings, ChevronRight } from 'lucide-react';
import Navbar from '../common/Navbar';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateFormateur from '../forms/CreateFormateur';
import CreateEtudiant from '../forms/CreateEtudiant';
import CreateEspacePedagogique from '../forms/CreateEspacePedagogique';
import CreatePromotion from '../forms/CreatePromotion';

import ManageEspace from '../forms/ManageEspace';
import ConsultEspace from './ConsultEspace';
import { dashboardAPI, gestionComptesAPI, espacesPedagogiquesAPI } from '../../services/api';
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
  const [selectedEspace, setSelectedEspace] = useState(null); // For ManageEspace

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
    loadData(); // Reload current tab data
  };

  const renderDashboard = () => {
    if (!dashboardData) return null;
    const stats = dashboardData.statistiques || {};

    return (
      <div className="dashboard-content animate-fade-in">
        <div className="dashboard-header">
          <div>
            <h1>Tableau de Bord</h1>
            <p>Vue d'ensemble de l'établissement</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={() => setActiveModal('formateur')}>
              <UserPlus size={18} /> Formateur
            </button>
            <button className="btn btn-success" onClick={() => setActiveModal('etudiant')}>
              <Plus size={18} /> Étudiant
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="Formateurs" value={stats.total_formateurs} icon={Users} color="blue" />
          <StatCard title="Étudiants" value={stats.total_etudiants} icon={GraduationCap} color="green" />
          <StatCard title="Promotions" value={stats.total_promotions} icon={Calendar} color="purple" />
          <StatCard title="Filières" value={stats.total_filieres} icon={TrendingUp} color="yellow" />
        </div>

        <div className="dashboard-section">
          <h2>Activités récentes</h2>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Date</th></tr></thead>
              <tbody>
                {dashboardData.comptes_recents?.map(c => (
                  <tr key={c.identifiant}>
                    <td>{c.prenom} {c.nom}</td>
                    <td>{c.email}</td>
                    <td><span className={`badge badge-${c.role.toLowerCase()}`}>{c.role}</span></td>
                    <td>{new Date(c.date_creation).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPromotions = () => (
    <div className="dashboard-content animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Gestion des Promotions</h1>
          <p>Créez et gérez les cohortes d'étudiants</p>
        </div>
        <button className="btn btn-purple" onClick={() => setActiveModal('create_promotion')}>
          <Plus size={18} /> Nouvelle Promotion
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Année</th>
              <th>Libellé</th>
              <th>Filière</th>
              <th>Dates</th>
              <th>Étudiants</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(promo => (
              <tr key={promo.id_promotion}>
                <td><strong>{promo.annee_academique}</strong></td>
                <td>{promo.libelle}</td>
                <td>{promo.filiere || '-'}</td>
                <td>
                  {new Date(promo.date_debut).toLocaleDateString()} - {new Date(promo.date_fin).toLocaleDateString()}
                </td>
                <td>TODO Count</td>
              </tr>
            ))}
            {promotions.length === 0 && <tr><td colSpan="5" className="text-center">Aucune promotion trouvée</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEspaces = () => (
    <div className="dashboard-content animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1>Espaces Pédagogiques</h1>
          <p>Gérez les cours et les assignations</p>
        </div>
        <button className="btn btn-purple" onClick={() => setActiveModal('create_espace')}>
          <BookOpen size={18} /> Créer Espace
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
            </div>
            <div className="card-actions-espace">
              <button className="btn btn-sm btn-outline" onClick={() => {
                setSelectedEspace(espace);
                setActiveModal('manage_espace');
              }}>
                <Settings size={16} /> Gérer
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => {
                setSelectedEspace(espace);
                setActiveModal('consult_espace');
              }}>
                <TrendingUp size={16} /> Consulter
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
      <Navbar onLogout={onLogout} />

      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Layers size={18} /> Vue d'ensemble
        </button>
        <button
          className={`tab-item ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          <Calendar size={18} /> Promotions
        </button>
        <button
          className={`tab-item ${activeTab === 'espaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('espaces')}
        >
          <BookOpen size={18} /> Espaces Pédagogiques
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Chargement..." />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'promotions' && renderPromotions()}
          {activeTab === 'espaces' && renderEspaces()}
        </>
      )}

      {/* Modals */}
      {activeModal === 'formateur' && <CreateFormateur onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}
      {activeModal === 'etudiant' && <CreateEtudiant onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}
      {activeModal === 'create_promotion' && <CreatePromotion onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}
      {activeModal === 'create_espace' && <CreateEspacePedagogique onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}

      {activeModal === 'manage_espace' && selectedEspace && (
        <ManageEspace
          espace={selectedEspace}
          onClose={() => { setActiveModal(null); setSelectedEspace(null); }}
          onSuccess={handleCreateSuccess}
        />
      )}

      {activeModal === 'consult_espace' && selectedEspace && (
        <ConsultEspace
          espace={selectedEspace}
          onClose={() => { setActiveModal(null); setSelectedEspace(null); }}
        />
      )}
    </div>
  );
};

export default DEDashboard;