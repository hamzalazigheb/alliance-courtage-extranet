# Correction : Route /api/structured-products/reservations/all 404

## Problème
La route `/api/structured-products/reservations/all` retourne 404, ce qui signifie que le backend n'a pas été redémarré avec les dernières modifications.

## Solution

### 1. Vérifier que le code est à jour sur le serveur

```bash
cd /var/www/alliance-courtage

# Pull les dernières modifications
git pull origin main

# Vérifier que le fichier contient la route
grep -n "reservations/all" backend/routes/structuredProducts.js
```

### 2. Redémarrer le backend pour appliquer les changements

```bash
docker restart alliance-courtage-backend

# Vérifier les logs pour s'assurer qu'il démarre correctement
docker logs alliance-courtage-backend --tail 50
```

### 3. Vérifier que la route est bien enregistrée

```bash
# Tester la route directement
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:3001/api/structured-products/reservations/all

# Ou vérifier les routes dans les logs
docker logs alliance-courtage-backend | grep -i "route\|reservation"
```

### 4. Si le problème persiste, rebuild le backend

```bash
cd /var/www/alliance-courtage/backend

# Rebuild l'image backend
docker compose build --no-cache backend

# Redémarrer le conteneur
docker restart alliance-courtage-backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 50
```

## Commandes rapides (tout-en-un)

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
docker restart alliance-courtage-backend && \
sleep 5 && \
docker logs alliance-courtage-backend --tail 30 && \
echo "✅ Backend redémarré!"
```

## Vérification finale

Après le redémarrage, vérifier que la route fonctionne :
- Aller sur `/manage` → onglet "Produits Réservés"
- La page devrait maintenant charger les réservations sans erreur 404

