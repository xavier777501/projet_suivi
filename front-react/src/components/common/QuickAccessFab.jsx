import { useState } from 'react'
import { 
  Plus, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Building, 
  UserPlus,
  School,
  Layers,
  X
} from 'lucide-react'
import './QuickAccessFab.css'

const QuickAccessFab = ({ onAction, userRole = 'DE' }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAction = (action) => {
    onAction(action)
    setIsExpanded(false)
  }

  // Actions disponibles selon le rôle
  const getActions = () => {
    const baseActions = [
      {
        id: 'create-etudiant',
        label: 'Nouvel Étudiant',
        icon: UserPlus,
        color: '#3b82f6',
        roles: ['DE']
      },
      {
        id: 'create-formateur',
        label: 'Nouveau Formateur',
        icon: Users,
        color: '#10b981',
        roles: ['DE']
      },
      {
        id: 'create-promotion',
        label: 'Nouvelle Promotion',
        icon: School,
        color: '#8b5cf6',
        roles: ['DE']
      },
      {
        id: 'create-espace',
        label: 'Nouvel Espace',
        icon: Building,
        color: '#f59e0b',
        roles: ['DE']
      },
      {
        id: 'create-travail',
        label: 'Nouveau Travail',
        icon: BookOpen,
        color: '#ef4444',
        roles: ['FORMATEUR']
      },
      {
        id: 'manage-notes',
        label: 'Gérer Notes',
        icon: GraduationCap,
        color: '#06b6d4',
        roles: ['FORMATEUR']
      },
      {
        id: 'view-travaux',
        label: 'Mes Travaux',
        icon: BookOpen,
        color: '#3b82f6',
        roles: ['ETUDIANT']
      },
      {
        id: 'view-notes',
        label: 'Mes Notes',
        icon: GraduationCap,
        color: '#10b981',
        roles: ['ETUDIANT']
      },
      {
        id: 'view-planning',
        label: 'Planning',
        icon: Layers,
        color: '#8b5cf6',
        roles: ['ETUDIANT']
      }
    ]

    return baseActions.filter(action => action.roles.includes(userRole))
  }

  const actions = getActions()

  return (
    <div className={`quick-access-fab ${isExpanded ? 'expanded' : ''}`}>
      {/* Actions secondaires */}
      <div className="fab-actions">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          return (
            <button
              key={action.id}
              className="fab-action"
              onClick={() => handleAction(action.id)}
              style={{ 
                '--action-color': action.color,
                '--delay': `${index * 0.1}s`
              }}
              title={action.label}
            >
              <IconComponent size={20} />
              <span className="fab-action-label">{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Bouton principal */}
      <button 
        className="fab-main"
        onClick={handleToggle}
        aria-label={isExpanded ? 'Fermer le menu' : 'Ouvrir le menu d\'accès rapide'}
      >
        {isExpanded ? (
          <X size={24} />
        ) : (
          <Plus size={24} />
        )}
      </button>

      {/* Overlay pour fermer en cliquant à côté */}
      {isExpanded && (
        <div 
          className="fab-overlay" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  )
}

export default QuickAccessFab