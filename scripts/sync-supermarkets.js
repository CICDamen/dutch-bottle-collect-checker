#!/usr/bin/env node

/**
 * Local sync script for fetching supermarket data from Google Places API
 * and populating the Supabase database.
 * 
 * Usage: node scripts/sync-supermarkets.js
 * 
 * Environment variables required:
 * - GOOGLE_PLACES_API_KEY: Google Places API key
 * - SUPABASE_URL: Local Supabase URL (default: http://127.0.0.1:54321)
 * - SUPABASE_SERVICE_KEY: Supabase service role key (for local dev, use anon key)
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables
config();

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DUTCH_SUPERMARKET_CHAINS = [
  'Albert Heijn',
  'Jumbo',
  'Lidl',
  // 'Plus Supermarkt',
  // 'Aldi',
  // 'Coop',
  // 'Dirk van den Broek',
  // 'Dirk',
  // 'Nettorama',
  // 'Picnic',
  // 'SPAR',
  // 'Vomar',
  // 'DekaMarkt',
  // 'Boni',
  // 'MCD Supermarkten'
];

const NETHERLANDS_BOUNDS = {
  north: 53.7,
  south: 50.5,
  east: 7.3,
  west: 3.2
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Check if coordinates are within Netherlands boundaries
 */
function isInNetherlands(lat, lng) {
  return lat >= NETHERLANDS_BOUNDS.south && 
         lat <= NETHERLANDS_BOUNDS.north &&
         lng >= NETHERLANDS_BOUNDS.west && 
         lng <= NETHERLANDS_BOUNDS.east;
}

/**
 * Determine supermarket chain from place name
 */
function getChainName(placeName) {
  const chain = DUTCH_SUPERMARKET_CHAINS.find(chainName => 
    placeName.toLowerCase().includes(chainName.toLowerCase())
  );
  return chain || 'Onbekend';
}

/**
 * Check if there are recent incidents for a supermarket
 */
