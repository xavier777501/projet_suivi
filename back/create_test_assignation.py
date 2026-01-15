#!/usr/bin/env python3
"""
Script pour créer des assignations de test pour tester la fonctionnalité "Mes Travaux"
"""

from sqlalchemy.orm import Session
from database.database import get_db
from models import *
from utils.generators import generer_identifiant_unique
from datetime import datetime, timedelta

def create_test_assignation():
    """Créer une assignation de test pour l'étudiant de test."""
    db = next(get_db())
    
    try:
        # 1. Trouver l'étudiant de test
        etudiant = db.query(Etudiant).join(Utilisateur).filter(
            Utilisateur.email == "etudiant.test@example.com"
        ).first()
        
        if not etudiant:
            print("❌ Étudiant de test non trouvé")
            return
        
        print(f"✅ Étudiant trouvé: {etudiant.utilisateur.prenom} {etudiant.utilisateur.nom}")
        
        # 2. Trouver un espace pédagogique
        espace = db.query(EspacePedagogique).first()
        
        if not espace:
            print("❌ Aucun espace pédagogique trouvé")
            return
        
        print(f"✅ Espace trouvé: {espace.nom_espace}")
        
        # 3. Créer un travail de test
        id_travail = generer_identifiant_unique("TRAVAIL")
        travail = Travail(
            id_travail=id_travail,
            id_espace=espace.id_espace,
            titre="Projet de Test - Développement Web",
            description="Créer une page web responsive avec HTML, CSS et JavaScript. Ce travail permet de tester les fonctionnalités de livraison.",
            type_travail=TypeTravailEnum.INDIVIDUEL,
            date_echeance=datetime.utcnow() + timedelta(days=7),
            note_max=20.0
        )
        
        db.add(travail)
        db.flush()
        
        print(f"✅ Travail créé: {travail.titre}")
        
        # 4. Créer l'assignation
        id_assignation = generer_identifiant_unique("ASG")
        assignation = Assignation(
            id_assignation=id_assignation,
            id_travail=id_travail,
            id_etudiant=etudiant.id_etudiant,
            date_assignment=datetime.utcnow(),
            statut=StatutAssignationEnum.ASSIGNE
        )
        
        db.add(assignation)
        
        # 5. S'assurer que l'étudiant est inscrit dans l'espace
        inscription_existante = db.query(Inscription).filter(
            Inscription.id_espace == espace.id_espace,
            Inscription.id_etudiant == etudiant.id_etudiant
        ).first()
        
        if not inscription_existante:
            inscription = Inscription(
                id_inscription=generer_identifiant_unique("INSC"),
                id_espace=espace.id_espace,
                id_etudiant=etudiant.id_etudiant,
                date_inscription=datetime.utcnow()
            )
            db.add(inscription)
            print("✅ Inscription créée dans l'espace")
        
        db.commit()
        
        print("\n🎉 ASSIGNATION DE TEST CRÉÉE AVEC SUCCÈS !")
        print(f"   - Travail: {travail.titre}")
        print(f"   - Étudiant: {etudiant.utilisateur.email}")
        print(f"   - Échéance: {travail.date_echeance.strftime('%d/%m/%Y %H:%M')}")
        print(f"   - Statut: {assignation.statut}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur: {str(e)}")
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 CRÉATION D'ASSIGNATION DE TEST")
    print("=" * 40)
    
    success = create_test_assignation()
    
    if success:
        print("\n✅ Vous pouvez maintenant tester 'Mes Travaux' avec l'étudiant de test !")
        print("   Email: etudiant.test@example.com")
        print("   Mot de passe: password123")
    else:
        print("\n❌ Échec de la création de l'assignation de test")