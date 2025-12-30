# Correction des Bordereaux 2024

## Problème identifié
- 92 bordereaux créés en 2024 ont `period_year = NULL`
- 188 bordereaux créés en 2025 ont `period_year = NULL`
- Les bordereaux 2024 ne s'affichent pas dans l'interface car le filtrage cherche `period_year = 2024`

## Solution appliquée

### 1. Code modifié ✅
- **Backend** : Extraction améliorée de `period_year` et `period_month` depuis les noms de fichiers
- **Backend** : Requête GET utilise `YEAR(created_at)` comme fallback si `period_year` est NULL
- **Frontend** : Filtrage amélioré avec fallback sur `YEAR(createdAt)`
- **Frontend** : Ajout de l'onglet 2026 dans ComptabilitePage

### 2. Script SQL à exécuter sur le serveur

**Commande à exécuter sur le serveur :**

```bash
# Aller dans le dossier prod
cd ~/prod

# Récupérer les changements
git pull origin deploy-new-version

# Exécuter le script SQL pour corriger les données existantes
docker exec c4dbc8574704_alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Corriger period_year pour 2024
UPDATE bordereaux 
SET period_year = 2024
WHERE period_year IS NULL 
  AND YEAR(created_at) = 2024;

-- Corriger period_year pour 2025
UPDATE bordereaux 
SET period_year = 2025
WHERE period_year IS NULL 
  AND YEAR(created_at) = 2025;

-- Extraire period_month depuis le titre (format "01 24" = janvier)
UPDATE bordereaux 
SET period_month = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' ', -2), ' ', 1) AS UNSIGNED)
WHERE period_month IS NULL 
  AND period_year = 2024
  AND title REGEXP '[0-9]{2}[ /][0-9]{2}'
  AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(title, ' ', -2), ' ', 1) AS UNSIGNED) BETWEEN 1 AND 12;

-- Pattern avec slash
UPDATE bordereaux 
SET period_month = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(title, '/', -2), '/', 1) AS UNSIGNED)
WHERE period_month IS NULL 
  AND period_year = 2024
  AND title REGEXP '[0-9]{2}/[0-9]{2}'
  AND CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(title, '/', -2), '/', 1) AS UNSIGNED) BETWEEN 1 AND 12;

-- Fallback : utiliser MONTH(created_at) si period_month est toujours NULL
UPDATE bordereaux 
SET period_month = MONTH(created_at)
WHERE period_month IS NULL 
  AND period_year = 2024;

UPDATE bordereaux 
SET period_month = MONTH(created_at)
WHERE period_month IS NULL 
  AND period_year = 2025;

-- Vérification
SELECT 
  period_year,
  COUNT(*) as total,
  COUNT(CASE WHEN period_month IS NOT NULL THEN 1 END) as with_month
FROM bordereaux 
WHERE period_year IN (2024, 2025)
GROUP BY period_year
ORDER BY period_year DESC;
EOF

# Rebuild et redémarrer le backend
cd backend
docker-compose up -d --build --force-recreate backend

# Attendre le démarrage
sleep 10

# Vérifier les logs
docker logs --tail 30 alliance-courtage-backend
```

## Vérification

Après l'exécution du script, vérifier que les bordereaux 2024 s'affichent :

```bash
# Vérifier les bordereaux 2024
docker exec c4dbc8574704_alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT 
  period_year,
  COUNT(*) as count
FROM bordereaux 
WHERE period_year = 2024
GROUP BY period_year;"
```

## Résultat attendu

- ✅ Les bordereaux 2024 devraient maintenant s'afficher dans l'interface
- ✅ Les futurs uploads en masse définiront automatiquement `period_year` et `period_month`
- ✅ L'onglet 2026 est maintenant disponible dans ComptabilitePage
- ✅ Le système utilise `YEAR(created_at)` comme fallback si `period_year` est NULL



