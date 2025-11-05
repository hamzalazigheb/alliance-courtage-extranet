# 🔍 Vérifier l'Erreur 500 sur /api/bordereaux/recent (Après Recréation)

## Commande à Exécuter

```bash
# Voir les logs récents pour identifier l'erreur exacte
docker logs alliance-courtage-backend --tail 50 | grep -i "bordereaux\|recent\|error\|exception" -A 5

# Voir les logs complets récents
docker logs alliance-courtage-backend --tail 30
```

---

## Vérifications

```bash
# Vérifier que la table a été recréée correctement
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"

# Vérifier que toutes les colonnes nécessaires existent
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW COLUMNS FROM bordereaux WHERE Field IN ('title', 'file_path', 'description', 'file_content', 'uploaded_by', 'updated_at');"
```

---

**Exécutez ces commandes pour voir l'erreur exacte ! 🔍**


