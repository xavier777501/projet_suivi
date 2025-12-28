from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database.database import get_db
from models import (
    Utilisateur, Formateur, Etudiant, Filiere, Promotion,
    EspacePedagogique, Travail, Assignation, Matiere, Inscription,
    RoleEnum, TypeTravailEnum, StatutAssignationEnum
)
from core.auth import get_current_user
from utils.generators import generer_identifiant_unique
import secrets

router = APIRouter(prefix="/api/espaces-pedagogiques", tags=["Espaces Pédagogiques"])

# ==================== SCHEMAS ====================

class EspacePedagogiqueCreate(BaseModel):
    id_promotion: str
    id_matiere: str
    id_formateur: Optional[str] = None
    description: Optional[str] = None

# ==================== ROUTES DE ====================

@router.post("/creer")
async def creer_espace_pedagogique(
    data: EspacePedagogiqueCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer un espace pédagogique (DE uniquement)"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul le DE peut créer des espaces pédagogiques"
        )
    
    # Vérifier que la matière existe
    matiere = db.query(Matiere).filter(Matiere.id_matiere == data.id_matiere).first()
    if not matiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée"
        )
    
    # Vérifier que la promotion existe
    promotion = db.query(Promotion).filter(Promotion.id_promotion == data.id_promotion).first()
    if not promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promotion non trouvée"
        )

    # Vérifier formateur si fourni
    formateur = None
    if data.id_formateur:
        formateur = db.query(Formateur).filter(Formateur.id_formateur == data.id_formateur).first()
        if not formateur:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Formateur non trouvé"
            )
    
    # Générer un code d'accès unique
    code_acces = secrets.token_urlsafe(6).upper()
    
    # Créer l'espace pédagogique
    id_espace = generer_identifiant_unique("ESPACE")
    espace = EspacePedagogique(
        id_espace=id_espace,
        id_promotion=data.id_promotion,
        id_matiere=data.id_matiere,
        description=data.description,
        id_formateur=data.id_formateur,
        code_acces=code_acces,
        date_creation=datetime.utcnow()
    )
    
    db.add(espace)
    db.commit()
    db.refresh(espace)
    
    # Compter les étudiants (basé sur inscriptions ou promotion ?)
    # Pour l'instant on initialise à 0 inscriptions
    nb_etudiants = 0
    
    return {
        "message": "Espace pédagogique créé avec succès",
        "espace": {
            "id_espace": espace.id_espace,
            "id_promotion": promotion.id_promotion,
            "nom_matiere": matiere.nom_matiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "promotion": promotion.libelle,
            "filiere": promotion.filiere.nom_filiere,
            "formateur": f"{formateur.prenom} {formateur.nom}" if formateur else None,
            "nb_etudiants": nb_etudiants
        }
    }

@router.get("/liste")
async def lister_espaces_pedagogiques(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister tous les espaces pédagogiques (DE uniquement)"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au DE"
        )
    
    espaces = db.query(EspacePedagogique).all()
    
    result = []
    for espace in espaces:
        nb_etudiants = db.query(Etudiant).filter(
            Etudiant.id_promotion == espace.id_promotion
        ).count()
        
        nb_travaux = db.query(Travail).filter(
            Travail.id_espace == espace.id_espace
        ).count()
        
        nom_formateur = "Non assigné"
        if espace.formateur and espace.formateur.utilisateur:
            nom_formateur = f"{espace.formateur.utilisateur.prenom} {espace.formateur.utilisateur.nom}"

        result.append({
            "id_espace": espace.id_espace,
            "id_promotion": espace.id_promotion,
            "nom_matiere": espace.matiere.nom_matiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "promotion": espace.promotion.libelle,
            "filiere": espace.promotion.filiere.nom_filiere,
            "formateur": nom_formateur,
            "nb_etudiants": nb_etudiants,
            "nb_travaux": nb_travaux,
            "date_creation": espace.date_creation.isoformat()
        })
    
    return {"espaces": result, "total": len(result)}