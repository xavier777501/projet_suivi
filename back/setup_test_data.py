#!/usr/bin/env python3
"""
Script complet pour créer toutes les données de test nécessaires
"""

from sqlalchemy.orm import Session
from database.database import get_db
from models import *
from utils.generators import generer_identifiant_unique
from core.jwt import get_password_hash
from datetime import datetime, timedelta

def setup_complete_test_data():
    """Créer toutes les données de test nécessaires."""
    db = next(get_db())
    
    try:
        print("🚀 CONFIGURATION DES DONNÉES DE TEST")
        print("=" * 50)
        
        # 1. Créer ou vérifier l'étudiant de test
        etudiant_user = db.query(Utilisateur).filter(
            Utilisateur.email == "etudiant.test@example.com"
        ).first()
        
        if not etudiant_user:
            print("📝 Création de l'étudiant de test...")
            
            # Créer l'utilisateur étudiant
            etudiant_user = Utilisateur(
                identifiant=generer_identifiant_unique("USER"),
                nom="Dupont",
                prenom="Jean",
                email="etudiant.test@example.com",
                mot_de_passe=hash_password("password123"),
                role=RoleEnum.ETUDIANT,
                date_creation=datetime.utcnow()
            )
            db.add(etudiant_user)
            db.flush()
            
            # Trouver une promotion
            promotion = db.query(Promotion).first()
            if not promotion:
                print("❌ Aucune promotion trouvée")
                return False
            
            # Créer le profil étudiant
            etudiant = Etudiant(
                id_etudiant=generer_identifiant_unique("ETU"),
                identifiant=etudiant_user.identifiant,
                id_promotion=promotion.id_promotion,
                numero_etudiant="ETU2024001"
            )
            db.add(etudiant)
            db.flush()
            
            print(f"✅ Étudiant créé: {etudiant_user.email}")
        else:
            etudiant = db.query(Etudiant).filter(
                Etudiant.identifiant == etudiant_user.identifiant
            ).first()
            print(f"✅ Étudiant existant: {etudiant_user.email}")
        
        # 2. Créer ou vérifier le formateur de test
        formateur_user = db.query(Utilisateur).filter(
            Utilisateur.email == "formateur.test@example.com"
        ).first()
        
        if not formateur_user:
            print("📝 Création du formateur de test...")
            
            # Créer l'utilisateur formateur
            formateur_user = Utilisateur(
                identifiant=generer_identifiant_unique("USER"),
                nom="Martin",
                prenom="Sophie",
                email="formateur.test@example.com",
                mot_de_passe=hash_password("password123"),
                role=RoleEnum.FORMATEUR,
                date_creation=datetime.utcnow()
            )
            db.add(formateur_user)
            db.flush()
            
            # Créer le profil formateur
            formateur = Formateur(
                id_formateur=generer_identifiant_unique("FORM"),
                identifiant=formateur_user.identifiant,
                specialite="Développement Web"
            )
            db.add(formateur)
            db.flush()
            
            print(f"✅ Formateur créé: {formateur_user.email}")
        else:
            formateur = db.query(Formateur).filter(
                Formateur.identifiant == formateur_user.identifiant
            ).first()
            print(f"✅ Formateur existant: {formateur_user.email}")
        
        # 3. Créer un espace pédagogique
        espace = db.query(EspacePedagogique).filter(
            EspacePedagogique.id_formateur == formateur.id_formateur
        ).first()
        
        if not espace:
            print("📝 Création de l'espace pédagogique...")
            
            # Trouver une matière
            matiere = db.query(Matiere).first()
            if not matiere:
                print("❌ Aucune matière trouvée")
                return False
            
            # Trouver une promotion
            promotion = db.query(Promotion).first()
            if not promotion:
                print("❌ Aucune promotion trouvée")
                return False
            
            espace = EspacePedagogique(
                id_espace=generer_identifiant_unique("ESP"),
                nom_espace="Développement Web - Test",
                description="Espace de test pour les fonctionnalités de livraison",
                id_matiere=matiere.id_matiere,
                id_promotion=promotion.id_promotion,
                id_formateur=formateur.id_formateur,
                date_creation=datetime.utcnow()
            )
            db.add(espace)
            db.flush()
            
            print(f"✅ Espace créé: {espace.nom_espace}")
        else:
            print(f"✅ Espace existant: {espace.nom_espace}")
        
        # 4. Inscrire l'étudiant dans l'espace
        inscription = db.query(Inscription).filter(
            Inscription.id_espace == espace.id_espace,
            Inscription.id_etudiant == etudiant.id_etudiant
        ).first()
        
        if not inscription:
            print("📝 Inscription de l'étudiant dans l'espace...")
            
            inscription = Inscription(
                id_inscription=generer_identifiant_unique("INSC"),
                id_espace=espace.id_espace,
                id_etudiant=etudiant.id_etudiant,
                date_inscription=datetime.utcnow()
            )
            db.add(inscription)
            print("✅ Inscription créée")
        else:
            print("✅ Inscription existante")
        
        # 5. Créer des travaux de test
        travaux_existants = db.query(Travail).filter(
            Travail.id_espace == espace.id_espace
        ).count()
        
        if travaux_existants == 0:
            print("📝 Création des travaux de test...")
            
            travaux_test = [
                {
                    "titre": "Projet HTML/CSS - Page d'accueil",
                    "description": "Créer une page d'accueil responsive avec HTML5 et CSS3. Utiliser Flexbox ou Grid pour la mise en page.",
                    "type": TypeTravailEnum.INDIVIDUEL,
                    "jours": 7
                },
                {
                    "titre": "Application JavaScript - Calculatrice",
                    "description": "Développer une calculatrice interactive en JavaScript vanilla. Interface utilisateur moderne et fonctionnalités complètes.",
                    "type": TypeTravailEnum.INDIVIDUEL,
                    "jours": 10
                },
                {
                    "titre": "Projet de groupe - Site e-commerce",
                    "description": "Créer un site e-commerce complet en équipe. Frontend et backend requis avec base de données.",
                    "type": TypeTravailEnum.COLLECTIF,
                    "jours": 21
                }
            ]
            
            for travail_data in travaux_test:
                travail = Travail(
                    id_travail=generer_identifiant_unique("TRAVAIL"),
                    id_espace=espace.id_espace,
                    titre=travail_data["titre"],
                    description=travail_data["description"],
                    type_travail=travail_data["type"],
                    date_echeance=datetime.utcnow() + timedelta(days=travail_data["jours"]),
                    note_max=20.0
                )
                db.add(travail)
                db.flush()
                
                # Créer l'assignation pour les travaux individuels
                if travail_data["type"] == TypeTravailEnum.INDIVIDUEL:
                    assignation = Assignation(
                        id_assignation=generer_identifiant_unique("ASG"),
                        id_travail=travail.id_travail,
                        id_etudiant=etudiant.id_etudiant,
                        date_assignment=datetime.utcnow(),
                        statut=StatutAssignationEnum.ASSIGNE
                    )
                    db.add(assignation)
                
                print(f"✅ Travail créé: {travail.titre}")
        else:
            print(f"✅ {travaux_existants} travaux existants")
        
        db.commit()
        
        print("\n🎉 CONFIGURATION TERMINÉE AVEC SUCCÈS !")
        print("\n📋 COMPTES DE TEST DISPONIBLES:")
        print(f"   👨‍🎓 Étudiant: {etudiant_user.email} / password123")
        print(f"   👨‍🏫 Formateur: {formateur_user.email} / password123")
        print(f"\n🏫 Espace pédagogique: {espace.nom_espace}")
        
        # Compter les assignations
        assignations_count = db.query(Assignation).join(Travail).filter(
            Travail.id_espace == espace.id_espace,
            Assignation.id_etudiant == etudiant.id_etudiant
        ).count()
        
        print(f"📚 {assignations_count} travaux assignés à l'étudiant")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = setup_complete_test_data()
    
    if success:
        print("\n✅ PRÊT POUR LES TESTS !")
        print("   1. Démarrer le backend: python -m uvicorn main:app --reload")
        print("   2. Démarrer le frontend: npm run dev")
        print("   3. Se connecter avec etudiant.test@example.com")
        print("   4. Cliquer sur 'Mes Travaux'")
    else:
        print("\n❌ ÉCHEC DE LA CONFIGURATION")