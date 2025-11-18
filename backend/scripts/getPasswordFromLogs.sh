#!/bin/bash

# Script pour récupérer le mot de passe réinitialisé depuis les logs
# Usage: ./getPasswordFromLogs.sh

CONTAINER_NAME="alliance-courtage-backend"

echo "🔍 Recherche du mot de passe dans les logs"
echo "==========================================="
echo ""

# Vérifier que le conteneur existe
if ! docker ps --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé!"
    exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER_NAME"
echo ""

# Chercher le mot de passe dans les logs
echo "📋 Recherche dans les 500 dernières lignes de logs..."
echo ""

# Chercher la section de réinitialisation
docker logs $CONTAINER_NAME --tail 500 2>&1 | grep -A 20 "RÉINITIALISATION DE MOT DE PASSE ADMIN" | head -25

echo ""
echo "💡 Si le mot de passe n'apparaît pas ci-dessus, essayez:"
echo "   docker logs $CONTAINER_NAME --tail 1000 | grep -A 20 'RÉINITIALISATION'"
echo ""


