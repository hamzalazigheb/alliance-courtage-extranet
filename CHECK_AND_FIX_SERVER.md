# 🔍 Vérifier et corriger la structure de la base de données sur le serveur

## 📋 Étape 1 : Vérifier la structure actuelle sur le serveur

Exécutez ces commandes **sur votre serveur** pour voir ce qui manque :

```bash
cd ~/prod
git pull origin deploy-new-version
cd backend/scripts
chmod +x check-server-structure.sh
./check-server-structure.sh
```

Ce script va afficher :
- ✅ pour les tables/colonnes qui existent
- ❌ pour les tables/colonnes manquantes

## 📋 Étape 2 : Exécuter la migration complète

Si vous voyez des ❌, exécutez le script de correction :

```bash
chmod +x fix-database.sh
./fix-database.sh
```

Ce script va créer automatiquement :
- ✅ Toutes les tables manquantes (23 tables au total)
- ✅ Toutes les colonnes manquantes dans `users` et `archives`

## 📊 Tables qui seront créées

Le script `fix-database.sh` crée maintenant **TOUTES** les tables de votre structure locale :

1. ✅ `archives` (avec colonnes `assurance`, `uploaded_by_prenom`, `uploaded_by_nom`)
2. ✅ `assurances`
3. ✅ `bordereaux`
4. ✅ `cms_content` ⬅️ **NOUVEAU**
5. ✅ `favoris`
6. ✅ `file_permissions` ⬅️ **NOUVEAU**
7. ✅ `financial_documents`
8. ✅ `financial_products`
9. ✅ `formations`
10. ✅ `news`
11. ✅ `notifications`
12. ✅ `partners` (avec `logo_content`)
13. ✅ `partner_contacts`
14. ✅ `partner_documents`
15. ✅ `password_reset_requests`
16. ✅ `product_performances`
17. ✅ `product_reservations`
18. ✅ `reglementaire_documents` ⬅️ **NOUVEAU**
19. ✅ `reglementaire_folders` ⬅️ **NOUVEAU**
20. ✅ `simulators`
21. ✅ `simulator_usage`
22. ✅ `users` (avec toutes les colonnes : `denomination_sociale`, `telephone`, `code_postal`, `validite_date`)
23. ✅ `user_sessions`

## 📋 Étape 3 : Vérifier après migration

Après avoir exécuté `fix-database.sh`, relancez la vérification :

```bash
./check-server-structure.sh
```

Tous les éléments devraient maintenant afficher ✅.

## 📋 Étape 4 : Redémarrer le backend

```bash
cd ~/prod/backend
sudo docker-compose restart backend
```

## 📋 Étape 5 : Vérifier les logs

```bash
sudo docker logs --tail 100 alliance-courtage-backend | grep -i "error\|ER_NO_SUCH_TABLE\|ER_BAD_FIELD_ERROR"
```

Il ne devrait plus y avoir d'erreurs de tables ou colonnes manquantes.

## ✅ Vérification finale

Testez ces endpoints dans votre navigateur :

- `http://votre-ip/api/favoris` - devrait retourner `[]` ou des données
- `http://votre-ip/api/simulators/usage` - devrait retourner `[]` ou des statistiques
- `http://votre-ip/api/structured-products/reservations/all` - devrait retourner `[]` ou des réservations
- `http://votre-ip/api/formations?year=2025` - devrait retourner `[]` ou des formations
- `http://votre-ip/api/users` - devrait retourner la liste des utilisateurs

Si tous ces endpoints fonctionnent sans erreur 500, la migration est réussie ! 🎉

## 🔧 Si vous avez besoin d'aide

Si le script échoue ou si vous voyez encore des erreurs, partagez-moi :
1. Le résultat de `./check-server-structure.sh`
2. Les logs du backend : `sudo docker logs --tail 50 alliance-courtage-backend`
3. Toute erreur spécifique que vous rencontrez

Je pourrai alors vous aider à résoudre le problème spécifique.

