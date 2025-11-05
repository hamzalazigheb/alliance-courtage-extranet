# 🔧 Solution : Erreur 500 sur /api/partners

## ❌ Problème

Erreur 500 lors de la création d'un partenaire. Probablement la colonne `logo_content` manquante.

## ✅ Solution : Ajouter logo_content à partners

```bash
# Vérifier la structure actuelle
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE partners;"

# Ajouter logo_content
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE partners ADD COLUMN logo_content LONGTEXT AFTER logo_url;"

# Modifier logo_url pour permettre NULL (si base64 est utilisé)
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE partners MODIFY COLUMN logo_url VARCHAR(500) NULL;"

# Vérifier
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE partners;"
```

---

## 🔍 Vérifier les Logs

```bash
# Voir les logs pour l'erreur exacte
docker logs alliance-courtage-backend --tail 30 | grep -i "partners\|error" -A 5
```

---

**Exécutez ces commandes pour ajouter logo_content ! 🚀**


