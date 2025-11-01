# 📊 Page Produits Structurés - Architecture & Fonctionnalités

## 🎯 Vue d'Ensemble

La page **Produits Structurés** (`http://localhost:5173/#produits-structures`) permet aux utilisateurs de consulter, filtrer et télécharger des produits structurés organisés par compagnie d'assurance.

---

## 🔄 Flux Complet : Upload → Consultation

### 1️⃣ **Upload des Produits (Dashboard Admin)**

**📍 Accès :** Dashboard Admin `/manage` ou `StructuredProductsDashboard`

#### Processus d'Upload

```typescript
// Formulaire d'upload avec validation
const handleFileUpload = async (e: React.FormEvent) => {
  const formData = new FormData();
  formData.append('file', uploadForm.file);
  formData.append('title', uploadForm.title);
  formData.append('description', uploadForm.description);
  formData.append('assurance', uploadForm.assurance);
  formData.append('category', uploadForm.category);
  
  // Envoi vers l'API backend avec authentification
  const response = await fetch('http://localhost:3001/api/structured-products', {
    method: 'POST',
    headers: {
      'x-auth-token': localStorage.getItem('token') || ''
    },
    body: formData
  });
};
```

#### Données Requises pour l'Upload

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| **title** | String | ✅ Oui | Nom du produit structuré |
| **description** | String | ❌ Non | Description détaillée |
| **assurance** | String | ✅ Oui | Compagnie d'assurance (SwissLife, CARDIF, etc.) |
| **category** | String | ✅ Oui | Catégorie (Épargne, Retraite, Prévoyance, etc.) |
| **file** | File | ✅ Oui | Document du produit (PDF, DOC, XLS, PPT) |

#### Types de Fichiers Acceptés

- **Documents** : `.pdf`, `.doc`, `.docx`
- **Tableurs** : `.xls`, `.xlsx`
- **Présentations** : `.ppt`, `.pptx`
- **Taille maximale** : 10 MB par fichier

---

### 2️⃣ **Stockage Backend**

#### Architecture de Stockage

```
backend/
└── uploads/
    └── structured-products/
        ├── product_SwissLife_1234567890-987654321.pdf
        ├── product_CARDIF_1234567891-123456789.xlsx
        └── product_AbeilleAssurances_1234567892-456789123.pdf
```

#### Configuration Multer

```javascript
// Configuration de stockage avec nom unique
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const structuredProductsPath = path.join(uploadPath, 'structured-products');
    if (!fs.existsSync(structuredProductsPath)) {
      fs.mkdirSync(structuredProductsPath, { recursive: true });
    }
    cb(null, structuredProductsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeAssurance = assurance.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `product_${safeAssurance}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
```

#### Format du Nom de Fichier

```
product_[ASSURANCE]_[TIMESTAMP]-[RANDOM].[EXTENSION]

Exemples:
- product_SwissLife_1762001234567-987654321.pdf
- product_CARDIF_1762001234568-123456789.xlsx
```

#### Base de Données (Table `archives`)

```sql
-- Structure de la table archives utilisée pour les produits structurés
CREATE TABLE archives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  category VARCHAR(100),
  assurance VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
