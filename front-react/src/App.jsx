import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import ChangePassword from './components/ChangePassword'
import ResetPassword from './components/ResetPassword'
import ResetPasswordSuccess from './components/ResetPasswordSuccess'
import DEDashboard from './components/dashboards/DEDashboard'
import FormateurDashboard from './components/dashboards/FormateurDashboard'
import EtudiantDashboard from './components/dashboards/EtudiantDashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import ThemeToggle from './components/common/ThemeToggle'
import { getAuthData, saveAuthData, clearAuthData } from './utils/auth'
import './App.css'

function App() {
  const [authData, setAuthData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const existingAuth = getAuthData()
    if (existingAuth) {
      setAuthData(existingAuth)
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (data) => {
    setAuthData(data)
    
    if (data.requiresPasswordChange) {
      // Le changement de mot de passe sera géré par le composant ChangePassword
      return
    } else {
      // Sauvegarder les données d'authentification
      saveAuthData(data.token, data.user)
    }
  }

  const handlePasswordChangeSuccess = (data) => {
    console.log('Mot de passe changé avec succès:', data)
    
    // Sauvegarder les nouvelles données d'authentification
    saveAuthData(data.token, data.user)
    setAuthData(data)
  }

  const handleResetPasswordSuccess = () => {
    // Rediriger vers la page de succès puis vers login
    window.location.href = '/reset-success'
  }

  const handleLogout = () => {
    clearAuthData()
    setAuthData(null)
  }

  const getDashboardComponent = () => {
    if (!authData || !authData.user) return null
    
    switch (authData.user.role) {
      case 'DE':
        return <DEDashboard onLogout={handleLogout} />
      case 'FORMATEUR':
        return <FormateurDashboard onLogout={handleLogout} />
      case 'ETUDIANT':
        return <EtudiantDashboard onLogout={handleLogout} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <ThemeToggle />
          
          <Routes>
            {/* Route de connexion */}
            <Route 
              path="/" 
              element={
                authData && !authData.requiresPasswordChange ? (
                  <Navigate to="/dashboard" replace />
                ) : authData && authData.requiresPasswordChange ? (
                  <ChangePassword 
                    token={authData.token} 
                    onPasswordChangeSuccess={handlePasswordChangeSuccess}
                  />
                ) : (
                  <Login onLoginSuccess={handleLoginSuccess} />
                )
              } 
            />
            
            {/* Route de réinitialisation de mot de passe */}
            <Route 
              path="/reset-password" 
              element={<ResetPassword onSuccess={handleResetPasswordSuccess} />} 
            />
            
            {/* Route de succès de réinitialisation */}
            <Route 
              path="/reset-success" 
              element={<ResetPasswordSuccess onBackToLogin={() => window.location.href = '/'} />} 
            />
            
            {/* Route du dashboard */}
            <Route 
              path="/dashboard" 
              element={
                authData && !authData.requiresPasswordChange ? (
                  getDashboardComponent()
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            {/* Route par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
