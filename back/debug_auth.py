#!/usr/bin/env python3
"""
Script de débogage pour vérifier et corriger l'authentification
"""

from database.database import SessionLocal
from models import Utilisateur, RoleEnum
from core.jwt import get_password_hash, verify_password
from core.auth import initialiser_compte_de

def debug_compte_de():
    """Debug et correction du compte DE"""
    db = SessionLocal()
    try:
        print("=== DÉBOGAGE COMPTE DE ===")
        
        # 1. Vérifier tous les utilisateurs DE
        comptes_de = db.query(Utilisateur).filter(Utilisateur.role == RoleEnum.DE).all()
        print(f"Nombre de comptes DE trouvés: {len(comptes_de)}")
        
        for compte in comptes_de:
            print(f"\n--- Compte DE ---")
            print(f"Identifiant: {compte.identifiant}")
            print(f"Email: {compte.email}")
            print(f"Nom: {compte.nom} {compte.prenom}")
            print(f"Actif: {compte.actif}")
            print(f"Mot de passe temporaire: {compte.mot_de_passe_temporaire}")
            print(f"Hash mot de passe: {compte.mot_de_passe}")
            
            # Test du mot de passe admin123
            test_mdp = verify_password("admin123", compte.mot_de_passe)
            print(f"Test mot de passe 'admin123': {test_mdp}")
            
            if not test_mdp:
                print("❌ Mot de passe incorrect - Correction en cours...")
                nouveau_hash = get_password_hash("admin123")
                compte.mot_de_passe = nouveau_hash
                compte.mot_de_passe_temporaire = True
                compte.actif = True
                db.commit()
                print(f"✅ Mot de passe corrigé avec hash: {nouveau_hash}")
            else:
                print("✅ Mot de passe correct")
        
        # 2. Si aucun compte DE, en créer un
        if not comptes_de:
            print("\n--- Création du compte DE ---")
            compte_de = initialiser_compte_de(db)
            if compte_de:
                print(f"✅ Compte DE créé: {compte_de['email']}")
            else:
                print("❌ Erreur lors de la création du compte DE")
        
        print("\n=== RÉSUMÉ ===")
        print("Email: de@genielogiciel.com")
        print("Mot de passe: admin123")
        print("Ce compte nécessitera un changement de mot de passe à la première connexion")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    debug_compte_de()