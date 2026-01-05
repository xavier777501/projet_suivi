# 🚀 Guide de Déploiement : Pas à Pas pour Débutants

Ce guide vous accompagne pour mettre votre application en ligne. Actuellement, tout est sur votre ordinateur (Local). L'objectif est de le mettre sur Internet (Cloud).

---

## ÉTAPE 1 : La Base de Données (Votre MySQL sur le Web) 💾

Actuellement, votre base de données est sur **phpMyAdmin** sur votre PC. Mais quand vous éteignez votre PC, la base s'arrête. Pour qu'elle soit toujours accessible sur Internet, on utilise un service gratuit appelé **TiDB Cloud**.

### 1. Créer le compte
1. Allez sur [TiDB Cloud](https://pingcap.com/products/tidb-cloud/).
2. Cliquez sur "Sign Up" pour créer un compte gratuit.
3. Choisissez l'offre **"Serverless"** (elle est gratuite à vie et largement suffisante).

### 2. Créer le "Cluster" (Le conteneur de votre base)
1. Une fois connecté, cliquez sur **"Create Cluster"**.
2. Choisissez une région proche (ex: Europe ou USA).
3. Attendez quelques secondes que TiDB prépare votre base.

### 3. Récupérer l'adresse de connexion
1. Cliquez sur le bouton **"Connect"** en haut à droite.
2. Choisissez **"SQLAlchemy"** ou **"MySQL Client"** dans les options.
3. TiDB va vous donner une adresse qui ressemble à ça :
   `mysql://votre_user:votre_pass@tous-les-chiffres.aws.tidbcloud.com:4000/suiviprojet`
4. **⚠️ Copiez cette adresse précieusement.** C'est la clé de votre application.

---

## ÉTAPE 2 : Préparer le Code Backend 🐍

Votre fichier `back/database/database.py` dit actuellement : 
`"mysql://root:@localhost/suiviprojet"`

Il va falloir le modifier pour qu'il dise : 
*"Prends l'adresse que j'ai copiée sur TiDB Cloud"*.

### Comment faire ?
On ne va pas écrire l'adresse directement dans le code (c'est dangereux). On va utiliser une **Variable d'Environnement** appelée `DATABASE_URL`. Sur Render (votre hébergeur backend), vous ajouterez simplement cette adresse dans les paramètres.

---

## ÉTAPE 3 : Héberger le Backend sur Render ☁️

1. Créez un compte sur [Render.com](https://render.com/).
2. Connectez votre compte GitHub.
3. Cliquez sur **"New"** -> **"Web Service"**.
4. Sélectionnez votre projet.
5. **Configuration :**
   - **Root Directory :** `back`
   - **Start Command :** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Variables d'Environnement :** Allez dans l'onglet "Environment" et ajoutez :
   - `DATABASE_URL` = (Collez ici l'adresse TiDB que vous avez copiée).

---

## ÉTAPE 4 : Héberger le Frontend sur Vercel 🖥️

C'est l'étape finale.
1. Allez sur [Vercel.com](https://vercel.com/).
2. Importez votre projet `front-react`.
3. **Variables d'Environnement :** Ajoutez :
   - `VITE_API_URL` = (L'adresse que Render vous a donnée à l'étape 3).

---

### 💡 Résumé visuel
1. **TiDB Cloud** donne une adresse à **Render**.
2. **Render** donne une adresse à **Vercel**.
3. Tout le monde est content ! 😊
