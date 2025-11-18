# 📥 Récupérer le Code depuis GitHub sur le Serveur de Production

Ce guide vous explique comment récupérer les dernières modifications depuis GitHub sur votre serveur Ubuntu.

## 🔍 Situation Actuelle

Le dossier `~/alliance` n'est pas un dépôt Git. Vous devez soit :
1. Cloner le dépôt depuis GitHub
2. Ou initialiser Git dans le dossier existant

## 🚀 Option 1 : Cloner le Dépôt (Recommandé)

Si vous n'avez pas encore cloné le dépôt :

```bash
# Aller dans le dossier home
cd ~

# Cloner le dépôt
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git alliance

# Aller dans le dossier
cd alliance

# Vérifier que tout est OK
git status
```

## 🔄 Option 2 : Initialiser Git dans le Dossier Existant

Si vous avez déjà le code mais pas Git :

```bash
# Aller dans le dossier
cd ~/alliance

# Initialiser Git
git init

# Ajouter le remote
git remote add origin https://github.com/hamzalazigheb/alliance-courtage-extranet.git

# Récupérer le code
git fetch origin

# Vérifier la branche
git branch -a

# Basculer sur main
git checkout -b main origin/main

# Ou si main existe déjà
git checkout main
git pull origin main
```

## 📋 Option 3 : Vérifier si Git Existe Ailleurs

Peut-être que le dépôt Git est dans un autre dossier :

```bash
# Chercher les dossiers .git
find ~ -name ".git" -type d 2>/dev/null

# Ou chercher le dossier du projet
find ~ -name "alliance-courtage*" -type d 2>/dev/null
```

## ✅ Après Avoir Récupéré le Code

Une fois le code récupéré, vous pouvez :

1. **Créer les tables manquantes** :
```bash
cd ~/alliance/backend/scripts
chmod +x migrateProduction.sh
./migrateProduction.sh
```

2. **Redéployer avec les nouvelles fonctionnalités** :
```bash
cd ~/alliance
chmod +x redeploy.sh
./redeploy.sh
```

## 🔧 Dépannage

### Erreur "not a git repository"

Cela signifie que le dossier n'est pas un dépôt Git. Utilisez l'Option 1 ou 2 ci-dessus.

### Erreur "remote origin already exists"

```bash
# Vérifier le remote actuel
git remote -v

# Si besoin, supprimer et réajouter
git remote remove origin
git remote add origin https://github.com/hamzalazigheb/alliance-courtage-extranet.git
```

### Erreur "authentication required"

Si GitHub demande une authentification :

```bash
# Utiliser un token personnel GitHub
git remote set-url origin https://VOTRE_TOKEN@github.com/hamzalazigheb/alliance-courtage-extranet.git
```

Ou configurer SSH :
```bash
# Générer une clé SSH (si pas déjà fait)
ssh-keygen -t ed25519 -C "votre-email@example.com"

# Ajouter la clé à GitHub (copier le contenu de ~/.ssh/id_ed25519.pub)
# Puis changer l'URL du remote
git remote set-url origin git@github.com:hamzalazigheb/alliance-courtage-extranet.git
```

