// Cache utility for static data
// Uses localStorage for persistence across page reloads

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  key: string; // Unique cache key
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if it exists and is not expired
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if expired
    if (now > entry.expiresAt) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error(`Error reading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data with expiration
 */
export function setCachedData<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };

    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    // If quota exceeded, clear old cache entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldCacheEntries();
      // Try again
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Failed to set cache after clearing old entries:', retryError);
      }
    }
  }
}

/**
 * Clear cached data for a specific key
 */
export function clearCachedData(key: string): void {
  try {
    localStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error(`Error clearing cache for key ${key}:`, error);
  }
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Clear old cache entries (older than 1 hour)
 */
function clearOldCacheEntries(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (entry.timestamp < oneHourAgo) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old cache entries:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    
    let totalSize = 0;
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const entry: CacheEntry<any> = JSON.parse(cached);
          if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
          }
          if (newestTimestamp === null || entry.timestamp > newestTimestamp) {
            newestTimestamp = entry.timestamp;
          }
        }
      } catch (error) {
        // Ignore invalid entries
      }
    });

    return {
      totalEntries: cacheKeys.length,
      totalSize,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null
    };
  }
}

/**
 * Cache keys constants
 */
export const CACHE_KEYS = {
  PARTNERS: 'partners',
  PARTNERS_COA: 'partners_coa',
  PARTNERS_CIF: 'partners_cif',
  ASSURANCES: 'assurances',
  ASSURANCES_MONTANTS: 'assurances_montants',
  STRUCTURED_PRODUCTS: 'structured_products',
  STRUCTURED_PRODUCTS_CATEGORIES: 'structured_products_categories',
  ARCHIVES: 'archives',
  ARCHIVES_RECENT: 'archives_recent',
  FINANCIAL_DOCUMENTS: 'financial_documents',
  CMS_ACCUEIL: 'cms_accueil',
  CMS_GAMME_PRODUITS: 'cms_gamme_produits',
  CMS_FORMATIONS: 'cms_formations',
  CMS_PRODUITS_STRUCTURES: 'cms_produits_structures',
  CMS_RENCONTRES: 'cms_rencontres'
} as const;

/**
 * TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,        // 1 minute
  MEDIUM: 5 * 60 * 1000,       // 5 minutes (default)
  LONG: 15 * 60 * 1000,        // 15 minutes
  VERY_LONG: 30 * 60 * 1000,  // 30 minutes
  ONE_HOUR: 60 * 60 * 1000     // 1 hour
} as const;

