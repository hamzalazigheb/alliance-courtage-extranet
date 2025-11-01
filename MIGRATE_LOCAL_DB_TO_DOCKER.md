# 📦 Migration Base de Données Locale → Docker

Guide pour migrer votre base de données locale vers Docker en conservant toutes les données.

---

## 📋 Étapes de Migration

### Étape 1 : Exporter la Base de Données Locale

#### Option A : Export depuis MySQL local (Windows)

```bash
# Dans PowerShell ou CMD
cd backend

# Exporter la base de données
mysqldump -u root -p alliance_courtage > backup_local.sql

# Ou avec les identifiants complets
mysqldump -h localhost -u VOTRE_USER -p alliance_courtage > backup_local.sql
```

#### Option B : Export via phpMyAdmin ou MySQL Workbench

1. Ouvrir phpMyAdmin ou MySQL Workbench
2. Sélectionner la base `alliance_courtage`
3. Export → SQL
4. Sauvegarder comme `backup_local.sql`

#### Option C : Export depuis votre script Node.js

Créez un script `backend/scripts/exportLocalDatabase.js` :

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function exportDatabase() {
  try {
    // Lire la configuration depuis config.env ou database.js
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    };

    console.log('📤 Export de la base de données locale...');
    console.log(`📊 Base: ${config.database}`);
    console.log(`🔗 Host: ${config.host}`);

    // Utiliser mysqldump
    const dumpCommand = `mysqldump -h ${config.host} -u ${config.user} -p${config.password} ${config.database} > backup_local_${Date.now()}.sql`;
    
    await execPromise(dumpCommand);
    
    console.log('✅ Export réussi !');
    console.log(`📁 Fichier: backup_local_${Date.now()}.sql`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error.message);
    console.log('\n💡 Essayez manuellement:');
    console.log(`mysqldump -h ${config.host} -u ${config.user} -p ${config.database} > backup_local.sql`);
  }
}

exportDatabase();
```

---

### Étape 2 : Préparer le Fichier de Sauvegarde

1. **Vérifier le fichier SQL** :
   - Le fichier doit contenir `CREATE DATABASE` et `USE alliance_courtage`
   - Toutes les tables avec `CREATE TABLE`
   - Toutes les données avec `INSERT INTO`

2. **Nettoyer le fichier** (si nécessaire) :
   - Supprimer les lignes `SET @@GLOBAL.GTID_PURGED` si elles existent
   - Supprimer les commentaires de lock si nécessaire

---

### Étape 3 : Déployer Docker avec Migration

#### Option A : Import Automatique au Premier Démarrage

Modifiez `backend/docker-compose.yml` pour importer automatiquement :

```yaml
services:
  mysql:
    # ... configuration existante ...
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./backup_local.sql:/docker-entrypoint-initdb.d/backup.sql
```

**⚠️ Important :** Placez le fichier `backup_local.sql` dans `backend/` avant le premier démarrage.

#### Option B : Import Manuel après Démarrage

```bash
# 1. Déployer Docker d'abord
cd /var/www/alliance-courtage
./deploy.sh

# 2. Attendre que MySQL soit prêt
sleep 20

# 3. Copier le fichier de sauvegarde vers le serveur
# (Via SCP, FTP, ou directement sur le serveur)

# 4. Importer dans le container MySQL
cd backend
docker exec -i alliance-courtage-mysql mysql -u root -p'VOTRE_ROOT_PASSWORD' < backup_local.sql

# Ou avec alliance_user
docker exec -i alliance-courtage-mysql mysql -u alliance_user -p'VOTRE_PASSWORD' alliance_courtage < backup_local.sql
```

---

### Étape 4 : Vérifier l'Import

```bash
# Se connecter à MySQL dans Docker
docker exec -it alliance-courtage-mysql mysql -u alliance_user -p'VOTRE_PASSWORD' alliance_courtage

# Dans MySQL :
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM partners;
# Vérifier toutes les tables importantes
```

---

## 🔄 Script de Migration Automatique

Créez `backend/scripts/migrateLocalToDocker.js` :

```javascript
const mysql = require('mysql2/promise');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

