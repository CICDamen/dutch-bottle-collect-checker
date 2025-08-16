import { useQuery } from '@tanstack/react-query';
import { SupermarketData } from '@/types/supermarket';
import { placesService } from '@/services/placesService';
import { databaseService } from '@/services/databaseService';


/**
 * Custom React hook for managing supermarket data from Supabase database.
 * Google Places API has been moved to server-side sync scripts.
 * @returns Object with supermarket data, loading states, and control functions
 */
export function useSupermarkets() {
  
  // Supabase database query
  const {
    data: databaseSupermarkets,
    isLoading: isLoadingDatabase,
    error: databaseError,
    refetch: refetchDatabase
  } = useQuery({
    queryKey: ['supermarkets', 'database'],
    queryFn: () => databaseService.fetchSupermarkets(),
    enabled: databaseService.isAvailable(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Mock data is disabled - using database only

  // Use only database data
  const supermarkets: SupermarketData[] = databaseSupermarkets || [];
  const isLoading = isLoadingDatabase;
  const activeError = databaseError;



  /**
   * Refreshes supermarket data from database.
   * @returns Promise that resolves when refresh is complete
   */
  const refreshSupermarkets = async () => {
    return refetchDatabase();
  };

  /**
   * Submits user input (status update, incident report, feedback) to database.
   * @param input - User input data
   * @returns Promise with input ID
   */
  const submitUserInput = async (input: {
    supermarketId: string;
    userEmail?: string;
    inputType: 'status_update' | 'incident_report' | 'general_feedback';
    message: string;
    status?: 'open' | 'closed' | 'unknown';
    incidentDescription?: string;
  }) => {
    if (!databaseService.isAvailable()) {
      throw new Error('Database not available for user input');
    }
    
    const inputId = await databaseService.submitUserInput(input);
    
    // Refresh data to show updated status
    await refetchDatabase();
    
    return inputId;
  };

  const getCacheInfo = () => placesService.getCacheInfo();
  const clearCache = () => placesService.clearCache();

  return {
    supermarkets,
    isLoading,
    error: activeError,
    refreshSupermarkets,
    submitUserInput,
    getCacheInfo,
    clearCache,
  };
}