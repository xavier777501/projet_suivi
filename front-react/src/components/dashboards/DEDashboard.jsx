import React from 'react';

const DEDashboard = ({ onLogout }) => {
    return (
        <div className="p-4">
            <h1>Tableau de bord Directeur (À implémenter)</h1>
            <p>Bienvenue sur le squelette du projet.</p>
            <button onClick={onLogout} className="btn btn-danger">Déconnexion</button>
        </div>
    );
};

export default DEDashboard;
