export function initMap(containerId) {
  // Initialize map centered on the US
  const map = L.map(containerId, { zoomControl: false }).setView([39.8283, -98.5795], 4);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  
  return map;
}

// Create a Leaflet layer for an SPCS zone
export function createZoneLayer(zone) {
  // Check if required fields exist
  if (!zone.originalFeature || !zone.originalFeature.geometry) {
    console.error('Zone is missing geometry data:', zone);
    throw new Error('Zone is missing geometry data');
  }
  
  // Generate a color based on the projection type
  let fillColor = zone.projection === 'TM' ? '#3388ff' : '#ff8833';
  
  const geometry = zone.originalFeature.geometry;
  let latlngs;
  
  // Handle different geometry types
  if (geometry.type === 'Polygon') {
    // For Polygon, convert the first ring of coordinates
    latlngs = geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
  } 
  else if (geometry.type === 'MultiPolygon') {
    // For MultiPolygon, convert and combine all polygon rings
    latlngs = geometry.coordinates.map(polygon => 
      polygon[0].map(([lng, lat]) => [lat, lng])
    );
  }
  else {
    console.error('Unsupported geometry type:', geometry.type);
    throw new Error(`Unsupported geometry type: ${geometry.type}`);
  }
  
  // Create the polygon with styling
  return L.polygon(latlngs, {
    fillColor: fillColor,
    color: '#000',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.2
  });
}

// Create popup content for an SPCS zone
export function createZonePopup(zone) {
  // Format the zone information as HTML
  let content = `
    <div class="zone-popup">
      <h4>${zone.name}</h4>
      <p><strong>Projection:</strong> ${zone.projection === 'TM' ? 'Transverse Mercator' : 'Lambert Conformal Conic'}</p>
  `;
  
  // Only add parameters if they're defined
  if (zone.centralMeridian !== undefined) {
    content += `<p><strong>Central Meridian:</strong> ${zone.centralMeridian.toFixed(4)}°</p>`;
  }
  
  if (zone.latitudeOfOrigin !== undefined) {
    content += `<p><strong>Latitude of Origin:</strong> ${zone.latitudeOfOrigin.toFixed(4)}°</p>`;
  }
  
  if (zone.scaleFactor !== undefined) {
    content += `<p><strong>Scale Factor:</strong> ${zone.scaleFactor.toFixed(4)}</p>`;
  }
  
  // Add LCC-specific parameters if applicable
  if (zone.projection === 'LCC' && zone.standardParallel1 && zone.standardParallel2) {
    content += `
      <p><strong>Standard Parallel 1:</strong> ${zone.standardParallel1.toFixed(4)}°</p>
      <p><strong>Standard Parallel 2:</strong> ${zone.standardParallel2.toFixed(4)}°</p>
    `;
  }
  
  content += '</div>';
  return content;
} 