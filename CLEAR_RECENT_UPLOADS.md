# 🗑️ Vider les Derniers Fichiers Uploadés

## 📋 Tables Concernées

Les "Derniers fichiers uploadés" proviennent probablement de :
- `bordereaux` - Bordereaux récents
- `archives` - Archives récentes
- `financial_documents` - Documents financiers récents
- `formations` - Formations récentes

## ✅ Solution : Vider les Données

### Option 1 : Vider Toutes les Tables (Recommandé pour le Client)

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE bordereaux;
TRUNCATE TABLE archives;
TRUNCATE TABLE financial_documents;
TRUNCATE TABLE formations;
TRUNCATE TABLE structured_products;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Données vidées avec succès!' as status;
EOF
```

### Option 2 : Vider Seulement les Bordereaux et Archives

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
TRUNCATE TABLE bordereaux;
TRUNCATE TABLE archives;
SELECT 'Bordereaux et archives vidés!' as status;
EOF
```

---

## 🚀 Commande Rapide (Copier-Coller)

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bordereaux;
TRUNCATE TABLE archives;
TRUNCATE TABLE financial_documents;
TRUNCATE TABLE formations;
TRUNCATE TABLE structured_products;
SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Tous les fichiers uploadés ont été vidés!' as status;
EOF
```

---

## ✅ Vérification

```bash
# Vérifier que les tables sont vides
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "
USE alliance_courtage;
SELECT 'bordereaux' as table_name, COUNT(*) as count FROM bordereaux
UNION ALL
SELECT 'archives', COUNT(*) FROM archives
UNION ALL
SELECT 'financial_documents', COUNT(*) FROM financial_documents
UNION ALL
SELECT 'formations', COUNT(*) FROM formations;
"
```

---

**Exécutez la Commande Rapide pour vider tous les fichiers uploadés ! 🚀**


