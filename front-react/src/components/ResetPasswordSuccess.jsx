import './ResetPasswordSuccess.css'

function ResetPasswordSuccess({ onBackToLogin }) {
  return (
    <div className="reset-success-container">
      <div className="reset-success-card">
        <div className="reset-success-header">
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
          </div>
          <h2>Mot de passe réinitialisé</h2>
          <p className="reset-success-subtitle">
            Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </p>
        </div>

        <div className="reset-success-actions">
          <button onClick={onBackToLogin} className="login-button">
            Se connecter
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordSuccess