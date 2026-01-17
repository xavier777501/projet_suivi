import { useState, useEffect } from 'react'
import Login from './components/Login'
import ChangePassword from './components/ChangePassword'
import DEDashboard from './components/dashboards/DEDashboard'
import FormateurDashboard from './components/dashboards/FormateurDashboard'
import EtudiantDashboard from './components/dashboards/EtudiantDashboard'
import SessionDebug from './components/debug/SessionDebug'
import MultiTabDemo from './components/session/MultiTabDemo'
import TabIsolationWrapper from './components/session/TabIsolationWrapper'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/common/ThemeToggle'
import { useAuth } from './contexts/AuthContext'
import './App.css'

function AppContent() {
  const auth = useAuth();
  const [currentView, setCurrentView] = useState('loading')

  useEffect(() => {
    if (auth.isInitialized) {
      if (auth.isAuthenticated) {
        setCurrentView(getDashboardView(auth.user.role))
      } else {
        setCurrentView('login')
      }
    }
  }, [auth.isInitialized, auth.isAuthenticated, auth.user])

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
      <SessionDebug />
      <MultiTabDemo />
      
      {currentView === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      
      {currentView === 'changePassword' && auth.token && (
        <ChangePassword 
          token={auth.token} 
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
      <TabIsolationWrapper>
        <AppContent />
      </TabIsolationWrapper>
    </ThemeProvider>
  )
}

export default App
