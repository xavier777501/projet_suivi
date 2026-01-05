# d:\pr\back\text.py
# Tests unitaires pour création de formateur et promotion
# Vérifie l'envoi d'email et le contrôle d'accès (rôle DE requis)

import pytest
import httpx
from httpx import ASGITransport
from unittest.mock import patch
import uuid

# Le serveur FastAPI de l'application
from main import app

BASE_URL = "http://testserver"

# Credentials du Directeur d'Établissement (DE)
DE_EMAIL = "de@genielogiciel.com"
DE_PASSWORD = "admin123"


@pytest.fixture
async def auth_token_de():
    """Récupère le token JWT du DE pour les requêtes authentifiées."""
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        resp = await client.post(
            "/api/auth/login",
            json={"email": DE_EMAIL, "mot_de_passe": DE_PASSWORD},
        )
        assert resp.status_code == 200, f"Échec connexion DE: {resp.text}"
        return resp.json()["token"]


# ============================================================================
# TEST 1: Création formateur par DE avec envoi email
# ============================================================================

@pytest.mark.anyio
async def test_creer_formateur_avec_email(auth_token_de):
    """
    Test: Création d'un formateur par le DE.
    Vérifie le code 201 et l'appel au service d'envoi d'email.
    """
    unique_email = f"formateur.{uuid.uuid4()}@test.com"

    formateur_payload = {
        "email": unique_email,
        "nom": "TestNom",
        "prenom": "TestPrenom",
    }

    headers = {"Authorization": f"Bearer {auth_token_de}"}
    transport = ASGITransport(app=app)

    with patch("routes.gestion_comptes.email_service") as mock_email:
        async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
            resp = await client.post(
                "/api/gestion-comptes/creer-formateur",
                json=formateur_payload,
                headers=headers,
            )

        # Le formateur doit être créé (code 201)
        assert resp.status_code == 201, f"Erreur création formateur: {resp.text}"

        # L'email de création doit avoir été appelé exactement une fois
        mock_email.envoyer_email_creation_compte.assert_called_once()
        
        # Vérifier que le destinataire correspond à l'email généré
        called_kwargs = mock_email.envoyer_email_creation_compte.call_args.kwargs
        assert called_kwargs["destinataire"] == unique_email


# ============================================================================
# TEST 2: Création promotion par DE (sans email)
# ============================================================================

@pytest.mark.anyio
async def test_creer_promotion(auth_token_de):
    """
    Test: Création d'une promotion par le DE.
    Aucune logique d'email n'est attendue pour les promotions.
    """
    transport = ASGITransport(app=app)
    headers = {"Authorization": f"Bearer {auth_token_de}"}
    
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        # Récupérer une filière existante
        filieres_resp = await client.get(
            "/api/gestion-comptes/filieres", 
            headers=headers
        )
        assert filieres_resp.status_code == 200
        filieres = filieres_resp.json()["filieres"]
        assert filieres, "Aucune filière disponible pour le test"

        id_filiere = filieres[0]["id_filiere"]

        promo_payload = {
            "id_filiere": id_filiere,
            "annee_academique": "2025-2026",
        }

        resp = await client.post(
            "/api/gestion-comptes/creer-promotion",
            json=promo_payload,
            headers=headers,
        )
        
        # La promotion doit être créée (201) ou déjà existante (400)
        assert resp.status_code in [201, 400], f"Erreur promotion: {resp.text}"


# ============================================================================
# TEST 3: Non-DE ne peut PAS créer un formateur
# ============================================================================

@pytest.mark.anyio
async def test_creer_formateur_non_de_interdit():
    """
    Test: Un utilisateur non-DE ne peut PAS créer un formateur.
    Vérifie que l'accès est refusé (401 ou 403).
    """
    formateur_payload = {
        "email": "test.interdit@test.com",
        "nom": "Test",
        "prenom": "Interdit",
    }

    transport = ASGITransport(app=app)

    # Test sans token (simule un utilisateur non authentifié/non-DE)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        resp = await client.post(
            "/api/gestion-comptes/creer-formateur",
            json=formateur_payload,
        )

    # L'accès doit être refusé (401 Unauthorized ou 403 Forbidden)
    assert resp.status_code in [401, 403], f"Attendu 401/403, reçu: {resp.status_code}"


# ============================================================================
# TEST 4: Non-DE ne peut PAS créer une promotion
# ============================================================================

@pytest.mark.anyio
async def test_creer_promotion_non_de_interdit():
    """
    Test: Un utilisateur non-DE ne peut PAS créer une promotion.
    Vérifie que l'accès est refusé (401 ou 403).
    """
    promo_payload = {
        "id_filiere": "fake_id",
        "annee_academique": "2099-2100",
    }

    transport = ASGITransport(app=app)

    # Test sans token (simule un utilisateur non authentifié/non-DE)
    async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
        resp = await client.post(
            "/api/gestion-comptes/creer-promotion",
            json=promo_payload,
        )

    # L'accès doit être refusé (401 Unauthorized ou 403 Forbidden)
    assert resp.status_code in [401, 403], f"Attendu 401/403, reçu: {resp.status_code}"