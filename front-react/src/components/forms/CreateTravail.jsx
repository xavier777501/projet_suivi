import { useState, useEffect } from 'react';
import { X, ClipboardList, Calendar, Type, Info, CheckCircle, Users } from 'lucide-react';
import { travauxAPI } from '../../services/api';
import './CreateTravail.css';

const CreateTravail = ({ spaces, initialSpaceId, onClose, onSuccess }) => {
    const selectedSpace = spaces.find(s => s.id_espace === initialSpaceId);
    
    const [formData, setFormData] = useState({
        id_espace: initialSpaceId || '',
        titre: '',
        description: '',
        type_travail: 'INDIVIDUEL',
        date_echeance: '',
        note_max: 20
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await travauxAPI.creerTravail(formData);
            onSuccess("Travail créé avec succès !");
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de la création du travail");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <div className="modal-title">
                        <ClipboardList className="modal-icon" />
                        <div>
                            <h2>Créer un nouveau travail</h2>
                            {selectedSpace && (
                                <p className="modal-subtitle">
                                    Pour : <strong>{selectedSpace.matiere}</strong> ({selectedSpace.promotion})
                                </p>
                            )}
                        </div>
                    </div>
                    <button className="close-button" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-section">
                        {!initialSpaceId && (
                            <div className="form-group">
                                <label>Espace Pédagogique</label>
                                <div className="input-with-icon">
                                    <Info className="input-icon" size={18} />
                                    <select 
                                        name="id_espace" 
                                        value={formData.id_espace} 
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sélectionner un espace</option>
                                        {spaces.map(space => (
                                            <option key={space.id_espace} value={space.id_espace}>
                                                {space.matiere} - {space.promotion}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Titre du travail</label>
                            <div className="input-with-icon">
                                <Type className="input-icon" size={18} />
                                <input
                                    type="text"
                                    name="titre"
                                    value={formData.titre}
                                    onChange={handleChange}
                                    placeholder="Ex: TP1 - Algorithmique"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Type de travail</label>
                            <div className="input-with-icon">
                                <Users className="input-icon" size={18} />
                                <select 
                                    name="type_travail" 
                                    value={formData.type_travail} 
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="INDIVIDUEL">Individuel</option>
                                    <option value="COLLECTIF">Collectif (Groupe)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Date d'échéance</label>
                            <div className="input-with-icon">
                                <Calendar className="input-icon" size={18} />
                                <input
                                    type="datetime-local"
                                    name="date_echeance"
                                    value={formData.date_echeance}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Note maximale</label>
                            <div className="input-with-icon">
                                <CheckCircle className="input-icon" size={18} />
                                <input
                                    type="number"
                                    name="note_max"
                                    value={formData.note_max}
                                    onChange={handleChange}
                                    min="1"
                                    max="100"
                                    step="0.5"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Consignes détaillées</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Décrivez les consignes du travail ici..."
                                rows="5"
                                required
                            ></textarea>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Annuler
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Création en cours..." : "Créer le travail"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTravail;
