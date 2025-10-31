# Dockerfile pour le backend Alliance Courtage
FROM node:18-alpine

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Créer le dossier uploads
RUN mkdir -p uploads

# Exposer le port
EXPOSE 3001

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage (attendre MySQL puis démarrer)
CMD ["sh", "-c", "node scripts/wait-for-mysql.js && npm start"]

