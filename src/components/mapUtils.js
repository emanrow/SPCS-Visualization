import L from 'leaflet';

/**
 * Calculates the combined bounds of all visible SPCS zones
 * @param {Array} zones - Array of zone objects
 * @param {Set} visibleIndices - Set of indices of visible zones
 * @returns {L.LatLngBounds|null} - Combined bounds or null if no visible zones
 */
export function calculateVisibleZonesBounds(zones, visibleIndices) {
  if (!visibleIndices || visibleIndices.size === 0) {
    return null;
  }
  
  let combinedBounds = null;
  
  visibleIndices.forEach(idx => {
    const zone = zones[idx];
    if (!zone || !zone.bounds) return;
    
    if (!combinedBounds) {
      // Initialize with the first zone's bounds - create a new bounds object from its corners
      const sw = zone.bounds.getSouthWest();
      const ne = zone.bounds.getNorthEast();
      combinedBounds = L.latLngBounds([sw, ne]);
    } else {
      // Extend with each additional zone
      combinedBounds.extend(zone.bounds);
    }
  });
  
  return combinedBounds;
}

/**
 * Zooms the map to show all visible zones
 * @param {L.Map} map - Leaflet map instance
 * @param {Array} zones - Array of zone objects
 * @param {Set} visibleIndices - Set of indices of visible zones
 */
export function zoomToVisibleZones(map, zones, visibleIndices) {
  if (!visibleIndices || visibleIndices.size === 0) {
    // Reset to default view (entire US) when no zones are selected
    map.setView([39.8283, -98.5795], 4);
    return;
  }
  
  const bounds = calculateVisibleZonesBounds(zones, visibleIndices);
  
  if (bounds) {
    map.fitBounds(bounds, {
      padding: [50, 50], // Add padding around the bounds
      maxZoom: 10,       // Limit maximum zoom level
      animate: true      // Animate the transition
    });
  }
} 