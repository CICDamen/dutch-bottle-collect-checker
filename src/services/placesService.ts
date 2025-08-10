import { SupermarketData } from '@/types/supermarket';

const GOOGLE_PLACES_API_KEY = (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
const CACHE_KEY = 'supermarkets_cache';
const CACHE_EXPIRY_HOURS = 24;

interface PlacesSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  opening_hours?: {
    open_now?: boolean;
  };
  types: string[];
  rating?: number;
}

interface CachedData {
  timestamp: number;
  data: SupermarketData[];
}

const DUTCH_SUPERMARKET_CHAINS = [
  'Albert Heijn',
  'Jumbo',
  'Plus Supermarkt',
  'Lidl',
  'Aldi',
  'Coop',
  'Dirk van den Broek',
  'Dirk',
  'Nettorama',
  'Picnic',
  'SPAR',
  'Vomar',
  'DekaMarkt',
  'Boni',
  'MCD Supermarkten'
];

const NETHERLANDS_BOUNDS = {
  north: 53.7,
  south: 50.5,
  east: 7.3,
  west: 3.2
};

/**
 * Service for interacting with Google Places API to fetch supermarket data.
 * Implements smart caching and cost optimization strategies.
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
   * Searches for places using Google Places Text Search API.
   * @param query - Search query string
   * @returns Array of place search results
   * @throws Error if API key is missing or API returns error
   */
  private async searchPlacesByText(query: string): Promise<PlacesSearchResult[]> {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', GOOGLE_PLACES_API_KEY);
    url.searchParams.append('type', 'supermarket');
    url.searchParams.append('region', 'nl');

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API status: ${data.status}`);
    }

    return data.results || [];
  }

  /**
   * Converts Google Places API result to SupermarketData format.
   * @param place - Place result from Google Places API
   * @returns Formatted supermarket data object
   */
  private convertToSupermarketData(place: PlacesSearchResult): SupermarketData {
    const addressParts = place.formatted_address.split(', ');
    const postalAndCity = addressParts[addressParts.length - 2] || '';
    const postalMatch = postalAndCity.match(/^(\d{4}\s?[A-Z]{2})/);
    const postalCode = postalMatch ? postalMatch[1] : '';
    const city = postalAndCity.replace(postalMatch?.[0] || '', '').trim();
    
    const address = addressParts.slice(0, -2).join(', ');
    
    const chain = DUTCH_SUPERMARKET_CHAINS.find(chainName => 
      place.name.toLowerCase().includes(chainName.toLowerCase())
    ) || 'Onbekend';

    const status = this.determineStatus(place);

    return {
      id: place.place_id,
      name: place.name,
      chain,
      address,
      city,
      postalCode,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      status,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Determines the operational status of a supermarket from place data.
   * @param place - Place result from Google Places API
   * @returns Status string: 'open', 'closed', or 'unknown'
   */
  private determineStatus(place: PlacesSearchResult): 'open' | 'closed' | 'unknown' {
    if (place.business_status === 'CLOSED_PERMANENTLY' || 
        place.business_status === 'CLOSED_TEMPORARILY') {
      return 'closed';
    }
    
    if (place.opening_hours?.open_now !== undefined) {
      return place.opening_hours.open_now ? 'open' : 'closed';
    }
    
    return 'unknown';
  }

  /**
   * Checks if coordinates are within Netherlands boundaries.
   * @param lat - Latitude coordinate
   * @param lng - Longitude coordinate
   * @returns true if coordinates are in Netherlands
   */
  private isInNetherlands(lat: number, lng: number): boolean {
    return lat >= NETHERLANDS_BOUNDS.south && 
           lat <= NETHERLANDS_BOUNDS.north &&
           lng >= NETHERLANDS_BOUNDS.west && 
           lng <= NETHERLANDS_BOUNDS.east;
  }

  /**
   * Fetches all supermarket data with smart caching strategy.
   * First tries pre-synced data, then cache, then live API calls.
   * @param forceRefresh - If true, bypasses cache and fetches fresh data
   * @returns Array of supermarket data
   * @throws Error if all data sources fail
   */
  async fetchAllSupermarkets(forceRefresh = false): Promise<SupermarketData[]> {
    if (!forceRefresh) {
      const cached = this.getCachedData();
      if (cached) {
        return cached;
      }
    }

    // Try to load pre-synced data first
    try {
      const response = await fetch('/src/data/supermarkets.json');
      if (response.ok) {
        const syncedData = await response.json();
        if (Array.isArray(syncedData) && syncedData.length > 0) {
          this.setCachedData(syncedData);
          return syncedData;
        }
      }
    } catch (error) {
      console.info('No pre-synced data available, fetching from API');
    }

    try {
      const allResults: SupermarketData[] = [];
      
      for (const chain of DUTCH_SUPERMARKET_CHAINS) {
        try {
          const query = `${chain} supermarket Netherlands`;
          const results = await this.searchPlacesByText(query);
          
          const converted = results
            .filter(place => this.isInNetherlands(
              place.geometry.location.lat, 
              place.geometry.location.lng
            ))
            .map(place => this.convertToSupermarketData(place));
          
          allResults.push(...converted);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Failed to fetch ${chain}:`, error);
        }
      }

      const uniqueResults = this.deduplicateResults(allResults);
      this.setCachedData(uniqueResults);
      
      return uniqueResults;
    } catch (error) {
      console.error('Failed to fetch supermarkets:', error);
      const cached = this.getCachedData();
      if (cached) {
        console.info('Returning cached data due to fetch error');
        return cached;
      }
      throw error;
    }
  }

  /**
   * Removes duplicate supermarket entries based on name, address, and city.
   * @param results - Array of supermarket data that may contain duplicates
   * @returns Array of unique supermarket data
   */
  private deduplicateResults(results: SupermarketData[]): SupermarketData[] {
    const seen = new Set<string>();
    const deduplicated: SupermarketData[] = [];
    
    for (const result of results) {
      const key = `${result.name}-${result.address}-${result.city}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }
    
    return deduplicated;
  }

  /**
   * Forces a refresh of supermarket data, bypassing cache.
   * @returns Fresh supermarket data from API
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
    
    const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    const cacheAge = Date.now() - cacheData.timestamp;
    
    return {
      hasCache: true,
      cacheAge: Math.floor(cacheAge / (1000 * 60)),
      itemCount: cached.length
    };
  }

  /**
   * Clears the localStorage cache for supermarket data.
   */
  clearCache(): void {
    localStorage.removeItem(CACHE_KEY);
  }
}

export const placesService = new PlacesService();