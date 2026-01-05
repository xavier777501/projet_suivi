import os
import sys

# Ajouter le chemin du backend pour l'import des modèles
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from database.database import SessionLocal
from models import Utilisateur, Formateur, Etudiant

def supprimer_comptes_test(database_url, emails_a_supprimer):
    """
    Supprime les comptes de test avec une URL de base de données spécifiée.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    # Transformation de l'URL pour pymysql
    if database_url.startswith("mysql://"):
        database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
    
    # Configuration SSL simple pour TiDB (souvent nécessaire en externe)
    connect_args = {}
    if "tidb" in database_url:
        # On essaie une configuration SSL générique
        connect_args["ssl"] = {"ssl_verify_cert": False} 

    try:
        engine = create_engine(database_url, connect_args=connect_args)
        Session = sessionmaker(bind=engine)
        db = Session()
        
        print(f"\n📡 Connexion réussie à la base de données.")
        print(f"🔍 Nettoyage en cours...")
        
        for email in emails_a_supprimer:
            user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
            if user:
                print(f"🗑️ Suppression : {email}")
                db.delete(user)
            else:
                print(f"ℹ️ Pas trouvé : {email}")
        
        db.commit()
        print("✅ Nettoyage terminé !")
        db.close()
    except Exception as e:
        print(f"❌ Erreur de connexion ou SQL : {e}")

if __name__ == "__main__":
    # Liste des emails
    emails_tests = [
        "xaviertchalla0@mail.com",
        "xavfr38@gmail.com",
        "xav5210@gmail.com",
        "xav7153@gmail.com"
    ]
    
    # Récupération de l'URL
    url_prod = os.getenv("DATABASE_URL")
    if not url_prod:
        print("ℹ️ DATABASE_URL non trouvée dans l'environnement.")
        url_prod = input("👉 Veuillez coller l'URL de votre base TiDB (DATABASE_URL) : ").strip()
    
    if not url_prod:
        print("🛑 Aucune URL fournie. Abandon.")
        sys.exit(1)

    print(f"\n⚠️ Action sur : {url_prod[:30]}...")
    reponse = input("Confirmez-vous la suppression des 4 comptes ? (OUI/non) : ")
    if reponse == "OUI":
        supprimer_comptes_test(url_prod, emails_tests)
    else:
        print("🛑 Annulé.")
