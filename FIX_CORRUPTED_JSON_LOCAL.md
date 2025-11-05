# 🔧 Réparer le JSON CMS Corrompu en Local

## ❌ Problème
Erreur `SyntaxError: Unterminated string in JSON` lorsque le JSON dans la base de données est corrompu (probablement à cause d'une image base64 très longue).

## ✅ Solution 1: Utiliser le Script de Réparation (Recommandé)

### Étape 1: Vérifier que vous êtes dans le dossier backend
```powershell
cd backend
```

### Étape 2: Créer un fichier `.env` si nécessaire
Vérifiez que vous avez un fichier `.env` ou `config.env` avec :
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=alliance_courtage
```

### Étape 3: Exécuter le script de réparation
```powershell
node scripts/fixCorruptedCMS.js
```

Le script va :
- ✅ Vérifier toutes les entrées CMS (`rencontres` et `gamme-financiere`)
- ✅ Détecter les JSON corrompus
- ✅ Réparer automatiquement en préservant les données valides
- ✅ Réinitialiser l'image si elle est trop longue (>50KB)

## ✅ Solution 2: Réparation Manuelle via SQL

Si vous préférez réparer manuellement :

### Pour Gamme Financière
```sql
UPDATE cms_content 
SET content = '{"title":"Gamme Financière","subtitle":"Découvrez notre sélection de produits financiers","description":"Explorez notre gamme complète de produits financiers conçus pour répondre à vos besoins d\'investissement et de gestion patrimoniale.","headerImage":""}'
WHERE page = 'gamme-financiere';
```

### Pour Rencontres
```sql
UPDATE cms_content 
SET content = '{"title":"RENCONTRES","subtitle":"Espace dédié aux rencontres et échanges de la communauté Alliance Courtage","headerImage":"","introText":"","upcomingMeetings":[],"historicalMeetings":[]}'
WHERE page = 'rencontres';
```

## ✅ Solution 3: Depuis le Frontend (Réinitialiser)

1. Aller dans `/manage` → Onglet **CMS**
2. Cliquer sur **"Rencontres"** ou **"Gamme Financière"**
3. **Vider le champ "Image d'en-tête"** (supprimer le contenu base64)
4. Sauvegarder

## 🔍 Vérification

Après réparation, rechargez la page. L'erreur ne devrait plus apparaître, et les valeurs par défaut s'afficheront.

## 📝 Notes

- ⚠️ **L'image sera perdue** si elle est corrompue (c'est normal)
- ✅ **Le texte sera préservé** si valide (titre, sous-titre, description, etc.)
- ✅ **Les erreurs ne s'afficheront plus** dans la console (gestion silencieuse)

## 🚀 Test Rapide

Après réparation, tester :
1. Ouvrir `http://localhost:5173`
2. Aller sur la page "Rencontres" ou "Gamme Financière"
3. Vérifier qu'il n'y a **plus d'erreur** dans la console (F12)
4. La page devrait s'afficher avec les valeurs par défaut