async function hasRecentIncidents(googlePlaceId) {
  if (!googlePlaceId) return false;
  
  try {
    // Check for incidents reported in the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // First get the supermarket ID by google_place_id
    const { data: supermarket, error: supermarketError } = await supabase
      .from('supermarkets')
      .select('id')
      .eq('google_place_id', googlePlaceId)
      .single();
    
    if (supermarketError || !supermarket) {
      return false;
    }
    
    // Then check for recent incidents for this supermarket
    const { data, error } = await supabase
      .from('supermarket_incidents')
      .select('id')
      .eq('supermarket_id', supermarket.id)
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .in('status', ['open', 'investigating'])
      .limit(1);
    
    if (error) {
      console.error('Error checking for incidents:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking incidents:', error);
    return false;
  }
}

/**
 * Determine bottle return availability based on store status, opening hours, and incidents
 * Logic: 
 * - closed if permanently/temporarily closed
 * - closed if there are recent incidents
 * - open if store is operational and currently open
 * - closed otherwise
 */
async function determineStatus(place, googlePlaceId = null) {
  if (place.business_status === 'CLOSED_PERMANENTLY') {
    return 'closed'; // Permanently closed stores can't accept bottles
  }
  
  if (place.business_status === 'CLOSED_TEMPORARILY') {
    return 'closed'; // Temporarily closed - treat as closed
  }
  
  // Check for recent incidents
  if (googlePlaceId && await hasRecentIncidents(googlePlaceId)) {
    return 'closed'; // Recent incidents reported - treat as closed
  }
  
  // If we have opening hours information
  if (place.opening_hours?.open_now !== undefined) {
    // Store is currently open and no incidents - assume bottle return is available
    return place.opening_hours.open_now ? 'open' : 'closed';
  }
  
  // No opening hours data - default to closed since we can't determine availability
  return 'closed';
}

/**
 * Parse Google Places opening hours to our format
 */
function parseOpeningHours(place) {
  if (!place.opening_hours?.periods) {
    return null;
  }
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const openingHours = {};
  
  // Initialize all days as closed
  days.forEach(day => {
    openingHours[day] = 'Closed';
  });
  
  // Parse periods
  place.opening_hours.periods.forEach(period => {
    const dayIndex = period.open.day;
    const dayName = days[dayIndex];
    
    if (period.close) {
      // Has both open and close times
      const openTime = formatTime(period.open.time);
      const closeTime = formatTime(period.close.time);
      openingHours[dayName] = `${openTime}-${closeTime}`;
    } else {
      // Open 24 hours
      openingHours[dayName] = '24 hours';
    }
  });
  
  return openingHours;
}

/**
 * Format time from HHMM to HH:MM
 */
function formatTime(timeString) {
  if (!timeString || timeString.length !== 4) {
    return timeString;
  }
  return `${timeString.substr(0, 2)}:${timeString.substr(2, 2)}`;
}

/**
 * Convert Google Places result to database format
 */
async function convertToSupermarketData(place) {
  const addressParts = place.formatted_address.split(', ');
  
  // Better Dutch address parsing
  let postalCode = '';
  let city = '';
  let address = '';
  
  // Find postal code (Dutch format: 1234 AB or 1234AB)
  const postalCodeRegex = /\b(\d{4}\s?[A-Z]{2})\b/;
  let postalCodePart = null;
  
  // Look for postal code in the address parts (usually towards the end)
  for (let i = addressParts.length - 1; i >= 0; i--) {
    const part = addressParts[i];
    const match = part.match(postalCodeRegex);
    if (match) {
      postalCode = match[1].replace(/\s+/g, ' '); // Normalize spacing
      postalCodePart = part;
      
      // Extract city name from the same part (everything after postal code)
      const cityMatch = part.replace(postalCode, '').trim();
      if (cityMatch) {
        city = cityMatch;
      }
      
      // Remove this part from address parts for street address
      addressParts.splice(i, 1);
      break;
    }
  }
  
  // If no postal code found in combined format, look for separate city
  if (!city && addressParts.length > 0) {
    // Last part is likely the city if no postal code was found
    const lastPart = addressParts[addressParts.length - 1];
    // Check if it looks like a Dutch city (no numbers, reasonable length)
    if (!/\d/.test(lastPart) && lastPart.length > 2 && lastPart.length < 50) {
      city = lastPart;
      addressParts.pop(); // Remove city from address parts
    }
  }
  
  // Remove "Netherlands" or "Nederland" if present
  const filteredParts = addressParts.filter(part => 
    !['Netherlands', 'Nederland', 'The Netherlands'].includes(part.trim())
  );
  
  // Remaining parts form the street address
  address = filteredParts.join(', ').trim();
  
  // Fallback: if we still don't have a city, try to extract from the place name
  if (!city && place.name) {
    // Sometimes city is in the place name like "Albert Heijn Amsterdam"
    const nameParts = place.name.split(' ');
    if (nameParts.length > 2) {
      const possibleCity = nameParts[nameParts.length - 1];
      if (possibleCity.length > 3 && !/\d/.test(possibleCity)) {
        city = possibleCity;
      }
    }
  }
  
  // Clean up extracted values
  postalCode = postalCode.trim();
  city = city.trim();
  address = address.trim();
  
  // If address is empty, use the first part of formatted_address
  if (!address && place.formatted_address) {
    const firstPart = place.formatted_address.split(',')[0];
    if (firstPart && firstPart.trim() !== place.name) {
      address = firstPart.trim();
    }
  }
  
  const chain = getChainName(place.name);
  const status = await determineStatus(place, place.place_id);
  const openingHours = parseOpeningHours(place);

  return {
    name: place.name,
    chain,
    address: address || 'Onbekend adres',
    city: city || 'Onbekende stad',
    postal_code: postalCode || '',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    status,
    google_place_id: place.place_id,
    opening_hours: openingHours,
  };
}

/**
 * Search for places using Google Places Text Search API
 */
async function searchPlacesByText(query) {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured. Set GOOGLE_PLACES_API_KEY environment variable.');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('key', GOOGLE_PLACES_API_KEY);
  url.searchParams.append('type', 'supermarket');
  url.searchParams.append('region', 'nl');
  url.searchParams.append('fields', 'place_id,name,formatted_address,geometry,business_status,opening_hours');

  console.log(`🔍 Searching: ${query}`);
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Places API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.status === 'REQUEST_DENIED') {
    throw new Error(`Places API access denied: ${data.error_message || 'Check API key and permissions'}`);
  }
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API status: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  return data.results || [];
}

/**
 * Remove duplicate entries based on Google Place ID (preferred) or name + coordinates
 */
