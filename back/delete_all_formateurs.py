import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Utilisateur, RoleEnum

def supprimer_tous_les_formateurs(db_url):
    # Configuration SSL pour TiDB Cloud
    connect_args = {}
    if "tidbcloud.com" in db_url:
        connect_args = {
            "ssl": {
                "ca": "C:\\Users\\GENESYS\\.gemini\\antigravity\\brain\\6667658d-2db1-4f07-b8a9-ff64f758fde1\\isrgrootx1.pem" # Chemin générique ou ignoré si SSL non strict
            }
        }
    
    try:
        engine = create_engine(db_url, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        print("📡 Connexion à la base de données réussie.")
        
        # Récupérer tous les formateurs
        formateurs = db.query(Utilisateur).filter(Utilisateur.role == RoleEnum.FORMATEUR).all()
        
        if not formateurs:
            print("ℹ️ Aucun formateur trouvé dans la base de données.")
            return

        print(f"\n🔍 {len(formateurs)} formateurs trouvés :")
        for f in formateurs:
            print(f"   - {f.nom} {f.prenom} ({f.email})")
            
        confirmation = input("\n⚠️ Voulez-vous TOUS les supprimer ? (OUI/non) : ")
        if confirmation == "OUI":
            for f in formateurs:
                print(f"🗑️ Suppression de : {f.email}")
                db.delete(f)
            db.commit()
            print("\n✅ Tous les formateurs ont été supprimés avec succès.")
        else:
            print("\n🛑 Opération annulée.")
            
    except Exception as e:
        print(f"\n❌ Erreur : {e}")
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    url_prod = os.getenv("DATABASE_URL")
    if not url_prod:
        print("ℹ️ DATABASE_URL non trouvée dans l'environnement local.")
        url_prod = input("👉 Veuillez coller l'URL de votre base TiDB (DATABASE_URL) : ").strip()
    
    if url_prod:
        supprimer_tous_les_formateurs(url_prod)
    else:
        print("🛑 Aucune URL fournie.")
