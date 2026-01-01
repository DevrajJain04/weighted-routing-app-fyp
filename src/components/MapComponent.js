import React, { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { nodes, getEdges, findNearestNode } from '../data/graphData';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom draggable pin icons (Google Maps style)
const createPinIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative;">
        <svg width="40" height="50" viewBox="0 0 40 50" style="filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));">
          <path d="M20 0 C9 0 0 9 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 9 31 0 20 0 Z" fill="${color}"/>
          <circle cx="20" cy="18" r="8" fill="white"/>
          <text x="20" y="22" text-anchor="middle" fill="${color}" font-size="12" font-weight="bold">${label}</text>
        </svg>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

const startPinIcon = createPinIcon('#22c55e', 'A');
const endPinIcon = createPinIcon('#ef4444', 'B');

const createNodeIcon = (aqi) => {
  let color = '#6b7280';
  if (aqi < 50) color = '#22c55e';
  else if (aqi < 100) color = '#84cc16';
  else if (aqi < 150) color = '#f59e0b';
  else color = '#ef4444';
  
  return L.divIcon({
    className: 'node-marker',
    html: `<div style="
      background: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

// Draggable marker component
const DraggableMarker = ({ position, icon, onDragEnd, popupContent }) => {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onDragEnd(newPos.lat, newPos.lng);
        }
      },
    }),
    [onDragEnd],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={icon}
    >
      <Popup>{popupContent}</Popup>
    </Marker>
  );
};

// Map click handler for setting markers
const MapClickHandler = ({ onMapClick, mode }) => {
  useMapEvents({
    click: (e) => {
      if (mode) {
        onMapClick(e.latlng.lat, e.latlng.lng, mode);
      }
    },
  });
  return null;
};

// Edge lines with AQI-based coloring
const EdgeLines = ({ edges }) => {
  const drawnEdges = new Set();
  
  return (
    <>
      {edges.map((edge, index) => {
        const edgeKey = [edge.from, edge.to].sort().join('-');
        if (drawnEdges.has(edgeKey)) return null;
        drawnEdges.add(edgeKey);
        
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];
        if (!fromNode || !toNode) return null;
        
        // Color based on AQI
        let color = '#d1d5db';
        let weight = 2;
        let opacity = 0.5;
        
        if (edge.averageAQI < 50) {
          color = '#86efac';
        } else if (edge.averageAQI < 100) {
          color = '#bef264';
        } else if (edge.averageAQI > 120) {
          color = '#fca5a5';
        }
        
        return (
          <Polyline
            key={`edge-${index}-${edgeKey}`}
            positions={[[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]]}
            pathOptions={{ color, weight, opacity, dashArray: '5, 10' }}
          />
        );
      })}
    </>
  );
};

// Map bounds handler
const MapBounds = ({ path, startNode, endNode }) => {
  const map = useMap();

  useEffect(() => {
    if (path && path.length > 1) {
      const pathCoords = path.map(nodeId => [nodes[nodeId].lat, nodes[nodeId].lng]);
      const bounds = L.latLngBounds(pathCoords);
      map.fitBounds(bounds, { padding: [100, 100] });
    } else if (startNode && endNode) {
      const bounds = L.latLngBounds([
        [nodes[startNode].lat, nodes[startNode].lng],
        [nodes[endNode].lat, nodes[endNode].lng]
      ]);
      map.fitBounds(bounds, { padding: [100, 100] });
    }
  }, [map, path, startNode, endNode]);

  return null;
};

const MapComponent = ({ 
  startNode, 
  endNode, 
  path, 
  pathColor,
  alternativeRoutes,
  selectedRoute,
  onStartChange,
  onEndChange,
  clickMode,
  onMapClick,
  highlightedStep
}) => {
  const edges = getEdges();
  
  // Convert path to coordinates
  const pathCoordinates = path && path.length > 0
    ? path.map(nodeId => [nodes[nodeId].lat, nodes[nodeId].lng])
    : [];

  // Handle draggable marker drag end
  const handleStartDragEnd = (lat, lng) => {
    const nearestNode = findNearestNode(lat, lng);
    if (nearestNode && nearestNode.id !== endNode) {
      onStartChange(nearestNode.id);
    }
  };

  const handleEndDragEnd = (lat, lng) => {
    const nearestNode = findNearestNode(lat, lng);
    if (nearestNode && nearestNode.id !== startNode) {
      onEndChange(nearestNode.id);
    }
  };

  const handleMapClickInternal = (lat, lng, mode) => {
    const nearestNode = findNearestNode(lat, lng);
    if (nearestNode) {
      if (mode === 'start' && nearestNode.id !== endNode) {
        onStartChange(nearestNode.id);
      } else if (mode === 'end' && nearestNode.id !== startNode) {
        onEndChange(nearestNode.id);
      }
    }
    onMapClick && onMapClick(null);
  };

  // Get average AQI for nodes
  const getNodeAQI = (nodeId) => {
    const nodeEdges = edges.filter(e => e.from === nodeId || e.to === nodeId);
    if (nodeEdges.length === 0) return 75;
    return nodeEdges.reduce((sum, e) => sum + e.averageAQI, 0) / nodeEdges.length;
  };

  return (
    <MapContainer
      center={[51.51, -0.12]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapBounds path={path} startNode={startNode} endNode={endNode} />
      <MapClickHandler onMapClick={handleMapClickInternal} mode={clickMode} />
      
      {/* Background edges */}
      <EdgeLines edges={edges} />
      
      {/* Alternative routes (shown as dashed lines) */}
      {alternativeRoutes && Object.entries(alternativeRoutes).map(([key, route]) => {
        if (!route.found || key === selectedRoute || route.path.length < 2) return null;
        const coords = route.path.map(nodeId => [nodes[nodeId].lat, nodes[nodeId].lng]);
        return (
          <Polyline
            key={`alt-${key}`}
            positions={coords}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.4,
              dashArray: '10, 10'
            }}
          />
        );
      })}
      
      {/* Main path */}
      {pathCoordinates.length > 1 && (
        <Polyline
          positions={pathCoordinates}
          pathOptions={{
            color: pathColor,
            weight: 6,
            opacity: 0.9,
          }}
        />
      )}
      
      {/* Node markers (excluding start/end) */}
      {Object.values(nodes).map((node) => {
        if (node.id === startNode || node.id === endNode) return null;
        const aqi = getNodeAQI(node.id);
        
        return (
          <Marker
            key={node.id}
            position={[node.lat, node.lng]}
            icon={createNodeIcon(aqi)}
            eventHandlers={{
              click: () => {
                if (clickMode === 'start') {
                  onStartChange(node.id);
                  onMapClick && onMapClick(null);
                } else if (clickMode === 'end') {
                  onEndChange(node.id);
                  onMapClick && onMapClick(null);
                }
              }
            }}
          >
            <Popup>
              <div style={{ textAlign: 'center', minWidth: '150px' }}>
                <strong style={{ fontSize: '14px' }}>{node.name}</strong>
                <br />
                <small style={{ color: '#666' }}>{node.address}</small>
                <div style={{ marginTop: '8px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                  <button
                    onClick={() => { onStartChange(node.id); }}
                    style={{
                      padding: '4px 8px',
                      background: '#22c55e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Set Start
                  </button>
                  <button
                    onClick={() => { onEndChange(node.id); }}
                    style={{
                      padding: '4px 8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Set End
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      {/* Highlighted step marker */}
      {highlightedStep && nodes[highlightedStep] && (
        <Marker
          position={[nodes[highlightedStep].lat, nodes[highlightedStep].lng]}
          icon={L.divIcon({
            className: 'highlight-marker',
            html: `<div style="
              background: #3b82f6;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
              animation: pulse 1s infinite;
            "></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })}
        />
      )}
      
      {/* Start marker (draggable) */}
      {startNode && nodes[startNode] && (
        <DraggableMarker
          position={[nodes[startNode].lat, nodes[startNode].lng]}
          icon={startPinIcon}
          onDragEnd={handleStartDragEnd}
          popupContent={
            <div style={{ textAlign: 'center' }}>
              <strong style={{ color: '#22c55e' }}>📍 Start Point</strong>
              <br />
              {nodes[startNode].name}
              <br />
              <small>{nodes[startNode].address}</small>
              <br />
              <em style={{ fontSize: '10px', color: '#888' }}>Drag to change location</em>
            </div>
          }
        />
      )}
      
      {/* End marker (draggable) */}
      {endNode && nodes[endNode] && (
        <DraggableMarker
          position={[nodes[endNode].lat, nodes[endNode].lng]}
          icon={endPinIcon}
          onDragEnd={handleEndDragEnd}
          popupContent={
            <div style={{ textAlign: 'center' }}>
              <strong style={{ color: '#ef4444' }}>🏁 Destination</strong>
              <br />
              {nodes[endNode].name}
              <br />
              <small>{nodes[endNode].address}</small>
              <br />
              <em style={{ fontSize: '10px', color: '#888' }}>Drag to change location</em>
            </div>
          }
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;
