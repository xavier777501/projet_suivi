from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
import os
import shutil
from pathlib import Path

from database.database import get_db
from models import (
    Utilisateur, Formateur, Etudiant, EspacePedagogique, 
    Travail, Assignation, Inscription, RoleEnum, TypeTravailEnum, StatutAssignationEnum,
    Matiere
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

class SoumissionTravail(BaseModel):
    id_assignation: str
    commentaire_etudiant: Optional[str] = None

class EvaluationTravail(BaseModel):
    id_assignation: str
    note: Decimal
    commentaire_formateur: str

class MesTravauxResponse(BaseModel):
    id_assignation: str
    id_travail: str
    titre_travail: str
    description_travail: str
    nom_matiere: str
    type_travail: TypeTravailEnum
    date_assignment: datetime
    date_echeance: datetime
    date_soumission: Optional[datetime] = None
    date_evaluation: Optional[datetime] = None
    statut: StatutAssignationEnum
    note: Optional[Decimal] = None
    note_max: Decimal
    commentaire_etudiant: Optional[str] = None
    commentaire_formateur: Optional[str] = None
    fichier_path: Optional[str] = None

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

@router.get("/mes-travaux", response_model=List[MesTravauxResponse])
async def lister_mes_travaux(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Lister tous les travaux assignés à l'étudiant connecté (US 3)
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(status_code=403, detail="Accès réservé aux étudiants")
    
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")

    # Récupérer toutes les assignations de l'étudiant avec les détails
    assignations = db.query(
        Assignation.id_assignation,
        Assignation.id_travail,
        Travail.titre.label("titre_travail"),
        Travail.description.label("description_travail"),
        Matiere.nom_matiere,
        Travail.type_travail,
        Assignation.date_assignment,
        Travail.date_echeance,
        Assignation.date_soumission,
        Assignation.date_evaluation,
        Assignation.statut,
        Assignation.note,
        Travail.note_max,
        Assignation.commentaire_etudiant,
        Assignation.commentaire_formateur,
        Assignation.fichier_path
    ).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).filter(
        Assignation.id_etudiant == etudiant.id_etudiant
    ).order_by(Travail.date_echeance.asc()).all()

    return assignations

@router.post("/soumettre")
async def soumettre_travail(
    id_assignation: str = Form(...),
    commentaire_etudiant: Optional[str] = Form(None),
    fichier: Optional[UploadFile] = File(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Soumettre un travail (US 4)
    L'étudiant peut soumettre son travail avec un commentaire et optionnellement un fichier
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(status_code=403, detail="Accès réservé aux étudiants")
    
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")

    # Récupérer l'assignation
    assignation = db.query(Assignation).filter(
        Assignation.id_assignation == id_assignation,
        Assignation.id_etudiant == etudiant.id_etudiant
    ).first()
    
    if not assignation:
        raise HTTPException(status_code=404, detail="Assignation non trouvée")
    
    if assignation.statut != StatutAssignationEnum.ASSIGNE:
        raise HTTPException(status_code=400, detail="Ce travail a déjà été soumis")

    # Gestion du fichier si fourni
    fichier_path = None
    if fichier:
        # Créer le dossier de stockage s'il n'existe pas
        upload_dir = Path("uploads/travaux")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Générer un nom de fichier unique
        file_extension = Path(fichier.filename).suffix
        unique_filename = f"{assignation.id_assignation}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        fichier_path = upload_dir / unique_filename
        
        # Sauvegarder le fichier
        try:
            with open(fichier_path, "wb") as buffer:
                shutil.copyfileobj(fichier.file, buffer)
            fichier_path = str(fichier_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload du fichier: {str(e)}")

    # Mettre à jour l'assignation
    assignation.statut = StatutAssignationEnum.RENDU
    assignation.date_soumission = datetime.utcnow()
    assignation.commentaire_etudiant = commentaire_etudiant
    assignation.fichier_path = fichier_path

    try:
        db.commit()
        
        # Récupérer les informations pour l'email
        travail = assignation.travail
        formateur = travail.espace_pedagogique.formateur
        
        if formateur and formateur.utilisateur:
            # Envoyer notification au formateur
            background_tasks.add_task(
                email_service.envoyer_email_soumission_travail,
                destinataire=formateur.utilisateur.email,
                prenom_formateur=formateur.utilisateur.prenom,
                prenom_etudiant=current_user.prenom,
                nom_etudiant=current_user.nom,
                titre_travail=travail.titre,
                nom_matiere=travail.espace_pedagogique.matiere.nom_matiere,
                date_soumission=assignation.date_soumission.strftime("%d/%m/%Y à %H:%M"),
                commentaire=commentaire_etudiant or "Aucun commentaire"
            )
        
        return {
            "message": "Travail soumis avec succès",
            "date_soumission": assignation.date_soumission,
            "fichier_uploade": fichier.filename if fichier else None
        }
        
    except Exception as e:
        db.rollback()
        # Supprimer le fichier en cas d'erreur
        if fichier_path and os.path.exists(fichier_path):
            os.remove(fichier_path)
        raise HTTPException(status_code=500, detail=f"Erreur lors de la soumission: {str(e)}")

@router.put("/evaluer")
async def evaluer_travail(
    data: EvaluationTravail,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Évaluer un travail rendu (US 6 - Backend)
    Le formateur peut attribuer une note et un commentaire
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Seuls les formateurs peuvent évaluer des travaux")
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(status_code=404, detail="Profil formateur non trouvé")

    # Récupérer l'assignation avec vérifications
    assignation = db.query(Assignation).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).filter(
        Assignation.id_assignation == data.id_assignation,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not assignation:
        raise HTTPException(status_code=404, detail="Assignation non trouvée ou non autorisée")
    
    if assignation.statut != StatutAssignationEnum.RENDU:
        raise HTTPException(status_code=400, detail="Ce travail n'a pas encore été rendu")

    # Validation de la note
    travail = assignation.travail
    if data.note < 0 or data.note > travail.note_max:
        raise HTTPException(
            status_code=400, 
            detail=f"La note doit être entre 0 et {travail.note_max}"
        )

    # Mettre à jour l'assignation
    assignation.statut = StatutAssignationEnum.NOTE
    assignation.date_evaluation = datetime.utcnow()
    assignation.note = data.note
    assignation.commentaire_formateur = data.commentaire_formateur

    try:
        db.commit()
        
        # Récupérer les informations de l'étudiant pour l'email
        etudiant = assignation.etudiant
        
        if etudiant and etudiant.utilisateur:
            # Envoyer notification à l'étudiant
            background_tasks.add_task(
                email_service.envoyer_email_evaluation_travail,
                destinataire=etudiant.utilisateur.email,
                prenom_etudiant=etudiant.utilisateur.prenom,
                titre_travail=travail.titre,
                nom_matiere=travail.espace_pedagogique.matiere.nom_matiere,
                note=float(data.note),
                note_max=float(travail.note_max),
                commentaire=data.commentaire_formateur,
                formateur=f"{current_user.prenom} {current_user.nom}"
            )
        
        return {
            "message": "Travail évalué avec succès",
            "note": data.note,
            "note_max": travail.note_max,
            "date_evaluation": assignation.date_evaluation
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'évaluation: {str(e)}")

@router.get("/assignation/{id_assignation}/fichier")
async def telecharger_fichier_travail(
    id_assignation: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Télécharger le fichier d'un travail soumis
    Accessible au formateur et à l'étudiant concerné
    """
    assignation = db.query(Assignation).filter(
        Assignation.id_assignation == id_assignation
    ).first()
    
    if not assignation:
        raise HTTPException(status_code=404, detail="Assignation non trouvée")
    
    # Vérifier les autorisations
    autorise = False
    if current_user.role == RoleEnum.FORMATEUR:
        formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
        if formateur:
            travail = assignation.travail
            if travail.espace_pedagogique.id_formateur == formateur.id_formateur:
                autorise = True
    elif current_user.role == RoleEnum.ETUDIANT:
        etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
        if etudiant and assignation.id_etudiant == etudiant.id_etudiant:
            autorise = True
    
    if not autorise:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce fichier")
    
    if not assignation.fichier_path or not os.path.exists(assignation.fichier_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=assignation.fichier_path,
        filename=os.path.basename(assignation.fichier_path),
        media_type='application/octet-stream'
    )
