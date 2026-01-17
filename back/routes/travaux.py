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

router = APIRouter(prefix="", tags=["Travaux"])

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
    date_echeance: Optional[datetime] = None

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

# Schéma pour simuler l'ancienne table Livraison (US 4 & 6)
class LivraisonSimulated(BaseModel):
    id_livraison: str
    date_livraison: Optional[datetime]
    note_attribuee: Optional[Decimal]
    feedback: Optional[str]
    commentaire: Optional[str]
    fichier_path: Optional[str]

class AssignationResponse(BaseModel):
    id_assignation: str
    titre_travail: str
    nom_matiere: Optional[str]
    nom_etudiant: str
    prenom_etudiant: str
    date_assignment: datetime
    date_echeance: datetime
    statut: StatutAssignationEnum
    type_travail: Optional[TypeTravailEnum]
    livraison: Optional[LivraisonSimulated] = None

    class Config:
        from_attributes = True

class EvaluationRequest(BaseModel):
    note_attribuee: Decimal
    feedback: Optional[str]

class MesTravauxResponse(BaseModel):
    id_assignation: str
    id_travail: str
    titre_travail: str
    description_travail: str
    nom_matiere: str
    type_travail: TypeTravailEnum
    date_assignment: datetime
    date_echeance: datetime
    statut: StatutAssignationEnum
    note_max: Decimal
    # Pour l'étudiant, on garde aussi le nesting pour la compatibilité
    livraison: Optional[LivraisonSimulated] = None

    class Config:
        from_attributes = True

# ==================== ROUTES ====================

