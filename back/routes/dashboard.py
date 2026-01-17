from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct
from datetime import datetime, date
from typing import Dict, Any, List

from database.database import get_db
from core.auth import get_current_user
from models import (
    Utilisateur, RoleEnum, Filiere, Matiere, Promotion, 
    Etudiant, Formateur, EspacePedagogique, Travail, 
    Assignation, StatutAssignationEnum, StatutEtudiantEnum, Inscription
)

router = APIRouter()

@router.get("/de")
def get_de_dashboard(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tableau de bord pour le Directeur d'Établissement
    """
    # Vérifier que l'utilisateur est bien un DE
    if current_user.role != RoleEnum.DE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au Directeur d'Établissement"
        )
    
    # 1. Statistiques générales
    total_etudiants = db.query(Etudiant).count()
    etudiants_actifs = db.query(Etudiant).filter(Etudiant.statut == StatutEtudiantEnum.ACTIF).count()
    total_formateurs = db.query(Formateur).count()
    total_filieres = db.query(Filiere).count()
    total_promotions = db.query(Promotion).count()
    total_espaces = db.query(EspacePedagogique).count()
    total_travaux = db.query(Travail).count()
    
    # 2. Répartition des étudiants par filière
    repartition_filieres = db.query(
        Filiere.nom_filiere,
        func.count(Etudiant.id_etudiant).label('nombre_etudiants')
    ).join(
        Promotion, Filiere.id_filiere == Promotion.id_filiere
    ).join(
        Etudiant, Promotion.id_promotion == Etudiant.id_promotion
    ).group_by(Filiere.nom_filiere).all()
    
    # 3. Activité récente (derniers travaux créés)
    travaux_recents = db.query(
        Travail.titre,
        Travail.date_creation,
        Matiere.nom_matiere,
        Promotion.libelle.label('promotion')
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Promotion, EspacePedagogique.id_promotion == Promotion.id_promotion
    ).order_by(Travail.date_creation.desc()).limit(5).all()
    
    # 4. Espaces pédagogiques sans formateur
    espaces_sans_formateur = db.query(
        EspacePedagogique.id_espace,
        Matiere.nom_matiere,
        Promotion.libelle.label('promotion')
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Promotion, EspacePedagogique.id_promotion == Promotion.id_promotion
    ).filter(EspacePedagogique.id_formateur.is_(None)).all()
    
    # 5. Statistiques des travaux
    travaux_en_cours = db.query(Assignation).filter(
        Assignation.statut == StatutAssignationEnum.EN_COURS
    ).count()
    
    travaux_rendus = db.query(Assignation).filter(
        Assignation.statut == StatutAssignationEnum.RENDU
    ).count()
    
    travaux_notes = db.query(Assignation).filter(
        Assignation.statut == StatutAssignationEnum.NOTE
    ).count()
    
    # 6. Promotions actives (année académique en cours)
    annee_actuelle = datetime.now().year
    promotions_actives = db.query(
        Promotion.libelle,
        Promotion.annee_academique,
        Filiere.nom_filiere,
        func.count(Etudiant.id_etudiant).label('nombre_etudiants')
    ).join(
        Filiere, Promotion.id_filiere == Filiere.id_filiere
    ).outerjoin(
        Etudiant, Promotion.id_promotion == Etudiant.id_promotion
    ).filter(
        Promotion.annee_academique.like(f"%{annee_actuelle}%")
    ).group_by(
        Promotion.id_promotion, Promotion.libelle, 
        Promotion.annee_academique, Filiere.nom_filiere
    ).all()
    
    return {
        "statistiques_generales": {
            "total_etudiants": total_etudiants,
            "etudiants_actifs": etudiants_actifs,
            "total_formateurs": total_formateurs,
            "total_filieres": total_filieres,
            "total_promotions": total_promotions,
            "total_espaces": total_espaces,
            "total_travaux": total_travaux
        },
        "repartition_filieres": [
            {
                "filiere": row.nom_filiere,
                "nombre_etudiants": row.nombre_etudiants
            }
            for row in repartition_filieres
        ],
        "activite_recente": [
            {
                "titre": row.titre,
                "date_creation": row.date_creation.isoformat(),
                "matiere": row.nom_matiere,
                "promotion": row.promotion
            }
            for row in travaux_recents
        ],
        "espaces_sans_formateur": [
            {
                "id_espace": row.id_espace,
                "matiere": row.nom_matiere,
                "promotion": row.promotion
            }
            for row in espaces_sans_formateur
        ],
        "statistiques_travaux": {
            "en_cours": travaux_en_cours,
            "rendus": travaux_rendus,
            "notes": travaux_notes,
            "total": travaux_en_cours + travaux_rendus + travaux_notes
        },
        "promotions_actives": [
            {
                "libelle": row.libelle,
                "annee_academique": row.annee_academique,
                "filiere": row.nom_filiere,
                "nombre_etudiants": row.nombre_etudiants or 0
            }
            for row in promotions_actives
        ]
    }

@router.get("/formateur")
def get_formateur_dashboard(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tableau de bord pour le Formateur
    """
    if current_user.role != RoleEnum.FORMATEUR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux Formateurs"
        )
    
    # Récupérer le formateur
    formateur = db.query(Formateur).filter(Formateur.identifiant == current_user.identifiant).first()
    if not formateur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil formateur non trouvé"
        )
    
    # Mes espaces pédagogiques
    mes_espaces_query = db.query(
        EspacePedagogique.id_espace,
        Matiere.nom_matiere,
        Promotion.libelle.label('promotion'),
        func.count(distinct(Travail.id_travail)).label('nombre_travaux'),
        func.count(distinct(Inscription.id_etudiant)).label('nombre_etudiants')
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Promotion, EspacePedagogique.id_promotion == Promotion.id_promotion
    ).outerjoin(
        Travail, EspacePedagogique.id_espace == Travail.id_espace
    ).outerjoin(
        Inscription, EspacePedagogique.id_espace == Inscription.id_espace
    ).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).group_by(
        EspacePedagogique.id_espace, Matiere.nom_matiere, Promotion.libelle
    ).all()

    # Statistiques générales
    total_espaces = len(mes_espaces_query)
    total_travaux = db.query(func.count(Travail.id_travail)).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).filter(EspacePedagogique.id_formateur == formateur.id_formateur).scalar() or 0
    
    total_etudiants = db.query(func.count(distinct(Inscription.id_etudiant))).join(
        EspacePedagogique, Inscription.id_espace == EspacePedagogique.id_espace
    ).filter(EspacePedagogique.id_formateur == formateur.id_formateur).scalar() or 0

    # Travaux à corriger (assignations au statut RENDU)
    travaux_a_corriger = db.query(func.count(Assignation.id_assignation)).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur,
        Assignation.statut == StatutAssignationEnum.RENDU
    ).scalar() or 0

    # Travaux récents
    travaux_recents = db.query(
        Travail.id_travail,
        Travail.titre,
        Travail.date_creation,
        Matiere.nom_matiere,
        Promotion.libelle.label('promotion')
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Promotion, EspacePedagogique.id_promotion == Promotion.id_promotion
    ).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur
    ).order_by(Travail.date_creation.desc()).limit(5).all()

    # Évaluations en attente (groupées par travail)
    evaluations_en_attente = db.query(
        Travail.id_travail,
        Travail.titre,
        func.count(Assignation.id_assignation).label('nombre_copies'),
        Matiere.nom_matiere,
        Promotion.libelle.label('promotion')
    ).join(
        Assignation, Travail.id_travail == Assignation.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).join(
        Promotion, EspacePedagogique.id_promotion == Promotion.id_promotion
    ).filter(
        EspacePedagogique.id_formateur == formateur.id_formateur,
        Assignation.statut == StatutAssignationEnum.RENDU
    ).group_by(Travail.id_travail, Travail.titre, Matiere.nom_matiere, Promotion.libelle).all()

    # Dernières livraisons (détails individuels)
    dernieres_livraisons = db.query(
        Assignation.id_assignation,
        Travail.id_travail,
        Travail.titre.label('titre_travail'),
        Utilisateur.nom.label('nom_etudiant'),
        Utilisateur.prenom.label('prenom_etudiant'),
        Matiere.nom_matiere,
        # On suppose qu'il y a une relation livraison
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
        EspacePedagogique.id_formateur == formateur.id_formateur,
        Assignation.statut == StatutAssignationEnum.RENDU
    ).order_by(Assignation.date_assignment.desc()).limit(5).all()

    return {
        "formateur": {
            "nom": current_user.nom,
            "prenom": current_user.prenom,
            "matiere": formateur.matiere.nom_matiere if formateur.matiere else None
        },
        "mes_espaces": [
            {
                "id_espace": row.id_espace,
                "matiere": row.nom_matiere,
                "promotion": row.promotion,
                "nombre_travaux": row.nombre_travaux or 0,
                "nombre_etudiants": row.nombre_etudiants or 0
            }
            for row in mes_espaces_query
        ],
        "statistiques_generales": {
            "total_espaces": total_espaces,
            "total_etudiants": total_etudiants,
            "total_travaux": total_travaux,
            "travaux_a_corriger": travaux_a_corriger
        },
        "travaux_recents": [
            {
                "id_travail": row.id_travail,
                "titre": row.titre,
                "date_creation": row.date_creation.isoformat(),
                "matiere": row.nom_matiere,
                "promotion": row.promotion,
                "statut": "Actif" # Simplifié
            }
            for row in travaux_recents
        ],
        "evaluations_en_attente": [
            {
                "id_travail": row.id_travail,
                "titre": row.titre,
                "nombre_copies": row.nombre_copies,
                "matiere": row.nom_matiere,
                "promotion": row.promotion
            }
            for row in evaluations_en_attente
        ],
        "dernieres_livraisons": [
            {
                "id_assignation": row.id_assignation,
                "id_travail": row.id_travail,
                "titre_travail": row.titre_travail,
                "nom_etudiant": row.nom_etudiant,
                "prenom_etudiant": row.prenom_etudiant,
                "matiere": row.nom_matiere
            }
            for row in dernieres_livraisons
        ]
    }

