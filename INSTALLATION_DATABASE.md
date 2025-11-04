# 📦 Guide d'Installation de la Base de Données

Ce guide explique comment installer une base de données fraîche pour Alliance Courtage Extranet.

## 🎯 Objectif

Créer une base de données propre avec :
- ✅ Toutes les tables nécessaires
- ✅ Uniquement l'utilisateur administrateur
- ✅ Aucune donnée de test

---

## 🚀 Méthode 1 : Script Node.js (Recommandé)

### Prérequis
- Node.js installé
- MySQL/MariaDB démarré
- Accès à la base de données MySQL

### Étapes

1. **Configurer les credentials dans `backend/config.env`:**
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=alliance_courtage
   
   # Credentials Admin (optionnel, peut être modifié)
   ADMIN_EMAIL=admin@alliance-courtage.fr
   ADMIN_PASSWORD=Admin123!
   ADMIN_NOM=Admin
   ADMIN_PRENOM=Alliance
   ```

2. **Installer les dépendances (si pas déjà fait):**
   ```bash
   cd backend
   npm install
   ```

3. **Exécuter le script d'installation:**
   ```bash
   node scripts/freshDatabase.js
   ```

4. **Le script va:**
   - ✅ Créer la base de données
   - ✅ Supprimer toutes les tables existantes (si nécessaire)
   - ✅ Créer toutes les tables nécessaires
   - ✅ Créer l'utilisateur administrateur
   - ✅ Afficher les informations de connexion

### Résultat

Vous verrez un message comme :
```
🎉 Base de données installée avec succès !

📋 Informations de connexion Admin:
   📧 Email: admin@alliance-courtage.fr
   🔑 Mot de passe: Admin123!
   👤 Nom: Alliance Admin
   🎭 Rôle: Admin
```

---

## 🗄️ Méthode 2 : Script SQL Direct

### Prérequis
- Accès MySQL/MariaDB
- Client MySQL (mysql, phpMyAdmin, etc.)

### Étapes

1. **Ouvrir MySQL:**
   ```bash
   mysql -u root -p
   ```

2. **Exécuter le script SQL:**
   ```bash
   source backend/scripts/installDatabase.sql
   ```
   
   Ou via phpMyAdmin:
   - Importer le fichier `backend/scripts/installDatabase.sql`
   - Exécuter

3. **Vérifier l'installation:**
   ```sql
   USE alliance_courtage;
   SELECT * FROM users;
   ```

### Résultat

Vous devriez voir un seul utilisateur (l'admin) dans la table `users`.

---

## 📝 Personnalisation des Credentials Admin

### Option 1 : Via fichier config.env

Éditez `backend/config.env` avant d'exécuter le script:
```env
ADMIN_EMAIL=votre-email@example.com
ADMIN_PASSWORD=VotreMotDePasseSecurise
ADMIN_NOM=VotreNom
ADMIN_PRENOM=VotrePrenom
```

### Option 2 : Via ligne de commande

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=MonMotDePasse node scripts/freshDatabase.js
```

### Option 3 : Générer un hash bcrypt personnalisé

Pour utiliser un mot de passe personnalisé dans le script SQL:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('VotreMotDePasse', 10).then(h => console.log(h));"
```

Puis remplacez le hash dans `installDatabase.sql` à la ligne d'INSERT.

---

## ✅ Vérification

Après l'installation, vérifiez que:

1. **La base de données existe:**
   ```sql
   SHOW DATABASES LIKE 'alliance_courtage';
   ```

2. **Toutes les tables sont créées:**
   ```sql
   USE alliance_courtage;
   SHOW TABLES;
   ```
   
   Vous devriez voir environ 18 tables.

3. **L'admin existe:**
   ```sql
   SELECT id, email, nom, prenom, role FROM users;
   ```
   
   Vous devriez voir un seul utilisateur avec `role = 'admin'`.

4. **Tester la connexion:**
   - Démarrer le serveur backend
   - Se connecter avec les credentials admin
   - Vérifier que vous avez accès au CMS

---

## 🔧 Dépannage

### Erreur: "Access denied"
- Vérifiez les credentials dans `config.env`
- Vérifiez que MySQL est démarré
- Vérifiez que l'utilisateur MySQL a les permissions

### Erreur: "Database already exists"
- Le script supprime automatiquement les tables existantes
- Si vous voulez une installation complètement fraîche, supprimez la base manuellement:
  ```sql
  DROP DATABASE IF EXISTS alliance_courtage;
  ```

### Erreur: "Module bcryptjs not found"
```bash
cd backend
npm install bcryptjs
```

### Erreur: "Foreign key constraint fails"
- Le script désactive temporairement les foreign keys
- Si le problème persiste, vérifiez l'ordre de création des tables

---

## 📋 Liste des Tables Créées

1. ✅ `users` - Utilisateurs
2. ✅ `news` - Actualités
3. ✅ `financial_products` - Produits financiers
4. ✅ `product_performances` - Performances
5. ✅ `partners` - Partenaires
6. ✅ `archives` - Archives
7. ✅ `simulators` - Simulateurs
8. ✅ `user_sessions` - Sessions utilisateur
9. ✅ `cms_content` - Contenu CMS
10. ✅ `structured_products` - Produits structurés
11. ✅ `product_reservations` - Réservations
12. ✅ `assurances` - Assurances
13. ✅ `bordereaux` - Bordereaux
14. ✅ `formations` - Formations
15. ✅ `financial_documents` - Documents financiers
16. ✅ `password_reset_requests` - Demandes reset
17. ✅ `reglementaire_folders` - Dossiers réglementaires
18. ✅ `reglementaire_documents` - Documents réglementaires
19. ✅ `notifications` - Notifications
20. ✅ `favoris` - Favoris

---

## 🔐 Sécurité

⚠️ **IMPORTANT:**

1. **Changez le mot de passe admin** après la première connexion
2. **Ne partagez pas** les credentials admin
3. **Utilisez un mot de passe fort** (minimum 12 caractères, majuscules, minuscules, chiffres, symboles)
4. **Sauvegardez régulièrement** la base de données

---

## 📞 Support

En cas de problème:
1. Vérifiez les logs du script
2. Vérifiez les permissions MySQL
3. Consultez les erreurs dans la console
4. Vérifiez que toutes les dépendances sont installées

---

**Bon déploiement ! 🚀**

