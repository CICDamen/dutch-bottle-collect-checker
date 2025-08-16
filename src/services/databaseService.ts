import { SupermarketData, IncidentReport } from '@/types/supermarket';
import { 
  SupermarketIncident, 
  SupermarketIncidentSummary, 
  AdminDashboardStats, 
  IncidentReportForm 
} from '@/types/incident';
import { supabase } from '@/lib/supabase';

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
   * Creates a new supermarket entry in the database.
   * @param supermarket - Supermarket data to insert
   * @returns Created supermarket data
   */
  async createSupermarket(supermarket: Omit<SupermarketData, 'id' | 'lastUpdated'>): Promise<SupermarketData> {
    const { data, error } = await supabase
      .from('supermarkets')
      .insert({
        chain: supermarket.chain,
        name: supermarket.name,
        address: supermarket.address,
        postal_code: supermarket.postalCode,
        city: supermarket.city,
        latitude: supermarket.latitude,
        longitude: supermarket.longitude,
        status: supermarket.status || 'closed',
        google_place_id: supermarket.googlePlaceId,
        opening_hours: supermarket.openingHours
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create supermarket: ${error.message}`);
    }

    return this.convertFromDatabase(data);
  }

  /**
   * Updates a supermarket's status or other information.
   * @param id - Supermarket ID
   * @param updates - Fields to update
   * @returns Updated supermarket data
   */
  async updateSupermarket(id: string, updates: Partial<SupermarketData>): Promise<SupermarketData> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.chain) updateData.chain = updates.chain;
    if (updates.name) updateData.name = updates.name;
    if (updates.address) updateData.address = updates.address;
    if (updates.postalCode) updateData.postal_code = updates.postalCode;
    if (updates.city) updateData.city = updates.city;
    if (updates.latitude) updateData.latitude = updates.latitude;
    if (updates.longitude) updateData.longitude = updates.longitude;

    const { data, error } = await supabase
      .from('supermarkets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update supermarket: ${error.message}`);
    }

    return this.convertFromDatabase(data);
  }

    /**
   * Fetches all supermarkets from database with incident-based status override.
   * Status priority: 1) Active incidents override base status, 2) Base status from sync
   * @returns Array of supermarket data from database
   * @throws Error if database is not configured or query fails
   */
  async fetchSupermarkets(): Promise<SupermarketData[]> {
    if (!supabase) {
      throw new Error('Database not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
    }

    // Fetch supermarkets with their incident data in a single query
    const { data, error } = await supabase
      .from('supermarkets')
      .select(`
        *,
        supermarket_incidents(
          id,
          incident_type,
          status,
          priority,
          created_at,
          description
        )
      `)
      .order('chain', { ascending: true });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Process each supermarket and apply incident-based status override
    const supermarkets = data.map(row => {
      const supermarket = this.convertFromDatabase(row);
      
      // Find active incidents (open or investigating)
      const incidents = row.supermarket_incidents || [];
      const activeIncidents = incidents.filter((incident: any) => 
        incident.status === 'open' || incident.status === 'investigating'
      );
      
      // Override status based on active incidents
      if (activeIncidents.length > 0) {
        // If there are active incidents, mark as closed (bottle return not available)
        supermarket.status = 'closed';
        
        // Add incident info to the supermarket object
        const latestIncident = activeIncidents.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        supermarket.incident = {
          type: latestIncident.incident_type,
          description: latestIncident.description || 'Er is een probleem gemeld',
          reportedAt: latestIncident.created_at,
          reportedBy: 'Gebruiker'
        };
      }
      
      return supermarket;
    });

    return supermarkets;
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
        schema: 'bottle_collection',
        table: 'supermarkets'
      }, callback)
      .subscribe();
  }

  /**
   * Submits user input (status update, incident report, or feedback).
   * @param input - User input data
   * @returns Created input record ID
   */
  async submitUserInput(input: {
    supermarketId: string;
    userEmail?: string;
    inputType: 'status_update' | 'incident_report' | 'general_feedback';
    message: string;
    status?: 'open' | 'closed' | 'unknown';
    incidentDescription?: string;
  }): Promise<string> {
    const { data, error } = await supabase
      .from('user_inputs')
      .insert({
        supermarket_id: input.supermarketId,
        user_email: input.userEmail,
        input_type: input.inputType,
        message: input.message,
        status: input.status,
        incident_description: input.incidentDescription
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to submit user input: ${error.message}`);
    }

    // If this is a status update, update the supermarket status
    if (input.inputType === 'status_update' && input.status) {
      await this.updateSupermarket(input.supermarketId, { status: input.status });
    }

    return data.id;
  }

  /**
   * Bulk updates supermarket table - replaces all existing data with new data.
   * @param supermarkets - Array of supermarket data to insert
   * @returns Number of supermarkets created
   */
  async bulkUpdateSupermarkets(supermarkets: Omit<SupermarketData, 'id' | 'lastUpdated'>[]): Promise<number> {
    if (!supabase) {
      throw new Error('Database not configured');
    }

    // Clear existing data
    const { error: deleteError } = await supabase
      .from('supermarkets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      throw new Error(`Failed to clear existing data: ${deleteError.message}`);
    }

    // Insert new data in batches
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < supermarkets.length; i += batchSize) {
      const batch = supermarkets.slice(i, i + batchSize);
      const insertData = batch.map(s => ({
        chain: s.chain,
        name: s.name,
        address: s.address,
        postal_code: s.postalCode,
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude,
        status: s.status || 'unknown'
      }));

      const { data, error } = await supabase
        .from('supermarkets')
        .insert(insertData)
        .select('id');

      if (error) {
        throw new Error(`Failed to insert batch: ${error.message}`);
      }

      totalInserted += data?.length || 0;
    }

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .update({
        last_sync: new Date().toISOString(),
        total_locations: totalInserted,
        status: 'success',
        error_message: null
      })
      .eq('id', 1);

    return totalInserted;
  }

  /**
   * Gets user inputs for a specific supermarket.
   * @param supermarketId - Supermarket ID
   * @returns Array of user inputs
   */
  async getUserInputsForSupermarket(supermarketId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_inputs')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user inputs: ${error.message}`);
    }

    return data || [];
  }

  // ================================
  // INCIDENT MANAGEMENT METHODS
  // ================================

  /**
   * Reports a new incident for a supermarket.
   * @param incident - Incident report data
   * @returns Created incident ID
   */
  async reportIncident(incident: IncidentReportForm): Promise<string> {
    const { data, error } = await supabase
      .from('supermarket_incidents')
      .insert({
        supermarket_id: incident.supermarket_id,
        incident_type: incident.incident_type,
        description: incident.description,
        reporter_email: incident.reporter_email,
        reporter_name: incident.reporter_name,
        priority: incident.priority || 'medium'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to report incident: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Gets all incidents for a specific supermarket.
   * @param supermarketId - Supermarket ID
   * @param includeResolved - Whether to include resolved incidents
   * @returns Array of incidents
   */
  async getIncidentsForSupermarket(
    supermarketId: string, 
    includeResolved: boolean = false
  ): Promise<SupermarketIncident[]> {
    let query = supabase
      .from('supermarket_incidents')
      .select('*')
      .eq('supermarket_id', supermarketId)
      .order('created_at', { ascending: false });

    if (!includeResolved) {
      query = query.in('status', ['open', 'investigating']);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get incidents: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gets incident summary for all supermarkets (shows active incident counts).
   * @returns Array of supermarket incident summaries
   */
  async getIncidentSummaries(): Promise<SupermarketIncidentSummary[]> {
    const { data, error } = await supabase
      .from('supermarket_incident_summary')
      .select('*')
      .order('active_incidents', { ascending: false });

    if (error) {
      throw new Error(`Failed to get incident summaries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Updates an incident (admin only function - requires proper authentication).
   * @param incidentId - Incident ID to update
   * @param updates - Fields to update
   * @returns Updated incident
   */
  async updateIncident(
    incidentId: string, 
    updates: Partial<Pick<SupermarketIncident, 'status' | 'priority' | 'admin_notes'>>
  ): Promise<SupermarketIncident> {
    const { data, error } = await supabase
      .from('supermarket_incidents')
      .update(updates)
      .eq('id', incidentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update incident: ${error.message}`);
    }

    return data;
  }

  /**
   * Gets admin dashboard statistics (admin only).
   * @returns Dashboard statistics
   */
  async getAdminDashboardStats(): Promise<AdminDashboardStats> {
    const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

    if (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }

    return data[0] || {
      total_supermarkets: 0,
      total_incidents: 0,
      active_incidents: 0,
      resolved_incidents: 0
    };
  }

  /**
   * Bulk resolve multiple incidents (admin only).
   * @param incidentIds - Array of incident IDs to resolve
   * @param adminNote - Optional admin note
   * @returns Number of incidents resolved
   */
  async bulkResolveIncidents(incidentIds: string[], adminNote?: string): Promise<number> {
    const { data, error } = await supabase.rpc('bulk_resolve_incidents', {
      incident_ids: incidentIds,
      admin_note: adminNote
    });

    if (error) {
      throw new Error(`Failed to bulk resolve incidents: ${error.message}`);
    }

    return data || 0;
  }

  /**
   * Gets recent incidents across all supermarkets.
   * @param limit - Maximum number of incidents to return
   * @param status - Filter by status (optional)
   * @returns Array of recent incidents with supermarket info
   */
  async getRecentIncidents(
    limit: number = 50, 
    status?: SupermarketIncident['status']
  ): Promise<Array<SupermarketIncident & { supermarket_name: string; chain: string }>> {
    let query = supabase
      .from('supermarket_incidents')
      .select(`
        *,
        supermarkets (
          name,
          chain
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get recent incidents: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item,
      supermarket_name: item.supermarkets?.name || 'Unknown',
      chain: item.supermarkets?.chain || 'Unknown'
    }));
  }

  /**
   * Checks if current user has admin privileges.
   * @returns true if user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return false;
    }

    return user.user_metadata?.role === 'supermarket_admin';
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
      googlePlaceId: row.google_place_id,
      status: row.status as 'open' | 'closed',
      openingHours: row.opening_hours as SupermarketData['openingHours'],
      lastUpdated: row.last_updated,
      // Note: incident data would come from user_inputs table via a separate query
    };
  }
}

export const databaseService = new DatabaseService();