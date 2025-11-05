# 🚀 Guide de Déploiement - Notifications avec Lien

## Étapes de déploiement

### 1. Commits locaux (si nécessaire)
```bash
git add .
git commit -m "feat: Add link field to notifications and broadcast functionality"
git push origin main
```

### 2. Sur le serveur (via SSH/Termius)

```bash
# Se connecter au serveur
ssh ubuntu@13.38.115.36

# Aller dans le répertoire du projet
cd /var/www/alliance-courtage

# Pull les dernières modifications
git pull origin main

# Migration : Ajouter la colonne link à la table notifications
docker exec -it alliance-courtage-backend node scripts/addLinkToNotifications.js

# OU via SQL direct (si le script Node.js échoue) :
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type;"

# Redémarrer le backend pour appliquer les changements
docker restart alliance-courtage-backend

# Rebuild le frontend (si nécessaire)
docker compose build --no-cache frontend
docker compose up -d frontend

# Vérifier que tout fonctionne
docker ps
docker logs alliance-courtage-backend --tail 50
```

### 3. Vérification

1. Vérifier que le backend démarre correctement :
```bash
docker logs alliance-courtage-backend --tail 50
```

2. Tester l'API :
```bash
curl http://localhost:3001/api/health
```

3. Vérifier que la colonne link existe :
```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE notifications;"
```

## Commandes rapides (tout en une fois)

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
docker exec -it alliance-courtage-backend node scripts/addLinkToNotifications.js && \
docker restart alliance-courtage-backend && \
docker compose build --no-cache frontend && \
docker compose up -d frontend && \
echo "✅ Déploiement terminé!"
```

## En cas de problème

### Si la colonne link existe déjà
L'erreur sera ignorée et la notification sera créée normalement.

### Si le script de migration échoue
Utiliser SQL direct :
```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << EOF
ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type;
EOF
```

### Vérifier les logs
```bash
docker logs alliance-courtage-backend --tail 100 | grep -i "notification\|error\|link"
```

## Résumé des changements

✅ Route backend `/api/notifications/broadcast` avec support du lien
✅ Interface CMS pour créer des notifications avec lien
✅ Page Notifications avec clic pour rediriger vers le lien
✅ Migration automatique de la colonne `link` si nécessaire

