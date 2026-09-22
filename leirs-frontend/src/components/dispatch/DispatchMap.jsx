import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom icons for different marker types
const incidentIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMiAwIDggMTIgMjQgMTIgMjRzMTItMTYgMTItMjRjMC02LjYyNy01LjM3My0xMi0xMi0xMnoiIGZpbGw9IiNkYzI2MjYiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEyIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiNkYzI2MjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj4hPC90ZXh0Pjwvc3ZnPg==',
  iconSize: [32, 45],
  iconAnchor: [16, 45],
  popupAnchor: [0, -45]
});

const stationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyNCAzNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMiAwIDggMTIgMjQgMTIgMjRzMTItMTYgMTItMjRjMC02LjYyNy01LjM3My0xMi0xMi0xMnoiIGZpbGw9IiMyNTYzZWIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI3IiBmaWxsPSIjZmZmIi8+PHRleHQgeD0iMTIiIHk9IjE2IiBmb250LXNpemU9IjEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IiMyNTYzZWIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtd2VpZ2h0PSJib2xkIj7wn5qUPC90ZXh0Pjwvc3ZnPg==',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -40]
});

// Component to center map on incident location
function MapCenterController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
    }
  }, [center, map]);
  
  return null;
}

function DispatchMap({ incident, policeStations, onSelectStation, selectedStationId }) {
  const [incidentCoords, setIncidentCoords] = useState(null);
  const [mapCenter, setMapCenter] = useState([14.7630, 121.0430]); // Default: Camarin, Caloocan

  useEffect(() => {
    // Use incident coordinates if available
    if (incident?.location_latitude && incident?.location_longitude) {
      const coords = [parseFloat(incident.location_latitude), parseFloat(incident.location_longitude)];
      setIncidentCoords(coords);
      setMapCenter(coords);
    } else {
      // Default to Camarin area if no coordinates
      setIncidentCoords([14.7630, 121.0430]);
      setMapCenter([14.7630, 121.0430]);
    }
  }, [incident]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula for distance calculation
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(2);
  };

  return (
    <div className="w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="rounded-lg border border-gray-300 shadow-sm"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterController center={mapCenter} />
        
        {/* Incident Marker */}
        {incidentCoords && (
          <Marker position={incidentCoords} icon={incidentIcon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-red-600 mb-2">📍 Incident Location</h3>
                <p className="text-sm"><strong>Type:</strong> {incident?.incident_type || 'N/A'}</p>
                <p className="text-sm"><strong>Location:</strong> {incident?.location || 'N/A'}</p>
                <p className="text-sm"><strong>Date:</strong> {incident?.incident_date || 'N/A'}</p>
                {incident?.priority && (
                  <p className="text-sm"><strong>Priority:</strong> {incident.priority}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Police Station Markers */}
        {policeStations && policeStations.map((station) => {
          if (!station.latitude || !station.longitude) return null;
          
          const stationCoords = [parseFloat(station.latitude), parseFloat(station.longitude)];
          const isSelected = selectedStationId === station.id;
          
          // Calculate distance if incident has coordinates
          let distance = null;
          if (incidentCoords && station.latitude && station.longitude) {
            distance = calculateDistance(
              incidentCoords[0], 
              incidentCoords[1],
              stationCoords[0],
              stationCoords[1]
            );
          }
          
          return (
            <Marker 
              key={station.id} 
              position={stationCoords} 
              icon={stationIcon}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(station)
              }}
            >
              <Popup>
                <div className="p-2" style={{ minWidth: '200px' }}>
                  <h3 className="font-semibold text-blue-600 mb-2">
                    🚔 {station.station_name}
                  </h3>
                  <p className="text-sm mb-1"><strong>Address:</strong> {station.address}</p>
                  {distance && (
                    <p className="text-sm mb-1">
                      <strong>Distance:</strong> {distance} km from incident
                    </p>
                  )}
                  {station.contact_number && (
                    <p className="text-sm mb-1"><strong>Contact:</strong> {station.contact_number}</p>
                  )}
                  {station.coverage_area && (
                    <p className="text-sm mb-1"><strong>Coverage:</strong> {station.coverage_area}</p>
                  )}
                  <p className="text-sm mb-2">
                    <strong>Status:</strong>{' '}
                    <span className={`font-semibold ${
                      station.status === 'Available' ? 'text-green-600' : 
                      station.status === 'Busy' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {station.status}
                    </span>
                  </p>
                  <button
                    onClick={() => onSelectStation && onSelectStation(station)}
                    className={`w-full py-2 px-3 rounded text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Select Station'}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default DispatchMap;
