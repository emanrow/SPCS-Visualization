import L from 'leaflet';

const SPCS_ZONES_URL = 'https://opendata.arcgis.com/datasets/23178a639bdc4d658816b3ea8ee6c3ae_0.geojson';

export async function loadSPCSZones() {
  const response = await fetch(SPCS_ZONES_URL);
  if (!response.ok) {
    throw new Error('Failed to load SPCS zones');
  }
  return response.json();
}

export function processZoneData(data) {
  return data.features.map(feature => {
    const props = feature.properties;
    let bounds;
    
    // Handle different geometry types for bounds creation
    if (feature.geometry.type === 'Polygon') {
      // For Polygon, use the first ring of coordinates
      const coords = feature.geometry.coordinates[0];
      bounds = L.latLngBounds(
        coords.map(([lng, lat]) => [lat, lng])
      );
    } 
    else if (feature.geometry.type === 'MultiPolygon') {
      // For MultiPolygon, create bounds from all polygons
      bounds = null;
      
      // Process each polygon in the MultiPolygon
      feature.geometry.coordinates.forEach(polygon => {
        // Use the first ring of each polygon (outer ring)
        const coords = polygon[0];
        const polygonBounds = L.latLngBounds(
          coords.map(([lng, lat]) => [lat, lng])
        );
        
        if (!bounds) {
          // Initialize bounds with the first polygon
          bounds = polygonBounds;
        } else {
          // Extend bounds with each additional polygon
          bounds.extend(polygonBounds);
        }
      });
    }
    else {
      console.warn(`Unsupported geometry type: ${feature.geometry.type} for zone ${props.ZONENAME}`);
      // Create an empty bounds as fallback
      bounds = L.latLngBounds([]);
    }
    
    return {
      // Basic zone information
      name: props.ZONENAME,
      zoneCode: props.ZONE,
      fipsZone: props.FIPSZONE,
      objectId: props.OBJECTID,
      squareMiles: props.SQMI,
      colorMap: props.COLORMAP,
      
      // Traditional SPCS parameters (may not be present in this dataset)
      projection: props.PROJECTION,
      centralMeridian: props.CENTRAL_MERIDIAN,
      latitudeOfOrigin: props.LATITUDE_OF_ORIGIN,
      scaleFactor: props.SCALE_FACTOR,
      falseEasting: props.FALSE_EASTING,
      falseNorthing: props.FALSE_NORTHING,
      standardParallel1: props.STANDARD_PARALLEL_1,
      standardParallel2: props.STANDARD_PARALLEL_2,
      
      // Keep original data and bounds
      bounds,
      originalFeature: feature,
      
      // Store all original properties for future reference
      allProperties: props
    };
  });
}

export function createZoneBoundary(zone) {
  // Create a GeoJSON representation of the zone boundary
  return {
    type: 'Feature',
    properties: {
      name: zone.name,
      projection: zone.projection
    },
    geometry: zone.originalFeature.geometry
  };
}

export function getProjectionType(zone) {
  // Return human-readable projection type
  return zone.projection === 'TM' ? 'Transverse Mercator' : 'Lambert Conformal Conic';
} 