import pytest
import httpx
from httpx import ASGITransport
import sys
import os

# Ajouter le chemin du backend pour l'import de l'app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

BASE_URL = "http://testserver"
DE_EMAIL = "de@genielogiciel.com"
DE_PASSWORD = "admin123"

@pytest.fixture
async def auth_token():
    """Fixture pour obtenir le token d'authentification du DE"""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.post("/api/auth/login", json={
            "email": DE_EMAIL,
            "mot_de_passe": DE_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]

@pytest.mark.anyio
async def test_us_2_1_creer_formateur(auth_token):
    """Test US 2.1 : Création de compte formateur par le DE"""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        formateur_data = {
            "email": "test.formateur.api@example.com",
            "nom": "Test",
            "prenom": "Formateur"
        }
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = await client.post(
            "/api/gestion-comptes/creer-formateur", 
            json=formateur_data,
            headers=headers
        )
        
        # 201 ou 400 si déjà créé dans une session précédente
        assert response.status_code in [201, 400]

@pytest.mark.anyio
async def test_us_2_3_creer_promotion(auth_token):
    """Test US 2.3 : Création de promotion par le DE"""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        headers = {"Authorization": f"Bearer {auth_token}"}
        res_filiere = await client.get("/api/gestion-comptes/filieres", headers=headers)
        assert res_filiere.status_code == 200
        filieres = res_filiere.json()["filieres"]
        
        if not filieres:
            pytest.skip("Aucune filière trouvée")
            
        id_filiere = filieres[0]["id_filiere"]
        
        promo_data = {
            "id_filiere": id_filiere,
            "annee_academique": "2025-2026"
        }
        
        response = await client.post(
            "/api/gestion-comptes/creer-promotion",
            json=promo_data,
            headers=headers
        )
        assert response.status_code in [201, 400]


@pytest.mark.anyio
async def test_acces_refuse_non_de():
    """Vérifier que les routes DE sont protégées"""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        response = await client.post("/api/gestion-comptes/creer-promotion", json={})
        assert response.status_code == 401
