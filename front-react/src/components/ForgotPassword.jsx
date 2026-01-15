import { useState } from 'react'
import { authAPI } from '../services/api'
import './ForgotPassword.css'

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState('request') // 'request' ou 'success'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await authAPI.forgotPassword(email)
      setStep('success')
      setMessage('Un email de réinitialisation a été envoyé à votre adresse email.')
    } catch (err) {
      console.error('Erreur mot de passe oublié:', err)
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'

      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        if (detail.includes('User not found')) {
          errorMessage = 'Aucun compte n\'est associé à cette adresse email.'
        } else {
          errorMessage = detail
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22,4 12,14.01 9,11.01"></polyline>
              </svg>
            </div>
            <h2>Email envoyé</h2>
            <p className="forgot-password-subtitle">
              Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
            </p>
          </div>

          <div className="success-message">
            {message}
          </div>

          <div className="forgot-password-actions">
            <button type="button" onClick={onBack} className="back-button">
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="forgot-password-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Mot de passe oublié</h2>
          <p className="forgot-password-subtitle">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre@email.com"
                className="modern-input"
                autoComplete="email"
              />
              <div className="input-icon-right">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="forgot-password-actions">
            <button type="button" onClick={onBack} className="back-button">
              Retour
            </button>
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? (
                <span className="loading-spinner">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                  </svg>
                  Envoi en cours...
                </span>
              ) : (
                'Envoyer le lien'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword