import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map center changes
function MapController({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], 15, {
        animate: true,
        duration: 0.5
      });
    }
  }, [center, map]);
  
  return null;
}

// Custom marker icon based on status
const getMarkerIcon = (status, priority = 1) => {
  let iconUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png";
  let shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";
  
  // Color based on status
  if (status === "Open" || status === "pending" || status === "assigned") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
  } else if (status === "In Progress" || status === "in_progress") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png";
  } else if (status === "Completed" || status === "resolved") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
  } else if (status === "Delayed") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
  }
  
  // Size based on priority
  const size = 25 + (parseInt(priority) || 1) * 3;
  
  return L.icon({
    iconUrl,
    shadowUrl,
    iconSize: [size, size * 1.5],
    iconAnchor: [size/2, size * 1.5],
    popupAnchor: [1, -size * 0.75],
    shadowSize: [41, 41],
  });
};

// Function to extract coordinates from PostGIS POINT format
const extractCoordinates = (location) => {
  if (!location) return { lat: null, lng: null };
  
  // Handle PostGIS POINT format: "POINT(longitude latitude)"
  if (typeof location === 'string') {
    const match = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
  }
  
  // Handle object format with coordinates array
  if (location?.coordinates) {
    return {
      lng: parseFloat(location.coordinates[0]),
      lat: parseFloat(location.coordinates[1])
    };
  }
  
  return { lat: null, lng: null };
};

export default function MapComponent({ issues = [], focusedLocation = null, height = "400px" }) {
  // Default center (Kathmandu)
  const defaultCenter = [27.7172, 85.3240];
  
  // Filter out issues with invalid coordinates
  const validIssues = issues.filter(issue => {
    const coords = extractCoordinates(issue.location);
    return coords.lat && coords.lng && 
           !isNaN(coords.lat) && !isNaN(coords.lng) &&
           coords.lat !== 0 && coords.lng !== 0;
  }).map(issue => {
    const coords = extractCoordinates(issue.location);
    return {
      ...issue,
      lat: coords.lat,
      lng: coords.lng
    };
  });

  // Determine center
  let center = defaultCenter;
  if (focusedLocation && focusedLocation.lat && focusedLocation.lng) {
    center = [focusedLocation.lat, focusedLocation.lng];
  } else if (validIssues.length > 0) {
    // Center on the first valid issue
    center = [validIssues[0].lat, validIssues[0].lng];
  }

  console.log(`🗺️ MapComponent: ${validIssues.length} valid issues out of ${issues.length} total`);

  return (
    <div className="map-component" style={{ height, width: "100%" }}>
      <MapContainer
        center={center}
        zoom={focusedLocation ? 15 : 12}
        style={{ height: "100%", width: "100%", borderRadius: "8px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* This handles the map movement when focusedLocation changes */}
        <MapController center={center} />
        
        {validIssues.map((issue) => {
          const position = [issue.lat, issue.lng];
          const status = issue.status || "Open";
          const priority = issue.weight || issue.priority || 1;
          
          return (
            <Marker
              key={issue.id}
              position={position}
              icon={getMarkerIcon(status, priority)}
            >
              <Popup>
                <div className="map-popup">
                  <h4>Issue #{issue.id?.substring(0, 6)}</h4>
                  <p><strong>Status:</strong> {status}</p>
                  <p><strong>Priority:</strong> {priority}</p>
                  <p><strong>Description:</strong> {issue.description || "No description"}</p>
                  {issue.vote_score !== undefined && (
                    <p><strong>Votes:</strong> {issue.vote_score}</p>
                  )}
                  {issue.ambulance_id && (
                    <p><strong>Assigned to:</strong> 🚑 {issue.ambulance_id.substring(0, 6)}</p>
                  )}
                  {issue.photos?.length > 0 && (
                    <button 
                      className="popup-photo-btn"
                      onClick={() => window.open(issue.photos[0], '_blank')}
                    >
                      📸 View Photo
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}