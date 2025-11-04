# 🚀 Implémentation du Cache des Données Statiques

## 📋 Vue d'ensemble

Système de cache côté client pour améliorer les performances en évitant les requêtes API inutiles pour les données statiques.

## 🎯 Objectifs

1. ✅ Réduire le nombre de requêtes API
2. ✅ Améliorer les temps de chargement
3. ✅ Réduire la charge sur le serveur
4. ✅ Améliorer l'expérience utilisateur

## 📦 Structure

### Fichiers créés

1. **`src/utils/cache.ts`** - Utilitaires de cache
   - `getCachedData<T>(key)` - Récupérer les données du cache
   - `setCachedData<T>(key, data, ttl)` - Mettre en cache les données
   - `clearCachedData(key)` - Supprimer une entrée du cache
   - `clearAllCache()` - Supprimer tout le cache
   - Constantes `CACHE_KEYS` et `CACHE_TTL`

2. **`src/hooks/useCache.ts`** - Hook React pour le cache
   - `useCache<T>(fetchFn, options)` - Hook automatique avec cache
   - `useCacheManual<T>(key, ttl)` - Hook manuel pour contrôle avancé

## 🎨 Utilisation

### Exemple 1: Hook automatique avec cache

```typescript
import { useCache } from '../hooks/useCache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import { partnersAPI } from '../api';

function PartenairesPage() {
  const { data: partners, loading, error, refresh, invalidate } = useCache(
    () => partnersAPI.getAll({ active: false }),
    {
      key: CACHE_KEYS.PARTNERS,
      ttl: CACHE_TTL.LONG, // 15 minutes
      enabled: true
    }
  );

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      {/* Utiliser partners */}
      <button onClick={refresh}>Rafraîchir</button>
      <button onClick={invalidate}>Vider le cache</button>
    </div>
  );
}
```

### Exemple 2: Cache manuel

```typescript
import { useCacheManual } from '../hooks/useCache';
import { CACHE_KEYS, CACHE_TTL } from '../utils/cache';

function MyComponent() {
  const { data, setCache, getCache, clearCache, refreshCache } = useCacheManual<Partner[]>(
    CACHE_KEYS.PARTNERS,
    CACHE_TTL.LONG
  );

  const loadPartners = async () => {
    // Check cache first
    const cached = getCache();
    if (cached) {
      setPartners(cached);
      return;
    }

    // Fetch and cache
    const partners = await partnersAPI.getAll();
    setCache(partners);
    setPartners(partners);
  };
}
```

### Exemple 3: Cache simple avec utilitaires

```typescript
import { getCachedData, setCachedData, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

async function loadData() {
  // Try cache first
  const cached = getCachedData<MyData[]>(CACHE_KEYS.MY_DATA);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const data = await fetch('/api/data').then(r => r.json());
  
  // Cache it
  setCachedData(CACHE_KEYS.MY_DATA, data, CACHE_TTL.MEDIUM);
  
  return data;
}
```

## 🔑 Clés de Cache

### Clés disponibles (`CACHE_KEYS`)

- `PARTNERS` - Liste complète des partenaires
- `PARTNERS_COA` - Partenaires COA uniquement
- `PARTNERS_CIF` - Partenaires CIF uniquement
- `ASSURANCES` - Liste des assurances
- `ASSURANCES_MONTANTS` - Montants par assurance
- `STRUCTURED_PRODUCTS` - Produits structurés
- `STRUCTURED_PRODUCTS_CATEGORIES` - Catégories de produits
- `ARCHIVES` - Archives
- `ARCHIVES_RECENT` - Archives récentes
- `FINANCIAL_DOCUMENTS` - Documents financiers
- `CMS_ACCUEIL` - Contenu CMS Accueil
- `CMS_GAMME_PRODUITS` - Contenu CMS Gamme Produits
- `CMS_FORMATIONS` - Contenu CMS Formations
- `CMS_PRODUITS_STRUCTURES` - Contenu CMS Produits Structurés
- `CMS_RENCONTRES` - Contenu CMS Rencontres

## ⏱️ Durées de Cache (TTL)

### Durées disponibles (`CACHE_TTL`)

- `SHORT` - 1 minute (données très dynamiques)
- `MEDIUM` - 5 minutes (défaut, données modérément dynamiques)
- `LONG` - 15 minutes (données peu dynamiques)
- `VERY_LONG` - 30 minutes (données très statiques)
- `ONE_HOUR` - 1 heure (données très statiques)

### Recommandations par type de données

| Type de données | TTL recommandé | Raison |
|----------------|----------------|--------|
| Partenaires | `LONG` (15 min) | Changent rarement |
| Assurances | `LONG` (15 min) | Changent rarement |
| Produits structurés | `MEDIUM` (5 min) | Peuvent être ajoutés |
| Archives | `VERY_LONG` (30 min) | Ne changent jamais après upload |
| Documents financiers | `MEDIUM` (5 min) | Peuvent être ajoutés |
| Contenu CMS | `MEDIUM` (5 min) | Modifié par admin occasionnellement |

