import { useState, useEffect } from 'react';
import { X, BookOpen, Users, Award, BarChart2 } from 'lucide-react';
import { espacesPedagogiquesAPI } from '../../services/api';

const ConsultEspace = ({ espace, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDetails();
    }, [espace]);

    const loadDetails = async () => {
        try {
            setLoading(true);
            const res = await espacesPedagogiquesAPI.getEspaceDetails(espace.id_espace);
            setDetails(res.data);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les détails de l'espace");
        } finally {
            setLoading(false);
        }
    };

    if (!espace) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2>Détails : {espace.nom_matiere}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="text-center p-4">Chargement des statistiques...</div>
                    ) : error ? (
                        <div className="alert alert-error">{error}</div>
                    ) : (
                        <div className="space-details">
                            {/* Info Générale */}
                            <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Promotion</h4>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{details.info.promotion}</p>
                                    <small>{details.info.filiere}</small>
                                </div>
                                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Formateur</h4>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{details.info.formateur}</p>
                                </div>
                                <div className="card" style={{ padding: '1rem', backgroundColor: '#f8fafc' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>Code d'accès</h4>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', fontFamily: 'monospace' }}>{details.info.code_acces}</p>
                                </div>
                            </div>

                            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BarChart2 size={20} /> Statistiques
                            </h3>

                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <Users size={24} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{details.statistiques.nb_etudiants}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Étudiants</div>
                                </div>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <BookOpen size={24} color="#8b5cf6" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{details.statistiques.nb_travaux}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Devoirs</div>
                                </div>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <Award size={24} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{details.statistiques.moyenne_generale}/20</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Moyenne</div>
                                </div>
                                <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <BarChart2 size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{details.statistiques.taux_completion}%</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Complétion</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                <h4 style={{ marginBottom: '0.5rem' }}>Description</h4>
                                <p style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '6px' }}>
                                    {details.info.description || "Aucune description fournie."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultEspace;
