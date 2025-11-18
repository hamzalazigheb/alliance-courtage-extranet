# 📊 Guide pour Voir les Tables et Données de Production

Ce guide vous explique comment visualiser toutes les tables et données dans votre conteneur MySQL de production.

## 🚀 Méthodes Rapides

### Option 1 : Script Shell (Recommandé)

Sur votre serveur Ubuntu :

```bash
cd backend/scripts
chmod +x viewProductionTables.sh
./viewProductionTables.sh
```

### Option 2 : Commandes Docker Directes

#### Lister toutes les tables

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SHOW TABLES;"
```

#### Voir le nombre de lignes par table

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Lignes',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Taille (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage'
ORDER BY TABLE_NAME;
"
```

#### Voir les données d'une table spécifique

```bash
# Voir toutes les données (peut être long)
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM nom_table;"

# Voir les 10 premières lignes
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM nom_table LIMIT 10;"

# Voir avec formatage
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM nom_table LIMIT 10\G"
```

#### Voir la structure d'une table

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "DESCRIBE nom_table;"
```

### Option 3 : Script Node.js Interactif

```bash
cd backend
npm run show-prod-data
```

Ce script vous permet de :
- Voir toutes les tables avec le nombre de lignes
- Choisir une table pour voir ses données
- Voir la structure de toutes les tables
- Naviguer interactivement

## 📋 Exemples de Commandes Utiles

### Voir toutes les tables

```bash
docker exec alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SHOW TABLES;"
```

### Compter les lignes de toutes les tables

```bash
docker exec alliance-courtage-mysql mysql -u root -p alliance_courtage -e "
SELECT 
    TABLE_NAME,
    TABLE_ROWS
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage'
ORDER BY TABLE_ROWS DESC;
"
```

### Voir les données d'une table spécifique (ex: users)

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM users LIMIT 10;"
```

### Voir les partenaires avec leurs contacts et documents

```bash
# Partenaires
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT id, nom, category, is_active FROM partners;"

# Contacts partenaires
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM partner_contacts;"

# Documents partenaires
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT id, partner_id, title, document_type FROM partner_documents;"
```

### Exporter toutes les données en SQL

```bash
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > backup_all_data_$(date +%Y%m%d_%H%M%S).sql
```

### Exporter une table spécifique

```bash
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage nom_table > table_nom_table_$(date +%Y%m%d_%H%M%S).sql
```

## 🔍 Tables Importantes à Vérifier

### Tables principales

- `users` - Utilisateurs de l'application
- `partners` - Partenaires COA et CIF
- `partner_contacts` - Contacts des partenaires
- `partner_documents` - Documents des partenaires
- `archives` - Archives
- `bordereaux` - Bordereaux comptables
- `financial_documents` - Documents financiers
- `formations` - Formations
- `notifications` - Notifications

### Tables de configuration

- `cms_content` - Contenu CMS
- `assurances` - Assurances
- `financial_products` - Produits financiers
- `structured_products` - Produits structurés

## 💡 Astuces

### Formatage des résultats

Utilisez `\G` à la fin de la requête pour un format vertical :
```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM users LIMIT 1\G"
```

### Sauvegarder les résultats dans un fichier

```bash
docker exec alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT * FROM users;" > users_data.txt
```

### Voir uniquement certaines colonnes

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SELECT id, nom, email FROM users LIMIT 10;"
```

## 🔒 Sécurité

⚠️ **Important** :
- Ne partagez jamais les mots de passe
- Ne modifiez pas les données directement en production
- Faites toujours un backup avant toute modification
- Utilisez `SELECT` uniquement pour visualiser, pas `UPDATE` ou `DELETE`


