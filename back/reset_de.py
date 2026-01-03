import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ajouter le chemin courant pour les imports
sys.path.append(os.getcwd())

from database.database import Base, SQLALCHEMY_DATABASE_URL
from models import Utilisateur, RoleEnum
from core.jwt import get_password_hash

def reset_de_password():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        de_user = db.query(Utilisateur).filter(Utilisateur.email == "de@genielogiciel.com").first()
        if de_user:
            print(f"Compte DE trouvé: {de_user.email}")
            new_hash = get_password_hash("admin123")
            de_user.mot_de_passe = new_hash
            de_user.mot_de_passe_temporaire = False  # Compte activé pour les tests
            db.commit()
            print("SUCCÈS : Mot de passe réinitialisé à 'admin123'")
        else:
            print("ERREUR : Compte DE non trouvé")
            
    except Exception as e:
        print(f"ERREUR : {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_de_password()
