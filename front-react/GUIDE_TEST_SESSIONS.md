# 🧪 Guide de Test - Sessions Multiples

## 🚀 Démarrage Rapide

1. **Démarrer l'application** :
   ```bash
   cd front-react
   npm run dev
   ```

2. **Ouvrir dans le navigateur** : `http://localhost:5173`

## 🔍 Éléments de Debug Visibles

### Panneau de Debug (Haut Droite)
- **Session ID** : Identifiant unique de l'onglet
- **État d'authentification** : Connecté/Non connecté
- **Rôle utilisateur** : DE/FORMATEUR/ETUDIANT
- **Sessions actives** : Nombre total de sessions
- **Boutons d'action** : Actualiser, Nettoyer, Sauvegarder, etc.

### Panneau de Test (Bas Gauche)
- **Informations onglet** : ID, Session, Multi-onglet
- **Authentification** : État + boutons de test
- **Données isolées** : Compteur et notes privées à l'onglet
- **Données partagées** : Compteur synchronisé entre onglets
- **Tests d'isolation** : Résultats automatiques

## 🧪 Tests à Effectuer

### Test 1 : Sessions Multiples
1. **Ouvrir l'onglet 1** → Se connecter avec le DE
2. **Dupliquer l'onglet** (Ctrl+Shift+K)
3. **Dans l'onglet 2** → Se connecter avec un autre compte
4. **Vérifier** : Chaque onglet garde sa propre session

### Test 2 : Persistance au Rafraîchissement
1. **Se connecter** dans un onglet
2. **Rafraîchir la page** (F5)
3. **Vérifier** : La session est préservée

### Test 3 : Isolation des Données
1. **Onglet 1** : Incrémenter le compteur isolé
2. **Onglet 2** : Vérifier que le compteur reste à 0
3. **Tester les notes** : Écrire dans un onglet, vérifier l'isolation

### Test 4 : Données Partagées
1. **Onglet 1** : Incrémenter le compteur partagé
2. **Onglet 2** : Vérifier que le compteur se synchronise

### Test 5 : Migration Automatique
1. **Avant le test** : Se connecter avec l'ancien système
2. **Redémarrer avec le nouveau système**
3. **Vérifier** : Les données sont migrées automatiquement

## 🔧 Comptes de Test

### Compte Administrateur (DE)
- **Email** : `de@genielogiciel.com`
- **Mot de passe** : `admin123`
- **Permissions** : Création de comptes, gestion complète

### Autres Comptes
- Créés via l'interface DE
- Voir les logs de la console pour les identifiants générés

## 🎯 Résultats Attendus

### ✅ Succès
- Chaque onglet maintient sa propre session
- Les données ne s'écrasent plus entre onglets
- Le rafraîchissement préserve la session
- Les tests d'isolation passent tous (✅)

### ❌ Problèmes Potentiels
- Tests d'isolation échouent (❌)
- Sessions se mélangent entre onglets
- Données perdues au rafraîchissement
- Erreurs dans la console

## 🛠️ Dépannage

### Erreur "Session non trouvée"
- Vider le localStorage : `localStorage.clear()`
- Rafraîchir la page
- Se reconnecter

### Erreur "Import non résolu"
- Vérifier que tous les fichiers sont créés
- Redémarrer le serveur de développement

### Sessions qui se mélangent
- Vérifier les panneaux de debug
- Utiliser le bouton "Nettoyer sessions"
- Forcer la migration avec le bouton dédié

## 📊 Métriques de Performance

Le système affiche :
- **Nombre de sessions actives**
- **Utilisation du stockage** (en KB)
- **Âge des sessions** (en minutes)
- **Temps d'inactivité** par session

## 🎉 Fonctionnalités Avancées

- **Sauvegarde/Restauration** : Export des sessions en JSON
- **Nettoyage automatique** : Sessions expirées (24h)
- **Détection multi-onglets** : Indicateur visuel
- **Synchronisation sélective** : Données partagées vs isolées
- **Monitoring temps réel** : Statistiques détaillées