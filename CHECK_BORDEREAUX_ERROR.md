# 🔍 Vérifier l'Erreur 500 sur /api/bordereaux

## Commande à Exécuter

```bash
# Voir les logs récents pour identifier l'erreur exacte
docker logs alliance-courtage-backend --tail 50

# Voir seulement les erreurs
docker logs alliance-courtage-backend --tail 100 | grep -i "error\|exception\|failed" -A 5
```

---

## Vérifications Additionnelles

```bash
# 1. Vérifier que la table a été créée correctement
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"

# 2. Vérifier que le backend a redémarré
docker ps | grep alliance-courtage-backend

# 3. Tester l'API directement
curl -X GET http://localhost:3001/api/bordereaux
```

---

**Exécutez la commande pour voir les logs et envoyez-moi l'erreur exacte ! 🔍**


