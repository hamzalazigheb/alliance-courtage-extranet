# Alliance Courtage - Extranet

Application web pour la gestion des courtiers en assurances.

## 🚀 Déploiement sur Netlify

### Méthode 1 : Déploiement via Git (Recommandé)

1. **Poussez votre code sur GitHub/GitLab/Bitbucket**
2. **Connectez-vous à [Netlify](https://netlify.com)**
3. **Cliquez sur "New site from Git"**
4. **Sélectionnez votre repository**
5. **Configurez les paramètres de build :**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Cliquez sur "Deploy site"**

### Méthode 2 : Déploiement manuel

1. **Exécutez la commande de build :**
   ```bash
   npm run build
   ```

2. **Compressez le dossier `dist` en ZIP**

3. **Allez sur [Netlify](https://netlify.com)**

4. **Glissez-déposez le fichier ZIP sur la zone de déploiement**

### Configuration automatique

Le fichier `netlify.toml` est déjà configuré avec :
- Dossier de publication : `dist`
- Commande de build : `npm run build`
- Redirections pour SPA : toutes les routes vers `index.html`
- Version Node.js : 18

## 🛠️ Développement local

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev

# Build pour la production
npm run build
```

## 📱 Fonctionnalités

- ✅ Page de connexion sécurisée
- ✅ Dashboard principal
- ✅ Gestion des produits
- ✅ Partenaires COA et CIF
- ✅ Simulateurs fiscaux
- ✅ Rencontres Alliance Courtage
- ✅ Bibliothèque réglementaire
- ✅ Comptabilité sécurisée (2FA SMS)
- ✅ Produits structurés

## 🔐 Sécurité

- Authentification par email/mot de passe
- Page comptabilité avec authentification SMS (code test : 123456)
- Interface responsive et moderne

## 🌐 URL de déploiement

Une fois déployé, votre site sera accessible via une URL Netlify automatique :
`https://[nom-du-site].netlify.app`

Vous pourrez ensuite configurer un nom de domaine personnalisé dans les paramètres Netlify.
