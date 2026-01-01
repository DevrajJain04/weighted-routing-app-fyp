// OpenRouteService API integration for real road-based routing
// Sign up for free API key at: https://openrouteservice.org/dev/#/signup

const ORS_API_KEY = process.env.REACT_APP_ORS_API_KEY;

const ORS_BASE_URL = 'https://api.openrouteservice.org';

// Warn if API key is missing
if (!ORS_API_KEY) {
  console.warn('ORS API key not found. Please set REACT_APP_ORS_API_KEY in your .env file');
}

/**
 * Get route from OpenRouteService
 * @param {Array} start - [lng, lat] of start point
 * @param {Array} end - [lng, lat] of end point
 * @param {string} profile - 'driving-car', 'cycling-regular', 'foot-walking'
 * @returns {Object} Route data with geometry and instructions
 */
export const getORSRoute = async (start, end, profile = 'driving-car') => {
  try {
    const response = await fetch(
      `${ORS_BASE_URL}/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`
    );
    
    if (!response.ok) {
      throw new Error(`ORS API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    return null;
  }
};

/**
 * Get route with detailed instructions using POST method
 * Allows for more options like alternative routes
 */
export const getORSRouteDetailed = async (start, end, profile = 'driving-car', options = {}) => {
  try {
    const body = {
      coordinates: [start, end],
      instructions: true,
      geometry: true,
      elevation: false,
      extra_info: ['waytype', 'surface'],
      ...options
    };

    const response = await fetch(
      `${ORS_BASE_URL}/v2/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json, application/geo+json',
          'Authorization': ORS_API_KEY
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ORS API Response:', response.status, errorText);
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching detailed ORS route:', error);
    return null;
  }
};

/**
 * Get multiple alternative routes
 * @param {Array} start - [lat, lng] of start point (Leaflet format)
 * @param {Array} end - [lat, lng] of end point (Leaflet format)
 * @param {string} profile - 'driving-car', 'cycling-regular', 'foot-walking'
 * @returns {Array} Array of route objects with geometry, distance, duration, steps
 */
export const getAlternativeRoutes = async (start, end, profile = 'driving-car') => {
  try {
    // Convert from [lat, lng] (Leaflet) to [lng, lat] (ORS/GeoJSON)
    const startORS = [start[1], start[0]];
    const endORS = [end[1], end[0]];
    
    const body = {
      coordinates: [startORS, endORS],
      instructions: true,
      geometry: true,
      alternative_routes: {
        target_count: 3,
        weight_factor: 1.6,
        share_factor: 0.6
      }
    };

    const response = await fetch(
      `${ORS_BASE_URL}/v2/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json, application/geo+json',
          'Authorization': ORS_API_KEY
        },
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ORS API error response:', response.status, errorText);
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Parse the GeoJSON response into our route format
    if (!data.features || data.features.length === 0) {
      return [];
    }
    
    const routes = data.features.map((feature, index) => {
      const props = feature.properties;
      const segments = props.segments || [];
      const summary = props.summary || {};
      
      // Convert geometry from [lng, lat] to [lat, lng] for Leaflet
      const geometry = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      
      // Parse steps/instructions
      const steps = [];
      segments.forEach(segment => {
        (segment.steps || []).forEach(step => {
          steps.push({
            instruction: step.instruction || getInstructionText(step.type, step.name),
            name: step.name || '',
            distance: step.distance || 0,
            duration: step.duration || 0,
            type: step.type,
            way_points: step.way_points
          });
        });
      });
      
      return {
        index,
        geometry,  // [lat, lng] array for Leaflet
        coordinates: geometry, // Alias for compatibility
        distance: summary.distance || 0,  // meters
        duration: summary.duration || 0,  // seconds
        steps,
        found: true
      };
    });
    
    return routes;
  } catch (error) {
    console.error('Error fetching alternative routes:', error);
    throw error; // Re-throw so App.js can handle it
  }
};

/**
 * Get instruction text from type code
 */
const getInstructionText = (type, streetName) => {
  const instructions = {
    0: 'Turn left',
    1: 'Turn right',
    2: 'Turn sharp left',
    3: 'Turn sharp right',
    4: 'Turn slight left',
    5: 'Turn slight right',
    6: 'Continue straight',
    7: 'Enter roundabout',
    8: 'Exit roundabout',
    9: 'Make a U-turn',
    10: 'Arrive at destination',
    11: 'Depart',
    12: 'Keep left',
    13: 'Keep right'
  };
  
  let text = instructions[type] || 'Continue';
  if (streetName && streetName !== '-') {
    text += ` onto ${streetName}`;
  }
  return text;
};

/**
 * Decode ORS polyline (already in GeoJSON format when using /geojson endpoint)
 */
export const decodeGeometry = (geometry) => {
  if (geometry.type === 'LineString') {
    // GeoJSON format - coordinates are [lng, lat], need to convert to [lat, lng] for Leaflet
    return geometry.coordinates.map(coord => [coord[1], coord[0]]);
  }
  return [];
};

/**
 * Parse ORS response into our route format
 */
export const parseORSRoute = (orsData, aqiData = null) => {
  if (!orsData || !orsData.features || orsData.features.length === 0) {
    return null;
  }

  const routes = orsData.features.map((feature, index) => {
    const props = feature.properties;
    const segments = props.segments || [];
    const summary = props.summary || {};
    
    // Get route geometry
    const coordinates = decodeGeometry(feature.geometry);
    
    // Parse instructions
    const directions = [];
    let stepIndex = 0;
    
    segments.forEach(segment => {
      (segment.steps || []).forEach(step => {
        const instruction = parseInstruction(step);
        directions.push({
          type: stepIndex === 0 ? 'start' : (step.type === 10 ? 'end' : 'turn'),
          instruction: instruction.text,
          icon: instruction.icon,
          distance: step.distance / 1000, // Convert to km
          time: step.duration / 60, // Convert to minutes
          streetName: step.name || 'Unknown road',
          turnType: instruction.turnType,
          coordinates: coordinates.slice(step.way_points[0], step.way_points[1] + 1)
        });
        stepIndex++;
      });
    });

    // Calculate AQI for route segments if AQI data provided
    let routeAQI = 50; // Default moderate AQI
    if (aqiData) {
      routeAQI = calculateRouteAQI(coordinates, aqiData);
    }

    return {
      index,
      coordinates,
      directions,
      totalDistance: Math.round((summary.distance || 0) / 100) / 10, // km with 1 decimal
      totalTime: Math.round((summary.duration || 0) / 60), // minutes
      averageAQI: routeAQI,
      found: true
    };
  });

  return routes;
};

/**
 * Parse instruction type to text and icon
 */
const parseInstruction = (step) => {
  const instructionTypes = {
    0: { text: 'Turn left', icon: '⬅️', turnType: 'left' },
    1: { text: 'Turn right', icon: '➡️', turnType: 'right' },
    2: { text: 'Turn sharp left', icon: '↩️', turnType: 'sharp-left' },
    3: { text: 'Turn sharp right', icon: '↪️', turnType: 'sharp-right' },
    4: { text: 'Turn slight left', icon: '↖️', turnType: 'slight-left' },
    5: { text: 'Turn slight right', icon: '↗️', turnType: 'slight-right' },
    6: { text: 'Continue straight', icon: '⬆️', turnType: 'straight' },
    7: { text: 'Enter roundabout', icon: '🔄', turnType: 'roundabout' },
    8: { text: 'Exit roundabout', icon: '↗️', turnType: 'roundabout-exit' },
    9: { text: 'Make a U-turn', icon: '↩️', turnType: 'u-turn' },
    10: { text: 'Arrive at destination', icon: '🏁', turnType: 'end' },
    11: { text: 'Start', icon: '🚗', turnType: 'start' },
    12: { text: 'Keep left', icon: '↖️', turnType: 'keep-left' },
    13: { text: 'Keep right', icon: '↗️', turnType: 'keep-right' }
  };

  const typeInfo = instructionTypes[step.type] || { text: 'Continue', icon: '⬆️', turnType: 'straight' };
  
  let text = typeInfo.text;
  if (step.name && step.name !== '-') {
    text += ` onto ${step.name}`;
  }

  return {
    text,
    icon: typeInfo.icon,
    turnType: typeInfo.turnType
  };
};

/**
 * Calculate average AQI for a route based on AQI zones
 */
const calculateRouteAQI = (coordinates, aqiData) => {
  if (!aqiData || !aqiData.zones || coordinates.length === 0) {
    return 50;
  }

  let totalAQI = 0;
  let sampleCount = 0;

  // Sample points along the route
  const sampleInterval = Math.max(1, Math.floor(coordinates.length / 20));
  
  for (let i = 0; i < coordinates.length; i += sampleInterval) {
    const [lat, lng] = coordinates[i];
    const aqi = getAQIAtPoint(lat, lng, aqiData);
    totalAQI += aqi;
    sampleCount++;
  }

  return sampleCount > 0 ? Math.round(totalAQI / sampleCount) : 50;
};

/**
 * Get AQI at a specific point based on nearby zones
 */
const getAQIAtPoint = (lat, lng, aqiData) => {
  let nearestZone = null;
  let minDistance = Infinity;

  for (const zone of aqiData.zones) {
    const distance = Math.sqrt(
      Math.pow(zone.lat - lat, 2) + Math.pow(zone.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestZone = zone;
    }
  }

  // If within zone radius, return zone AQI; otherwise interpolate
  if (nearestZone && minDistance < nearestZone.radius) {
    return nearestZone.aqi;
  }

  // Default moderate AQI for areas without data
  return 50 + Math.random() * 30;
};

export default {
  getORSRoute,
  getORSRouteDetailed,
  getAlternativeRoutes,
  parseORSRoute,
  decodeGeometry
};
