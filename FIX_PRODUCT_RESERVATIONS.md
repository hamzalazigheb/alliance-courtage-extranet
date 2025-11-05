# Fix: Erreur 500 lors de la création de réservation de produit structuré

## Problème
L'erreur `POST /api/structured-products/:id/reservations 500` se produit probablement parce que la table `product_reservations` n'existe pas ou a un schéma incorrect sur le serveur.

## Solution rapide (sur le serveur)

### Option 1: Utiliser le script Node.js
```bash
cd /var/www/alliance-courtage
docker cp backend/scripts/fixProductReservationsTable.js alliance-courtage-backend:/app/scripts/
docker exec -it alliance-courtage-backend node scripts/fixProductReservationsTable.js
```

### Option 2: Utiliser le script SQL directement
```bash
cd /var/www/alliance-courtage
docker cp backend/scripts/fixProductReservationsTable.sql alliance-courtage-mysql:/tmp/
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < /tmp/fixProductReservationsTable.sql
```

### Option 3: Vérifier d'abord si la table existe
```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW TABLES LIKE 'product_reservations';"
```

Si la table n'existe pas, exécutez l'Option 1 ou 2.

## Vérification après correction

1. Vérifier que la table existe:
```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE product_reservations;"
```

2. Vérifier les logs du backend:
```bash
docker logs alliance-courtage-backend --tail 50
```

3. Tester la création d'une réservation depuis l'interface.

## Structure attendue de la table

La table `product_reservations` doit avoir les colonnes suivantes:
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `product_id` (INT, NOT NULL, FOREIGN KEY vers archives.id)
- `user_id` (INT, NOT NULL, FOREIGN KEY vers users.id)
- `montant` (DECIMAL(15, 2), NOT NULL)
- `notes` (TEXT)
- `status` (VARCHAR(20), DEFAULT 'pending')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

