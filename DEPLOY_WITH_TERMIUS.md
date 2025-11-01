# 🖥️ Déploiement avec Termius - Guide Complet

## 📱 Termius - L'Application SSH La Plus Simple

Termius est disponible sur Windows, Mac, Linux, iOS et Android.

---

## 📥 Partie 1 : Installer et Configurer Termius

### Étape 1.1 : Télécharger Termius

1. **Aller sur** : https://termius.com/
2. **Télécharger** pour votre plateforme :
   - Windows : `Termius Setup.exe`
   - Mac : `Termius.dmg`
   - Ou installer depuis le Microsoft Store / App Store

### Étape 1.2 : Créer un Compte (Optionnel mais Recommandé)

1. Ouvrir Termius
2. Cliquer sur **"Sign Up"** (gratuit)
3. Créer un compte avec votre email
4. Synchroniser vos clés et hôtes entre appareils

---

## 🔑 Partie 2 : Importer Votre Clé SSH

### Étape 2.1 : Trouver Votre Clé SSH

**Pour AWS EC2 :**
- Votre fichier `.pem` téléchargé lors de la création de l'instance
- Généralement dans : `C:\Users\VotreNom\Downloads\`

**Nom typique :**
- `alliance-key.pem`
- `alliance-extranet-key.pem`
- Ou le nom que vous avez donné lors de la création

### Étape 2.2 : Importer la Clé dans Termius

1. **Ouvrir Termius**
2. **Cliquer sur "Keychain"** (icône de clé dans la barre latérale)
3. **Cliquer sur "New Key"** ou le bouton **"+"**
4. **Configurer la clé :**
   - **Name** : `alliance-server-key` (ou nom de votre choix)
   - **Type** : `RSA` (généralement)
5. **Cliquer sur "Load"** ou **"Import"**
6. **Naviguer** vers votre fichier `.pem`
   - Exemple : `C:\Users\Hamza\Downloads\alliance-key.pem`
7. **Sélectionner** le fichier et ouvrir
8. **Cliquer sur "Save"**

✅ **Votre clé est maintenant dans Termius !**

---

## 🖥️ Partie 3 : Ajouter Votre Serveur

### Étape 3.1 : Obtenir les Informations du Serveur

Vous devez avoir :
- **IP du serveur** : Exemple `15.237.236.9`
- **Nom d'utilisateur** : 
  - `ubuntu` (pour Ubuntu)
  - `ec2-user` (pour Amazon Linux)
  - `root` (pour certains serveurs)

### Étape 3.2 : Créer un Nouvel Hôte

1. **Dans Termius**, cliquer sur **"Hosts"** (icône serveur)
2. **Cliquer sur "New Host"** ou le bouton **"+"**
3. **Remplir les informations :**

   ```
   Label: Alliance Courtage Server
   Address: 15.237.236.9 (remplacez par votre IP)
   Username: ubuntu (ou ec2-user)
   Port: 22
   ```

4. **Configuration de l'authentification :**
   - **Method** : `Key`
   - **Key** : Sélectionner `alliance-server-key` (la clé que vous avez importée)
5. **Optionnel - Tags** : Ajouter `production`, `ubuntu`, etc.
6. **Cliquer sur "Save"**

✅ **Votre serveur est maintenant dans la liste !**

---

## 🔌 Partie 4 : Se Connecter au Serveur

### Étape 4.1 : Se Connecter

1. **Dans la liste "Hosts"**, trouver votre serveur
2. **Double-cliquer** dessus ou **cliquer sur l'icône de connexion**
3. **Si c'est la première connexion**, vous verrez :
   ```
   The authenticity of host '15.237.236.9' can't be established.
   Are you sure you want to continue connecting (yes/no)?
   ```
4. **Taper** `yes` et appuyer sur **Enter**

✅ **Vous êtes maintenant connecté !**

Vous devriez voir quelque chose comme :
```
Welcome to Ubuntu 22.04 LTS...
ubuntu@ip-15-237-236-9:~$
```

---

## 📦 Partie 5 : Préparer le Serveur (Première Fois)

### Étape 5.1 : Mettre à Jour le Système

Dans Termius, tapez :

```bash
sudo apt update && sudo apt upgrade -y
```

### Étape 5.2 : Installer Git (si nécessaire)

```bash
git --version
```

Si Git n'est pas installé :
```bash
sudo apt install git -y
```

---

## 📥 Partie 6 : Cloner le Projet GitHub

### Étape 6.1 : Créer le Dossier de Déploiement

```bash
# Créer le dossier avec permissions
sudo mkdir -p /var/www/alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage
```

### Étape 6.2 : Aller dans le Dossier

```bash
cd /var/www/alliance-courtage
```

### Étape 6.3 : Cloner le Projet

```bash
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .
```

**Note :** Le `.` à la fin clone directement dans le dossier actuel.

**Vous devriez voir :**
```
Cloning into '.'...
remote: Enumerating objects...
...
```

### Étape 6.4 : Vérifier que les Fichiers sont Là

```bash
ls -la
```

**Vous devriez voir :**
- `deploy.sh`
- `package.json`
- `backend/`
- `src/`
- etc.

---

## 🚀 Partie 7 : Déployer l'Application

### Étape 7.1 : Rendre le Script Exécutable

```bash
chmod +x deploy.sh
```

### Étape 7.2 : Exécuter le Déploiement

```bash
./deploy.sh
```

### Étape 7.3 : Suivre la Progression

Vous verrez le script s'exécuter étape par étape :

```
🚀 Déploiement Alliance Courtage Extranet
==========================================

