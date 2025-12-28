# GUIDE DE COLLABORATION ET DE RECONSTRUCTION DU PROJET (SIMULATION GROUPE)

Ce document est conçu pour aider votre équipe à reconstruire le projet brique par brique sur un dépôt Git propre, en simulant un développement collaboratif où chaque membre implémente sa "User Story".

## 🚀 PHASE 0 : LE SOCLE COMMUN (À faire par le "Chef de Projet" - Vous)

Avant que les autres ne commencent, vous devez mettre en place la structure de base.

**1. Initialisation du projet :**
*   Créez le dossier racine et le dépôt Git.
*   Copiez les fichiers de configuration : `requirements.txt`, `package.json`, `.gitignore`.
*   Copiez l'arborescence des dossiers (`back/`, `front-react/`).

**2. Le Backend (Base & Authentification) :**
*   **Structure BDD :** Copiez `back/database/database.py` et `back/models.py`. C'est le squelette commun obligatoire.
*   **Sécurité & Auth :** Copiez `back/core/auth.py`, `back/core/jwt.py` et `back/core/security.py`. Ce sont les outils pour crypter les mots de passe et générer les tokens.
*   **Service Email :** Copiez `back/utils/email_service.py`. Ce fichier gère l'envoi des mails (comptes, notifs). Sans lui, la création d'utilisateur plantera.
*   **Route de Connexion :** Copiez `back/routes/auth.py`. C'est **indispensable** pour que n'importe qui puisse se connecter. Sans ça, personne ne peut tester son travail.
*   **Initialisation (Le compte DE) :** Copiez `back/seed_data.py` et assurez-vous que `back/main.py` l'appelle au démarrage.
    *   *Pourquoi ?* C'est ce script qui va créer le compte **Directeur (admin@ecole.com / admin123)** dès le premier lancement. Sans ce compte, personne ne peut accéder au Dashboard pour créer les autres acteurs.
*   **Main :** Copiez `back/main.py` pour lancer le serveur.

**3. Le Frontend (Base UI & Login) :**
*   Copiez la structure de base + `components/Login.jsx` + `Login.css`.
*   Assurez-vous que la page de connexion marche et permet de se loguer avec le compte DE créé juste avant.
*   Une fois que vous (Chef de projet) arrivez à vous connecter et voir un Dashboard vide, **Phase 0 terminée**. Les autres peuvent commencer.

---

## 👷‍♂️ PHASE 1 : RÉPARTITION PAR USER STORY (Membres du groupe)

Chaque membre doit cloner le repo, créer une branche (ex: `feature/us-2.1-create-formateur`), faire ses modifs, et push.

### 👤 MEMBRE A : Création de Compte Formateur (US 2.1)
**Objectif :** "En tant que DE, je veux créer un compte formateur."

---

#### ÉTAPE 1 : Backend - Créer le fichier de routes

**Fichier :** `back/routes/gestion_comptes.py`

**Action :** Créez ce fichier et collez le code suivant :

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any

from database.database import get_db
from models import Utilisateur, Formateur, Etudiant, Promotion, Filiere, Matiere, RoleEnum, StatutEtudiantEnum
import models
from core.auth import get_password_hash as hash_password, get_current_user
from utils.generators import (
    generer_identifiant_unique, 
    generer_mot_de_passe_aleatoire, 
    generer_token_activation,
    generer_matricule_unique,
    generer_numero_employe
)
from utils.email_service import email_service

router = APIRouter(prefix="/api/gestion-comptes", tags=["Gestion des comptes"])

# Schémas Pydantic pour la validation
from pydantic import BaseModel, EmailStr

class FormateurCreate(BaseModel):
    email: EmailStr
    nom: str
    prenom: str
    id_matiere: str = None

