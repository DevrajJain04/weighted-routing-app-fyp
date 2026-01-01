# 🗺️ Smart Route Planner

A React application with Leaflet.js that finds optimal routes based on **distance**, **travel time**, and **air quality (AQI)**.

![Smart Route Planner](https://img.shields.io/badge/React-18.2-blue) ![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-green)

## Features

- **Weighted Dijkstra Algorithm** - Calculate routes using customizable weights:
  - `Cost = (w1 × distance) + (w2 × travelTime) + (w3 × AQI)`
  
- **Google Maps-Style Interface**
  - Draggable start/end markers
  - Click-to-pin locations
  - Turn-by-turn directions with street names
  
- **Route Alternatives**
  - Shortest distance route
  - Fastest time route
  - Cleanest air route
  - Custom weighted route

- **Real-Time AQI Updates** - Simulated live air quality data that updates routes automatically

- **Visual Path Coloring**
  - 🔵 Blue = Distance priority
  - 🟠 Orange = Time priority
  - 🟢 Green = Air quality priority

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/weighted-routing-app.git

# Navigate to project directory
cd weighted-routing-app

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select Locations**: Use dropdowns or click the 📍 button to pin locations on the map
2. **Adjust Weights**: Use sliders to prioritize distance, time, or air quality
3. **View Routes**: See route alternatives and click to compare
4. **Follow Directions**: Expand the directions panel for turn-by-turn navigation

## Project Structure

```
src/
├── components/
│   ├── MapComponent.js      # Leaflet map with markers
│   ├── WeightSliders.js     # Weight adjustment controls
│   ├── NodeSelector.js      # Location selection
│   ├── DirectionsPanel.js   # Turn-by-turn directions
│   ├── RouteAlternatives.js # Route comparison
│   └── AQIStatus.js         # Real-time AQI indicator
├── data/
│   └── graphData.js         # Nodes, edges, and graph utilities
├── utils/
│   └── dijkstra.js          # Weighted routing algorithm
└── App.js                   # Main application
```

## Algorithm

The routing uses a modified Dijkstra's algorithm where edge costs are calculated as:

```
Cost = (w1 × normalized_distance) + (w2 × normalized_time) + (w3 × normalized_AQI)
```

Values are normalized to ensure fair comparison between different units.

## Technologies

- **React** - UI framework
- **Leaflet.js** - Interactive maps
- **React-Leaflet** - React components for Leaflet

## License

MIT License
