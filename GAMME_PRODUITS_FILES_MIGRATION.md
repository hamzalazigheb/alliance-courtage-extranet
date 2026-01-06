# Migration des Fichiers Gamme Produits

## 📋 Vue d'ensemble

Ce document décrit la migration du système de fichiers pour **Gamme Produits** pour qu'il fonctionne comme **Produits Structurés** :
- Les fichiers sont maintenant stockés dans une table dédiée (`gamme_product_files`) au lieu du JSON CMS
- Upload via API avec FormData (comme Produits Structurés)
- Chargement des fichiers via API au lieu du JSON

## 🚀 Étapes de Migration

### 1. Créer la table `gamme_product_files`

Exécutez le script de création de table :

```bash
cd backend
node scripts/createGammeProductFilesTable.js
```

Ou exécutez directement le SQL :

```bash
mysql -u [user] -p [database] < backend/scripts/createGammeProductFilesTable.sql
```

### 2. Migrer les anciens fichiers du JSON vers la table

Exécutez le script de migration :

```bash
cd backend
node scripts/migrateGammeProductFiles.js
```

Ce script va :
- ✅ Extraire tous les fichiers base64 du JSON CMS
- ✅ Les insérer dans la table `gamme_product_files`
- ✅ Nettoyer le JSON CMS (supprimer le contenu base64, garder seulement les références)
- ✅ Afficher un résumé de la migration

### 3. Vérifier la migration

Vérifiez que les fichiers ont été migrés :

```sql
SELECT COUNT(*) as total_files FROM gamme_product_files;
SELECT product_key, COUNT(*) as file_count 
FROM gamme_product_files 
GROUP BY product_key;
```

## 📝 Changements Apportés

### Backend

1. **Nouvelle table** : `gamme_product_files`
   - Structure identique à `product_files`
   - Clé produit : `clientType_family_productName`

2. **Nouvelles routes API** dans `backend/routes/cms.js` :
   - `POST /api/cms/gamme-produits/files` - Upload fichiers
   - `GET /api/cms/gamme-produits/files/:productKey` - Liste des fichiers
   - `GET /api/cms/gamme-produits/files/:productKey/:fileId/download` - Télécharger
   - `DELETE /api/cms/gamme-produits/files/:productKey/:fileId` - Supprimer
   - `PUT /api/cms/gamme-produits/files/:productKey/:fileId` - Remplacer

### Frontend

1. **CMSManagementPage.tsx** :
   - Upload via FormData au lieu de base64 dans JSON
   - Utilise l'API `/cms/gamme-produits/files`

2. **GammeProduitsPage.tsx** :
   - Charge les fichiers via API au lieu du JSON
   - Composant `ProductFilesSection` pour afficher les fichiers

## 🔄 Format de la Clé Produit

La clé produit suit le format : `{clientType}_{family}_{productName}`

Exemples :
- `particulier_epargne_Assurance vie`
- `professionnel_retraite_PER`
- `entreprise_sante_Mutuelle santé collective`

## 📊 Structure de la Table

```sql
CREATE TABLE gamme_product_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_content LONGTEXT NOT NULL,  -- Base64
  file_size INT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_key (product_key)
);
```

## ✅ Avantages

1. **Performance** : Le JSON CMS est beaucoup plus léger (pas de base64)
2. **Cohérence** : Même système que Produits Structurés
3. **Scalabilité** : Pas de limite de taille pour le JSON CMS
4. **Gestion** : Suppression/remplacement de fichiers plus facile
5. **Sécurité** : Meilleure gestion des fichiers via API

## 🔧 Utilisation

### Upload de fichier (Admin)

1. Aller dans CMS → Gamme Produits
2. Sélectionner un produit
3. Cliquer sur "Ajouter un document"
4. Sélectionner le fichier
5. Le fichier est uploadé via API et stocké dans la table

### Affichage (Utilisateur)

Les fichiers sont automatiquement chargés depuis l'API lors de l'affichage de la page Gamme Produits.

## 🐛 Dépannage

### Les fichiers ne s'affichent pas

1. Vérifier que la table existe : `SHOW TABLES LIKE 'gamme_product_files';`
2. Vérifier que les fichiers sont dans la table : `SELECT * FROM gamme_product_files LIMIT 5;`
3. Vérifier la clé produit : doit correspondre au format `{clientType}_{family}_{productName}`

### Erreur lors de l'upload

1. Vérifier les logs backend
2. Vérifier que le fichier respecte les formats autorisés (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
3. Vérifier la taille maximale (5GB par défaut)

## 📝 Notes

- Les anciens fichiers dans le JSON continueront de fonctionner (rétrocompatibilité)
- Les nouveaux fichiers sont automatiquement stockés dans la table
- Le script de migration peut être exécuté plusieurs fois sans problème (ignore les doublons)

