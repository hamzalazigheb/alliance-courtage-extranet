#!/bin/bash

# Script pour corriger le fichier notifications.js sur le serveur
# Remplace la section corrompue de la route /history

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE_PATH="$SCRIPT_DIR/../routes/notifications.js"
BACKUP_PATH="${FILE_PATH}.backup_$(date +%Y%m%d_%H%M%S)"

echo "🔧 Correction du fichier notifications.js..."

# Faire une sauvegarde
cp "$FILE_PATH" "$BACKUP_PATH"
echo "✅ Sauvegarde créée: $BACKUP_PATH"

# Trouver la ligne avec "LEFT JOIN users u"
LEFT_JOIN_LINE=$(grep -n "LEFT JOIN users u ON n.user_id = u.id" "$FILE_PATH" | tail -1 | cut -d: -f1)

if [ -z "$LEFT_JOIN_LINE" ]; then
    echo "❌ Ligne 'LEFT JOIN users u' non trouvée"
    exit 1
fi

echo "📍 Ligne LEFT JOIN trouvée: $LEFT_JOIN_LINE"

# Trouver la ligne corrompue (const notifications = await query dans la string SQL)
# Elle devrait être 1-2 lignes après LEFT JOIN
CORRUPTED_LINE=$(sed -n "${LEFT_JOIN_LINE},$((LEFT_JOIN_LINE+5))p" "$FILE_PATH" | grep -n "const notifications = await query(sql, \[limit, offset\]);" | head -1 | cut -d: -f1)

if [ -z "$CORRUPTED_LINE" ]; then
    echo "⚠️  Ligne corrompue non trouvée. Le fichier est peut-être déjà corrigé."
    echo "   Vérification manuelle recommandée."
    exit 0
fi

# Calculer le numéro de ligne réel
REAL_CORRUPTED_LINE=$((LEFT_JOIN_LINE + CORRUPTED_LINE - 1))
echo "📍 Ligne corrompue trouvée: $REAL_CORRUPTED_LINE"

# Vérifier que cette ligne est bien dans une string SQL (avant la fermeture `;)
# En regardant les lignes autour
CONTEXT=$(sed -n "$((REAL_CORRUPTED_LINE-2)),$((REAL_CORRUPTED_LINE+2))p" "$FILE_PATH")
echo "📋 Contexte autour de la ligne corrompue:"
echo "$CONTEXT"

# Supprimer la ligne corrompue
sed -i "${REAL_CORRUPTED_LINE}d" "$FILE_PATH"

# Ajouter ORDER BY après LEFT JOIN (maintenant à la ligne LEFT_JOIN_LINE)
sed -i "${LEFT_JOIN_LINE}a\      ORDER BY n.created_at DESC" "$FILE_PATH"

echo "✅ Correction appliquée"

# Vérifier le résultat
echo ""
echo "📋 Vérification du résultat (lignes $((LEFT_JOIN_LINE-2))-$((LEFT_JOIN_LINE+5))):"
sed -n "$((LEFT_JOIN_LINE-2)),$((LEFT_JOIN_LINE+5))p" "$FILE_PATH"

# Vérifier qu'il n'y a plus de code JavaScript dans les strings SQL
if grep -n "const notifications = await query" "$FILE_PATH" | grep -v "^[0-9]*:.*\`" > /dev/null; then
    echo ""
    echo "✅ Vérification: Le code JavaScript est maintenant en dehors des strings SQL"
else
    echo ""
    echo "⚠️  Attention: Vérifiez manuellement le fichier"
fi

echo ""
echo "✅ Correction terminée!"

