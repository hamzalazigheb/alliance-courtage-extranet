# 🗑️ Réinitialiser la Base de Données pour le Client

## 🎯 Objectif

Vider toutes les données de la base de données et la réinitialiser avec uniquement l'utilisateur administrateur.

---

## ⚠️ ATTENTION

**Cette opération va SUPPRIMER TOUTES LES DONNÉES !**
- ✅ Faire un backup AVANT
- ✅ S'assurer que c'est ce que vous voulez faire

---

## 📋 Étapes

### Étape 1 : Backup (OBLIGATOIRE)

```bash
# Créer le répertoire de backup
mkdir -p ~/backups

# Backup de la base de données
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup a été créé
ls -lh ~/backups/backup_before_reset_*.sql
```

---

### Étape 2 : Vider la Base de Données

```bash
# Se connecter à MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage
```

Puis exécuter ces commandes SQL :

```sql
-- Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer toutes les données de toutes les tables
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

-- Supprimer tous les utilisateurs SAUF les admins
DELETE FROM users WHERE role != 'admin';

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Vérifier qu'il ne reste que l'admin
SELECT id, email, nom, prenom, role FROM users;

-- Quitter
EXIT;
```

---

### Étape 3 : Vérifier le Résultat

```bash
# Vérifier qu'il ne reste que l'admin
docker exec -it alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SELECT COUNT(*) as total_users, SUM(CASE WHEN role='admin' THEN 1 ELSE 0 END) as admins FROM users;"

# Vérifier les autres tables sont vides
docker exec -it alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SELECT 'favoris' as table_name, COUNT(*) as count FROM favoris UNION ALL SELECT 'notifications', COUNT(*) FROM notifications UNION ALL SELECT 'archives', COUNT(*) FROM archives;"
```

---

## ✅ Alternative : Utiliser le Script SQL

Créez un fichier SQL pour automatiser :

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

# Exécuter (entrer le mot de passe MySQL)
docker exec -i alliance-courtage-mysql mysql -u root -p alliance_courtage < /tmp/reset_database.sql
```

---

## 🔄 Alternative : Réinitialiser Complètement avec le Script freshDatabase.js

Si vous voulez une base de données complètement fraîche (comme une nouvelle installation) :

```bash
# Copier le script dans le conteneur backend
docker cp backend/scripts/freshDatabase.js alliance-courtage-backend:/app/scripts/freshDatabase.js

# Exécuter (modifier les credentials admin si nécessaire dans config.env)
docker exec -it alliance-courtage-backend node scripts/freshDatabase.js
```

**Note:** Cela va recréer toutes les tables. Assurez-vous que `config.env` dans le conteneur a les bonnes credentials admin.

---

## 📋 Informations Admin à Donner au Client

Après la réinitialisation, donnez au client :

- **URL du site:** `http://votre-domaine.com` ou `http://IP_du_serveur`
- **Email admin:** `admin@alliance-courtage.fr` (ou celui configuré)
- **Mot de passe admin:** `Admin123!` (ou celui configuré)
- **Instructions:** "Changez le mot de passe après la première connexion"

---

## ✅ Checklist

- [ ] Backup créé
- [ ] Base de données vidée
- [ ] Seul l'admin reste
- [ ] Vérification effectuée
- [ ] Informations admin préparées pour le client

---

**Exécutez l'Étape 1 (Backup) EN PREMIER ! 🚀**


