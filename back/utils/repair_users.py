"""
Script de réparation des utilisateurs avec des problèmes d'authentification
"""
from sqlalchemy.orm import Session
from models import Utilisateur
from core.jwt import get_password_hash, verify_password
from utils.generators import generer_mot_de_passe_aleatoire
from utils.email_service import email_service
from datetime import datetime, timedelta
import secrets


def reparer_utilisateurs_douteux(db: Session):
    """
    Répare les utilisateurs qui ont des problèmes d'authentification
    """
    print("🔍 Recherche des utilisateurs avec des problèmes d'authentification...")
    
    # Récupérer tous les utilisateurs
    utilisateurs = db.query(Utilisateur).all()
    
    utilisateurs_reparables = []
    
    for utilisateur in utilisateurs:
        # Vérifier si le mot de passe est dans un format suspect
        # Par exemple, s'il est trop court ou s'il ressemble à un email
        mot_de_passe = getattr(utilisateur, 'mot_de_passe', '')
        
        # Si le mot de passe ressemble à un email ou est suspect
        if '@' in mot_de_passe or len(mot_de_passe) < 10 or len(mot_de_passe) > 64:
            utilisateurs_reparables.append(utilisateur)
            print(f"⚠️  Utilisateur suspect trouvé: {utilisateur.email} (mot de passe: {mot_de_passe})")
    
    print(f"📦 Trouvé {len(utilisateurs_reparables)} utilisateurs à réparer")
    
    for utilisateur in utilisateurs_reparables:
        # Générer un nouveau mot de passe
        nouveau_mot_de_passe = generer_mot_de_passe_aleatoire()
        nouveau_mot_de_passe_hache = get_password_hash(nouveau_mot_de_passe)
        
        print(f"🔧 Réparation de {utilisateur.email}...")
        print(f"   Ancien mot de passe: {utilisateur.mot_de_passe}")
        print(f"   Nouveau mot de passe: {nouveau_mot_de_passe}")
        print(f"   Nouveau hash: {nouveau_mot_de_passe_hache}")
        
        # Mettre à jour le mot de passe
        utilisateur.mot_de_passe = nouveau_mot_de_passe_hache
        utilisateur.mot_de_passe_temporaire = True
        
        # Générer un token d'activation pour forcer le changement de mot de passe
        token_activation = secrets.token_urlsafe(32)
        date_expiration = datetime.utcnow() + timedelta(hours=24)
        utilisateur.token_activation = token_activation
        utilisateur.date_expiration_token = date_expiration
        
        # Envoyer l'email avec les nouveaux identifiants
        success = email_service.envoyer_email_creation_compte(
            destinataire=utilisateur.email,
            prenom=utilisateur.prenom,
            email=utilisateur.email,
            mot_de_passe=nouveau_mot_de_passe,
            role=utilisateur.role.value
        )
        
        if success:
            print(f"✅ Email envoyé à {utilisateur.email} avec nouveau mot de passe")
        else:
            print(f"❌ Impossible d'envoyer l'email à {utilisateur.email}")
    
    # Commit les changements
    db.commit()
    print(f"✅ Réparation terminée pour {len(utilisateurs_reparables)} utilisateurs")


def verifier_integrite_utilisateurs(db: Session):
    """
    Vérifie l'intégrité des utilisateurs existants
    """
    print("🔍 Vérification de l'intégrité des utilisateurs...")
    
    utilisateurs = db.query(Utilisateur).all()
    problemes_detectes = 0
    
    for utilisateur in utilisateurs:
        mot_de_passe = getattr(utilisateur, 'mot_de_passe', '')
        
        # Vérifier la longueur du hash (SHA-256 devrait être 64 caractères)
        if len(mot_de_passe) != 64:
            print(f"⚠️  Hash suspect pour {utilisateur.email}: longueur {len(mot_de_passe)}, valeur: {mot_de_passe}")
            problemes_detectes += 1
        else:
            # Tester si le hash est valide (vérifier qu'il ne contient que des caractères hexadécimaux)
            try:
                int(mot_de_passe, 16)  # Essaye de convertir en hexadécimal
            except ValueError:
                print(f"⚠️  Hash non hexadécimal pour {utilisateur.email}: {mot_de_passe}")
                problemes_detectes += 1
    
    print(f"📊 {problemes_detectes} problèmes détectés sur {len(utilisateurs)} utilisateurs")
    return problemes_detectes