@router.get("/etudiant")
def get_etudiant_dashboard(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Tableau de bord pour l'Étudiant
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux Étudiants"
        )
    
    # Récupérer l'étudiant
    etudiant = db.query(Etudiant).filter(Etudiant.identifiant == current_user.identifiant).first()
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil étudiant non trouvé"
        )
    
    # Mes assignations
    mes_assignations = db.query(
        Assignation.statut,
        Travail.titre,
        Travail.date_echeance,
        Matiere.nom_matiere
    ).join(
        Travail, Assignation.id_travail == Travail.id_travail
    ).join(
        EspacePedagogique, Travail.id_espace == EspacePedagogique.id_espace
    ).join(
        Matiere, EspacePedagogique.id_matiere == Matiere.id_matiere
    ).filter(
        Assignation.id_etudiant == etudiant.id_etudiant
    ).all()
    
    return {
        "etudiant": {
            "nom": current_user.nom,
            "prenom": current_user.prenom,
            "matricule": etudiant.matricule,
            "promotion": etudiant.promotion.libelle if etudiant.promotion else None
        },
        "mes_travaux": [
            {
                "titre": row.titre,
                "matiere": row.nom_matiere,
                "date_echeance": row.date_echeance.isoformat(),
                "statut": row.statut
            }
            for row in mes_assignations
        ]
    }

