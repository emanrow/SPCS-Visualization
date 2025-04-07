/**
 * Projection visualization functions for SPCS zones
 * 
 * This file handles the 3D visualization of projection coordinate systems:
 * - Transverse Mercator (TM): Cylinder tangent to a meridian
 * - Lambert Conformal Conic (LCC): Cone intersecting the ellipsoid at two parallels
 * - Oblique Mercator (OM): Cylinder tangent to the ellipsoid along an oblique great circle
 */

import { createTransverseMercatorCylinder } from './transverseMercator.js';

/**
 * Executive function to dispatch to specific projection visualization logic
 * based on the projection type
 * 
 * @param {Object} scene - Three.js scene to add visualization to
 * @param {Object} zone - SPCS zone data
 * @returns {Object} - Projection visualization objects
 */
export function visualizeProjection(scene, zone) {
  const projectionType = getProjectionType(zone);
  console.log(`Visualizing ${projectionType} projection for zone: ${zone.name}`);
  
  // Log the projection details
  logProjectionDetails(zone);
  
  // Call specific visualization functions based on projection type
  switch (projectionType) {
    case 'Transverse Mercator':
      return createTransverseMercatorCylinder(scene, zone);
    case 'Lambert Conformal Conic':
      // TODO: return visualizeLambertConformalConic(scene, zone);
      break;
    case 'Oblique Mercator':
      // TODO: return visualizeObliqueMercator(scene, zone);
      break;
    default:
      console.warn(`Unsupported projection type: ${projectionType}`);
  }
  
  return null;
}

/**
 * Helper function to get the projection type from zone data
 * 
 * @param {Object} zone - SPCS zone data
 * @returns {string} - Human-readable projection type
 */
function getProjectionType(zone) {
  // First check if we have detailed params from our database
  if (zone.spcsParams && zone.spcsParams.projectionType) {
    switch (zone.spcsParams.projectionType) {
      case 'TM': return 'Transverse Mercator';
      case 'LCC': return 'Lambert Conformal Conic';
      case 'OM': return 'Oblique Mercator';
      default: return zone.spcsParams.projectionType;
    }
  }
  
  // Fall back to the basic projection field
  if (zone.projection) {
    switch (zone.projection) {
      case 'TM': return 'Transverse Mercator';
      case 'LCC': return 'Lambert Conformal Conic';
      case 'OM': return 'Oblique Mercator';
      default: return zone.projection;
    }
  }
  
  return 'Unknown Projection';
}

/**
 * Log detailed projection parameters to console
 * 
 * @param {Object} zone - SPCS zone data
 */
function logProjectionDetails(zone) {
  const projectionType = getProjectionType(zone);
  
  console.group(`SPCS Zone: ${zone.name} (${projectionType})`);
  
  // Log parameters from our detailed database if available
  if (zone.spcsParams && zone.spcsParams.params) {
    const params = zone.spcsParams.params;
    console.log('Parameters (from database):');
    
    if (params.centralMeridian) {
      console.log(`Central Meridian: ${params.centralMeridian}`);
    }
    
    if (params.longitudeOfOrigin) {
      console.log(`Longitude of Origin: ${params.longitudeOfOrigin}`);
    }
    
    if (params.latitudeOfOrigin) {
      console.log(`Latitude of Origin: ${params.latitudeOfOrigin}`);
    }
    
    if (params.scaleFactorDenominator) {
      const scaleFactor = 1 - (1 / params.scaleFactorDenominator);
      console.log(`Scale Factor: ${scaleFactor.toFixed(6)} (1 - 1/${params.scaleFactorDenominator})`);
    }
    
    if (params.standardParallel1) {
      console.log(`Standard Parallel 1: ${params.standardParallel1}`);
    }
    
    if (params.standardParallel2) {
      console.log(`Standard Parallel 2: ${params.standardParallel2}`);
    }
    
    if (params.falseEasting) {
      console.log(`False Easting: ${params.falseEasting} ${params.units}`);
    }
    
    if (params.falseNorthing) {
      console.log(`False Northing: ${params.falseNorthing} ${params.units}`);
    }
  } 
  // Fall back to the properties from the GeoJSON
  else {
    console.log('Parameters (from GeoJSON):');
    
    if (zone.centralMeridian !== undefined) {
      console.log(`Central Meridian: ${zone.centralMeridian.toFixed(4)}°`);
    }
    
    if (zone.latitudeOfOrigin !== undefined) {
      console.log(`Latitude of Origin: ${zone.latitudeOfOrigin.toFixed(4)}°`);
    }
    
    if (zone.scaleFactor !== undefined) {
      console.log(`Scale Factor: ${zone.scaleFactor.toFixed(6)}`);
    }
    
    if (zone.standardParallel1 !== undefined) {
      console.log(`Standard Parallel 1: ${zone.standardParallel1.toFixed(4)}°`);
    }
    
    if (zone.standardParallel2 !== undefined) {
      console.log(`Standard Parallel 2: ${zone.standardParallel2.toFixed(4)}°`);
    }
    
    if (zone.falseEasting !== undefined) {
      console.log(`False Easting: ${zone.falseEasting.toLocaleString()} meters`);
    }
    
    if (zone.falseNorthing !== undefined) {
      console.log(`False Northing: ${zone.falseNorthing.toLocaleString()} meters`);
    }
  }
  
  console.groupEnd();
} 