@router.post("/creer-formateur", status_code=status.HTTP_201_CREATED)
async def creer_compte_formateur(
    formateur_data: FormateurCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Route pour créer un compte formateur (réservée au DE)"""
    
    # Vérifier que l'utilisateur actuel est un DE
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un Directeur d'Établissement peut créer des comptes formateurs"
        )
    
    # 1. Validation des données
    # Vérifier si l'email existe déjà
    email_existant = db.query(Utilisateur).filter(Utilisateur.email == formateur_data.email).first()
    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    # 2. Génération automatique
    identifiant = generer_identifiant_unique("FORMATEUR")
    mot_de_passe = generer_mot_de_passe_aleatoire()
    id_formateur = generer_identifiant_unique("FORMATEUR")
    numero_employe = generer_numero_employe()
    
    # 3. Création utilisateur (actif avec mot de passe temporaire)
    nouvel_utilisateur = Utilisateur(
        identifiant=identifiant,
        email=formateur_data.email,
        mot_de_passe=hash_password(mot_de_passe),
        nom=formateur_data.nom,
        prenom=formateur_data.prenom,
        role=RoleEnum.FORMATEUR,
        actif=True,
        token_activation=None,
        date_expiration_token=None,
        mot_de_passe_temporaire=True
    )
    
    # 4. Création formateur
    nouveau_formateur = Formateur(
        id_formateur=id_formateur,
        identifiant=identifiant,
        numero_employe=numero_employe,
        id_matiere=formateur_data.id_matiere
    )
    
    # 5. Sauvegarde en base
    try:
        db.add(nouvel_utilisateur)
        db.add(nouveau_formateur)
        db.commit()
        db.refresh(nouvel_utilisateur)
        db.refresh(nouveau_formateur)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du compte: {str(e)}"
        )
    
    # 6. Envoi email avec identifiants
    email_envoye = email_service.envoyer_email_creation_compte(
        destinataire=formateur_data.email,
        prenom=formateur_data.prenom,
        email=formateur_data.email,
        mot_de_passe=mot_de_passe,
        role="FORMATEUR"
    )
    
    return {
        "message": "Compte formateur créé avec succès",
        "email_envoye": email_envoye,
        "identifiant": identifiant,
        "id_formateur": id_formateur
    }

@router.get("/formateurs")
async def lister_formateurs(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Liste tous les formateurs disponibles"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un DE peut accéder à cette information"
        )
    
    formateurs = db.query(Formateur).join(Utilisateur).all()
    
    return {
        "formateurs": [
            {
                "id_formateur": f.id_formateur,
                "nom": f.utilisateur.nom,
                "prenom": f.utilisateur.prenom,
                "email": f.utilisateur.email,
                "id_matiere": f.id_matiere,
                "nom_matiere": f.matiere.nom_matiere if f.matiere else None,
                "numero_employe": f.numero_employe
            } for f in formateurs
        ]
    }

@router.get("/filieres")
async def lister_filieres(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Liste toutes les formations disponibles"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un DE peut accéder à cette information"
        )
    
    filieres = db.query(Filiere).all()
    
    return {
        "filieres": [
            {
                "id_filiere": f.id_filiere,
                "nom_filiere": f.nom_filiere,
                "description": f.description
            } for f in filieres
        ]
    }

@router.get("/matieres")
async def lister_matieres(
    id_filiere: str = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Liste toutes les matières, optionnellement filtrées par filière"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un DE peut accéder à cette information"
        )
    
    query = db.query(models.Matiere)
    if id_filiere:
        query = query.filter(models.Matiere.id_filiere == id_filiere)
        
    matieres = query.all()
    
    return {
        "matieres": [
            {
                "id_matiere": m.id_matiere,
                "nom_matiere": m.nom_matiere,
                "id_filiere": m.id_filiere
            } for m in matieres
        ]
    }
```

---

#### ÉTAPE 2 : Activation Backend dans `main.py`

**Fichier :** `back/main.py`

**Action :** Ajoutez ces lignes après l'import de `auth` :

```python
# Inclure les routes de gestion des comptes
from routes import gestion_comptes
app.include_router(gestion_comptes.router)
```

**Votre `main.py` devrait ressembler à ça :**
```python
from routes import auth
from routes import gestion_comptes  # ← AJOUTEZ CETTE LIGNE

# ... (autres imports)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(gestion_comptes.router)  # ← AJOUTEZ CETTE LIGNE
```

---

#### ÉTAPE 3 : Frontend - Formulaire de création

**Fichier :** `front-react/src/components/forms/CreateFormateur.jsx`

**Action :** Créez ce fichier et collez le code complet du fichier `front-a-copier/src/components/forms/CreateFormateur.jsx` (216 lignes).

**Fichier :** `front-react/src/components/forms/CreateFormateur.css`

**Action :** Créez ce fichier et collez le code complet du fichier `front-a-copier/src/components/forms/CreateFormateur.css` (199 lignes).

---

#### ÉTAPE 4 : Intégration dans le Dashboard

**Fichier :** `front-react/src/components/dashboards/DEDashboard.jsx`

**Action 1 :** Ajoutez l'import en haut du fichier :
```jsx
import CreateFormateur from '../forms/CreateFormateur';
```

**Action 2 :** Dans la fonction `renderDashboard`, ajoutez le bouton dans la section `dashboard-actions` :
```jsx
<button className="btn btn-primary" onClick={() => setActiveModal('formateur')}>
    <UserPlus size={18} /> Nouveau Formateur
</button>
```

**Action 3 :** En bas du fichier, dans le `return` principal, ajoutez le modal :
```jsx
{activeModal === 'formateur' && <CreateFormateur onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}
```

---

✅ **C'est terminé !** Vous pouvez maintenant tester la création de formateurs depuis le Dashboard DE.

---

### 🎓 MEMBRE B : Création de Compte Étudiant (US 2.2)
**Objectif :** "En tant que DE, je veux ajouter un étudiant dans une promotion afin que ses informations soient enregistrées dans le système et qu'il puisse accéder aux travaux concernant sa promotion."

---

#### ÉTAPE 1 : Backend - Ajouter la route dans `gestion_comptes.py`

**Fichier :** `back/routes/gestion_comptes.py`

**Action :** Ajoutez ce code **à la fin** du fichier `gestion_comptes.py` (après les routes du formateur) :

```python
class EtudiantCreate(BaseModel):
    email: EmailStr
    nom: str
    prenom: str
    id_promotion: str

@router.post("/creer-etudiant", status_code=status.HTTP_201_CREATED)
async def creer_compte_etudiant(
    etudiant_data: EtudiantCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Route pour créer un compte étudiant (réservée au DE)"""
    
    # Vérifier que l'utilisateur actuel est un DE
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un Directeur d'Établissement peut créer des comptes étudiants"
        )
    
    # 1. Validation des données
    email_existant = db.query(Utilisateur).filter(Utilisateur.email == etudiant_data.email).first()
    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    # Vérifier que la promotion existe
    promotion = db.query(Promotion).filter(Promotion.id_promotion == etudiant_data.id_promotion).first()
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion introuvable"
        )
    
    # 2. Génération automatique
    identifiant = generer_identifiant_unique("ETUDIANT")
    mot_de_passe = generer_mot_de_passe_aleatoire()
    id_etudiant = generer_identifiant_unique("ETUDIANT")
    matricule = generer_matricule_unique()
    
    # 3. Création utilisateur
    nouvel_utilisateur = Utilisateur(
        identifiant=identifiant,
        email=etudiant_data.email,
        mot_de_passe=hash_password(mot_de_passe),
        nom=etudiant_data.nom,
        prenom=etudiant_data.prenom,
        role=RoleEnum.ETUDIANT,
        actif=True,
        token_activation=None,
        date_expiration_token=None,
        mot_de_passe_temporaire=True
    )
    
    # 4. Création étudiant
    nouvel_etudiant = Etudiant(
        id_etudiant=id_etudiant,
        identifiant=identifiant,
        matricule=matricule,
        id_promotion=promotion.id_promotion,
        date_inscription=datetime.utcnow().date(),
        statut=StatutEtudiantEnum.ACTIF
    )
    
    # 5. Sauvegarde en base
    try:
        db.add(nouvel_utilisateur)
        db.add(nouvel_etudiant)
        db.commit()
        db.refresh(nouvel_utilisateur)
        db.refresh(nouvel_etudiant)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du compte: {str(e)}"
        )
    
    # 6. Envoi email avec identifiants
    email_envoye = email_service.envoyer_email_creation_compte(
        destinataire=etudiant_data.email,
        prenom=etudiant_data.prenom,
        email=etudiant_data.email,
        mot_de_passe=mot_de_passe,
        role="ETUDIANT"
    )
    
    return {
        "message": "Compte étudiant créé avec succès",
        "email_envoye": email_envoye,
        "identifiant": identifiant,
        "id_etudiant": id_etudiant,
        "matricule": matricule
    }

