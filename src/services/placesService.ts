import { SupermarketData } from '@/types/supermarket';

const CACHE_KEY = 'supermarkets_cache';
const CACHE_EXPIRY_HOURS = 24;

// Note: Google Places API calls have been moved to server-side sync scripts
// This service now focuses on cache management and data retrieval from database/files
console.info('PlacesService: Browser-side API calls disabled to avoid CORS issues');

interface CachedData {
  timestamp: number;
  data: SupermarketData[];
}

/**
 * Service for managing supermarket data cache and loading pre-synced data.
 * Google Places API calls have been moved to server-side sync scripts to avoid CORS issues.
 */
class PlacesService {
  /**
   * Checks if cached data is still valid based on expiry time.
   * @param cached - The cached data object with timestamp
   * @returns true if cache is still valid, false otherwise
   */
  private isValidCache(cached: CachedData): boolean {
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
    return cacheAge < maxAge;
  }

  /**
   * Retrieves cached supermarket data from localStorage.
   * @returns Cached supermarket data or null if cache is invalid/missing
   */
  private getCachedData(): SupermarketData[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      
      const parsedCache: CachedData = JSON.parse(cached);
      if (this.isValidCache(parsedCache)) {
        return parsedCache.data;
      }
      
      localStorage.removeItem(CACHE_KEY);
      return null;
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }

  /**
   * Stores supermarket data in localStorage with timestamp.
   * @param data - Array of supermarket data to cache
   */
  private setCachedData(data: SupermarketData[]): void {
    try {
      const cacheData: CachedData = {
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Fetches all supermarket data from available sources.
   * Priority: Cache → Pre-synced files → Database
   * @param forceRefresh - If true, bypasses cache
   * @returns Array of supermarket data
   * @throws Error if no data sources are available
   */
  async fetchAllSupermarkets(forceRefresh = false): Promise<SupermarketData[]> {
    if (!forceRefresh) {
      const cached = this.getCachedData();
      if (cached) {
        console.info('Using cached supermarket data');
        return cached;
      }
    }

    // Try to load pre-synced data files
    const dataSources = [
      '/src/data/supermarkets.json',
      '/public/data/supermarkets.json',
      '/data/supermarkets.json'
    ];

    for (const dataSource of dataSources) {
      try {
        const response = await fetch(dataSource);
        if (response.ok) {
          const syncedData = await response.json();
          if (Array.isArray(syncedData) && syncedData.length > 0) {
            console.info(`Using pre-synced data from ${dataSource}`);
            this.setCachedData(syncedData);
            return syncedData;
          }
        }
      } catch (error) {
        // Continue to next data source
        console.debug(`Failed to load ${dataSource}:`, error.message);
      }
    }

    // Fallback: Check if database service is available
    try {
      const { databaseService } = await import('./databaseService');
      if (databaseService.isAvailable()) {
        console.info('Loading supermarket data from database');
        const dbData = await databaseService.fetchSupermarkets();
        if (dbData.length > 0) {
          this.setCachedData(dbData);
          return dbData;
        }
      }
    } catch (error) {
      console.warn('Database fallback failed:', error);
    }

    throw new Error('No supermarket data available. Run the sync script to populate data.');
  }

  /**
   * Forces a refresh by clearing cache and fetching fresh data.
   * @returns Fresh supermarket data
   */
  async refreshSupermarkets(): Promise<SupermarketData[]> {
    return this.fetchAllSupermarkets(true);
  }

  /**
   * Gets information about the current cache state.
   * @returns Object with cache status, age in minutes, and item count
   */
  getCacheInfo(): { hasCache: boolean; cacheAge?: number; itemCount?: number } {
    const cached = this.getCachedData();
    if (!cached) {
      return { hasCache: false };
    }
    
    try {
      const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      const cacheAge = Date.now() - cacheData.timestamp;
      
      return {
        hasCache: true,
        cacheAge: Math.floor(cacheAge / (1000 * 60)),
        itemCount: cached.length
      };
    } catch {
      return { hasCache: false };
    }
  }

  /**
   * Clears the localStorage cache for supermarket data.
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}

export const placesService = new PlacesService();