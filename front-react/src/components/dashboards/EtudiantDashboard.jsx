import React from 'react';
import QuickAccessFab from '../common/QuickAccessFab';

const EtudiantDashboard = ({ onLogout }) => {
    const handleQuickAction = (actionId) => {
        switch (actionId) {
            case 'view-travaux':
                console.log('Voir mes travaux');
                // TODO: Implémenter la vue des travaux
                break;
            case 'view-notes':
                console.log('Voir mes notes');
                // TODO: Implémenter la vue des notes
                break;
            case 'view-planning':
                console.log('Voir le planning');
                // TODO: Implémenter la vue du planning
                break;
            default:
                console.log('Action non reconnue:', actionId);
        }
    };

    return (
        <div className="p-4">
            <h1>Tableau de bord Étudiant (À implémenter)</h1>
            <button onClick={onLogout} className="btn btn-danger">Déconnexion</button>
            
            {/* Bouton d'accès rapide flottant */}
            <QuickAccessFab 
                onAction={handleQuickAction}
                userRole="ETUDIANT"
            />
        </div>
    );
};

export default EtudiantDashboard;
