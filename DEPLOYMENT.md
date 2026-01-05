# Guide de Déploiement Gratuit

Ce guide vous explique comment héberger votre application **gratuitement** sur le Web.

---

## 1. Hébergement Frontend (React) 🚀
**Plateforme recommandée : [Vercel](https://vercel.com/)** ou **[Netlify](https://www.netlify.com/)**

1. Créez un compte sur Vercel et liez votre GitHub.
2. Importez votre projet `front-react`.
3. **Configuration importante :**
   - **Framework Preset :** Vite
   - **Root Directory :** `front-react`
   - **Environment Variables :** Ajoutez `VITE_API_URL` pointant vers l'URL de votre backend Render.

---

## 2. Hébergement Backend (FastAPI) 🐍
**Plateforme recommandée : [Render](https://render.com/)** ou **[Koyeb](https://www.koyeb.com/)**

1. Créez un compte sur Render.
2. Créez un nouveau **"Web Service"** lié à votre GitHub.
3. **Configuration :**
   - **Runtime :** Python
   - **Build Command :** `pip install -r requirements.txt`
   - **Start Command :** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory :** `back`
   - **Environment Variables :**
     - `DATABASE_URL` : L'URL de votre base de données TiDB (voir ci-dessous).

---

## 3. Hébergement Base de Données (MySQL) 💾
**Plateforme recommandée : [TiDB Cloud](https://pingcap.com/products/tidb-cloud/)** (MySQL compatible)

1. Créez un compte TiDB Cloud.
2. Créez un cluster **"Serverless"** (Gratuit).
3. Récupérez la **Connection String** (elle ressemble à `mysql://user:pass@host:port/dbname`).
4. Dans votre code backend (`back/database/database.py`), utilisez cette variable d'environnement pour vous connecter.

---

## 🏗️ Architecture Finale (Production)

```mermaid
graph LR
    User((Utilisateur)) --> Frontend[Vercel / Frontend React]
    Frontend -- Requêtes API --> Backend[Render / Backend FastAPI]
    Backend -- Stockage --> DB[TiDB Cloud / MySQL]
```

### 💡 Conseils pour le gratuit :
- **Render** mettra votre backend "en veille" après 15 minutes d'inactivité. Le premier chargement peut donc prendre 30 secondes.
- **TiDB Cloud** est très performant et 100% compatible avec votre code MySQL actuel.
- **Vercel** est extrêmement rapide pour le frontend.
