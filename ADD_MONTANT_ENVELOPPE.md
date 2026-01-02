# Guide : Ajouter la colonne montant_enveloppe à la table archives

## Problème
La colonne `montant_enveloppe` peut ne pas exister dans la table `archives`, ce qui empêche l'affichage des enveloppes spécifiques des produits structurés.

## Solution

### Option 1 : Exécuter le script Node.js (Recommandé)

1. **Se connecter au serveur** :
```bash
ssh ubuntu@votre-serveur
```

2. **Aller dans le répertoire du projet** :
```bash
cd /chemin/vers/votre/projet
```

3. **Exécuter le script** :
```bash
node backend/scripts/addMontantEnveloppeToArchives.js
```

Le script va :
- Vérifier si la colonne existe
- L'ajouter si elle n'existe pas
- Afficher un résumé des produits avec/sans enveloppe

### Option 2 : Exécuter directement via Docker

Si votre base de données est dans Docker :

1. **Trouver le conteneur MySQL** :
```bash
docker ps -a | grep mysql
```

2. **Exécuter le script dans le conteneur** :
```bash
docker exec -i <container_id> node /chemin/vers/addMontantEnveloppeToArchives.js
```

### Option 3 : Exécuter la commande SQL directement

1. **Se connecter à MySQL** :
```bash
docker exec -it <container_id> mysql -u root -palliance2024Secure alliance_courtage
```

2. **Exécuter la commande SQL** :
```sql
-- Vérifier si la colonne existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'montant_enveloppe';

-- Si elle n'existe pas, l'ajouter
ALTER TABLE archives 
ADD COLUMN montant_enveloppe DECIMAL(15, 2) NULL DEFAULT 0 
COMMENT 'Enveloppe spécifique à ce produit structuré' 
AFTER assurance;
```

## Vérification

Après avoir ajouté la colonne, vérifiez :

```sql
-- Voir la structure de la table
DESCRIBE archives;

-- Voir les produits avec leurs enveloppes
SELECT id, title, assurance, montant_enveloppe 
FROM archives 
WHERE category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements');
```

## Ajouter des enveloppes aux produits existants

Si vous voulez ajouter des enveloppes aux produits existants :

```sql
-- Exemple : Ajouter une enveloppe de 1 000 000€ au produit "hdjshd"
UPDATE archives 
SET montant_enveloppe = 1000000 
WHERE title = 'hdjshd' AND assurance = 'lahmiiz';

-- Exemple : Ajouter une enveloppe de 2 000 000€ au produit "test"
UPDATE archives 
SET montant_enveloppe = 2000000 
WHERE title = 'test' AND assurance = 'lahmiiz';

-- Exemple : Ajouter une enveloppe de 3 000 000€ au produit "hohoho"
UPDATE archives 
SET montant_enveloppe = 3000000 
WHERE title = 'hohoho' AND assurance = 'lahmiiz';
```

## Résultat attendu

Après avoir ajouté la colonne et défini des enveloppes :

1. ✅ La colonne `montant_enveloppe` existe dans la table `archives`
2. ✅ Les produits affichent leur enveloppe spécifique dans l'interface
3. ✅ La somme "Enveloppes produits" s'affiche correctement dans l'en-tête de l'assureur
4. ✅ Chaque carte produit montre sa section "Enveloppe de ce produit" (ou un message si aucune enveloppe n'est définie)

## Notes

- La colonne est `NULL` par défaut, donc les produits existants sans enveloppe ne causeront pas d'erreur
- Vous pouvez définir des enveloppes via l'interface CMS lors de l'édition d'un produit
- La somme des enveloppes des produits peut être différente de l'enveloppe globale de l'assureur (c'est normal, car un assureur peut avoir plusieurs produits avec différentes enveloppes)



