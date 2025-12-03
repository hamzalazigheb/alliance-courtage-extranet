# Guide de développement : Ajouter une nouvelle fonctionnalité

## 📋 Workflow : Local → Test → Déploiement

### Étape 1 : Développement Local

#### 1.1 Préparer l'environnement local

```bash
# 1. S'assurer que le backend est démarré
cd backend
npm install
npm run dev  # Port 3001

# 2. Dans un autre terminal, démarrer le frontend
cd ..  # Retour à la racine
npm install
npm run dev  # Port 5173
```

#### 1.2 Structure pour une nouvelle fonctionnalité

**Backend (Nouvelle route) :**
```
backend/
  routes/
    nouvelleFonctionnalite.js  # Nouvelle route
  server.js                    # Ajouter la route
```

**Frontend (Nouvelle page/composant) :**
```
src/
  pages/
    NouvelleFonctionnalitePage.tsx  # Nouvelle page
  api.js                            # Ajouter les appels API
  App.tsx                           # Ajouter la route
```

### Étape 2 : Développement Backend

#### 2.1 Créer la route backend

Créer `backend/routes/nouvelleFonctionnalite.js` :

```javascript
const express = require('express');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/nouvelle-fonctionnalite
router.get('/', auth, async (req, res) => {
  try {
    // Votre logique ici
    const results = await query('SELECT * FROM votre_table');
    res.json(results);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/nouvelle-fonctionnalite
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { data } = req.body;
    // Votre logique ici
    const result = await query('INSERT INTO votre_table ...');
    res.status(201).json({ message: 'Créé avec succès', id: result.insertId });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
```

#### 2.2 Ajouter la route dans server.js

```javascript
// Dans backend/server.js
const nouvelleFonctionnaliteRoutes = require('./routes/nouvelleFonctionnalite');

// Plus loin dans le fichier
app.use('/api/nouvelle-fonctionnalite', nouvelleFonctionnaliteRoutes);
```

#### 2.3 Tester l'API localement

```bash
# Tester avec curl ou Postman
curl http://localhost:3001/api/nouvelle-fonctionnalite \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Étape 3 : Développement Frontend

#### 3.1 Créer la page frontend

Créer `src/pages/NouvelleFonctionnalitePage.tsx` :

```typescript
import { useState, useEffect } from 'react';
import { buildAPIURL } from '../api';

const NouvelleFonctionnalitePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildAPIURL('/nouvelle-fonctionnalite'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nouvelle Fonctionnalité</h1>
      {/* Votre interface ici */}
    </div>
  );
};

export default NouvelleFonctionnalitePage;
```

#### 3.2 Ajouter l'API dans api.js

```javascript
// Dans src/api.js
export const nouvelleFonctionnaliteAPI = {
  getAll: () => api.get('/nouvelle-fonctionnalite'),
  create: (data) => api.post('/nouvelle-fonctionnalite', data),
  // etc.
};
```

#### 3.3 Ajouter la route dans App.tsx

```typescript
// Dans src/App.tsx
import NouvelleFonctionnalitePage from './pages/NouvelleFonctionnalitePage';

// Dans la fonction de rendu
{currentPage === 'nouvelle-fonctionnalite' && (
  <NouvelleFonctionnalitePage />
)}
```

### Étape 4 : Tests Locaux

#### 4.1 Tester le backend

```bash
# Backend doit être démarré
cd backend
npm run test  # Si vous avez des tests
```

#### 4.2 Tester le frontend

- Ouvrir http://localhost:5173
- Tester toutes les fonctionnalités
- Vérifier les erreurs dans la console
- Tester sur différents navigateurs

#### 4.3 Tester l'intégration

```bash
# Vérifier que tout fonctionne ensemble
# 1. Backend répond
curl http://localhost:3001/api/nouvelle-fonctionnalite

# 2. Frontend peut se connecter
# Ouvrir http://localhost:5173 et tester manuellement
```

### Étape 5 : Préparer pour le déploiement

#### 5.1 Vérifier les changements

```bash
# Voir ce qui a changé
git status
git diff

# Ajouter les fichiers
git add .
git commit -m "feat: ajout nouvelle fonctionnalité"
```

#### 5.2 Créer un script de test

Créer `test-nouvelle-fonctionnalite.sh` :

```bash
#!/bin/bash
echo "🧪 Test de la nouvelle fonctionnalité..."

# Test backend
echo "Test backend..."
curl -f http://localhost:3001/api/nouvelle-fonctionnalite || exit 1

echo "✅ Tests réussis!"
```

### Étape 6 : Déploiement

#### 6.1 Déployer le backend

```bash
# Sur le serveur
cd /chemin/vers/backend
git pull origin main
npm install
# Redémarrer le service
pm2 restart alliance-courtage-backend
# ou
docker-compose restart backend
```

#### 6.2 Déployer le frontend

```bash
# Build local
npm run build

# Ou build sur serveur
cd /chemin/vers/projet
git pull origin main
npm install
npm run build

# Copier dist/ vers nginx
sudo cp -r dist/* /var/www/html/
```

### Étape 7 : Vérification en production

#### 7.1 Vérifier le backend

```bash
# Sur le serveur
curl https://votre-domaine.com/api/nouvelle-fonctionnalite \
  -H "Authorization: Bearer TOKEN"
```

#### 7.2 Vérifier le frontend

- Ouvrir le site en production
- Tester la nouvelle fonctionnalité
- Vérifier les logs d'erreur

## 📝 Checklist avant déploiement

- [ ] Code testé en local
- [ ] Pas d'erreurs dans la console
- [ ] API fonctionne correctement
- [ ] Frontend se connecte à l'API
- [ ] Gestion des erreurs implémentée
- [ ] Sécurité vérifiée (auth, permissions)
- [ ] Code commité et pushé
- [ ] Documentation mise à jour (si nécessaire)

## 🔧 Commandes utiles

```bash
# Backend
cd backend
npm run dev          # Développement
npm start            # Production
npm run test         # Tests

# Frontend
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Prévisualiser le build

# Git
git status           # Voir les changements
git add .            # Ajouter tous les fichiers
git commit -m "..."   # Commit
git push             # Push vers le repo
```

## 🐛 Debugging

### Backend
```bash
# Voir les logs
cd backend
npm run dev  # Logs en temps réel

# Ou avec PM2
pm2 logs alliance-courtage-backend
```

### Frontend
- Ouvrir DevTools (F12)
- Vérifier l'onglet Console
- Vérifier l'onglet Network pour les requêtes API

### Base de données
```bash
# Se connecter à MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p
```

## 📚 Exemples de fonctionnalités existantes

Regardez ces fichiers pour des exemples :
- `backend/routes/bordereaux.js` - Upload de fichiers
- `backend/routes/notifications.js` - Système de notifications
- `src/pages/ComptabilitePage.tsx` - Page avec upload
- `src/pages/GestionComptabilitePage.tsx` - Page admin

