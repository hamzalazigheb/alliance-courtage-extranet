# 🔧 Ajouter file_content à Toutes les Tables

## ✅ Tables à Vérifier

Les tables suivantes doivent avoir `file_content LONGTEXT` :
- `archives`
- `financial_documents`
- `formations`
- `structured_products`
- `reglementaire_documents` (si existe)

## 🚀 Solution : Ajouter file_content à Toutes les Tables

```bash
# 1. Archives
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE archives ADD COLUMN file_content LONGTEXT AFTER file_path;"

# 2. Financial Documents (si pas déjà fait)
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE financial_documents ADD COLUMN file_content LONGTEXT AFTER file_path;"

# 3. Formations
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE formations ADD COLUMN file_content LONGTEXT AFTER file_path;"

# 4. Structured Products
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE structured_products ADD COLUMN file_content LONGTEXT AFTER file_path;"

# 5. Vérifier toutes les structures
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE archives;"
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE financial_documents;"
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE formations;"
```

---

## 🔍 Gérer les Erreurs "Duplicate column"

Si vous obtenez "Duplicate column name", c'est normal - la colonne existe déjà. Ignorez l'erreur.

---

**Exécutez toutes ces commandes pour ajouter file_content partout ! 🚀**


