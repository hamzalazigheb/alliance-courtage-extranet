# 📁 Guide : Organisation des Archives par Catégories

## ✅ Fonctionnalités Implémentées

### 1. **Système de Catégories**
- Les archives peuvent maintenant être organisées en catégories (ex: "Bordereaux 2024", "Protocoles", "Conventions")
- Catégories par défaut disponibles :
  - Bordereaux 2024
  - Protocoles
  - Conventions
  - Général
  - Non classé

### 2. **Édition de Catégorie**
- Cliquez sur l'icône ✏️ à côté de la catégorie d'une archive pour la modifier
- Sélectionnez la nouvelle catégorie dans le menu déroulant
- Validez avec ✓ ou annulez avec ✗

### 3. **Filtrage par Catégorie**
- Utilisez le filtre "Catégorie" en haut de la page pour afficher uniquement les archives d'une catégorie spécifique
- Par exemple, sélectionnez "Bordereaux 2024" pour voir uniquement vos 106 bordereaux

### 4. **Correction du Téléchargement**
- Le bouton "Télécharger" fonctionne maintenant correctement
- Il utilise automatiquement le bon endpoint selon le type de fichier (base64 ou file_path)

---

## 🚀 Installation et Configuration

### Étape 1 : Ajouter la colonne "category" à la base de données

Exécutez le script de migration :

```bash
cd backend
node scripts/addCategoryToArchives.js
```

**Résultat attendu :**
```
🔌 Connexion à la base de données établie
✅ Colonne category ajoutée avec succès
✅ X archives mises à jour avec la catégorie "Bordereaux 2024"

📊 Catégories existantes :
   - Bordereaux 2024: X fichier(s)
   - ...
```

### Étape 2 : Redémarrer le backend

```bash
cd backend
docker-compose restart backend
```

Ou si vous utilisez npm directement :

```bash
cd backend
npm restart
```

### Étape 3 : Redémarrer le frontend (si nécessaire)

```bash
npm run dev
```

---

## 📖 Utilisation

### Organiser vos 106 bordereaux de 2024

1. **Accédez à la gestion des archives**
   - Allez sur `/manage` → "Gestion des Archives"

2. **Filtrez par catégorie**
   - Dans le filtre "Catégorie", sélectionnez "Bordereaux 2024"
   - Vous verrez uniquement les archives de cette catégorie

3. **Modifier la catégorie d'une archive**
   - Cliquez sur ✏️ à côté de la catégorie
   - Sélectionnez la nouvelle catégorie (ex: "Bordereaux 2024")
   - Cliquez sur ✓ pour valider

4. **Télécharger un document**
   - Cliquez sur "Télécharger" à côté de l'archive
   - Le document s'ouvrira dans un nouvel onglet

---

## 🔧 Fonctionnalités Techniques

### Backend

- **Route PUT `/api/archives/:id/category`** : Met à jour uniquement la catégorie d'une archive
- **Route GET `/api/archives/categories/list`** : Liste toutes les catégories existantes
- **Colonne `category`** : Ajoutée à la table `archives` avec valeur par défaut "Non classé"

### Frontend

- **Édition inline** : Modification de catégorie directement dans le tableau
- **Filtrage dynamique** : Filtre par catégorie avec rechargement automatique
- **Téléchargement amélioré** : Utilise `fileUrl` ou l'endpoint `/download` selon le type de fichier

---

## ❓ Questions Fréquentes

### Q: Les documents uploadés en masse sont-ils disponibles pour les adhérents ?

**R:** Oui, si les documents ont été uploadés via l'onglet "Gestion des utilisateurs" avec un `user_id` spécifique, ils sont associés à cet utilisateur. Sinon, ils sont visibles dans l'onglet "Archives" pour tous les utilisateurs autorisés.

### Q: Puis-je créer de nouvelles catégories ?

**R:** Oui ! Les catégories sont créées automatiquement lorsque vous assignez une nouvelle catégorie à une archive. Il suffit de taper le nom de la nouvelle catégorie dans le menu déroulant (si vous modifiez le code) ou d'utiliser une catégorie existante.

### Q: Comment organiser mes 106 bordereaux en masse ?

**R:** Actuellement, vous devez modifier chaque archive individuellement. Une fonctionnalité de modification en masse pourra être ajoutée si nécessaire.

### Q: Le téléchargement ne fonctionne toujours pas ?

**R:** Vérifiez que :
1. Le backend est bien redémarré
2. Les fichiers ont bien un `file_content` (base64) ou un `file_path` valide
3. Les permissions de fichiers sont correctes

---

## 🐛 Dépannage

### Erreur : "Colonne category déjà existe"
- C'est normal, le script détecte automatiquement si la colonne existe déjà
- Vous pouvez continuer sans problème

### Erreur : "Token d'authentification manquant"
- Vérifiez que vous êtes bien connecté en tant qu'administrateur
- Reconnectez-vous si nécessaire

### Les catégories ne s'affichent pas
- Vérifiez que le backend est bien démarré
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que la route `/api/archives/categories/list` fonctionne

---

## 📝 Notes

- Les catégories sont stockées en texte libre (VARCHAR(100))
- La casse est respectée ("Bordereaux 2024" ≠ "bordereaux 2024")
- Les catégories vides ou NULL sont affichées comme "Non classé"

---

**Date de création :** $(date)
**Version :** 1.0

