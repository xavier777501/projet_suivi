/**
 * Composant pour changer le mot de passe temporaire
 */

import React, { useState } from 'react';
import { authAPI } from '../services/api';

const ChangePassword = ({ token, onPasswordChangeSuccess }) => {
  const [formData, setFormData] = useState({
    nouveau_mot_de_passe: '',
    confirmation_mot_de_passe: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.nouveau_mot_de_passe !== formData.confirmation_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.changePassword(
        token,
        formData.nouveau_mot_de_passe,
        formData.confirmation_mot_de_passe
      );

      const data = response.data;
      onPasswordChangeSuccess({
        token: data.token,
        user: data.utilisateur
      });
    } catch (err) {
      console.error('Erreur lors du changement de mot de passe:', err);
      setError('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Changement de mot de passe</h2>
          <p>Veuillez définir un nouveau mot de passe</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="nouveau_mot_de_passe">Nouveau mot de passe</label>
            <input
              type="password"
              id="nouveau_mot_de_passe"
              name="nouveau_mot_de_passe"
              value={formData.nouveau_mot_de_passe}
              onChange={handleChange}
              required
              className="modern-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmation_mot_de_passe">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmation_mot_de_passe"
              name="confirmation_mot_de_passe"
              value={formData.confirmation_mot_de_passe}
              onChange={handleChange}
              required
              className="modern-input"
            />
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Changement en cours...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;