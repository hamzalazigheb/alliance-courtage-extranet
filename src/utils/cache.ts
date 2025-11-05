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

    const entryString = JSON.stringify(entry);
    const entrySize = new Blob([entryString]).size;
    
    // Skip caching if data is too large (over 2MB)
    const MAX_CACHE_SIZE = 2 * 1024 * 1024; // 2MB
    if (entrySize > MAX_CACHE_SIZE) {
      console.warn(`Skipping cache for key ${key}: data too large (${(entrySize / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    localStorage.setItem(`cache_${key}`, entryString);
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    // If quota exceeded, clear old cache entries and try again
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Quota exceeded, clearing old cache entries...');
      clearOldCacheEntries();
      // Try again with the same entry
      try {
        const now = Date.now();
        const entry: CacheEntry<T> = {
          data,
          timestamp: now,
          expiresAt: now + ttl
        };
        const entryString = JSON.stringify(entry);
        const entrySize = new Blob([entryString]).size;
        
        // If still too large, skip caching
        if (entrySize > MAX_CACHE_SIZE) {
          console.warn(`Skipping cache for key ${key}: data still too large after cleanup`);
          return;
        }
        
        localStorage.setItem(`cache_${key}`, entryString);
      } catch (retryError) {
        console.error('Failed to set cache after clearing old entries:', retryError);
        // If still failing, clear all cache and try one more time
        if (retryError instanceof DOMException && retryError.name === 'QuotaExceededError') {
          console.warn('Still quota exceeded, clearing all cache...');
          clearAllCache();
          // Last attempt - if still fails, give up silently
          try {
            const now = Date.now();
            const entry: CacheEntry<T> = {
              data,
              timestamp: now,
              expiresAt: now + ttl
            };
            const entryString = JSON.stringify(entry);
            localStorage.setItem(`cache_${key}`, entryString);
          } catch (finalError) {
            console.warn(`Final cache attempt failed for key ${key}, skipping cache`);
          }
        }
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
 * Clear old cache entries (older than 30 minutes) or clear all if still too large
 */
function clearOldCacheEntries(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);

    // First pass: clear expired entries
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (entry.timestamp < thirtyMinutesAgo || now > entry.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }
    });

    // Second pass: if still too full, clear more aggressively (anything older than 10 minutes)
    try {
      const stats = getCacheStats();
      const totalSizeMB = stats.totalSize / 1024 / 1024;
      
      // If cache is still over 3MB, clear entries older than 10 minutes
      if (totalSizeMB > 3) {
        const tenMinutesAgo = now - (10 * 60 * 1000);
        keys.forEach(key => {
          if (key.startsWith('cache_')) {
            try {
              const cached = localStorage.getItem(key);
              if (cached) {
                const entry: CacheEntry<any> = JSON.parse(cached);
                if (entry.timestamp < tenMinutesAgo) {
                  localStorage.removeItem(key);
                }
              }
            } catch (error) {
              localStorage.removeItem(key);
            }
          }
        });
      }
    } catch (error) {
      // Ignore errors in stats calculation
    }
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

