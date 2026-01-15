import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authAPI } from '../services/api'
import './ResetPassword.css'

function ResetPassword({ onSuccess }) {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState({
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const resetToken = searchParams.get('token')
    if (resetToken) {
      setToken(resetToken)
    } else {
      setError('Token de réinitialisation manquant ou invalide.')
    }
  }, [searchParams])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caractères.'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre minuscule.'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Le mot de passe doit contenir au moins une lettre majuscule.'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Le mot de passe doit contenir au moins un chiffre.'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation des mots de passe
    const passwordError = validatePassword(formData.nouveau_mot_de_passe)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    if (formData.nouveau_mot_de_passe !== formData.confirmation_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas.')
      setLoading(false)
      return
    }

    try {
      await authAPI.resetPassword(token, formData.nouveau_mot_de_passe, formData.confirmation_mot_de_passe)
      onSuccess()
    } catch (err) {
      console.error('Erreur réinitialisation mot de passe:', err)
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'

      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        if (detail.includes('Token expired')) {
          errorMessage = 'Le lien de réinitialisation a expiré. Veuillez faire une nouvelle demande.'
        } else if (detail.includes('Invalid token')) {
          errorMessage = 'Le lien de réinitialisation est invalide.'
        } else {
          errorMessage = detail
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="reset-password-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
              <path d="M12 3v6"></path>
              <path d="M12 15v6"></path>
            </svg>
          </div>
          <h2>Nouveau mot de passe</h2>
          <p className="reset-password-subtitle">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="nouveau_mot_de_passe">Nouveau mot de passe</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="nouveau_mot_de_passe"
                name="nouveau_mot_de_passe"
                value={formData.nouveau_mot_de_passe}
                onChange={handleChange}
                required
                placeholder="Entrez votre nouveau mot de passe"
                className="modern-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            <small className="password-help">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmation_mot_de_passe">Confirmer le mot de passe</label>
            <div className="input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmation_mot_de_passe"
                name="confirmation_mot_de_passe"
                value={formData.confirmation_mot_de_passe}
                onChange={handleChange}
                required
                placeholder="Confirmez votre nouveau mot de passe"
                className="modern-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !token} className="reset-button">
            {loading ? (
              <span className="loading-spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Réinitialisation en cours...
              </span>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword