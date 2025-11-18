# 🚀 Guide de Déploiement des Nouvelles Fonctionnalités en Production

## 📋 Fonctionnalités à Déployer

1. ✅ Gestion des contacts partenaires (multi-contacts)
2. ✅ Gestion des documents partenaires (conventions, brochures)
3. ✅ Modification des partenaires
4. ✅ Affichage public amélioré (documents et contacts visibles)

---

## ⚠️ IMPORTANT : Protection des Données

**NE JAMAIS** :
- ❌ Exécuter `docker-compose down -v` (supprime les volumes)
- ❌ Exécuter `initDatabase.js` en production
- ❌ Supprimer les conteneurs MySQL

**TOUJOURS** :
- ✅ Faire un backup de la base de données avant toute opération
- ✅ Préserver les volumes Docker
- ✅ Tester sur un environnement de staging si possible

---

## 📦 Étape 1 : Préparation sur le Serveur

### 1.1 Se connecter au serveur

```bash
ssh ubuntu@votre-serveur
cd ~/alliance/alliance
```

### 1.2 Vérifier l'état actuel

```bash
# Vérifier les conteneurs en cours d'exécution
docker ps

# Vérifier les tables existantes
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;"
```

### 1.3 Backup de la base de données (OBLIGATOIRE)

```bash
# Créer un dossier pour les backups
mkdir -p ~/backups

# Créer le backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec alliance-courtage-mysql mysqldump -u root -palliance2024Secure alliance_courtage > ~/backups/backup_before_new_features_$TIMESTAMP.sql

# Vérifier que le backup a été créé
ls -lh ~/backups/backup_before_new_features_*.sql
```

---

## 🗄️ Étape 2 : Création des Nouvelles Tables

### 2.1 Créer la table `partner_contacts`

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS partner_contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  fonction VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
```

### 2.2 Créer la table `partner_documents`

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS partner_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT 'Titre du document',
  description TEXT COMMENT 'Description optionnelle',
  file_path VARCHAR(500) COMMENT 'Chemin du fichier (ancien système)',
  file_content LONGTEXT COMMENT 'Contenu du fichier en base64',
  file_size BIGINT COMMENT 'Taille du fichier en octets',
  file_type VARCHAR(100) COMMENT 'Type MIME du fichier',
  document_type VARCHAR(100) COMMENT 'Type de document: convention, brochure, autre',
  uploaded_by INT COMMENT 'ID utilisateur qui a uploade',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_partner_id (partner_id),
  INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF
```

### 2.3 Vérifier que les tables ont été créées

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep partner
```

Vous devriez voir :
- `partners`
- `partner_contacts` ✅ (nouveau)
- `partner_documents` ✅ (nouveau)

---

## 📥 Étape 3 : Récupérer le Code Mis à Jour

### 3.1 Si vous utilisez Git

```bash
cd ~/alliance/alliance
git pull origin main
```

### 3.2 Si vous n'utilisez pas Git

Copiez manuellement ces fichiers depuis votre machine locale vers le serveur :

**Fichiers Backend à copier :**
- `backend/routes/partners.js` (avec les nouvelles routes pour contacts et documents)
- `backend/services/emailService.js` (améliorations)

**Fichiers Frontend à copier :**
- `src/PartnerManagementPage.tsx` (gestion contacts/documents/modification)
- `src/pages/PartenairesPage.tsx` (affichage public amélioré)
- `src/types.ts` (nouvelles interfaces PartnerContact, PartnerDocument)

Vous pouvez utiliser `scp` depuis votre machine locale :

```bash
# Depuis votre machine locale
scp backend/routes/partners.js ubuntu@votre-serveur:~/alliance/alliance/backend/routes/
scp src/PartnerManagementPage.tsx ubuntu@votre-serveur:~/alliance/alliance/src/
scp src/pages/PartenairesPage.tsx ubuntu@votre-serveur:~/alliance/alliance/src/pages/
scp src/types.ts ubuntu@votre-serveur:~/alliance/alliance/src/
```

---

## 🏗️ Étape 4 : Reconstruire et Redéployer

### 4.1 Arrêter le backend (sans supprimer)

```bash
cd ~/alliance/alliance/backend
docker stop alliance-courtage-backend 2>/dev/null || true
```

### 4.2 Reconstruire l'image backend (SANS CACHE)

```bash
# Utiliser docker compose (sans tiret) ou docker build
docker compose build --no-cache backend

