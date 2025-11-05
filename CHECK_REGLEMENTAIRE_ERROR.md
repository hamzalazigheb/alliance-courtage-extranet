# 🔍 Vérifier l'Erreur 500 sur /api/reglementaire/documents

## Commande à Exécuter

```bash
# Voir les logs récents pour identifier l'erreur exacte
docker logs alliance-courtage-backend --tail 50 | grep -i "reglementaire\|error\|exception" -A 5

# Voir les logs complets récents
docker logs alliance-courtage-backend --tail 30
```

---

## Vérifications

```bash
# Vérifier que les tables existent
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW TABLES LIKE 'reglementaire%';"

# Vérifier la structure de reglementaire_documents
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE reglementaire_documents;"
```

---

**Exécutez ces commandes pour voir l'erreur exacte ! 🔍**


