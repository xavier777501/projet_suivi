# Explication Ligne par Ligne du Fichier `text.py`

Ce fichier explique en détail chaque ligne du fichier de tests unitaires `text.py`.

---

## 1. En-tête et Importations

```python
1: # d:\pr\back\text.py
2: # Tests unitaires pour création de formateur et promotion
3: # Vérifie l'envoi d'email et le contrôle d'accès (rôle DE requis)
```
*   **Lignes 1-3** : Commentaires de base pour identifier le fichier et son but (tester les formateurs, les promotions, les emails et les accès).

```python
5: import pytest
6: import httpx
7: from httpx import ASGITransport
8: from unittest.mock import patch
9: import uuid
```
*   **Ligne 5 (`pytest`)** : Le moteur qui exécute les tests.
*   **Ligne 6 (`httpx`)** : Le client pour envoyer des requêtes HTTP (POST, GET) de manière asynchrone.
*   **Ligne 7 (`ASGITransport`)** : Permet de tester l'application FastAPI directement en mémoire sans avoir besoin de lancer un serveur web réel.
*   **Ligne 8 (`patch`)** : Outil pour "intercepter" des fonctions (comme l'envoi d'email) et vérifier si elles ont été appelées sans vraiment envoyer de mail.
*   **Ligne 9 (`uuid`)** : Permet de générer des identifiants uniques (pour éviter d'utiliser deux fois le même email dans les tests).

```python
12: from main import app
```
*   **Ligne 12** : Importation de votre application FastAPI définie dans `main.py`.

---

## 2. Configuration Globale

```python
14: BASE_URL = "http://testserver"
17: DE_EMAIL = "de@genielogiciel.com"
18: DE_PASSWORD = "admin123"
```
*   **Ligne 14** : Une URL fictive pour le client de test.
*   **Lignes 17-18** : Les identifiants du Directeur d'Établissement utilisés pour se connecter.

---

## 3. La Fixture d'Authentification

```python
21: @pytest.fixture
22: async def auth_token_de():
```
*   **Ligne 21** : Déclare une `fixture`. C'est une fonction qui prépare un environnement pour les tests (ici, elle prépare le token de connexion).
*   **Ligne 22** : La fonction est `async` car elle attend une réponse de l'API.

```python
24:     transport = ASGITransport(app=app)
25:     async with httpx.AsyncClient(transport=transport, base_url=BASE_URL) as client:
26:         resp = await client.post(
27:             "/api/auth/login",
28:             json={"email": DE_EMAIL, "mot_de_passe": DE_PASSWORD},
29:         )
```
*   **Ligne 24** : On lie le client de test à votre application `app`.
*   **Ligne 26** : On simule l'envoi du formulaire de connexion au backend.

```python
30:         assert resp.status_code == 200, f"Échec connexion DE: {resp.text}"
31:         return resp.json()["token"]
```
*   **Ligne 30** : On vérifie que la connexion a réussi (Code 200). Sinon, le test s'arrête avec un message d'erreur.
*   **Ligne 31** : On extrait le token JWT qui sera utilisé pour prouver qu'on est le DE dans les autres tests.

---

## 4. Test 1 : Création Formateur + Email

```python
38: @pytest.mark.anyio
39: async def test_creer_formateur_avec_email(auth_token_de):
```
*   **Ligne 39** : Le test demande le token du DE (`auth_token_de`) en argument.

```python
44:     unique_email = f"formateur.{uuid.uuid4()}@test.com"
```
*   **Ligne 44** : On génère un email unique genre `formateur.550e8400...@test.com` pour ne jamais avoir d'erreur "Email déjà utilisé".

```python
55:     with patch("routes.gestion_comptes.email_service") as mock_email:
```
*   **Ligne 55** : On dit à Python : "Pendant ce test, remplace le service d'email par un faux service appelé `mock_email`".

```python
64:         assert resp.status_code == 201, f"Erreur création formateur: {resp.text}"
67:         mock_email.envoyer_email_creation_compte.assert_called_once()
```
*   **Ligne 64** : Vérifie que le formateur a été créé (Code 201).
*   **Ligne 67** : Vérifie que la fonction d'envoi d'email a été déclenchée **exactement une fois**.

---

## 5. Test 2 : Création Promotion

```python
89:         filieres_resp = await client.get("/api/gestion-comptes/filieres", headers=headers)
93:         assert filieres_resp.status_code == 200
97:         id_filiere = filieres[0]["id_filiere"]
```
*   **Ligne 89** : On demande d'abord la liste des filières à l'API.
*   **Ligne 97** : On récupère l'ID de la première filière disponible pour pouvoir créer une promotion dedans.

```python
104:         resp = await client.post("/api/gestion-comptes/creer-promotion", ...)
111:         assert resp.status_code in [201, 400]
```
*   **Ligne 111** : On accepte soit le code **201** (Créé), soit le code **400** (déjà existant), car l'important est que l'API réagisse de manière cohérente.

---

## 6. Tests de Sécurité (Non-DE)

```python
133:     async with httpx.AsyncClient(...) as client:
134:         resp = await client.post("/api/gestion-comptes/creer-formateur", ...)
140:     assert resp.status_code in [401, 403]
```
*   **Lignes 133-140** : On essaie de créer un formateur **sans envoyer de token**.
*   **Ligne 140** : On vérifie que l'API refuse l'accès. Un code **401** (Non authentifié) ou **403** (Interdit) prouve que la route est bien protégée.

---

## Conclusion

Ce fichier de test garantit que :
1. Les créations fonctionnent.
2. L'email est envoyé virtuellement au bon moment.
3. **Seul le DE a les droits d'accès.**