📋 Étape 1: Vérification des prérequis...
🔍 Checking prerequisites...
✅ Docker est installé
✅ Docker Compose est installé

📋 Étape 2: Configuration des variables d'environnement...
✅ Fichier .env créé avec des valeurs par défaut
✅ Fichier config.env créé

📋 Étape 3: Arrêt des containers existants...

📋 Étape 4: Build et démarrage du backend...
⏳ Attente que MySQL soit prêt...

...
```

**⏱️ Temps estimé :** 5-10 minutes

### Étape 7.4 : Si le Script Demande de se Reconnecter

Si vous voyez :
```
⚠️  Vous devrez peut-être vous déconnecter/reconnecter
```

**Faites :**
1. **Déconnexion** : Tapez `exit` dans Termius
2. **Reconnexion** : Double-cliquez sur votre serveur dans Termius
3. **Relancer** :
   ```bash
   cd /var/www/alliance-courtage
   ./deploy.sh
   ```

---

## ✅ Partie 8 : Vérifier le Déploiement

### Étape 8.1 : Vérifier les Containers

```bash
docker ps
```

**Vous devriez voir 3 containers :**
```
NAMES                          STATUS
alliance-courtage-mysql        Up X minutes
alliance-courtage-backend      Up X minutes
alliance-courtage-extranet     Up X minutes
```

### Étape 8.2 : Tester l'API Backend

```bash
curl http://localhost:3001/api/health
```

**Devrait retourner :** `OK` ou un JSON

### Étape 8.3 : Vérifier les Logs (si nécessaire)

```bash
# Logs backend
docker logs alliance-courtage-backend

# Logs frontend
docker logs alliance-courtage-extranet

# Logs MySQL
docker logs alliance-courtage-mysql
```

---

## 🌐 Partie 9 : Accéder au Site

### Étape 9.1 : Ouvrir dans le Navigateur

Ouvrir votre navigateur et aller sur :
```
http://VOTRE_IP_SERVEUR
```

**Exemple :**
```
http://15.237.236.9
```

### Étape 9.2 : Se Connecter

**Identifiants par défaut :**
- **Email** : `admin@alliance-courtage.fr`
- **Password** : `password`

⚠️ **Important :** Changez le mot de passe après la première connexion !

---

## 🔧 Partie 10 : Configuration Post-Déploiement

### Étape 10.1 : Configurer les Mots de Passe (IMPORTANT!)

Dans Termius, exécutez :

```bash
cd /var/www/alliance-courtage/backend
nano .env
```

**Modifiez :**
- `DB_ROOT_PASSWORD` : Mettez un mot de passe fort
- `DB_PASSWORD` : Mettez un mot de passe fort
- `JWT_SECRET` : Mettez un secret très long et unique

**Pour sauvegarder dans nano :**
1. `Ctrl+O` (sauvegarder)
2. `Enter` (confirmer)
3. `Ctrl+X` (quitter)

```bash
# Mettre à jour aussi config.env
nano config.env
# Même chose - changer les mots de passe
```

### Étape 10.2 : Redéployer avec les Nouveaux Mots de Passe

```bash
cd /var/www/alliance-courtage
./deploy.sh
```

---

## 📝 Partie 11 : Commandes Utiles dans Termius

### Ouvrir Plusieurs Onglets

**Termius permet d'ouvrir plusieurs connexions :**

1. **Clic droit** sur votre serveur dans la liste
2. **"New Tab"** ou **"Duplicate Connection"**

Utile pour :
- Voir les logs dans un onglet
- Exécuter des commandes dans un autre

### Voir les Logs en Temps Réel

**Onglet 1 :**
```bash
docker logs -f alliance-courtage-backend
```

**Onglet 2 :**
```bash
# Autres commandes
docker ps
```

### Copier/Coller

- **Copier** : `Ctrl+Shift+C` (ou sélectionner le texte)
- **Coller** : `Ctrl+Shift+V` (ou clic droit)

### Redémarrer les Services

```bash
# Redémarrer backend
cd /var/www/alliance-courtage/backend
docker compose restart

