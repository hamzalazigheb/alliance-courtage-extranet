# 🔍 Vérifier la Dernière Erreur

## Commande à Exécuter

```bash
# Voir les logs les plus récents
docker logs alliance-courtage-backend --tail 30

# Voir les erreurs spécifiques
docker logs alliance-courtage-backend --tail 50 | grep -i "error\|exception" -A 5
```

---

## Vérifications

```bash
# 1. Vérifier que la table a été recréée correctement
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"

# 2. Vérifier que toutes les colonnes sont présentes
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW COLUMNS FROM bordereaux;"
```

---

**Exécutez ces commandes pour voir l'erreur exacte ! 🔍**


