"""
Script pour recréer complètement la base de données selon les nouveaux modèles
"""

from database.database import engine
from sqlalchemy import text
from models import Base  # Assurez-vous que models.py est importé pour que Base connaisse les modèles
import models # Importation explicite pour enregistrer les modèles

def recreate_database_schema():
    print("=== Recréation complète du schéma de la base de données ===\n")
    
    try:
        with engine.connect() as connection:
            # 1. Supprimer toutes les tables existantes
            print("1. Suppression des tables existantes...")
            
            # Désactiver les vérifications de clés étrangères pour permettre la suppression arbitraire
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
            # Obtenir la liste des tables
            result = connection.execute(text("SHOW TABLES"))
            tables = [row[0] for row in result.fetchall()]
            
            for table in tables:
                connection.execute(text(f"DROP TABLE IF EXISTS {table}"))
                print(f"   + Table {table} supprimée")
                
            # Réactiver les vérifications de clés étrangères
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            
            # 2. Recréer les tables via SQLAlchemy
            print("\n2. Création des tables via SQLAlchemy...")
            Base.metadata.create_all(bind=engine)
            print("   + Toutes les tables ont été recréées avec succès selon models.py")
            
            print("\n=== Schéma de la base de données recréé avec succès ===")
            print("La base est prête. Veuillez relancer main.py pour l'initialisation des données.")
            
    except Exception as e:
        print(f"Erreur lors de la recréation du schéma: {e}")
        raise

if __name__ == "__main__":
    recreate_database_schema()