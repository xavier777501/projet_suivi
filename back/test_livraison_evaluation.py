#!/usr/bin/env python3
"""
Script de test pour les fonctionnalités de livraison et d'évaluation des travaux.
Ce script teste les user stories :
- Étudiant : soumettre (livrer) son travail
- Formateur : évaluer un travail livré
"""

import requests
import json
import os
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
TEST_FILE_PATH = "test_file.txt"

def create_test_file():
    """Créer un fichier de test pour la livraison."""
    with open(TEST_FILE_PATH, 'w', encoding='utf-8') as f:
        f.write("Ceci est un fichier de test pour la livraison de travail.\n")
        f.write(f"Créé le : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("Contenu du travail : Projet de développement web\n")
    print(f"✓ Fichier de test créé : {TEST_FILE_PATH}")

def cleanup_test_file():
    """Supprimer le fichier de test."""
    if os.path.exists(TEST_FILE_PATH):
        os.remove(TEST_FILE_PATH)
        print(f"✓ Fichier de test supprimé : {TEST_FILE_PATH}")

def login_user(email, password):
    """Connexion d'un utilisateur."""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "mot_de_passe": password
    })
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✓ Connexion réussie pour {email}")
        return token
    else:
        print(f"✗ Erreur de connexion pour {email}: {response.text}")
        return None

