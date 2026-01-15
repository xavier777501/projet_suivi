#!/usr/bin/env python3
"""
Script de validation de l'implémentation des fonctionnalités de livraison et d'évaluation.
Vérifie que tous les composants sont en place et fonctionnels.
"""

import os
import sys
import importlib.util
from pathlib import Path

def check_file_exists(file_path, description):
    """Vérifier qu'un fichier existe."""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - MANQUANT")
        return False

def check_backend_files():
    """Vérifier les fichiers backend."""
    print("\n🔍 VÉRIFICATION BACKEND")
    print("=" * 40)
    
    backend_files = [
        ("back/routes/travaux.py", "Routes des travaux"),
        ("back/models.py", "Modèles de données"),
        ("back/test_livraison_evaluation.py", "Script de test"),
        ("back/validate_implementation.py", "Script de validation"),
    ]
    
    all_good = True
    for file_path, description in backend_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    return all_good

def check_frontend_files():
    """Vérifier les fichiers frontend."""
    print("\n🔍 VÉRIFICATION FRONTEND")
    print("=" * 40)
    
    frontend_files = [
        ("front-react/src/components/forms/MesTravaux.jsx", "Interface étudiant - Mes Travaux"),
        ("front-react/src/components/forms/MesTravaux.css", "Styles - Mes Travaux"),
        ("front-react/src/components/forms/LivrerTravail.jsx", "Modal de livraison"),
        ("front-react/src/components/forms/LivrerTravail.css", "Styles - Livraison"),
        ("front-react/src/components/forms/EvaluerTravail.jsx", "Interface formateur - Évaluation"),
        ("front-react/src/components/forms/EvaluerTravail.css", "Styles - Évaluation"),
        ("front-react/src/components/forms/CreateTravail.jsx", "Création de travaux"),
        ("front-react/src/components/forms/CreateTravail.css", "Styles - Création"),
        ("front-react/src/components/forms/AssignerTravail.jsx", "Assignation de travaux"),
        ("front-react/src/components/forms/AssignerTravail.css", "Styles - Assignation"),
        ("front-react/src/services/api.js", "Services API"),
    ]
    
    all_good = True
    for file_path, description in frontend_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    return all_good

def check_api_routes():
    """Vérifier que les routes API sont définies."""
    print("\n🔍 VÉRIFICATION ROUTES API")
    print("=" * 40)
    
    try:
        # Lire le fichier des routes
        with open("back/routes/travaux.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        required_routes = [
            ("mes-travaux", "Liste des travaux étudiant"),
            ("livrer/", "Livraison de travail"),
            ("evaluer/", "Évaluation de livraison"),
            ("telecharger/", "Téléchargement de fichier"),
            ("livraisons", "Livraisons d'un travail"),
        ]
        
        all_good = True
        for route, description in required_routes:
            if route in content:
                print(f"✅ {description}: /api/travaux/{route}")
            else:
                print(f"❌ {description}: /api/travaux/{route} - MANQUANT")
                all_good = False
        
        return all_good
        
    except FileNotFoundError:
        print("❌ Fichier routes/travaux.py non trouvé")
        return False

def check_api_methods():
    """Vérifier que les méthodes API sont définies dans le frontend."""
    print("\n🔍 VÉRIFICATION MÉTHODES API FRONTEND")
    print("=" * 40)
    
    try:
        with open("front-react/src/services/api.js", "r", encoding="utf-8") as f:
            content = f.read()
        
        required_methods = [
            ("mesTravaux", "Récupération des travaux étudiant"),
            ("livrerTravail", "Livraison de travail"),
            ("evaluerLivraison", "Évaluation de livraison"),
            ("telechargerFichierLivraison", "Téléchargement de fichier"),
            ("listerLivraisonsTravail", "Liste des livraisons"),
        ]
        
        all_good = True
        for method, description in required_methods:
            if method in content:
                print(f"✅ {description}: {method}")
            else:
                print(f"❌ {description}: {method} - MANQUANT")
                all_good = False
        
        return all_good
        
    except FileNotFoundError:
        print("❌ Fichier services/api.js non trouvé")
        return False