@router.get("/promotions")
async def lister_promotions(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Liste toutes les promotions existantes"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un DE peut accéder à cette information"
        )
    
    promotions = db.query(Promotion).all()
    
    return {
        "promotions": [
            {
                "id_promotion": p.id_promotion,
                "libelle": p.libelle,
                "annee_academique": p.annee_academique,
                "id_filiere": p.id_filiere,
                "filiere": p.filiere.nom_filiere if p.filiere else None,
                "date_debut": p.date_debut.isoformat(),
                "date_fin": p.date_fin.isoformat()
            } for p in promotions
        ],
        "total": len(promotions)
    }
```

**Note :** Pas besoin de modifier `main.py`, le router `gestion_comptes` est déjà activé !

---

#### ÉTAPE 2 : Frontend - Formulaire de création

**Fichier :** `front-react/src/components/forms/CreateEtudiant.jsx`

**Action :** Créez ce fichier et collez le code suivant :

```jsx
import { useState, useEffect } from 'react';
import { X, User, Mail, Calendar } from 'lucide-react';
import { gestionComptesAPI } from '../../services/api';
import './CreateFormateur.css';

const CreateEtudiant = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    id_promotion: ''
  });
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const response = await gestionComptesAPI.getPromotions();
      setPromotions(response.data.promotions);
    } catch (err) {
      setError('Impossible de charger les promotions');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await gestionComptesAPI.createEtudiant(formData);
      setSuccess('Étudiant créé avec succès !');
      setTimeout(onSuccess, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Créer un compte étudiant</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label><Mail size={16} /> Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><User size={16} /> Nom</label>
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><User size={16} /> Prénom</label>
              <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label><Calendar size={16} /> Promotion</label>
            <select name="id_promotion" value={formData.id_promotion} onChange={handleChange} required>
              <option value="">Sélectionner une promotion</option>
              {promotions.map(p => <option key={p.id_promotion} value={p.id_promotion}>{p.libelle}</option>)}
            </select>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'étudiant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEtudiant;
```

**Fichier CSS :** Ce composant réutilise `CreateFormateur.css`.

---

#### ÉTAPE 3 : Intégration dans le Dashboard

**Fichier :** `front-react/src/components/dashboards/DEDashboard.jsx`

**Actions :**
1. Importer : `import CreateEtudiant from '../forms/CreateEtudiant';`
2. Ajouter le bouton "Nouvel Étudiant" dans `header-actions`.
3. Ajouter le modal en bas du fichier : `{activeModal === 'etudiant' && <CreateEtudiant onClose={() => setActiveModal(null)} onSuccess={handleCreateSuccess} />}`

---

✅ **C'est terminé !** L'étudiant peut maintenant être créé.

---

### 📅 MEMBRE C : Création de Promotion (US 2.3)
**Objectif :** "En tant que DE, je veux créer une promotion pour une année académique."

---

#### ÉTAPE 1 : Backend - Ajouter la route dans `gestion_comptes.py`

**Fichier :** `back/routes/gestion_comptes.py`

**Action :** Ajoutez ce code **à la fin** du fichier (après la route de création d'étudiant) :

```python
from utils.promotion_generator import (
    generer_promotion_automatique,
    valider_annee_academique,
    lister_annees_disponibles,
    lister_promotions_existantes
)

class PromotionCreate(BaseModel):
    id_filiere: str
    annee_academique: str  # Format "YYYY-YYYY"

@router.post("/creer-promotion", status_code=status.HTTP_201_CREATED)
async def creer_promotion(
    data: PromotionCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer une nouvelle promotion manuellement (DE)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")

    # Valider année
    if not valider_annee_academique(data.annee_academique):
        raise HTTPException(status_code=400, detail="Format année invalide (YYYY-YYYY)")

    # Vérifier filière
    filiere = db.query(Filiere).filter(Filiere.id_filiere == data.id_filiere).first()
    if not filiere:
        raise HTTPException(status_code=404, detail="Filière non trouvée")

    # Vérifier existence
    exists = db.query(Promotion).filter(
        Promotion.id_filiere == data.id_filiere,
        Promotion.annee_academique == data.annee_academique
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Cette promotion existe déjà")

    # Dates par défaut (Sept - Juin)
    try:
        y1, y2 = map(int, data.annee_academique.split("-"))
        date_debut = datetime(y1, 9, 1)
        date_fin = datetime(y2, 6, 30)
    except:
        raise HTTPException(status_code=400, detail="Erreur calcul dates")

    promotion = Promotion(
        id_promotion=generer_identifiant_unique("PROMO"),
        id_filiere=data.id_filiere,
        annee_academique=data.annee_academique,
        libelle=f"Promotion {data.annee_academique} - {filiere.nom_filiere}",
        date_debut=date_debut,
        date_fin=date_fin
    )
    db.add(promotion)
    db.commit()

    return {"message": "Promotion créée avec succès", "id_promotion": promotion.id_promotion}
```

**Note :** Pas besoin de modifier `main.py`, le router est déjà activé !

---

#### ÉTAPE 2 : Frontend - Formulaire de création

**Fichier :** `front-react/src/components/forms/CreatePromotion.jsx`

**Action :** Créez ce fichier et collez le code complet du fichier `front-a-copier/src/components/forms/CreatePromotion.jsx` (117 lignes).

**Fichier CSS :** Réutilise `CreateFormateur.css`.

---

#### ÉTAPE 3 : Intégration dans le Dashboard

**Fichier :** `front-react/src/components/dashboards/DEDashboard.jsx`

**Action 1 :** Ajoutez l'import :
```jsx
import CreatePromotion from '../forms/CreatePromotion';
```

**Action 2 :** Ajoutez le bouton :
```jsx
<button className="btn btn-purple" onClick={() => setActiveModal('promotion')}>
    <Plus size={18} /> Nouvelle Promotion
</button>
```

**Action 3 :** Ajoutez le modal :
```jsx
{activeModal === 'promotion' && (
    <CreatePromotion 
        onClose={() => setActiveModal(null)} 
        onSuccess={handleCreateSuccess} 
    />
)}
```

---

### 🏫 MEMBRE D : Création Espace Pédagogique (US 3.1)
**Objectif :** "En tant que DE, je veux créer un espace pédagogique vide pour une matière et une promotion."

#### ÉTAPE 1 : Backend - Créer `back/routes/espaces_pedagogiques.py`

**Action :** Créez ce **nouveau fichier** et ajoutez :

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import secrets

from database.database import get_db
from models import Utilisateur, EspacePedagogique, Matiere, Promotion, RoleEnum
from core.auth import get_current_user
from utils.generators import generer_identifiant_unique

router = APIRouter(prefix="/api/espaces-pedagogiques", tags=["Espaces"])

class EspacePedagogiqueCreate(BaseModel):
    id_promotion: str
    id_matiere: str
    description: Optional[str] = None

@router.post("/creer")
async def creer_espace_pedagogique(
    data: EspacePedagogiqueCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer un espace pédagogique (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")
    
    # Vérifications
    matiere = db.query(Matiere).filter(Matiere.id_matiere == data.id_matiere).first()
    if not matiere:
        raise HTTPException(status_code=404, detail="Matière non trouvée")
    
    promotion = db.query(Promotion).filter(Promotion.id_promotion == data.id_promotion).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion non trouvée")
    
    # Créer l'espace
    espace = EspacePedagogique(
        id_espace=generer_identifiant_unique("ESPACE"),
        id_promotion=data.id_promotion,
        id_matiere=data.id_matiere,
        description=data.description,
        code_acces=secrets.token_urlsafe(6).upper(),
        date_creation=datetime.utcnow()
    )
    
    db.add(espace)
    db.commit()
    
    return {"message": "Espace créé avec succès", "id_espace": espace.id_espace}

@router.get("/liste")
async def lister_espaces_pedagogiques(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister tous les espaces (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")
    
    espaces = db.query(EspacePedagogique).all()
    return {
        "espaces": [
            {
                "id_espace": e.id_espace,
                "id_promotion": e.id_promotion,
                "nom_matiere": e.matiere.nom_matiere,
                "promotion": e.promotion.libelle,
                "formateur": f"{e.formateur.utilisateur.prenom} {e.formateur.utilisateur.nom}" if e.formateur else "Non assigné",
                "code_acces": e.code_acces
            } for e in espaces
        ]
    }
```

#### ÉTAPE 2 : Activation dans `main.py`

```python
from routes import espaces_pedagogiques
app.include_router(espaces_pedagogiques.router)
```

#### ÉTAPE 3 : Frontend

**Fichier :** Copiez `front-a-copier/src/components/forms/CreateEspacePedagogique.jsx` → `front-react/src/components/forms/CreateEspacePedagogique.jsx`

**Intégration Dashboard :** Ajoutez import, bouton et modal dans `DEDashboard.jsx`.

---

### ⚙️ MEMBRE E : Assignation Formateur à un Espace (US 3.2)
**Objectif :** "En tant que DE, je veux assigner un formateur à un espace pédagogique."

#### ÉTAPE 1 : Backend - Ajouter dans `espaces_pedagogiques.py`

**Action :** Ajoutez à la fin du fichier :

```python
from models import Formateur

class AssignFormateurRequest(BaseModel):
    id_formateur: Optional[str] = None

@router.put("/{id_espace}/formateur")
async def assigner_formateur_espace(
    id_espace: str,
    data: AssignFormateurRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Assigner/retirer un formateur (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")

    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")
        
    if data.id_formateur:
        formateur = db.query(Formateur).filter(Formateur.id_formateur == data.id_formateur).first()
        if not formateur:
            raise HTTPException(status_code=404, detail="Formateur non trouvé")
        espace.id_formateur = data.id_formateur
    else:
        espace.id_formateur = None

    db.commit()
    return {"message": "Formateur mis à jour"}
```

---

### 👥 MEMBRE F : Ajout Étudiants à un Espace (US 3.3)
**Objectif :** "En tant que DE, je veux ajouter des étudiants à un espace pédagogique."

#### ÉTAPE 1 : Backend - Ajouter dans `espaces_pedagogiques.py`

```python
from models import Etudiant, Inscription
from typing import List

class AddEtudiantsRequest(BaseModel):
    etudiants_ids: List[str]

@router.post("/{id_espace}/etudiants")
async def ajouter_etudiants_espace(
    id_espace: str,
    data: AddEtudiantsRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Ajouter des étudiants (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")

    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")

    count = 0
    for id_etudiant in data.etudiants_ids:
        exists = db.query(Inscription).filter(
            Inscription.id_espace == id_espace,
            Inscription.id_etudiant == id_etudiant
        ).first()
        
        if not exists:
            inscription = Inscription(
                id_inscription=generer_identifiant_unique("INS"),
                id_espace=id_espace,
                id_etudiant=id_etudiant,
                date_inscription=datetime.utcnow()
            )
            db.add(inscription)
            count += 1
    
    db.commit()
    return {"message": f"{count} étudiants ajoutés"}

@router.get("/promotion/{id_promotion}/etudiants")
async def lister_etudiants_candidats(
    id_promotion: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister étudiants d'une promotion (DE)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")
        
    etudiants = db.query(Etudiant).filter(Etudiant.id_promotion == id_promotion).all()
    return {
        "etudiants": [
            {
                "id_etudiant": e.id_etudiant,
                "nom": e.utilisateur.nom,
                "prenom": e.utilisateur.prenom,
                "email": e.utilisateur.email
            } for e in etudiants if e.utilisateur
        ]
    }
```

#### ÉTAPE 2 : Frontend (US 3.2 & 3.3 partagent le même composant)

**Fichier :** `front-react/src/components/forms/ManageEspace.jsx`

**Action :** Créez ce fichier et collez le code suivant :

```jsx
import { useState, useEffect } from 'react';
import { X, Users, UserPlus, Check } from 'lucide-react';
import { espacesPedagogiquesAPI, gestionComptesAPI } from '../../services/api';
import './CreateFormateur.css';

const ManageEspace = ({ espace, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('etudiants');
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [formateurs, setFormateurs] = useState([]);
    const [selectedFormateur, setSelectedFormateur] = useState(espace.id_formateur || '');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoadingData(true);
        try {
            if (activeTab === 'etudiants') {
                const res = await espacesPedagogiquesAPI.listerEtudiantsCandidats(espace.id_promotion);
                setAllStudents(res.data.etudiants);
            } else {
                const res = await gestionComptesAPI.getFormateurs();
                setFormateurs(res.data.formateurs);
            }
        } catch (err) {
            setError("Erreur chargement données");
        } finally {
            setLoadingData(false);
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
            setSuccess("Étudiants ajoutés !");
            setTimeout(onSuccess, 1500);
        } catch (err) { setError("Erreur ajout"); } finally { setLoading(false); }
    };

    const handleAssignFormateur = async () => {
        setLoading(true);
        try {
            await espacesPedagogiquesAPI.assignerFormateur(espace.id_espace, selectedFormateur);
            setSuccess("Formateur assigné !");
            setTimeout(onSuccess, 1500);
        } catch (err) { setError("Erreur assignation"); } finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Gérer : {espace.nom_matiere}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                    <button className={`btn ${activeTab === 'etudiants' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('etudiants')}>Étudiants</button>
                    <button className={`btn ${activeTab === 'formateur' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('formateur')}>Formateur</button>
                </div>
                <div className="modal-body">
                    {activeTab === 'etudiants' ? (
                        <div>
                            <div className="student-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee' }}>
                                {allStudents.map(s => (
                                    <div key={s.id_etudiant} onClick={() => handleToggleStudent(s.id_etudiant)} style={{ padding: '8px', cursor: 'pointer', display: 'flex', gap: '10px' }}>
                                        <div style={{ width: '16px', height: '16px', border: '1px solid #ccc', backgroundColor: selectedStudents.has(s.id_etudiant) ? '#3b82f6' : 'white' }}>
                                            {selectedStudents.has(s.id_etudiant) && <Check size={12} color="white" />}
                                        </div>
                                        {s.nom} {s.prenom}
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-success p-2 mt-2 w-full" onClick={handleAddStudents} disabled={loading}>{loading ? 'Ajout...' : 'Ajouter la sélection'}</button>
                        </div>
                    ) : (
                        <div>
                            <select value={selectedFormateur} onChange={(e) => setSelectedFormateur(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                                <option value="">-- Non assigné --</option>
                                {formateurs.map(f => <option key={f.id_formateur} value={f.id_formateur}>{f.prenom} {f.nom}</option>)}
                            </select>
                            <button className="btn btn-primary p-2 mt-2 w-full" onClick={handleAssignFormateur} disabled={loading}>Enregistrer</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageEspace;
```

**Intégration Dashboard :** Ajoutez le bouton "Gérer" dans `renderEspaces` et configurez le modal correspondant.

---

### 📊 MEMBRE G : Consultation et Statistiques (US 3.5)
**Objectif :** "En tant que DE, je veux consulter les détails et statistiques d'un espace."

#### ÉTAPE 1 : Backend - Ajouter dans `espaces_pedagogiques.py`

```python
from models import Travail, Assignation, StatutAssignationEnum

@router.get("/{id_espace}/details")
async def obtenir_details_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Détails et stats d'un espace (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")
    
    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")
        
    nb_etudiants = db.query(Inscription).filter(Inscription.id_espace == id_espace).count()
    nb_travaux = db.query(Travail).filter(Travail.id_espace == id_espace).count()
    
    return {
        "info": {
            "nom_matiere": espace.matiere.nom_matiere,
            "promotion": espace.promotion.libelle,
            "code_acces": espace.code_acces,
            "formateur": f"{espace.formateur.utilisateur.prenom} {espace.formateur.utilisateur.nom}" if espace.formateur else "Non assigné"
        },
        "statistiques": {
            "nb_etudiants": nb_etudiants,
            "nb_travaux": nb_travaux,
            "moyenne_generale": 0,
            "taux_completion": 0
        }
    }
```

#### ÉTAPE 2 : Frontend

**Fichier :** `front-react/src/components/dashboards/ConsultEspace.jsx`

**Action :** Créez ce fichier et collez le code suivant :

```jsx
import { useState, useEffect } from 'react';
import { X, BarChart2 } from 'lucide-react';
import { espacesPedagogiquesAPI } from '../../services/api';

const ConsultEspace = ({ espace, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadDetails(); }, [espace]);

    const loadDetails = async () => {
        try {
            const res = await espacesPedagogiquesAPI.getEspaceDetails(espace.id_espace);
            setDetails(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    if (loading) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Statistiques : {espace.nom_matiere}</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="stat-card" style={{ padding: '1rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{details.statistiques.nb_etudiants}</div>
                            <small>Etudiants</small>
                        </div>
                        <div className="stat-card" style={{ padding: '1rem', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{details.statistiques.nb_travaux}</div>
                            <small>Travaux</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultEspace;
```

---

✅ **Toutes les User Stories sont maintenant documentées !**
