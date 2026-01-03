# 🚨 Installation de Node.js - OBLIGATOIRE

## Problème détecté
Node.js et npm ne sont pas installés sur votre système. C'est obligatoire pour faire fonctionner le frontend React.

## 🔧 Solution : Installer Node.js

### Étape 1 : Télécharger Node.js
1. Aller sur **https://nodejs.org/**
2. Télécharger la version **LTS (Long Term Support)** - version recommandée
3. Choisir la version **Windows Installer (.msi)** pour votre système (64-bit)

### Étape 2 : Installer Node.js
1. **Exécuter le fichier .msi téléchargé**
2. **Suivre l'assistant d'installation** :
   - Accepter les termes de licence
   - Choisir le répertoire d'installation (laisser par défaut)
   - **IMPORTANT** : Cocher "Add to PATH" (ajouter au PATH)
   - Cocher "Install npm package manager"
3. **Cliquer "Install"** et attendre la fin de l'installation
4. **Redémarrer votre terminal/PowerShell**

### Étape 3 : Vérifier l'installation
Ouvrir un **nouveau terminal** et taper :
```bash
node --version
npm --version
```

Vous devriez voir quelque chose comme :
```
v18.17.0
9.6.7
```

## 🚀 Après installation de Node.js

### 1. Installer les dépendances du frontend
```bash
cd "C:\Users\PC\Downloads\Sergioprogramme\projet_suivi\front-react"
npm install
```

### 2. Démarrer le frontend
```bash
npm run dev
```

### 3. Démarrer le backend (dans un autre terminal)
```bash
cd "C:\Users\PC\Downloads\Sergioprogramme\projet_suivi\back"
python -m uvicorn main:app --reload
```

## 📋 Liens de téléchargement directs

### Node.js LTS (version recommandée) :
- **Site officiel** : https://nodejs.org/
- **Téléchargement direct Windows 64-bit** : https://nodejs.org/dist/v18.17.0/node-v18.17.0-x64.msi

## ⚠️ Notes importantes

1. **Redémarrer le terminal** après installation
2. **Node.js inclut npm automatiquement** - pas besoin d'installer npm séparément
3. **Vérifier que "Add to PATH" est coché** pendant l'installation
4. Si vous avez des problèmes, **redémarrer complètement l'ordinateur**

## 🔍 Dépannage

### Si node/npm ne sont toujours pas reconnus après installation :
1. **Redémarrer complètement l'ordinateur**
2. **Vérifier les variables d'environnement** :
   - Aller dans Paramètres système → Variables d'environnement
   - Vérifier que le chemin de Node.js est dans PATH
   - Exemple : `C:\Program Files\nodejs\`

### Si l'installation échoue :
1. **Exécuter en tant qu'administrateur**
2. **Désactiver temporairement l'antivirus**
3. **Télécharger à nouveau le fichier d'installation**

## 🎯 Une fois Node.js installé

Vous pourrez alors :
1. ✅ Installer les dépendances : `npm install`
2. ✅ Démarrer le frontend : `npm run dev`
3. ✅ Tester les nouvelles fonctionnalités de gestion des espaces pédagogiques

**Node.js est indispensable pour le développement React !** 🚀