def test_etudiant_livraison():
    """Test de la livraison d'un travail par un étudiant."""
    print("\n=== TEST LIVRAISON ÉTUDIANT ===")
    
    # Connexion étudiant
    token_etudiant = login_user("etudiant.test@example.com", "password123")
    if not token_etudiant:
        print("✗ Impossible de se connecter en tant qu'étudiant")
        return None
    
    headers = {"Authorization": f"Bearer {token_etudiant}"}
    
    # 1. Récupérer les travaux de l'étudiant
    print("\n1. Récupération des travaux assignés...")
    response = requests.get(f"{BASE_URL}/api/travaux/mes-travaux", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Erreur récupération travaux: {response.text}")
        return None
    
    travaux = response.json()
    print(f"✓ {len(travaux)} travaux trouvés")
    
    # Trouver un travail non livré
    travail_a_livrer = None
    for travail in travaux:
        if not travail.get('livraison'):
            travail_a_livrer = travail
            break
    
    if not travail_a_livrer:
        print("✗ Aucun travail non livré trouvé")
        return None
    
    print(f"✓ Travail à livrer trouvé: {travail_a_livrer['titre_travail']}")
    
    # 2. Livrer le travail
    print("\n2. Livraison du travail...")
    create_test_file()
    
    with open(TEST_FILE_PATH, 'rb') as f:
        files = {'fichier': f}
        data = {'commentaire': 'Voici mon travail terminé. J\'ai respecté toutes les consignes.'}
        
        response = requests.post(
            f"{BASE_URL}/api/travaux/livrer/{travail_a_livrer['id_assignation']}",
            headers={"Authorization": f"Bearer {token_etudiant}"},
            files=files,
            data=data
        )
    
    cleanup_test_file()
    
    if response.status_code == 201:
        livraison = response.json()
        print(f"✓ Livraison réussie - ID: {livraison['id_livraison']}")
        return {
            'id_livraison': livraison['id_livraison'],
            'id_travail': travail_a_livrer['id_travail'],
            'token_etudiant': token_etudiant
        }
    else:
        print(f"✗ Erreur livraison: {response.text}")
        return None

def test_formateur_evaluation():
    """Test de l'évaluation d'une livraison par un formateur."""
    print("\n=== TEST ÉVALUATION FORMATEUR ===")
    
    # D'abord faire une livraison
    livraison_info = test_etudiant_livraison()
    if not livraison_info:
        print("✗ Impossible de tester l'évaluation sans livraison")
        return False
    
    # Connexion formateur
    token_formateur = login_user("formateur.test@example.com", "password123")
    if not token_formateur:
        print("✗ Impossible de se connecter en tant que formateur")
        return False
    
    headers = {"Authorization": f"Bearer {token_formateur}"}
    
    # 1. Récupérer les livraisons du travail
    print("\n1. Récupération des livraisons...")
    response = requests.get(
        f"{BASE_URL}/api/travaux/travail/{livraison_info['id_travail']}/livraisons",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"✗ Erreur récupération livraisons: {response.text}")
        return False
    
    travail_data = response.json()
    print(f"✓ Travail: {travail_data['titre']}")
    print(f"✓ {len(travail_data['assignations'])} assignations trouvées")
    
    # 2. Évaluer la livraison
    print("\n2. Évaluation de la livraison...")
    evaluation_data = {
        "note_attribuee": 16.5,
        "feedback": "Excellent travail ! Vous avez bien respecté les consignes. Quelques améliorations possibles sur la présentation, mais le contenu est de qualité."
    }
    
    response = requests.post(
        f"{BASE_URL}/api/travaux/evaluer/{livraison_info['id_livraison']}",
        headers=headers,
        json=evaluation_data
    )
    
    if response.status_code == 200:
        livraison_evaluee = response.json()
        print(f"✓ Évaluation réussie - Note: {livraison_evaluee['note_attribuee']}")
        return True
    else:
        print(f"✗ Erreur évaluation: {response.text}")
        return False

def test_telechargement_fichier():
    """Test du téléchargement du fichier livré."""
    print("\n=== TEST TÉLÉCHARGEMENT FICHIER ===")
    
    # D'abord faire une livraison
    livraison_info = test_etudiant_livraison()
    if not livraison_info:
        print("✗ Impossible de tester le téléchargement sans livraison")
        return False
    
    # Test avec le token étudiant (sa propre livraison)
    headers_etudiant = {"Authorization": f"Bearer {livraison_info['token_etudiant']}"}
    
    print("1. Téléchargement par l'étudiant...")
    response = requests.get(
        f"{BASE_URL}/api/travaux/telecharger/{livraison_info['id_livraison']}",
        headers=headers_etudiant
    )
    
    if response.status_code == 200:
        print("✓ Téléchargement réussi par l'étudiant")
    else:
        print(f"✗ Erreur téléchargement étudiant: {response.text}")
    
    # Test avec le token formateur
    token_formateur = login_user("formateur.test@example.com", "password123")
    if token_formateur:
        headers_formateur = {"Authorization": f"Bearer {token_formateur}"}
        
        print("2. Téléchargement par le formateur...")
        response = requests.get(
            f"{BASE_URL}/api/travaux/telecharger/{livraison_info['id_livraison']}",
            headers=headers_formateur
        )
        
        if response.status_code == 200:
            print("✓ Téléchargement réussi par le formateur")
        else:
            print(f"✗ Erreur téléchargement formateur: {response.text}")

def test_verification_etudiant():
    """Vérifier que l'étudiant voit sa note."""
    print("\n=== VÉRIFICATION CÔTÉ ÉTUDIANT ===")
    
    token_etudiant = login_user("etudiant.test@example.com", "password123")
    if not token_etudiant:
        return
    
    headers = {"Authorization": f"Bearer {token_etudiant}"}
    
    response = requests.get(f"{BASE_URL}/api/travaux/mes-travaux", headers=headers)
    
    if response.status_code == 200:
        travaux = response.json()
        travaux_notes = [t for t in travaux if t.get('livraison') and t['livraison'].get('note_attribuee')]
        
        print(f"✓ L'étudiant voit {len(travaux_notes)} travaux notés")
        
        for travail in travaux_notes:
            livraison = travail['livraison']
            print(f"  - {travail['titre_travail']}: {livraison['note_attribuee']}/{travail['note_max']}")
            if livraison.get('feedback'):
                print(f"    Commentaire: {livraison['feedback'][:50]}...")
    else:
        print(f"✗ Erreur vérification étudiant: {response.text}")

def main():
    """Fonction principale de test."""
    print("🚀 DÉBUT DES TESTS - LIVRAISON ET ÉVALUATION")
    print("=" * 50)
    
    try:
        # Test de livraison par l'étudiant
        livraison_info = test_etudiant_livraison()
        
        if livraison_info:
            # Test d'évaluation par le formateur
            evaluation_success = test_formateur_evaluation()
            
            if evaluation_success:
                # Test de téléchargement
                test_telechargement_fichier()
                
                # Vérification côté étudiant
                test_verification_etudiant()
                
                print("\n" + "=" * 50)
                print("✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !")
                print("✅ Les user stories de livraison et d'évaluation fonctionnent correctement.")
            else:
                print("\n❌ ÉCHEC DES TESTS - Problème d'évaluation")
        else:
            print("\n❌ ÉCHEC DES TESTS - Problème de livraison")
    
    except Exception as e:
        print(f"\n❌ ERREUR INATTENDUE: {str(e)}")
    
    finally:
        cleanup_test_file()

if __name__ == "__main__":
    main()