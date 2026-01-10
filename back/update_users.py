"""
Script de mise à jour pour corriger les données existantes dans la base de données
"""
import sys
import os

# Ajouter le chemin du projet pour pouvoir importer les modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import SessionLocal
from utils.repair_users import verifier_integrite_utilisateurs, reparer_utilisateurs_douteux


def main():
    """
    Fonction principale pour exécuter la mise à jour
    """
    print("🚀 Démarrage du script de mise à jour des utilisateurs...")
    
    # Créer une session de base de données
    db = SessionLocal()
    
    try:
        print("\n🔍 Vérification de l'état actuel de la base de données...")
        problemes_avant = verifier_integrite_utilisateurs(db)
        
        if problemes_avant > 0:
            print(f"\n⚠️  {problemes_avant} problèmes détectés dans la base de données")
            print("🔧 Lancement de la procédure de réparation...")
            
            # Réparer les utilisateurs
            reparer_utilisateurs_douteux(db)
            
            print("\n🔍 Vérification après réparation...")
            problemes_apres = verifier_integrite_utilisateurs(db)
            
            print(f"\n📊 Résultats:")
            print(f"   - Problèmes avant: {problemes_avant}")
            print(f"   - Problèmes après: {problemes_apres}")
            print(f"   - Problèmes corrigés: {problemes_avant - problemes_apres}")
            
            if problemes_apres == 0:
                print("\n✅ Tous les problèmes ont été corrigés avec succès!")
            else:
                print(f"\n⚠️  {problemes_apres} problèmes persistent dans la base de données")
        else:
            print("\n✅ Aucun problème détecté dans la base de données!")
            print("La base de données est propre et fonctionnelle.")
    
    except Exception as e:
        print(f"\n❌ Une erreur s'est produite: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Fermer la session
        db.close()
        print("\n🔒 Session de base de données fermée")


if __name__ == "__main__":
    main()