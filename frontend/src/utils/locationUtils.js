/**
 * Parse PostGIS POINT format and return human-readable string
 * Format: "POINT(longitude latitude)" or "0101000020E6100000..." (hex WKB)
 */
export const formatLocation = (location) => {
  if (!location) return "Location not available";
  
  // Case 1: Already a string with coordinates
  if (typeof location === 'string') {
    // Try to parse POINT(long lon) format
    const pointMatch = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (pointMatch) {
      const lng = parseFloat(pointMatch[1]).toFixed(6);
      const lat = parseFloat(pointMatch[2]).toFixed(6);
      return `${lat}, ${lng}`;
    }
    
    // Try to parse hex WKB format (starts with 0101000020E6100000...)
    if (location.startsWith('0101000020E6100000')) {
      // This is hex WKB - we can't easily parse without a library
      // Return a placeholder or use a library like 'wkx'
      return "Location coordinates available";
    }
    
    // If it's already a readable string, return as is
    if (location.includes(',')) {
      return location;
    }
  }
  
  // Case 2: Object with coordinates
  if (location?.coordinates) {
    const [lng, lat] = location.coordinates;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
  
  return "Location available";
};

/**
 * Extract latitude and longitude as numbers
 */
export const extractCoordinates = (location) => {
  const defaultCoords = { lat: 27.7172, lng: 85.3240 }; // Kathmandu
  
  if (!location) return defaultCoords;
  
  // Parse POINT(lng lat) format
  if (typeof location === 'string') {
    const pointMatch = location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    if (pointMatch) {
      return {
        lng: parseFloat(pointMatch[1]),
        lat: parseFloat(pointMatch[2])
      };
    }
  }
  
  // Parse object format
  if (location?.coordinates) {
    return {
      lng: parseFloat(location.coordinates[0]),
      lat: parseFloat(location.coordinates[1])
    };
  }
  
  return defaultCoords;
};

/**
 * Get short location preview
 */
export const getLocationPreview = (location, maxLength = 30) => {
  const formatted = formatLocation(location);
  if (formatted.length > maxLength) {
    return formatted.substring(0, maxLength) + '...';
  }
  return formatted;
};