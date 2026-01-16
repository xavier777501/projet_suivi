#!/usr/bin/env python3
"""
Test de connexions simultanées de différents utilisateurs
"""

import requests
import json
import threading
import time

API_BASE_URL = "http://localhost:8000"

def test_login_user(email, password, role_name):
    """Test de connexion pour un utilisateur spécifique"""
    
    print(f"🔍 [{role_name}] Tentative de connexion pour {email}...")
    
    login_data = {
        "email": email,
        "mot_de_passe": password
    }
    
    try:
        # Connexion
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            user = data.get("utilisateur")
            
            print(f"✅ [{role_name}] Connexion réussie pour {user['nom']} {user['prenom']}")
            
            # Test d'accès au dashboard approprié
            headers = {"Authorization": f"Bearer {token}"}
            
            if user['role'] == 'DE':
                dashboard_url = f"{API_BASE_URL}/api/dashboard/de"
            elif user['role'] == 'FORMATEUR':
                dashboard_url = f"{API_BASE_URL}/api/dashboard/formateur"
            elif user['role'] == 'ETUDIANT':
                dashboard_url = f"{API_BASE_URL}/api/dashboard/etudiant"
            
            dashboard_response = requests.get(dashboard_url, headers=headers)
            
            if dashboard_response.status_code == 200:
                print(f"✅ [{role_name}] Accès au dashboard autorisé")
                return True
            else:
                print(f"❌ [{role_name}] Accès au dashboard refusé: {dashboard_response.status_code}")
                return False
                
        else:
            print(f"❌ [{role_name}] Échec de connexion: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ [{role_name}] Erreur: {e}")
        return False

def test_concurrent_sessions():
    """Test de sessions simultanées"""
    
    print("🚀 Test de connexions simultanées...")
    print("=" * 60)
    
    # Utilisateurs de test (basés sur les données de la base)
    users = [
        ("de@genielogiciel.com", "admin123", "DE"),
        ("xav@gmail.com", "password", "ETUDIANT_1"),  # Mot de passe à ajuster
        ("yanickmpolo5@gmail.com", "password", "FORMATEUR_1")  # Mot de passe à ajuster
    ]
    
    # Lancer les connexions en parallèle
    threads = []
    results = []
    
    def worker(email, password, role_name):
        result = test_login_user(email, password, role_name)
        results.append((role_name, result))
    
    # Créer les threads
    for email, password, role_name in users:
        thread = threading.Thread(target=worker, args=(email, password, role_name))
        threads.append(thread)
    
    # Lancer tous les threads en même temps
    start_time = time.time()
    for thread in threads:
        thread.start()
    
    # Attendre que tous se terminent
    for thread in threads:
        thread.join()
    
    end_time = time.time()
    
    print("\n" + "=" * 60)
    print("📊 RÉSULTATS:")
    
    successful_logins = 0
    for role_name, success in results:
        status = "✅ SUCCÈS" if success else "❌ ÉCHEC"
        print(f"  {role_name}: {status}")
        if success:
            successful_logins += 1
    
    print(f"\n🎯 {successful_logins}/{len(users)} connexions réussies")
    print(f"⏱️  Temps total: {end_time - start_time:.2f}s")
    
    if successful_logins > 1:
        print("✅ Les connexions simultanées fonctionnent !")
    else:
        print("❌ Problème avec les connexions simultanées")

if __name__ == "__main__":
    test_concurrent_sessions()