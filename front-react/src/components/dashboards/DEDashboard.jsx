import { useState, useEffect } from 'react';
import { Users, UserPlus } from 'lucide-react';
import Navbar from '../common/Navbar';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import CreateFormateur from '../forms/CreateFormateur';
import { dashboardAPI } from '../../services/api';
import './DEDashboard.css';

const DEDashboard = ({ onLogout }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getDEDashboard();
      setDashboardData(res.data);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError("Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setActiveModal(null);
    loadData(); // Recharger les données après création
  };

  if (loading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Navbar onLogout={onLogout} />
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const stats = dashboardData?.statistiques || {};

  return (
    <div className="dashboard-container">
      <Navbar onLogout={onLogout} />

      <div className="dashboard-content animate-fade-in">
        <div className="dashboard-header">
          <div>
            <h1>Tableau de Bord</h1>
            <p>Vue d'ensemble de l'établissement</p>
          </div>
          <div className="dashboard-actions">
            <button className="btn btn-primary" onClick={() => setActiveModal('formateur')}>
              <UserPlus size={18} /> Nouveau Formateur
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard title="Formateurs" value={stats.total_formateurs || 0} icon={Users} color="blue" />
          {/* Autres statistiques seront ajoutées avec les User Stories correspondantes */}
        </div>

        <div className="dashboard-section">
          <h2>Activités récentes</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData?.comptes_recents?.map(c => (
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

      {/* Modal Création Formateur */}
      {activeModal === 'formateur' && (
        <CreateFormateur
          onClose={() => setActiveModal(null)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default DEDashboard;