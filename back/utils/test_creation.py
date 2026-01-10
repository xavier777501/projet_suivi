"""
Script de test pour vérifier le processus de création d'utilisateur
"""
from sqlalchemy.orm import Session
from models import Utilisateur, RoleEnum
from core.jwt import get_password_hash, verify_password
from utils.generators import generer_mot_de_passe_aleatoire
from utils.email_service import email_service


def tester_creation_utilisateur(db: Session, email_test: str = "test@example.com"):
    """
    Teste le processus complet de création d'utilisateur
    """
    print("🧪 Test du processus de création d'utilisateur...")
    
    # Générer un mot de passe
    mot_de_passe_genere = generer_mot_de_passe_aleatoire()
    print(f"🔐 Mot de passe généré: {mot_de_passe_genere}")
    
    # Hacher le mot de passe
    mot_de_passe_hache = get_password_hash(mot_de_passe_genere)
    print(f"🔒 Mot de passe haché: {mot_de_passe_hache}")
    
    # Vérifier que le mot de passe est correctement haché
    verification = verify_password(mot_de_passe_genere, mot_de_passe_hache)
    print(f"✅ Vérification du mot de passe: {'SUCCÈS' if verification else 'ÉCHEC'}")
    
    # Créer un utilisateur de test
    nouvel_utilisateur = Utilisateur(
        identifiant="TEST_USER_123456789",
        email=email_test,
        mot_de_passe=mot_de_passe_hache,
        nom="Test",
        prenom="Utilisateur",
        role=RoleEnum.FORMATEUR,
        actif=True,
        mot_de_passe_temporaire=True
    )
    
    # Sauvegarder dans la base de données
    db.add(nouvel_utilisateur)
    db.commit()
    print(f"💾 Utilisateur sauvegardé dans la base de données")
    
    # Tester la connexion
    utilisateur_recupere = db.query(Utilisateur).filter(Utilisateur.email == email_test).first()
    if utilisateur_recupere:
        print(f"🔍 Utilisateur récupéré: {utilisateur_recupere.email}")
        print(f"🔑 Hash en base: {utilisateur_recupere.mot_de_passe}")
        
        # Vérifier que le mot de passe correspond
        verification_base = verify_password(mot_de_passe_genere, utilisateur_recupere.mot_de_passe)
        print(f"✅ Vérification avec base de données: {'SUCCÈS' if verification_base else 'ÉCHEC'}")
        
        # Simuler l'envoi d'email
        print(f"📧 Simulation d'envoi d'email avec mot de passe: {mot_de_passe_genere}")
        
        # Nettoyer: supprimer l'utilisateur de test
        db.delete(utilisateur_recupere)
        db.commit()
        print(f"🧹 Utilisateur de test supprimé")
    
    print("🏁 Test terminé avec succès!")


def tester_processus_complet(db: Session):
    """
    Teste le processus complet de création et de connexion
    """
    print("\n" + "="*60)
    print("🔬 TEST PROCESSUS COMPLET")
    print("="*60)
    
    # Tester avec plusieurs emails
    emails_tests = [
        "formateur.test@uatm.bj",
        "etudiant.test@uatm.bj",
        "autre.test@uatm.bj"
    ]
    
    for email in emails_tests:
        print(f"\n--- Test avec {email} ---")
        try:
            tester_creation_utilisateur(db, email)
        except Exception as e:
            print(f"❌ Erreur lors du test avec {email}: {str(e)}")
    
    print("\n" + "="*60)
    print("✅ TOUS LES TESTS TERMINÉS")
    print("="*60)