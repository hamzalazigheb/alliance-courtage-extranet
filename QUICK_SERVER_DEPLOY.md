# ⚡ Déploiement Rapide sur Serveur - Guide Express

## 🎯 En 5 Minutes

### 1️⃣ Se Connecter au Serveur

```bash
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP_SERVEUR
```

**Windows PowerShell :**
```powershell
ssh -i "C:\Users\Hamza\Downloads\alliance-key.pem" ubuntu@15.237.236.9
```

---

### 2️⃣ Préparer le Serveur

```bash
# Mettre à jour
sudo apt update

# Installer Git si nécessaire
sudo apt install git -y
```

---

### 3️⃣ Cloner le Projet

```bash
# Créer le dossier
sudo mkdir -p /var/www/alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage

# Cloner
cd /var/www/alliance-courtage
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .
```

---

### 4️⃣ Déployer

```bash
# Rendre exécutable
chmod +x deploy.sh

# Déployer
./deploy.sh
```

**⏱️ Attendre 5-10 minutes** pendant que le script installe et configure tout.

---

### 5️⃣ Vérifier

```bash
# Vérifier les containers
docker ps

# Devrait afficher 3 containers :
# - alliance-courtage-mysql
# - alliance-courtage-backend  
# - alliance-courtage-extranet

# Tester l'API
curl http://localhost:3001/api/health
```

---

### 6️⃣ Accéder au Site

Ouvrir dans votre navigateur :
- **http://VOTRE_IP_SERVEUR**
- **Login Admin :** `admin@alliance-courtage.fr` / `password`

---

## 🔧 Si le Script Demande de se Reconnecter

```bash
# 1. Se déconnecter
exit

# 2. Se reconnecter
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP

# 3. Relancer
cd /var/www/alliance-courtage
./deploy.sh
```

---

## 📝 Commandes Utiles

```bash
# Voir les logs
docker logs -f alliance-courtage-backend

# Redémarrer
cd /var/www/alliance-courtage/backend
docker compose restart

# Mettre à jour le code
cd /var/www/alliance-courtage
git pull
./deploy.sh
```

---

## ✅ Checklist

- [ ] SSH fonctionne
- [ ] Projet cloné
- [ ] `./deploy.sh` exécuté
- [ ] Site accessible
- [ ] Login fonctionne

---

**🚀 C'est prêt !**

