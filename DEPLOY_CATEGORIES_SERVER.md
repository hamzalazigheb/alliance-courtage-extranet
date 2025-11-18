# 🚀 Déploiement du Système de Catégories sur le Serveur

## Objectif

Permettre de modifier les archives et leur catégorie (emplacement/dossier) sur le serveur, comme en local.

## Fonctionnalités

- ✅ Modifier la catégorie d'une archive (icône ✏️)
- ✅ Filtrer les archives par catégorie
- ✅ Organiser les archives en "dossiers" (catégories)
- ✅ Catégories par défaut : Bordereaux 2024, Protocoles, Conventions, etc.

## Déploiement

### Étape 1 : Vérifier que le code est à jour

```bash
cd ~/alliance/alliance
git pull origin main
```

### Étape 2 : Exécuter le script de déploiement

```bash
chmod +x deploy-categories-server.sh
./deploy-categories-server.sh
```

### Étape 3 : Vérifier que tout fonctionne

```bash
# Tester l'API de catégories
curl http://localhost/api/archives/categories/list

# Vérifier la colonne dans la base de données
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category
```

### Étape 4 : Rebuild du frontend (si nécessaire)

Si les modifications dans `src/FileManagementPage.tsx` et `src/api.js` ne sont pas encore déployées :

```bash
# Option 1 : Depuis votre machine locale
# Build et copier
npm run build
scp -r dist/* ubuntu@13.38.115.36:~/alliance/alliance/dist/
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# Option 2 : Si vous avez npm sur le serveur (dans un conteneur)
docker exec alliance-courtage-extranet npm run build
```

## Vérification

### Test 1 : Vérifier la colonne category

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category
```

Résultat attendu : Une ligne avec "category"

### Test 2 : Vérifier les catégories

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category;"
```

### Test 3 : Tester l'API

```bash
# Liste des catégories
curl http://localhost/api/archives/categories/list

# Mettre à jour une catégorie (remplacer 1 par un ID réel et TOKEN par votre token)
curl -X PUT \
  -H "x-auth-token: VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "Bordereaux 2024"}' \
  http://localhost/api/archives/1/category
```

### Test 4 : Interface Web

1. Se connecter en tant qu'admin : `http://13.38.115.36/manage`
2. Aller dans "Gestion des Archives"
3. Vérifier que :
   - La colonne "Catégorie" est visible
   - L'icône ✏️ est présente à côté de chaque archive
   - Le filtre "Catégorie" fonctionne en haut de la page

## Utilisation

### Modifier la catégorie d'une archive

1. Dans "Gestion des Archives"
2. Cliquer sur ✏️ à côté de la catégorie d'une archive
3. Sélectionner la nouvelle catégorie (ex: "Bordereaux 2024")
4. Cliquer sur ✓ pour valider

### Filtrer par catégorie

1. Utiliser le filtre "Catégorie" en haut de la page
2. Sélectionner une catégorie (ex: "Bordereaux 2024")
3. Seules les archives de cette catégorie s'affichent

## Dépannage

### Problème : La colonne category n'existe pas

```bash
# Créer manuellement
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE archives ADD COLUMN category VARCHAR(100) DEFAULT 'Non classé' AFTER type;"
```

### Problème : L'icône ✏️ n'apparaît pas

- Vérifier que le frontend est à jour (rebuild nécessaire)
- Vider le cache du navigateur (Ctrl+Shift+R)
- Vérifier la console du navigateur pour les erreurs

### Problème : L'API ne répond pas

```bash
# Vérifier les logs du backend
docker logs alliance-courtage-backend --tail 50

# Redémarrer le backend
docker restart alliance-courtage-backend
```

## Commandes Rapides

```bash
# Déploiement complet
cd ~/alliance/alliance
git pull origin main
chmod +x deploy-categories-server.sh
./deploy-categories-server.sh

# Vérification
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) FROM archives WHERE category IS NOT NULL GROUP BY category;"
```

---

**Note :** Après le déploiement, les utilisateurs doivent vider le cache de leur navigateur (Ctrl+Shift+R) pour voir les nouvelles fonctionnalités.

