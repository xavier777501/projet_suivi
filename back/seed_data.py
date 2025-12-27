
from database.database import SessionLocal
from core.auth import initialiser_compte_de
from models import Filiere, Matiere
from datetime import date
from utils.generators import generer_identifiant_unique

def seed_data():
    db = SessionLocal()
    try:
        print("Seeding data...")
        
        # 1. Initialize DE account
        compte_de = initialiser_compte_de(db)
        if compte_de:
            print(f"   + Compte DE initialise: {compte_de['email']}")
        
        # 2. Check and create default Filiere
        nom_filiere = "Informatique et Logiciels"
        existing_filiere = db.query(Filiere).filter(Filiere.nom_filiere == nom_filiere).first()
        
        if not existing_filiere:
            filiere = Filiere(
                id_filiere=generer_identifiant_unique("FIL"),
                nom_filiere=nom_filiere,
                description="Formation aux métiers du développement logiciel et de l'IT",
                date_debut=date(2024, 9, 1)
            )
            db.add(filiere)
            db.commit()
            db.refresh(filiere)
            print(f"   + Filiere creee: {filiere.nom_filiere}")
            
            # 3. Create default Matieres
            matieres_defaut = [
                "Algorithmique et Structures de Données",
                "Développement Web (React/Node.js)",
                "Bases de Données Relationales",
                "Systèmes d'Exploitation",
                "Réseaux Informatiques",
                "Conception UML",
                "Gestion de Projet Agile",
                "Développement Mobile",
                "Sécurité Informatique",
                "Intelligence Artificielle"
            ]
            
            for nom_matiere in matieres_defaut:
                matiere = Matiere(
                    id_matiere=generer_identifiant_unique("MAT"),
                    id_filiere=filiere.id_filiere,
                    nom_matiere=nom_matiere,
                    description=f"Cours de {nom_matiere}"
                )
                db.add(matiere)
            
            db.commit()
            print(f"   + {len(matieres_defaut)} matieres creees pour la filiere")
        else:
            print("   + Filiere et matieres existent deja")
            
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
