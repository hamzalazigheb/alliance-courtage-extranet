# 🔑 Réinitialiser la Base de Données - Avec Mot de Passe

## 🔍 Méthode 1 : Trouver le Mot de Passe MySQL

```bash
# Vérifier dans docker-compose.yml
cat docker-compose.yml | grep -i MYSQL_ROOT_PASSWORD

# Vérifier les variables d'environnement du conteneur
docker exec alliance-courtage-mysql env | grep MYSQL

# Vérifier la configuration complète
docker inspect alliance-courtage-mysql | grep -A 10 Env
```

---

## 🔧 Méthode 2 : Backup avec Mot de Passe Interactif

```bash
# Utiliser -i pour mode interactif
docker exec -i alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql
# Entrer le mot de passe quand demandé
```

---

## 🔧 Méthode 3 : Utiliser la Variable d'Environnement

```bash
# Trouver le mot de passe
MYSQL_PASSWORD=$(docker exec alliance-courtage-mysql env | grep MYSQL_ROOT_PASSWORD | cut -d '=' -f2)
echo "Password found: $MYSQL_PASSWORD"

# Backup avec le mot de passe
docker exec alliance-courtage-mysql mysqldump -u root -p"$MYSQL_PASSWORD" alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🚀 Solution Complète (Méthode Recommandée)

```bash
# 1. Trouver le mot de passe
cat docker-compose.yml | grep MYSQL_ROOT_PASSWORD

# 2. Backup (remplacer PASSWORD par le mot de passe trouvé)
docker exec alliance-courtage-mysql mysqldump -u root -pPASSWORD alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# 3. Vérifier le backup
ls -lh ~/backups/backup_before_reset_*.sql
```

---

## 📋 Ensuite, Vider la Base de Données

```bash
# Créer le script SQL
cat > /tmp/reset_database.sql << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `favoris`;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reglementaire_documents;
TRUNCATE TABLE reglementaire_folders;
TRUNCATE TABLE password_reset_requests;
TRUNCATE TABLE financial_documents;
TRUNCATE TABLE formations;
TRUNCATE TABLE bordereaux;
TRUNCATE TABLE product_reservations;
TRUNCATE TABLE structured_products;
TRUNCATE TABLE assurances;
TRUNCATE TABLE cms_content;
TRUNCATE TABLE archives;
TRUNCATE TABLE partners;
TRUNCATE TABLE product_performances;
TRUNCATE TABLE financial_products;
TRUNCATE TABLE news;
TRUNCATE TABLE user_sessions;
DELETE FROM users WHERE role != 'admin';
SET FOREIGN_KEY_CHECKS = 1;
EOF

# Copier dans le conteneur
docker cp /tmp/reset_database.sql alliance-courtage-mysql:/tmp/reset_database.sql

# Exécuter (remplacer PASSWORD par le mot de passe)
docker exec -i alliance-courtage-mysql mysql -u root -pPASSWORD alliance_courtage < /tmp/reset_database.sql
```

---

## ✅ Alternative : Utiliser docker exec -it (Mode Interactif)

```bash
# Backup en mode interactif
docker exec -it alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# Puis vider la base
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage
```

Puis dans MySQL, exécuter :
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `favoris`;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reglementaire_documents;
TRUNCATE TABLE reglementaire_folders;
TRUNCATE TABLE password_reset_requests;
TRUNCATE TABLE financial_documents;
TRUNCATE TABLE formations;
TRUNCATE TABLE bordereaux;
TRUNCATE TABLE product_reservations;
TRUNCATE TABLE structured_products;
TRUNCATE TABLE assurances;
TRUNCATE TABLE cms_content;
TRUNCATE TABLE archives;
TRUNCATE TABLE partners;
TRUNCATE TABLE product_performances;
TRUNCATE TABLE financial_products;
TRUNCATE TABLE news;
TRUNCATE TABLE user_sessions;
DELETE FROM users WHERE role != 'admin';
SET FOREIGN_KEY_CHECKS = 1;
SELECT id, email, nom, prenom, role FROM users;
EXIT;
```

---

**Exécutez d'abord la commande pour trouver le mot de passe ! 🔍**


