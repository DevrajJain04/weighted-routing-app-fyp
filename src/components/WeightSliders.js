import React from 'react';

const WeightSliders = ({ weights, onWeightChange }) => {
  const handleSliderChange = (weightKey, value) => {
    onWeightChange({
      ...weights,
      [weightKey]: parseFloat(value),
    });
  };

  // Calculate normalized percentages for visualization
  const total = weights.w1 + weights.w2 + weights.w3;
  const pct = {
    w1: total > 0 ? Math.round((weights.w1 / total) * 100) : 33,
    w2: total > 0 ? Math.round((weights.w2 / total) * 100) : 33,
    w3: total > 0 ? Math.round((weights.w3 / total) * 100) : 34,
  };

  return (
    <div className="section">
      <h3 className="section-title">⚖️ Route Preferences</h3>
      
      {/* Weight visualization bar */}
      <div style={{ 
        display: 'flex', 
        height: '8px', 
        borderRadius: '4px', 
        overflow: 'hidden',
        marginBottom: '16px'
      }}>
        <div style={{ width: `${pct.w1}%`, background: '#3b82f6' }} title={`Distance: ${pct.w1}%`} />
        <div style={{ width: `${pct.w2}%`, background: '#f59e0b' }} title={`Time: ${pct.w2}%`} />
        <div style={{ width: `${pct.w3}%`, background: '#22c55e' }} title={`Air Quality: ${pct.w3}%`} />
      </div>
      
      {/* Distance Weight (w1) */}
      <div className="slider-group">
        <div className="slider-label">
          <span>📏 Shortest Distance</span>
          <span className="slider-value" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            {weights.w1.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={weights.w1}
          onChange={(e) => handleSliderChange('w1', e.target.value)}
          className="slider distance"
        />
      </div>

      {/* Travel Time Weight (w2) */}
      <div className="slider-group">
        <div className="slider-label">
          <span>⏱️ Fastest Time</span>
          <span className="slider-value" style={{ background: '#fef3c7', color: '#b45309' }}>
            {weights.w2.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={weights.w2}
          onChange={(e) => handleSliderChange('w2', e.target.value)}
          className="slider time"
        />
      </div>

      {/* AQI Weight (w3) */}
      <div className="slider-group">
        <div className="slider-label">
          <span>🌿 Best Air Quality</span>
          <span className="slider-value" style={{ background: '#dcfce7', color: '#15803d' }}>
            {weights.w3.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={weights.w3}
          onChange={(e) => handleSliderChange('w3', e.target.value)}
          className="slider aqi"
        />
      </div>
      
      {/* Quick presets */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onWeightChange({ w1: 1, w2: 0, w3: 0 })}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #3b82f6',
            background: weights.w1 === 1 ? '#3b82f6' : 'white',
            color: weights.w1 === 1 ? 'white' : '#3b82f6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          Shortest
        </button>
        <button
          onClick={() => onWeightChange({ w1: 0, w2: 1, w3: 0 })}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #f59e0b',
            background: weights.w2 === 1 ? '#f59e0b' : 'white',
            color: weights.w2 === 1 ? 'white' : '#f59e0b',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          Fastest
        </button>
        <button
          onClick={() => onWeightChange({ w1: 0, w2: 0, w3: 1 })}
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #22c55e',
            background: weights.w3 === 1 ? '#22c55e' : 'white',
            color: weights.w3 === 1 ? 'white' : '#22c55e',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          Greenest
        </button>
      </div>
    </div>
  );
};

export default WeightSliders;
