# 🚀 Guide de Déploiement Complet - Toutes les Nouvelles Fonctionnalités

**Date :** Décembre 2024

---

## 📋 Fonctionnalités à Déployer

### 1. 📁 Système de Catégories pour les Archives ⭐ NOUVEAU
- Organisation des archives par catégories
- Édition inline de catégorie
- Filtrage par catégorie
- Correction du téléchargement

### 2. 👥 Gestion des Contacts Partenaires
- Multi-contacts par partenaire
- Gestion complète CRUD

### 3. 📄 Gestion des Documents Partenaires
- Upload de conventions et documents
- Stockage en base64
- Téléchargement public

### 4. ✏️ Modification des Partenaires
- Modification complète des partenaires existants

---

## ⚡ Déploiement Rapide (Script Automatique)

### Option 1 : Script pour Catégories d'Archives

```bash
# Sur le serveur
cd ~/alliance/alliance
chmod +x deploy-categories.sh
./deploy-categories.sh
```

### Option 2 : Script pour Toutes les Fonctionnalités Partenaires

```bash
# Sur le serveur
cd ~/alliance/alliance
chmod +x deploy-new-features.sh
./deploy-new-features.sh
```

---

## 📦 Déploiement Manuel Étape par Étape

### Étape 1 : Préparation

```bash
# Se connecter au serveur
ssh ubuntu@votre-serveur
cd ~/alliance/alliance

# Vérifier les conteneurs
docker ps

# Backup obligatoire
mkdir -p ~/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec alliance-courtage-mysql mysqldump -u root -palliance2024Secure alliance_courtage > ~/backups/backup_all_features_$TIMESTAMP.sql
```

### Étape 2 : Mise à Jour du Code

```bash
# Puller les dernières modifications
git pull origin main  # ou master selon votre branche

# Vérifier les fichiers
ls -la backend/scripts/addCategoryToArchives.js
ls -la backend/scripts/addPartnerContactsTable.js
ls -la backend/scripts/addPartnerDocumentsTable.js
```

### Étape 3 : Migration Base de Données

#### 3.1 Ajouter la colonne category aux archives

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET @dbname = DATABASE();
SET @tablename = 'archives';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) DEFAULT ''Non classé'' AFTER type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
EOF
```

#### 3.2 Créer la table partner_contacts (si elle n'existe pas)

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS partner_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  fonction VARCHAR(100),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
EOF
```

#### 3.3 Créer la table partner_documents (si elle n'existe pas)

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS partner_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  document_type VARCHAR(100) DEFAULT 'autre',
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
EOF
```

#### 3.4 Catégoriser automatiquement les bordereaux 2024

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
UPDATE archives 
SET category = 'Bordereaux 2024' 
WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
AND (category IS NULL OR category = 'Non classé' OR category = '');
EOF
```

### Étape 4 : Vérification

```bash
# Vérifier la colonne category
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category

# Vérifier les tables
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep partner

# Vérifier les catégories
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category;"
```

### Étape 5 : Redémarrage des Services

```bash
# Redémarrer le backend
docker-compose restart backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 50

# Si vous utilisez un build statique pour le frontend
npm run build
```

### Étape 6 : Tests

#### Test 1 : API Catégories

```bash
# Liste des catégories
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/archives/categories/list

# Mise à jour d'une catégorie
curl -X PUT \
  -H "x-auth-token: VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "Bordereaux 2024"}' \
  http://localhost:3001/api/archives/1/category
```

#### Test 2 : API Contacts Partenaires

```bash
# Liste des contacts d'un partenaire
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/partners/1/contacts
```

#### Test 3 : API Documents Partenaires

```bash
# Liste des documents d'un partenaire
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/partners/1/documents
```

#### Test 4 : Interface Web

1. **Se connecter en tant qu'admin** : `/manage`
2. **Tester les catégories d'archives** :
   - Aller dans "Gestion des Archives"
   - Vérifier la colonne Catégorie
   - Cliquer sur ✏️ pour modifier
   - Tester le filtre par catégorie
3. **Tester les partenaires** :
   - Aller dans "Gestion" → "Partenaires"
   - Tester "👤 Gérer Contacts"
   - Tester "📄 Gérer Documents"
   - Tester "✏️ Modifier"

---

## ✅ Checklist de Déploiement

### Pré-déploiement
- [ ] Backup de la base de données créé
- [ ] Code mis à jour (git pull)
- [ ] Vérification des fichiers de migration

### Migration Base de Données
- [ ] Colonne `category` ajoutée à `archives`
- [ ] Table `partner_contacts` créée
- [ ] Table `partner_documents` créée
- [ ] Bordereaux 2024 catégorisés automatiquement

### Redémarrage
- [ ] Backend redémarré
- [ ] Frontend mis à jour
- [ ] Logs vérifiés (pas d'erreurs)

### Tests
- [ ] API catégories fonctionne
- [ ] API contacts fonctionne
- [ ] API documents fonctionne
- [ ] Interface catégories fonctionne
- [ ] Interface contacts fonctionne
- [ ] Interface documents fonctionne
- [ ] Téléchargement d'archives fonctionne
- [ ] Filtre par catégorie fonctionne

---

## 🐛 Dépannage

### Problème : Colonne category déjà existe
**Solution :** C'est normal, continuez.

### Problème : Table partner_contacts déjà existe
**Solution :** C'est normal, continuez.

### Problème : Backend ne démarre pas
**Solution :**
```bash
docker logs alliance-courtage-backend --tail 100
# Vérifier les erreurs et corriger
docker-compose restart backend
```

### Problème : Erreur de permission
**Solution :**
```bash
chmod +x deploy-categories.sh
chmod +x deploy-new-features.sh
```

### Problème : Restaurer le backup
**Solution :**
```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < ~/backups/backup_all_features_*.sql
```

---

## 📊 Vérification Post-Déploiement

### Vérifier les Tables

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep -E "(archives|partner)"
```

### Vérifier les Colonnes

```bash
# Colonne category dans archives
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category

# Structure de partner_contacts
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE partner_contacts;"

# Structure de partner_documents
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE partner_documents;"
```

### Vérifier les Données

```bash
# Catégories existantes
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category;"

# Nombre de contacts
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT COUNT(*) as total_contacts FROM partner_contacts;"

# Nombre de documents
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT COUNT(*) as total_documents FROM partner_documents;"
```

---

## 🎉 Confirmation

Une fois tous les tests réussis, toutes les nouvelles fonctionnalités sont déployées !

### Fonctionnalités Disponibles :

1. ✅ **Système de Catégories Archives** - Organisation par catégories
2. ✅ **Contacts Partenaires** - Multi-contacts par partenaire
3. ✅ **Documents Partenaires** - Gestion complète des documents
4. ✅ **Modification Partenaires** - Modification complète
5. ✅ **Affichage Public** - Documents et contacts visibles

---

## 📞 Support

En cas de problème :

1. **Logs Backend :** `docker logs alliance-courtage-backend --tail 100`
2. **Logs MySQL :** `docker logs alliance-courtage-mysql --tail 50`
3. **Vérifier les tables :** `docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;"`
4. **Restaurer backup :** Voir section Dépannage

---

## 📝 Notes Importantes

1. **Backup obligatoire** avant toute migration
2. **Tester en staging** si possible avant la production
3. **Vérifier les logs** après chaque étape
4. **Documentation** : Consulter les guides spécifiques pour plus de détails

---

**Dernière mise à jour :** Décembre 2024

