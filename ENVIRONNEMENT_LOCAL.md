# 🏠 Configuration Environnement Local

## 📋 Prérequis
- Python 3.8+ installé
- Node.js 16+ installé
- Base de données SQLite (créée automatiquement)

## 🚀 Démarrage rapide

### Option 1 : Script automatique
```bash
# Exécuter le script de démarrage
start_local_dev.bat
```

### Option 2 : Démarrage manuel

#### 1. Backend (Terminal 1)
```bash
cd back
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. Frontend (Terminal 2)
```bash
cd front-react
npm run dev
```

## 🔗 URLs Locales
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs
- **Base de données** : `back/database.db` (SQLite)

## 👤 Comptes de test

### Directeur d'Établissement (DE)
- **Email** : `de@genielogiciel.com`
- **Mot de passe** : `admin123`
- **Rôle** : DE (Directeur d'Établissement)

### Création d'autres comptes
Une fois connecté en tant que DE, vous pouvez créer :
- Comptes Formateurs
- Comptes Étudiants
- Espaces pédagogiques
- Travaux et assignations

## 🛠️ Configuration

### Variables d'environnement Frontend
Fichier `front-react/.env` :
```
VITE_API_URL=http://localhost:8000
```

### Configuration API
Le frontend est configuré pour utiliser `http://localhost:8000` par défaut.

## 🧪 Test de l'environnement

### Test Backend
```bash
curl http://localhost:8000/docs
```

### Test connexion DE
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"de@genielogiciel.com","mot_de_passe":"admin123"}'
```

## 📁 Structure des fichiers

```
projet_suivi/
├── back/                     # Backend FastAPI
│   ├── main.py              # Point d'entrée
│   ├── database.db          # Base SQLite (auto-créée)
│   ├── init_de_account.py   # Script init compte DE
│   └── ...
├── front-react/             # Frontend React
│   ├── .env                 # Config environnement
│   ├── src/
│   └── ...
├── start_local_dev.bat      # Script de démarrage
└── ENVIRONNEMENT_LOCAL.md   # Ce fichier
```

## 🔧 Dépannage

### Backend ne démarre pas
1. Vérifier que Python est installé : `python --version`
2. Installer les dépendances : `cd back && pip install -r requirements.txt`
3. Vérifier le port 8000 : `netstat -an | findstr :8000`

### Frontend ne démarre pas
1. Vérifier que Node.js est installé : `node --version`
2. Installer les dépendances : `cd front-react && npm install`
3. Vérifier le port 5173 : `netstat -an | findstr :5173`

### Connexion DE échoue
1. Exécuter : `cd back && python init_de_account.py`
2. Vérifier les logs du backend
3. Tester avec curl (voir section Test)

### Base de données corrompue
1. Supprimer `back/database.db`
2. Redémarrer le backend (recrée la DB)
3. Exécuter `python init_de_account.py`

## 📧 Emails (Développement)

Les emails sont capturés par Mailtrap en mode développement.
Configuration dans `back/.env` (optionnel) :
```
MAILTRAP_TOKEN=your_token
MAILTRAP_INBOX_ID=your_inbox_id
EMAIL_SENDER=admin@uatm.bj
```

## 🎯 Fonctionnalités disponibles

### ✅ Implémentées
- Authentification (DE, Formateur, Étudiant)
- Gestion des comptes
- Espaces pédagogiques
- Création et assignation de travaux
- Soumission de travaux (avec fichiers)
- Évaluation de travaux
- Notifications email

### 🚧 En développement
- Statistiques avancées
- Rapports et exports
- Gestion des promotions
- Planning des cours

---

**Dernière mise à jour** : {{ date }}
**Version** : 1.0 Local