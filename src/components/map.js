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
  
  // Generate a color based on the projection type or colorMap if available
  let fillColor;
  
  if (zone.colorMap) {
    // Use a consistent color scheme based on colorMap value
    const colorScheme = [
      '#3388ff', // Blue
      '#ff8833', // Orange
      '#33ff88', // Green
      '#8833ff', // Purple
      '#ff3388', // Pink
      '#88ff33'  // Lime
    ];
    fillColor = colorScheme[zone.colorMap % colorScheme.length];
  } else {
    // Fallback to projection-based coloring
    fillColor = zone.projection === 'TM' ? '#3388ff' : '#ff8833';
  }
  
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
      <h4>${zone.name || 'Unnamed Zone'}</h4>
  `;
  
  // Basic zone information
  if (zone.zoneCode) {
    content += `<p><strong>Zone Code:</strong> ${zone.zoneCode}</p>`;
  }
  
  if (zone.fipsZone) {
    content += `<p><strong>FIPS Zone:</strong> ${zone.fipsZone}</p>`;
  }
  
  if (zone.objectId) {
    content += `<p><strong>Object ID:</strong> ${zone.objectId}</p>`;
  }
  
  if (zone.squareMiles) {
    content += `<p><strong>Area:</strong> ${zone.squareMiles.toLocaleString()} sq. miles</p>`;
  }
  
  // Add projection information if available
  if (zone.projection) {
    content += `<p><strong>Projection:</strong> ${zone.projection === 'TM' ? 'Transverse Mercator' : 'Lambert Conformal Conic'}</p>`;
  } else {
    content += `<p><strong>Projection:</strong> Not specified</p>`;
  }
  
  // Traditional SPCS parameters (if available)
  if (zone.centralMeridian !== undefined) {
    content += `<p><strong>Central Meridian:</strong> ${zone.centralMeridian.toFixed(4)}°</p>`;
  }
  
  if (zone.latitudeOfOrigin !== undefined) {
    content += `<p><strong>Latitude of Origin:</strong> ${zone.latitudeOfOrigin.toFixed(4)}°</p>`;
  }
  
  if (zone.scaleFactor !== undefined) {
    content += `<p><strong>Scale Factor:</strong> ${zone.scaleFactor.toFixed(4)}</p>`;
  }
  
  if (zone.falseEasting !== undefined) {
    content += `<p><strong>False Easting:</strong> ${zone.falseEasting.toLocaleString()} meters</p>`;
  }
  
  if (zone.falseNorthing !== undefined) {
    content += `<p><strong>False Northing:</strong> ${zone.falseNorthing.toLocaleString()} meters</p>`;
  }
  
  if (zone.standardParallel1 !== undefined) {
    content += `<p><strong>Standard Parallel 1:</strong> ${zone.standardParallel1.toFixed(4)}°</p>`;
  }
  
  if (zone.standardParallel2 !== undefined) {
    content += `<p><strong>Standard Parallel 2:</strong> ${zone.standardParallel2.toFixed(4)}°</p>`;
  }
  
  content += '</div>';
  return content;
} 