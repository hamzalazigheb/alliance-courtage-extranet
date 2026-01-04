# 🔧 Modifications Backend pour Date de Strike

## Fichier: `backend/routes/structuredProducts.js`

---

### ⚠️ IMPORTANT: Faire ces modifications sur le serveur

```bash
cd ~/prod/backend/routes
nano structuredProducts.js
# ou
vim structuredProducts.js
```

---

## 📝 Modification 1: Extraction du paramètre date_strike

**Chercher cette section (ligne ~140-150):**

```javascript
router.post('/', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const {
      title,
      description,
      assurances,
      montant_enveloppe,
      category
    } = req.body;
```

**Remplacer par:**

```javascript
router.post('/', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const {
      title,
      description,
      assurances,
      montant_enveloppe,
      date_strike,  // ← AJOUTÉ
      category
    } = req.body;
```

---

## 📝 Modification 2: INSERT INTO avec date_strike

**Chercher cette requête SQL (ligne ~180-200):**

```javascript
const result = await query(
  `INSERT INTO structured_products 
   (title, description, assurance, montant_enveloppe, category, uploaded_by, created_at) 
   VALUES (?, ?, ?, ?, ?, ?, NOW())`,
  [title, description, assuranceJSON, montant_enveloppe, category, req.user.id]
);
```

**Remplacer par:**

```javascript
const result = await query(
  `INSERT INTO structured_products 
   (title, description, assurance, montant_enveloppe, date_strike, category, uploaded_by, created_at) 
   VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
  [title, description, assuranceJSON, montant_enveloppe, date_strike, category, req.user.id]
);
```

---

## ✅ Vérification

Après modification:
1. Le paramètre `date_strike` doit être extrait de `req.body`
2. La colonne `date_strike` doit être ajoutée dans l'INSERT
3. La valeur `date_strike` doit être ajoutée dans le tableau des paramètres

---

## 🔍 Commandes pour trouver les lignes exactes

```bash
cd ~/prod/backend/routes
grep -n "title," structuredProducts.js
grep -n "INSERT INTO structured_products" structuredProducts.js
```

Cela vous donnera les numéros de lignes exacts à modifier.

---

## 📋 Résumé des changements

| Ligne | Avant | Après |
|-------|-------|-------|
| ~145 | `category` | `date_strike,`<br>`category` |
| ~185 | `montant_enveloppe, category, uploaded_by` | `montant_enveloppe, date_strike, category, uploaded_by` |
| ~187 | `[..., montant_enveloppe, category, req.user.id]` | `[..., montant_enveloppe, date_strike, category, req.user.id]` |

---

## 🚀 Après modification

1. Sauvegarder le fichier
2. Rebuild le backend Docker (voir INSTRUCTIONS_DATE_STRIKE.md)
3. Tester la création d'un produit avec la date de strike

