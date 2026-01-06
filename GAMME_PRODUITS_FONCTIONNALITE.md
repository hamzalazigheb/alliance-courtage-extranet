# 📦 Fonctionnalité : Gamme Produits

## 📋 Vue d'ensemble

La fonctionnalité **Gamme Produits** permet de gérer un catalogue de produits organisés par type de client et par famille de produits. Chaque produit peut avoir des documents associés qui sont automatiquement disponibles dans toutes les familles où le produit existe.

## 🏗️ Structure des Données

### Organisation hiérarchique

```
Gamme Produits
├── Type de Client
│   ├── Particulier 👤
│   ├── Professionnel 💼
│   └── Entreprise 🏢
└── Famille de Produits
    ├── Épargne
    ├── Retraite
    ├── Prévoyance
    ├── Santé
    └── CIF (Conseil en investissement financier)
```

### Structure JSON CMS

Les produits sont stockés dans le CMS avec la structure suivante :

```json
{
  "products": {
    "particulier": {
      "epargne": [
        {
          "name": "Assurance vie",
          "description": "Solution adaptée aux besoins spécifiques"
        }
      ],
      "retraite": [...],
      "prevoyance": [...],
      "sante": [...],
      "cif": [...]
    },
    "professionnel": { ... },
    "entreprise": { ... }
  }
}
```

### Structure Base de Données

#### Table `gamme_product_files`
Les fichiers sont stockés dans une table dédiée (comme Produits Structurés) :

```sql
CREATE TABLE gamme_product_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_key VARCHAR(255) NOT NULL,  -- Format: clientType_family_productName
  file_name VARCHAR(500) NOT NULL,
  file_content LONGTEXT NOT NULL,     -- Base64
  file_size INT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_key (product_key)
);
```

**Format de la clé produit** : `{clientType}_{family}_{productName}`
- Exemple : `particulier_epargne_Assurance vie`
- Exemple : `professionnel_retraite_PER`

## 🎯 Fonctionnalités Principales

### 1. Gestion des Produits (CMS Admin)

#### Ajouter un Produit
1. **Accès** : CMS → Gamme Produits
2. **Sélection** :
   - Choisir le type de client (Particulier, Professionnel, Entreprise)
   - Choisir la famille de produit (Épargne, Retraite, etc.)
3. **Création** :
   - Cliquer sur "+ Ajouter un produit"
   - Saisir le nom du produit
   - Ajouter une description (optionnel)
   - Sauvegarder

#### Modifier un Produit
- Cliquer sur le nom du produit pour le modifier
- Modifier la description
- Les modifications sont sauvegardées automatiquement

#### Supprimer un Produit
- Cliquer sur le bouton de suppression
- Confirmation requise

### 2. Gestion des Documents (CMS Admin)

#### Upload de Documents
1. **Sélectionner un produit** dans la liste
2. **Cliquer sur "Gérer les documents"**
3. **Modal d'upload** :
   - Titre du document (optionnel)
   - Sélectionner le fichier (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)
   - Taille max : 5GB par fichier
4. **Upload automatique** :
   - Le fichier est uploadé via API
   - **Duplication automatique** : Le fichier est automatiquement dupliqué dans **toutes les familles** où le produit existe
   - Stockage dans la table `gamme_product_files`

#### Fonctionnalité Multi-Familles ⭐
**Fonctionnalité clé** : Quand un document est uploadé pour un produit, il est automatiquement disponible dans **toutes les familles** où ce produit existe.

**Exemple** :
- Produit "Assurance vie" existe dans :
  - `particulier_epargne_Assurance vie`
  - `particulier_retraite_Assurance vie`
- Upload d'un document "Notice produit.pdf"
- Résultat : Le document est disponible dans les deux familles (épargne ET retraite)

#### Supprimer un Document
- Dans le modal de gestion des documents
- Cliquer sur le bouton de suppression
- Le document est supprimé dans **toutes les familles** où il existe

#### Remplacer un Document
- Utiliser la fonction de remplacement
- Le nouveau fichier remplace l'ancien dans **toutes les familles**

### 3. Affichage Utilisateur

#### Page Gamme Produits (`/gamme-produits`)

**Interface** :
1. **Sélection du type de client** :
   - 3 boutons : Particulier, Professionnel, Entreprise
   - Affichage visuel avec icônes

2. **Sélection de la famille** :
   - 5 boutons : Épargne, Retraite, Prévoyance, Santé, CIF
   - Affichage dynamique selon le type de client sélectionné

3. **Grille de produits** :
   - Affichage en grille (2 colonnes sur desktop)
   - Chaque carte produit contient :
     - **Nom du produit**
     - **Description**
     - **Section Documents** (si disponibles) :
       - Liste des documents associés
       - Chargement automatique via API
       - Bouton de téléchargement pour chaque document
       - Affichage du type de fichier et taille

