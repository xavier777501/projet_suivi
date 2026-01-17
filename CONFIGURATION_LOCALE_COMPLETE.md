# 🏠 Configuration Locale Complète - Projet UATM

## ✅ Configuration Terminée

Votre environnement est maintenant **100% local** sans aucune dépendance externe.

## 🚀 Démarrage Rapide

### 1. Démarrage automatique
```bash
# Exécuter le script de démarrage complet
start_local_dev.bat
```

### 2. Démarrage manuel

#### Backend (Terminal 1)
```bash
cd back
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend (Terminal 2)  
```bash
cd front-react
npm run dev
```

## 🔗 URLs Locales

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interface utilisateur React |
| **Backend** | http://localhost:8000 | API FastAPI |
| **Documentation** | http://localhost:8000/docs | Swagger UI |
| **Base de données** | `back/database.db` | SQLite local |

## 👤 Compte DE (Directeur d'Établissement)

```
Email: de@genielogiciel.com
Mot de passe: admin123
```

**✅ Connexion testée et fonctionnelle**

## 🧪 Vérification de l'environnement

```bash
cd back
python test_local_setup.py
```

Ce script vérifie :
- ✅ Santé du backend
- ✅ Connexion DE
- ✅ API protégées
- ✅ Base de données

## 📁 Fichiers de Configuration

### Frontend (`front-react/.env`)
```env
VITE_API_URL=http://localhost:8000
```

### API (`front-react/src/services/api.js`)
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## 🎯 Fonctionnalités Disponibles

### ✅ Authentification
- Connexion DE, Formateur, Étudiant
- Gestion des sessions JWT
- Changement de mot de passe

### ✅ Gestion des Comptes
- Création de formateurs
- Création d'étudiants
- Gestion des profils

### ✅ Espaces Pédagogiques
- Création d'espaces
- Assignation de formateurs
- Inscription d'étudiants

### ✅ Gestion des Travaux
- Création de travaux (individuel/collectif)
- Assignation aux étudiants
- Soumission avec fichiers
- Évaluation et notation
- Notifications email

### ✅ Interface Utilisateur
- Dashboards par rôle
- Composants modernes et responsifs
- Thème sombre/clair
- Navigation intuitive

## 🔧 Dépannage

### Problème de connexion DE
```bash
cd back
python init_de_account.py
```

### Reset complet de la base
```bash
# Supprimer la base
rm back/database.db

# Redémarrer le backend (recrée la DB)
cd back
python -m uvicorn main:app --reload

# Recréer le compte DE
python init_de_account.py
```

### Problème de port occupé
```bash
# Vérifier les ports
netstat -an | findstr :8000
netstat -an | findstr :5173

# Tuer les processus si nécessaire
taskkill /f /im python.exe
taskkill /f /im node.exe
```

## 📧 Configuration Email (Optionnel)

Pour tester les notifications email, configurez Mailtrap :

1. Créez un compte sur [Mailtrap.io](https://mailtrap.io)
2. Créez un fichier `back/.env` :
```env
MAILTRAP_TOKEN=your_token_here
MAILTRAP_INBOX_ID=your_inbox_id_here
EMAIL_SENDER=admin@uatm.bj
```

## 🎉 Prêt à Utiliser !

Votre environnement local est maintenant configuré et testé. Vous pouvez :

1. **Démarrer les serveurs** avec `start_local_dev.bat`
2. **Ouvrir le navigateur** sur http://localhost:5173
3. **Se connecter en DE** avec `de@genielogiciel.com` / `admin123`
4. **Créer des comptes** formateurs et étudiants
5. **Tester les fonctionnalités** de gestion des travaux

---

**Configuration terminée le** : 15/01/2026  
**Version** : 1.0 Local  
**Status** : ✅ Opérationnel