@router.post("/creer", response_model=TravailResponse, status_code=status.HTTP_201_CREATED)
async def creer_travail(
    data: TravailCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Seuls les formateurs peuvent créer des travaux")
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(status_code=404, detail="Profil formateur non trouvé")
    
    espace = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_espace == data.id_espace,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not espace:
        raise HTTPException(status_code=403, detail="Vous n'êtes pas autorisé dans cet espace")
    
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
    db.commit()
    db.refresh(nouveau_travail)
    return nouveau_travail

@router.get("/espace/{id_espace}", response_model=List[TravailResponse])
async def lister_travaux_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    travaux = db.query(Travail).filter(Travail.id_espace == id_espace).order_by(Travail.date_creation.desc()).all()
    return travaux

@router.post("/assigner", status_code=status.HTTP_201_CREATED)
async def assigner_travail(
    data: AssignationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403, detail="Accès réservé aux formateurs")

    travail = db.query(Travail).filter(Travail.id_travail == data.id_travail).first()
    if not travail:
        raise HTTPException(status_code=404, detail="Travail non trouvé")

    if data.date_echeance:
        travail.date_echeance = data.date_echeance

    resultats = []
    for id_etudiant in data.etudiants_ids:
        existe = db.query(Assignation).filter(
            Assignation.id_travail == data.id_travail,
            Assignation.id_etudiant == id_etudiant
        ).first()

        if existe:
            existe.statut = StatutAssignationEnum.ASSIGNE
            existe.date_assignment = datetime.utcnow()
        else:
            id_assignation = generer_identifiant_unique("ASG")
            nouvelle_assignation = Assignation(
                id_assignation=id_assignation,
                id_travail=data.id_travail,
                id_etudiant=id_etudiant,
                date_assignment=datetime.utcnow(),
                statut=StatutAssignationEnum.ASSIGNE
            )
            db.add(nouvelle_assignation)
        
        etudiant = db.query(Etudiant).filter(Etudiant.id_etudiant == id_etudiant).first()
        if etudiant and etudiant.utilisateur:
            try:
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
            except: pass
        
        resultats.append(id_etudiant)

    db.commit()
    return {"message": f"{len(resultats)} assignation(s) créée(s)", "assignes": resultats}

@router.get("/mes-assignations", response_model=List[AssignationResponse])
async def lister_mes_assignations(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(status_code=403)
    
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    
    assignations = db.query(Assignation).join(Travail).join(EspacePedagogique).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).order_by(Assignation.date_assignment.desc()).all()

    # Formater manuellement pour inclure le nesting 'livraison'
    result = []
    for a in assignations:
        livraison = None
        if a.statut in [StatutAssignationEnum.RENDU, StatutAssignationEnum.NOTE]:
            livraison = LivraisonSimulated(
                id_livraison=a.id_assignation,
                date_livraison=a.date_soumission,
                note_attribuee=a.note,
                feedback=a.commentaire_formateur,
                commentaire=a.commentaire_etudiant,
                fichier_path=a.fichier_path
            )
        
        result.append(AssignationResponse(
            id_assignation=a.id_assignation,
            titre_travail=a.travail.titre,
            nom_matiere=a.travail.espace_pedagogique.matiere.nom_matiere,
            nom_etudiant=a.etudiant.utilisateur.nom,
            prenom_etudiant=a.etudiant.utilisateur.prenom,
            date_assignment=a.date_assignment,
            date_echeance=a.travail.date_echeance,
            statut=a.statut,
            type_travail=a.travail.type_travail,
            livraison=livraison
        ))
    return result

@router.get("/travail/{id_travail}/livraisons")
async def lister_livraisons_travail(
    id_travail: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    travail = db.query(Travail).filter(Travail.id_travail == id_travail).first()
    if not travail: raise HTTPException(404)

    assignations = db.query(Assignation).filter(Assignation.id_travail == id_travail).all()

    result_assignations = []
    for a in assignations:
        livraison = None
        if a.statut in [StatutAssignationEnum.RENDU, StatutAssignationEnum.NOTE]:
            livraison = {
                "id_livraison": a.id_assignation,
                "date_livraison": a.date_soumission,
                "note_attribuee": a.note,
                "feedback": a.commentaire_formateur,
                "commentaire": a.commentaire_etudiant,
                "fichier_path": a.fichier_path
            }
        
        result_assignations.append({
            "id_assignation": a.id_assignation,
            "nom_etudiant": a.etudiant.utilisateur.nom,
            "prenom_etudiant": a.etudiant.utilisateur.prenom,
            "statut": a.statut,
            "livraison": livraison
        })

    return {
        "id_travail": travail.id_travail,
        "titre": travail.titre,
        "note_max": travail.note_max,
        "assignations": result_assignations
    }

@router.get("/mes-travaux", response_model=List[MesTravauxResponse])
async def lister_mes_travaux_etudiant(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(status_code=403)
    
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    
    assignations = db.query(Assignation).filter(Assignation.id_etudiant == etudiant.id_etudiant).all()

    result = []
    for a in assignations:
        livraison = None
        if a.statut in [StatutAssignationEnum.RENDU, StatutAssignationEnum.NOTE]:
            livraison = LivraisonSimulated(
                id_livraison=a.id_assignation,
                date_livraison=a.date_soumission,
                note_attribuee=a.note,
                feedback=a.commentaire_formateur,
                commentaire=a.commentaire_etudiant,
                fichier_path=a.fichier_path
            )
        
        result.append(MesTravauxResponse(
            id_assignation=a.id_assignation,
            id_travail=a.id_travail,
            titre_travail=a.travail.titre,
            description_travail=a.travail.description,
            nom_matiere=a.travail.espace_pedagogique.matiere.nom_matiere,
            type_travail=a.travail.type_travail,
            date_assignment=a.date_assignment,
            date_echeance=a.travail.date_echeance,
            statut=a.statut,
            note_max=a.travail.note_max,
            livraison=livraison
        ))
    return result

@router.post("/livrer/{id_assignation}", status_code=status.HTTP_201_CREATED)
async def livrer_travail(
    id_assignation: str,
    commentaire: Optional[str] = Form(None),
    fichier: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    assignation = db.query(Assignation).filter(Assignation.id_assignation == id_assignation).first()
    if not assignation: raise HTTPException(404)

    upload_dir = Path("uploads/travaux")
    upload_dir.mkdir(parents=True, exist_ok=True)
    unique_filename = f"{id_assignation}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{Path(fichier.filename).suffix}"
    full_path = upload_dir / unique_filename
    
    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(fichier.file, buffer)

    assignation.statut = StatutAssignationEnum.RENDU
    assignation.date_soumission = datetime.utcnow()
    assignation.commentaire_etudiant = commentaire
    assignation.fichier_path = str(full_path)

    db.commit()
    
    # Notification formateur
    try:
        f = assignation.travail.espace_pedagogique.formateur
        if f and f.utilisateur:
            background_tasks.add_task(
                email_service.envoyer_email_soumission_travail,
                destinataire=f.utilisateur.email,
                prenom_formateur=f.utilisateur.prenom,
                prenom_etudiant=current_user.prenom,
                nom_etudiant=current_user.nom,
                titre_travail=assignation.travail.titre,
                nom_matiere=assignation.travail.espace_pedagogique.matiere.nom_matiere,
                date_soumission=assignation.date_soumission.strftime("%d/%m/%Y à %H:%M"),
                commentaire=commentaire or ""
            )
    except: pass

    # On retourne un objet livraison pour la compatibilité frontend
    return {
        "id_livraison": assignation.id_assignation,
        "date_livraison": assignation.date_soumission,
        "commentaire": assignation.commentaire_etudiant
    }

@router.post("/evaluer/{id_assignation}")
async def evaluer_travail(
    id_assignation: str,
    data: EvaluationRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    assignation = db.query(Assignation).filter(Assignation.id_assignation == id_assignation).first()
    if not assignation: raise HTTPException(404)

    assignation.statut = StatutAssignationEnum.NOTE
    assignation.date_evaluation = datetime.utcnow()
    assignation.note = data.note_attribuee
    assignation.commentaire_formateur = data.feedback

    db.commit()

    try:
        et = assignation.etudiant
        if et and et.utilisateur:
            background_tasks.add_task(
                email_service.envoyer_email_evaluation_travail,
                destinataire=et.utilisateur.email,
                prenom_etudiant=et.utilisateur.prenom,
                titre_travail=assignation.travail.titre,
                nom_matiere=assignation.travail.espace_pedagogique.matiere.nom_matiere,
                note=float(data.note_attribuee),
                note_max=float(assignation.travail.note_max),
                commentaire=data.feedback,
                formateur=f"{current_user.prenom} {current_user.nom}"
            )
    except: pass

    return {"message": "Note enregistrée", "note_attribuee": assignation.note}

@router.get("/telecharger/{id_assignation}")
async def telecharger_fichier_travail(
    id_assignation: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    assignation = db.query(Assignation).filter(Assignation.id_assignation == id_assignation).first()
    if not assignation or not assignation.fichier_path:
        raise HTTPException(status_code=404)
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=assignation.fichier_path,
        filename=os.path.basename(assignation.fichier_path),
        media_type='application/octet-stream'
    )