# Redémarrer frontend
docker restart alliance-courtage-extranet
```

### Mettre à Jour le Code

```bash
cd /var/www/alliance-courtage
git pull origin main
./deploy.sh
```

---

## 🎨 Astuces Termius

### 1. Organiser avec des Groupes

- Créer des **Groupes** (Folders) pour organiser vos serveurs
- Exemple : `Production`, `Staging`, `Development`

### 2. Utiliser les Tags

- Ajouter des **Tags** à vos serveurs pour les retrouver facilement
- Exemple : `ubuntu`, `docker`, `production`

### 3. Sauvegarder les Sessions

- Termius synchronise automatiquement (si compte créé)
- Vos configurations sont sauvegardées dans le cloud

### 4. Utiliser Snippets

- Créer des **Snippets** (morceaux de code réutilisables)
- Exemple : Commandes fréquentes, scripts

### 5. Utiliser Port Forwarding

- **Right-click** sur votre serveur → **"Port Forwarding"**
- Utile pour accéder à des services internes

---

## 🆘 Problèmes Courants avec Termius

### Problème : "Permission denied (publickey)"

**Solution :**
1. Vérifier que la clé est bien importée dans Keychain
2. Vérifier que la clé est sélectionnée dans la configuration de l'hôte
3. Réimporter la clé si nécessaire

### Problème : "Connection timeout"

**Solutions :**
1. Vérifier que l'IP est correcte
2. Vérifier que le port 22 est ouvert (Security Group AWS)
3. Vérifier votre connexion Internet

### Problème : La connexion se ferme automatiquement

**Solution :**
- Dans les paramètres de l'hôte, augmenter le **"Keep Alive"**
- Ou ajouter dans la config SSH : `ServerAliveInterval 60`

### Problème : Ne peut pas coller les commandes

**Solution :**
- Utiliser `Ctrl+Shift+V` (pas `Ctrl+V`)
- Ou clic droit → Paste

---

## 📋 Checklist Complète

### Avant de Commencer
- [ ] Termius installé
- [ ] Clé SSH (.pem) téléchargée
- [ ] Clé importée dans Termius Keychain
- [ ] Serveur ajouté dans Termius Hosts

### Connexion
- [ ] Connexion SSH fonctionne
- [ ] Peut exécuter des commandes

### Déploiement
- [ ] Système mis à jour
- [ ] Git installé
- [ ] Projet cloné depuis GitHub
- [ ] `deploy.sh` exécuté avec succès
- [ ] Containers démarrés

### Vérification
- [ ] `docker ps` montre 3 containers
- [ ] API répond (`curl http://localhost:3001/api/health`)
- [ ] Site accessible (`http://IP`)

### Post-Déploiement
- [ ] Mots de passe changés dans `.env`
- [ ] `config.env` mis à jour
- [ ] Redéployé avec nouveaux mots de passe

---

## 🎯 Récapitulatif Rapide

```
1. Installer Termius
2. Importer la clé SSH (.pem) dans Keychain
3. Ajouter le serveur (IP, username, clé)
4. Se connecter (double-clic)
5. Exécuter :
   sudo mkdir -p /var/www/alliance-courtage
   sudo chown -R $USER:$USER /var/www/alliance-courtage
   cd /var/www/alliance-courtage
   git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .
   chmod +x deploy.sh
   ./deploy.sh
6. Vérifier : docker ps
7. Accéder : http://VOTRE_IP
```

---

**🎉 C'est tout ! Avec Termius, c'est très simple et visuel !**

