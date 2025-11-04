# 🧪 Guide de Test des Routes API

## 📋 Routes API Disponibles

### 🔐 Authentification (`/api/auth`)

#### POST `/api/auth/login`
- **Description:** Connexion utilisateur
- **Accès:** Public
- **Body:** `{ email: string, password: string }`
- **Response:** `{ token: string, user: { id, email, nom, prenom, role, profilePhotoUrl } }`
- **Test:**
  ```bash
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@alliance-courtage.fr","password":"password"}'
  ```

#### GET `/api/auth/me`
- **Description:** Obtenir les infos de l'utilisateur connecté
- **Accès:** Private (nécessite token)
- **Headers:** `x-auth-token: <token>`
- **Response:** `{ user: { id, email, nom, prenom, role, profilePhotoUrl } }`

#### POST `/api/auth/logout`
- **Description:** Déconnexion
- **Accès:** Private
- **Headers:** `x-auth-token: <token>`

---

### 👥 Utilisateurs (`/api/users`)

#### GET `/api/users`
- **Description:** Liste tous les utilisateurs
- **Accès:** Private (Admin seulement)
- **Headers:** `x-auth-token: <token>`
- **Query params:** `?role=admin&active=true&search=nom`

#### GET `/api/users/:id`
- **Description:** Obtenir un utilisateur par ID
- **Accès:** Private (Admin seulement)

#### PUT `/api/users/:id/profile`
- **Description:** Mettre à jour le profil (nom, prénom, photo)
- **Accès:** Private (propre profil uniquement)
- **Content-Type:** `multipart/form-data`
- **Body:** `{ nom: string, prenom: string, profilePhoto?: File }`

#### PUT `/api/users/:id/password`
- **Description:** Changer le mot de passe
- **Accès:** Private (propre profil uniquement)
- **Body:** `{ currentPassword: string, newPassword: string }`

#### GET `/api/users/:id/profile-photo`
- **Description:** Télécharger la photo de profil
- **Accès:** Private (propre photo ou admin)

#### DELETE `/api/users/:id/profile-photo`
- **Description:** Supprimer la photo de profil
- **Accès:** Private (propre photo uniquement)

---

### 📦 Produits Structurés (`/api/structured-products`)

#### GET `/api/structured-products`
- **Description:** Liste tous les produits structurés
- **Accès:** Public
- **Query params:** `?assurance=SwissLife&category=Épargne&search=terme`

#### POST `/api/structured-products`
- **Description:** Créer un produit structuré (base64)
- **Accès:** Private (Admin seulement)
- **Content-Type:** `multipart/form-data`
- **Body:** `{ title: string, description?: string, assurance: string, category: string, file: File }`

#### GET `/api/structured-products/:id/download`
- **Description:** Télécharger le fichier d'un produit
- **Accès:** Public

#### DELETE `/api/structured-products/:id`
- **Description:** Supprimer un produit
- **Accès:** Private (Admin seulement)

#### POST `/api/structured-products/:id/reservations`
- **Description:** Créer une réservation
- **Accès:** Private
- **Body:** `{ montant: number, notes?: string }`

#### GET `/api/structured-products/reservations/my`
- **Description:** Mes réservations
- **Accès:** Private

#### GET `/api/structured-products/assurances/montants`
- **Description:** Montants par assurance
- **Accès:** Public

---

### 🛡️ Assurances (`/api/assurances`)

#### GET `/api/assurances`
- **Description:** Liste toutes les assurances
- **Accès:** Public
- **Query params:** `?include_inactive=true`

#### GET `/api/assurances/:id`
- **Description:** Obtenir une assurance
- **Accès:** Public

#### POST `/api/assurances`
- **Description:** Créer une assurance
- **Accès:** Private (Admin seulement)
- **Body:** `{ name: string, montant_enveloppe: number, color?: string, icon?: string, description?: string, is_active?: boolean }`

#### PUT `/api/assurances/:id`
- **Description:** Mettre à jour une assurance
- **Accès:** Private (Admin seulement)

#### DELETE `/api/assurances/:id`
- **Description:** Supprimer une assurance
- **Accès:** Private (Admin seulement)

---

### 📄 Bordereaux (`/api/bordereaux`)

#### GET `/api/bordereaux`
- **Description:** Liste les bordereaux
- **Accès:** Private
- **Query params:** `?user_id=1` (admin peut voir tous, user voit seulement les siens)

#### POST `/api/bordereaux`
- **Description:** Créer un bordereau (base64)
- **Accès:** Private (Admin seulement)
- **Content-Type:** `multipart/form-data`
- **Body:** `{ title: string, description?: string, user_id: number, period_month: string, period_year: number, file: File }`

