#!/usr/bin/env python3
"""
Script pour créer une promotion de test
"""

from datetime import datetime, date
from database.database import SessionLocal
from models import Promotion, Filiere
from utils.generators import generer_identifiant_unique

def create_test_promotion():
    db = SessionLocal()
    try:
        # Vérifier si une filière existe
        filiere = db.query(Filiere).first()
        if not filiere:
            print("❌ Aucune filière trouvée. Veuillez d'abord créer une filière.")
            return
        
        print(f"✓ Filière trouvée: {filiere.nom_filiere}")
        
        # Vérifier si une promotion existe déjà
        existing_promotion = db.query(Promotion).first()
        if existing_promotion:
            print(f"✓ Promotion existante trouvée: {existing_promotion.libelle}")
            return
        
        # Créer une promotion de test
        promotion = Promotion(
            id_promotion=generer_identifiant_unique("PROMO"),
            id_filiere=filiere.id_filiere,
            annee_academique="2024-2025",
            libelle=f"Promotion 2024-2025 - {filiere.nom_filiere}",
            date_debut=date(2024, 9, 1),
            date_fin=date(2025, 6, 30)
        )
        
        db.add(promotion)
        db.commit()
        db.refresh(promotion)
        
        print(f"✓ Promotion créée: {promotion.libelle}")
        print(f"  ID: {promotion.id_promotion}")
        print(f"  Filière: {filiere.nom_filiere}")
        print(f"  Année: {promotion.annee_academique}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_promotion()