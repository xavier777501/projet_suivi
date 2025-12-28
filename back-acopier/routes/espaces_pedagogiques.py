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
from utils.email_service import email_service
import secrets

router = APIRouter(prefix="/api/espaces-pedagogiques", tags=["Espaces Pédagogiques"])

# ==================== SCHEMAS ====================

class EspacePedagogiqueCreate(BaseModel):
    id_promotion: str
    id_matiere: str
    id_formateur: Optional[str] = None
    description: Optional[str] = None

class TravailCreate(BaseModel):
    id_espace: str
    titre: str
    description: str
    type_travail: str  # "INDIVIDUEL" ou "COLLECTIF"
    date_echeance: str  # Format ISO
    note_max: float = 20.0
    etudiants_selectionnes: Optional[List[str]] = []  # Liste des id_etudiant (optionnel)

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

class AssignFormateurRequest(BaseModel):
    id_formateur: Optional[str] = None

class AddEtudiantsRequest(BaseModel):
    etudiants_ids: List[str]

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
    return {"message": f"{count} étudiants ajoutés avec succès"}

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

@router.get("/{id_espace}/details")
async def obtenir_details_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Obtenir les détails et statistiques d'un espace (DE uniquement)"""
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au DE"
        )
    
    espace = db.query(EspacePedagogique).filter(EspacePedagogique.id_espace == id_espace).first()
    if not espace:
        raise HTTPException(status_code=404, detail="Espace non trouvé")
        
    # Stats
    # 1. Total étudiants (inscrits via Inscription)
    nb_etudiants = db.query(Inscription).filter(Inscription.id_espace == id_espace).count()
    
    # 2. Total travaux
    query_travaux = db.query(Travail).filter(Travail.id_espace == id_espace)
    nb_travaux = query_travaux.count()
    travaux_list = query_travaux.all()
    
    # 3. Moyenne générale (sur assignments rendus et notés)
    moyenne = 0.0
    notes_count = 0
    total_assignations = 0
    assignations_rendues = 0

    if nb_travaux > 0:
        assignations_query = db.query(Assignation).join(Travail).filter(Travail.id_espace == id_espace)
        total_assignations = assignations_query.count()
        
        assignations_rendues = assignations_query.filter(
            or_(
                Assignation.statut == StatutAssignationEnum.RENDU, 
                Assignation.statut == StatutAssignationEnum.CORRIGE
            )
        ).count()
        
        assignations_notees = assignations_query.filter(
            Assignation.note.isnot(None)
        ).all()
        
        if assignations_notees:
            somme_notes = sum([a.note for a in assignations_notees]) # Normaliser sur 20? On assume notes sur 20.
            notes_count = len(assignations_notees)
            moyenne = somme_notes / notes_count
            
    # Taux de complétion
    taux_completion = 0
    if total_assignations > 0:
        taux_completion = (assignations_rendues / total_assignations) * 100
        
    nom_formateur = "Non assigné"
    if espace.formateur and espace.formateur.utilisateur:
        nom_formateur = f"{espace.formateur.utilisateur.prenom} {espace.formateur.utilisateur.nom}"

    return {
        "info": {
            "nom_matiere": espace.matiere.nom_matiere,
            "promotion": espace.promotion.libelle,
            "filiere": espace.promotion.filiere.nom_filiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "date_creation": espace.date_creation.isoformat(),
            "formateur": nom_formateur
        },
        "statistiques": {
            "nb_etudiants": nb_etudiants,
            "nb_travaux": nb_travaux,
            "moyenne_generale": round(moyenne, 2),
            "taux_completion": round(taux_completion, 1),
            "nb_notes": notes_count
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

# ==================== ROUTES FORMATEUR ====================

@router.get("/espace/{id_espace}/etudiants")
async def lister_etudiants_espace(
    id_espace: str,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les étudiants d'un espace pédagogique (Formateur uniquement)"""
    
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux formateurs"
        )
    
    formateur = db.query(Formateur).filter(
        Formateur.identifiant == current_user.identifiant
    ).first()
    
    # Vérifier que l'espace existe et appartient au formateur
    espace = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_espace == id_espace,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not espace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espace pédagogique non trouvé ou non autorisé"
        )
    
    # Récupérer tous les étudiants de la promotion
    etudiants = db.query(Etudiant).filter(
        Etudiant.id_promotion == espace.id_promotion
    ).all()
    
    result = []
    for etudiant in etudiants:
        # Vérifier si l'utilisateur existe
        if not etudiant.utilisateur:
            print(f"Attention: étudiant {etudiant.id_etudiant} n'a pas d'utilisateur associé")
            continue
            
        # Compter les travaux assignés à cet étudiant dans cet espace
        nb_travaux = db.query(Assignation).join(Travail).filter(
            Travail.id_espace == id_espace,
            Assignation.id_etudiant == etudiant.id_etudiant
        ).count()
        
        result.append({
            "id_etudiant": etudiant.id_etudiant,
            "nom": etudiant.utilisateur.nom,
            "prenom": etudiant.utilisateur.prenom,
            "matricule": etudiant.matricule,
            "email": etudiant.utilisateur.email,
            "statut": etudiant.statut,
            "nb_travaux_assignes": nb_travaux
        })
    
    return {
        "espace": {
            "id_espace": espace.id_espace,
            "nom_matiere": espace.matiere.nom_matiere,
            "promotion": espace.promotion.libelle
        },
        "etudiants": result,
        "total": len(result)
    }

@router.get("/mes-espaces")
async def mes_espaces_formateur(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les espaces du formateur connecté"""
    
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux formateurs"
        )
    
    formateur = db.query(Formateur).filter(
        Formateur.identifiant == current_user.identifiant
    ).first()
    
    if not formateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil formateur non trouvé"
        )
    
    espaces = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).all()
    
    result = []
    for espace in espaces:
        etudiants = db.query(Etudiant).filter(
            Etudiant.id_promotion == espace.id_promotion
        ).all()
        
        nb_travaux = db.query(Travail).filter(
            Travail.id_espace == espace.id_espace
        ).count()
        
        result.append({
            "id_espace": espace.id_espace,
            "nom_matiere": espace.matiere.nom_matiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "promotion": espace.promotion.libelle,
            "filiere": espace.promotion.filiere.nom_filiere,
            "nb_etudiants": len(etudiants),
            "nb_travaux": nb_travaux,
            "etudiants": [
                {
                    "id_etudiant": e.id_etudiant,
                    "nom": e.utilisateur.nom if e.utilisateur else "N/A",
                    "prenom": e.utilisateur.prenom if e.utilisateur else "N/A",
                    "matricule": e.matricule,
                    "email": e.utilisateur.email if e.utilisateur else "N/A"
                } for e in etudiants
            ]
        })
    
    return {"espaces": result, "total": len(result)}

# ==================== ROUTES ETUDIANT ====================

@router.get("/mes-cours")
async def mes_cours_etudiant(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les cours de l'étudiant connecté"""
    
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux étudiants"
        )
    
    etudiant = db.query(Etudiant).filter(
        Etudiant.identifiant == current_user.identifiant
    ).first()
    
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil étudiant non trouvé"
        )
    
    # Récupérer tous les espaces de la promotion de l'étudiant
    espaces = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_promotion == etudiant.id_promotion
    ).all()
    
    result = []
    for espace in espaces:
        # Compter les travaux de cet espace
        nb_travaux = db.query(Travail).filter(
            Travail.id_espace == espace.id_espace
        ).count()
        
        # Compter les travaux assignés à cet étudiant dans cet espace
        nb_mes_travaux = db.query(Assignation).join(Travail).filter(
            Travail.id_espace == espace.id_espace,
            Assignation.id_etudiant == etudiant.id_etudiant
        ).count()
        
        result.append({
            "id_espace": espace.id_espace,
            "nom_matiere": espace.matiere.nom_matiere,
            "description": espace.description,
            "code_acces": espace.code_acces,
            "filiere": espace.promotion.filiere.nom_filiere,
            "formateur": {
                "nom": espace.formateur.utilisateur.nom if espace.formateur else "N/A",
                "prenom": espace.formateur.utilisateur.prenom if espace.formateur else "N/A",
                "email": espace.formateur.utilisateur.email if espace.formateur else "N/A"
            },
            "nb_travaux_total": nb_travaux,
            "nb_mes_travaux": nb_mes_travaux
        })
    
    return {"cours": result, "total": len(result)}

