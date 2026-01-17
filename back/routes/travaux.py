from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from decimal import Decimal
import os
import shutil

from database.database import get_db
from models import (
    Utilisateur, Formateur, Etudiant, EspacePedagogique, 
    Travail, Assignation, Inscription, Livraison, Matiere,
    RoleEnum, TypeTravailEnum, StatutAssignationEnum
)
from core.auth import get_current_user
from utils.generators import generer_identifiant_unique
from utils.email_service import email_service

router = APIRouter()

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

class LivraisonCreate(BaseModel):
    commentaire: Optional[str] = None

class LivraisonResponse(BaseModel):
    id_livraison: str
    id_assignation: str
    chemin_fichier: str
    date_livraison: datetime
    commentaire: Optional[str]
    note_attribuee: Optional[Decimal]
    feedback: Optional[str]

    class Config:
        from_attributes = True

class LivraisonEtudiantResponse(BaseModel):
    id_livraison: str
    id_assignation: str
    chemin_fichier: str
    date_livraison: datetime
    commentaire: Optional[str]

    class Config:
        from_attributes = True

class EvaluationRequest(BaseModel):
    note_attribuee: Decimal
    feedback: Optional[str] = None

class MesTravauxResponse(BaseModel):
    id_assignation: str
    id_travail: str
    titre_travail: str
    description: str
    nom_matiere: str
    date_assignment: datetime
    date_echeance: datetime
    statut: StatutAssignationEnum
    type_travail: TypeTravailEnum
    note_max: Decimal
    livraison: Optional[LivraisonEtudiantResponse] = None

    class Config:
        from_attributes = True

class TravailAvecLivraisonsResponse(BaseModel):
    id_travail: str
    titre: str
    description: str
    type_travail: TypeTravailEnum
    date_echeance: datetime
    note_max: Decimal
    assignations: List[dict]  # Contient les assignations avec leurs livraisons

    class Config:
        from_attributes = True

# ==================== ROUTES ====================

@router.get("/ping")
async def ping_travaux():
    return {"status": "ok", "message": "Router travaux est bien chargé"}

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
    Lister tous les travaux assignés à l'étudiant connecté.
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(status_code=403, detail="Accès réservé aux étudiants")
    
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")

    # Récupérer les assignations de l'étudiant avec les détails du travail (avec joins pour l'intégrité)
    assignations = db.query(Assignation).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).filter(
        Assignation.id_etudiant == etudiant.id_etudiant
    ).order_by(Assignation.date_assignment.desc()).all()
    
    resultats = []
    for assignation in assignations:
            
        # Récupérer la livraison si elle existe
        livraison = db.query(Livraison).filter(
            Livraison.id_assignation == assignation.id_assignation
        ).first()

        livraison_data = None
        if livraison:
            livraison_data = LivraisonEtudiantResponse(
                id_livraison=livraison.id_livraison,
                id_assignation=livraison.id_assignation,
                chemin_fichier=livraison.chemin_fichier,
                date_livraison=livraison.date_livraison,
                commentaire=livraison.commentaire
            )

        travail_data = MesTravauxResponse(
            id_assignation=assignation.id_assignation,
            id_travail=assignation.travail.id_travail,
            titre_travail=assignation.travail.titre,
            description=assignation.travail.description,
            nom_matiere=assignation.travail.espace_pedagogique.matiere.nom_matiere,
            date_assignment=assignation.date_assignment,
            date_echeance=assignation.travail.date_echeance,
            statut=assignation.statut,
            type_travail=assignation.travail.type_travail,
            note_max=assignation.travail.note_max,
            livraison=livraison_data
        )
        resultats.append(travail_data)

    return resultats

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

    # Si une nouvelle date d'échéance est fournie
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
            # Si assignation existe déjà, on réinitialise le statut à ASSIGNE
            existe.statut = StatutAssignationEnum.ASSIGNE
            existe.date_assignment = datetime.utcnow()
            db.add(existe)
        else:
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
            try:
                # Envoi de l'email en tâche de fond
                date_echeance_str = travail.date_echeance.strftime("%d/%m/%Y à %H:%M") if travail.date_echeance else "Non définie"
                background_tasks.add_task(
                    email_service.envoyer_email_assignation_travail,
                    destinataire=etudiant.utilisateur.email,
                    prenom=etudiant.utilisateur.prenom,
                    titre_travail=travail.titre,
                    nom_matiere=travail.espace_pedagogique.matiere.nom_matiere,
                    formateur=f"{current_user.prenom} {current_user.nom}",
                    date_echeance=date_echeance_str,
                    description=travail.description
                )
            except Exception as e:
                # Log erreur email silencieusement ou via logger standard si configuré
                pass
        
        resultats.append(id_etudiant)

    try:
        db.commit()
        return {"message": f"{len(resultats)} assignation(s) créée(s) avec succès", "assignes": resultats}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ==================== NOUVELLES ROUTES POUR LIVRAISON ET ÉVALUATION ====================

