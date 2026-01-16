# 📚 USER STORIES - LIVRAISON DE TRAVAUX

## Vue d'ensemble

Ce document récapitule toutes les fonctionnalités développées et à développer pour la gestion et la livraison des travaux dans le système de gestion pédagogique UATM.

---

## 🎯 USER STORY 1 : Création de Travaux (Formateur)

**En tant que** Formateur  
**Je veux** créer un travail pour mes étudiants  
**Afin que** je puisse leur assigner des devoirs avec des consignes et une date limite

### Fonctionnalités implémentées :

#### Backend (`back/routes/travaux.py`)
- ✅ Route POST `/api/travaux/creer` - Création d'un travail
- ✅ Validation des données (titre, description, date limite)
- ✅ Vérification que le formateur est assigné à l'espace
- ✅ Support des types de travaux : INDIVIDUEL ou COLLECTIF
- ✅ Génération automatique d'identifiant unique
- ✅ Note maximale configurable (par défaut 20.0)

#### Frontend (`front-react/src/components/forms/CreateTravail.jsx`)
- ✅ Formulaire de création avec champs :
  - Titre du travail
  - Description détaillée
  - Type de travail (Individuel/Collectif)
  - Date et heure d'échéance
  - Note maximale
- ✅ Sélection de l'espace pédagogique
- ✅ Validation côté client
- ✅ Messages de succès/erreur
- ✅ Interface moderne et responsive

### Critères d'acceptation :
- ✅ Le formateur peut créer un travail uniquement pour ses espaces
- ✅ Tous les champs obligatoires sont validés
- ✅ La date d'échéance doit être dans le futur
- ✅ Le travail est enregistré en base de données
- ✅ Confirmation visuelle de la création

---

## 🎯 USER STORY 2 : Assignation de Travaux (Formateur)

**En tant que** Formateur  
**Je veux** assigner un travail à un ou plusieurs étudiants  
**Afin qu'** ils reçoivent une notification et puissent le consulter

### Fonctionnalités implémentées :

#### Backend (`back/routes/travaux.py`)
- ✅ Route POST `/api/travaux/assigner` - Assignation de travail
- ✅ Validation du type de travail vs nombre d'étudiants
  - Travail INDIVIDUEL : 1 seul étudiant
  - Travail COLLECTIF : plusieurs étudiants
- ✅ Vérification des doublons (pas de double assignation)
- ✅ Création d'assignations avec statut initial "ASSIGNE"
- ✅ Envoi d'emails de notification en arrière-plan
- ✅ Date d'échéance personnalisable par assignation

#### Email Service (`back/utils/email_service.py`)
- ✅ Template email d'assignation de travail
- ✅ Informations incluses :
  - Titre du travail
  - Nom de la matière
  - Nom du formateur
  - Date d'échéance
  - Description du travail
- ✅ Envoi asynchrone (BackgroundTasks)

#### Frontend
- ⏳ Interface d'assignation à développer
- ⏳ Sélection des étudiants (checkbox/liste)
- ⏳ Prévisualisation des étudiants sélectionnés
- ⏳ Confirmation d'assignation

### Critères d'acceptation :
- ✅ Le formateur peut assigner un travail créé
- ✅ Respect des contraintes de type (individuel/collectif)
- ✅ Pas de double assignation possible
- ✅ Email envoyé à chaque étudiant assigné
- ⏳ Interface utilisateur intuitive

---

## 🎯 USER STORY 3 : Consultation des Travaux Assignés (Étudiant)

**En tant qu'** Étudiant  
**Je veux** consulter la liste de mes travaux assignés  
**Afin de** connaître mes devoirs à rendre

### Fonctionnalités à implémenter :

#### Backend
- ⏳ Route GET `/api/travaux/mes-travaux` - Liste des travaux de l'étudiant
- ⏳ Filtrage par statut (ASSIGNE, EN_COURS, RENDU, NOTE)
- ⏳ Tri par date d'échéance
- ⏳ Informations retournées :
  - Détails du travail (titre, description, type)
  - Matière et espace pédagogique
  - Date d'assignation et d'échéance
  - Statut actuel
  - Note (si évalué)
  - Commentaires du formateur

