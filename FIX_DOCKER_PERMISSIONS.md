# 🔧 Correction Permissions Docker

## ⚡ Solution Rapide

Votre utilisateur `ubuntu` n'est pas dans le groupe `docker`. Voici comment corriger :

### Option 1 : Ajouter au Groupe et Reconnecter (Recommandé)

```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Se déconnecter et reconnecter
exit
```

**Puis dans Termius, reconnectez-vous et relancez :**
```bash
cd ~/alliance
./deploy.sh
```

### Option 2 : Appliquer Immédiatement (Sans Déconnexion)

```bash
# Ajouter au groupe
sudo usermod -aG docker $USER

# Appliquer les changements immédiatement
newgrp docker

# Vérifier
docker ps
```

**Si ça fonctionne, continuez :**
```bash
cd ~/alliance
./deploy.sh
```

---

## ✅ Vérification

Après la correction, vérifier :

```bash
# Vérifier que vous êtes dans le groupe docker
groups | grep docker

# Vérifier Docker
docker ps

# Si ça fonctionne, vous êtes prêt !
```

---

## 🚀 Continuer le Déploiement

Une fois les permissions corrigées :

```bash
cd ~/alliance
./deploy.sh
```

Le script devrait maintenant fonctionner correctement !

