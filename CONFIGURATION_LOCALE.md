# Configuration Environnement Local

## Problème Résolu
Le frontend était configuré pour pointer vers l'API de production (Render) même en développement local.

## Solution Implémentée

### 1. Configuration Frontend Local
Créer le fichier `front-react/.env.local` avec :
```
VITE_API_URL=http://localhost:8000
```

### 2. Vérifications Effectuées
- ✅ Le fichier `.env.local` est bien ignoré par Git (présent dans `.gitignore`)
- ✅ Le backend est configuré pour tourner sur le port 8000
- ✅ Le compte DE existe dans la base de données WAMP/phpMyAdmin

### 3. Démarrage du Projet en Local

#### Backend (Port 8000)
```bash
cd back
start_server.bat
```

#### Frontend (Port 5173)
```bash
cd front-react
npm run dev
```

### 4. Connexion DE
- Email: `de@genielogiciel.com`
- Le mot de passe est configuré dans la base de données existante

## Architecture Locale
```
Frontend (localhost:5173) → Backend (localhost:8000) → Base MySQL (WAMP)
```

## Notes
- Le fichier `.env.local` doit être créé manuellement sur chaque environnement de développement
- Ce fichier n'est pas versionné pour des raisons de sécurité
- La configuration de production reste inchangée sur Render