# 🚀 Guide de Démarrage - Tests Livraison et Évaluation

## Prérequis
- Python 3.8+
- Node.js 16+
- Base de données configurée

## 1. Démarrage du Backend

```bash
cd back
# Activer l'environnement virtuel
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer les dépendances si nécessaire
pip install -r requirements.txt

# Démarrer le serveur
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Le serveur sera accessible sur : http://localhost:8000

## 2. Démarrage du Frontend

```bash
cd front-react
# Installer les dépendances si nécessaire
npm install

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur : http://localhost:5173

## 3. Initialisation des Données de Test

### Créer un compte DE (si pas déjà fait)
```bash
cd back
python init_de_account.py
```

### Créer des données de test
```bash
cd back
python create_test_promotion.py
```

## 4. Comptes de Test Disponibles

### Directeur des Études (DE)
- **Email** : `de@formateur-hub.com`
- **Mot de passe** : `admin123`
- **Rôle** : Gestion complète du système

### Formateur de Test
- **Email** : `formateur.test@example.com`
- **Mot de passe** : `password123`
- **Rôle** : Création et évaluation des travaux

### Étudiant de Test
- **Email** : `etudiant.test@example.com`
- **Mot de passe** : `password123`
- **Rôle** : Livraison des travaux

## 5. Scénario de Test Complet

### Étape 1 : Connexion Formateur
1. Aller sur http://localhost:5173
2. Se connecter avec le compte formateur
3. Accéder au dashboard formateur

### Étape 2 : Créer un Espace Pédagogique (si nécessaire)
1. Aller dans "Mes Espaces"
2. Créer un nouvel espace
3. Assigner des étudiants

### Étape 3 : Créer un Travail
1. Entrer dans l'espace pédagogique
2. Cliquer sur "Créer un travail"
3. Remplir les informations :
   - **Titre** : "Projet Web - Phase 1"
   - **Description** : "Développer une page d'accueil responsive"
   - **Type** : Individuel
   - **Échéance** : Dans 7 jours
   - **Note max** : 20

### Étape 4 : Assigner le Travail
1. Cliquer sur "Assigner" sur le travail créé
2. Sélectionner les étudiants
3. Confirmer l'assignation
4. Vérifier l'envoi des emails

### Étape 5 : Livraison par l'Étudiant
1. Se déconnecter et se reconnecter avec le compte étudiant
2. Aller dans "Mes Travaux"
3. Sélectionner le travail assigné
4. Cliquer sur "Rendre le travail"
5. Uploader un fichier (PDF, DOC, ZIP...)
6. Ajouter un commentaire
7. Confirmer la livraison

### Étape 6 : Évaluation par le Formateur
1. Se reconnecter avec le compte formateur
2. Aller dans l'espace pédagogique
3. Cliquer sur "Évaluer travaux"
4. Sélectionner la livraison de l'étudiant
5. Télécharger et examiner le fichier
6. Attribuer une note (ex: 16/20)
7. Ajouter un feedback détaillé
8. Enregistrer l'évaluation

### Étape 7 : Vérification Côté Étudiant
1. Se reconnecter avec le compte étudiant
2. Aller dans "Mes Travaux"
3. Vérifier que la note et le feedback sont visibles
4. Télécharger sa copie si nécessaire

## 6. Tests Automatisés

### Lancer le script de test complet
```bash
cd back
python test_livraison_evaluation.py
```

Ce script teste automatiquement :
- ✅ Connexion des utilisateurs
- ✅ Livraison d'un travail
- ✅ Évaluation par le formateur
- ✅ Téléchargement des fichiers
- ✅ Vérification des permissions

## 7. Vérifications Importantes

### Backend (API)
- [ ] Serveur démarré sur port 8000
- [ ] Base de données connectée
- [ ] Dossier `uploads/` créé automatiquement
- [ ] Logs sans erreurs

### Frontend (Interface)
- [ ] Application accessible sur port 5173
- [ ] Connexion fonctionnelle
- [ ] Navigation entre les pages
- [ ] Upload de fichiers opérationnel

### Fonctionnalités
- [ ] Création de travaux
- [ ] Assignation aux étudiants
- [ ] Livraison par les étudiants
- [ ] Évaluation par les formateurs
- [ ] Téléchargement des fichiers
- [ ] Notifications visuelles

## 8. Résolution de Problèmes

### Erreur de Connexion Backend
```bash
# Vérifier que le serveur est démarré
curl http://localhost:8000/docs

# Vérifier les logs
tail -f back/logs/app.log
```

### Erreur Upload de Fichiers
```bash
# Vérifier les permissions du dossier uploads
ls -la back/uploads/

# Créer le dossier si nécessaire
mkdir -p back/uploads
chmod 755 back/uploads
```

### Erreur Base de Données
```bash
# Recréer la base si nécessaire
cd back
python create_db.py
```

### Erreur Frontend
```bash
# Nettoyer le cache
cd front-react
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 9. Fonctionnalités Testées

### ✅ User Story Étudiant
- [x] Consultation des travaux assignés
- [x] Filtrage par statut (En cours, Rendus, Notés)
- [x] Upload de fichiers avec drag & drop
- [x] Ajout de commentaires
- [x] Validation des échéances
- [x] Téléchargement de sa copie
- [x] Visualisation des notes et feedback

### ✅ User Story Formateur
- [x] Création de travaux
- [x] Assignation aux étudiants
- [x] Consultation des livraisons
- [x] Téléchargement des fichiers étudiants
- [x] Attribution de notes
- [x] Ajout de feedback détaillé
- [x] Suivi des statuts

## 10. Prochaines Étapes

Une fois les tests validés, vous pouvez :
1. **Déployer en production** avec les vraies données
2. **Former les utilisateurs** sur les nouvelles fonctionnalités
3. **Monitorer l'usage** et collecter les retours
4. **Implémenter les améliorations** suggérées

---

## 📞 Support Technique

En cas de problème :
1. Vérifier les logs backend et frontend
2. Tester avec le script automatisé
3. Consulter la documentation API : http://localhost:8000/docs
4. Contacter l'équipe de développement

**Status** : ✅ Prêt pour les tests utilisateurs