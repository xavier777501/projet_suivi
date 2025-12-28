# Projet de Suivi - Documentation

Ce projet est composé d'un backend en Python (FastAPI) et d'un frontend en React (Vite).

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (v18 ou supérieur)
- **Python** (3.9 ou supérieur)
- **MySQL** (via XAMPP, WAMP ou installation native)

---

## 💾 Configuration de la Base de Données

1. Lancez votre serveur MySQL (ex: via le panneau de contrôle XAMPP).
2. Ouvrez **phpMyAdmin** (généralement sur `http://localhost/phpmyadmin`).
3. Créez une nouvelle base de données nommée : **`suiviprojet`**.
   - *Note : Utilisez l'interclassement `utf8mb4_unicode_ci` pour une meilleure compatibilité.*

---

## ⚙️ Installation et Lancement du Backend

Le code du backend se trouve dans le dossier `back/`.

1. **Ouvrez un terminal** dans le dossier `back` :
   ```bash
   cd back
   ```

2. **Créez un environnement virtuel** :
   ```bash
   python -m venv venv
   ```

3. **Activez l'environnement virtuel** :
   - Sur Windows : `venv\Scripts\activate`
   - Sur macOS/Linux : `source venv/bin/activate`

4. **Installez les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

5. **Lancez le serveur** :
   ```bash
   python main.py
   # OU
   uvicorn main:app --reload
   ```
   Le backend sera disponible sur `http://localhost:8000`.

---

## 💻 Installation et Lancement du Frontend

Le code du frontend se trouve dans le dossier `front-react/`.

1. **Ouvrez un terminal** dans le dossier `front-react` :
   ```bash
   cd front-react
   ```

2. **Installez les dépendances** :
   ```bash
   npm install
   ```

3. **Lancez le projet en mode développement** :
   ```bash
   npm run dev
   ```
   L'application sera disponible (par défaut) sur `http://localhost:5173`.

---

## 🧪 Tests

Pour exécuter les tests du backend :
1. Assurez-vous que l'environnement virtuel est activé.
2. Allez dans le dossier `back/`.
3. Lancez la commande :
   ```bash
   pytest
   ```

---

## 📝 Notes Supplémentaires
- Assurez-vous que le port `8000` (backend) et le port `5173` (frontend) ne sont pas utilisés par d'autres applications.
- Si vous changez les identifiants MySQL, modifiez-les dans `back/create_db.py` et dans la configuration de la base de données du backend.
