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
    const coords = feature.geometry.coordinates[0];
    
    // Create bounds from coordinates
    const bounds = L.latLngBounds(
      coords.map(([lng, lat]) => [lat, lng])
    );
    
    return {
      name: props.ZONENAME,
      projection: props.PROJECTION,
      centralMeridian: props.CENTRAL_MERIDIAN,
      latitudeOfOrigin: props.LATITUDE_OF_ORIGIN,
      scaleFactor: props.SCALE_FACTOR,
      falseEasting: props.FALSE_EASTING,
      falseNorthing: props.FALSE_NORTHING,
      standardParallel1: props.STANDARD_PARALLEL_1,
      standardParallel2: props.STANDARD_PARALLEL_2,
      bounds,
      originalFeature: feature
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