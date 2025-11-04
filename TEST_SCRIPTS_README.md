# 🧪 Scripts de Test - Alliance Courtage

Ce dossier contient tous les scripts de test pour l'application Alliance Courtage Extranet.

## 📋 Scripts Disponibles

### 1. `testAllAPI.js` - Tests API Complets
**Description:** Teste toutes les routes API de l'application

**Fonctionnalités testées:**
- ✅ Authentification (login, register)
- ✅ Routes CMS (toutes les pages)
- ✅ Gestion de fichiers (bordereaux, formations, archives, documents financiers)
- ✅ Réglementaire (folders, documents)
- ✅ Favoris (GET, POST, DELETE, check)
- ✅ Notifications
- ✅ Routes de gestion (users, products, assurances, partners)
- ✅ Permissions admin/user
- ✅ Structure de la base de données

**Exécution:**
```bash
cd backend
node scripts/testAllAPI.js
```

---

### 2. `testDatabase.js` - Tests Base de Données
**Description:** Vérifie la structure et l'intégrité de la base de données

**Fonctionnalités testées:**
- ✅ Existence de toutes les tables requises
- ✅ Structure des tables (colonnes, types)
- ✅ Clés étrangères (foreign keys)
- ✅ Indexes
- ✅ Intégrité des données (records orphelins)

**Exécution:**
```bash
cd backend
node scripts/testDatabase.js
```

---

### 3. `testSecurity.js` - Tests de Sécurité
**Description:** Teste les mesures de sécurité de l'application

**Fonctionnalités testées:**
- ✅ Protection contre accès non autorisé
- ✅ Gestion des tokens invalides
- ✅ Protection contre injection SQL
- ✅ Protection contre XSS
- ✅ Rate limiting
- ✅ Configuration CORS
- ✅ Validation des entrées
- ✅ Sécurité des uploads de fichiers

**Exécution:**
```bash
cd backend
node scripts/testSecurity.js
```

---

### 4. `testPerformance.js` - Tests de Performance
**Description:** Mesure les performances de l'API

**Fonctionnalités testées:**
- ✅ Temps de réponse des endpoints
- ✅ Temps de réponse moyen/min/max
- ✅ Taux de succès
- ✅ Taille des données retournées
- ✅ Tests de charge concurrente
- ✅ Requêtes par seconde

**Exécution:**
```bash
cd backend
node scripts/testPerformance.js
```

---

### 5. `runAllTests.js` - Exécuteur de Tous les Tests
**Description:** Exécute tous les scripts de test dans l'ordre

**Exécution:**
```bash
cd backend
node scripts/runAllTests.js
```

---

## 🚀 Démarrage Rapide

### Option 1: Exécuter tous les tests
```bash
cd backend
node scripts/runAllTests.js
```

### Option 2: Exécuter les tests individuellement
```bash
# Tests API
node scripts/testAllAPI.js

# Tests Base de Données
node scripts/testDatabase.js

# Tests Sécurité
node scripts/testSecurity.js

# Tests Performance
node scripts/testPerformance.js
```

---

## ⚙️ Configuration

### Variables d'Environnement

Assurez-vous que votre fichier `backend/config.env` contient:

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# API
API_BASE_URL=http://localhost:3001
PORT=3001

# Authentification
ADMIN_EMAIL=admin@alliance-courtage.fr
ADMIN_PASSWORD=votre_mot_de_passe_admin
```

### Prérequis

1. **Serveur Backend démarré**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Base de Données MySQL**
   - MySQL/MariaDB doit être démarré
   - Base de données `alliance_courtage` doit exister
   - Toutes les tables doivent être créées

3. **Dépendances Node.js**
   ```bash
   cd backend
   npm install
   ```

---

## 📊 Interprétation des Résultats

### Codes de Couleur

- ✅ **Vert**: Test réussi
- ❌ **Rouge**: Test échoué
- ⚠️ **Jaune**: Avertissement (non bloquant)
- 🔵 **Bleu**: Information
- 🟣 **Magenta**: Section importante

### Métriques de Performance

- **< 500ms**: Excellent
- **500-1000ms**: Acceptable
- **> 1000ms**: À optimiser

---

## 🔧 Dépannage

### Erreur: "Server not running"
**Solution:** Démarrez le serveur backend
```bash
cd backend
npm run dev
```

### Erreur: "Database connection failed"
**Solution:** Vérifiez:
1. MySQL est démarré
2. Les credentials dans `config.env`
3. La base de données existe

### Erreur: "Authentication failed"
**Solution:** Vérifiez:
1. Les credentials admin dans `config.env`
2. Un utilisateur admin existe dans la base de données
3. Le mot de passe est correct

### Erreur: "Module not found"
**Solution:** Installez les dépendances
```bash
cd backend
npm install
```

---

## 📝 Notes Importantes

1. **Tests avec Authentification**
   - Certains tests nécessitent un token valide
   - Les credentials admin doivent être corrects
   - Un utilisateur de test peut être créé pour les tests

2. **Tests de Performance**
   - Les résultats varient selon la charge du système
   - Exécutez plusieurs fois pour des résultats moyens

3. **Tests de Sécurité**
   - Certains tests peuvent générer des logs d'erreur (normal)
   - Les tentatives d'injection sont intentionnelles

---

## 🎯 Prochaines Étapes

Après avoir exécuté les tests:

1. **Réviser les erreurs** dans la sortie
2. **Corriger les problèmes** identifiés
3. **Réexécuter les tests** pour vérifier
4. **Documenter** les résultats dans `TEST_RESULTS.md`

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs d'erreur
2. Consultez `TEST_RESULTS.md`
3. Vérifiez la configuration dans `config.env`

---

**Bon test ! 🚀**