#### GET `/api/bordereaux/:id/download`
- **Description:** Télécharger un bordereau
- **Accès:** Private (propriétaire ou admin)

#### DELETE `/api/bordereaux/:id`
- **Description:** Supprimer un bordereau
- **Accès:** Private (Admin seulement)

---

### 📚 Formations (`/api/formations`)

#### GET `/api/formations`
- **Description:** Liste les formations de l'utilisateur
- **Accès:** Private
- **Query params:** `?year=2024&statut=pending`

#### POST `/api/formations`
- **Description:** Soumettre une formation (base64)
- **Accès:** Private
- **Content-Type:** `multipart/form-data`

#### GET `/api/formations/:id/download`
- **Description:** Télécharger le fichier de formation
- **Accès:** Private (propriétaire ou admin)

#### GET `/api/formations/pending`
- **Description:** Formations en attente d'approbation
- **Accès:** Private (Admin seulement)

---

### 🗄️ Archives (`/api/archives`)

#### GET `/api/archives`
- **Description:** Liste toutes les archives
- **Accès:** Public
- **Query params:** `?category=Général&year=2024&search=terme`

#### POST `/api/archives`
- **Description:** Créer une archive (base64)
- **Accès:** Private (Admin seulement)
- **Content-Type:** `multipart/form-data`

#### GET `/api/archives/:id/download`
- **Description:** Télécharger une archive
- **Accès:** Public

#### DELETE `/api/archives/:id`
- **Description:** Supprimer une archive
- **Accès:** Private (Admin seulement)

---

### 📊 Documents Financiers (`/api/financial-documents`)

#### GET `/api/financial-documents`
- **Description:** Liste tous les documents financiers
- **Accès:** Public
- **Query params:** `?category=Produits&subcategory=PEA&year=2024`

#### POST `/api/financial-documents`
- **Description:** Créer un document (base64)
- **Accès:** Private (Admin seulement)
- **Content-Type:** `multipart/form-data`

#### GET `/api/financial-documents/:id/download`
- **Description:** Télécharger un document
- **Accès:** Public

#### DELETE `/api/financial-documents/:id`
- **Description:** Supprimer un document
- **Accès:** Private (Admin seulement)

---

### 🤝 Partenaires (`/api/partners`)

#### GET `/api/partners`
- **Description:** Liste tous les partenaires
- **Accès:** Public
- **Query params:** `?category=coa&active=true`

#### POST `/api/partners`
- **Description:** Créer un partenaire (logo base64)
- **Accès:** Private (Admin seulement)
- **Content-Type:** `multipart/form-data`
- **Body:** `{ nom: string, description?: string, website?: string, category: string, logo_file?: File }`

#### GET `/api/partners/:id/logo`
- **Description:** Obtenir le logo d'un partenaire
- **Accès:** Public

#### PUT `/api/partners/:id`
- **Description:** Mettre à jour un partenaire
- **Accès:** Private (Admin seulement)

#### DELETE `/api/partners/:id`
- **Description:** Supprimer un partenaire
- **Accès:** Private (Admin seulement)

---

### 📝 CMS (`/api/cms`)

#### GET `/api/cms/:page`
- **Description:** Obtenir le contenu CMS d'une page
- **Accès:** Private
- **Pages:** `accueil`, `gamme-produits`, `formations`, `produits-structures`, `rencontres`

#### PUT `/api/cms/:page`
- **Description:** Mettre à jour le contenu CMS
- **Accès:** Private (Admin seulement)
- **Body:** `{ content: string }` (JSON stringifié)

---

### 🔑 Réinitialisation Mot de Passe

#### POST `/api/password-reset/request`
- **Description:** Demander une réinitialisation (public)
- **Accès:** Public
- **Body:** `{ email: string }`

#### GET `/api/password-reset/requests`
- **Description:** Liste des demandes en attente
- **Accès:** Private (Admin seulement)

#### PUT `/api/password-reset/requests/:id/complete`
- **Description:** Compléter une réinitialisation (admin)
- **Accès:** Private (Admin seulement)
- **Body:** `{ newPassword: string, notes?: string }`

#### POST `/api/admin-password-reset/request`
- **Description:** Réinitialisation admin directe (email)
- **Accès:** Public
- **Body:** `{ email: string }`

---

## 🔒 Permissions par Route

### Routes Publiques
- ✅ `GET /api/structured-products`
- ✅ `GET /api/structured-products/assurances`
- ✅ `GET /api/structured-products/categories`
- ✅ `GET /api/structured-products/:id/download`
- ✅ `GET /api/structured-products/assurances/montants`
- ✅ `GET /api/assurances`
- ✅ `GET /api/assurances/:id`
- ✅ `GET /api/archives`
- ✅ `GET /api/archives/:id/download`
- ✅ `GET /api/financial-documents`
- ✅ `GET /api/financial-documents/:id/download`
- ✅ `GET /api/partners`
- ✅ `GET /api/partners/:id/logo`
- ✅ `POST /api/auth/login`
- ✅ `POST /api/password-reset/request`
- ✅ `POST /api/admin-password-reset/request`

