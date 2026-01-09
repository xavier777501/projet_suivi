import React from 'react';
import QuickAccessFab from '../common/QuickAccessFab';

const FormateurDashboard = ({ onLogout }) => {
    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'create-travail':
                console.log('Créer un nouveau travail');
                // TODO: Implémenter la création de travail
                break;
            case 'manage-notes':
                console.log('Gérer les notes');
                // TODO: Implémenter la gestion des notes
                break;
            default:
                console.log('Action non reconnue:', actionId);
        }
    };

    return (
        <div className="p-4">
            <h1>Tableau de bord Formateur (À implémenter)</h1>
            <button onClick={onLogout} className="btn btn-danger">Déconnexion</button>
            
            {/* Bouton d'accès rapide flottant */}
            <QuickAccessFab 
                onAction={handleQuickAction}
                userRole="FORMATEUR"
            />
        </div>
    );
};

export default FormateurDashboard;
