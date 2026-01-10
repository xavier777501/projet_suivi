from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator

from models import Utilisateur, TentativeConnexion, RoleEnum
from database.database import get_db
from core.auth import (
    generer_token_unique,
    initialiser_compte_de,
    verifier_tentatives_connexion,
    generer_token_jwt
)
from core.jwt import get_password_hash, verify_password

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str


class ResetTentativesRequest(BaseModel):
    email: str


class ChangePasswordRequest(BaseModel):
    token: str
    nouveau_mot_de_passe: str
    confirmation_mot_de_passe: str

    @validator('confirmation_mot_de_passe')
    def passwords_match(cls, v, values):
        if 'nouveau_mot_de_passe' in values and v != values['nouveau_mot_de_passe']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v


class ActivateAccountRequest(BaseModel):
    token: str
    mot_de_passe: str
    confirmation_mot_de_passe: str

    @validator('confirmation_mot_de_passe')
    def passwords_match(cls, v, values):
        if 'mot_de_passe' in values and v != values['mot_de_passe']:
            raise ValueError('Les mots de passe ne correspondent pas')
        return v


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Route de connexion utilisateur
    """
    # Étape 0: Initialiser le compte DE si nécessaire
    initialiser_compte_de(db)
    
    # Étape 1: Vérifier les tentatives de connexion
    erreur_tentatives = verifier_tentatives_connexion(db, request.email)
    if erreur_tentatives:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=erreur_tentatives
        )
    
    # Étape 2: Rechercher l'utilisateur par email
    utilisateur = db.query(Utilisateur).filter(Utilisateur.email == request.email).first()
    
    # Debug: Afficher les informations de débogage
    print(f"Debug: Email recherché: {request.email}")
    print(f"Debug: Utilisateur trouvé: {utilisateur is not None}")
    if utilisateur:
        print(f"Debug: Mot de passe en base: {utilisateur.mot_de_passe}")
        print(f"Debug: Mot de passe temporaire: {utilisateur.mot_de_passe_temporaire}")
        print(f"Debug: Actif: {utilisateur.actif}")
        print(f"Debug: Role: {utilisateur.role}")
        print(f"Debug: Identifiant: {utilisateur.identifiant}")
    else:
        print("Debug: Aucun utilisateur trouvé avec cet email")
    
    # Étape 3: Vérifier si l'utilisateur existe et est actif
    if not utilisateur or not utilisateur.actif:
        # Enregistrer la tentative échouée
        tentative = TentativeConnexion(
            email=request.email,
            succes=False
        )
        db.add(tentative)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_01", "message": "Identifiants invalides"}
        )
    
    # Étape 4: Vérifier le mot de passe
    # Nettoyage préventif des espaces
    request.mot_de_passe = request.mot_de_passe.strip()
    
    # Debug: Vérification du mot de passe
    print(f"Debug: Mot de passe fourni: {request.mot_de_passe}")
    print(f"Debug: Hash du mot de passe fourni: {get_password_hash(request.mot_de_passe)}")
    print(f"Debug: Hash en base: {utilisateur.mot_de_passe}")
    print(f"Debug: Correspondance: {verify_password(request.mot_de_passe, utilisateur.mot_de_passe)}")
    
    if not verify_password(request.mot_de_passe, utilisateur.mot_de_passe):
        # Enregistrer la tentative échouée
        tentative = TentativeConnexion(
            email=request.email,
            succes=False
        )
        db.add(tentative)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_01", "message": "Identifiants invalides"}
        )
    
    # Étape 5: Enregistrer la tentative réussie
    tentative = TentativeConnexion(
        email=request.email,
        succes=True
    )
    db.add(tentative)
    db.commit()
    
    # Étape 6: Vérifier si l'utilisateur doit changer son mot de passe temporaire
    if utilisateur.mot_de_passe_temporaire:
        token = generer_token_unique(32)
        date_expiration = datetime.utcnow() + timedelta(hours=24)
        
        # Mettre à jour le token d'activation
        utilisateur.token_activation = token
        utilisateur.date_expiration_token = date_expiration
        db.commit()
        
        return {
            "statut": "CHANGEMENT_MOT_DE_PASSE_REQUIS",
            "token": token,
            "utilisateur": {
                "identifiant": utilisateur.identifiant,
                "nom": utilisateur.nom,
                "prenom": utilisateur.prenom,
                "role": utilisateur.role,
                "email": utilisateur.email
            }
        }
    
    # Étape 7: Générer le token JWT
    token_jwt = generer_token_jwt({
        "identifiant": utilisateur.identifiant,
        "email": utilisateur.email,
        "nom": utilisateur.nom,
        "prenom": utilisateur.prenom,
        "role": utilisateur.role
    })
    
    return {
        "statut": "SUCCESS",
        "token": token_jwt,
        "utilisateur": {
            "identifiant": utilisateur.identifiant,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
            "role": utilisateur.role,
            "email": utilisateur.email
        }
    }


@router.post("/changer-mot-de-passe")
def changer_mot_de_passe(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    """
    Route pour changer le mot de passe (pour le DE avec mot de passe temporaire)
    """
    # Étape 1: Vérifier le token d'activation
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.token_activation == request.token,
        Utilisateur.date_expiration_token > datetime.utcnow()
    ).first()
    
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalide ou expiré"
        )
    
    # Étape 2: Vérifier que les mots de passe correspondent (déjà fait par Pydantic)
    
    # Étape 3: Hacher le nouveau mot de passe
    mot_de_passe_hache = get_password_hash(request.nouveau_mot_de_passe)
    
    # Étape 4: Mettre à jour l'utilisateur
    utilisateur.mot_de_passe = mot_de_passe_hache
    utilisateur.mot_de_passe_temporaire = False
    utilisateur.token_activation = None
    utilisateur.date_expiration_token = None
    db.commit()
    
    # Étape 5: Générer le token JWT
    token_jwt = generer_token_jwt({
        "identifiant": utilisateur.identifiant,
        "email": utilisateur.email,
        "nom": utilisateur.nom,
        "prenom": utilisateur.prenom,
        "role": utilisateur.role
    })
    
    return {
        "statut": "SUCCESS",
        "message": "Mot de passe changé avec succès",
        "token": token_jwt,
        "utilisateur": {
            "identifiant": utilisateur.identifiant,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
            "role": utilisateur.role,
            "email": utilisateur.email
        }
    }


@router.post("/activer-compte")
def activer_compte(request: ActivateAccountRequest, db: Session = Depends(get_db)):
    """
    Route pour activer un compte (pour les utilisateurs créés par le DE)
    """
    # Étape 1: Vérifier le token d'activation
    utilisateur = db.query(Utilisateur).filter(
        Utilisateur.token_activation == request.token,
        Utilisateur.date_expiration_token > datetime.utcnow()
    ).first()
    
    if not utilisateur:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalide ou expiré"
        )
    
    # Étape 2: Vérifier que le compte n'est pas déjà activé
    if utilisateur.actif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Compte déjà activé"
        )
    
    # Étape 3: Vérifier que les mots de passe correspondent (déjà fait par Pydantic)
    
    # Étape 4: Hacher le mot de passe
    mot_de_passe_hache = get_password_hash(request.mot_de_passe)
    
    # Étape 5: Mettre à jour l'utilisateur
    utilisateur.mot_de_passe = mot_de_passe_hache
    utilisateur.actif = True
    utilisateur.mot_de_passe_temporaire = False
    utilisateur.token_activation = None
    utilisateur.date_expiration_token = None
    db.commit()
    
    # Étape 6: Générer le token JWT
    token_jwt = generer_token_jwt({
        "identifiant": utilisateur.identifiant,
        "email": utilisateur.email,
        "nom": utilisateur.nom,
        "prenom": utilisateur.prenom,
        "role": utilisateur.role
    })
    
    return {
        "statut": "SUCCESS",
        "message": "Compte activé avec succès",
        "token": token_jwt,
        "utilisateur": {
            "identifiant": utilisateur.identifiant,
            "nom": utilisateur.nom,
            "prenom": utilisateur.prenom,
            "role": utilisateur.role,
            "email": utilisateur.email
        }
    }


@router.post("/reset-tentatives")
def reset_tentatives(request: ResetTentativesRequest, db: Session = Depends(get_db)):
    """
    Route temporaire pour réinitialiser les tentatives de connexion
    """
    from datetime import datetime, timedelta

    email = request.email

    # Supprimer toutes les tentatives échouées pour cet email datant de moins de 15 minutes
    date_limite = datetime.utcnow() - timedelta(minutes=15)

    db.query(TentativeConnexion).filter(
        TentativeConnexion.email == email,
        TentativeConnexion.succes == False,
        TentativeConnexion.date_tentative > date_limite
    ).delete()

    db.commit()

    return {"message": f"Tentatives de connexion réinitialisées pour {email}"}


@router.post("/test-connexion")
def test_connexion(email: str, mot_de_passe: str, db: Session = Depends(get_db)):
    """
    Route de test pour vérifier la connexion d'un utilisateur
    """
    print(f"🔍 TEST CONNEXION: Tentative de connexion pour {email}")

    utilisateur = db.query(Utilisateur).filter(Utilisateur.email == email).first()

    if not utilisateur:
        print(f"❌ UTILISATEUR NON TROUVÉ: {email}")
        return {"statut": "ERREUR", "message": "Utilisateur non trouvé"}

    print(f"✅ UTILISATEUR TROUVÉ: {utilisateur.email}")
    print(f"🔑 HASH EN BASE: {utilisateur.mot_de_passe}")

    # Vérifier le mot de passe
    verification = verify_password(mot_de_passe, utilisateur.mot_de_passe)
    print(f"🔐 MOT DE PASSE FOURNI: {mot_de_passe}")
    print(f"🔒 CORRESPONDANCE: {'OUI' if verification else 'NON'}")

    if verification:
        return {
            "statut": "SUCCES",
            "message": "Connexion réussie",
            "utilisateur": {
                "identifiant": utilisateur.identifiant,
                "nom": utilisateur.nom,
                "prenom": utilisateur.prenom,
                "role": utilisateur.role,
                "email": utilisateur.email
            }
        }
    else:
        return {
            "statut": "ECHEC",
            "message": "Mot de passe incorrect"
        }