async function migrateLocalToDocker() {
  console.log('🚀 Migration Base de Données Locale → Docker\n');

  // 1. Exporter depuis la base locale
  console.log('📤 Étape 1: Export de la base locale...');
  const timestamp = Date.now();
  const backupFile = `backup_local_${timestamp}.sql`;
  
  try {
    // Lire config locale
    require('dotenv').config({ path: path.join(__dirname, '../config.env') });
    
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    };

    console.log(`📊 Export depuis: ${config.host}/${config.database}`);
    
    const dumpCmd = `mysqldump -h ${config.host} -u ${config.user} ${config.password ? `-p${config.password}` : ''} ${config.database} > ${backupFile}`;
    
    await execPromise(dumpCmd, { cwd: __dirname });
    console.log(`✅ Export réussi: ${backupFile}\n`);
  } catch (error) {
    console.error('❌ Erreur export:', error.message);
    console.log('\n💡 Exportez manuellement avec:');
    console.log('mysqldump -u root -p alliance_courtage > backup_local.sql\n');
    return;
  }

  // 2. Vérifier que Docker est démarré
  console.log('🐳 Étape 2: Vérification Docker...');
  try {
    await execPromise('docker ps | grep alliance-courtage-mysql');
    console.log('✅ Container MySQL Docker trouvé\n');
  } catch (error) {
    console.error('❌ Container MySQL Docker non trouvé');
    console.log('💡 Démarrez Docker d\'abord: ./deploy.sh\n');
    return;
  }

  // 3. Importer dans Docker
  console.log('📥 Étape 3: Import dans Docker...');
  try {
    // Lire docker-compose.yml pour obtenir le mot de passe
    const dockerCompose = await fs.readFile(
      path.join(__dirname, '../docker-compose.yml'),
      'utf8'
    );
    
    const rootPasswordMatch = dockerCompose.match(/MYSQL_ROOT_PASSWORD:\s*(.+)/);
    const rootPassword = rootPasswordMatch ? rootPasswordMatch[1].trim() : 'alliance2024';
    
    const importCmd = `docker exec -i alliance-courtage-mysql mysql -u root -p${rootPassword} < ${path.join(__dirname, backupFile)}`;
    
    console.log('⏳ Import en cours...');
    await execPromise(importCmd);
    console.log('✅ Import réussi !\n');
  } catch (error) {
    console.error('❌ Erreur import:', error.message);
    console.log('\n💡 Importez manuellement avec:');
    console.log('docker exec -i alliance-courtage-mysql mysql -u root -p alliance_courtage < backup_local.sql\n');
    return;
  }

  // 4. Vérifier les données
  console.log('✅ Étape 4: Vérification...');
  try {
    const verifyCmd = 'docker exec alliance-courtage-mysql mysql -u root -palliance2024 -e "USE alliance_courtage; SHOW TABLES;"';
    const result = await execPromise(verifyCmd);
    console.log('📊 Tables importées:');
    console.log(result.stdout);
    console.log('✅ Migration terminée avec succès !\n');
  } catch (error) {
    console.log('⚠️  Vérification échouée, mais l\'import semble réussi');
  }
}

migrateLocalToDocker();
```

---

## 📝 Guide Pas à Pas Complet

### Sur votre Machine Locale (Windows)

```powershell
# 1. Aller dans le dossier backend
cd backend

# 2. Exporter la base de données locale
mysqldump -u root -p alliance_courtage > backup_local.sql
# (Entrer le mot de passe MySQL local)

# 3. Vérifier que le fichier existe
ls backup_local.sql

# 4. Copier le fichier vers le serveur (via SCP)
# Ou le mettre dans un dossier accessible
```

### Sur le Serveur (Linux)

```bash
# 1. Aller dans le projet
cd /var/www/alliance-courtage/backend

# 2. Copier le fichier backup_local.sql ici
# (Via SCP, FTP, ou wget si hébergé)

# 3. Arrêter Docker si déjà démarré
docker compose down

# 4. Copier le backup dans le dossier scripts pour auto-import
cp backup_local.sql ./scripts/init_with_data.sql

# OU importer manuellement après démarrage (méthode recommandée)

# 5. Déployer Docker
cd ..
./deploy.sh

# 6. Attendre que MySQL soit prêt
sleep 20

# 7. Importer les données
cd backend
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024' < backup_local.sql

# Ou si vous avez créé un utilisateur spécifique :
docker exec -i alliance-courtage-mysql mysql -u alliance_user -p'alliance_pass' alliance_courtage < backup_local.sql
```

---

## 🔍 Vérification Post-Migration

### 1. Vérifier les Tables

```bash
docker exec -it alliance-courtage-mysql mysql -u alliance_user -p'alliance_pass' alliance_courtage

# Dans MySQL :
SHOW TABLES;
```

### 2. Vérifier les Données

```bash
# Compter les utilisateurs
docker exec alliance-courtage-mysql mysql -u alliance_user -p'alliance_pass' alliance_courtage -e "SELECT COUNT(*) as total_users FROM users;"

# Compter les partenaires
docker exec alliance-courtage-mysql mysql -u alliance_user -p'alliance_pass' alliance_courtage -e "SELECT COUNT(*) as total_partners FROM partners;"

# Vérifier quelques données
docker exec alliance-courtage-mysql mysql -u alliance_user -p'alliance_pass' alliance_courtage -e "SELECT * FROM users LIMIT 5;"
```

### 3. Tester l'Application

```bash
# Vérifier que l'API répond
curl http://localhost:3001/api/health

