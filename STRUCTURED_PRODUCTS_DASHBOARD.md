# 📊 Dashboard Produits Structurés - Alliance Courtage

## 🎯 Nouvelle Fonctionnalité Implémentée

La page `/manage` est maintenant un **dashboard dédié** pour la gestion des produits structurés avec upload de fichiers et organisation par assurance.

## ✨ Fonctionnalités du Dashboard

### 🏠 Interface Dashboard
- **Design moderne** : Interface dashboard complète avec statistiques
- **Layout responsive** : Adaptation mobile/desktop
- **Couleurs par assurance** : Chaque assurance a sa couleur distinctive
- **Statistiques en temps réel** : Nombre total de produits et assurances

### 📤 Upload de Produits Structurés
- **Formulaire complet** : Nom, assurance, catégorie, description
- **Types de fichiers** : PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Taille maximale** : 10MB par fichier
- **Validation** : Contrôles stricts côté client et serveur
- **Feedback visuel** : Loading, succès, erreur

### 🏢 Gestion par Assurance
- **Assurances supportées** :
  - SwissLife (Bleu)
  - CARDIF (Orange)
  - Abeille Assurances (Vert)
  - AXA (Violet)
  - Allianz (Rouge)
  - Generali (Jaune)

### 📁 Organisation des Fichiers
- **Stockage sécurisé** : `backend/uploads/structured-products/`
- **Noms uniques** : `product_[assurance]_[timestamp]_[random].ext`
- **Métadonnées complètes** : Base de données MySQL

## 🔧 Architecture Technique

### Frontend (React/TypeScript)
```
src/
├── StructuredProductsDashboard.tsx  # Dashboard principal
├── api.js                          # API calls mis à jour
└── App.tsx                         # Routage /manage
```

### Backend (Node.js/Express)
```
backend/
├── routes/structuredProducts.js    # API dédiée
├── uploads/structured-products/    # Stockage fichiers
└── server.js                       # Route ajoutée
```

### Base de Données (MySQL)
```sql
-- Utilise la table archives existante avec champ assurance
ALTER TABLE archives ADD COLUMN assurance VARCHAR(100);
```

## 🎨 Interface Utilisateur

### Dashboard Principal
- **Header** : Titre, description, statistiques
- **Formulaire upload** : Interface complète avec validation
- **Filtres** : Recherche, assurance, catégorie
- **Produits par assurance** : Cards colorées organisées

### Cards d'Assurance
- **En-tête coloré** : Couleur distinctive par assurance
- **Statistiques** : Nombre de produits par assurance
- **Grille de produits** : Layout responsive 1-3 colonnes
- **Actions** : Téléchargement et suppression

## 🔐 Sécurité et Permissions

### Upload
- ✅ **Authentification JWT** requise
- ✅ **Autorisation Admin** uniquement
- ✅ **Validation des types** de fichiers
- ✅ **Limitation de taille** (10MB)
- ✅ **Noms sécurisés** avec assurance

### Consultation
- ✅ **Authentification JWT** requise
- ✅ **Tous les utilisateurs** connectés
- ✅ **Accès en lecture seule** pour non-admin

## 📊 API Endpoints

### Produits Structurés
- `GET /api/structured-products` - Liste des produits
- `POST /api/structured-products` - Upload nouveau produit
- `DELETE /api/structured-products/:id` - Suppression produit
- `GET /api/structured-products/assurances` - Liste assurances
- `GET /api/structured-products/categories` - Liste catégories

### Paramètres de Filtrage
- `?assurance=SwissLife` - Filtrer par assurance
- `?category=Épargne` - Filtrer par catégorie
- `?search=mot` - Recherche textuelle

## 🚀 Comment Utiliser

### 1. Accès au Dashboard
- URL : `http://localhost:5174/#manage`
- Connexion admin requise
- Menu : "Produits Structurés"

### 2. Upload d'un Produit
1. Remplir le formulaire :
   - **Nom du produit** (obligatoire)
   - **Assurance** (obligatoire)
   - **Description** (optionnel)
   - **Catégorie** (obligatoire)
   - **Fichier** (obligatoire)
2. Cliquer sur "Uploader le Produit"
3. Confirmation de succès

### 3. Gestion des Produits
- **Filtres** : Utiliser les filtres pour rechercher
- **Téléchargement** : Bouton "Télécharger" sur chaque produit
- **Suppression** : Bouton rouge (admin seulement)

## 📈 Avantages de cette Architecture

1. **Séparation claire** : Dashboard dédié aux produits structurés
2. **Organisation par assurance** : Interface intuitive et colorée
3. **Upload spécialisé** : Formulaire adapté aux produits financiers
4. **Stockage organisé** : Dossier dédié pour les produits structurés
5. **API dédiée** : Endpoints spécialisés pour les produits structurés
6. **Sécurité renforcée** : Contrôles stricts et authentification

## 🔄 Workflow Complet

```
1. Admin se connecte
2. Navigue vers "Produits Structurés" (/manage)
3. Upload un produit structuré avec assurance
4. Fichier stocké dans /structured-products/
5. Métadonnées enregistrées en base
6. Produit apparaît dans la section de l'assurance
7. Tous les utilisateurs peuvent consulter
8. Admin peut supprimer si nécessaire
```

## 📊 Exemple d'Utilisation

### Upload d'un Produit SwissLife
```
Nom: "Stratégie Patrimoine S Total Dividende"
Assurance: "SwissLife"
Catégorie: "Épargne"
Fichier: "swisslife_produit_2024.pdf"
```

### Résultat
- **Stockage** : `uploads/structured-products/product_SwissLife_1761418418163_882807243.pdf`
- **Base de données** : Enregistrement avec métadonnées complètes
- **Interface** : Apparaît dans la section bleue SwissLife

---

**Le dashboard Produits Structurés est maintenant opérationnel avec une interface moderne et une gestion complète par assurance !** 🎉📊









