# 🔍 Guide de Comparaison des Bases de Données

Ce guide vous explique comment comparer les tables entre votre base de données locale et celle de production.

## 📋 Scripts Disponibles

### 1. Lister les tables locales

Affiche toutes les tables de votre base de données locale avec le nombre de lignes.

```bash
cd backend
npm run list-tables
```

Ou directement :
```bash
node scripts/listTables.js
```

### 2. Comparer les bases de données

Compare la structure des tables entre local et production.

**Option A : Script PowerShell (Windows)**
```powershell
cd backend
.\scripts\compareDatabases.ps1
```

**Option B : Script Node.js direct**
```bash
cd backend
node scripts/compareDatabases.js
```

Avec variables d'environnement :
```bash
PROD_DB_HOST=votre-serveur.com \
PROD_DB_PORT=3306 \
PROD_DB_USER=root \
PROD_DB_PASSWORD=votre-mot-de-passe \
PROD_DB_NAME=alliance_courtage \
node scripts/compareDatabases.js
```

## 🔍 Ce que le script compare

1. **Liste des tables**
   - Tables uniquement en local
   - Tables uniquement en production
   - Tables communes

2. **Structure des tables communes**
   - Colonnes présentes dans chaque table
   - Types de données
   - Contraintes (NULL, DEFAULT, etc.)
   - Clés primaires et index

3. **Différences détectées**
   - Colonnes manquantes
   - Colonnes supplémentaires
   - Différences de types ou contraintes

## 📊 Exemple de sortie

```
🔍 Comparaison des bases de données
================================================================================

📡 Connexion à la base de données locale...
✅ Connecté à la base locale

📡 Connexion à la base de données de production...
   Host: votre-serveur.com:3306
   Database: alliance_courtage
✅ Connecté à la base de production

📊 Récupération des tables...
   Local: 25 tables
   Production: 23 tables

📋 RÉSULTATS DE LA COMPARAISON
================================================================================

⚠️  Tables uniquement en LOCAL:
   - partner_contacts
   - partner_documents

✅ Tables communes (23):
   - archives
   - assurances
   - bordereaux
   ...

🔍 Comparaison de la structure des tables communes...

⚠️  DIFFÉRENCES DÉTECTÉES:

📌 Table: users
   Colonnes uniquement en LOCAL:
      - profile_photo
   Colonnes avec différences:
      - email:
        LOCAL:     {"Type":"varchar(255)","Null":"NO"}
        PRODUCTION: {"Type":"varchar(100)","Null":"NO"}

📊 RÉSUMÉ
================================================================================
   Tables locales: 25
   Tables production: 23
   Tables communes: 23
   Tables uniquement locales: 2
   Tables uniquement production: 0
```

## 🔒 Sécurité

⚠️ **Important** : Le script demande le mot de passe de production de manière sécurisée, mais :
- Ne stocke jamais les identifiants
- Ne modifie jamais les données
- Ne fait que lire les structures

## 🛠️ Dépannage

### Erreur de connexion à la production

Vérifiez :
- Que le serveur MySQL est accessible
- Que le port n'est pas bloqué par un firewall
- Que les identifiants sont corrects
- Que l'utilisateur a les permissions nécessaires

### Erreur "Access denied"

Assurez-vous que l'utilisateur MySQL a les permissions :
```sql
GRANT SELECT ON alliance_courtage.* TO 'votre-user'@'%';
FLUSH PRIVILEGES;
```

### Tables manquantes en production

Si des tables existent en local mais pas en production :
1. Vérifiez si elles doivent être créées en production
2. Utilisez les scripts de migration appropriés
3. Ne copiez jamais directement les données sans vérification

## 📝 Notes

- Le script compare uniquement la **structure**, pas les **données**
- Les différences de données ne sont pas détectées
- Pour comparer les données, utilisez des outils comme `mysqldiff` ou `pt-table-sync`

## 🔗 Scripts associés

- `listTables.js` : Liste simple des tables
- `compareDatabases.js` : Comparaison complète
- `compareDatabases.ps1` : Wrapper PowerShell pour Windows

