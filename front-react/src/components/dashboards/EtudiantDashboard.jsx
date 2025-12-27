import React from 'react';

const EtudiantDashboard = ({ onLogout }) => {
    return (
        <div className="p-4">
            <h1>Tableau de bord Étudiant (À implémenter)</h1>
            <button onClick={onLogout} className="btn btn-danger">Déconnexion</button>
        </div>
    );
};

export default EtudiantDashboard;