# Tester la connexion
# Aller sur http://VOTRE_IP
# Se connecter avec vos identifiants locaux
```

---

## 🎯 Script de Migration Simplifié

Créez `migrate-to-docker.sh` dans la racine :

```bash
#!/bin/bash
set -e

echo "🚀 Migration Base de Données Locale → Docker"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que le fichier de backup existe
if [ ! -f "backend/backup_local.sql" ]; then
    echo -e "${RED}❌ Fichier backup_local.sql non trouvé dans backend/${NC}"
    echo -e "${YELLOW}💡 Exportez d'abord votre base locale:${NC}"
    echo "   mysqldump -u root -p alliance_courtage > backend/backup_local.sql"
    exit 1
fi

echo -e "${YELLOW}📤 Fichier de backup trouvé${NC}"
echo ""

# Vérifier que Docker est démarré
cd backend
if ! docker ps | grep -q "alliance-courtage-mysql"; then
    echo -e "${YELLOW}🐳 Démarrage de Docker...${NC}"
    docker compose up -d
    echo -e "${YELLOW}⏳ Attente que MySQL soit prêt...${NC}"
    sleep 20
fi

echo -e "${YELLOW}📥 Import des données...${NC}"

# Lire le mot de passe root depuis docker-compose.yml
ROOT_PASSWORD=$(grep "MYSQL_ROOT_PASSWORD:" docker-compose.yml | awk '{print $2}' | tr -d '"')

# Importer
docker exec -i alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" < backup_local.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Import réussi !${NC}"
    echo ""
    echo -e "${GREEN}📊 Vérification...${NC}"
    docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" -e "USE alliance_courtage; SHOW TABLES;" 2>/dev/null
    echo ""
    echo -e "${GREEN}✅ Migration terminée avec succès !${NC}"
    echo ""
    echo "🌐 Testez l'application sur http://VOTRE_IP"
else
    echo -e "${RED}❌ Erreur lors de l'import${NC}"
    exit 1
fi
```

**Utilisation :**

```bash
# 1. Exporter localement (sur Windows)
cd backend
mysqldump -u root -p alliance_courtage > backup_local.sql

# 2. Copier le fichier vers le serveur

# 3. Exécuter le script sur le serveur
chmod +x migrate-to-docker.sh
./migrate-to-docker.sh
```

---

## ⚠️ Points Importants

### 1. Compatibilité des Versions MySQL

- Assurez-vous que la version MySQL locale est compatible avec MySQL 8.0 (Docker)
- Si vous avez MySQL 5.7 localement, l'export devrait fonctionner

### 2. Encodage des Caractères

Si vous avez des problèmes d'encodage :

```bash
# Export avec encodage UTF-8 explicite
mysqldump -u root -p --default-character-set=utf8mb4 alliance_courtage > backup_local.sql
```

### 3. Volumes Docker

Les données sont stockées dans le volume Docker `mysql_data`. Pour les conserver :

```bash
# Les données persistent même si vous arrêtez les containers
docker compose down
docker compose up -d  # Les données sont toujours là
```

### 4. Sauvegardes Régulières

Après migration, configurez des sauvegardes régulières :

```bash
# Backup depuis Docker
docker exec alliance-courtage-mysql mysqldump -u root -p'alliance2024' alliance_courtage > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Dépannage

### Problème : Erreur "Access denied"

```bash
# Vérifier les identifiants dans docker-compose.yml
cat backend/docker-compose.yml | grep MYSQL

# Utiliser le bon utilisateur et mot de passe
docker exec -i alliance-courtage-mysql mysql -u root -p'VOTRE_ROOT_PASSWORD' < backup_local.sql
```

### Problème : "Table already exists"

```bash
# Supprimer la base et recréer
docker exec alliance-courtage-mysql mysql -u root -p'alliance2024' -e "DROP DATABASE IF EXISTS alliance_courtage;"
docker exec alliance-courtage-mysql mysql -u root -p'alliance2024' -e "CREATE DATABASE alliance_courtage;"

# Réimporter
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024' < backup_local.sql
```

### Problème : "Incorrect string value"

```bash
# Exporter avec encodage UTF-8
mysqldump -u root -p --default-character-set=utf8mb4 alliance_courtage > backup_local.sql

# Réimporter
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024' --default-character-set=utf8mb4 < backup_local.sql
```

---

## ✅ Checklist Migration

- [ ] Base de données locale exportée (`backup_local.sql`)
- [ ] Fichier `backup_local.sql` copié sur le serveur
- [ ] Docker déployé (`./deploy.sh`)
- [ ] MySQL Docker prêt et accessible
- [ ] Données importées dans Docker
- [ ] Tables vérifiées (`SHOW TABLES`)
- [ ] Données vérifiées (comptage)
- [ ] Application testée (login, navigation)
- [ ] Uploads migrés (si nécessaire)

---

**🎉 Une fois terminé, vos données locales seront dans Docker !**

