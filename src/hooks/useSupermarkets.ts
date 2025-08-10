import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SupermarketData } from '@/types/supermarket';
import { placesService } from '@/services/placesService';
import { mockSupermarkets } from '@/data/mockSupermarkets';

const FALLBACK_TO_MOCK = true;

/**
 * Custom React hook for managing supermarket data with Google Places API integration.
 * Provides seamless switching between mock data and live API data with caching.
 * @returns Object with supermarket data, loading states, and control functions
 */
export function useSupermarkets() {
  const [useGooglePlaces, setUseGooglePlaces] = useState(false);
  
  const { 
    data: googleSupermarkets, 
    isLoading: isLoadingGoogle, 
    error: googleError,
    refetch: refetchGoogle
  } = useQuery({
    queryKey: ['supermarkets', 'google'],
    queryFn: () => placesService.fetchAllSupermarkets(),
    enabled: useGooglePlaces,
    staleTime: 1000 * 60 * 60 * 24,
    retry: 2,
    retryOnMount: false,
  });

  const { 
    data: mockData, 
    isLoading: isLoadingMock 
  } = useQuery({
    queryKey: ['supermarkets', 'mock'],
    queryFn: () => Promise.resolve(mockSupermarkets),
    enabled: !useGooglePlaces || (FALLBACK_TO_MOCK && !!googleError),
    staleTime: Infinity,
  });

  const supermarkets = useGooglePlaces && googleSupermarkets ? googleSupermarkets : mockData || [];
  const isLoading = useGooglePlaces ? isLoadingGoogle : isLoadingMock;

  /**
   * Enables Google Places API data fetching if API key is configured.
   * @throws Error if Google Places API key is not configured
   */
  const enableGooglePlaces = async () => {
    const hasApiKey = !!(import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY;
    if (!hasApiKey) {
      throw new Error('Google Places API key not configured');
    }
    setUseGooglePlaces(true);
  };

  /**
   * Disables Google Places API and switches back to mock data.
   */
  const disableGooglePlaces = () => {
    setUseGooglePlaces(false);
  };

  /**
   * Refreshes supermarket data. Only works when Google Places is enabled.
   * @returns Promise that resolves when refresh is complete
   */
  const refreshSupermarkets = async () => {
    if (useGooglePlaces) {
      return refetchGoogle();
    }
    return Promise.resolve();
  };

  /**
   * Forces a fresh fetch from Google Places API, bypassing all caches.
   * @returns Fresh supermarket data from Google Places API
   */
  const forceRefreshFromGoogle = async () => {
    return placesService.refreshSupermarkets();
  };

  const getCacheInfo = () => placesService.getCacheInfo();
  const clearCache = () => placesService.clearCache();

  return {
    supermarkets,
    isLoading,
    error: googleError,
    useGooglePlaces,
    enableGooglePlaces,
    disableGooglePlaces,
    refreshSupermarkets,
    forceRefreshFromGoogle,
    getCacheInfo,
    clearCache,
  };
}