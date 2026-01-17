import pymysql
import os

def sync_database():
    print("🔄 Synchronisation de la base de données...")
    
    # Configuration (identique à database.py)
    host = 'localhost'
    user = 'root'
    password = ''
    db_name = 'suiviprojet'
    
    try:
        connection = pymysql.connect(
            host=host,
            user=user,
            password=password,
            database=db_name,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )

        with connection.cursor() as cursor:
            # Liste des colonnes à ajouter à la table 'assignation'
            columns_to_add = [
                ("date_soumission", "DATETIME NULL"),
                ("commentaire_etudiant", "TEXT NULL"),
                ("fichier_path", "VARCHAR(255) NULL"),
                ("date_evaluation", "DATETIME NULL"),
                ("note", "NUMERIC(3, 1) NULL"),
                ("commentaire_formateur", "TEXT NULL")
            ]

            for col_name, col_def in columns_to_add:
                # Vérifier si la colonne existe déjà
                cursor.execute(f"SHOW COLUMNS FROM assignation LIKE '{col_name}'")
                result = cursor.fetchone()
                
                if not result:
                    print(f"➕ Ajout de la colonne '{col_name}'...")
                    cursor.execute(f"ALTER TABLE assignation ADD COLUMN {col_name} {col_def}")
                else:
                    print(f"✅ La colonne '{col_name}' existe déjà.")

            connection.commit()
            print("✨ Synchronisation terminée avec succès !")
            
    except Exception as e:
        print(f"❌ Erreur lors de la synchronisation : {e}")
    finally:
        if 'connection' in locals():
            connection.close()

if __name__ == "__main__":
    sync_database()