@router.get("/etudiant/classement")
def get_classement_promotion(
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Classement général de la promotion de l'étudiant (US 11.1)
    Calcule la moyenne de chaque étudiant et retourne le classement
    """
    if current_user.role != RoleEnum.ETUDIANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux Étudiants"
        )
    
    # Récupérer l'étudiant actuel
    etudiant_actuel = db.query(Etudiant).filter(
        Etudiant.identifiant == current_user.identifiant
    ).first()
    
    if not etudiant_actuel or not etudiant_actuel.id_promotion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profil étudiant ou promotion non trouvé"
        )
    
    # Récupérer tous les étudiants de la même promotion
    etudiants_promotion = db.query(Etudiant).filter(
        Etudiant.id_promotion == etudiant_actuel.id_promotion,
        Etudiant.statut == StatutEtudiantEnum.ACTIF
    ).all()
    
    # Calculer la moyenne pour chaque étudiant
    classement = []
    for etudiant in etudiants_promotion:
        # Récupérer toutes les notes de l'étudiant
        notes = db.query(Assignation.note).filter(
            Assignation.id_etudiant == etudiant.id_etudiant,
            Assignation.statut == StatutAssignationEnum.NOTE,
            Assignation.note.isnot(None)
        ).all()
        
        if notes:
            moyenne = sum(float(note[0]) for note in notes) / len(notes)
            nombre_travaux_notes = len(notes)
        else:
            moyenne = 0.0
            nombre_travaux_notes = 0
        
        classement.append({
            "id_etudiant": etudiant.id_etudiant,
            "nom": etudiant.utilisateur.nom,
            "prenom": etudiant.utilisateur.prenom,
            "matricule": etudiant.matricule,
            "moyenne": round(moyenne, 2),
            "nombre_travaux_notes": nombre_travaux_notes,
            "est_moi": etudiant.id_etudiant == etudiant_actuel.id_etudiant
        })
    
    # Trier par moyenne décroissante
    classement.sort(key=lambda x: x["moyenne"], reverse=True)
    
    # Ajouter le rang
    for index, item in enumerate(classement, start=1):
        item["rang"] = index
    
    # Trouver le rang de l'étudiant actuel
    mon_rang = next(
        (item["rang"] for item in classement if item["est_moi"]),
        None
    )
    
    ma_moyenne = next(
        (item["moyenne"] for item in classement if item["est_moi"]),
        0.0
    )
    
    return {
        "promotion": etudiant_actuel.promotion.libelle,
        "annee_academique": etudiant_actuel.promotion.annee_academique,
        "mon_rang": mon_rang,
        "ma_moyenne": ma_moyenne,
        "total_etudiants": len(classement),
        "classement": classement
    }