# 🔧 Fix Role ENUM - Solution Rapide

## Problème
Erreur 500 sur `PUT /api/users/:id` et `POST /api/auth/register` : 
`Data truncated for column 'role' at row 1`

## Solution en 1 commande

```bash
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage <<'EOF'
-- Voir les valeurs actuelles
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role;

-- Étape 1: Convertir en VARCHAR temporaire
ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Étape 2: Nettoyer les valeurs (mettre tout en minuscule)
UPDATE users SET role = LOWER(TRIM(role));

-- Étape 3: Remplacer les valeurs invalides par 'user'
UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'user', 'broker');

-- Étape 4: Vérifier
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role;

-- Étape 5: Convertir en ENUM
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user';

-- Vérifier le résultat
SHOW COLUMNS FROM users LIKE 'role';
EOF
```

## Solution étape par étape (si la commande ci-dessus ne fonctionne pas)

```bash
# 1. Voir les valeurs actuelles
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "SELECT DISTINCT role FROM users;"

# 2. Convertir en VARCHAR
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';"

# 3. Nettoyer (minuscules)
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "UPDATE users SET role = LOWER(TRIM(role));"

# 4. Remplacer les invalides
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'user', 'broker');"

# 5. Convertir en ENUM
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user';"

# 6. Vérifier
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage -e "SHOW COLUMNS FROM users LIKE 'role';"
```

## Après la correction

Le backend devrait fonctionner immédiatement. Testez :
- Création d'un utilisateur
- Mise à jour d'un utilisateur

