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

router = APIRouter()

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
        # Récupérer les informations du formateur assigné
        formateur_info = "Non assigné"
        if espace.id_formateur:
            formateur = db.query(Formateur).filter(Formateur.id_formateur == espace.id_formateur).first()
            if formateur and formateur.utilisateur:
                formateur_info = f"{formateur.utilisateur.prenom} {formateur.utilisateur.nom}"
        
        # Compter les étudiants inscrits
        nb_etudiants = db.query(Inscription).filter(Inscription.id_espace == espace.id_espace).count()
        
        result.append({
            "id_espace": espace.id_espace,
            "id_promotion": espace.id_promotion,
            "id_formateur": espace.id_formateur,
            "nom_matiere": espace.matiere.nom_matiere if espace.matiere else "Inconnu",
            "description": espace.description,
            "code_acces": espace.code_acces,
            "promotion": espace.promotion.libelle if espace.promotion else "Inconnue",
            "filiere": espace.promotion.filiere.nom_filiere if (espace.promotion and espace.promotion.filiere) else "Inconnue",
            "formateur": formateur_info,
            "nb_etudiants": nb_etudiants,
            "nb_travaux": 0,
            "date_creation": espace.date_creation.isoformat() if espace.date_creation else None
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
        # Vérifier si un formateur est déjà assigné (restriction demandée : "il refuse")
        if espace.id_formateur and espace.id_formateur != data.id_formateur:
            raise HTTPException(
                status_code=400, 
                detail="Un formateur est déjà assigné à cet espace. Désassignez-le d'abord."
            )
            
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

# ==================== ROUTE CONSULTATION STATISTIQUES ====================

@router.get("/{id_espace}/statistiques")
async def consulter_statistiques_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Consulter les statistiques détaillées d'un espace pédagogique (DE ou Formateur assigné)"""
    # Vérifier que l'espace existe
    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace pédagogique non trouvé")

    # Vérifier les permissions
    if current_user.role == RoleEnum.FORMATEUR:
        formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
        if not formateur or espace.id_formateur != formateur.id_formateur:
            raise HTTPException(
                status_code=403, 
                detail="Vous n'êtes pas le formateur assigné à cet espace"
            )
    elif current_user.role != RoleEnum.DE:
        raise HTTPException(status_code=403, detail="Accès réservé au DE ou au formateur assigné")

    # Informations générales de l'espace
    formateur_info = None
    if espace.id_formateur:
        formateur = db.query(Formateur).filter(Formateur.id_formateur == espace.id_formateur).first()
        if formateur and formateur.utilisateur:
            formateur_info = {
                "nom": formateur.utilisateur.nom,
                "prenom": formateur.utilisateur.prenom,
                "email": formateur.utilisateur.email,
                "numero_employe": formateur.numero_employe
            }

    # Statistiques des étudiants inscrits
    inscriptions = db.query(Inscription).filter(Inscription.id_espace == id_espace).all()
    nb_etudiants_inscrits = len(inscriptions)
    
    etudiants_details = []
    for inscription in inscriptions:
        if inscription.etudiant and inscription.etudiant.utilisateur:
            etudiants_details.append({
                "id_etudiant": inscription.etudiant.id_etudiant,
                "nom": inscription.etudiant.utilisateur.nom,
                "prenom": inscription.etudiant.utilisateur.prenom,
                "email": inscription.etudiant.utilisateur.email,
                "matricule": inscription.etudiant.matricule,
                "date_inscription": inscription.date_inscription.isoformat(),
                "statut": inscription.etudiant.statut
            })

    # Statistiques des travaux (si le modèle Travail existe)
    try:
        from models import Travail, Assignation, StatutAssignationEnum
        
        travaux = db.query(Travail).filter(Travail.id_espace == id_espace).all()
        nb_travaux = len(travaux)
        
        # Statistiques des assignations
        assignations_stats = {
            "total": 0,
            "assignees": 0,
            "en_cours": 0,
            "rendues": 0,
            "notees": 0
        }
        
        travaux_details = []
        for travail in travaux:
            assignations = db.query(Assignation).filter(Assignation.id_travail == travail.id_travail).all()
            
            assignations_travail = {
                "total": len(assignations),
                "assignees": len([a for a in assignations if a.statut == StatutAssignationEnum.ASSIGNE]),
                "en_cours": len([a for a in assignations if a.statut == StatutAssignationEnum.EN_COURS]),
                "rendues": len([a for a in assignations if a.statut == StatutAssignationEnum.RENDU]),
                "notees": len([a for a in assignations if a.statut == StatutAssignationEnum.NOTE])
            }
            
            assignations_stats["total"] += assignations_travail["total"]
            assignations_stats["assignees"] += assignations_travail["assignees"]
            assignations_stats["en_cours"] += assignations_travail["en_cours"]
            assignations_stats["rendues"] += assignations_travail["rendues"]
            assignations_stats["notees"] += assignations_travail["notees"]
            
            travaux_details.append({
                        "id_travail": travail.id_travail,
                        "id_espace": travail.id_espace,
                        "titre": travail.titre,
                        "description": travail.description,
                        "type_travail": travail.type_travail,
                        "date_creation": travail.date_creation.isoformat(),
                        "date_echeance": travail.date_echeance.isoformat() if travail.date_echeance else None,
                        "note_max": float(travail.note_max) if travail.note_max else None,
                        "assignations": assignations_travail
                    })
            
    except ImportError:
        # Si les modèles Travail/Assignation n'existent pas encore
        nb_travaux = 0
        assignations_stats = {
            "total": 0,
            "assignees": 0,
            "en_cours": 0,
            "rendues": 0,
            "notees": 0
        }
        travaux_details = []

    return {
        "espace": {
            "id_espace": espace.id_espace,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "date_creation": espace.date_creation.isoformat(),
            "matiere": {
                "nom": espace.matiere.nom_matiere,
                "description": espace.matiere.description
            },
            "promotion": {
                "libelle": espace.promotion.libelle,
                "annee_academique": espace.promotion.annee_academique,
                "filiere": espace.promotion.filiere.nom_filiere
            },
            "formateur": formateur_info
        },
        "statistiques": {
            "nb_etudiants_inscrits": nb_etudiants_inscrits,
            "nb_travaux": nb_travaux,
            "assignations": assignations_stats
        },
        "etudiants": etudiants_details,
        "travaux": travaux_details
    }

@router.get("/espace/{id_espace}/etudiants")
async def lister_etudiants_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les étudiants inscrits dans un espace spécifique (DE ou Formateur assigné)"""
    
    # Vérifier que l'espace existe
    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace pédagogique non trouvé")
    
    # Vérifier les permissions
    if current_user.role == RoleEnum.FORMATEUR:
        formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
        if not formateur or espace.id_formateur != formateur.id_formateur:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'êtes pas le formateur assigné à cet espace"
            )
    elif current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès non autorisé"
        )

    # Récupérer les inscriptions avec chargement des relations
    inscriptions = db.query(Inscription).filter(Inscription.id_espace == id_espace).all()
    
    return {
        "etudiants": [
            {
                "id_etudiant": ins.etudiant.id_etudiant,
                "nom": ins.etudiant.utilisateur.nom,
                "prenom": ins.etudiant.utilisateur.prenom,
                "email": ins.etudiant.utilisateur.email,
                "matricule": ins.etudiant.matricule
            } for ins in inscriptions if ins.etudiant and ins.etudiant.utilisateur
        ]
    }