## 🔄 Invalidation du Cache

### Invalidation automatique
- Le cache expire automatiquement après le TTL
- Les entrées expirées sont automatiquement supprimées

### Invalidation manuelle

```typescript
import { clearCachedData, CACHE_KEYS } from '../utils/cache';

// Invalider un cache spécifique
clearCachedData(CACHE_KEYS.PARTNERS);

// Invalider tout le cache
import { clearAllCache } from '../utils/cache';
clearAllCache();
```

### Invalidation après modification

```typescript
// Après avoir créé/modifié/supprimé un partenaire
async function createPartner(partnerData) {
  await partnersAPI.create(partnerData);
  
  // Invalider le cache
  clearCachedData(CACHE_KEYS.PARTNERS);
  clearCachedData(CACHE_KEYS.PARTNERS_COA);
  clearCachedData(CACHE_KEYS.PARTNERS_CIF);
  
  // Optionnel: Rafraîchir immédiatement
  await refreshPartners();
}
```

## 📊 Statistiques du Cache

```typescript
import { getCacheStats } from '../utils/cache';

const stats = getCacheStats();
console.log('Total entries:', stats.totalEntries);
console.log('Total size:', stats.totalSize, 'bytes');
console.log('Oldest entry:', stats.oldestEntry);
console.log('Newest entry:', stats.newestEntry);
```

## 🛡️ Gestion des Erreurs

### Quota localStorage dépassé

Le système gère automatiquement le dépassement du quota localStorage:
- Détection de l'erreur `QuotaExceededError`
- Nettoyage automatique des entrées anciennes (> 1 heure)
- Nouvelle tentative de mise en cache

### Entrées invalides

Les entrées invalides sont automatiquement supprimées lors de la lecture.

## 🚀 Implémentations

### ✅ Implémenté

1. **Utilitaires de cache** (`src/utils/cache.ts`)
   - ✅ Fonctions de base
   - ✅ Gestion des erreurs
   - ✅ Nettoyage automatique
   - ✅ Statistiques

2. **Hook React** (`src/hooks/useCache.ts`)
   - ✅ Hook automatique `useCache`
   - ✅ Hook manuel `useCacheManual`

3. **Cache pour Partenaires** (`src/App.tsx`)
   - ✅ Cache implémenté dans `PartenairesPage`
   - ✅ TTL: 15 minutes
   - ✅ Invalidation lors des mises à jour (à ajouter dans CMS)

### ⚠️ À Implémenter

1. **Cache pour Assurances**
   - Dans `ProduitsStructuresPage.tsx`
   - TTL: 15 minutes

2. **Cache pour Produits Structurés**
   - Dans `ProduitsStructuresPage.tsx`
   - TTL: 5 minutes

3. **Cache pour Archives**
   - Dans `NosArchivesPage.tsx`
   - TTL: 30 minutes

4. **Cache pour Documents Financiers**
   - Dans `GammeFinancierePage.tsx`
   - TTL: 5 minutes

5. **Cache pour Contenu CMS**
   - Dans les pages qui utilisent le CMS
   - TTL: 5 minutes

6. **Invalidation lors des mises à jour**
   - Dans `PartnerManagementPage.tsx` - invalider après CRUD
   - Dans `StructuredProductsCMSPage.tsx` - invalider après CRUD
   - Dans `FileManagePage.tsx` - invalider après upload/suppression

## 📈 Avantages

1. **Performance**
   - Réduction des requêtes API
   - Temps de chargement améliorés
   - Moins de charge sur le serveur

2. **Expérience utilisateur**
   - Navigation plus fluide
   - Moins de temps d'attente
   - Données disponibles hors ligne (tant que cache valide)

3. **Scalabilité**
   - Réduction de la charge serveur
   - Meilleure gestion du trafic

## ⚠️ Limitations

1. **localStorage**
   - Limite de ~5-10MB selon le navigateur
   - Stockage par domaine
   - Peut être vidé par l'utilisateur

2. **Synchronisation**
   - Cache côté client uniquement
   - Pas de synchronisation entre onglets
   - Invalidation manuelle nécessaire après modifications

## 🎯 Prochaines Étapes

1. ✅ Implémenter le cache pour toutes les données statiques
2. ⚠️ Ajouter l'invalidation automatique lors des mises à jour
3. ⚠️ Ajouter des statistiques de cache dans le CMS
4. ⚠️ Implémenter un cache côté serveur (Redis) pour production
5. ⚠️ Ajouter des tests unitaires pour le cache

---

**Statut:** ✅ **UTILITAIRES ET HOOK CRÉÉS** | ⚠️ **IMPLÉMENTATION EN COURS**

