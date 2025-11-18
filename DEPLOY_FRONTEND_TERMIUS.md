# 🚀 Déploiement du Frontend avec Termius

## Utilisation de Termius pour Copier les Fichiers

### Étape 1 : Ouvrir le Gestionnaire de Fichiers dans Termius

1. **Ouvrez Termius**
2. **Connectez-vous** à votre serveur (`13.38.115.36`)
3. **Cliquez sur l'onglet "Files"** (ou utilisez `Ctrl+Shift+F`)
   - Ou utilisez le menu : **View → File Manager**

### Étape 2 : Copier les Fichiers

#### Côté Local (Votre Machine Windows)

1. Dans Termius, ouvrez le **File Manager local**
2. Naviguez vers : `C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr\dist\`
3. **Sélectionnez tous les fichiers** dans le dossier `dist/`

#### Côté Serveur (Remote)

1. Dans Termius, connectez-vous au serveur
2. Ouvrez le **File Manager remote**
3. Naviguez vers : `~/alliance/alliance/`
4. **Créez un dossier `dist/`** s'il n'existe pas (clic droit → New Folder)
5. **Glissez-déposez** (drag & drop) tous les fichiers de `dist/` local vers `dist/` sur le serveur

### Étape 3 : Vérifier la Copie

Dans le terminal Termius, exécutez :

```bash
cd ~/alliance/alliance
ls -la dist/
# Vous devriez voir : index.html, assets/, etc.
```

### Étape 4 : Copier dans le Conteneur Docker

```bash
cd ~/alliance/alliance

# Copier dans le conteneur
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# Vérifier
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/ | head -10

# Redémarrer le conteneur
docker restart alliance-courtage-extranet

# Vérifier l'état
sleep 3
docker ps | grep alliance-courtage-extranet
```

## Alternative : Utiliser SCP dans Termius

Si le File Manager ne fonctionne pas bien, utilisez SCP dans le terminal Termius :

### Depuis votre Machine Windows (si vous avez accès SSH)

```bash
# Dans un terminal local (si vous avez SSH installé)
scp -r C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr\dist\* ubuntu@13.38.115.36:~/alliance/alliance/dist/
```

### Ou depuis le Serveur (si vous pouvez monter le dossier local)

Dans Termius, connectez-vous au serveur et utilisez :

```bash
# Si vous avez accès au dossier local via un partage réseau
# Sinon, utilisez le File Manager de Termius
```

## Méthode la Plus Simple avec Termius

1. **Ouvrez Termius**
2. **Connectez-vous** au serveur
3. **Ouvrez le File Manager** (onglet Files ou `Ctrl+Shift+F`)
4. **Côté gauche** : Naviguez vers votre machine locale → `C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr\dist\`
5. **Côté droit** : Naviguez vers le serveur → `~/alliance/alliance/`
6. **Créez** le dossier `dist/` sur le serveur si nécessaire
7. **Sélectionnez tous les fichiers** dans `dist/` local
8. **Glissez-déposez** vers `dist/` sur le serveur
9. **Attendez** que la copie se termine

## Commandes Complètes (Après la Copie)

Une fois les fichiers copiés via Termius, exécutez dans le terminal Termius :

```bash
cd ~/alliance/alliance

# Vérifier
echo "📁 Fichiers dans dist/:"
ls -la dist/ | head -10

# Copier dans le conteneur
echo "📤 Copie dans le conteneur..."
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# Vérifier dans le conteneur
echo "✅ Vérification dans le conteneur:"
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/assets/ | head -5

# Redémarrer
echo "🔄 Redémarrage du conteneur..."
docker restart alliance-courtage-extranet

# Attendre et vérifier
sleep 5
echo "📊 État du conteneur:"
docker ps | grep alliance-courtage-extranet

echo ""
echo "✅ Frontend déployé !"
echo "📝 Videz le cache du navigateur (Ctrl+Shift+R) pour voir les changements"
```

## Vérification Finale

1. **Ouvrez votre navigateur** : `http://13.38.115.36/#manage`
2. **Videz le cache** : `Ctrl+Shift+R`
3. **Ouvrez la console** (F12)
4. **Vérifiez** :
   - L'icône ✏️ apparaît à côté des catégories
   - Les erreurs API sont détaillées (si erreur)
   - Le filtre par catégorie fonctionne

## Si la Copie est Lente

Si la copie prend du temps, vous pouvez :
1. **Compresser** le dossier `dist/` en ZIP
2. **Copier** le ZIP vers le serveur
3. **Décompresser** sur le serveur :

```bash
# Sur le serveur
cd ~/alliance/alliance
unzip dist.zip -d dist/
rm dist.zip
```

---

**Note** : Termius File Manager est très pratique pour ce type d'opération. Utilisez-le pour copier les fichiers facilement !

