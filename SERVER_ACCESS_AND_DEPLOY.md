# 🖥️ Guide : Accéder au Serveur et Déployer

## 📋 Étapes Complètes - De la Connexion au Déploiement

---

## Partie 1 : Préparer l'Accès au Serveur

### Étape 1.1 : Obtenir les Informations de Connexion

Vous devez avoir :

- ✅ **Adresse IP du serveur** (ex: `15.237.236.9`)
- ✅ **Nom d'utilisateur** (généralement `ubuntu` pour Ubuntu, `ec2-user` pour Amazon Linux)
- ✅ **Clé SSH** (fichier `.pem` pour AWS EC2, ou mot de passe)

### Étape 1.2 : Vérifier votre Clé SSH

**Pour Windows :**

- Votre clé `.pem` devrait être dans votre dossier Téléchargements ou un dossier sécurisé
- Notez le chemin complet (ex: `C:\Users\Hamza\Downloads\alliance-key.pem`)

---

## Partie 2 : Se Connecter au Serveur

### Option A : Utiliser PowerShell (Windows)

```powershell
# 1. Ouvrir PowerShell

# 2. Naviguer vers le dossier contenant votre clé
cd C:\Users\Hamza\Downloads

# 3. Se connecter (remplacez les valeurs)
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP_SERVEUR

# Exemple :
# ssh -i "alliance-key.pem" ubuntu@15.237.236.9
```

**Si vous avez une erreur de permissions sur la clé :**

```powershell
# Windows PowerShell
icacls "alliance-key.pem" /inheritance:r
icacls "alliance-key.pem" /grant:r "$env:username:R"
```

### Option B : Utiliser PuTTY (Windows - Interface Graphique)

1. **Télécharger PuTTY** : https://www.putty.org/
2. **Télécharger PuTTYgen** (pour convertir la clé .pem)
3. **Convertir la clé .pem en .ppk** :
   - Ouvrir PuTTYgen
   - Load → Sélectionner votre fichier `.pem`
   - Save private key → Sauvegarder en `.ppk`
4. **Se connecter avec PuTTY** :
   - Host Name: `ubuntu@VOTRE_IP_SERVEUR`
   - Port: `22`
   - Connection → SSH → Auth → Credentials → Browse → Sélectionner le fichier `.ppk`
   - Open

### Option C : Utiliser Termius (Recommandé - Multiplateforme)

1. **Télécharger Termius** : https://termius.com/
2. **Importer la clé** :
   - Ouvrir Termius
   - Keychain → New Key
   - Name: `alliance-server-key`
   - Load → Sélectionner votre fichier `.pem`
   - Save
3. **Ajouter le serveur** :
   - Hosts → New Host
   - Hostname: `VOTRE_IP_SERVEUR`
   - Username: `ubuntu`
   - Port: `22`
   - Authentication: Sélectionner votre clé
   - Save
4. **Se connecter** : Double-cliquer sur le serveur dans la liste

---

## Partie 3 : Première Connexion et Configuration Initiale

### Étape 3.1 : Se Connecter

```bash
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP_SERVEUR
```

**Si c'est la première fois :**

- Vous verrez un message de confirmation
- Tapez `yes` pour accepter

### Étape 3.2 : Mettre à Jour le Système

```bash
# Mettre à jour les packages
sudo apt update
sudo apt upgrade -y
```

### Étape 3.3 : Installer Git (si nécessaire)

```bash
# Vérifier si Git est installé
git --version

# Si pas installé :
sudo apt install git -y
```

---

## Partie 4 : Cloner le Projet depuis GitHub

### Étape 4.1 : Créer le Dossier de Déploiement

```bash
# Créer le dossier
sudo mkdir -p /var/www/alliance-courtage

# Donner les permissions
sudo chown -R $USER:$USER /var/www/alliance-courtage

# Aller dans le dossier
cd /var/www/alliance-courtage
```

### Étape 4.2 : Cloner le Repository GitHub

```bash
# Cloner le projet
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .

# Vérifier que les fichiers sont là
ls -la
```

**Vous devriez voir :**

- `deploy.sh`
- `package.json`
- `backend/`
- `src/`
- etc.

---

## Partie 5 : Exécuter le Déploiement

### Étape 5.1 : Rendre le Script Exécutable

```bash
# S'assurer d'être dans le bon dossier
cd /var/www/alliance-courtage

# Rendre deploy.sh exécutable
chmod +x deploy.sh
```

### Étape 5.2 : Exécuter le Déploiement

```bash
# Lancer le déploiement
./deploy.sh
```

**Le script va :**

1. ✅ Vérifier/Installer Docker
2. ✅ Vérifier/Installer Docker Compose
3. ✅ Créer les fichiers de configuration (.env, config.env)
4. ✅ Build et démarrer MySQL + Backend
5. ✅ Initialiser la base de données
6. ✅ Build et démarrer le Frontend
7. ✅ Afficher le statut final

**⏱️ Temps estimé :** 5-10 minutes selon la connexion Internet

### Étape 5.3 : Suivre la Progression

Pendant l'exécution, vous verrez :

```
🚀 Déploiement Alliance Courtage Extranet
==========================================

📋 Étape 1: Vérification des prérequis...
✅ Docker est installé
✅ Docker Compose est installé

📋 Étape 2: Configuration des variables d'environnement...
✅ Fichier .env créé avec des valeurs par défaut
✅ Fichier config.env créé

...
```

**⚠️ Note importante :** Si le script demande de vous déconnecter/reconnecter (pour les permissions Docker), faites-le puis relancez `./deploy.sh`

