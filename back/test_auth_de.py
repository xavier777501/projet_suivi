#!/usr/bin/env python3
"""
Script pour tester l'authentification du compte DE
"""

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:8000"

def test_login_de():
    """Test de connexion avec le compte DE"""
    
    print("🔍 Test de connexion avec le compte DE...")
    
    # Données de connexion
    login_data = {
        "email": "de@genielogiciel.com",
        "mot_de_passe": "admin123"
    }
    
    try:
        # Tentative de connexion
        response = requests.post(f"{API_BASE_URL}/api/auth/login", json=login_data)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            
            print("✅ Connexion réussie !")
            print(f"Token: {token[:50]}...")
            
            # Test d'une route protégée
            headers = {"Authorization": f"Bearer {token}"}
            test_response = requests.get(f"{API_BASE_URL}/api/gestion-comptes/promotions", headers=headers)
            
            print(f"\n🔍 Test route protégée /api/gestion-comptes/promotions")
            print(f"Status Code: {test_response.status_code}")
            
            if test_response.status_code == 200:
                print("✅ Accès aux routes de gestion autorisé !")
                promotions = test_response.json()
                print(f"Nombre de promotions: {len(promotions.get('promotions', []))}")
            else:
                print("❌ Accès refusé aux routes de gestion")
                print(f"Erreur: {test_response.text}")
                
        else:
            print("❌ Échec de la connexion")
            
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    test_login_de()