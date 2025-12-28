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