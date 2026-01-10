from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal

from database.database import get_db
from models import (
    Utilisateur, Formateur, Etudiant, EspacePedagogique, 
    Travail, Assignation, Inscription, RoleEnum, TypeTravailEnum, StatutAssignationEnum
)
from core.auth import get_current_user
from utils.generators import generer_identifiant_unique
from utils.email_service import email_service

router = APIRouter(prefix="/api/travaux", tags=["Travaux"])

# ==================== SCHEMAS ====================

class TravailCreate(BaseModel):
    id_espace: str
    titre: str
    description: str
    type_travail: TypeTravailEnum
    date_echeance: datetime
    note_max: Decimal = Decimal("20.0")

class AssignationRequest(BaseModel):
    id_travail: str
    etudiants_ids: List[str]
    date_echeance: Optional[datetime] = None  # Optionnel : écrase la date du travail si fournie

class TravailResponse(BaseModel):
    id_travail: str
    id_espace: str
    titre: str
    description: str
    type_travail: TypeTravailEnum
    date_echeance: datetime
    date_creation: datetime
    note_max: Decimal

    class Config:
        from_attributes = True

class AssignationResponse(BaseModel):
    id_assignation: str
    titre_travail: str
    nom_matiere: str
    nom_etudiant: str
    prenom_etudiant: str
    date_assignment: datetime
    date_echeance: datetime
    statut: StatutAssignationEnum
    type_travail: TypeTravailEnum

    class Config:
        from_attributes = True

# ==================== ROUTES ====================

@router.post("/creer", response_model=TravailResponse, status_code=status.HTTP_201_CREATED)
async def creer_travail(
    data: TravailCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Créer un nouveau travail (individuel ou collectif) - US 51
    Accessible uniquement au Formateur assigné à l'espace.
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les formateurs peuvent créer des travaux"
        )
    
    # Récupérer le profil formateur
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil formateur non trouvé"
        )
    
    # Vérifier que l'espace existe et que le formateur y est assigné
    espace = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_espace == data.id_espace,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not espace:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à créer un travail dans cet espace"
        )
    
    # Créer le travail
    id_travail = generer_identifiant_unique("TRAVAIL")
    nouveau_travail = Travail(
        id_travail=id_travail,
        id_espace=data.id_espace,
        titre=data.titre,
        description=data.description,
        type_travail=data.type_travail,
        date_echeance=data.date_echeance,
        note_max=data.note_max
    )
    
    db.add(nouveau_travail)
    
    try:
        db.commit()
        db.refresh(nouveau_travail)
        return nouveau_travail
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du travail : {str(e)}"
        )

@router.get("/espace/{id_espace}", response_model=List[TravailResponse])
async def lister_travaux_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Lister tous les travaux d'un espace pédagogique.
    """
    # Vérifier si l'utilisateur a accès à cet espace
    # (Soit c'est le DE, soit le formateur assigné, soit un étudiant inscrit)
    
    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")
    
    autorise = False
    if current_user.role == RoleEnum.DE:
        autorise = True
    elif current_user.role == RoleEnum.FORMATEUR:
        formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
        if formateur and espace.id_formateur == formateur.id_formateur:
            autorise = True
    elif current_user.role == RoleEnum.ETUDIANT:
        etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
        if etudiant:
            inscription = db.query(Inscription).filter(
                Inscription.id_espace == id_espace,
                Inscription.id_etudiant == etudiant.id_etudiant
            ).first()
            if inscription:
                autorise = True
    
    if not autorise:
        raise HTTPException(status_code=403, detail="Accès non autorisé à cet espace")
    
    travaux = db.query(Travail).filter(Travail.id_espace == id_espace).order_by(Travail.date_creation.desc()).all()
    return travaux

@router.get("/{id_travail}", response_model=TravailResponse)
async def obtenir_details_travail(
    id_travail: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Obtenir les détails d'un travail spécifique.
    """
    travail = db.query(Travail).filter(Travail.id_travail == id_travail).first()
    if not travail:
        raise HTTPException(status_code=404, detail="Travail non trouvé")
    
    # Vérification d'accès simplifiée pour l'instant (à affiner si besoin)
    return travail