# OU si docker compose n'est pas disponible :
docker build -t alliance-courtage-backend:latest --no-cache .
```

### 4.3 Reconstruire l'image frontend (SANS CACHE)

```bash
cd ~/alliance/alliance
docker build -t alliance-courtage-frontend:latest --no-cache .
```

### 4.4 Redémarrer les conteneurs

```bash
# Backend
cd ~/alliance/alliance/backend

# Si vous utilisez docker compose
docker compose up -d backend

# OU créer manuellement le conteneur backend
docker run -d \
  --name alliance-courtage-backend \
  --restart unless-stopped \
  --network alliance-network \
  -p 3001:3001 \
  --env-file config.env \
  -e NODE_ENV=production \
  -e DB_HOST=alliance-courtage-mysql \
  -e DB_PORT=3306 \
  -e DB_NAME=alliance_courtage \
  -e DB_USER=root \
  -e DB_PASSWORD=alliance2024Secure \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/config.env:/app/config.env:ro \
  alliance-courtage-backend:latest

# Frontend
cd ~/alliance/alliance
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

---

## ✅ Étape 5 : Vérification

### 5.1 Vérifier que les conteneurs sont en cours d'exécution

```bash
docker ps
```

Vous devriez voir :
- `alliance-courtage-backend` ✅
- `alliance-courtage-frontend` ✅ (ou `alliance-courtage-extranet`)
- `alliance-courtage-mysql` ✅

### 5.2 Vérifier les logs du backend

```bash
docker logs alliance-courtage-backend --tail 50
```

Recherchez :
- ✅ Pas d'erreurs de connexion à la base de données
- ✅ Serveur démarré sur le port 3001
- ✅ Configuration SMTP chargée

### 5.3 Tester l'API

```bash
# Tester l'endpoint de santé
curl http://localhost:3001/api/health

# Tester la récupération des partenaires (avec contacts et documents)
curl http://localhost:3001/api/partners?active=false
```

### 5.4 Tester l'interface web

1. Ouvrir `http://votre-serveur` dans un navigateur
2. Se connecter en tant qu'administrateur
3. Aller dans "Gestion" → "Partenaires"
4. Vérifier :
   - ✅ Bouton "Modifier" sur chaque partenaire
   - ✅ Bouton "👤 Gérer Contacts" sur chaque partenaire
   - ✅ Bouton "📄 Gérer Documents" sur chaque partenaire

### 5.5 Tester la page publique

1. Aller sur la page "Partenaires" (sans être connecté)
2. Vérifier :
   - ✅ Les documents sont visibles sur les cartes partenaires
   - ✅ Section "Conventions de Distribution et Documents" existe
   - ✅ Les contacts sont visibles sur les cartes partenaires
   - ✅ Section "Contacts Partenaires" existe

---

## 🧪 Étape 6 : Tests Fonctionnels

### 6.1 Tester l'ajout d'un contact

```bash
# Via l'interface web :
# 1. Aller dans Gestion → Partenaires
# 2. Cliquer sur "👤 Gérer Contacts" sur un partenaire
# 3. Cliquer sur "Ajouter un Contact"
# 4. Remplir le formulaire :
#    - Fonction: "Inspecteur"
#    - Nom: "Dupont"
#    - Prénom: "Jean"
#    - Email: "jean.dupont@example.com"
#    - Téléphone: "0123456789"
# 5. Sauvegarder
# 6. Vérifier que le contact apparaît dans la liste
```

