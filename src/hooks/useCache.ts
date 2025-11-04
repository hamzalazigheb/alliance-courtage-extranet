// React hook for caching API data
import { useState, useEffect, useCallback } from 'react';
import { getCachedData, setCachedData, clearCachedData, CACHE_TTL } from '../utils/cache';

export interface UseCacheOptions {
  key: string;
  ttl?: number;
  enabled?: boolean; // Enable/disable cache
  invalidateOnMount?: boolean; // Clear cache on mount
}

export interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook to fetch and cache API data
 * 
 * @param fetchFn Function that returns a Promise with the data
 * @param options Cache options
 */
export function useCache<T>(
  fetchFn: () => Promise<T>,
  options: UseCacheOptions
): UseCacheReturn<T> {
  const { key, ttl = CACHE_TTL.MEDIUM, enabled = true, invalidateOnMount = false } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      if (enabled && useCache) {
        const cached = getCachedData<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch from API
      const result = await fetchFn();

      // Cache the result
      if (enabled) {
        setCachedData(key, result, ttl);
      }

      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error(`Error fetching data for key ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [key, ttl, enabled, fetchFn]);

  const refresh = useCallback(async () => {
    await fetchData(false); // Force refresh, skip cache
  }, [fetchData]);

  const invalidate = useCallback(() => {
    clearCachedData(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    if (invalidateOnMount) {
      clearCachedData(key);
    }
    fetchData();
  }, [key, fetchData, invalidateOnMount]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate
  };
}

/**
 * Hook to cache data with manual control
 */
export function useCacheManual<T>(
  key: string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  const [data, setData] = useState<T | null>(() => getCachedData<T>(key));

  const setCache = useCallback((value: T) => {
    setCachedData(key, value, ttl);
    setData(value);
  }, [key, ttl]);

  const getCache = useCallback(() => {
    return getCachedData<T>(key);
  }, [key]);

  const clearCache = useCallback(() => {
    clearCachedData(key);
    setData(null);
  }, [key]);

  const refreshCache = useCallback(async (fetchFn: () => Promise<T>) => {
    try {
      const result = await fetchFn();
      setCachedData(key, result, ttl);
      setData(result);
      return result;
    } catch (error) {
      console.error(`Error refreshing cache for key ${key}:`, error);
      throw error;
    }
  }, [key, ttl]);

  return {
    data,
    setCache,
    getCache,
    clearCache,
    refreshCache
  };
}