#### Frontend (`front-react/src/components/forms/MesTravaux.jsx`)
- ⏳ Page "Mes Travaux" dans le dashboard étudiant
- ⏳ Liste des travaux avec cartes/tableau
- ⏳ Filtres par statut et matière
- ⏳ Indicateurs visuels :
  - Badge de statut (couleur selon l'état)
  - Compte à rebours pour l'échéance
  - Alerte si date dépassée
- ⏳ Bouton "Rendre le travail" pour chaque assignation
- ⏳ Affichage de la note si évalué

### Critères d'acceptation :
- ⏳ L'étudiant voit uniquement ses travaux assignés
- ⏳ Les travaux sont triés par urgence (échéance proche en premier)
- ⏳ Les statuts sont clairement identifiables
- ⏳ Navigation fluide vers la page de soumission

---

## 🎯 USER STORY 4 : Soumission/Livraison de Travail (Étudiant)

**En tant qu'** Étudiant  
**Je veux** soumettre mon travail complété  
**Afin que** mon formateur puisse l'évaluer

### Fonctionnalités à implémenter :

#### Backend
- ⏳ Route POST `/api/travaux/soumettre` - Soumission de travail
- ⏳ Paramètres :
  - `id_assignation` : Identifiant de l'assignation
  - `commentaire_etudiant` : Commentaire optionnel
  - `fichier` : Upload de fichier (optionnel)
- ⏳ Validations :
  - Vérifier que l'assignation appartient à l'étudiant
  - Vérifier que le travail n'est pas déjà rendu
  - Vérifier la date d'échéance (permettre soumission tardive avec flag)
- ⏳ Actions :
  - Mise à jour du statut : ASSIGNE → RENDU
  - Enregistrement de la date de soumission
  - Sauvegarde du commentaire
  - Stockage du fichier (si fourni)
  - Notification email au formateur

#### Frontend (`front-react/src/components/forms/LivrerTravail.jsx`)
- ⏳ Modal/Page de soumission
- ⏳ Affichage des détails du travail
- ⏳ Zone de texte pour commentaire
- ⏳ Upload de fichier (drag & drop)
- ⏳ Prévisualisation du fichier
- ⏳ Validation avant soumission
- ⏳ Confirmation de soumission
- ⏳ Message de succès avec récapitulatif

#### Gestion des fichiers
- ⏳ Stockage sécurisé des fichiers
- ⏳ Formats acceptés : PDF, DOCX, ZIP, images
- ⏳ Taille maximale : 10 MB
- ⏳ Nommage unique des fichiers
- ⏳ Association fichier ↔ assignation

### Critères d'acceptation :
- ⏳ L'étudiant peut soumettre son travail avant l'échéance
- ⏳ Possibilité de soumettre après l'échéance (avec indication)
- ⏳ Upload de fichier fonctionnel
- ⏳ Commentaire optionnel enregistré
- ⏳ Statut mis à jour immédiatement
- ⏳ Email de notification envoyé au formateur
- ⏳ Impossible de soumettre deux fois le même travail

---

## 🎯 USER STORY 5 : Consultation des Travaux Rendus (Formateur)

**En tant que** Formateur  
**Je veux** consulter les travaux rendus par mes étudiants  
**Afin de** les évaluer

### Fonctionnalités implémentées :

#### Backend (`back/routes/travaux.py`)
- ✅ Route GET `/api/travaux/mes-assignations` - Liste des assignations du formateur
- ✅ Informations retournées :
  - Titre du travail
  - Nom de la matière
  - Nom et prénom de l'étudiant
  - Date d'assignation
  - Date d'échéance
  - Statut actuel
  - Type de travail
- ✅ Tri par date d'assignation (plus récent en premier)
- ✅ Filtrage par espace pédagogique du formateur

#### Frontend
- ⏳ Page "Évaluations" dans le dashboard formateur
- ⏳ Liste des travaux rendus (statut RENDU)
- ⏳ Filtres par matière, statut, date
- ⏳ Recherche par nom d'étudiant
- ⏳ Indicateurs :
  - Nombre de travaux à corriger
  - Travaux en retard
  - Moyenne de la classe
- ⏳ Bouton "Évaluer" pour chaque travail rendu

### Critères d'acceptation :
- ✅ Le formateur voit uniquement les assignations de ses espaces
- ⏳ Les travaux rendus sont mis en évidence
- ⏳ Navigation rapide vers l'évaluation
- ⏳ Statistiques globales visibles

---

## 🎯 USER STORY 6 : Évaluation de Travail (Formateur)

**En tant que** Formateur  
**Je veux** évaluer un travail rendu  
**Afin de** donner une note et un feedback à l'étudiant

### Fonctionnalités implémentées :

#### Backend
- ⏳ Route PUT `/api/travaux/evaluer` - Évaluation d'un travail
- ⏳ Paramètres :
  - `id_assignation` : Identifiant de l'assignation
  - `note` : Note attribuée (0 à note_max)
  - `commentaire_formateur` : Feedback textuel
- ⏳ Validations :
  - Vérifier que le travail est rendu (statut RENDU)
  - Vérifier que la note est dans la plage valide
  - Vérifier que le formateur est autorisé
- ⏳ Actions :
  - Mise à jour du statut : RENDU → NOTE
  - Enregistrement de la note et du commentaire
  - Date d'évaluation enregistrée
  - Notification email à l'étudiant

#### Frontend (`front-react/src/components/forms/EvaluerTravail.jsx`)
- ✅ Modal/Page d'évaluation
- ✅ Affichage des détails du travail
- ✅ Affichage du commentaire de l'étudiant
- ✅ Téléchargement du fichier soumis
- ✅ Champ de saisie de la note (avec validation)
- ✅ Zone de texte pour commentaire/feedback
- ✅ Prévisualisation avant validation
- ✅ Confirmation d'évaluation
- ✅ Interface moderne et ergonomique

### Critères d'acceptation :
- ⏳ Le formateur peut évaluer uniquement les travaux rendus
- ⏳ La note doit être entre 0 et la note maximale du travail
- ⏳ Le commentaire est obligatoire
- ⏳ L'étudiant reçoit une notification email
- ⏳ Le statut est mis à jour automatiquement
- ⏳ L'évaluation est définitive (pas de modification après)

---

## 🎯 USER STORY 7 : Consultation des Notes (Étudiant)

**En tant qu'** Étudiant  
**Je veux** consulter mes notes et feedbacks  
**Afin de** suivre ma progression

### Fonctionnalités à implémenter :

#### Backend
- ⏳ Route GET `/api/travaux/mes-notes` - Notes de l'étudiant
- ⏳ Informations retournées :
  - Détails du travail
  - Note obtenue / Note maximale
  - Commentaire du formateur
  - Date d'évaluation
  - Matière
- ⏳ Calcul de statistiques :
  - Moyenne générale
  - Moyenne par matière
  - Nombre de travaux évalués
  - Taux de réussite

#### Frontend
- ⏳ Section "Mes Notes" dans le dashboard étudiant
- ⏳ Liste des travaux évalués
- ⏳ Affichage de la note avec indicateur visuel
- ⏳ Lecture du feedback du formateur
- ⏳ Graphiques de progression
- ⏳ Statistiques personnelles

### Critères d'acceptation :
- ⏳ L'étudiant voit uniquement ses propres notes
- ⏳ Les notes sont affichées clairement
- ⏳ Le feedback est lisible et complet
- ⏳ Les statistiques sont à jour

---

## 🎯 USER STORY 8 : Statistiques et Rapports (Formateur)

**En tant que** Formateur  
**Je veux** consulter des statistiques sur les travaux  
**Afin de** suivre la progression de mes étudiants

### Fonctionnalités à implémenter :

#### Backend
- ⏳ Route GET `/api/travaux/statistiques/{id_espace}` - Stats d'un espace
- ⏳ Métriques calculées :
  - Nombre total de travaux créés
  - Nombre d'assignations
  - Taux de soumission (rendus / assignés)
  - Taux d'évaluation (notés / rendus)
  - Moyenne générale de la classe
  - Distribution des notes
  - Travaux en retard
  - Étudiants les plus actifs/inactifs

#### Frontend
- ⏳ Dashboard de statistiques
- ⏳ Graphiques interactifs :
  - Courbe de progression
  - Histogramme des notes
  - Taux de soumission
- ⏳ Tableaux de bord par matière
- ⏳ Export des données (CSV/PDF)

### Critères d'acceptation :
- ⏳ Les statistiques sont calculées en temps réel
- ⏳ Les graphiques sont clairs et informatifs
- ⏳ Possibilité de filtrer par période
- ⏳ Export fonctionnel

---

## 📋 Récapitulatif de l'implémentation

### ✅ Fonctionnalités complètes
1. Création de travaux (Backend + Frontend)
2. Assignation de travaux (Backend)
3. Consultation des assignations formateur (Backend)
4. Interface d'évaluation (Frontend)

### ⏳ Fonctionnalités à développer
1. **Priorité HAUTE** :
   - Soumission de travail (Backend + Frontend)
   - Consultation des travaux étudiant (Frontend)
   - Évaluation de travail (Backend)
   - Interface d'assignation (Frontend)

2. **Priorité MOYENNE** :
   - Gestion des fichiers (upload/download)
   - Notifications email complètes
   - Consultation des notes (Backend + Frontend)

3. **Priorité BASSE** :
   - Statistiques avancées
   - Rapports et exports
   - Graphiques de progression

---

## 🔧 Modèles de données

### Table `Travail`
```python
- id_travail: str (PK)
- id_espace: str (FK)
- titre: str
- description: str
- type_travail: TypeTravailEnum (INDIVIDUEL/COLLECTIF)
- date_echeance: datetime
- date_creation: datetime
- note_max: Decimal
```

### Table `Assignation`
```python
- id_assignation: str (PK)
- id_travail: str (FK)
- id_etudiant: str (FK)
- date_assignment: datetime
- date_soumission: datetime (nullable)
- date_evaluation: datetime (nullable)
- statut: StatutAssignationEnum
  - ASSIGNE: Travail assigné, pas encore commencé
  - EN_COURS: Étudiant a commencé (optionnel)
  - RENDU: Travail soumis, en attente d'évaluation
  - NOTE: Travail évalué
- note: Decimal (nullable)
- commentaire_etudiant: str (nullable)
- commentaire_formateur: str (nullable)
- fichier_path: str (nullable)
```

---

## 🚀 Prochaines étapes

1. **Implémenter la soumission de travail** :
   - Backend : Route de soumission
   - Frontend : Composant LivrerTravail.jsx
   - Gestion des fichiers

2. **Compléter l'évaluation** :
   - Backend : Route d'évaluation
   - Intégration avec le frontend existant

3. **Développer la consultation étudiant** :
   - Frontend : Composant MesTravaux.jsx
   - Backend : Route mes-travaux

4. **Ajouter les notifications** :
   - Emails de soumission
   - Emails d'évaluation
   - Rappels d'échéance

5. **Implémenter les statistiques** :
   - Backend : Calculs et agrégations
   - Frontend : Dashboards et graphiques

---

## 📝 Notes techniques

### Sécurité
- Vérification des autorisations à chaque route
- Validation des données côté backend
- Protection contre les injections SQL (SQLAlchemy ORM)
- Gestion sécurisée des fichiers uploadés

### Performance
- Utilisation de BackgroundTasks pour les emails
- Indexation des tables sur les clés étrangères
- Pagination pour les listes longues
- Cache pour les statistiques

### UX/UI
- Feedback visuel immédiat
- Messages d'erreur clairs
- Confirmations pour les actions importantes
- Design responsive et accessible

---

**Document créé le** : {{ date }}  
**Dernière mise à jour** : {{ date }}  
**Version** : 1.0
