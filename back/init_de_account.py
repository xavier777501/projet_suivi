#!/usr/bin/env python3
"""
Script pour initialiser le compte DE dans la base de données WAMP
"""

from datetime import datetime
from sqlalchemy.orm import Session
from database.database import SessionLocal, engine
from models import Base, Utilisateur, RoleEnum
from core.jwt import get_password_hash

def create_de_account():
    """Crée le compte DE dans la base de données"""
    
    # Créer toutes les tables si elles n'existent pas
    print("Création des tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables créées/vérifiées")
    
    # Créer une session
    db = SessionLocal()
    
    try:
        # Vérifier si le compte DE existe déjà
        de_existant = db.query(Utilisateur).filter(
            Utilisateur.email == "de@genielogiciel.com"
        ).first()
        
        if de_existant:
            print(f"✅ Compte DE existe déjà: {de_existant.email}")
            print(f"   - Identifiant: {de_existant.identifiant}")
            print(f"   - Nom: {de_existant.nom} {de_existant.prenom}")
            print(f"   - Rôle: {de_existant.role}")
            print(f"   - Actif: {de_existant.actif}")
            return
        
        # Créer le compte DE
        print("Création du compte DE...")
        
        nouveau_de = Utilisateur(
            identifiant="de_principal",
            email="de@genielogiciel.com",
            mot_de_passe=get_password_hash("admin123"),
            nom="Directeur",
            prenom="Établissement",
            role=RoleEnum.DE,
            actif=True,
            mot_de_passe_temporaire=True,
            date_creation=datetime.utcnow(),
            token_activation=None,
            date_expiration_token=None
        )
        
        db.add(nouveau_de)
        db.commit()
        db.refresh(nouveau_de)
        
        print("✅ Compte DE créé avec succès!")
        print(f"   - Email: {nouveau_de.email}")
        print(f"   - Mot de passe: admin123")
        print(f"   - Identifiant: {nouveau_de.identifiant}")
        print(f"   - Rôle: {nouveau_de.role}")
        print("⚠️  Changez le mot de passe lors de la première connexion!")
        
    except Exception as e:
        print(f"❌ Erreur lors de la création du compte DE: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Initialisation du compte DE ===")
    create_de_account()
    print("=== Terminé ===")