#### Chargement des Documents
- Les documents sont chargés automatiquement via API
- La route API cherche dans **toutes les familles** du même produit
- Déduplication automatique (évite les doublons)
- Filtrage des fichiers vides (file_size > 0)

## 🔄 Flux de Données

### Upload de Document

```
Admin (CMS)
  ↓
Sélection produit + Upload fichier
  ↓
POST /api/cms/gamme-produits/files
  ↓
Backend:
  1. Détecte les familles où le produit existe
  2. Duplique le fichier dans toutes ces familles
  3. Stocke dans gamme_product_files
  ↓
Réponse : Nombre de familles où le fichier a été uploadé
```

### Affichage des Documents

```
Utilisateur (Page Gamme Produits)
  ↓
Sélection type client + famille
  ↓
Affichage produits
  ↓
Pour chaque produit :
  GET /api/cms/gamme-produits/files/{clientType}_{family}_{productName}
  ↓
Backend:
  1. Parse la clé produit
  2. Cherche dans TOUTES les familles du même produit
  3. Déduplique les résultats
  4. Retourne la liste unique
  ↓
Affichage des documents dans l'interface
```

## 📡 API Endpoints

### GET `/api/cms/gamme-produits/files/:productKey`
**Description** : Récupère tous les fichiers d'un produit (cherche dans toutes les familles)

**Paramètres** :
- `productKey` : Format `{clientType}_{family}_{productName}` (ex: `particulier_epargne_Assurance vie`)

**Comportement** :
- Parse la clé pour extraire `clientType` et `productName`
- Cherche dans toutes les familles : epargne, retraite, prevoyance, sante, cif
- Déduplique les résultats par nom et taille
- Filtre les fichiers vides (file_size > 0)

**Réponse** :
```json
[
  {
    "id": 1,
    "file_name": "Notice produit.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "display_order": 0,
    "created_at": "2025-01-15T10:00:00Z",
    "product_key": "particulier_epargne_Assurance vie"
  }
]
```

### POST `/api/cms/gamme-produits/files`
**Description** : Upload un fichier pour un produit (duplique dans toutes les familles)

**Body (FormData)** :
- `files` : Fichier(s) à uploader
- `productKey` : Clé produit (format: `{clientType}_{family}_{productName}`)
- `clientType` : Type de client (particulier, professionnel, entreprise)
- `productName` : Nom du produit

**Comportement** :
1. Parse la clé produit
2. Charge le contenu CMS pour trouver toutes les familles où le produit existe
3. Pour chaque famille trouvée :
   - Vérifie si le fichier existe déjà
   - Si non, insère le fichier dans la table
4. Retourne le nombre de familles où le fichier a été uploadé

**Réponse** :
```json
{
  "message": "2 fichier(s) uploadé(s) avec succès dans 3 famille(s)",
  "files": [...],
  "families": ["epargne", "retraite", "prevoyance"]
}
```

### GET `/api/cms/gamme-produits/files/:productKey/:fileId/download`
**Description** : Télécharge un fichier spécifique

**Comportement** :
- Cherche le fichier par ID uniquement (indépendamment de la famille)
- Retourne le contenu en base64 décodé

### DELETE `/api/cms/gamme-produits/files/:productKey/:fileId`
**Description** : Supprime un fichier (dans toutes les familles)

**Comportement** :
- Parse la clé produit
- Supprime le fichier dans toutes les familles où il existe
- Retourne le nombre d'occurrences supprimées

### PUT `/api/cms/gamme-produits/files/:productKey/:fileId`
**Description** : Remplace un fichier (dans toutes les familles)

**Comportement** :
- Parse la clé produit
- Remplace le fichier dans toutes les familles où il existe
- Retourne le nombre d'occurrences mises à jour

## ✨ Fonctionnalités Avancées

### 1. Multi-Familles Automatique ⭐

**Problème résolu** : Avant, un document uploadé dans une famille n'était visible que dans cette famille.

**Solution** : 
- Upload automatique dans toutes les familles où le produit existe
- Affichage automatique depuis toutes les familles lors de la consultation

**Exemple concret** :
- Produit "Assurance vie" existe dans :
  - Particulier → Épargne
  - Particulier → Retraite
- Upload "Notice.pdf" depuis la famille Épargne
- Résultat : Le document est visible dans Épargne ET Retraite

### 2. Déduplication Intelligente

Lors de l'affichage, les fichiers sont dédupliqués pour éviter d'afficher plusieurs fois le même fichier :
- Critère de déduplication : `file_name + file_size`
- Un fichier identique uploadé dans plusieurs familles n'apparaît qu'une seule fois

### 3. Filtrage des Fichiers Vides

