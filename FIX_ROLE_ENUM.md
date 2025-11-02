# Fix Role ENUM Error

## Problème
Erreur `Data truncated for column 'role' at row 1` lors de la création d'utilisateurs.

## Cause
La colonne `role` dans la table `users` est un ENUM qui n'accepte pas les valeurs `admin`, `user`, `broker`.

## Solution 1 : Script Node.js (Recommandé)

```bash
cd /var/www/alliance-courtage/backend
docker exec -it alliance-courtage-backend node scripts/fixUsersRoleEnum.js
```

## Solution 2 : SQL Direct (Alternative)

```bash
# Se connecter à MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage

# Exécuter cette commande
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user';

# Vérifier
DESCRIBE users;
```

## Solution 3 : Commande en une ligne

```bash
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage <<EOF
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user';
EOF
```

## Après la migration

1. Redémarrer le backend :
```bash
cd /var/www/alliance-courtage/backend
docker compose restart backend
```

2. Vérifier les logs :
```bash
docker logs -f alliance-courtage-backend
```

3. Tester la création d'un utilisateur depuis l'interface.

## Vérification

Vérifier que la colonne est correctement configurée :
```bash
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "DESCRIBE users;"
```

Vous devriez voir quelque chose comme :
```
Field: role
Type: enum('admin','user','broker')
Null: NO
Key: 
Default: user
```

