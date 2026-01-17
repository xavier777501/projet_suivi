from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Utilise DATABASE_URL de l'environnement (Render) ou l'adresse locale par défaut
url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/suiviprojet")

# Dictionnaire d'arguments de connexion
connect_args = {}

# Si l'URL commence par 'mysql://' (donné par TiDB), on la transforme en 'mysql+pymysql://'
if url and url.startswith("mysql://"):
    url = url.replace("mysql://", "mysql+pymysql://", 1)
    
    # Si on est sur Render (déduit via la présence de DATABASE_URL), on active le SSL
    # Le chemin /etc/ssl/certs/ca-certificates.crt est standard sur Linux (Render)
    # Cette condition est ajoutée si DATABASE_URL est défini, ce qui est le cas en production sur Render
    if os.getenv("DATABASE_URL"):
        connect_args["ssl"] = {
            "ca": "/etc/ssl/certs/ca-certificates.crt"
        }

SQLALCHEMY_DATABASE_URL = url



engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=True,      # Vérifie la connexion avant chaque requête
    pool_recycle=300,        # Recycle les connexions toutes les 5 minutes pour éviter les timeouts
    pool_size=5,             # Taille du pool par défaut
    max_overflow=10          # Autorise jusqu'à 10 connexions supplémentaires temporaires
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def executer_migrations(engine):
    """
    Vérifie et ajoute les colonnes manquantes à la table 'assignation' (Migrations automatiques)
    """
    print("🔄 Vérification des migrations de la base de données...")
    
    columns_to_add = [
        ("date_soumission", "DATETIME NULL"),
        ("commentaire_etudiant", "TEXT NULL"),
        ("fichier_path", "VARCHAR(255) NULL"),
        ("date_evaluation", "DATETIME NULL"),
        ("note", "NUMERIC(3, 1) NULL"),
        ("commentaire_formateur", "TEXT NULL")
    ]
    
    with engine.connect() as conn:
        for col_name, col_def in columns_to_add:
            try:
                # Vérifier si la colonne existe (syntaxe compatible MySQL/TiDB)
                result = conn.execute(text(f"SHOW COLUMNS FROM assignation LIKE '{col_name}'"))
                if not result.fetchone():
                    print(f"➕ Ajout de la colonne '{col_name}' à la table 'assignation'...")
                    conn.execute(text(f"ALTER TABLE assignation ADD COLUMN {col_name} {col_def}"))
                    conn.commit()
                else:
                    print(f"✅ La colonne '{col_name}' existe déjà.")
            except Exception as e:
                print(f"⚠️ Erreur lors de l'ajout de '{col_name}': {e}")
    
    print("✨ Migrations des colonnes terminées.")

    # Migration pour les INDEX (pour la performance)
    print("🔄 Vérification des index de performance...")
    indexes_to_add = [
        ("utilisateur", "email", "idx_utilisateur_email"),
        ("etudiant", "id_promotion", "idx_etudiant_promotion"),
        ("etudiant", "statut", "idx_etudiant_statut"),
        ("assignation", "statut", "idx_assignation_statut"),
        ("espace_pedagogique", "id_formateur", "idx_espace_formateur")
    ]

    with engine.connect() as conn:
        for table, column, index_name in indexes_to_add:
            try:
                # Vérifier si l'index existe déjà
                result = conn.execute(text(f"SHOW INDEX FROM {table} WHERE Key_name = '{index_name}'"))
                if not result.fetchone():
                    print(f"➕ Création de l'index '{index_name}' sur {table}({column})...")
                    conn.execute(text(f"CREATE INDEX {index_name} ON {table}({column})"))
                    conn.commit()
                else:
                    print(f"✅ L'index '{index_name}' existe déjà.")
            except Exception as e:
                print(f"⚠️ Erreur lors de la création de l'index '{index_name}': {e}")
    
    print("🚀 Toutes les optimisations de base de données sont appliquées.")