@router.post("/assigner", status_code=status.HTTP_201_CREATED)
async def assigner_travail(
    data: AssignationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Assigner un travail à un ou plusieurs étudiants (US 6.1)
    - Individuel : 1 seul étudiant
    - Collectif : plusieurs étudiants
    Envoie une notification email à chaque étudiant.
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Seuls les formateurs peuvent assigner des travaux")

    # Récupérer le travail
    travail = db.query(Travail).filter(Travail.id_travail == data.id_travail).first()
    if not travail:
        raise HTTPException(status_code=404, detail="Travail non trouvé")

    # Vérifier le type de travail vs nombre d'étudiants
    if travail.type_travail == TypeTravailEnum.INDIVIDUEL and len(data.etudiants_ids) > 1:
        raise HTTPException(status_code=400, detail="Un travail individuel ne peut être assigné qu'à un seul étudiant")

    # Si une nouvelle date d'échéance est fournie, on peut mettre à jour le travail ou l'utiliser pour l'email
    # Ici on va simplement l'utiliser pour l'email et éventuellement mettre à jour le travail si besoin
    if data.date_echeance:
        travail.date_echeance = data.date_echeance
        db.add(travail)

    resultats = []
    for id_etudiant in data.etudiants_ids:
        # Vérifier si déjà assigné
        existe = db.query(Assignation).filter(
            Assignation.id_travail == data.id_travail,
            Assignation.id_etudiant == id_etudiant
        ).first()

        if existe:
            continue

        # Créer l'assignation
        id_assignation = generer_identifiant_unique("ASG")
        nouvelle_assignation = Assignation(
            id_assignation=id_assignation,
            id_travail=data.id_travail,
            id_etudiant=id_etudiant,
            date_assignment=datetime.utcnow(),
            statut=StatutAssignationEnum.ASSIGNE
        )
        db.add(nouvelle_assignation)
        
        # Récupérer les infos de l'étudiant pour l'email
        etudiant = db.query(Etudiant).filter(Etudiant.id_etudiant == id_etudiant).first()
        if etudiant and etudiant.utilisateur:
            # Envoi de l'email en tâche de fond
            background_tasks.add_task(
                email_service.envoyer_email_assignation_travail,
                destinataire=etudiant.utilisateur.email,
                prenom=etudiant.utilisateur.prenom,
                titre_travail=travail.titre,
                nom_matiere=travail.espace_pedagogique.matiere.nom_matiere,
                formateur=f"{current_user.prenom} {current_user.nom}",
                date_echeance=travail.date_echeance.strftime("%d/%m/%Y à %H:%M"),
                description=travail.description
            )
        
        resultats.append(id_etudiant)

    try:
        db.commit()
        return {"message": f"{len(resultats)} assignation(s) créée(s) avec succès", "assignes": resultats}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mes-assignations", response_model=List[AssignationResponse])
async def lister_mes_assignations(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Lister toutes les assignations effectuées par le formateur connecté.
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Accès réservé aux formateurs")
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(status_code=404, detail="Profil formateur non trouvé")

    # Récupérer les assignations pour les espaces du formateur
    assignations = db.query(
        Assignation.id_assignation,
        Travail.titre.label("titre_travail"),
        Matiere.nom_matiere,
        Utilisateur.nom.label("nom_etudiant"),
        Utilisateur.prenom.label("prenom_etudiant"),
        Assignation.date_assignment,
        Travail.date_echeance,
        Assignation.statut,
        Travail.type_travail
    ).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Etudiant, Assignation.id_etudiant == Etudiant.id_etudiant
    ).join(
        Utilisateur, Etudiant.identifiant == Utilisateur.identifiant
    ).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).order_by(Assignation.date_assignment.desc()).all()

    return assignations
