from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.background import BackgroundTasks as FastBackgroundTasks  # Pour être sûr
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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Route pour créer un compte formateur (réservée au DE)"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un Directeur d'Établissement peut créer des comptes formateurs"
        )
    
    email_existant = db.query(Utilisateur).filter(Utilisateur.email == formateur_data.email).first()
    if email_existant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email est déjà utilisé"
        )
    
    identifiant = generer_identifiant_unique("FORMATEUR")
    mot_de_passe = generer_mot_de_passe_aleatoire()
    id_formateur = generer_identifiant_unique("FORMATEUR")
    numero_employe = generer_numero_employe()
    
    nouvel_utilisateur = Utilisateur(
        identifiant=identifiant,
        email=formateur_data.email,
        mot_de_passe=hash_password(mot_de_passe),
        nom=formateur_data.nom,
        prenom=formateur_data.prenom,
        role=RoleEnum.FORMATEUR,
        actif=True,
        mot_de_passe_temporaire=True
    )
    
    nouveau_formateur = Formateur(
        id_formateur=id_formateur,
        identifiant=identifiant,
        numero_employe=numero_employe,
        id_matiere=formateur_data.id_matiere
    )
    
    try:
        db.add(nouvel_utilisateur)
        db.add(nouveau_formateur)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    # Tracé pour le débogage en production
    print(f"DEBUG: Planification de l'envoi d'email pour {formateur_data.email}...", flush=True)
    
    # Envoi de l'email en tâche de fond pour ne pas bloquer l'interface
    background_tasks.add_task(
        email_service.envoyer_email_creation_compte,
        destinataire=formateur_data.email,
        prenom=formateur_data.prenom,
        email=formateur_data.email,
        mot_de_passe=mot_de_passe,
        role="FORMATEUR"
    )
    
    return {"message": "Succès", "identifiant": identifiant, "version": "v1.2-background-fix"}


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
    
    promotions = db.query(Promotion).join(Filiere).all()
    
    return {
        "promotions": [
            {
                "id_promotion": p.id_promotion,
                "libelle": p.libelle,
                "annee_academique": p.annee_academique,
                "id_filiere": p.id_filiere,
                "filiere": p.filiere.nom_filiere if p.filiere else "N/A"
            } for p in promotions
        ],
        "total": len(promotions)
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
    
    query = db.query(Matiere)
    if id_filiere:
        query = query.filter(Matiere.id_filiere == id_filiere)
        
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
                "nom_matiere": f.matiere.nom_matiere if f.matiere else None
            } for f in formateurs
        ]
    }

class EtudiantCreate(BaseModel):
    email: EmailStr
    nom: str
    prenom: str
    id_promotion: str

@router.post("/creer-etudiant", status_code=status.HTTP_201_CREATED)
async def creer_compte_etudiant(
    etudiant_data: EtudiantCreate,
    background_tasks: BackgroundTasks,
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
    
    # 6. Envoi email avec identifiants en tâche de fond
    background_tasks.add_task(
        email_service.envoyer_email_creation_compte,
        destinataire=etudiant_data.email,
        prenom=etudiant_data.prenom,
        email=etudiant_data.email,
        mot_de_passe=mot_de_passe,
        role="ETUDIANT"
    )
    
    return {
        "message": "Compte étudiant créé avec succès",
        "email_envoye": True,
        "identifiant": identifiant,
        "id_etudiant": id_etudiant,
        "matricule": matricule,
        "note": "L'envoi de l'email est en cours en arrière-plan"
    }

class PromotionCreate(BaseModel):
    id_filiere: str
    annee_academique: str

@router.post("/creer-promotion", status_code=status.HTTP_201_CREATED)
async def creer_promotion(
    data: PromotionCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer une nouvelle promotion manuellement (DE)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accés réservé au DE")

    from utils.promotion_generator import valider_annee_academique
    from datetime import datetime

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