@router.post("/livrer/{id_assignation}", response_model=LivraisonResponse, status_code=status.HTTP_201_CREATED)
async def livrer_travail(
    id_assignation: str,
    fichier: UploadFile = File(...),
    commentaire: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Soumettre (livrer) un travail - US Étudiant
    L'étudiant peut uploader un fichier et ajouter un commentaire.
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(status_code=403, detail="Seuls les étudiants peuvent livrer des travaux")
    
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    if not etudiant:
        raise HTTPException(status_code=404, detail="Profil étudiant non trouvé")

    # Vérifier que l'assignation existe et appartient à l'étudiant
    assignation = db.query(Assignation).filter(
        Assignation.id_assignation == id_assignation,
        Assignation.id_etudiant == etudiant.id_etudiant
    ).first()
    
    if not assignation:
        raise HTTPException(status_code=404, detail="Assignation non trouvée")

    # Vérifier si une livraison existe déjà
    livraison_existante = db.query(Livraison).filter(
        Livraison.id_assignation == id_assignation
    ).first()
    
    if livraison_existante:
        raise HTTPException(status_code=400, detail="Ce travail a déjà été livré")

    # Créer le dossier uploads s'il n'existe pas (chemin absolu pour éviter les problèmes)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Générer un nom de fichier unique
    file_extension = os.path.splitext(fichier.filename)[1]
    unique_filename = f"{id_assignation}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(fichier.file, buffer)
        
        # Créer la livraison en base
        id_livraison = generer_identifiant_unique("LIV")
        nouvelle_livraison = Livraison(
            id_livraison=id_livraison,
            id_assignation=id_assignation,
            chemin_fichier=file_path,
            commentaire=commentaire,
            date_livraison=datetime.utcnow()
        )
        
        db.add(nouvelle_livraison)
        
        # Mettre à jour le statut de l'assignation
        assignation.statut = StatutAssignationEnum.RENDU
        db.add(assignation)
        
        db.commit()
        db.refresh(nouvelle_livraison)
        
        # Envoyer une notification au formateur (en arrière-plan ou direct pour ce test)
        try:
            formateur_user = assignation.travail.espace_pedagogique.formateur.utilisateur
            email_service.envoyer_email_livraison_travail(
                destinataire=formateur_user.email,
                prenom_formateur=formateur_user.prenom,
                nom_etudiant=current_user.nom,
                prenom_etudiant=current_user.prenom,
                titre_travail=assignation.travail.titre,
                nom_matiere=assignation.travail.espace_pedagogique.matiere.nom_matiere
            )
        except Exception as e:
            print(f"⚠️ Erreur notification formateur : {e}")
            
        return nouvelle_livraison
        
    except Exception as e:
        db.rollback()
        # Supprimer le fichier en cas d'erreur
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors de la livraison : {str(e)}"
        )

