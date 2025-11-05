# Commandes à exécuter sur le serveur

# 1. Vérifier que la migration a été effectuée (vérifier que la colonne link existe)
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE notifications;"

# 2. Si la colonne link n'existe pas, exécuter la migration
docker exec -it alliance-courtage-backend node scripts/addLinkToNotifications.js

# 3. Rebuild le frontend pour appliquer les changements React
docker compose build --no-cache frontend

# 4. Redémarrer le frontend
docker compose up -d frontend

# 5. Vérifier les logs pour s'assurer que tout fonctionne
docker logs alliance-courtage-backend --tail 30
docker logs alliance-courtage-extranet --tail 30

# 6. Vérifier que les conteneurs sont bien démarrés
docker ps

