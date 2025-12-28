import { useState, useEffect } from 'react';
import { X, Users, UserPlus, GraduationCap, Check, Search } from 'lucide-react';
import { espacesPedagogiquesAPI, gestionComptesAPI } from '../../services/api';
import './CreateFormateur.css'; // Shared styles

const ManageEspace = ({ espace, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('etudiants'); // 'etudiants' | 'formateur'

    // State for Students
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [loadingStudents, setLoadingStudents] = useState(true);

    // State for Formateur
    const [formateurs, setFormateurs] = useState([]);
    const [selectedFormateur, setSelectedFormateur] = useState(espace.formateur_id || ''); // Logic depends on how espace data is passed

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load students from the promotion linked to the espace
    useEffect(() => {
        if (activeTab === 'etudiants') {
            loadStudents();
        } else {
            loadFormateurs();
        }
    }, [activeTab]);

    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            // We need the promotion ID of the espace. 
            // Assuming espace object contains promotion_id or we need to fetch it.
            // The dashboard list usually has 'promotion' name, but maybe not ID.
            // Let's assume we pass the FULL espace object including an ID we can use or we fetch details.
            // Actually, backend 'lister_promotions' or similar might be needed.
            // Wait, lister_students_candidats takes promotion ID. 
            // Does 'espace' object have promotion ID?
            // In DEDashboard, we might need to ensure we have it.
            // If not, we might need to fetch espace details first.

            // Quick fix: user said "Select Promo -> List Students".
            // But the espace IS linked to a promotion. So we should list students of THAT promotion.
            // Let's check DEDashboard data structure.

            // Assuming espace has `id_promotion` available somehow, or we use `promotion` string to find it? No, unsafe.
            // I will assume `espace` prop has `id_promotion`. If not, I'll need to fix dashboard to include it.

            if (espace.id_promotion) {
                const res = await espacesPedagogiquesAPI.listerEtudiantsCandidats(espace.id_promotion);
                setAllStudents(res.data.etudiants);
            } else {
                setError("Impossible de récupérer la promotion de cet espace.");
            }
        } catch (err) {
            console.error(err);
            setError("Erreur chargement étudiants");
        } finally {
            setLoadingStudents(false);
        }
    };

    const loadFormateurs = async () => {
        try {
            const res = await gestionComptesAPI.getFormateurs();
            setFormateurs(res.data.formateurs);
        } catch (err) {
            setError("Erreur chargement formateurs");
        }
    };

    const handleToggleStudent = (id) => {
        const newSet = new Set(selectedStudents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudents(newSet);
    };

    const handleAddStudents = async () => {
        setLoading(true);
        try {
            await espacesPedagogiquesAPI.ajouterEtudiants(espace.id_espace, Array.from(selectedStudents));
            setSuccess(`${selectedStudents.size} étudiants ajoutés avec succès`);
            setTimeout(onSuccess, 1500);
        } catch (err) {
            setError("Erreur lors de l'ajout");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignFormateur = async () => {
        setLoading(true);
        try {
            await espacesPedagogiquesAPI.assignerFormateur(espace.id_espace, selectedFormateur);
            setSuccess("Formateur assigné avec succès");
            setTimeout(onSuccess, 1500);
        } catch (err) {
            setError("Erreur lors de l'assignation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h2>Gérer l'espace: {espace.nom_matiere}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                    <button
                        className={`btn ${activeTab === 'etudiants' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('etudiants')}
                    >
                        <Users size={16} /> Ajouter Étudiants
                    </button>
                    <button
                        className={`btn ${activeTab === 'formateur' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('formateur')}
                    >
                        <UserPlus size={16} /> Assigner Formateur
                    </button>
                </div>

                <div className="modal-body">
                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {activeTab === 'etudiants' && (
                        <div>
                            <p className="mb-2">Sélectionnez les étudiants de la promotion <strong>{espace.promotion}</strong> à inscrire :</p>
                            {loadingStudents ? (
                                <div>Chargement...</div>
                            ) : (
                                <div className="student-list" style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '4px' }}>
                                    {allStudents.length === 0 ? (
                                        <div className="p-4 text-center">Aucun étudiant trouvé dans cette promotion</div>
                                    ) : (
                                        allStudents.map(student => (
                                            <div key={student.id_etudiant}
                                                onClick={() => handleToggleStudent(student.id_etudiant)}
                                                style={{
                                                    padding: '8px',
                                                    borderBottom: '1px solid #f0f0f0',
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedStudents.has(student.id_etudiant) ? '#f0f9ff' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px'
                                                }}
                                            >
                                                <div style={{
                                                    width: '16px', height: '16px',
                                                    border: '1px solid #ccc', borderRadius: '3px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: selectedStudents.has(student.id_etudiant) ? '#3b82f6' : 'white'
                                                }}>
                                                    {selectedStudents.has(student.id_etudiant) && <Check size={12} color="white" />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '500' }}>{student.nom} {student.prenom}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{student.email}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                                <span className="mr-2">{selectedStudents.size} sélectionné(s)</span>
                                <button className="btn btn-success" onClick={handleAddStudents} disabled={loading || selectedStudents.size === 0}>
                                    {loading ? 'Ajout...' : 'Ajouter la sélection'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'formateur' && (
                        <div>
                            <label className="block mb-2">Choisir un formateur :</label>
                            <select
                                className="form-select"
                                value={selectedFormateur}
                                onChange={(e) => setSelectedFormateur(e.target.value)}
                                style={{ width: '100%', padding: '8px', marginBottom: '1rem' }}
                            >
                                <option value="">-- Non assigné --</option>
                                {formateurs
                                    .filter(f => {
                                        if (!f.nom_matiere) return true; // Formateur sans matière spécifique = dispo partout
                                        if (!espace.nom_matiere) return true; // Espace sans matière = tout le monde
                                        return f.nom_matiere.toLowerCase() === espace.nom_matiere.toLowerCase();
                                    })
                                    .map(f => (
                                        <option key={f.id_formateur} value={f.id_formateur}>
                                            {f.prenom} {f.nom} ({f.nom_matiere || 'N/A'})
                                        </option>
                                    ))}
                            </select>
                            <div style={{ textAlign: 'right' }}>
                                <button className="btn btn-primary" onClick={handleAssignFormateur} disabled={loading}>
                                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageEspace;
