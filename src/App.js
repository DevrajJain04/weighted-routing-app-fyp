import React, { useState, useCallback, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import WeightSliders from './components/WeightSliders';
import NodeSelector from './components/NodeSelector';
import DirectionsPanel from './components/DirectionsPanel';
import RouteAlternatives from './components/RouteAlternatives';
import AQIStatus from './components/AQIStatus';
import { dijkstra, getAllRouteAlternatives, getPathColor } from './utils/dijkstra';
import { startAQISimulation, subscribeToAQIUpdates, getEdges } from './data/graphData';
import 'leaflet/dist/leaflet.css';

function App() {
  // State for weights
  const [weights, setWeights] = useState({
    w1: 0.33,
    w2: 0.33,
    w3: 0.34,
  });

  // State for selected nodes
  const [startNode, setStartNode] = useState('W'); // Notting Hill
  const [endNode, setEndNode] = useState('T');     // Docklands (will show different routes)

  // State for routes
  const [pathResult, setPathResult] = useState(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('custom');
  const [pathColor, setPathColor] = useState('#667eea');

  // State for UI
  const [clickMode, setClickMode] = useState(null);
  const [highlightedStep, setHighlightedStep] = useState(null);
  const [showDirections, setShowDirections] = useState(true);

  // State for real-time AQI
  const [lastAQIUpdate, setLastAQIUpdate] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [currentEdges, setCurrentEdges] = useState(getEdges());

  // Calculate route
  const calculateRoute = useCallback(() => {
    if (!startNode || !endNode) {
      setPathResult(null);
      setAlternativeRoutes(null);
      return;
    }

    if (startNode === endNode) {
      setPathResult({
        path: [startNode],
        pathEdges: [],
        directions: [],
        totalCost: 0,
        totalDistance: 0,
        totalTime: 0,
        averageAQI: 0,
        found: true,
      });
      setAlternativeRoutes(null);
      return;
    }

    // Get all route alternatives
    const routes = getAllRouteAlternatives(startNode, endNode, weights, currentEdges);
    setAlternativeRoutes(routes);

    // Set the selected route
    const selected = routes[selectedRoute];
    if (selected && selected.found) {
      setPathResult(selected);
      setPathColor(selected.color);
    } else if (routes.custom && routes.custom.found) {
      setPathResult(routes.custom);
      setPathColor(routes.custom.color);
      setSelectedRoute('custom');
    }
  }, [startNode, endNode, weights, selectedRoute, currentEdges]);

  // Handle route selection
  const handleRouteSelect = (routeKey) => {
    setSelectedRoute(routeKey);
    if (alternativeRoutes && alternativeRoutes[routeKey]) {
      setPathResult(alternativeRoutes[routeKey]);
      setPathColor(alternativeRoutes[routeKey].color);
    }
  };

  // Auto-calculate on changes
  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  // Start AQI simulation
  useEffect(() => {
    setIsLive(true);
    const stopSimulation = startAQISimulation();
    
    const unsubscribe = subscribeToAQIUpdates((newEdges) => {
      setCurrentEdges([...newEdges]);
      setLastAQIUpdate(Date.now());
    });

    return () => {
      stopSimulation();
      unsubscribe();
      setIsLive(false);
    };
  }, []);

  // Recalculate when edges update
  useEffect(() => {
    if (startNode && endNode) {
      calculateRoute();
    }
  }, [currentEdges, calculateRoute, startNode, endNode]);

  // Swap start and end
  const handleSwapLocations = () => {
    const temp = startNode;
    setStartNode(endNode);
    setEndNode(temp);
  };

  // Handle step hover for highlighting on map
  const handleStepHover = (nodeId) => {
    setHighlightedStep(nodeId);
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🗺️ Smart Route Planner</h1>
        <p className="header-subtitle">Find the optimal route based on distance, time, and air quality</p>
      </header>

      <div className="main-content">
        <aside className="controls-panel">
          <AQIStatus lastUpdate={lastAQIUpdate} isLive={isLive} />

          <NodeSelector
            startNode={startNode}
            endNode={endNode}
            onStartChange={setStartNode}
            onEndChange={setEndNode}
            clickMode={clickMode}
            onClickModeChange={setClickMode}
            onSwapLocations={handleSwapLocations}
          />

          <WeightSliders
            weights={weights}
            onWeightChange={(newWeights) => {
              setWeights(newWeights);
              setSelectedRoute('custom');
            }}
          />

          {alternativeRoutes && (
            <RouteAlternatives
              routes={alternativeRoutes}
              selectedRoute={selectedRoute}
              onRouteSelect={handleRouteSelect}
            />
          )}

          {pathResult && !pathResult.found && startNode && endNode && (
            <div className="no-route-warning">
              ⚠️ No route found between selected points!
            </div>
          )}
        </aside>

        <main className="map-container">
          <MapComponent
            startNode={startNode}
            endNode={endNode}
            path={pathResult?.path || []}
            pathColor={pathColor}
            alternativeRoutes={alternativeRoutes}
            selectedRoute={selectedRoute}
            onStartChange={setStartNode}
            onEndChange={setEndNode}
            clickMode={clickMode}
            onMapClick={setClickMode}
            highlightedStep={highlightedStep}
          />
          
          {/* Floating directions panel */}
          {pathResult && pathResult.found && pathResult.directions && (
            <div className={`floating-directions ${showDirections ? 'open' : 'closed'}`}>
              <button 
                className="directions-toggle"
                onClick={() => setShowDirections(!showDirections)}
              >
                {showDirections ? '◀' : '▶'} Directions
              </button>
              {showDirections && (
                <DirectionsPanel
                  directions={pathResult.directions}
                  totalDistance={pathResult.totalDistance}
                  totalTime={pathResult.totalTime}
                  averageAQI={pathResult.averageAQI}
                  onStepHover={handleStepHover}
                  onStepClick={handleStepHover}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
