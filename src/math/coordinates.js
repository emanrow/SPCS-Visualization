/**
 * Converts latitude and longitude to 3D point on a sphere
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} radius - Sphere radius
 * @returns {Object} Point with x, y, z coordinates
 */
export function latLonToPoint(lat, lon, radius) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
  
  return { x, y, z };
} 