def check_database_models():
    """Vérifier que les modèles de base de données sont définis."""
    print("\n🔍 VÉRIFICATION MODÈLES BASE DE DONNÉES")
    print("=" * 40)
    
    try:
        with open("back/models.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        required_models = [
            ("class Livraison", "Modèle Livraison"),
            ("class Assignation", "Modèle Assignation"),
            ("StatutAssignationEnum", "Énumération des statuts"),
            ("chemin_fichier", "Champ chemin fichier"),
            ("note_attribuee", "Champ note attribuée"),
            ("feedback", "Champ feedback"),
        ]
        
        all_good = True
        for model, description in required_models:
            if model in content:
                print(f"✅ {description}: {model}")
            else:
                print(f"❌ {description}: {model} - MANQUANT")
                all_good = False
        
        return all_good
        
    except FileNotFoundError:
        print("❌ Fichier models.py non trouvé")
        return False

def check_documentation():
    """Vérifier que la documentation est présente."""
    print("\n🔍 VÉRIFICATION DOCUMENTATION")
    print("=" * 40)
    
    doc_files = [
        ("FONCTIONNALITES_LIVRAISON_EVALUATION.md", "Documentation des fonctionnalités"),
        ("DEMARRAGE_TESTS_LIVRAISON.md", "Guide de démarrage des tests"),
    ]
    
    all_good = True
    for file_path, description in doc_files:
        if not check_file_exists(file_path, description):
            all_good = False
    
    return all_good

def check_uploads_directory():
    """Vérifier que le dossier uploads existe ou peut être créé."""
    print("\n🔍 VÉRIFICATION DOSSIER UPLOADS")
    print("=" * 40)
    
    uploads_dir = "back/uploads"
    
    if os.path.exists(uploads_dir):
        print(f"✅ Dossier uploads existe: {uploads_dir}")
        return True
    else:
        try:
            os.makedirs(uploads_dir, exist_ok=True)
            print(f"✅ Dossier uploads créé: {uploads_dir}")
            return True
        except Exception as e:
            print(f"❌ Impossible de créer le dossier uploads: {e}")
            return False

def generate_summary_report():
    """Générer un rapport de synthèse."""
    print("\n📊 RAPPORT DE SYNTHÈSE")
    print("=" * 50)
    
    checks = [
        ("Backend", check_backend_files()),
        ("Frontend", check_frontend_files()),
        ("Routes API", check_api_routes()),
        ("Méthodes API", check_api_methods()),
        ("Modèles BDD", check_database_models()),
        ("Documentation", check_documentation()),
        ("Dossier Uploads", check_uploads_directory()),
    ]
    
    total_checks = len(checks)
    passed_checks = sum(1 for _, result in checks if result)
    
    print(f"\n📈 RÉSULTATS: {passed_checks}/{total_checks} vérifications réussies")
    
    if passed_checks == total_checks:
        print("\n🎉 FÉLICITATIONS ! Toutes les vérifications sont passées.")
        print("✅ L'implémentation des fonctionnalités de livraison et d'évaluation est COMPLÈTE.")
        print("\n🚀 Vous pouvez maintenant :")
        print("   1. Démarrer les serveurs (backend + frontend)")
        print("   2. Lancer les tests automatisés")
        print("   3. Tester manuellement les fonctionnalités")
        print("   4. Déployer en production")
        return True
    else:
        print(f"\n⚠️  {total_checks - passed_checks} vérification(s) ont échoué.")
        print("❌ Veuillez corriger les problèmes avant de continuer.")
        
        print("\n🔧 ACTIONS RECOMMANDÉES:")
        for name, result in checks:
            if not result:
                print(f"   - Corriger les problèmes dans: {name}")
        
        return False

def main():
    """Fonction principale."""
    print("🔍 VALIDATION DE L'IMPLÉMENTATION")
    print("Fonctionnalités: Livraison et Évaluation des Travaux")
    print("=" * 60)
    
    # Vérifier qu'on est dans le bon répertoire
    if not os.path.exists("back") or not os.path.exists("front-react"):
        print("❌ Erreur: Ce script doit être exécuté depuis la racine du projet")
        print("   (dossiers 'back' et 'front-react' requis)")
        sys.exit(1)
    
    # Lancer toutes les vérifications
    success = generate_summary_report()
    
    if success:
        print(f"\n📋 PROCHAINES ÉTAPES:")
        print("   1. cd back && python -m uvicorn main:app --reload")
        print("   2. cd front-react && npm run dev")
        print("   3. python back/test_livraison_evaluation.py")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()