---

## Partie 6 : Vérifier le Déploiement

### Étape 6.1 : Vérifier les Containers

```bash
# Voir tous les containers
docker ps
```

**Vous devriez voir :**

- `alliance-courtage-mysql`
- `alliance-courtage-backend`
- `alliance-courtage-extranet`

### Étape 6.2 : Vérifier l'API Backend

```bash
# Tester l'API
curl http://localhost:3001/api/health
```

**Devrait retourner :** `OK` ou un JSON avec status

### Étape 6.3 : Accéder au Site

Ouvrir dans votre navigateur :

- **Frontend :** `http://VOTRE_IP_SERVEUR`
- **Backend API :** `http://VOTRE_IP_SERVEUR/api`

---

## Partie 7 : Configuration Post-Déploiement

### Étape 7.1 : Configurer les Mots de Passe (IMPORTANT!)

```bash
# Modifier les variables d'environnement
cd /var/www/alliance-courtage/backend
nano .env
```

**Modifiez :**

- `DB_ROOT_PASSWORD` : Mot de passe MySQL root (fort et unique)
- `DB_PASSWORD` : Mot de passe utilisateur MySQL (fort et unique)
- `JWT_SECRET` : Secret JWT (très long et aléatoire)

**Sauvegarder :** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Mettre à jour aussi config.env
nano config.env
# Même chose - mettre à jour les mots de passe
```

### Étape 7.2 : Redéployer avec les Nouveaux Mots de Passe

```bash
# Retourner à la racine
cd /var/www/alliance-courtage

# Redéployer
./deploy.sh
```

---

## Partie 8 : Commandes Utiles

### Voir les Logs

```bash
# Logs backend
docker logs -f alliance-courtage-backend

# Logs frontend
docker logs -f alliance-courtage-extranet

# Logs MySQL
docker logs -f alliance-courtage-mysql

# Tous les logs backend
cd backend
docker compose logs -f
```

### Redémarrer les Services

```bash
# Redémarrer tout
cd /var/www/alliance-courtage/backend
docker compose restart

# Redémarrer un service spécifique
docker compose restart backend
docker compose restart mysql

# Redémarrer le frontend
docker restart alliance-courtage-extranet
```

### Arrêter les Services

```bash
# Arrêter backend
cd /var/www/alliance-courtage/backend
docker compose down

# Arrêter frontend
docker stop alliance-courtage-extranet
```

### Mettre à Jour le Code

```bash
# Aller dans le dossier du projet
cd /var/www/alliance-courtage

# Récupérer les dernières modifications
git pull origin main

# Redéployer
./deploy.sh
```

---

## Partie 9 : Problèmes Courants

### Problème : "Permission denied" lors de la connexion SSH

**Solution :**

```bash
# Vérifier les permissions de la clé (sur Windows avec PowerShell)
icacls "alliance-key.pem" /inheritance:r
icacls "alliance-key.pem" /grant:r "$env:username:R"
```

### Problème : "Docker requires sudo"

**Solution :**

```bash
# Le script essaie de l'installer automatiquement
# Si ça échoue, installer manuellement :
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Déconnexion/reconnexion nécessaire
exit
# Puis se reconnecter et relancer deploy.sh
```

### Problème : "Port 80 already in use"

**Solution :**

```bash
# Vérifier ce qui utilise le port 80
sudo netstat -tlnp | grep 80

# Arrêter le service (ex: Apache)
sudo systemctl stop apache2
# ou
sudo systemctl stop nginx
```

### Problème : "MySQL ne démarre pas"

**Solution :**

```bash
# Vérifier les logs
docker logs alliance-courtage-mysql

# Vérifier que le port 3306 n'est pas utilisé
sudo netstat -tlnp | grep 3306
```

### Problème : "Cannot connect to backend"

**Solution :**

```bash
# Vérifier que le backend est démarré
docker ps | grep alliance-courtage-backend

# Vérifier les logs
docker logs alliance-courtage-backend

# Vérifier la connexion MySQL
docker exec alliance-courtage-mysql mysqladmin ping -h localhost -u root -p
```

---

## Partie 10 : Checklist Complète

### Avant de Commencer

- [ ] Adresse IP du serveur
- [ ] Clé SSH (.pem) ou mot de passe
- [ ] Nom d'utilisateur (ubuntu/ec2-user)
- [ ] Serveur accessible depuis Internet

### Connexion

- [ ] SSH fonctionne
- [ ] Système mis à jour
- [ ] Git installé

### Déploiement

- [ ] Projet cloné depuis GitHub
- [ ] `deploy.sh` rendu exécutable
- [ ] Script exécuté avec succès
- [ ] Containers démarrés

### Vérification

- [ ] Frontend accessible (`http://IP`)
- [ ] Backend répond (`/api/health`)
- [ ] Login fonctionne

### Sécurité

- [ ] Mots de passe changés dans `.env`
- [ ] JWT_SECRET changé
- [ ] Firewall configuré (optionnel mais recommandé)

---

## 📝 Récapitulatif Rapide

```bash
# 1. Se connecter
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP

# 2. Installer Git (si nécessaire)
sudo apt update && sudo apt install git -y

# 3. Cloner le projet
sudo mkdir -p /var/www/alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage
cd /var/www/alliance-courtage
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .

# 4. Déployer
chmod +x deploy.sh
./deploy.sh

# 5. Vérifier
docker ps
curl http://localhost:3001/api/health

# 6. Accéder au site
# Ouvrir : http://VOTRE_IP
```

---

**🎉 C'est tout ! Votre application sera déployée automatiquement !**
