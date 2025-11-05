# 🔍 Vérifier Toutes les Erreurs 500

## Commande à Exécuter

```bash
# Voir les logs récents avec toutes les erreurs
docker logs alliance-courtage-backend --tail 100 | grep -i "error\|exception\|failed" -A 5

# Voir les logs complets récents
docker logs alliance-courtage-backend --tail 50
```

---

## Vérifications des Tables

```bash
# Vérifier que toutes les tables importantes existent
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "
USE alliance_courtage;
SHOW TABLES;
"

# Vérifier la table assurances
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE assurances;"

# Vérifier la table cms_content
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE cms_content;"
```

---

**Exécutez ces commandes pour identifier les erreurs exactes ! 🔍**


