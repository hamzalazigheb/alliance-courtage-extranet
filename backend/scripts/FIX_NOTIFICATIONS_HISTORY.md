# 🔧 Guide de Correction - Route /api/notifications/history

## Problème
Le fichier `backend/routes/notifications.js` sur le serveur contient du code JavaScript corrompu dans la string SQL de la route `/history`.

## Solution 1 : Utiliser Git (Recommandé)

Si le fichier local est correct et déjà commité :

```bash
# Sur le serveur
cd ~/alliance/alliance
git checkout HEAD -- backend/routes/notifications.js
# OU
git pull origin deploy-new-version
```

## Solution 2 : Utiliser le script Node.js

```bash
# Sur le serveur
cd ~/alliance/alliance/backend
node scripts/fix-notifications-history.js
```

## Solution 3 : Utiliser le script Shell

```bash
# Sur le serveur
cd ~/alliance/alliance/backend
chmod +x scripts/fix-notifications-history.sh
./scripts/fix-notifications-history.sh
```

## Solution 4 : Correction manuelle avec sed

```bash
# Sur le serveur
cd ~/alliance/alliance/backend

# Faire une sauvegarde
cp routes/notifications.js routes/notifications.js.backup_manual

# Trouver et supprimer la ligne corrompue (généralement ligne 278)
sed -i '278d' routes/notifications.js

# Ajouter ORDER BY après LEFT JOIN (généralement ligne 273)
sed -i '273a\      ORDER BY n.created_at DESC' routes/notifications.js

# Vérifier
sed -n '270,285p' routes/notifications.js
```

## Après correction

1. **Vérifier que le fichier est correct :**
   ```bash
   sed -n '270,290p' backend/routes/notifications.js
   ```
   
   Vous devriez voir :
   ```javascript
   LEFT JOIN users u ON n.user_id = u.id
   ORDER BY n.created_at DESC
   LIMIT ? OFFSET ?
   `;
   
   const notifications = await query(sql, [limit, offset]);
   ```

2. **Reconstruire l'image Docker :**
   ```bash
   cd ~/alliance/alliance/backend
   docker build --no-cache -t alliance-courtage-backend:latest .
   ```

3. **Redémarrer le conteneur :**
   ```bash
   docker stop alliance-courtage-backend
   docker rm alliance-courtage-backend
   docker run -d \
     --name alliance-courtage-backend \
     --restart unless-stopped \
     --network backend_alliance-network \
     --network alliance-network \
     -p 3001:3001 \
     --env-file config.env \
     -e NODE_ENV=production \
     -e DB_HOST=alliance-courtage-mysql \
     -e DB_PORT=3306 \
     -e DB_NAME=alliance_courtage_test \
     -e DB_USER=root \
     -e DB_PASSWORD=alliance2024Secure \
     -v $(pwd)/uploads:/app/uploads \
     -v $(pwd)/config.env:/app/config.env:ro \
     alliance-courtage-backend:latest
   ```

4. **Tester l'endpoint :**
   ```bash
   TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@alliance-courtage.fr","password":"Admin123@"}' \
     | grep -o '"token":"[^"]*' | cut -d'"' -f4)
   
   curl -H "x-auth-token: $TOKEN" \
        "http://localhost/api/notifications/history?limit=10&offset=0"
   ```

## Vérification

Le fichier corrigé doit avoir cette structure :

```javascript
router.get('/history', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: 'Paramètre limit invalide' });
    }
    if (isNaN(offset) || offset < 0) {
      return res.status(400).json({ error: 'Paramètre offset invalide' });
    }
    
    const sql = `
      SELECT 
        ...
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const notifications = await query(sql, [limit, offset]);
    // ...
  }
});
```

**Important :** `ORDER BY n.created_at DESC` et `LIMIT ? OFFSET ?` doivent être **dans** la string SQL, et `const notifications = await query(...)` doit être **en dehors** de la string SQL.

