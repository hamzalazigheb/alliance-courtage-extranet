# 🔐 Récupération de Mot de Passe Admin - Guide Complet

## 🚨 Situation : Admin a Oublié son Mot de Passe

Si un administrateur oublie son mot de passe dans `/manage`, voici les solutions disponibles.

---

## 📋 Solutions Disponibles

### ✅ **Solution 1 : Demande de Réinitialisation (Recommandée)**

Cette solution fonctionne si **au moins un autre admin est disponible**.

#### Étapes :

1. **Sur la page de login** (`http://localhost:5173/`), cliquez sur **"Mot de passe oublié ?"**

2. **Entrez votre email** admin (ex: `admin@alliance-courtage.fr`)

3. **Validez la demande** - Un message de confirmation apparaîtra

4. **Un autre admin** doit :
   - Se connecter à `/manage`
   - Aller dans l'onglet **"Utilisateurs"**
   - Section **"Demandes de Réinitialisation"**
   - Cliquer sur la demande correspondante
   - Définir un nouveau mot de passe
   - Vous communiquer le nouveau mot de passe

#### ⚠️ Limitation :
- **Nécessite qu'un autre admin soit disponible et connecté**
- Si TOUS les admins ont oublié leur mot de passe, cette solution ne fonctionne pas

---

### ✅ **Solution 2 : Script de Réinitialisation d'Urgence (BACKUP)**

Cette solution fonctionne même si **TOUS les admins ont oublié leur mot de passe**.

#### 📍 Localisation du Script :
```
backend/scripts/resetAdminPassword.js
```

#### Étapes pour Utiliser le Script :

1. **Ouvrir un terminal** dans le dossier `backend/`

2. **Exécuter le script** :
```bash
cd backend
node scripts/resetAdminPassword.js
```

3. **Le script va** :
   - Se connecter à la base de données
   - Réinitialiser le mot de passe de l'admin par défaut
   - Afficher les nouvelles informations de connexion

4. **Nouveau mot de passe** : `admin123` (par défaut)

5. **Se connecter** avec :
   - Email : `admin@alliance-courtage.fr`
   - Mot de passe : `admin123`

#### ⚙️ Personnaliser le Script :

Si vous voulez changer l'email ou le mot de passe par défaut, éditez `backend/scripts/resetAdminPassword.js` :

```javascript
// Ligne 19 - Changer le nouveau mot de passe
const newPassword = 'VOTRE_NOUVEAU_MOT_DE_PASSE';

// Ligne 27 - Changer l'email admin (si différent)
await connection.query(
  'UPDATE users SET password = ? WHERE email = ?',
  [hashedPassword, 'VOTRE_EMAIL_ADMIN']
);
```

#### ⚠️ Sécurité :
- ⚠️ Ce script réinitialise le mot de passe **sans vérification**
- ⚠️ À utiliser **uniquement en cas d'urgence**
- ⚠️ **Changez le mot de passe immédiatement** après connexion
- ⚠️ Ne partagez pas ce script avec des utilisateurs non autorisés

---

### ✅ **Solution 3 : Réinitialisation via Base de Données Directement**

Si vous avez un accès direct à la base de données MySQL :

#### Étapes :

1. **Se connecter à MySQL** :
```bash
mysql -u root -p alliance_courtage
```

2. **Hacher un nouveau mot de passe** :
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('VOTRE_NOUVEAU_MOT_DE_PASSE', 10).then(hash => console.log(hash));"
```

3. **Mettre à jour dans MySQL** :
```sql
UPDATE users 
SET password = 'LE_HASH_GENERE' 
WHERE email = 'admin@alliance-courtage.fr' AND role = 'admin';
```

4. **Vérifier** :
```sql
SELECT id, email, role FROM users WHERE email = 'admin@alliance-courtage.fr';
```

5. **Se connecter** avec le nouveau mot de passe

---

## 🔄 Flux de Récupération Recommandé

```
┌─────────────────────────────────────────┐
│ Admin oublie son mot de passe            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Essayer Solution 1 : Demande normale      │
│ (Si un autre admin est disponible)       │
└──────────────┬──────────────────────────┘
               │
               ├─► ✅ Succès → Nouveau mot de passe
               │
               └─► ❌ Échec (tous les admins bloqués)
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Solution 2 : Script d'urgence           │
│ node scripts/resetAdminPassword.js       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Se connecter avec le mot de passe reset  │
│ (admin123 par défaut)                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ ⚠️ IMPORTANT : Changer le mot de passe   │
│ immédiatement dans /manage               │
└─────────────────────────────────────────┘
```

---

## 📝 Améliorations à Implémenter (Recommandées)

### 1. **Page Dédiée "Mot de Passe Oublié"**

Créer une page séparée avec instructions détaillées :
- URL : `/forgot-password` ou `/#forgot-password`
- Instructions claires
- Statut de la demande
- Contact d'urgence

