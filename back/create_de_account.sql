-- Script SQL pour créer le compte DE dans la base de données
-- À exécuter dans phpMyAdmin

INSERT INTO utilisateur (
    identifiant,
    email,
    mot_de_passe,
    nom,
    prenom,
    role,
    actif,
    date_creation,
    token_activation,
    date_expiration_token,
    mot_de_passe_temporaire
) VALUES (
    'de_principal',
    'de@genielogiciel.com',
    '$2b$12$LQv3c7yqBzNzDqy.IXEJ0eFAqixtVQFb0pLgoqcwCxIlnww5S5jNi',
    'Directeur',
    'Établissement',
    'DE',
    1,
    NOW(),
    NULL,
    NULL,
    1
);

-- Vérification : afficher le compte créé
SELECT * FROM utilisateur WHERE email = 'de@genielogiciel.com';