function deduplicateResults(results) {
  const seen = new Set();
  const deduplicated = [];
  
  for (const result of results) {
    // Use Google Place ID as primary key, fallback to name + coordinates
    const key = result.google_place_id || `${result.name}-${result.latitude}-${result.longitude}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(result);
    }
  }
  
  return deduplicated;
}

/**
 * Upsert supermarket data (insert new, update existing)
 */
async function upsertSupermarkets(supermarkets) {
  console.log('💾 Upserting supermarket data...');
  
  let totalInserted = 0;
  let totalUpdated = 0;
  const batchSize = 50; // Smaller batches for upsert operations

  for (let i = 0; i < supermarkets.length; i += batchSize) {
    const batch = supermarkets.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    try {
      // First, try to find existing records
      const existingRecords = new Map();
      
      // Check for existing records by Google Place ID
      for (const supermarket of batch) {
        if (supermarket.google_place_id) {
          const { data } = await supabase
            .from('supermarkets')
            .select('id, google_place_id')
            .eq('google_place_id', supermarket.google_place_id)
            .limit(1);
          
          if (data && data.length > 0) {
            existingRecords.set(supermarket.google_place_id, data[0]);
          }
        }
      }
      
      // Separate new records from updates
      const newRecords = [];
      const updateRecords = [];
      
      for (const supermarket of batch) {
        const existing = existingRecords.get(supermarket.google_place_id);
        if (existing) {
          updateRecords.push({
            id: existing.id,
            ...supermarket
          });
        } else {
          newRecords.push({
            ...supermarket,
            created_at: new Date().toISOString()
          });
        }
      }
      
      // Insert new records
      if (newRecords.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('supermarkets')
          .insert(newRecords)
          .select('id');
        
        if (insertError) {
          console.error(`❌ Failed to insert new records in batch ${batchNumber}:`, insertError.message);
        } else {
          totalInserted += insertedData?.length || 0;
        }
      }
      
      // Update existing records
      for (const record of updateRecords) {
        const { error: updateError } = await supabase
          .from('supermarkets')
          .update({
            name: record.name,
            chain: record.chain,
            address: record.address,
            city: record.city,
            postal_code: record.postal_code,
            latitude: record.latitude,
            longitude: record.longitude,
            status: record.status,
            google_place_id: record.google_place_id,
            opening_hours: record.opening_hours
          })
          .eq('id', record.id);
        
        if (updateError) {
          console.error(`❌ Failed to update record ${record.id}:`, updateError.message);
        } else {
          totalUpdated++;
        }
      }
      
      console.log(`📥 Batch ${batchNumber}: ${newRecords.length} new, ${updateRecords.length} updated`);
      
      // Rate limiting between batches
      if (i + batchSize < supermarkets.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`❌ Failed to process batch ${batchNumber}:`, error.message);
    }
  }
  
  return { totalInserted, totalUpdated };
}

/**
 * Main sync function
 */
async function syncSupermarkets() {
  try {
    console.log('🚀 Starting supermarket data sync...');
    console.log(`📡 Using Supabase: ${SUPABASE_URL}`);
    console.log(`🔑 Google API Key configured: ${!!GOOGLE_PLACES_API_KEY}`);
    
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key is required. Set GOOGLE_PLACES_API_KEY in your .env file.');
    }

    // Test Supabase connection
    const { error: testError } = await supabase.from('supermarkets').select('count').limit(1);
    if (testError) {
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    console.log('✅ Supabase connection successful');

    const allResults = [];
    let totalFetched = 0;
    
    // Fetch data for each supermarket chain
    for (const chain of DUTCH_SUPERMARKET_CHAINS) {
      try {
        const query = `${chain} supermarket Netherlands`;
        const results = await searchPlacesByText(query);
        
        const filteredResults = results.filter(place => isInNetherlands(
          place.geometry.location.lat, 
          place.geometry.location.lng
        ));
        
        const converted = [];
        for (const place of filteredResults) {
          const convertedPlace = await convertToSupermarketData(place);
          // Log first few results for debugging address parsing
          if (allResults.length < 3) {
            console.log(`   📍 ${place.name} - ${place.formatted_address}`);
            console.log(`      → Address: "${convertedPlace.address}", City: "${convertedPlace.city}", Postal: "${convertedPlace.postal_code}"`);
          }
          converted.push(convertedPlace);
        }
        
        allResults.push(...converted);
        totalFetched += converted.length;
        
        console.log(`✅ ${chain}: ${converted.length} locations found`);
        
        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${chain}:`, error.message);
        // Continue with other chains
      }
    }

    console.log(`📊 Total locations fetched: ${totalFetched}`);
    
    if (allResults.length === 0) {
      console.log('⚠️  No data fetched. Check your Google Places API key and network connection.');
      return;
    }

    // Remove duplicates
    const uniqueResults = deduplicateResults(allResults);
    console.log(`🔧 After deduplication: ${uniqueResults.length} unique locations`);

    // Upsert data (insert new, update existing)
    const { totalInserted, totalUpdated } = await upsertSupermarkets(uniqueResults);
    const totalProcessed = totalInserted + totalUpdated;

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .update({
        last_sync: new Date().toISOString(),
        total_locations: totalProcessed,
        status: 'success',
        error_message: null
      })
      .eq('id', 1);

    console.log(`🎉 Sync completed successfully!`);
    console.log(`📈 New records inserted: ${totalInserted}`);
    console.log(`🔄 Existing records updated: ${totalUpdated}`);
    console.log(`📊 Total records processed: ${totalProcessed}`);
    console.log(`⏰ Sync completed at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('💥 Sync failed:', error.message);
    
    // Update sync metadata with error
    try {
      await supabase
        .from('sync_metadata')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', 1);
    } catch (metaError) {
      console.error('Failed to update sync metadata:', metaError.message);
    }
    
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncSupermarkets();
}

export { syncSupermarkets };
