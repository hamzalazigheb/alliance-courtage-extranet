# 🔐 Authentification avec Base de Données

Votre application est maintenant connectée à la base de données MySQL !

## ✅ Ce qui a été fait :

1. **Backend API opérationnel** sur http://localhost:3001
2. **Base de données MySQL initialisée** avec les tables nécessaires
3. **Frontend connecté à l'API** pour l'authentification
4. **Utilisateur admin créé** dans la base de données

## 🚀 Comment tester :

### 1. Démarrer le backend (déjà fait) :
```bash
cd backend
npm run dev
```

### 2. Démarrer le frontend :
```bash
# Dans le dossier racine
npm run dev
```

### 3. Connectez-vous avec :
- **Email** : `admin@alliance-courtage.fr`
- **Mot de passe** : `password`
- **Rôle** : Admin

## 📊 Utilisateurs dans la base de données :

### Utilisateur Admin :
- Email : admin@alliance-courtage.fr
- Mot de passe : password
- Nom : Admin Alliance
- Role : admin

### Ajouter plus d'utilisateurs :

Vous pouvez ajouter des utilisateurs via :
1. **L'interface admin** (une fois connecté)
2. **L'API directement** :
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -H "x-auth-token: VOTRE_TOKEN" \
  -d '{
    "email": "nouveau@example.com",
    "password": "motdepasse",
    "nom": "Nom",
    "prenom": "Prénom",
    "role": "broker"
  }'
```

## 🔑 Comment ça fonctionne :

1. L'utilisateur saisit son email et mot de passe
2. Le frontend envoie une requête POST à `/api/auth/login`
3. Le backend vérifie les credentials dans MySQL
4. Si valides, le backend renvoie un JWT token
5. Le token est stocké dans localStorage
6. Le token est envoyé avec chaque requête API

## 🔍 Vérifier la connexion :

Testez l'API directement :
```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alliance-courtage.fr","password":"password"}'
```

## 📝 Structure de la base de données :

### Table users :
- id (PK)
- email (unique)
- password (hashé avec bcrypt)
- nom
- prenom
- role (admin/broker/client)
- is_active
- created_at
- updated_at

## 🎉 Résultat :

Maintenant, quand vous vous connectez depuis l'interface :
- ✅ Les credentials sont vérifiés dans MySQL
- ✅ Un JWT token est généré
- ✅ La session est persistée
- ✅ Les rôles et permissions sont gérés
- ✅ Plus de connexion temporaire !









