from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from database.database import get_db
from models import (
    Utilisateur, Formateur, Etudiant, Filiere, Promotion,
    EspacePedagogique, Matiere, Inscription, RoleEnum
)
from core.auth import get_current_user
from utils.generators import generer_identifiant_unique
import secrets

router = APIRouter(prefix="/api/espaces-pedagogiques", tags=["Espaces Pédagogiques"])

# ==================== SCHEMAS ====================

class EspacePedagogiqueCreate(BaseModel):
    id_promotion: str
    id_matiere: str
    description: Optional[str] = None

class AssignFormateurRequest(BaseModel):
    id_formateur: Optional[str] = None

class AddEtudiantsRequest(BaseModel):
    etudiants_ids: List[str]

# ==================== ROUTES DE ====================

@router.post("/creer")
async def creer_espace_pedagogique(
    data: EspacePedagogiqueCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer un espace pédagogique vide (DE uniquement) - US 3.1"""
    
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
    
    # Générer un code d'accès unique
    code_acces = secrets.token_urlsafe(6).upper()
    
    # Créer l'espace pédagogique (sans formateur pour l'instant)
    id_espace = generer_identifiant_unique("ESPACE")
    espace = EspacePedagogique(
        id_espace=id_espace,
        id_promotion=data.id_promotion,
        id_matiere=data.id_matiere,
        description=data.description,
        id_formateur=None,
        code_acces=code_acces,
        date_creation=datetime.utcnow()
    )
    
    db.add(espace)
    db.commit()
    db.refresh(espace)
    
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
            "formateur": "Non assigné",
            "nb_etudiants": 0
        }
    }

@router.get("/liste")
async def lister_espaces_pedagogiques(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister tous les espaces pédagogiques (DE uniquement) - US 3.1"""
    
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au DE"
        )
    
    espaces = db.query(EspacePedagogique).all()
    
    result = []
    for espace in espaces:
        result.append({
            "id_espace": espace.id_espace,
            "id_promotion": espace.id_promotion,
            "nom_matiere": espace.matiere.nom_matiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "promotion": espace.promotion.libelle,
            "filiere": espace.promotion.filiere.nom_filiere,
            "formateur": "Non assigné",
            "nb_etudiants": 0,
            "nb_travaux": 0,
            "date_creation": espace.date_creation.isoformat()
        })
    
    return {"espaces": result, "total": len(result)}

# ==================== ROUTES GESTION ESPACE ====================

@router.put("/{id_espace}/formateur")
async def assigner_formateur_espace(
    id_espace: str,
    data: AssignFormateurRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Assigner ou retirer un formateur d'un espace (DE uniquement)"""
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
        # Désassigner le formateur
        espace.id_formateur = None

    db.commit()
    
    return {"message": "Formateur mis à jour avec succès"}

@router.post("/{id_espace}/etudiants")
async def ajouter_etudiants_espace(
    id_espace: str,
    data: AddEtudiantsRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Ajouter des étudiants à un espace (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE")

    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")

    count = 0
    for id_etudiant in data.etudiants_ids:
        # Vérifier si déjà inscrit
        exists = db.query(Inscription).filter(
            Inscription.id_espace == id_espace,
            Inscription.id_etudiant == id_etudiant
        ).first()
        
        if not exists:
            # Vérifier que l'étudiant existe
            etudiant = db.query(Etudiant).filter(Etudiant.id_etudiant == id_etudiant).first()
            if etudiant:
                inscription = Inscription(
                    id_inscription=generer_identifiant_unique("INS"),
                    id_espace=id_espace,
                    id_etudiant=id_etudiant,
                    date_inscription=datetime.utcnow()
                )
                db.add(inscription)
                count += 1
    
    db.commit()
    return {"message": f"{count} étudiant(s) ajouté(s) avec succès"}

@router.get("/promotion/{id_promotion}/etudiants")
async def lister_etudiants_candidats(
    id_promotion: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les étudiants d'une promotion pour sélection (DE)"""
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