# 🔧 Solution : Colonne 'title' Manquante dans bordereaux

## ❌ Problème

```
Unknown column 'title' in 'field list'
```

La table `bordereaux` n'a pas de colonne `title`.

## ✅ Solutions

### Solution 1 : Vérifier la Structure de la Table

```bash
# Voir la structure de la table bordereaux
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"
```

### Solution 2 : Ajouter la Colonne 'title'

Si la colonne n'existe pas, l'ajouter :

```bash
# Ajouter la colonne title
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE bordereaux ADD COLUMN title VARCHAR(255) AFTER id;"
```

### Solution 3 : Vérifier le Script de Création de la Table

```bash
# Voir le script de création
cat backend/scripts/addBordereauxTable.js | grep -A 20 "CREATE TABLE"
```

---

## 🚀 Solution Complète

```bash
# 1. Vérifier la structure actuelle
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"

# 2. Ajouter la colonne title si elle n'existe pas
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE bordereaux ADD COLUMN IF NOT EXISTS title VARCHAR(255) AFTER id;"

# 3. Vérifier que la colonne a été ajoutée
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"
```

---

**Exécutez d'abord la Solution 1 pour voir la structure de la table ! 🚀**