### Routes Privées (Utilisateur Connecté)
- 🔐 `GET /api/auth/me`
- 🔐 `POST /api/auth/logout`
- 🔐 `PUT /api/users/:id/profile` (propre profil)
- 🔐 `PUT /api/users/:id/password` (propre profil)
- 🔐 `GET /api/users/:id/profile-photo` (propre photo)
- 🔐 `DELETE /api/users/:id/profile-photo` (propre photo)
- 🔐 `POST /api/structured-products/:id/reservations`
- 🔐 `GET /api/structured-products/reservations/my`
- 🔐 `GET /api/bordereaux` (ses propres fichiers)
- 🔐 `GET /api/bordereaux/:id/download` (propriétaire)
- 🔐 `GET /api/formations`
- 🔐 `POST /api/formations`
- 🔐 `GET /api/formations/:id/download` (propriétaire)
- 🔐 `GET /api/cms/:page`

### Routes Admin Seulement
- 👑 `GET /api/users`
- 👑 `GET /api/users/:id`
- 👑 `PUT /api/users/:id`
- 👑 `DELETE /api/users/:id`
- 👑 `POST /api/structured-products`
- 👑 `DELETE /api/structured-products/:id`
- 👑 `GET /api/structured-products/:id/reservations`
- 👑 `POST /api/assurances`
- 👑 `PUT /api/assurances/:id`
- 👑 `DELETE /api/assurances/:id`
- 👑 `POST /api/bordereaux`
- 👑 `DELETE /api/bordereaux/:id`
- 👑 `GET /api/formations/pending`
- 👑 `POST /api/archives`
- 👑 `DELETE /api/archives/:id`
- 👑 `POST /api/financial-documents`
- 👑 `DELETE /api/financial-documents/:id`
- 👑 `POST /api/partners`
- 👑 `PUT /api/partners/:id`
- 👑 `DELETE /api/partners/:id`
- 👑 `PUT /api/cms/:page`
- 👑 `GET /api/password-reset/requests`
- 👑 `PUT /api/password-reset/requests/:id/complete`

---

## 🧪 Tests à Effectuer

### 1. Authentification
- [ ] Login avec email/mot de passe valides
- [ ] Login avec identifiants invalides (erreur 401)
- [ ] GET /auth/me avec token valide
- [ ] GET /auth/me sans token (erreur 401)
- [ ] Logout

### 2. Permissions
- [ ] Utilisateur non-admin ne peut pas accéder aux routes admin
- [ ] Utilisateur ne peut modifier que son propre profil
- [ ] Admin peut voir tous les utilisateurs
- [ ] User ne voit que ses propres bordereaux

### 3. Upload Base64
- [ ] Upload produit structuré (base64)
- [ ] Upload bordereau (base64)
- [ ] Upload formation (base64)
- [ ] Upload archive (base64)
- [ ] Upload document financier (base64)
- [ ] Upload logo partenaire (base64)
- [ ] Upload photo de profil (base64)

### 4. Téléchargement Base64
- [ ] Télécharger produit structuré
- [ ] Télécharger bordereau
- [ ] Télécharger formation
- [ ] Télécharger archive
- [ ] Télécharger document financier
- [ ] Afficher logo partenaire
- [ ] Afficher photo de profil

### 5. Pagination (à implémenter)
- [ ] Liste utilisateurs avec pagination
- [ ] Liste archives avec pagination
- [ ] Liste produits structurés avec pagination
- [ ] Liste formations avec pagination

---

## 📝 Exemple de Test avec Postman

### Collection Postman
Créer une collection avec les variables:
- `base_url`: `http://localhost:3001`
- `token`: (à définir après login)

### Workflow de Test
1. **Login** → Récupérer le token
2. **Sauvegarder le token** dans la variable `token`
3. **Tester les routes protégées** avec header `x-auth-token: {{token}}`
4. **Tester les routes admin** avec un compte admin
5. **Tester les uploads** avec `multipart/form-data`

---

## ✅ Checklist de Validation

- [ ] Toutes les routes publiques fonctionnent
- [ ] Toutes les routes privées nécessitent un token
- [ ] Toutes les routes admin bloquent les non-admins (403)
- [ ] Tous les uploads base64 fonctionnent
- [ ] Tous les téléchargements base64 fonctionnent
- [ ] Les permissions sont correctement appliquées
- [ ] Les erreurs sont gérées correctement (400, 401, 403, 404, 500)

