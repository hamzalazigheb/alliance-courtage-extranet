# 📅 Instructions pour ajouter la Date de Strike

## ✅ Frontend - TERMINÉ

Les fichiers suivants ont été mis à jour:
- ✅ `src/StructuredProductsCMSPage.tsx` - Interface + Formulaire + Affichage
- ✅ `src/pages/ProduitsStructuresPage.tsx` - Interface + Affichage

---

## 🗄️ Base de Données - À FAIRE SUR LE SERVEUR

### 1. Se connecter au serveur MySQL

```bash
# Option 1: Via Docker
docker exec -it c4dbc8574704_alliance-courtage-mysql mysql -uroot -palliance2024Secure

# Option 2: Via ligne de commande directe
mysql -uroot -p alliance_courtage
```

### 2. Exécuter cette commande SQL

```sql
USE alliance_courtage;

-- Ajouter la colonne date_strike
ALTER TABLE structured_products ADD COLUMN date_strike DATE;

-- Vérifier que la colonne a été ajoutée
DESCRIBE structured_products;
```

Vous devriez voir `date_strike` dans la liste des colonnes.

---

## 🔧 Backend - À MODIFIER

### Fichier: `backend/routes/structuredProducts.js`

#### 1. Trouver la route POST (création de produit) - Ligne ~138

```javascript
router.post('/', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const {
      title,
      description,
      assurances,
      montant_enveloppe,
      date_strike,  // ← AJOUTER CETTE LIGNE
      category
    } = req.body;
```

#### 2. Trouver la requête INSERT INTO - Ligne ~180-190 (approximatif)

Cherchez cette ligne:
```javascript
const result = await query(
  `INSERT INTO structured_products 
   (title, description, assurance, montant_enveloppe, category, uploaded_by, created_at) 
   VALUES (?, ?, ?, ?, ?, ?, NOW())`,
  [title, description, assuranceJSON, montant_enveloppe, category, req.user.id]
);
```

Modifiez-la en:
```javascript
const result = await query(
  `INSERT INTO structured_products 
   (title, description, assurance, montant_enveloppe, date_strike, category, uploaded_by, created_at) 
   VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
  [title, description, assuranceJSON, montant_enveloppe, date_strike, category, req.user.id]
);
```

#### 3. Trouver la route GET (liste des produits) - Vérifier qu'elle retourne date_strike

Cherchez:
```javascript
router.get('/', auth, async (req, res) => {
  try {
    // ...
    const query = `SELECT * FROM structured_products WHERE ...`;
```

La requête SELECT * devrait automatiquement inclure date_strike, donc pas de modification nécessaire.

---

## 🚀 Déploiement

### 1. Exécuter le SQL sur le serveur (ci-dessus)

### 2. Mettre à jour le backend

```bash
cd ~/prod
git pull origin deploy-new-version

cd backend
docker stop alliance-courtage-backend
docker rm alliance-courtage-backend

# Rebuild backend
docker build --no-cache -t backend_backend:latest .

# Get MySQL network
MYSQL_NETWORK=$(docker inspect c4dbc8574704 --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

# Start backend
docker run -d \
  --name alliance-courtage-backend \
  --restart unless-stopped \
  --network $MYSQL_NETWORK \
  -p 3001:3001 \
  --env-file config.env \
  -e NODE_ENV=production \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_NAME=alliance_courtage \
  -e DB_USER=root \
  -e DB_PASSWORD=alliance2024Secure \
  -v $(pwd)/uploads:/app/uploads \
  backend_backend:latest

# Check logs
docker logs -f alliance-courtage-backend
```

### 3. Rebuild frontend

```bash
cd ~/prod

# Stop old frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Rebuild frontend
docker build --no-cache -t alliance-courtage-frontend:latest .

# Start frontend
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  -p 80:80 \
  alliance-courtage-frontend:latest

# Check logs
docker logs -f alliance-courtage-extranet
```

---

## ✅ Test

1. Se connecter en tant qu'admin
2. Aller dans "Produits structurés" > Section admin
3. Créer un nouveau produit en remplissant:
   - Nom du produit
   - Assurance(s) avec montant(s)
   - Montant enveloppe total
   - **Date de Strike** ← Nouveau champ!
   - Catégorie
   - Fichier(s)
4. Vérifier que le produit s'affiche avec la date de strike dans:
   - La section admin
   - La page utilisateur

---

## 📝 Notes

- La date de Strike est **obligatoire** pour tous les nouveaux produits
- Format d'affichage: JJ/MM/AAAA (ex: 04/01/2026)
- Les produits existants sans date de strike ne l'afficheront pas (pas de problème)

