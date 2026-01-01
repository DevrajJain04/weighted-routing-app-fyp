// AQI Zone data - defines air quality across different areas
// NOTE: This file provides zone-based AQI data for real-time simulation.
// For route-based AQI fetching, use services/aqiService.js which supports
// real API integration (OpenWeather, WAQI, etc.)

import { fetchRouteAQI, fetchLocationAQI, getAQICategory } from '../services/aqiService';

// Re-export the new service functions for backward compatibility
export { fetchRouteAQI, fetchLocationAQI, getAQICategory };

// AQI zones around London - each zone has a center point, radius, and AQI value
// This data is used for real-time simulation display on the map
export const aqiZones = [
  // Green areas - Parks and open spaces (LOW AQI - Good air)
  { id: 'hyde-park', name: 'Hyde Park', lat: 51.5073, lng: -0.1657, radius: 0.015, aqi: 28, type: 'park' },
  { id: 'regents-park', name: 'Regents Park', lat: 51.5313, lng: -0.1570, radius: 0.012, aqi: 25, type: 'park' },
  { id: 'primrose-hill', name: 'Primrose Hill', lat: 51.5396, lng: -0.1615, radius: 0.008, aqi: 22, type: 'park' },
  { id: 'kensington-gardens', name: 'Kensington Gardens', lat: 51.5069, lng: -0.1795, radius: 0.012, aqi: 30, type: 'park' },
  { id: 'holland-park', name: 'Holland Park', lat: 51.5028, lng: -0.2040, radius: 0.008, aqi: 32, type: 'park' },
  { id: 'battersea-park', name: 'Battersea Park', lat: 51.4791, lng: -0.1560, radius: 0.010, aqi: 35, type: 'park' },
  { id: 'clapham-common', name: 'Clapham Common', lat: 51.4615, lng: -0.1380, radius: 0.012, aqi: 30, type: 'park' },
  { id: 'greenwich-park', name: 'Greenwich Park', lat: 51.4769, lng: -0.0005, radius: 0.010, aqi: 28, type: 'park' },
  { id: 'victoria-park', name: 'Victoria Park', lat: 51.5362, lng: -0.0378, radius: 0.012, aqi: 32, type: 'park' },
  { id: 'hampstead-heath', name: 'Hampstead Heath', lat: 51.5609, lng: -0.1631, radius: 0.020, aqi: 20, type: 'park' },
  
  // Residential areas (MODERATE AQI)
  { id: 'notting-hill', name: 'Notting Hill', lat: 51.5139, lng: -0.2050, radius: 0.010, aqi: 45, type: 'residential' },
  { id: 'chelsea', name: 'Chelsea', lat: 51.4875, lng: -0.1687, radius: 0.012, aqi: 48, type: 'residential' },
  { id: 'hampstead', name: 'Hampstead', lat: 51.5565, lng: -0.1781, radius: 0.010, aqi: 38, type: 'residential' },
  { id: 'dulwich', name: 'Dulwich', lat: 51.4450, lng: -0.0850, radius: 0.015, aqi: 42, type: 'residential' },
  { id: 'wimbledon', name: 'Wimbledon', lat: 51.4214, lng: -0.2064, radius: 0.015, aqi: 35, type: 'residential' },
  
  // Commercial/Urban centers (HIGH AQI)
  { id: 'oxford-circus', name: 'Oxford Circus', lat: 51.5152, lng: -0.1418, radius: 0.008, aqi: 95, type: 'commercial' },
  { id: 'piccadilly', name: 'Piccadilly Circus', lat: 51.5099, lng: -0.1342, radius: 0.006, aqi: 92, type: 'commercial' },
  { id: 'covent-garden', name: 'Covent Garden', lat: 51.5129, lng: -0.1243, radius: 0.006, aqi: 88, type: 'commercial' },
  { id: 'soho', name: 'Soho', lat: 51.5137, lng: -0.1319, radius: 0.008, aqi: 90, type: 'commercial' },
  { id: 'leicester-square', name: 'Leicester Square', lat: 51.5103, lng: -0.1301, radius: 0.005, aqi: 85, type: 'commercial' },
  
  // Major roads and junctions (VERY HIGH AQI)
  { id: 'marble-arch', name: 'Marble Arch', lat: 51.5136, lng: -0.1589, radius: 0.005, aqi: 110, type: 'traffic' },
  { id: 'euston-road', name: 'Euston Road', lat: 51.5280, lng: -0.1340, radius: 0.020, aqi: 115, type: 'traffic' },
  { id: 'old-street', name: 'Old Street Roundabout', lat: 51.5256, lng: -0.0875, radius: 0.006, aqi: 105, type: 'traffic' },
  { id: 'elephant-castle', name: 'Elephant & Castle', lat: 51.4946, lng: -0.1007, radius: 0.008, aqi: 108, type: 'traffic' },
  { id: 'vauxhall', name: 'Vauxhall Cross', lat: 51.4861, lng: -0.1228, radius: 0.006, aqi: 102, type: 'traffic' },
  
  // Industrial/Heavy traffic zones (UNHEALTHY AQI)
  { id: 'city-road', name: 'City Road A501', lat: 51.5300, lng: -0.0950, radius: 0.015, aqi: 125, type: 'industrial' },
  { id: 'tower-bridge', name: 'Tower Bridge Road', lat: 51.5055, lng: -0.0754, radius: 0.008, aqi: 118, type: 'traffic' },
  { id: 'blackwall-tunnel', name: 'Blackwall Tunnel Approach', lat: 51.5078, lng: -0.0095, radius: 0.010, aqi: 145, type: 'industrial' },
  { id: 'isle-of-dogs', name: 'Isle of Dogs', lat: 51.4948, lng: -0.0183, radius: 0.015, aqi: 135, type: 'industrial' },
  { id: 'canary-wharf', name: 'Canary Wharf', lat: 51.5054, lng: -0.0235, radius: 0.012, aqi: 130, type: 'industrial' },
  { id: 'a13-corridor', name: 'A13 Corridor', lat: 51.5100, lng: -0.0400, radius: 0.025, aqi: 155, type: 'industrial' },
  { id: 'stratford', name: 'Stratford High Street', lat: 51.5430, lng: -0.0026, radius: 0.010, aqi: 120, type: 'traffic' },
  
  // River areas (Generally better air)
  { id: 'south-bank', name: 'South Bank', lat: 51.5076, lng: -0.1150, radius: 0.015, aqi: 55, type: 'riverside' },
  { id: 'embankment', name: 'Victoria Embankment', lat: 51.5074, lng: -0.1224, radius: 0.012, aqi: 60, type: 'riverside' },
  { id: 'thames-barrier', name: 'Thames Barrier Park', lat: 51.5010, lng: 0.0358, radius: 0.008, aqi: 45, type: 'riverside' },
];

