import React, { useState, useCallback, useEffect, useRef } from 'react';
import MapComponent from './components/MapComponent';
import WeightSliders from './components/WeightSliders';
import LocationSearch, { reverseGeocode } from './components/LocationSearch';
import DirectionsPanel from './components/DirectionsPanel';
import { getORSRoute, getAlternativeRoutes } from './services/routingService';
import { startAQISimulation, subscribeToAQIUpdates, calculateRouteAQI, getAQIAtLocation } from './data/aqiData';
import 'leaflet/dist/leaflet.css';

function App() {
  // State for weights
  const [weights, setWeights] = useState({
    w1: 0.33,
    w2: 0.33,
    w3: 0.34,
  });

  // State for locations (coordinates)
  const [startCoords, setStartCoords] = useState([51.5074, -0.1278]); // Central London
  const [endCoords, setEndCoords] = useState([51.5155, -0.0922]);     // Near Tower of London
  const [startName, setStartName] = useState('Central London');
  const [endName, setEndName] = useState('Tower of London');

  // State for routes
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for UI
  const [clickMode, setClickMode] = useState(null);
  const [showDirections, setShowDirections] = useState(true);
  const [travelMode, setTravelMode] = useState('driving-car'); // driving-car, cycling-regular, foot-walking

  // State for real-time AQI
  const [lastAQIUpdate, setLastAQIUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Ref to track if calculation is needed
  const calculationPending = useRef(false);

  // Calculate routes using OpenRouteService
  const calculateRoutes = useCallback(async () => {
    if (!startCoords || !endCoords) {
      setRoutes([]);
      return;
    }

    // Check if same location
    const distance = Math.sqrt(
      Math.pow(startCoords[0] - endCoords[0], 2) + 
      Math.pow(startCoords[1] - endCoords[1], 2)
    );
    if (distance < 0.0001) {
      setRoutes([]);
      setError('Start and end locations are the same');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get alternative routes from ORS
      const orsRoutes = await getAlternativeRoutes(startCoords, endCoords, travelMode);
      
      if (!orsRoutes || orsRoutes.length === 0) {
        setError('No routes found. Try different locations.');
        setRoutes([]);
        return;
      }

      // Process routes and add AQI data
      const processedRoutes = orsRoutes.map((route, index) => {
        // Calculate AQI along the route
        const aqiData = calculateRouteAQI(route.geometry);
        
        // Calculate weighted cost
        const normalizedDistance = route.distance / 10000; // Normalize to ~0-1
        const normalizedTime = route.duration / 3600;       // Normalize to ~0-1
        const normalizedAQI = aqiData.average / 150;        // Normalize to ~0-1 (fixed: was aqiData.averageAQI)
        
        const weightedCost = 
          weights.w1 * normalizedDistance +
          weights.w2 * normalizedTime +
          weights.w3 * normalizedAQI;

        return {
          ...route,
          index,
          aqiData,
          weightedCost,
          averageAQI: aqiData.average,  // Fixed: was aqiData.averageAQI
          maxAQI: aqiData.max,          // Fixed: was aqiData.maxAQI  
          minAQI: aqiData.min,          // Fixed: was aqiData.minAQI
          aqiSegments: aqiData.segments,
        };
      });

      // Sort by weighted cost
      processedRoutes.sort((a, b) => a.weightedCost - b.weightedCost);

      // Assign colors based on ranking
      const colors = ['#4CAF50', '#2196F3', '#FF9800'];
      const labels = ['Best Route', 'Alternative 1', 'Alternative 2'];
      
      processedRoutes.forEach((route, idx) => {
        route.color = colors[idx] || '#9E9E9E';
        route.label = labels[idx] || `Alternative ${idx}`;
        route.isBest = idx === 0;
      });

      setRoutes(processedRoutes);
      setSelectedRouteIndex(0);
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(err.message || 'Failed to calculate route. Please try again.');
      setRoutes([]);
    } finally {
      setIsLoading(false);
    }
  }, [startCoords, endCoords, weights, travelMode]);

  // Debounced route calculation
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateRoutes();
    }, 500);
    return () => clearTimeout(timer);
  }, [calculateRoutes]);

  // Start AQI simulation
  useEffect(() => {
    setIsLive(true);
    const stopSimulation = startAQISimulation();
    
    const unsubscribe = subscribeToAQIUpdates(() => {
      setLastAQIUpdate(Date.now());
      calculationPending.current = true;
    });

    return () => {
      stopSimulation();
      unsubscribe();
      setIsLive(false);
    };
  }, []);

  // Recalculate when AQI updates (debounced)
  useEffect(() => {
    if (calculationPending.current && routes.length > 0) {
      calculationPending.current = false;
      // Recalculate AQI for existing routes without re-fetching from ORS
      const updatedRoutes = routes.map(route => {
        const aqiData = calculateRouteAQI(route.geometry);
        const normalizedDistance = route.distance / 10000;
        const normalizedTime = route.duration / 3600;
        const normalizedAQI = aqiData.average / 150;  // Fixed: was aqiData.averageAQI
        
        const weightedCost = 
          weights.w1 * normalizedDistance +
          weights.w2 * normalizedTime +
          weights.w3 * normalizedAQI;

        return {
          ...route,
          aqiData,
          weightedCost,
          averageAQI: aqiData.average,  // Fixed: was aqiData.averageAQI
          maxAQI: aqiData.max,          // Fixed: was aqiData.maxAQI
          minAQI: aqiData.min,          // Fixed: was aqiData.minAQI
          aqiSegments: aqiData.segments,
        };
      });

      // Re-sort and re-color
      updatedRoutes.sort((a, b) => a.weightedCost - b.weightedCost);
      const colors = ['#4CAF50', '#2196F3', '#FF9800'];
      const labels = ['Best Route', 'Alternative 1', 'Alternative 2'];
      updatedRoutes.forEach((route, idx) => {
        route.color = colors[idx] || '#9E9E9E';
        route.label = labels[idx] || `Alternative ${idx}`;
        route.isBest = idx === 0;
      });

      setRoutes(updatedRoutes);
    }
  }, [lastAQIUpdate, routes, weights]);

  // Handle map click for setting locations
  // mode parameter is optional - if provided (from marker drag), use it; otherwise use clickMode state
  const handleMapClick = async (coords, mode) => {
    const activeMode = mode || clickMode;
    if (!activeMode || !coords) return;

    const name = await reverseGeocode(coords[0], coords[1]);
    
    if (activeMode === 'start') {
      setStartCoords(coords);
      setStartName(name);
    } else if (activeMode === 'end') {
      setEndCoords(coords);
      setEndName(name);
    }
    
    // Only reset clickMode if it was a map click (not a drag)
    if (!mode) {
      setClickMode(null);
    }
  };

  // Swap start and end
  const handleSwapLocations = () => {
    const tempCoords = startCoords;
    const tempName = startName;
    setStartCoords(endCoords);
    setStartName(endName);
    setEndCoords(tempCoords);
    setEndName(tempName);
  };

  // Get currently selected route
  const selectedRoute = routes[selectedRouteIndex];

  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  // Format distance
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Get AQI class for styling
  const getAQIClass = (aqi) => {
    if (aqi <= 50) return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-unhealthy-sensitive';
    if (aqi <= 200) return 'aqi-unhealthy';
    return 'aqi-very-unhealthy';
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🗺️ Smart Route Planner</h1>
        <p className="header-subtitle">Find the optimal route based on distance, time, and air quality</p>
      </header>

      <div className="main-content">
        <aside className="controls-panel">
          {/* Live AQI Status */}
          <div className="panel-section aqi-status">
            <div className={`live-indicator ${isLive ? 'live' : ''}`}>
              <span className="pulse-dot"></span>
              {isLive ? 'Live AQI Updates' : 'AQI Offline'}
            </div>
            {lastAQIUpdate && (
              <div className="last-update">
                Last update: {new Date(lastAQIUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Location Search */}
          <div className="panel-section locations-section">
            <h3>📍 Locations</h3>
            <LocationSearch
              label="Start"
              placeholder="Choose starting point..."
              value={startName}
              onChange={setStartName}
              onCoordinateChange={setStartCoords}
              icon="A"
              iconColor="#4CAF50"
              clickMode="start"
              onClickModeChange={setClickMode}
              currentClickMode={clickMode}
            />
            
            <button className="swap-button" onClick={handleSwapLocations} title="Swap locations">
              ⇅
            </button>
            
            <LocationSearch
              label="End"
              placeholder="Choose destination..."
              value={endName}
              onChange={setEndName}
              onCoordinateChange={setEndCoords}
              icon="B"
              iconColor="#F44336"
              clickMode="end"
              onClickModeChange={setClickMode}
              currentClickMode={clickMode}
            />

            {clickMode && (
              <div className="click-mode-hint">
                👆 Click on the map to set {clickMode === 'start' ? 'starting point' : 'destination'}
              </div>
            )}
          </div>

          {/* Travel Mode */}
          <div className="panel-section travel-mode-section">
            <h3>🚗 Travel Mode</h3>
            <div className="travel-mode-buttons">
              <button
                className={`mode-btn ${travelMode === 'driving-car' ? 'active' : ''}`}
                onClick={() => setTravelMode('driving-car')}
              >
                🚗 Drive
              </button>
              <button
                className={`mode-btn ${travelMode === 'cycling-regular' ? 'active' : ''}`}
                onClick={() => setTravelMode('cycling-regular')}
              >
                🚴 Cycle
              </button>
              <button
                className={`mode-btn ${travelMode === 'foot-walking' ? 'active' : ''}`}
                onClick={() => setTravelMode('foot-walking')}
              >
                🚶 Walk
              </button>
            </div>
          </div>

          {/* Weight Sliders */}
          <WeightSliders
            weights={weights}
            onWeightChange={setWeights}
          />

          {/* Route Alternatives */}
          {routes.length > 0 && (
            <div className="panel-section routes-section">
              <h3>🛣️ Routes</h3>
              <div className="route-alternatives">
                {routes.map((route, idx) => (
                  <div
                    key={idx}
                    className={`route-option ${selectedRouteIndex === idx ? 'selected' : ''}`}
                    onClick={() => setSelectedRouteIndex(idx)}
                    style={{ borderLeftColor: route.color }}
                  >
                    <div className="route-header">
                      <span className="route-label" style={{ color: route.color }}>
                        {route.isBest && '⭐ '}{route.label}
                      </span>
                    </div>
                    <div className="route-stats">
                      <span className="stat">
                        📏 {formatDistance(route.distance)}
                      </span>
                      <span className="stat">
                        ⏱️ {formatDuration(route.duration)}
                      </span>
                      <span className={`stat ${getAQIClass(route.averageAQI)}`}>
                        💨 AQI {Math.round(route.averageAQI)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </aside>

        <main className="map-container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <span>Calculating routes...</span>
            </div>
          )}
          
          <MapComponent
            startCoords={startCoords}
            endCoords={endCoords}
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            onRouteSelect={setSelectedRouteIndex}
            clickMode={clickMode}
            onMapClick={handleMapClick}
          />
          
          {/* Floating directions panel */}
          {selectedRoute && selectedRoute.steps && (
            <div className={`floating-directions ${showDirections ? 'open' : 'closed'}`}>
              <button 
                className="directions-toggle"
                onClick={() => setShowDirections(!showDirections)}
              >
                {showDirections ? '◀' : '▶'} Directions
              </button>
              {showDirections && (
                <DirectionsPanel
                  steps={selectedRoute.steps}
                  totalDistance={selectedRoute.distance}
                  totalDuration={selectedRoute.duration}
                  averageAQI={selectedRoute.averageAQI}
                  routeColor={selectedRoute.color}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Legend */}
      <div className="aqi-legend">
        <span className="legend-title">AQI:</span>
        <span className="legend-item aqi-good">Good (0-50)</span>
        <span className="legend-item aqi-moderate">Moderate (51-100)</span>
        <span className="legend-item aqi-unhealthy-sensitive">Unhealthy* (101-150)</span>
        <span className="legend-item aqi-unhealthy">Unhealthy (151+)</span>
      </div>
    </div>
  );
}

export default App;