# ==================== ROUTES TRAVAUX ====================

@router.post("/travaux/creer")
async def creer_travail(
    data: TravailCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Créer un travail et l'assigner automatiquement (Formateur uniquement)"""
    
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les formateurs peuvent créer des travaux"
        )
    
    formateur = db.query(Formateur).filter(
        Formateur.identifiant == current_user.identifiant
    ).first()
    
    # Vérifier que l'espace existe et appartient au formateur
    espace = db.query(EspacePedagogique).filter(
        EspacePedagogique.id_espace == data.id_espace,
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).first()
    
    if not espace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Espace pédagogique non trouvé ou non autorisé"
        )
    
    # Créer le travail
    id_travail = generer_identifiant_unique("TRAVAIL")
    travail = Travail(
        id_travail=id_travail,
        id_espace=data.id_espace,
        titre=data.titre,
        description=data.description,
        type_travail=TypeTravailEnum(data.type_travail),
        date_echeance=datetime.fromisoformat(data.date_echeance),
        note_max=data.note_max,
        date_creation=datetime.utcnow()
    )
    
    db.add(travail)
    db.commit()
    db.refresh(travail)
    
    # Déterminer les étudiants à assigner
    if data.etudiants_selectionnes and len(data.etudiants_selectionnes) > 0:
        # Assignation à des étudiants spécifiques
        etudiants = db.query(Etudiant).filter(
            Etudiant.id_etudiant.in_(data.etudiants_selectionnes),
            Etudiant.id_promotion == espace.id_promotion  # Sécurité : vérifier qu'ils sont dans la bonne promotion
        ).all()
        print(f"Assignation individuelle à {len(etudiants)} étudiant(s) sélectionné(s)")
    else:
        # Assignation à toute la promotion (comportement par défaut)
        etudiants = db.query(Etudiant).filter(
            Etudiant.id_promotion == espace.id_promotion
        ).all()
        print(f"Assignation globale à {len(etudiants)} étudiant(s) de la promotion")
    
    # Créer les assignations
    assignations_creees = []
    for etudiant in etudiants:
        id_assignation = generer_identifiant_unique("ASSIGNATION")
        assignation = Assignation(
            id_assignation=id_assignation,
            id_etudiant=etudiant.id_etudiant,
            id_travail=id_travail,
            date_assignment=datetime.utcnow(),
            statut=StatutAssignationEnum.ASSIGNE
        )
        db.add(assignation)
        assignations_creees.append(assignation)
        
        # Envoyer email de notification
        try:
            email_service.envoyer_email_assignation_travail(
                destinataire=etudiant.utilisateur.email,
                prenom=etudiant.utilisateur.prenom,
                titre_travail=travail.titre,
                nom_matiere=espace.matiere.nom_matiere,
                formateur=f"{formateur.utilisateur.prenom} {formateur.utilisateur.nom}",
                date_echeance=travail.date_echeance.strftime("%d/%m/%Y à %H:%M"),
                description=travail.description
            )
        except Exception as e:
            print(f"Erreur envoi email à {etudiant.utilisateur.email}: {e}")
    
    db.commit()
    
    return {
        "message": "Travail créé et assigné avec succès",
        "travail": {
            "id_travail": travail.id_travail,
            "titre": travail.titre,
            "type_travail": travail.type_travail,
            "date_echeance": travail.date_echeance.isoformat(),
            "nb_assignations": len(assignations_creees)
        }
    }

@router.get("/travaux/mes-travaux")
async def mes_travaux_etudiant(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)
):
    """Lister les travaux assignés à l'étudiant"""
    
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux étudiants"
        )
    
    etudiant = db.query(Etudiant).filter(
        Etudiant.identifiant == current_user.identifiant
    ).first()
    
    assignations = db.query(Assignation).filter(
        Assignation.id_etudiant == etudiant.id_etudiant
    ).all()
    
    result = []
    for assignation in assignations:
        travail = assignation.travail
        espace = travail.espace_pedagogique
        
        result.append({
            "id_assignation": assignation.id_assignation,
            "statut": assignation.statut,
            "date_assignment": assignation.date_assignment.isoformat(),
            "travail": {
                "id_travail": travail.id_travail,
                "titre": travail.titre,
                "description": travail.description,
                "type_travail": travail.type_travail,
                "date_echeance": travail.date_echeance.isoformat(),
                "note_max": float(travail.note_max)
            },
            "espace": {
                "nom_matiere": espace.matiere.nom_matiere,
                "formateur": f"{espace.formateur.utilisateur.prenom} {espace.formateur.utilisateur.nom}" if espace.formateur else "N/A"
            }
        })
    
    return {"travaux": result, "total": len(result)}