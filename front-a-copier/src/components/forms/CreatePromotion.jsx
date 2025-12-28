import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen } from 'lucide-react';
import { gestionComptesAPI } from '../../services/api';
import './CreateFormateur.css'; // Shared styles

const CreatePromotion = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        id_filiere: '',
        annee_academique: ''
    });
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await gestionComptesAPI.getFilieres();
            setFilieres(res.data.filieres);
        } catch (err) {
            setError("Impossible de charger les filières");
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Validate format YYYY-YYYY
        const regex = /^\d{4}-\d{4}$/;
        if (!regex.test(formData.annee_academique)) {
            setError("Format d'année invalide. Utilisez YYYY-YYYY (ex: 2024-2025)");
            setLoading(false);
            return;
        }

        try {
            await gestionComptesAPI.createPromotion(formData);
            setSuccess("Promotion créée avec succès !");
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.detail || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Nouvelle Promotion</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {loadingData ? (
                    <div className="p-4">Chargement...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="create-form">
                        <div className="form-group">
                            <label htmlFor="id_filiere"><BookOpen size={16} /> Filière</label>
                            <select name="id_filiere" value={formData.id_filiere} onChange={handleChange} required>
                                <option value="">Sélectionner une filière</option>
                                {filieres.map(f => (
                                    <option key={f.id_filiere} value={f.id_filiere}>{f.nom_filiere}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="annee_academique"><Calendar size={16} /> Année Académique (ex: 2024-2025)</label>
                            <input
                                type="text"
                                name="annee_academique"
                                value={formData.annee_academique}
                                onChange={handleChange}
                                placeholder="2024-2025"
                                required
                            />
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Création...' : 'Créer'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreatePromotion;