```

#### Enregistrement en Base

```javascript
// Insertion dans la base de données
const result = await query(
  `INSERT INTO archives 
   (title, description, file_path, file_size, file_type, category, assurance, uploaded_by) 
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    title,
    description,
    req.file.path,        // Chemin relatif: uploads/structured-products/...
    req.file.size,        // Taille en bytes
    req.file.mimetype,    // Type MIME: application/pdf, etc.
    category,
    assurance,
    req.user.id           // ID de l'utilisateur qui a uploadé
  ]
);
```

---

### 3️⃣ **Récupération et Affichage (Page Utilisateur)**

#### API de Récupération

```javascript
// GET /api/structured-products
// Filtres disponibles : assurance, category, search

const loadProducts = async () => {
  const params: any = {};
  if (selectedAssurance) params.assurance = selectedAssurance;
  
  const response = await structuredProductsAPI.getAll(params);
  setProducts(response);
};
```

#### Requête SQL Backend

```sql
SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
FROM archives a
LEFT JOIN users u ON a.uploaded_by = u.id
WHERE a.category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
  AND a.assurance = ?  -- Si filtre appliqué
ORDER BY a.created_at DESC;
```

#### Groupement par Assurance

```typescript
// Groupement automatique des produits par assurance
const groupedProducts = products.reduce((acc, product) => {
  (acc[product.assurance] = acc[product.assurance] || []).push(product);
  return acc;
}, {} as Record<string, StructuredProduct[]>);
```

---

## 🎨 Interface Utilisateur

### Structure de la Page

```
┌─────────────────────────────────────────────────────────┐
│  Header avec Statistiques                                │
│  ┌──────────────────┐                                   │
│  │ Produits Structurés │  Total Produits: [X]          │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Filtres par Assurance                                   │
│  [Toutes] [SwissLife] [CARDIF] [Abeille] ...            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🏢 SwissLife (X produits)  Espace: X MB           │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ ┌──────┐ ┌──────┐ ┌──────┐                       │ │
│  │ │Prod.1│ │Prod.2│ │Prod.3│                       │ │
│  │ └──────┘ └──────┘ └──────┘                       │ │
│  └──────────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🛡️ CARDIF (X produits)  Espace: X MB               │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Fonctionnalités d'Affichage

#### 1. **Header avec Statistiques**
- **Total de produits** : Compteur en temps réel
- **Design** : Gradient bleu foncé avec badge de statistiques

#### 2. **Filtres par Assurance**
- Boutons cliquables avec compteurs par assurance
- Icônes spécifiques pour chaque assurance :
  - 🏢 SwissLife
  - 🛡️ CARDIF
  - 🐝 Abeille Assurances
  - 🔷 AXA
  - ⚡ Allianz
  - 🌟 Generali

#### 3. **Groupement par Assurance**
- **Header par assurance** : Couleur distinctive + statistiques
- **Espace utilisé** : Calcul automatique de l'espace total par assurance
- **Nombre de produits** : Compteur par groupe

#### 4. **Cartes de Produits**
Chaque carte affiche :
- **Icône du type de fichier** : 📄 PDF, 📝 Word, 📊 Excel, etc.
- **Titre du produit**
- **Catégorie** : Badge avec catégorie
- **Description** : Texte tronqué (2 lignes max)
- **Métadonnées** :
  - 💾 Taille du fichier
  - 🕒 Date de création
  - 👤 Uploadé par (nom + prénom)
- **Actions** :
  - **Télécharger** : Bouton principal (bleu)
  - **Prévisualiser** : Ouvrir dans nouvel onglet

#### 5. **Statistiques Globales**
Footer avec 4 métriques :
- **Total Produits** : Nombre total de produits structurés
- **Assurances** : Nombre d'assurances différentes
- **Espace Total** : Taille totale de tous les fichiers
- **Taille Moyenne** : Taille moyenne par fichier

---

## 🏗️ Architecture Technique

### Frontend

```
src/
├── ProduitsStructuresPage.tsx      # Page principale (consultation)
├── StructuredProductsDashboard.tsx # Dashboard admin (upload)
└── api.js                          # API client (structuredProductsAPI)
```

#### Composants React

**ProduitsStructuresPage.tsx**
- **État** : `products`, `assurances`, `selectedAssurance`, `loading`
- **Effets** : Chargement automatique au montage et lors du changement de filtre
- **Fonctions** :
  - `loadProducts()` : Récupération depuis l'API
  - `loadAssurances()` : Liste des assurances disponibles
  - `getAssuranceColor()` : Mapper couleur par assurance
  - `getAssuranceIcon()` : Mapper icône par assurance
  - `formatFileSize()` : Formatage taille (Bytes → KB/MB/GB)
  - `getFileIcon()` : Icône selon type de fichier

**StructuredProductsDashboard.tsx**
- **État** : Formulaire d'upload, filtres, produits
- **Fonctions** :
  - `handleFileUpload()` : Upload avec FormData
  - `handleProductDelete()` : Suppression avec confirmation
  - `loadProducts()` : Rechargement après modification

### Backend

```
backend/
├── routes/
│   └── structuredProducts.js      # Routes API
├── middleware/
│   └── auth.js                     # Authentification JWT
├── uploads/
│   └── structured-products/         # Dossier de stockage
└── config/
    └── database.js                  # Connexion MySQL
```

#### Routes API

| Méthode | Endpoint | Authentification | Description |
|---------|----------|------------------|-------------|
| `GET` | `/api/structured-products` | ❌ Public | Liste tous les produits (filtres: assurance, category, search) |
| `POST` | `/api/structured-products` | ✅ Admin | Upload nouveau produit avec fichier |
| `GET` | `/api/structured-products/assurances` | ❌ Public | Liste des assurances disponibles |
| `GET` | `/api/structured-products/categories` | ❌ Public | Liste des catégories |
| `DELETE` | `/api/structured-products/:id` | ✅ Admin | Suppression d'un produit |

#### Middleware Multer

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'));
    }
  }
});
```

### Base de Données

#### Table `archives`

Utilisée pour stocker les produits structurés avec les champs spécifiques :

```sql
-- Champs utilisés pour les produits structurés
id              INT PRIMARY KEY
title           VARCHAR(255)     -- Nom du produit
description     TEXT             -- Description optionnelle
file_path       VARCHAR(500)     -- Chemin: uploads/structured-products/...
file_size       BIGINT           -- Taille en bytes
file_type       VARCHAR(100)     -- Type MIME
category        VARCHAR(100)     -- Épargne, Retraite, etc.
assurance       VARCHAR(100)     -- SwissLife, CARDIF, etc.
uploaded_by     INT              -- ID utilisateur (FK vers users)
created_at      TIMESTAMP        -- Date de création
```

#### Jointure avec Table `users`

Pour afficher le nom de l'utilisateur qui a uploadé :

```sql
SELECT a.*, u.nom, u.prenom
FROM archives a
LEFT JOIN users u ON a.uploaded_by = u.id
WHERE ...
```

---

## 🎨 Système de Couleurs par Assurance

| Assurance | Couleur | Classe Tailwind | Icône |
|-----------|---------|-----------------|-------|
| **SwissLife** | Bleu | `from-blue-500 to-blue-600` | 🏢 |
| **CARDIF** | Orange | `from-orange-500 to-orange-600` | 🛡️ |
| **Abeille Assurances** | Vert | `from-green-500 to-green-600` | 🐝 |
| **AXA** | Violet | `from-purple-500 to-purple-600` | 🔷 |
| **Allianz** | Rouge | `from-red-500 to-red-600` | ⚡ |
| **Generali** | Jaune | `from-yellow-500 to-yellow-600` | 🌟 |

---

## 📥 Téléchargement des Fichiers

### Méthode de Téléchargement

```typescript
// Lien direct vers le fichier via le backend
<a
  href={`http://localhost:3001/${product.file_path}`}
  target="_blank"
  rel="noopener noreferrer"
>
  Télécharger
</a>
```

### Service de Fichiers Statiques

Le backend Express sert les fichiers statiques depuis le dossier `uploads/` :

```javascript
// Dans server.js
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

**URL de téléchargement** :
```
http://localhost:3001/uploads/structured-products/product_SwissLife_1234567890-987654321.pdf
```

---

## 🔐 Sécurité & Validation

### Côté Client (Frontend)

- ✅ **Validation des champs** : Champs obligatoires vérifiés avant envoi
- ✅ **Validation de type** : Accept attribute sur l'input file
- ✅ **Authentification** : Token JWT dans header `x-auth-token`

### Côté Serveur (Backend)

- ✅ **Authentification** : Middleware `auth` vérifie le token JWT
- ✅ **Autorisation** : Seuls les admins peuvent uploader (`authorize('admin')`)
- ✅ **Validation Multer** : 
  - Vérification de l'extension de fichier
  - Vérification du type MIME
  - Limite de taille (10MB)
- ✅ **Validation des données** : Vérification des champs requis
- ✅ **Noms de fichiers sécurisés** : Sanitization de l'assurance dans le nom

---

## 📊 Statistiques & Métriques

### Calculs Automatiques

1. **Espace par assurance** :
```typescript
const espace = assuranceProducts.reduce((acc, p) => acc + p.file_size, 0);
```

2. **Taille moyenne** :
```typescript
const moyenne = products.length > 0 
  ? Math.round(products.reduce((acc, p) => acc + p.file_size, 0) / products.length / 1024)
  : 0;
```

3. **Compteurs dynamiques** :
- Total produits : `products.length`
- Produits par assurance : `groupedProducts[assurance].length`
- Nombre d'assurances : `assurances.length`

---

## 🔄 Flux de Données Complet

```
┌─────────────────┐
│  Admin Dashboard│
│  (Upload Form)  │
└────────┬────────┘
         │
         │ POST /api/structured-products
         │ (FormData + Token)
         ▼
┌─────────────────┐
│  Backend API    │
│  (Multer)       │
└────────┬────────┘
         │
         ├─► Stockage Fichier
         │   └─► uploads/structured-products/
         │
         └─► INSERT INTO archives
             └─► MySQL Database
                 │
                 │ GET /api/structured-products
                 │ (Filtres optionnels)
                 ▼
         ┌─────────────────┐
         │  Page Produits  │
         │  (Consultation)  │
         └─────────────────┘
```

---

## 📝 Format des Données

### Objet Produit Structuré

```typescript
interface StructuredProduct {
  id: number;
  title: string;
  description: string;
  assurance: string;
  category: string;
  file_path: string;        // uploads/structured-products/product_...
  file_size: number;        // Taille en bytes
  file_type: string;        // application/pdf, etc.
  created_at: string;       // ISO timestamp
  uploaded_by_nom?: string; // Nom de l'uploader (JOIN)
  uploaded_by_prenom?: string; // Prénom de l'uploader (JOIN)
}
```

---

## 🚀 Améliorations Futures Possibles

- [ ] **Pagination** : Pour grandes quantités de produits
- [ ] **Recherche avancée** : Multi-critères (date, taille, etc.)
- [ ] **Prévisualisation** : Vue en ligne pour PDF
- [ ] **Versioning** : Gestion de versions de produits
- [ ] **Tags** : Système de tags pour organisation
- [ ] **Favoris** : Marquer des produits comme favoris
- [ ] **Notifications** : Alertes pour nouveaux produits
- [ ] **Export** : Export CSV/Excel de la liste
- [ ] **Compression** : Compression automatique des fichiers
- [ ] **CDN** : Distribution via CDN pour téléchargements rapides

---

## 📌 Points Clés

✅ **Séparation des responsabilités** : Upload (Admin) / Consultation (Tous)
✅ **Organisation par assurance** : Groupement automatique avec couleurs
✅ **Sécurité** : Authentification et autorisation strictes
✅ **Performance** : Filtres côté serveur pour optimiser les requêtes
✅ **UX** : Interface intuitive avec statistiques en temps réel
✅ **Maintenabilité** : Code modulaire et bien structuré

