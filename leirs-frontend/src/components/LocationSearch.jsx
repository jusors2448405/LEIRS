import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { searchAddress, formatLocationResult } from '../utils/geocoding';

// Fix Leaflet default icon (required for Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom marker for selected location
const selectedLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMiAwIDggMTIgMjQgMTIgMjRzMTItMTYgMTItMjRjMC02LjYyNy01LjM3My0xMi0xMi0xMnoiIGZpbGw9IiNkYzI2MjYiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
  iconSize: [32, 45],
  iconAnchor: [16, 45],
  popupAnchor: [0, -45]
});

// Component to update map center when location changes
function MapCenterController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  
  return null;
}

/**
 * LocationSearch Component
 * 
 * Address search with map preview for incident location entry.
 * - Debounced address search using Nominatim
 * - Dropdown with suggestions
 * - Interactive map preview with marker
 * - Captures address + coordinates
 */
function LocationSearch({ value, onLocationSelect, required = false }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const debounceTimer = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setError('');
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      
      try {
        console.log('[LocationSearch] Starting search for:', query);
        const results = await searchAddress(query);
        console.log('[LocationSearch] Received results:', results.length, results);
        
        if (results.length === 0) {
          console.log('[LocationSearch] No results, showing error');
          setError('No locations found. Try a different search term.');
          setSuggestions([]);
        } else {
          console.log('[LocationSearch] Setting suggestions:', results);
          setSuggestions(results);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('[LocationSearch] Search error:', err);
        setError('Failed to search addresses. Please try again.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 600); // 600ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSelectSuggestion = (result) => {
    const location = formatLocationResult(result);
    
    console.log('[LocationSearch] Selected location:', location);
    
    setQuery(location.address);
    setSelectedLocation(location);
    setShowDropdown(false);
    setSuggestions([]);
    setError(''); // Clear any errors
    
    // Notify parent component
    onLocationSelect({
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude
    });
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    // Clear selected location if user modifies the input
    if (selectedLocation && newValue !== selectedLocation.address) {
      setSelectedLocation(null);
      onLocationSelect({
        address: newValue,
        latitude: null,
        longitude: null
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            className="input-field pl-10 pr-10"
            placeholder="Search address (e.g., Zabarte Road, Camarin)"
            required={required}
          />
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" 
            size={18} 
          />
          {loading && (
            <Loader2 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" 
              size={18} 
            />
          )}
        </div>

        {/* Error Message - Only show if no location is selected */}
        {error && !selectedLocation && (
          <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(result)}
                className="w-full text-left px-4 py-3 hover:bg-background transition-colors flex items-start gap-3 border-b border-border last:border-0"
              >
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{result.display_name}</p>
                  {result.address && (
                    <p className="text-xs text-muted mt-0.5">
                      {result.address.road || result.address.suburb || result.address.city}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Helper Text */}
        {!selectedLocation && query.length < 3 && (
          <p className="mt-1 text-xs text-muted">
            Type at least 3 characters to search for addresses
          </p>
        )}
      </div>

      {/* Map Preview */}
      {selectedLocation && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-background px-4 py-2 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <p className="text-sm font-medium text-text">Selected Location</p>
            </div>
            <p className="text-xs text-muted mt-1 line-clamp-2">
              {selectedLocation.address}
            </p>
            <p className="text-xs text-muted mt-0.5">
              📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </p>
          </div>
          
          <div style={{ height: '250px' }}>
            <MapContainer
              center={[selectedLocation.latitude, selectedLocation.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterController 
                center={[selectedLocation.latitude, selectedLocation.longitude]} 
              />
              <Marker 
                position={[selectedLocation.latitude, selectedLocation.longitude]}
                icon={selectedLocationIcon}
              />
            </MapContainer>
          </div>
        </div>
      )}

      {/* Attribution */}
      {selectedLocation && (
        <p className="text-xs text-muted">
          Powered by <a 
            href="https://www.openstreetmap.org/copyright" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            OpenStreetMap
          </a>
        </p>
      )}
    </div>
  );
}

export default LocationSearch;
