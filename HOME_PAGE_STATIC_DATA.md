# 📋 Liste des Données Statiques - Page d'Accueil (#accueil)

## 📍 Route
`http://localhost:5173/#accueil`

## 🔍 Structure des Données

La page d'accueil charge ses données depuis le CMS (endpoint `/api/cms/home`), mais possède des **valeurs par défaut statiques** qui s'affichent si aucune donnée CMS n'est trouvée.

---

## 📊 Données Statiques Par Défaut

### 1. **Titre de Bienvenue** (`welcomeTitle`)
```typescript
'Bienvenue chez Alliance Courtage'
```

### 2. **Actualités** (`news`)
```typescript
Array vide par défaut: []
```

**Structure attendue** (si données CMS) :
```typescript
{
  title: string,      // Titre de l'actualité
  content: string,    // Contenu de l'actualité
  date: string,      // Date (format: "DD/MM/YYYY")
  color: string       // Couleur: 'indigo' | 'purple' | 'pink' | 'green' | 'blue'
}
```

### 3. **Newsletter** (`newsletter`)
```typescript
null par défaut
```

**Structure attendue** (si données CMS) :
```typescript
{
  title: string,           // Ex: "Newsletter patrimoniale"
  badge: string,           // Ex: "Rentrée 2025"
  description: string,     // Description de la newsletter
  filePath: string,        // Chemin du fichier PDF
  isRecent: boolean        // Indicateur de publication récente
}
```

**⚠️ Données Hardcodées dans le JSX** :
- Titre: `"Newsletter patrimoniale"` (ligne 1467)
- Badge: `"Rentrée 2025"` (ligne 1469)
- Description: `"Découvrez notre newsletter patrimoniale spéciale rentrée 2025 avec les dernières tendances et conseils d'investissement pour optimiser votre patrimoine."` (ligne 1474)
- Chemin PDF: `"/Newsletter patrimoniale - Rentrée 2025.pdf"` (ligne 1479)
- Texte "Publication récente" (ligne 1494)

### 4. **Services** (`services`)
```typescript
Array vide par défaut: []
```

**Structure attendue** (si données CMS) :
```typescript
{
  name: string  // Nom du service
}
```

**Exemples de services** (basés sur CMSManagementPage.tsx) :
- `"Epargne et retraite"`
- `"Prévoyance et santé"`
- `"Assurances collectives"`
- `"Investissement financier (CIF)"`

### 5. **Contact** (`contact`)
```typescript
{
  phone: '07.45.06.43.88',
  email: 'contact@alliance-courtage.fr',
  location: 'Paris, France'
}
```

---

## 🎨 Données Statiques de Style/UI

### Couleurs Disponibles pour les Actualités
```typescript
{
  'indigo': 'bg-indigo-500',
  'purple': 'bg-purple-500',
  'pink': 'bg-pink-500',
  'green': 'bg-green-500',
  'blue': 'bg-blue-500'
}
```

### Textes Hardcodés dans le JSX

1. **Section Actualités** :
   - Titre: `"Actualités"` (ligne 1436)

2. **Section Newsletter** :
   - Titre: `"Newsletter patrimoniale"` (ligne 1467)
   - Badge: `"Rentrée 2025"` (ligne 1469)
   - Description: `"Découvrez notre newsletter patrimoniale spéciale rentrée 2025 avec les dernières tendances et conseils d'investissement pour optimiser votre patrimoine."` (ligne 1474)
   - Bouton: `"Télécharger le PDF"` (ligne 1487)
   - Chemin fichier: `"/Newsletter patrimoniale - Rentrée 2025.pdf"` (ligne 1479)
   - Texte info: `"Publication récente"` (ligne 1494)

3. **Section Services** :
   - Titre: `"Nos Services"` (ligne 1508)

4. **Section Contact** :
   - Titre: `"Contact"` (ligne 1519)
   - Icônes SVG pour téléphone, email, localisation

5. **État de Chargement** :
   - Texte: `"Chargement..."` (ligne 1421)

---

## 🔄 Source des Données

### Valeurs par Défaut (Statiques)
- Définies dans `src/App.tsx` ligne 1382-1388
- Utilisées si aucune donnée CMS n'est trouvée

### Données CMS (Dynamiques)
- Chargées depuis `/api/cms/home`
- Stockées dans la table `cms_content` (page = 'home')
- Format: JSON stringifié dans la colonne `content`

### Données Hardcodées (JSX)
- Newsletter: Titre, badge, description, chemin PDF sont hardcodés dans le JSX
- Ne peuvent pas être modifiés via CMS sans modifier le code source

---

## 📝 Exemple de Données CMS Complètes

```json
{
  "welcomeTitle": "Bienvenue chez Alliance Courtage",
  "news": [
    {
      "title": "Nouvelle réglementation assurance-vie",
      "content": "Découvrez les dernières modifications de la réglementation sur l'assurance-vie et leurs impacts sur vos contrats.",
      "date": "15/01/2025",
      "color": "indigo"
    },
    {
      "title": "Évolution des taux d'intérêt",
      "content": "Analyse des tendances actuelles des taux d'intérêt et conseils pour optimiser vos placements.",
      "date": "12/01/2025",
      "color": "purple"
    }
  ],
  "newsletter": {
    "title": "Newsletter patrimoniale",
    "badge": "Rentrée 2025",
    "description": "Découvrez notre newsletter patrimoniale spéciale rentrée 2025 avec les dernières tendances et conseils d'investissement pour optimiser votre patrimoine.",
    "filePath": "/Newsletter patrimoniale - Rentrée 2025.pdf",
    "isRecent": true
  },
  "services": [
    { "name": "Epargne et retraite" },
    { "name": "Prévoyance et santé" },
    { "name": "Assurances collectives" },
    { "name": "Investissement financier (CIF)" }
  ],
  "contact": {
    "phone": "07.45.06.43.88",
    "email": "contact@alliance-courtage.fr",
    "location": "Paris, France"
  }
}
```

---

## ⚠️ Problèmes Identifiés

1. **Newsletter Hardcodée** : Les données de la newsletter sont partiellement hardcodées dans le JSX et ne peuvent pas être complètement modifiées via le CMS.

2. **Pas de Fallback** : Si le CMS échoue, les valeurs par défaut sont utilisées mais certaines sections peuvent être vides.

3. **Pas de Validation** : Les données du CMS ne sont pas validées avant affichage.

---

## 🔧 Recommandations

1. **Rendre la Newsletter Configurable** : Déplacer toutes les données de la newsletter dans le CMS au lieu de les hardcoder.

2. **Ajouter des Valeurs par Défaut Complètes** : Avoir des données par défaut plus complètes pour toutes les sections.

3. **Valider les Données CMS** : Ajouter une validation avant d'afficher les données du CMS.

