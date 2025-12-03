# Correction du bouton "Ouvrir"

## Problème
Le bouton "Ouvrir" affiche "URL du fichier non disponible" car `fileUrl` est parfois null.

## Solution appliquée
Le code a été modifié pour construire l'URL depuis l'ID du bordereau si `fileUrl` est null.

## Déploiement

### 1. Commit et push

```bash
git add src/pages/GestionComptabilitePage.tsx
git commit -m "fix: construction URL depuis ID si fileUrl null"
git push origin main
```

### 2. Sur le serveur

```bash
# Pull les changements
cd ~/alliance/alliance
git pull origin main

# Rebuild le frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
docker build --no-cache -t alliance-courtage-frontend:latest .
docker run -d --name alliance-courtage-extranet --restart unless-stopped --network backend_alliance-network -p 80:80 alliance-courtage-frontend:latest

# Vérifier
docker ps | grep alliance-courtage-extranet
```

### 3. Vérifier aussi le backend

```bash
# Redémarrer le backend pour s'assurer que la route /recent retourne bien fileUrl
cd backend
docker-compose restart backend
```

## Test

1. Vider le cache du navigateur : `Ctrl + Shift + R`
2. Aller dans Gestion Comptabilité
3. Cliquer sur "Ouvrir" - doit télécharger le fichier

