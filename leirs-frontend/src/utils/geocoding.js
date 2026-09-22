/**
 * OpenStreetMap Nominatim Geocoding Utility
 * 
 * Provides address search and reverse geocoding for LEIRS incident location.
 * Uses OpenStreetMap Nominatim API (free, no API key required).
 * 
 * Usage Policy Compliance:
 * - Rate limited to 1 request per second
 * - Includes User-Agent header as required
 * - Restricts search to Caloocan City area
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'LEIRS-Capstone/1.0';
const RATE_LIMIT_MS = 1000; // 1 request per second (Nominatim requirement)

let lastRequestTime = 0;

/**
 * Rate-limited fetch to comply with Nominatim usage policy
 */
async function rateLimitedFetch(url, options = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'User-Agent': USER_AGENT
    }
  });
}

/**
 * Search for addresses matching the query
 * Restricts search to Caloocan City area
 * 
 * @param {string} query - User's search query (e.g., "Zabarte Road")
 * @param {object} options - Search options
 * @returns {Promise<Array>} Array of address results with coordinates
 */
export async function searchAddress(query, options = {}) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    // Try multiple search strategies for better results
    const searchQueries = [
      `${query}, Caloocan`,
      `${query}, Caloocan City, Philippines`,
      `${query}, Metro Manila, Philippines`
    ];

    let allResults = [];

    for (const searchQuery of searchQueries) {
      const params = new URLSearchParams({
        format: 'json',
        q: searchQuery,
        limit: options.limit || 10,
        addressdetails: 1,
        countrycodes: 'ph', // Restrict to Philippines
      });

      const url = `${NOMINATIM_BASE_URL}/search?${params}`;
      console.log(`[Geocoding] Searching: ${searchQuery}`);
      console.log(`[Geocoding] URL: ${url}`);

      const response = await rateLimitedFetch(url);

      if (!response.ok) {
        console.warn(`[Geocoding] Search failed for query: ${searchQuery} - Status: ${response.status}`);
        continue;
      }

      const results = await response.json();
      console.log(`[Geocoding] Found ${results.length} results for: ${searchQuery}`);
      
      if (results.length > 0) {
        // Filter results to Caloocan area only
        const filteredResults = results.filter(result => {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          
          // Check if within Caloocan bounds
          if (!isValidCaloocanCoordinate(lat, lon)) {
            console.log(`[Geocoding] Filtered out (coords): ${result.display_name}`);
            return false;
          }
          
          // Also check if display name mentions Caloocan
          const displayName = result.display_name?.toLowerCase() || '';
          const hasCaloocan = displayName.includes('caloocan');
          if (!hasCaloocan) {
            console.log(`[Geocoding] Filtered out (name): ${result.display_name}`);
          }
          return hasCaloocan;
        });

        console.log(`[Geocoding] After filtering: ${filteredResults.length} results`);
        allResults = [...allResults, ...filteredResults];
        
        // If we got good results, stop searching
        if (filteredResults.length >= 3) {
          break;
        }
      }
    }

    // Remove duplicates based on place_id
    const uniqueResults = [];
    const seenPlaceIds = new Set();
    
    for (const result of allResults) {
      if (!seenPlaceIds.has(result.place_id)) {
        seenPlaceIds.add(result.place_id);
        uniqueResults.push(result);
      }
    }

    console.log(`[Geocoding] Final results: ${uniqueResults.length}`);
    return uniqueResults.slice(0, options.limit || 5);
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    throw error;
  }
}

/**
 * Reverse geocode: Get address from coordinates
 * 
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>} Address information
 */
export async function reverseGeocode(latitude, longitude) {
  if (!isValidCaloocanCoordinate(latitude, longitude)) {
    throw new Error('Coordinates must be within Caloocan City');
  }

  try {
    const params = new URLSearchParams({
      format: 'json',
      lat: latitude,
      lon: longitude,
      addressdetails: 1
    });

    const response = await rateLimitedFetch(
      `${NOMINATIM_BASE_URL}/reverse?${params}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Validate that coordinates are within Caloocan City bounds
 * Prevents saving incorrect/distant locations
 * 
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} True if coordinates are in Caloocan
 */
export function isValidCaloocanCoordinate(lat, lon) {
  // Caloocan City approximate bounds (expanded for better coverage)
  // Latitude: 14.60° to 14.90° N
  // Longitude: 120.90° to 121.20° E
  // This covers Caloocan and immediate surrounding areas
  return (
    lat >= 14.60 && lat <= 14.90 &&
    lon >= 120.90 && lon <= 121.20
  );
}

/**
 * Format a Nominatim result for display
 * 
 * @param {object} result - Nominatim search result
 * @returns {object} Formatted location object
 */
export function formatLocationResult(result) {
  return {
    address: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    placeId: result.place_id,
    type: result.type,
    raw: result
  };
}
