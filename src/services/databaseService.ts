import { createClient } from '@supabase/supabase-js';
import { SupermarketData } from '@/types/supermarket';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Service for interacting with Supabase database to fetch supermarket data.
 * Provides production-ready data storage with real-time capabilities.
 */
class DatabaseService {
  /**
   * Checks if database connection is available.
   * @returns true if Supabase client is configured
   */
  isAvailable(): boolean {
    return !!supabase;
  }

  /**
   * Fetches all supermarket data from the database.
   * @returns Array of supermarket data from database
   * @throws Error if database is not configured or query fails
   */
  async fetchSupermarkets(): Promise<SupermarketData[]> {
    if (!supabase) {
      throw new Error('Database not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
    }

    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .order('chain', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data.map(this.convertFromDatabase);
  }

  /**
   * Fetches supermarkets within a specific geographic bounds.
   * @param bounds - Geographic boundaries { north, south, east, west }
   * @returns Array of supermarket data within bounds
   */
  async fetchSupermarketsInBounds(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<SupermarketData[]> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .gte('latitude', bounds.south)
      .lte('latitude', bounds.north)
      .gte('longitude', bounds.west)
      .lte('longitude', bounds.east);

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return data.map(this.convertFromDatabase);
  }

  /**
   * Searches supermarkets by text query (name, chain, city, postal code).
   * @param query - Search query string
   * @returns Array of matching supermarket data
   */
  async searchSupermarkets(query: string): Promise<SupermarketData[]> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    const { data, error } = await supabase
      .from('supermarkets')
      .select('*')
      .or(`name.ilike.${searchTerm},chain.ilike.${searchTerm},city.ilike.${searchTerm},postal_code.ilike.${searchTerm}`);

    if (error) {
      throw new Error(`Database search failed: ${error.message}`);
    }

    return data.map(this.convertFromDatabase);
  }

  /**
   * Gets sync metadata information (last sync time, status, etc.).
   * @returns Sync metadata object
   */
  async getSyncMetadata(): Promise<{
    lastSync?: string;
    totalLocations?: number;
    status?: string;
    errorMessage?: string;
  }> {
    if (!supabase) {
      return {};
    }

    const { data, error } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return {};
    }

    return {
      lastSync: data.last_sync,
      totalLocations: data.total_locations,
      status: data.status,
      errorMessage: data.error_message
    };
  }

  /**
   * Subscribes to real-time updates for supermarket data.
   * @param callback - Function to call when data changes
   * @returns Subscription object to unsubscribe
   */
  subscribeToUpdates(callback: (payload: any) => void) {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    return supabase
      .channel('supermarkets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'supermarkets'
      }, callback)
      .subscribe();
  }

  /**
   * Converts database row format to SupermarketData format.
   * @param row - Database row object
   * @returns SupermarketData object
   */
  private convertFromDatabase(row: any): SupermarketData {
    return {
      id: row.id,
      name: row.name,
      chain: row.chain,
      address: row.address,
      city: row.city,
      postalCode: row.postal_code,
      latitude: row.latitude,
      longitude: row.longitude,
      status: row.status,
      lastUpdated: row.last_updated
    };
  }
}

export const databaseService = new DatabaseService();