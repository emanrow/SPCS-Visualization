import L from 'leaflet';
import spcsZoneParameters from './spcsZoneParameters.json';

const SPCS_ZONES_URL = 'https://opendata.arcgis.com/datasets/23178a639bdc4d658816b3ea8ee6c3ae_0.geojson';

// Function to get SPCS zone parameters from our JSON database
export function getSPCSZoneParameters(fipsCode, datum = 'NAD83') {
  if (!fipsCode) return null;
  
  // Format FIPS code to 4 digits for lookup
  const formattedFips = fipsCode.toString().padStart(4, '0');
  
  // Check if we have the zone in our database
  if (spcsZoneParameters[datum] && 
      spcsZoneParameters[datum].zones && 
      spcsZoneParameters[datum].zones[formattedFips]) {
    return spcsZoneParameters[datum].zones[formattedFips];
  }
  
  return null;
}

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
    
    // Get detailed zone parameters from our database
    const zoneParams = getSPCSZoneParameters(props.FIPSZONE);
    
    return {
      // Basic zone information
      name: props.ZONENAME,
      zoneCode: props.ZONE,
      fipsZone: props.FIPSZONE,
      objectId: props.OBJECTID,
      squareMiles: props.SQMI,
      colorMap: props.COLORMAP,
      
      // Traditional SPCS parameters (from external dataset)
      projection: props.PROJECTION,
      centralMeridian: props.CENTRAL_MERIDIAN,
      latitudeOfOrigin: props.LATITUDE_OF_ORIGIN,
      scaleFactor: props.SCALE_FACTOR,
      falseEasting: props.FALSE_EASTING,
      falseNorthing: props.FALSE_NORTHING,
      standardParallel1: props.STANDARD_PARALLEL_1,
      standardParallel2: props.STANDARD_PARALLEL_2,
      
      // Our detailed zone parameters
      spcsParams: zoneParams,
      
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

/**
 * Get detailed projection type for a zone including all three supported types
 * @param {Object} zone - The SPCS zone object
 * @returns {string} - Human-readable projection type
 */
export function getDetailedProjectionType(zone) {
  // First check if we have detailed params from our database
  if (zone.spcsParams && zone.spcsParams.projectionType) {
    switch (zone.spcsParams.projectionType) {
      case 'TM': return 'Transverse Mercator';
      case 'LCC': return 'Lambert Conformal Conic';
      case 'OM': return 'Oblique Mercator';
      default: return zone.spcsParams.projectionType; // Return as-is if unknown
    }
  }
  
  // Fall back to the basic projection field from the GeoJSON
  if (zone.projection) {
    switch (zone.projection) {
      case 'TM': return 'Transverse Mercator';
      case 'LCC': return 'Lambert Conformal Conic';
      case 'OM': return 'Oblique Mercator';
      default: return zone.projection; // Return as-is if unknown
    }
  }
  
  return 'Unknown Projection';
}

// Format DDMMSS string with proper degree symbols
export function formatDDMMSS(ddmmssString) {
  if (!ddmmssString || typeof ddmmssString !== 'string') {
    return 'Not specified';
  }
  
  try {
    // Match pattern like "110 10 W" or "31 00 N"
    const matches = ddmmssString.match(/(\d+)\s+(\d+)(?:\s+(\d+))?\s*([NSEW])/i);
    
    if (!matches) {
      // If in decimal degrees format, return as is
      if (ddmmssString.includes('.')) {
        return `${parseFloat(ddmmssString).toFixed(4)}°`;
      }
      return ddmmssString; // Return original if no match
    }
    
    const degrees = matches[1];
    const minutes = matches[2];
    const seconds = matches[3] || '00';
    const direction = matches[4].toUpperCase();
    
    // Build formatted string with proper symbols
    let formatted = `${degrees}° ${minutes}′`;
    
    // Add seconds if present
    if (seconds !== '00') {
      formatted += ` ${seconds}″`;
    }
    
    // Add direction
    formatted += ` ${direction}`;
    
    return formatted;
  } catch (error) {
    console.warn('Error formatting coordinate:', error);
    return ddmmssString; // Return original on error
  }
} 