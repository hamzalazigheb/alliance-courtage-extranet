# 🚀 Guide Rapide - Tests Alliance Courtage

## ⚡ Exécution Rapide

### Option 1: Tous les tests en une commande
```bash
cd backend
npm test
```

### Option 2: Tests individuels
```bash
cd backend

# Tests API complets
npm run test:api

# Tests Base de données
npm run test:db

# Tests Sécurité
npm run test:security

# Tests Performance
npm run test:performance
```

---

## 📋 Scripts Créés

| Script | Commande | Description |
|--------|----------|-------------|
| **testAllAPI.js** | `npm run test:api` | Teste toutes les routes API |
| **testDatabase.js** | `npm run test:db` | Vérifie la structure DB |
| **testSecurity.js** | `npm run test:security` | Teste la sécurité |
| **testPerformance.js** | `npm run test:performance` | Mesure les performances |
| **runAllTests.js** | `npm test` | Exécute tous les tests |

---

## ✅ Avant de Commencer

1. **Démarrer le serveur backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Vérifier la configuration:**
   - Fichier `backend/config.env` existe
   - Credentials admin corrects
   - Base de données MySQL démarrée

---

## 🎯 Résultats Attendus

- ✅ **Tests API**: Vérifie toutes les routes fonctionnent
- ✅ **Tests DB**: Vérifie toutes les tables existent
- ✅ **Tests Sécurité**: Vérifie les protections
- ✅ **Tests Performance**: Mesure les temps de réponse

---

## 📝 Documentation Complète

Pour plus de détails, consultez: **`TEST_SCRIPTS_README.md`**

---

**Bon test ! 🎉**

