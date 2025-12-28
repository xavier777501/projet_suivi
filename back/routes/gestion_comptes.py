from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from database.database import get_db
from models import Utilisateur, Formateur, Etudiant, Promotion, Filiere, Matiere, RoleEnum
from core.auth import get_current_user

router = APIRouter(prefix="/api/gestion-comptes", tags=["Gestion des comptes"])

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