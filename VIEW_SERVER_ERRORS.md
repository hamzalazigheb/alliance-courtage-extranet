# 🔍 Comment Voir les Erreurs du Serveur

## 📋 Commandes pour Voir les Erreurs

### 1. Voir les logs du backend (dernières 100 lignes)

```bash
docker logs alliance-courtage-backend --tail 100
```

### 2. Voir uniquement les erreurs

```bash
docker logs alliance-courtage-backend --tail 200 | grep -i "error\|exception\|failed\|500"
```

### 3. Voir les erreurs liées à la mise à jour d'utilisateur

```bash
docker logs alliance-courtage-backend --tail 200 | grep -i -A 10 "update user"
```

### 4. Voir les logs en temps réel

```bash
docker logs -f alliance-courtage-backend
```

### 5. Voir les erreurs SQL spécifiques

```bash
docker logs alliance-courtage-backend --tail 200 | grep -i "ER_\|SQL\|database"
```

## 🔧 Script Automatique

Utilisez le script pour voir toutes les erreurs :

```bash
cd ~/alliance/alliance/backend/scripts
chmod +x checkUserUpdateError.sh
./checkUserUpdateError.sh
```

## 📊 Erreurs Communes et Solutions

### Erreur : "Unknown column 'denomination_sociale'"

**Solution :**
```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
ALTER TABLE users ADD COLUMN denomination_sociale VARCHAR(255) NULL;
"
```

### Erreur : "Unknown column 'telephone'"

**Solution :**
```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
ALTER TABLE users ADD COLUMN telephone VARCHAR(20) NULL;
"
```

### Erreur : "Unknown column 'code_postal'"

**Solution :**
```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
ALTER TABLE users ADD COLUMN code_postal VARCHAR(10) NULL;
"
```

### Erreur : "ER_DUP_ENTRY" (Email déjà utilisé)

**Solution :** L'email que vous essayez d'utiliser est déjà pris par un autre utilisateur.

### Erreur : "WARN_DATA_TRUNCATED" (Rôle invalide)

**Solution :** Le rôle doit être 'admin', 'user', ou 'broker'.

## 🚀 Solution Rapide (Créer toutes les colonnes manquantes)

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS denomination_sociale VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS telephone VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS code_postal VARCHAR(10) NULL;
EOF
```

## 📝 Vérifier la Structure de la Table

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE users;"
```

## 🔍 Tester l'API Directement

```bash
# Tester la mise à jour d'un utilisateur
curl -X PUT http://localhost:3001/api/users/44 \
  -H "Content-Type: application/json" \
  -H "x-auth-token: VOTRE_TOKEN" \
  -d '{
    "nom": "Test",
    "prenom": "User"
  }'
```


