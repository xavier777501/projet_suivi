from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

import os

# Utilise DATABASE_URL de l'environnement (Render) ou l'adresse locale par défaut
url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/suiviprojet")

# Si l'URL commence par 'mysql://' (donné par TiDB), on la transforme en 'mysql+pymysql://'
if url and url.startswith("mysql://"):
    url = url.replace("mysql://", "mysql+pymysql://", 1)

SQLALCHEMY_DATABASE_URL = url

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
