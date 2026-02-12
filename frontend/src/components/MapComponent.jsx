import { useEffect } from "react";
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
    if (center && center.length === 2) {
      console.log("🎯 Moving map to:", center);
      map.setView(center, 15, {
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
  
  // Color based on status
  if (status === "Open" || status === "pending") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png";
  } else if (status === "In Progress" || status === "assigned" || status === "in_progress") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png";
  } else if (status === "Completed" || status === "resolved") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png";
  } else if (status === "Delayed") {
    iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png";
  }
  
  // Size based on priority
  const size = 25 + (parseInt(priority) || 1) * 3;
  
  return L.icon({
    iconUrl,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [size, size * 1.5],
    iconAnchor: [size/2, size * 1.5],
    popupAnchor: [1, -size * 0.75],
    shadowSize: [41, 41],
  });
};

export default function MapComponent({ 
  issues = [], 
  focusedLocation = null, 
  height = "400px",
  onIssueClick 
}) {
  // Default center (Kathmandu)
  const defaultCenter = [27.7172, 85.3240];
  
  // Log received issues
  console.log("🗺️ MapComponent received:", {
    issuesCount: issues.length,
    focusedLocation,
    issues: issues.map(i => ({ id: i.id, lat: i.lat, lng: i.lng }))
  });

  // Filter issues with valid coordinates
  const validIssues = issues.filter(issue => {
    const hasValidCoords = issue.lat && issue.lng && 
           !isNaN(issue.lat) && !isNaN(issue.lng) &&
           issue.lat !== 0 && issue.lng !== 0;
    
    if (!hasValidCoords) {
      console.warn("⚠️ Issue missing valid coordinates:", issue.id, issue.lat, issue.lng);
    }
    
    return hasValidCoords;
  });

  console.log(`✅ Valid issues for map: ${validIssues.length}/${issues.length}`);

  // Determine map center
  let center = defaultCenter;
  if (focusedLocation && focusedLocation.lat && focusedLocation.lng) {
    center = [focusedLocation.lat, focusedLocation.lng];
  } else if (validIssues.length > 0) {
    center = [validIssues[0].lat, validIssues[0].lng];
  }

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
        
        <MapController center={center} />
        
        {validIssues.map((issue) => {
          const position = [issue.lat, issue.lng];
          const status = issue.status || "Open";
          const priority = issue.priority || issue.weight || 1;
          
          return (
            <Marker
              key={issue.id}
              position={position}
              icon={getMarkerIcon(status, priority)}
              eventHandlers={{
                click: () => {
                  console.log("📍 Marker clicked:", issue.id);
                  if (onIssueClick) {
                    onIssueClick(issue);
                  }
                }
              }}
            >
              <Popup>
                <div className="map-popup">
                  <h4>Issue #{issue.id?.substring(0, 6)}</h4>
                  <p><strong>Status:</strong> {status}</p>
                  <p><strong>Priority:</strong> {priority}</p>
                  <p><strong>Description:</strong> {issue.description || "No description"}</p>
                  <p><strong>Location:</strong> {issue.lat.toFixed(6)}, {issue.lng.toFixed(6)}</p>
                  {issue.votes !== undefined && (
                    <p><strong>Votes:</strong> {issue.votes}</p>
                  )}
                  {issue.assigned_to && (
                    <p><strong>Assigned to:</strong> 🚑 {issue.assigned_to.substring(0, 6)}</p>
                  )}
                  {issue.photos?.length > 0 && (
                    <button 
                      className="popup-photo-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(issue.photos[0], '_blank');
                      }}
                    >
                      📸 View Photo
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {validIssues.length === 0 && (
          <Popup position={defaultCenter}>
            <div className="map-popup">
              <h4>📍 Kathmandu</h4>
              <p>Default location</p>
              <p>No issues with valid coordinates found</p>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
}