# 🔧 Correction de toutes les tables manquantes

## 📋 Problème
Plusieurs tables sont manquantes dans la base de données, causant des erreurs 500 :
- `favoris` - pour les favoris utilisateur
- `simulator_usage` - pour les statistiques des simulateurs
- `product_reservations` - pour les réservations de produits structurés
- `formations` - pour les formations

## ✅ Solution : Exécuter le script de migration

### Sur le serveur, exécutez :

```bash
# 1. Aller dans le dossier du projet
cd ~/prod

# 2. Récupérer les dernières modifications
git pull origin deploy-new-version

# 3. Exécuter le script de correction complète
cd backend/scripts
chmod +x fix-database.sh
./fix-database.sh

# 4. Redémarrer le backend pour appliquer les changements
cd ~/prod/backend
sudo docker-compose restart backend

# 5. Vérifier les logs
sudo docker logs --tail 50 alliance-courtage-backend
```

### Vérification que toutes les tables sont créées :

```bash
# Vérifier toutes les tables
sudo docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;"

# Vérifier spécifiquement les nouvelles tables
sudo docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SHOW TABLES LIKE 'favoris';
SHOW TABLES LIKE 'simulator_usage';
SHOW TABLES LIKE 'product_reservations';
SHOW TABLES LIKE 'formations';
"
```

## 📊 Tables et colonnes créées par le script

Le script `fix-database.sh` crée maintenant :

### Colonnes dans `users` :
1. ✅ `validite_date` DATE NULL
2. ✅ `denomination_sociale` VARCHAR(255) NULL
3. ✅ `telephone` VARCHAR(20) NULL
4. ✅ `code_postal` VARCHAR(10) NULL

### Colonnes dans autres tables :
5. ✅ `logo_content` LONGTEXT dans `partners` (si manquante)
6. ✅ `assurance` VARCHAR(255) dans `archives` (si manquante)

### Tables créées :
7. ✅ `user_sessions` - sessions utilisateur
8. ✅ `password_reset_requests` - demandes de réinitialisation
9. ✅ `notifications` - notifications utilisateur
10. ✅ `partner_contacts` - contacts des partenaires
11. ✅ `partner_documents` - documents des partenaires
12. ✅ `favoris` - favoris utilisateur
13. ✅ `simulator_usage` - statistiques des simulateurs
14. ✅ `product_reservations` - réservations de produits
15. ✅ `formations` - formations utilisateur
16. ✅ `financial_documents` - documents financiers
17. ✅ `assurances` - assurances avec montants enveloppe

## 🔍 Vérification après exécution

### 1. Vérifier que toutes les tables existent :

```bash
sudo docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SHOW TABLES;
"
```

Vous devriez voir toutes ces tables :
- `favoris`
- `simulator_usage`
- `product_reservations`
- `formations`
- `financial_documents`
- `assurances`
- `notifications`
- `partner_contacts`
- `partner_documents`
- `user_sessions`
- `password_reset_requests`

### 2. Vérifier les colonnes dans `users` :

```bash
sudo docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SHOW COLUMNS FROM users;
"
```

Vous devriez voir :
- `validite_date`
- `denomination_sociale`
- `telephone`
- `code_postal`

### 3. Vérifier les logs du backend :

```bash
sudo docker logs --tail 50 alliance-courtage-backend | grep -i error
```

Il ne devrait plus y avoir d'erreurs `ER_NO_SUCH_TABLE` ou `ER_BAD_FIELD_ERROR`.

### 4. Tester les endpoints :

Testez ces endpoints dans votre navigateur ou avec curl :
- ✅ `/api/favoris` - devrait retourner `[]` (liste vide si aucun favori)
- ✅ `/api/simulators/usage` - devrait retourner `[]` ou des statistiques
- ✅ `/api/structured-products/reservations/all` - devrait retourner `[]`
- ✅ `/api/formations?year=2025` - devrait retourner `[]`
- ✅ `/api/users` - devrait retourner la liste des utilisateurs
- ✅ `/api/structured-products/assurances/montants` - devrait retourner les montants par assurance

Si tous ces endpoints fonctionnent sans erreur 500, la migration est réussie ! 🎉