### 6.2 Tester l'upload d'un document

```bash
# Via l'interface web :
# 1. Aller dans Gestion → Partenaires
# 2. Cliquer sur "📄 Gérer Documents" sur un partenaire
# 3. Cliquer sur "Ajouter un Document"
# 4. Remplir le formulaire :
#    - Titre: "Convention de Distribution 2024"
#    - Description: "Convention annuelle"
#    - Type: "convention"
#    - Fichier: Sélectionner un PDF
# 5. Uploader
# 6. Vérifier que le document apparaît dans la liste
```

### 6.3 Tester la modification d'un partenaire

```bash
# Via l'interface web :
# 1. Aller dans Gestion → Partenaires
# 2. Cliquer sur "✏️ Modifier" sur un partenaire
# 3. Modifier quelques champs (ex: description)
# 4. Sauvegarder
# 5. Vérifier que les modifications sont enregistrées
```

### 6.4 Tester l'affichage public

```bash
# 1. Se déconnecter (ou ouvrir en navigation privée)
# 2. Aller sur la page "Partenaires"
# 3. Vérifier :
#    - Les documents sont visibles et téléchargeables
#    - Les contacts sont visibles avec toutes les infos
#    - Les sections dédiées fonctionnent
```

---

## 🔧 Étape 7 : Résolution de Problèmes

### Problème : Les tables n'existent pas

```bash
# Vérifier
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep partner

# Si les tables n'existent pas, réexécuter les commandes de l'Étape 2
```

### Problème : Erreur 404 sur les nouvelles routes API

```bash
# Vérifier que le fichier partners.js est bien à jour
cat backend/routes/partners.js | grep "partner_contacts"

# Vérifier les logs du backend
docker logs alliance-courtage-backend --tail 100 | grep -i error
```

### Problème : Les documents/contacts ne s'affichent pas

```bash
# Vérifier que l'API retourne bien les données
curl http://localhost:3001/api/partners?active=false | jq '.[0] | {nom, contacts, documents}'

# Vérifier la console du navigateur (F12) pour les erreurs JavaScript
```

### Problème : Le frontend ne se met pas à jour

```bash
# Vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
# Ou vérifier que l'image frontend a bien été reconstruite
docker images | grep alliance-courtage-frontend
```

---

## 📊 Étape 8 : Vérification Finale

### Checklist de déploiement

- [ ] Backup de la base de données créé
- [ ] Tables `partner_contacts` et `partner_documents` créées
- [ ] Code mis à jour sur le serveur
- [ ] Images Docker reconstruites (sans cache)
- [ ] Conteneurs redémarrés
- [ ] Backend fonctionne (logs OK, API répond)
- [ ] Frontend fonctionne (page charge)
- [ ] Interface admin : Bouton "Modifier" fonctionne
- [ ] Interface admin : Gestion des contacts fonctionne
- [ ] Interface admin : Gestion des documents fonctionne
- [ ] Page publique : Documents visibles et téléchargeables
- [ ] Page publique : Contacts visibles
- [ ] Tests fonctionnels réussis

---

## 🎉 Étape 9 : Confirmation

Une fois tous les tests réussis, les nouvelles fonctionnalités sont déployées en production !

### Fonctionnalités maintenant disponibles :

1. ✅ **Gestion des contacts partenaires** - Ajouter plusieurs contacts par partenaire
2. ✅ **Gestion des documents partenaires** - Upload et gestion de conventions, brochures, etc.
3. ✅ **Modification des partenaires** - Modifier tous les champs d'un partenaire
4. ✅ **Affichage public amélioré** - Documents et contacts visibles sur la page publique

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `docker logs alliance-courtage-backend --tail 100`
2. Vérifier les tables : `docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;"`
3. Restaurer le backup si nécessaire : `docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < ~/backups/backup_before_new_features_*.sql`

---

**Dernière mise à jour** : Novembre 2024


