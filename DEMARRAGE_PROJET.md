# 🚀 Guide de démarrage du projet

## 1. Démarrer le Backend (FastAPI)

### Terminal 1 - Backend :
```bash
cd "C:\Users\PC\Downloads\Sergioprogramme\projet_suivi\back"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## 2. Démarrer le Frontend (React)

### Terminal 2 - Frontend :
```bash
cd "C:\Users\PC\Downloads\Sergioprogramme\projet_suivi\front-react"

# SOLUTION RECOMMANDÉE : Utiliser npm directement
npm run dev

# OU installer yarn d'abord puis l'utiliser
npm install -g yarn
yarn dev
```

## 3. Vérifier que yarn est installé

Si `yarn dev` ne fonctionne pas, vérifiez d'abord si yarn est installé :

```bash
yarn --version
```

Si yarn n'est pas installé, vous avez 2 options :

### Option A : Installer yarn globalement
```bash
npm install -g yarn
```

### Option B : Utiliser npm directement
```bash
npm run dev
```

## 4. Accès aux applications

Une fois les deux serveurs démarrés :

- **Backend API** : http://127.0.0.1:8000
- **Frontend React** : http://localhost:5173 (ou le port affiché dans le terminal)

## 5. Vérification que tout fonctionne

### Backend :
- Aller sur http://127.0.0.1:8000 → Devrait afficher `{"message": "FastAPI fonctionne 🎉"}`
- Aller sur http://127.0.0.1:8000/docs → Documentation Swagger de l'API

### Frontend :
- Aller sur http://localhost:5173 → Interface de connexion
- Se connecter avec le compte DE : `admin@etablissement.fr` / `admin123`

## 6. Test des nouvelles fonctionnalités

1. **Se connecter en tant que DE**
2. **Aller dans l'onglet "Espaces Pédagogiques"**
3. **Cliquer sur "Gérer"** sur un espace existant
4. **Tester l'assignation de formateur et l'ajout d'étudiants**

## 🔧 Dépannage

### Si yarn dev ne fonctionne pas :
```bash
# Vérifier le fichier package.json
cat package.json

# Installer les dépendances
yarn install
# OU
npm install

# Puis relancer
yarn dev
# OU  
npm run dev
```

### Si le port 5173 est occupé :
Le serveur Vite choisira automatiquement un autre port (5174, 5175, etc.)

### Si erreur CORS :
Vérifiez que le backend tourne bien sur le port 8000 et que le frontend utilise la bonne URL d'API dans `src/services/api.js`