# Alliance Courtage Backend API

Backend API pour l'extranet Alliance Courtage avec base de données MySQL.

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+
- MySQL (XAMPP recommandé)
- npm ou yarn

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de la base de données
1. Démarrer XAMPP et MySQL
2. Créer une base de données nommée `alliance_courtage`
3. Modifier le fichier `config.env` si nécessaire :
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=root
DB_PASSWORD=
```

### 3. Initialisation de la base de données
```bash
npm run init-db
```

### 4. Migration des données existantes
```bash
node scripts/migrateData.js
```

### 5. Démarrage du serveur
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## 📊 Structure de la Base de Données

### Tables principales :
- **users** - Utilisateurs du système
- **news** - Actualités et articles
- **financial_products** - Produits financiers
- **product_performances** - Performances des produits
- **partners** - Partenaires
- **archives** - Documents archivés
- **simulators** - Simulateurs disponibles
- **user_sessions** - Sessions utilisateur

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur
- `POST /api/auth/register` - Créer un utilisateur (Admin)

### Produits Financiers
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détail d'un produit
- `POST /api/products` - Créer un produit (Admin)
- `PUT /api/products/:id` - Modifier un produit (Admin)
- `DELETE /api/products/:id` - Supprimer un produit (Admin)

### Actualités
- `GET /api/news` - Liste des actualités
- `GET /api/news/:id` - Détail d'une actualité
- `POST /api/news` - Créer une actualité (Admin)
- `PUT /api/news/:id` - Modifier une actualité (Admin)
- `DELETE /api/news/:id` - Supprimer une actualité (Admin)

### Partenaires
- `GET /api/partners` - Liste des partenaires
- `GET /api/partners/:id` - Détail d'un partenaire
- `POST /api/partners` - Créer un partenaire (Admin)
- `PUT /api/partners/:id` - Modifier un partenaire (Admin)
- `DELETE /api/partners/:id` - Supprimer un partenaire (Admin)

### Archives
- `GET /api/archives` - Liste des archives
- `GET /api/archives/:id` - Détail d'une archive
- `POST /api/archives` - Créer une archive (Admin)
- `PUT /api/archives/:id` - Modifier une archive (Admin)
- `DELETE /api/archives/:id` - Supprimer une archive (Admin)

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (Admin)
- `GET /api/users/:id` - Détail d'un utilisateur (Admin)
- `PUT /api/users/:id` - Modifier un utilisateur (Admin)
- `PUT /api/users/:id/password` - Changer le mot de passe (Admin)
- `DELETE /api/users/:id` - Supprimer un utilisateur (Admin)

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Headers requis pour les routes protégées :
```
x-auth-token: <jwt_token>
```

### Utilisateur par défaut :
- **Email** : admin@alliance-courtage.fr
- **Mot de passe** : password
- **Rôle** : admin

## 📁 Structure des Fichiers

```
backend/
├── config/
│   └── database.js          # Configuration MySQL
├── middleware/
│   └── auth.js              # Middleware d'authentification
├── routes/
│   ├── auth.js              # Routes d'authentification
│   ├── users.js             # Routes utilisateurs
│   ├── products.js          # Routes produits financiers
│   ├── news.js              # Routes actualités
│   ├── partners.js          # Routes partenaires
│   └── archives.js          # Routes archives
├── scripts/
│   ├── initDatabase.js      # Script d'initialisation DB
│   └── migrateData.js       # Migration des données JSON
├── uploads/                 # Dossier des fichiers uploadés
├── config.env              # Variables d'environnement
├── package.json
└── server.js               # Serveur principal
```

## 🛠️ Scripts Disponibles

- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer en mode développement avec nodemon
- `npm run init-db` - Initialiser la base de données

## 🔧 Configuration

### Variables d'environnement (config.env) :
```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=root
DB_PASSWORD=

# Serveur
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=alliance_courtage_secret_key_2024
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## 🚨 Sécurité

- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Rate limiting (100 requêtes/15min)
- Validation des types de fichiers uploadés
- Headers de sécurité avec Helmet
- CORS configuré

## 📝 Logs

Les logs sont affichés dans la console avec des emojis pour faciliter le débogage :
- ✅ Succès
- ❌ Erreur
- 🔄 En cours
- 🚀 Démarrage
- 📊 Données



