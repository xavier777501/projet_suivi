#!/usr/bin/env python3

import sys
from sqlalchemy import create_engine, text
from database.database import SQLALCHEMY_DATABASE_URL, engine
from models import Utilisateur, RoleEnum

def test_database_connection():
    """Test la connexion à la base de données"""
    try:
        print("🔍 Test de connexion à la base de données...")
        print(f"URL: {SQLALCHEMY_DATABASE_URL}")
        
        # Test de connexion basique
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Connexion à la base de données réussie")
            
        # Test des tables
        from database.database import SessionLocal
        db = SessionLocal()
        
        try:
            # Vérifier si la table utilisateurs existe
            users_count = db.query(Utilisateur).count()
            print(f"✅ Table utilisateurs accessible - {users_count} utilisateur(s)")
            
            # Vérifier le compte DE
            de_user = db.query(Utilisateur).filter(Utilisateur.role == RoleEnum.DE).first()
            if de_user:
                print(f"✅ Compte DE trouvé: {de_user.email}")
                print(f"   - Actif: {de_user.actif}")
                print(f"   - Mot de passe temporaire: {de_user.mot_de_passe_temporaire}")
            else:
                print("❌ Aucun compte DE trouvé")
                
        except Exception as e:
            print(f"❌ Erreur lors de l'accès aux tables: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erreur de connexion à la base de données: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)