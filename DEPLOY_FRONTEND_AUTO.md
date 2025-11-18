# 🚀 Déploiement Automatique du Frontend (Sans Copier-Coller)

## Solution 1 : Build Directement sur le Serveur (Recommandé)

### Prérequis

Le serveur doit avoir Node.js et npm installés.

### Utilisation

```bash
cd ~/alliance/alliance
git pull origin main
chmod +x build-frontend-on-server.sh
./build-frontend-on-server.sh
```

Le script fait automatiquement :
1. ✅ Vérifie/installe Node.js et npm
2. ✅ Met à jour le code (git pull)
3. ✅ Installe les dépendances (npm install)
4. ✅ Build le frontend (npm run build)
5. ✅ Copie dans le conteneur Docker
6. ✅ Redémarre le conteneur

---

## Solution 2 : Build dans un Conteneur Docker

Si Node.js n'est pas installé sur le serveur, utilisez cette solution.

### Utilisation

```bash
cd ~/alliance/alliance
git pull origin main
chmod +x build-frontend-docker.sh
./build-frontend-docker.sh
```

Le script fait automatiquement :
1. ✅ Met à jour le code (git pull)
2. ✅ Crée un conteneur Docker temporaire avec Node.js
3. ✅ Build le frontend dans le conteneur
4. ✅ Extrait le dossier dist/
5. ✅ Copie dans le conteneur frontend
6. ✅ Nettoie les conteneurs temporaires
7. ✅ Redémarre le conteneur

---

## Solution 3 : Utiliser Docker Compose avec Build

Si vous utilisez docker-compose, vous pouvez ajouter un service de build.

### Créer un docker-compose.build.yml

```yaml
version: '3.8'

services:
  frontend-builder:
    image: node:18-alpine
    volumes:
      - .:/app
      - /app/node_modules
    working_dir: /app
    command: sh -c "npm install && npm run build"
    
  frontend:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html:ro
    ports:
      - "80:80"
    depends_on:
      - frontend-builder
```

### Utilisation

```bash
docker-compose -f docker-compose.build.yml up --build
```

---

## Solution 4 : GitHub Actions (CI/CD Automatique)

Créer un workflow GitHub Actions qui build et déploie automatiquement.

### Créer `.github/workflows/deploy-frontend.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'package.json'
      - 'vite.config.ts'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "~/alliance/alliance/dist/"
      
      - name: Update container
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd ~/alliance/alliance
            docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/
            docker restart alliance-courtage-extranet
```

---

## Comparaison des Solutions

| Solution | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Build sur serveur** | Simple, rapide | Nécessite Node.js sur serveur |
| **Build Docker** | Pas besoin de Node.js sur serveur | Plus lent, nécessite Docker |
| **Docker Compose** | Automatique, reproductible | Configuration plus complexe |
| **GitHub Actions** | Complètement automatique | Nécessite configuration CI/CD |

---

## Solution Recommandée : Build sur Serveur

C'est la plus simple et la plus rapide :

```bash
# Sur le serveur
cd ~/alliance/alliance
git pull origin main
chmod +x build-frontend-on-server.sh
./build-frontend-on-server.sh
```

**C'est tout !** Le script fait tout automatiquement.

---

## Si Node.js n'est pas installé

Installez-le rapidement :

```bash
# Option 1 : Via le gestionnaire de paquets
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 2 : Via nvm (recommandé)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

Puis utilisez la Solution 1.

---

**Note** : Avec ces solutions, vous n'avez plus besoin de build sur votre machine Windows ni de copier-coller les fichiers !

