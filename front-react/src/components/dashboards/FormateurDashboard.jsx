import React from 'react';

const FormateurDashboard = ({ onLogout }) => {
    return (
        <div className="p-4">
            <h1>Tableau de bord Formateur (À implémenter)</h1>
            <button onClick={onLogout} className="btn btn-danger">Déconnexion</button>
        </div>
    );
};

export default FormateurDashboard;
