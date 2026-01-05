from sqlalchemy import create_engine
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
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