- Les fichiers avec `file_size = 0` sont automatiquement ignorés
- Seuls les fichiers avec du contenu sont affichés

### 4. Gestion Multi-Clients

- Un produit peut être ajouté pour plusieurs types de clients
- Les documents sont gérés indépendamment par type de client
- Format de clé : `{clientType}_{family}_{productName}`

## 🎨 Interface Utilisateur

### Page CMS (Admin)

**Sections** :
1. **Sélection des filtres** :
   - Type de client (Particulier, Professionnel, Entreprise)
   - Famille de produit (Épargne, Retraite, etc.)

2. **Liste des produits** :
   - Affichage par famille
   - Actions : Modifier, Supprimer, Gérer documents

3. **Modal de gestion des documents** :
   - Liste des documents existants
   - Formulaire d'upload
   - Actions : Télécharger, Supprimer

### Page Publique (Utilisateur)

**Sections** :
1. **Sélection type de client** : 3 boutons avec icônes
2. **Sélection famille** : 5 boutons dynamiques
3. **Grille de produits** :
   - Carte produit avec nom et description
   - Section documents (chargement automatique)
   - Boutons de téléchargement

## 📊 Statistiques et Métriques

### Données Stockées
- **Produits** : Stockés dans JSON CMS (table `cms_content`)
- **Documents** : Stockés dans table `gamme_product_files` (base64)
- **Taille max fichier** : 5GB
- **Formats acceptés** : PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX

### Performance
- **Chargement** : Les fichiers sont chargés à la demande (lazy loading)
- **Déduplication** : Effectuée côté serveur pour optimiser les requêtes
- **Cache** : Le contenu CMS peut être mis en cache

## 🔧 Maintenance

### Migration des Anciens Fichiers

Script disponible : `backend/scripts/migrateGammeProductFiles.js`

**Fonction** :
- Migre les fichiers base64 du JSON CMS vers la table `gamme_product_files`
- Nettoie le JSON CMS (supprime le contenu base64)
- Préserve les références pour compatibilité

### Nettoyage

Pour supprimer les fichiers vides (0 bytes) :
```sql
DELETE FROM gamme_product_files WHERE file_size = 0;
```

## 🆚 Comparaison avec Produits Structurés

| Caractéristique | Gamme Produits | Produits Structurés |
|-----------------|----------------|---------------------|
| **Organisation** | Par type client + famille | Par assurance |
| **Documents** | Multi-familles automatique | Par produit/assurance |
| **Réservations** | ❌ Non | ✅ Oui |
| **Montants** | ❌ Non | ✅ Oui |
| **Stockage fichiers** | Table `gamme_product_files` | Table `product_files` |
| **Format identique** | ✅ Oui | ✅ Oui |

## 🚀 Cas d'Usage

### Cas 1 : Produit Multi-Familles
**Scénario** : "Assurance vie" existe dans Épargne et Retraite

**Workflow** :
1. Admin upload "Notice.pdf" depuis la famille Épargne
2. Le système détecte que le produit existe aussi en Retraite
3. Le fichier est automatiquement dupliqué dans les deux familles
4. Utilisateur voit le document dans Épargne ET Retraite

### Cas 2 : Ajout de Famille
**Scénario** : Un produit existe dans Épargne, on l'ajoute aussi en Retraite

**Workflow** :
1. Admin ajoute le produit dans la famille Retraite
2. Les documents existants (depuis Épargne) sont automatiquement visibles
3. Pas besoin de re-uploader les documents

### Cas 3 : Suppression de Document
**Scénario** : Supprimer un document obsolète

**Workflow** :
1. Admin supprime le document depuis n'importe quelle famille
2. Le système supprime automatiquement dans toutes les familles
3. Le document disparaît partout

## 📝 Notes Techniques

1. **Encodage URL** : Les clés produit sont encodées/décodées pour gérer les caractères spéciaux
2. **Base64** : Les fichiers sont stockés en base64 dans la base de données
3. **Déduplication** : Basée sur `file_name + file_size` pour garantir l'unicité
4. **Performance** : Requêtes optimisées avec index sur `product_key`
5. **Compatibilité** : Les anciens fichiers dans le JSON continuent de fonctionner (rétrocompatibilité)

## 🔮 Améliorations Futures Possibles

- [ ] Recherche de produits
- [ ] Filtres avancés (par type, famille, etc.)
- [ ] Statistiques d'utilisation des documents
- [ ] Versioning des documents
- [ ] Prévisualisation des fichiers dans le navigateur
- [ ] Export des produits en PDF/Excel
- [ ] Historique des modifications

---

## 📞 Support

Pour toute question ou problème :
1. Vérifier les logs backend pour les erreurs
2. Vérifier que la table `gamme_product_files` existe
3. Vérifier les permissions admin pour l'upload
4. Vérifier les formats de fichiers acceptés

