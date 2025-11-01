# ⚡ Termius - Guide Express (5 Minutes)

## 🚀 Déploiement Rapide avec Termius

---

## 1️⃣ Installer Termius

1. Aller sur : https://termius.com/
2. Télécharger pour Windows/Mac
3. Installer et ouvrir

---

## 2️⃣ Importer la Clé SSH

1. **Keychain** → **New Key**
2. **Name** : `alliance-key`
3. **Load** → Sélectionner votre fichier `.pem`
4. **Save**

---

## 3️⃣ Ajouter le Serveur

1. **Hosts** → **New Host**
2. Remplir :
   - **Label** : `Alliance Server`
   - **Address** : `VOTRE_IP`
   - **Username** : `ubuntu`
   - **Port** : `22`
   - **Key** : Sélectionner `alliance-key`
3. **Save**

---

## 4️⃣ Se Connecter

1. **Double-cliquer** sur le serveur dans la liste
2. Taper `yes` si demandé

---

## 5️⃣ Cloner et Déployer

Dans Termius, copier-coller ces commandes :

```bash
sudo mkdir -p /var/www/alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage
cd /var/www/alliance-courtage
git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git .
chmod +x deploy.sh
./deploy.sh
```

**Attendre 5-10 minutes** ⏱️

---

## 6️⃣ Vérifier

```bash
docker ps
curl http://localhost:3001/api/health
```

---

## 7️⃣ Accéder au Site

**Ouvrir dans le navigateur :**
```
http://VOTRE_IP
```

**Login :** `admin@alliance-courtage.fr` / `password`

---

## ✅ C'est Terminé !

**Astuce :** Créer un **Snippet** dans Termius avec ces commandes pour les réutiliser !

---

**🎉 Bon déploiement avec Termius !**

