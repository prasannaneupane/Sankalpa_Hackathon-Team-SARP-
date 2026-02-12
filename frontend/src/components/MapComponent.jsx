import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "./MapComponent.css";

const nepalBounds = [
  [27.63, 85.18],
  [27.82, 85.53]
];

function MapComponent({ issues = [], focusedLocation }) {
  const mapRef = useRef(null); // Initialize with null

  useEffect(() => {
    // Check if focusedLocation exists AND the map instance is ready
    if (focusedLocation && mapRef.current) {
      mapRef.current.flyTo(
        [focusedLocation.lat, focusedLocation.lng], 
        18, // Zoom level for the "fly to"
        { duration: 1.5 }
      );
    }
  }, [focusedLocation]);

  return (
    <MapContainer
      center={[27.7, 85.35]}
      zoom={12}
      minZoom={10}
      maxZoom={18}
      maxBounds={nepalBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "500px", width: "100%" }}
      ref={mapRef} 
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 2. Added a check to map only if issues exists */}
      {issues && issues.map((issue) => (
        <Marker 
          key={issue._id || Math.random()} 
          position={[issue.lat, issue.lng]}
        >
          <Popup autoPan={true}>
            <div className="popup-container">
               <img className="potholeimg" src={issue.image} alt="pothole" width="100%" />
               <p className="popup"><strong>Priority:</strong> {issue.priority}</p>
               <p className="popup"><strong>Status:</strong> {issue.status}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default MapComponent;