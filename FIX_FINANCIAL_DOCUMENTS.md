# 🔧 Solution : Erreur 500 sur /api/financial-documents

## ❌ Problème

```
Unknown column 'file_content' in 'field list'
```

La table `financial_documents` n'a pas la colonne `file_content`.

## ✅ Solution : Ajouter la Colonne file_content

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Vérifier la structure actuelle
DESCRIBE financial_documents;

-- Ajouter file_content si elle n'existe pas
ALTER TABLE financial_documents ADD COLUMN file_content LONGTEXT AFTER file_path;

-- Vérifier que la colonne a été ajoutée
DESCRIBE financial_documents;
EOF
```

---

## 🔍 Si la Colonne Existe Déjà

Si vous obtenez une erreur "Duplicate column name", vérifiez d'abord :

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE financial_documents;"
```

---

**Exécutez la commande pour ajouter file_content ! 🚀**


