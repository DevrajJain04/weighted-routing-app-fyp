import React from 'react';
import { formatDistance, formatTime } from '../utils/dijkstra';

const DirectionsPanel = ({ 
  directions, 
  totalDistance, 
  totalTime, 
  averageAQI,
  onStepHover,
  onStepClick 
}) => {
  if (!directions || directions.length === 0) {
    return null;
  }

  const getAQIColor = (aqi) => {
    if (aqi < 50) return '#22c55e';
    if (aqi < 100) return '#84cc16';
    if (aqi < 150) return '#f59e0b';
    return '#ef4444';
  };

  const getAQILabel = (aqi) => {
    if (aqi < 50) return 'Good';
    if (aqi < 100) return 'Moderate';
    if (aqi < 150) return 'Unhealthy for Sensitive';
    return 'Unhealthy';
  };

  return (
    <div className="directions-panel">
      {/* Summary Header */}
      <div className="directions-summary">
        <div className="summary-item">
          <span className="summary-icon">🚗</span>
          <div className="summary-content">
            <span className="summary-value">{formatDistance(totalDistance)}</span>
            <span className="summary-label">Distance</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon">⏱️</span>
          <div className="summary-content">
            <span className="summary-value">{formatTime(totalTime)}</span>
            <span className="summary-label">Duration</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🌿</span>
          <div className="summary-content">
            <span className="summary-value" style={{ color: getAQIColor(averageAQI) }}>
              {averageAQI}
            </span>
            <span className="summary-label">Avg AQI</span>
          </div>
        </div>
      </div>

      {/* Turn-by-turn Directions */}
      <div className="directions-list">
        {directions.map((step, index) => (
          <div
            key={index}
            className={`direction-step ${step.type}`}
            onMouseEnter={() => onStepHover && onStepHover(step.nodeId)}
            onMouseLeave={() => onStepHover && onStepHover(null)}
            onClick={() => onStepClick && onStepClick(step.nodeId)}
          >
            <div className="step-icon">
              <span>{step.icon}</span>
            </div>
            <div className="step-content">
              <div className="step-instruction">{step.instruction}</div>
              {step.type === 'turn' && (
                <div className="step-details">
                  <span className="step-distance">{formatDistance(step.distance)}</span>
                  <span className="step-separator">•</span>
                  <span className="step-time">{formatTime(step.time)}</span>
                  {step.aqi && (
                    <>
                      <span className="step-separator">•</span>
                      <span 
                        className="step-aqi"
                        style={{ color: getAQIColor(step.aqi) }}
                      >
                        AQI: {step.aqi}
                      </span>
                    </>
                  )}
                </div>
              )}
              {step.type !== 'start' && step.type !== 'end' && (
                <div className="step-cumulative">
                  {formatDistance(step.cumulativeDistance)} total • {formatTime(step.cumulativeTime)} elapsed
                </div>
              )}
            </div>
            {step.type === 'turn' && (
              <div 
                className="step-aqi-indicator"
                style={{ backgroundColor: getAQIColor(step.aqi) }}
                title={`AQI: ${step.aqi} (${getAQILabel(step.aqi)})`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DirectionsPanel;
