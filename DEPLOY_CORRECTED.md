# Commandes de déploiement corrigées

## 1. Ajouter la colonne link (SQL direct - RECOMMANDÉ)

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type;"
```

## 2. Vérifier que la colonne existe

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE notifications;" | grep link
```

## 3. Rebuild le frontend avec le bon nom de conteneur

```bash
cd /var/www/alliance-courtage

# Rebuild l'image frontend
docker compose build --no-cache frontend

# OU utiliser le nom de service depuis docker-compose.yml
docker compose build --no-cache

# Redémarrer le conteneur frontend (nom: alliance-courtage-extranet)
docker restart alliance-courtage-extranet

# OU utiliser docker compose
docker compose up -d frontend
```

## 4. Vérifier que tout fonctionne

```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs du frontend
docker logs alliance-courtage-extranet --tail 30

# Vérifier les logs du backend
docker logs alliance-courtage-backend --tail 30
```

## Commandes tout-en-un

```bash
cd /var/www/alliance-courtage && \
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type;" 2>/dev/null || echo "⚠️ Colonne peut-être déjà existante" && \
docker compose build --no-cache frontend && \
docker restart alliance-courtage-extranet && \
docker logs alliance-courtage-extranet --tail 20 && \
echo "✅ Déploiement terminé!"
```

## En cas d'erreur "colon already exists"

Si vous voyez une erreur indiquant que la colonne existe déjà, c'est normal. Vous pouvez vérifier avec :

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW COLUMNS FROM notifications LIKE 'link';"
```

Si la colonne existe, vous verrez une ligne avec `link`. Sinon, réessayez la commande ALTER TABLE.

