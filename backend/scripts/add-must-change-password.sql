-- Script SQL pour ajouter la colonne must_change_password à la table users
-- À exécuter sur le serveur de production

-- Vérifier si la colonne existe déjà (optionnel, pour éviter les erreurs)
-- Si elle existe déjà, cette commande échouera mais ce n'est pas grave

-- Ajouter la colonne must_change_password
ALTER TABLE users 
ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE 
AFTER password;

-- Mettre à jour tous les utilisateurs existants pour qu'ils doivent changer leur mot de passe
-- (Par défaut, tous les nouveaux utilisateurs auront must_change_password = TRUE)
UPDATE users 
SET must_change_password = TRUE 
WHERE must_change_password IS NULL;

-- Vérifier le résultat
SELECT id, email, nom, prenom, must_change_password 
FROM users 
LIMIT 5;




