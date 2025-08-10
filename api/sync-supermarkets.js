// api/sync-supermarkets.js - Vercel serverless function
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const DUTCH_SUPERMARKET_CHAINS = [
  'Albert Heijn', 'Jumbo', 'Plus Supermarkt', 'Lidl', 'Aldi', 'Coop',
  'Dirk van den Broek', 'Dirk', 'Nettorama', 'Picnic', 'SPAR', 'Vomar',
  'DekaMarkt', 'Boni', 'MCD Supermarkten'
];

/**
 * Vercel serverless function to sync supermarket data
 * Can be triggered by cron job or webhook
 */
export default async function handler(req, res) {
  // Verify authentication (webhook secret or cron token)
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.SYNC_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting supermarket sync...');
    const allResults = [];

    for (const chain of DUTCH_SUPERMARKET_CHAINS) {
      try {
        const results = await searchPlacesByText(`${chain} supermarket Netherlands`);
        const converted = results
          .filter(place => isInNetherlands(place.geometry.location.lat, place.geometry.location.lng))
          .map(convertToSupermarketData);
        
        allResults.push(...converted);
        await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
      } catch (error) {
        console.warn(`Failed to fetch ${chain}:`, error.message);
      }
    }

    const uniqueResults = deduplicateResults(allResults);

    // Store in Supabase
    const { data, error } = await supabase
      .from('supermarkets')
      .upsert(uniqueResults, { onConflict: 'id' });

    if (error) throw error;

    // Update sync metadata
    await supabase
      .from('sync_metadata')
      .upsert({
        id: 1,
        last_sync: new Date().toISOString(),
        total_locations: uniqueResults.length,
        status: 'success'
      });

    console.log(`Synced ${uniqueResults.length} supermarkets`);
    
    return res.json({
      success: true,
      synced: uniqueResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Sync failed:', error);
    
    // Log error to database
    await supabase
      .from('sync_metadata')
      .upsert({
        id: 1,
        last_sync: new Date().toISOString(),
        status: 'error',
        error_message: error.message
      });

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper functions (same as sync-supermarkets.js)
async function searchPlacesByText(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.append('query', query);
  url.searchParams.append('key', process.env.GOOGLE_PLACES_API_KEY);
  url.searchParams.append('type', 'supermarket');
  url.searchParams.append('region', 'nl');

  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API status: ${data.status}`);
  }

  return data.results || [];
}

function isInNetherlands(lat, lng) {
  return lat >= 50.5 && lat <= 53.7 && lng >= 3.2 && lng <= 7.3;
}

function convertToSupermarketData(place) {
  // Same logic as original sync script
  const addressParts = place.formatted_address.split(', ');
  const postalAndCity = addressParts[addressParts.length - 2] || '';
  const postalMatch = postalAndCity.match(/^(\d{4}\s?[A-Z]{2})/);
  const postalCode = postalMatch ? postalMatch[1] : '';
  const city = postalAndCity.replace(postalMatch?.[0] || '', '').trim();
  const address = addressParts.slice(0, -2).join(', ');
  
  const chain = DUTCH_SUPERMARKET_CHAINS.find(chainName => 
    place.name.toLowerCase().includes(chainName.toLowerCase())
  ) || 'Onbekend';

  return {
    id: place.place_id,
    name: place.name,
    chain,
    address,
    city,
    postal_code: postalCode,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    status: determineStatus(place),
    last_updated: new Date().toISOString()
  };
}

function determineStatus(place) {
  if (place.business_status === 'CLOSED_PERMANENTLY' || 
      place.business_status === 'CLOSED_TEMPORARILY') {
    return 'closed';
  }
  if (place.opening_hours?.open_now !== undefined) {
    return place.opening_hours.open_now ? 'open' : 'closed';
  }
  return 'unknown';
}

function deduplicateResults(results) {
  const seen = new Set();
  return results.filter(result => {
    const key = `${result.name}-${result.address}-${result.city}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}