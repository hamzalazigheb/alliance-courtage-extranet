# 🔍 Debug : Build Frontend sur Serveur

## Si le Build ne Fonctionne Pas

### Vérification Étape par Étape

```bash
cd ~/alliance/alliance

# 1. Vérifier Git
git status
git stash
git pull origin main

# 2. Vérifier que les fichiers sont là
ls -la package.json
ls -la src/FileManagementPage.tsx

# 3. Vérifier Docker
docker --version
docker ps

# 4. Tester le build manuellement
docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "npm install && npm run build"
```

### Build Manuel Étape par Étape

Si le script ne fonctionne pas, faites-le manuellement :

```bash
cd ~/alliance/alliance

# 1. Créer le Dockerfile
cat > Dockerfile.temp << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EOF

# 2. Builder
docker build -f Dockerfile.temp -t temp-builder .

# 3. Extraire dist/
docker create --name temp-container temp-builder
docker cp temp-container:/app/dist ./dist
docker rm temp-container
docker rmi temp-builder
rm Dockerfile.temp

# 4. Copier dans le conteneur
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# 5. Redémarrer
docker restart alliance-courtage-extranet
```

### Vérifier les Erreurs

```bash
# Voir les logs du build
docker build -f Dockerfile.temp -t temp-builder . 2>&1 | tee build.log

# Vérifier les erreurs
grep -i error build.log
grep -i fail build.log
```

---

## Solution Alternative : Utiliser le Script Simplifié

```bash
cd ~/alliance/alliance
git stash
git pull origin main
chmod +x build-frontend-simple.sh
./build-frontend-simple.sh
```

Ce script est plus robuste et affiche plus de détails en cas d'erreur.

