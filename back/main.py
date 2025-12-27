from datetime import date
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine, SessionLocal
import models  # ensure all models are imported so tables are created
from routes import auth
# # from routes import gestion_comptes
from core.auth import initialiser_compte_de

# Créer les tables
Base.metadata.create_all(bind=engine)

# Initialiser le compte DE au démarrage
def initialiser_systeme():
    """Initialise le système avec les comptes nécessaires"""
    db = SessionLocal()
    try:
        print("Initialisation du système...")
        
        # 1. Initialiser compte DE
        compte_de = initialiser_compte_de(db)
        if compte_de:
            print(f"✓ Compte DE initialisé: {compte_de['email']}")
            if compte_de['mot_de_passe_temporaire']:
                print("🔑 Mot de passe temporaire: admin123")
                print("⚠️  Ce mot de passe doit être changé lors de la première connexion!")
            else:
                print("✓ Le compte DE utilise déjà un mot de passe permanent")
        else:
            print("✗ Erreur lors de l'initialisation du compte DE")

        # 2. Initialiser Données de Référence (Filiere + Matieres)
        filiere_info = {
            "id": "FIL-INFO-LOG",
            "nom": "Informatique et Logiciels",
            "description": "Filière dédiée au développement logiciel, réseaux et systèmes."
        }
        
        existing_filiere = db.query(models.Filiere).filter(models.Filiere.id_filiere == filiere_info["id"]).first()
        if not existing_filiere:
            new_filiere = models.Filiere(
                id_filiere=filiere_info["id"],
                nom_filiere=filiere_info["nom"],
                description=filiere_info["description"],
                date_debut=date.today()
            )
            db.add(new_filiere)
            db.commit()
            print(f"✓ Filière créée: {filiere_info['nom']}")
        else:
            print(f"✓ Filière existante: {filiere_info['nom']}")

        # Matieres par défaut pour cette filière
        matieres_defaut = [
            {"id": "MAT-ALGO", "nom": "Algorithmique et Structures de Données"},
            {"id": "MAT-WEB", "nom": "Développement Web (Front & Back)"},
            {"id": "MAT-BDD", "nom": "Bases de Données (SQL & NoSQL)"},
            {"id": "MAT-JAVA", "nom": "Programmation Orientée Objet (Java)"},
            {"id": "MAT-PROJET", "nom": "Gestion de Projet Agile"}
        ]

        for mat in matieres_defaut:
            existing_mat = db.query(models.Matiere).filter(models.Matiere.id_matiere == mat["id"]).first()
            if not existing_mat:
                new_mat = models.Matiere(
                    id_matiere=mat["id"],
                    id_filiere=filiere_info["id"],
                    nom_matiere=mat["nom"]
                )
                db.add(new_mat)
                print(f"  + Matière ajoutée: {mat['nom']}")
        
        db.commit()
        print("✓ Matières initialisées")

    except Exception as e:
        print(f"✗ Erreur critique lors de l'initialisation: {e}")
        db.rollback()
    finally:
        db.close()

# Lancer l'initialisation
initialiser_systeme()

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes d'authentification
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Inclure les routes de gestion des comptes
# app.include_router(gestion_comptes.router)

# Inclure les routes de dashboard
# from routes import dashboard
# app.include_router(dashboard.router)

# Inclure les routes d'espaces pédagogiques
# from routes import espaces_pedagogiques
# app.include_router(espaces_pedagogiques.router)

@app.get("/")
def home():
    return {"message": "FastAPI fonctionne 🎉"}
