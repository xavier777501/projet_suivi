#!/usr/bin/env python3
"""
Script pour tester la connexion du compte DE
"""

from sqlalchemy.orm import Session
from database.database import SessionLocal
from models import Utilisateur
from core.jwt import verify_password, get_password_hash

def test_de_login():
    """Teste la connexion du compte DE"""
    
    db = SessionLocal()
    
    try:
        # Rechercher le compte DE
        email = "de@genielogiciel.com"
        mot_de_passe = "admin123"
        
        print(f"🔍 Recherche de l'utilisateur: {email}")
        
        utilisateur = db.query(Utilisateur).filter(Utilisateur.email == email).first()
        
        if not utilisateur:
            print("❌ Utilisateur non trouvé!")
            return
        
        print(f"✅ Utilisateur trouvé:")
        print(f"   - Email: {utilisateur.email}")
        print(f"   - Identifiant: {utilisateur.identifiant}")
        print(f"   - Nom: {utilisateur.nom} {utilisateur.prenom}")
        print(f"   - Rôle: {utilisateur.role}")
        print(f"   - Actif: {utilisateur.actif}")
        print(f"   - Mot de passe temporaire: {utilisateur.mot_de_passe_temporaire}")
        print(f"   - Hash en base: {utilisateur.mot_de_passe}")
        
        # Tester le mot de passe
        print(f"\n🔐 Test du mot de passe: {mot_de_passe}")
        print(f"   - Hash du mot de passe fourni: {get_password_hash(mot_de_passe)}")
        
        verification = verify_password(mot_de_passe, utilisateur.mot_de_passe)
        print(f"   - Correspondance: {'✅ OUI' if verification else '❌ NON'}")
        
        if not verification:
            print("\n🔧 Tentative de réinitialisation du mot de passe...")
            nouveau_hash = get_password_hash(mot_de_passe)
            utilisateur.mot_de_passe = nouveau_hash
            db.commit()
            print(f"   - Nouveau hash: {nouveau_hash}")
            
            # Re-tester
            verification2 = verify_password(mot_de_passe, utilisateur.mot_de_passe)
            print(f"   - Nouvelle correspondance: {'✅ OUI' if verification2 else '❌ NON'}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Test de connexion DE ===")
    test_de_login()
    print("=== Terminé ===")