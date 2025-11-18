# 🚀 Déploiement Immédiat du Frontend

## Problème

Le frontend sur le serveur est ancien et ne contient pas les dernières modifications (gestion des catégories, amélioration des erreurs, etc.).

## Solution : Déployer le Nouveau Frontend

### Étape 1 : Build du Frontend (Déjà fait ✅)

Le build est prêt dans le dossier `dist/` sur votre machine Windows.

### Étape 2 : Copier vers le Serveur

#### Option A : Utiliser WinSCP (Recommandé - Plus Simple)

1. **Télécharger WinSCP** : https://winscp.net/
2. **Se connecter** :
   - Host name: `13.38.115.36`
   - User name: `ubuntu`
   - Password: (votre mot de passe)
3. **Naviguer** vers `~/alliance/alliance/`
4. **Créer** un dossier `dist/` s'il n'existe pas
5. **Copier** tout le contenu de `C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr\dist\` vers `~/alliance/alliance/dist/` sur le serveur

#### Option B : Utiliser PowerShell SCP

```powershell
# Dans PowerShell sur Windows
cd C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr

# Créer le dossier dist sur le serveur
ssh ubuntu@13.38.115.36 "mkdir -p ~/alliance/alliance/dist"

# Copier les fichiers
scp -r dist/* ubuntu@13.38.115.36:~/alliance/alliance/dist/
```

### Étape 3 : Copier dans le Conteneur Docker

Sur le serveur, exécutez :

```bash
cd ~/alliance/alliance

# Vérifier que les fichiers sont là
ls -la dist/

# Copier dans le conteneur
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# Vérifier dans le conteneur
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/ | head -10

# Redémarrer le conteneur (si nécessaire)
docker restart alliance-courtage-extranet
```

### Étape 4 : Vérifier

1. **Vider le cache du navigateur** : `Ctrl+Shift+R`
2. **Recharger la page** : `http://13.38.115.36/#manage`
3. **Vérifier la console** (F12) - Les erreurs devraient maintenant être détaillées
4. **Vérifier les fonctionnalités** :
   - L'icône ✏️ devrait apparaître à côté des catégories
   - Le filtre par catégorie devrait fonctionner
   - Les erreurs API devraient être détaillées dans la console

## Commandes Complètes (Copier-Coller sur le Serveur)

```bash
cd ~/alliance/alliance

# Vérifier que dist/ existe et contient des fichiers
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    echo "✅ Dossier dist/ trouvé avec des fichiers"
    ls -la dist/ | head -5
    
    # Copier dans le conteneur
    docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/
    echo "✅ Fichiers copiés dans le conteneur"
    
    # Redémarrer
    docker restart alliance-courtage-extranet
    sleep 3
    
    # Vérifier
    docker ps | grep alliance-courtage-extranet
    echo "✅ Frontend déployé !"
else
    echo "❌ Le dossier dist/ n'existe pas ou est vide"
    echo "📝 Vous devez d'abord copier les fichiers depuis votre machine Windows"
fi
```

## Vérification Rapide

```bash
# Vérifier la version du fichier JS (devrait être récent)
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/assets/ | grep "index-"

# Vérifier la taille (devrait être ~564 KB)
docker exec alliance-courtage-extranet ls -lh /usr/share/nginx/html/assets/ | grep "index-.*\.js"
```

## Si les Fichiers ne Sont Pas Encore sur le Serveur

**Vous devez d'abord copier depuis votre machine Windows** :

1. Utilisez **WinSCP** ou **FileZilla**
2. Connectez-vous à `13.38.115.36`
3. Copiez le dossier `dist/` complet depuis votre machine vers `~/alliance/alliance/dist/` sur le serveur

## Résultat Attendu

Après le déploiement :
- ✅ L'icône ✏️ apparaît à côté de chaque catégorie
- ✅ Le filtre par catégorie fonctionne
- ✅ Les erreurs API sont détaillées dans la console
- ✅ Le téléchargement des fichiers fonctionne
- ✅ Les catégories peuvent être modifiées

---

**Important** : N'oubliez pas de vider le cache du navigateur (`Ctrl+Shift+R`) après le déploiement !

