import { useState, useEffect } from 'react'
import Login from './components/Login'
import ChangePassword from './components/ChangePassword'
import DEDashboard from './components/dashboards/DEDashboard'
import FormateurDashboard from './components/dashboards/FormateurDashboard'
import EtudiantDashboard from './components/dashboards/EtudiantDashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/common/ThemeToggle'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

function AppContent() {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState('loading')
  const [tempToken, setTempToken] = useState(null)

  useEffect(() => {
    if (auth.isInitialized) {
      if (auth.isAuthenticated) {
        setCurrentView(getDashboardView(auth.user.role))
      } else if (currentView !== 'changePassword') {
        setCurrentView('login')
      }
    }
  }, [auth.isInitialized, auth.isAuthenticated, auth.user, currentView])

  const getDashboardView = (role) => {
    switch (role) {
      case 'DE':
        return 'deDashboard'
      case 'FORMATEUR':
        return 'formateurDashboard'
      case 'ETUDIANT':
        return 'etudiantDashboard'
      default:
        return 'login'
    }
  }

  const handleLoginSuccess = async (data) => {
    if (data.requiresPasswordChange) {
      setTempToken(data.token)
      setCurrentView('changePassword')
    } else {
      // Utiliser le contexte d'authentification
      await auth.login(data.token, data.user)

      // Rediriger vers le bon dashboard
      const dashboardView = getDashboardView(data.user.role)
      setCurrentView(dashboardView)
    }
  }

  const handlePasswordChangeSuccess = async (data) => {
    console.log('Mot de passe changé avec succès:', data)
    setTempToken(null)

    // Utiliser le contexte d'authentification
    await auth.login(data.token, data.user)

    // Rediriger vers le bon dashboard
    const dashboardView = getDashboardView(data.user.role)
    setCurrentView(dashboardView)
  }

  const handleLogout = async () => {
    await auth.logout()
    setCurrentView('login')
  }

  if (currentView === 'loading' || !auth.isInitialized) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <ThemeToggle />

      {currentView === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {currentView === 'changePassword' && tempToken && (
        <ChangePassword
          token={tempToken}
          onPasswordChangeSuccess={handlePasswordChangeSuccess}
        />
      )}

      {currentView === 'deDashboard' && (
        <DEDashboard onLogout={handleLogout} />
      )}

      {currentView === 'formateurDashboard' && (
        <FormateurDashboard onLogout={handleLogout} />
      )}

      {currentView === 'etudiantDashboard' && (
        <EtudiantDashboard onLogout={handleLogout} />
      )}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