@router.get("/travail/{id_travail}/livraisons", response_model=TravailAvecLivraisonsResponse)
async def lister_livraisons_travail(
    id_travail: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Lister toutes les livraisons d'un travail - Pour le formateur
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Accès réservé aux formateurs")
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(status_code=404, detail="Profil formateur non trouvé")

    # Vérifier que le travail existe et appartient au formateur
    travail = db.query(Travail).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).filter(
        Travail.id_travail == id_travail,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not travail:
        raise HTTPException(status_code=404, detail="Travail non trouvé ou accès non autorisé")

    # Récupérer toutes les assignations avec leurs livraisons
    assignations = db.query(Assignation).join(
        Etudiant, Assignation.id_etudiant == Etudiant.id_etudiant
    ).join(
        Utilisateur, Etudiant.identifiant == Utilisateur.identifiant
    ).filter(
        Assignation.id_travail == id_travail
    ).all()

    assignations_data = []
    for assignation in assignations:
        livraison = db.query(Livraison).filter(
            Livraison.id_assignation == assignation.id_assignation
        ).first()
        
        livraison_data = None
        if livraison:
            livraison_data = {
                "id_livraison": livraison.id_livraison,
                "chemin_fichier": livraison.chemin_fichier,
                "date_livraison": livraison.date_livraison,
                "commentaire": livraison.commentaire,
                "note_attribuee": livraison.note_attribuee,
                "feedback": livraison.feedback
            }
        
        assignation_data = {
            "id_assignation": assignation.id_assignation,
            "nom_etudiant": assignation.etudiant.utilisateur.nom,
            "prenom_etudiant": assignation.etudiant.utilisateur.prenom,
            "email_etudiant": assignation.etudiant.utilisateur.email,
            "date_assignment": assignation.date_assignment,
            "statut": assignation.statut,
            "livraison": livraison_data
        }
        assignations_data.append(assignation_data)

    return TravailAvecLivraisonsResponse(
        id_travail=travail.id_travail,
        titre=travail.titre,
        description=travail.description,
        type_travail=travail.type_travail,
        date_echeance=travail.date_echeance,
        note_max=travail.note_max,
        assignations=assignations_data
    )

@router.post("/evaluer/{id_livraison}", response_model=LivraisonResponse)
async def evaluer_livraison(
    id_livraison: str,
    evaluation: EvaluationRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """
    Évaluer une livraison - US Formateur
    Le formateur peut attribuer une note et un feedback.
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Seuls les formateurs peuvent évaluer des travaux")
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(status_code=404, detail="Profil formateur non trouvé")

    # Récupérer la livraison avec vérification d'accès
    livraison = db.query(Livraison).join(
        Assignation, Livraison.id_assignation == Assignation.id_assignation
    ).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).filter(
        Livraison.id_livraison == id_livraison,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not livraison:
        raise HTTPException(status_code=404, detail="Livraison non trouvée ou accès non autorisé")

    # Vérifier que la note est valide
    travail = livraison.assignation.travail
    if evaluation.note_attribuee < 0 or evaluation.note_attribuee > travail.note_max:
        raise HTTPException(
            status_code=400, 
            detail=f"La note doit être comprise entre 0 et {travail.note_max}"
        )

    try:
        # Mettre à jour la livraison
        livraison.note_attribuee = evaluation.note_attribuee
        livraison.feedback = evaluation.feedback
        
        # Mettre à jour le statut de l'assignation
        livraison.assignation.statut = StatutAssignationEnum.NOTE
        
        db.add(livraison)
        db.add(livraison.assignation)
        db.commit()
        db.refresh(livraison)
        
        return livraison
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors de l'évaluation : {str(e)}"
        )

@router.get("/telecharger/{id_livraison}")
async def telecharger_fichier_livraison(
    id_livraison: str,
    token: Optional[str] = None,  # Token via URL pour téléchargement direct (anti-IDM)
    db: Session = Depends(get_db)
):
    """
    Télécharger le fichier d'une livraison.
    Accessible au formateur (pour évaluation) et à l'étudiant (sa propre livraison).
    
    Le token peut être passé en query parameter (?token=xxx) pour permettre
    le téléchargement direct via window.open() et contourner IDM.
    """
    # Authentification via token en query param ou header Authorization
    from core.jwt import verify_token
    
    current_user = None
    
    if token:
        # Token fourni en query parameter
        try:
            payload = verify_token(token)
            identifiant = payload.get("sub")
            if identifiant:
                current_user = db.query(Utilisateur).filter(Utilisateur.identifiant == identifiant).first()
        except Exception as e:
            print(f"Erreur décodage token URL: {e}")
            raise HTTPException(status_code=401, detail="Token invalide")
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Token requis pour le téléchargement")
    """
    Télécharger le fichier d'une livraison.
    Accessible au formateur (pour évaluation) et à l'étudiant (sa propre livraison).
    """
    # Récupérer la livraison avec toutes les relations nécessaires pour éviter le lazy loading
    from sqlalchemy.orm import joinedload
    
    livraison = db.query(Livraison).options(
        joinedload(Livraison.assignation)
        .joinedload(Assignation.travail)
        .joinedload(Travail.espace_pedagogique)
    ).filter(Livraison.id_livraison == id_livraison).first()
    
    if not livraison:
        raise HTTPException(status_code=404, detail="Livraison non trouvée")
    
    # Vérifier les droits d'accès
    autorise = False
    
    if current_user.role == RoleEnum.ETUDIANT:
        # L'étudiant peut télécharger sa propre livraison
        etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
        if etudiant and livraison.assignation.id_etudiant == etudiant.id_etudiant:
            autorise = True
    
    elif current_user.role == RoleEnum.FORMATEUR:
        # Le formateur peut télécharger les livraisons de ses espaces
        formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
        if formateur:
            travail = livraison.assignation.travail
            if travail and travail.espace_pedagogique and travail.espace_pedagogique.id_formateur == formateur.id_formateur:
                autorise = True
    
    elif current_user.role == RoleEnum.DE:
        # Le DE peut tout télécharger
        autorise = True
    
    if not autorise:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce fichier")
    
    # Vérifier que le fichier existe (gestion des chemins relatifs et absolus)
    file_path = livraison.chemin_fichier
    print(f"DEBUG: Chemin fichier en base: {file_path}")
    
    if not os.path.isabs(file_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(base_dir, file_path)
        print(f"DEBUG: Chemin fichier résolu: {file_path}")

    if not os.path.exists(file_path):
        print(f"DEBUG: FICHIER NON TROUVÉ: {file_path}")
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le serveur")
    
    # Récupérer le nom original du fichier
    filename = os.path.basename(file_path)
    
    # IDM FIX v2: Utiliser Response au lieu de FileResponse
    # FileResponse envoie 'Accept-Ranges: bytes' ce qui active IDM.
    # En lisant le fichier manuellement et en renvoyant une Response standard,
    # on évite ce header et IDM ne devrait pas intercepter.
    
    # IDM FIX v3: StreamingResponse
    # Utilisation d'un générateur pour le streaming et de StreamingResponse
    # Cela permet de mieux gérer les gros fichiers et d'éviter certains comportements d'IDM
    
    try:
        if not os.path.exists(file_path):
            print(f"ERREUR: Fichier non trouvé sur le disque: {file_path}")
            raise HTTPException(status_code=404, detail="Fichier non trouvé sur le disque")

        print(f"Serveur: Envoi du fichier {filename} depuis {file_path}")

        def iterfile():  
            with open(file_path, mode="rb") as file_like:  
                yield from file_like  

        from fastapi.responses import StreamingResponse
        
        response = StreamingResponse(iterfile(), media_type="application/octet-stream")
        
        # Headers pour téléchargement via iframe
        # Content-Disposition: attachment force le navigateur à télécharger
        response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
        response.headers["X-Filename"] = filename
        response.headers["Access-Control-Expose-Headers"] = "X-Filename, Content-Disposition"
        
        return response
        
    except Exception as e:
        print(f"Erreur lecture fichier: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la lecture du fichier")
    # On garde aussi Content-Disposition mais en inline avec filename pour les navigateurs respectueux
    # Note: FileResponse gère déjà content-disposition si on passe filename, mais on veut forcer inline
    # Donc on le définit manuellement si besoin, ou on laisse FileResponse faire base
    
    # Pour être sûr que le frontend puisse lire ce header (CORS)
    response.headers["Access-Control-Expose-Headers"] = "X-Filename, Content-Disposition"
    
    return response