### 2. **Réinitialisation Automatique pour Admins**

Ajouter une route spéciale avec :
- Clé secrète configurée en variable d'environnement
- Email de vérification
- Réinitialisation automatique sans intervention admin

### 3. **Notifications Email**

Envoyer un email automatique à tous les admins lors d'une demande de reset.

### 4. **Compte de Secours**

Créer un compte admin de secours avec :
- Email séparé et sécurisé
- Mot de passe stocké de manière sécurisée
- Utilisé uniquement en cas d'urgence

---

## 🛠️ Script de Réinitialisation (Code Complet)

Le script actuel se trouve dans `backend/scripts/resetAdminPassword.js` :

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

async function resetAdminPassword() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL');

    // Nouveau mot de passe
    const newPassword = 'admin123'; // ⚠️ Changez après connexion !

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe admin
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ? AND role = "admin"',
      [hashedPassword, 'admin@alliance-courtage.fr']
    );

    console.log('\n✅ Admin password has been reset!');
    console.log('=====================================');
    console.log('Email: admin@alliance-courtage.fr');
    console.log(`Password: ${newPassword}`);
    console.log('\n🔐 You can now login with these credentials');
    console.log('⚠️  IMPORTANT: Change password immediately after login!');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
```

---

## 🔒 Bonnes Pratiques de Sécurité

### ✅ À FAIRE :

1. **Changer le mot de passe** immédiatement après réinitialisation
2. **Utiliser un mot de passe fort** (min 12 caractères, mixte)
3. **Ne pas partager** les mots de passe entre admins
4. **Activer l'authentification à deux facteurs** (si disponible)
5. **Conserver un backup** du script de réinitialisation

### ❌ À ÉVITER :

1. ❌ Partager le script de réinitialisation avec des non-admins
2. ❌ Laisser le mot de passe par défaut (`admin123`) en production
3. ❌ Utiliser des mots de passe simples ou communs
4. ❌ Oublier de changer le mot de passe après reset
5. ❌ Stocker les mots de passe en clair dans la base

---

## 📞 Support d'Urgence

Si aucune solution ne fonctionne :

1. **Vérifier la connexion à la base de données**
2. **Vérifier que le script a les bonnes permissions**
3. **Vérifier les variables d'environnement** (`.env` ou `config.env`)
4. **Consulter les logs** backend pour erreurs

### Commandes de Diagnostic :

```bash
# Vérifier la connexion MySQL
mysql -u root -p -e "USE alliance_courtage; SELECT COUNT(*) FROM users WHERE role='admin';"

# Vérifier les variables d'environnement
cat backend/.env
# ou
cat backend/config.env

# Vérifier les logs backend
tail -f backend/server.log
```

---

## 📌 Résumé Rapide

| Situation | Solution | Commande |
|-----------|----------|----------|
| **Autre admin disponible** | Demande normale | Page login → "Mot de passe oublié" |
| **Tous admins bloqués** | Script d'urgence | `node backend/scripts/resetAdminPassword.js` |
| **Accès DB direct** | SQL direct | `UPDATE users SET password = ? WHERE email = ?` |

---

## ✅ Checklist de Récupération

- [ ] Essayer la demande normale (si possible)
- [ ] Utiliser le script de réinitialisation
- [ ] Se connecter avec le nouveau mot de passe
- [ ] **CHANGER le mot de passe immédiatement**
- [ ] Vérifier que le nouveau mot de passe fonctionne
- [ ] Documenter le nouveau mot de passe de manière sécurisée
- [ ] Informer les autres admins si nécessaire

---

**⚠️ IMPORTANT** : En production, assurez-vous d'avoir plusieurs admins actifs pour éviter les situations de blocage complet !