// Store for real-time AQI updates
let currentAQIData = {
  zones: [...aqiZones],
  lastUpdate: Date.now()
};

let updateCallbacks = [];

/**
 * Subscribe to AQI updates
 */
export const subscribeToAQIUpdates = (callback) => {
  updateCallbacks.push(callback);
  return () => {
    updateCallbacks = updateCallbacks.filter(cb => cb !== callback);
  };
};

/**
 * Get current AQI data
 */
export const getAQIData = () => currentAQIData;

/**
 * Simulate real-time AQI updates
 */
export const startAQISimulation = () => {
  const updateInterval = setInterval(() => {
    currentAQIData = {
      zones: currentAQIData.zones.map(zone => ({
        ...zone,
        // Fluctuate AQI by ±15% to simulate real-time changes
        aqi: Math.max(15, Math.min(200, 
          zone.aqi + (Math.random() - 0.5) * zone.aqi * 0.15
        ))
      })),
      lastUpdate: Date.now()
    };
    
    updateCallbacks.forEach(callback => callback(currentAQIData));
  }, 8000); // Update every 8 seconds
  
  return () => clearInterval(updateInterval);
};

/**
 * Get AQI at a specific coordinate
 */
export const getAQIAtLocation = (lat, lng) => {
  let weightedAQI = 0;
  let totalWeight = 0;

  for (const zone of currentAQIData.zones) {
    const distance = Math.sqrt(
      Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2)
    );
    
    // Use inverse distance weighting
    if (distance < zone.radius * 3) {
      const weight = 1 / (distance + 0.001);
      weightedAQI += zone.aqi * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round(weightedAQI / totalWeight) : 50;
};

/**
 * Calculate AQI along a route (array of [lat, lng] coordinates)
 * Uses local zone-based data for real-time simulation display.
 * 
 * For production use with real API data, use fetchRouteAQI from aqiService.js instead.
 * 
 * @param {Array<[number, number]>} coordinates - Array of [lat, lng] points
 * @returns {Object} AQI data with average, min, max, and segments
 */
export const calculateRouteAQI = (coordinates) => {
  if (!coordinates || coordinates.length === 0) {
    return {
      average: 50,
      max: 50,
      min: 50,
      segments: [],
      source: 'default'
    };
  }

  let totalAQI = 0;
  let sampleCount = 0;
  let maxAQI = 0;
  let minAQI = 500;
  const segmentAQIs = [];

  // Sample points along the route
  const sampleInterval = Math.max(1, Math.floor(coordinates.length / 30));
  
  for (let i = 0; i < coordinates.length; i += sampleInterval) {
    const [lat, lng] = coordinates[i];
    const aqi = getAQIAtLocation(lat, lng);
    totalAQI += aqi;
    sampleCount++;
    maxAQI = Math.max(maxAQI, aqi);
    minAQI = Math.min(minAQI, aqi);
    
    segmentAQIs.push({
      index: i,
      lat,
      lng,
      aqi
    });
  }

  return {
    average: sampleCount > 0 ? Math.round(totalAQI / sampleCount) : 50,
    max: maxAQI,
    min: minAQI,
    segments: segmentAQIs,
    source: 'zone-simulation'
  };
};

/**
 * Async version that can use real API data via aqiService
 * Call this when you want to use real AQI API data instead of zone simulation
 * 
 * @param {Array<[number, number]>} coordinates - Array of [lat, lng] points
 * @returns {Promise<Object>} AQI data with average, min, max, and segments
 */
export const calculateRouteAQIAsync = async (coordinates) => {
  try {
    const result = await fetchRouteAQI(coordinates);
    return {
      average: result.average,
      max: result.max,
      min: result.min,
      segments: result.segments,
      source: result.provider,
      fetchedAt: result.fetchedAt
    };
  } catch (error) {
    console.error('Error fetching route AQI from service:', error);
    // Fallback to zone-based calculation
    return calculateRouteAQI(coordinates);
  }
};

/**
 * Get AQI category and color
 */
export const getAQIInfo = (aqi) => {
  if (aqi <= 50) return { category: 'Good', color: '#22c55e', bgColor: '#dcfce7' };
  if (aqi <= 100) return { category: 'Moderate', color: '#84cc16', bgColor: '#ecfccb' };
  if (aqi <= 150) return { category: 'Unhealthy for Sensitive', color: '#f59e0b', bgColor: '#fef3c7' };
  if (aqi <= 200) return { category: 'Unhealthy', color: '#ef4444', bgColor: '#fee2e2' };
  return { category: 'Very Unhealthy', color: '#7c2d12', bgColor: '#fecaca' };
};

export default {
  aqiZones,
  getAQIData,
  subscribeToAQIUpdates,
  startAQISimulation,
  getAQIAtLocation,
  calculateRouteAQI,
  calculateRouteAQIAsync,
  getAQIInfo,
  // Re-exported from aqiService for convenience
  fetchRouteAQI,
  fetchLocationAQI,
  getAQICategory
};
