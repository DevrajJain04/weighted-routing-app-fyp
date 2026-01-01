import React, { useState, useEffect, useRef } from 'react';

// Nominatim (OpenStreetMap) geocoding service - free, no API key needed
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const LocationSearch = ({
  label,
  placeholder,
  value,
  onChange,
  onCoordinateChange,
  icon,
  iconColor,
  clickMode,
  onClickModeChange,
  currentClickMode
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const searchLocations = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      const data = await response.json();
      
      setSuggestions(data.map(item => ({
        displayName: item.display_name,
        shortName: formatShortName(item),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type,
        address: item.address
      })));
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatShortName = (item) => {
    const parts = [];
    if (item.address) {
      if (item.address.road) parts.push(item.address.road);
      if (item.address.suburb) parts.push(item.address.suburb);
      if (item.address.city || item.address.town) {
        parts.push(item.address.city || item.address.town);
      }
    }
    return parts.length > 0 ? parts.join(', ') : item.display_name.split(',').slice(0, 2).join(',');
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowSuggestions(true);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchLocations(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.shortName);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange && onChange(suggestion.shortName);
    onCoordinateChange && onCoordinateChange([suggestion.lat, suggestion.lng]);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click to register
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="location-search">
      <div className="location-input-group">
        <div className="location-icon" style={{ backgroundColor: iconColor }}>
          {icon}
        </div>
        <div className="location-input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="location-input"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
          />
          {isLoading && <div className="input-spinner" />}
          <button 
            className={`pin-button ${currentClickMode === clickMode ? 'active' : ''}`}
            onClick={() => onClickModeChange(currentClickMode === clickMode ? null : clickMode)}
            title={`Click on map to set ${label.toLowerCase()}`}
          >
            📍
          </button>
        </div>
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="suggestion-icon">📍</div>
              <div className="suggestion-content">
                <div className="suggestion-name">{suggestion.shortName}</div>
                <div className="suggestion-address">{suggestion.displayName}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Reverse geocoding - get address from coordinates
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const parts = [];
      if (data.address.road) parts.push(data.address.road);
      if (data.address.suburb) parts.push(data.address.suburb);
      if (data.address.city || data.address.town) {
        parts.push(data.address.city || data.address.town);
      }
      return parts.join(', ') || data.display_name.split(',').slice(0, 2).join(',');
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

export default LocationSearch;
