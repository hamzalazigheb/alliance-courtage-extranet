#!/bin/bash

# Script de déploiement pour corriger l'encodage UTF-8
# Usage: ./deploy-utf8-fix.sh [test|prod]

set -e

ENV=${1:-test}

if [ "$ENV" = "test" ]; then
  REMOTE_HOST="13.38.115.36"
  REMOTE_USER="ubuntu"
  REMOTE_DIR="~/alliance/alliance"
  CONTAINER_FRONTEND="alliance-courtage-extranet"
  CONTAINER_BACKEND="alliance-courtage-backend"
  CONTAINER_MYSQL="alliance-courtage-mysql"
elif [ "$ENV" = "prod" ]; then
  REMOTE_HOST="ip-172-31-0-149"
  REMOTE_USER="ubuntu"
  REMOTE_DIR="~/prod"
  CONTAINER_FRONTEND="alliance-courtage-extranet"
  CONTAINER_BACKEND="alliance-courtage-backend"
  CONTAINER_MYSQL="c4dbc8574704_alliance-courtage-mysql"
else
  echo "❌ Usage: $0 [test|prod]"
  exit 1
fi

echo "🚀 Déploiement UTF-8 Fix sur $ENV..."
echo "📡 Connexion à $REMOTE_USER@$REMOTE_HOST..."

# 1. Pull latest code
echo ""
echo "📥 Pull latest code..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && git pull origin deploy-new-version"

# 2. Rebuild frontend with UTF-8 fixes
echo ""
echo "🔨 Rebuild frontend..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && docker run --rm -v \$(pwd):/app -w /app node:18 sh -c 'npm install && npm run build'"

# 3. Copy frontend to nginx container
echo ""
echo "📦 Copy frontend to nginx..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker cp ${REMOTE_DIR}/dist/. ${CONTAINER_FRONTEND}:/usr/share/nginx/html/"

# 4. Update nginx.conf
echo ""
echo "⚙️  Update nginx.conf..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker cp ${REMOTE_DIR}/nginx.conf ${CONTAINER_FRONTEND}:/etc/nginx/conf.d/default.conf"

# 5. Test and reload nginx
echo ""
echo "🔄 Reload nginx..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker exec ${CONTAINER_FRONTEND} nginx -t && docker exec ${CONTAINER_FRONTEND} nginx -s reload"

# 6. Copy backend with UTF-8 fixes
echo ""
echo "📦 Copy backend..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker cp ${REMOTE_DIR}/backend/. ${CONTAINER_BACKEND}:/app/"

# 7. Restart backend
echo ""
echo "🔄 Restart backend..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker restart ${CONTAINER_BACKEND}"

# 8. Wait for backend to start
echo ""
echo "⏳ Waiting for backend to start..."
sleep 15

# 9. Verify deployment
echo ""
echo "✅ Verification..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker logs ${CONTAINER_BACKEND} --tail 10"

echo ""
echo "✅ Déploiement UTF-8 Fix terminé sur $ENV!"
echo ""
echo "📝 Actions à faire côté client:"
echo "   1. Vider le cache du navigateur (Ctrl+Shift+Delete)"
echo "   2. Recharger la page (Ctrl+Shift+R ou Ctrl+F5)"
echo "   3. Vérifier que les caractères accentués s'affichent correctement"

