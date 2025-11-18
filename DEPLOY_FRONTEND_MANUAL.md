# 📤 Déploiement Manuel du Frontend

## Problème

Le dossier `dist/` n'existe pas sur le serveur. Il faut d'abord copier les fichiers depuis votre machine Windows.

## Solution Étape par Étape

### Étape 1 : Sur votre machine Windows

#### Option A : Utiliser SCP (si disponible)

```powershell
# PowerShell ou Git Bash
cd C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr

# Créer le dossier et copier
scp -r dist/* ubuntu@13.38.115.36:~/alliance/alliance/dist/
```

#### Option B : Utiliser WinSCP (Recommandé si SCP ne fonctionne pas)

1. **Télécharger WinSCP** : https://winscp.net/
2. **Se connecter** :
   - Host name: `13.38.115.36`
   - User name: `ubuntu`
   - Password: (votre mot de passe)
3. **Naviguer** vers `~/alliance/alliance/`
4. **Créer** un dossier `dist/` s'il n'existe pas
5. **Copier** tout le contenu de `dist/` (depuis votre machine) dans ce dossier

#### Option C : Utiliser FileZilla

1. **Télécharger FileZilla** : https://filezilla-project.org/
2. **Se connecter** (mêmes identifiants que WinSCP)
3. **Naviguer** et **copier** comme avec WinSCP

### Étape 2 : Sur le serveur

Une fois les fichiers copiés, exécutez :

```bash
cd ~/alliance/alliance

# Vérifier que les fichiers sont là
ls -la dist/
# Vous devriez voir : index.html, assets/, etc.

# Copier dans le conteneur Docker
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# Vérifier dans le conteneur
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/

# Redémarrer le conteneur
docker restart alliance-courtage-extranet

# Vérifier les logs
docker logs alliance-courtage-extranet --tail 20
```

## Vérification

1. **Vider le cache du navigateur** : `Ctrl+Shift+R`
2. **Recharger la page** : `http://13.38.115.36/#manage`
3. **Vérifier** que l'icône ✏️ apparaît à côté de chaque catégorie

## Commandes Complètes (Copier-Coller)

### Sur le serveur (après avoir copié les fichiers)

```bash
cd ~/alliance/alliance && \
ls -la dist/ && \
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/ && \
docker restart alliance-courtage-extranet && \
echo "✅ Déploiement terminé !"
```

## Dépannage

### Problème : "dist: no such file or directory"

**Solution** : Les fichiers n'ont pas été copiés depuis votre machine. Utilisez WinSCP ou FileZilla pour copier le dossier `dist/` complet.

### Problème : Les fichiers ne s'affichent pas dans le conteneur

```bash
# Vérifier où sont les fichiers dans le conteneur
docker exec alliance-courtage-extranet find /usr/share/nginx/html -name "index.html"

# Si pas trouvé, vérifier la configuration nginx
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf | grep root
```

### Problème : Le conteneur ne redémarre pas

```bash
# Vérifier l'état
docker ps | grep alliance-courtage-extranet

# Voir les logs d'erreur
docker logs alliance-courtage-extranet --tail 50
```

---

**Note** : Après chaque modification du frontend, vous devez rebuild (`npm run build`) et copier les fichiers vers le serveur.

