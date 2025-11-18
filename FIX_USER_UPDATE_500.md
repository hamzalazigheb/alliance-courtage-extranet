# 🔧 Fix : Erreur 500 sur PUT /api/users/:id

## 🔍 Problème

```
PUT http://13.38.115.36/api/users/44 500 (Internal Server Error)
```

L'erreur 500 lors de la mise à jour d'un utilisateur peut être due à :
1. Colonnes manquantes dans la table `users` (denomination_sociale, telephone, code_postal)
2. Erreur SQL lors de la mise à jour
3. Problème de validation de données

## ✅ Solution Immédiate

### Option 1 : Vérifier les colonnes de la table users

```bash
# Sur votre serveur de production
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE users;"
```

### Option 2 : Voir les logs du backend pour l'erreur exacte

```bash
# Voir les dernières erreurs
docker logs alliance-courtage-backend --tail 100 | grep -i "error\|update user\|500"
```

### Option 3 : Créer les colonnes manquantes (si nécessaire)

```bash
# Si les colonnes n'existent pas, les créer
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS denomination_sociale VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10) NULL;
EOF

# Vérifier
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE users;" | grep -E "denomination_sociale|telephone|code_postal"
```

## 🔄 Solution Long Terme

Le code a été amélioré pour :
1. ✅ Vérifier automatiquement quelles colonnes existent avant de les mettre à jour
2. ✅ Ignorer les colonnes qui n'existent pas (avec un warning)
3. ✅ Fournir des messages d'erreur plus détaillés
4. ✅ Gérer les erreurs SQL spécifiques (colonnes manquantes, contraintes, etc.)

### Redéployer avec le code mis à jour

```bash
# Sur votre serveur
cd ~/alliance/alliance
git pull origin main

# Rebuild le backend
cd backend
docker compose build --no-cache backend
docker compose up -d backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

## 📋 Diagnostic

### Vérifier les colonnes de la table users

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;
"
```

### Tester la mise à jour d'un utilisateur

```bash
# Via curl (remplacez TOKEN et ID)
curl -X PUT http://localhost:3001/api/users/44 \
  -H "Content-Type: application/json" \
  -H "x-auth-token: VOTRE_TOKEN" \
  -d '{
    "nom": "Test",
    "prenom": "User"
  }'
```

## 🚀 Solution Rapide (Tout en une fois)

```bash
# 1. Vérifier les colonnes
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE users;"

# 2. Créer les colonnes manquantes si nécessaire
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS denomination_sociale VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10) NULL;
"

# 3. Vérifier les logs du backend
docker logs alliance-courtage-backend --tail 50 | grep -i "update user"
```

## 📝 Notes

- Les colonnes `denomination_sociale`, `telephone`, et `code_postal` sont optionnelles
- Si elles n'existent pas, le code mis à jour les ignorera automatiquement
- Les colonnes de base (id, email, nom, prenom, role, is_active) doivent toujours exister


