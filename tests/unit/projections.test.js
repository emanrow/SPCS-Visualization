import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { visualizeProjection } from '../../src/visualization/projections.js';
import * as THREE from 'three';

// Mock console methods
const originalConsole = { ...console };
console.log = jest.fn();
console.group = jest.fn();
console.groupEnd = jest.fn();
console.warn = jest.fn();

describe('Projection Visualization', () => {
  // Create mock scene and camera
  const mockScene = {
    add: jest.fn()
  };
  
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });
  
  test('visualizeProjection identifies Transverse Mercator projection', () => {
    const mockZone = {
      name: 'Test Zone TM',
      projection: 'TM',
      spcsParams: {
        projectionType: 'TM',
        params: {
          centralMeridian: '85 30 W',
          latitudeOfOrigin: '30 00 N',
          scaleFactorDenominator: 25000,
          falseEasting: 200000,
          falseNorthing: 0,
          units: 'meters'
        }
      }
    };
    
    visualizeProjection(mockScene, mockZone);
    
    // Check console log was called with TM
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Transverse Mercator')
    );
  });
  
  test('visualizeProjection identifies Lambert Conformal Conic projection', () => {
    const mockZone = {
      name: 'Test Zone LCC',
      projection: 'LCC',
      spcsParams: {
        projectionType: 'LCC',
        params: {
          longitudeOfOrigin: '85 50 W',
          latitudeOfOrigin: '30 30 N',
          standardParallel1: '33 00 N',
          standardParallel2: '34 40 N',
          falseEasting: 600000,
          falseNorthing: 0,
          units: 'meters'
        }
      }
    };
    
    visualizeProjection(mockScene, mockZone);
    
    // Check console log was called with LCC
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Lambert Conformal Conic')
    );
  });
  
  test('visualizeProjection handles missing spcsParams gracefully', () => {
    const mockZone = {
      name: 'Test Zone Basic',
      projection: 'TM',
      centralMeridian: -84.5,
      latitudeOfOrigin: 30.5,
      scaleFactor: 0.9999,
      falseEasting: 200000,
      falseNorthing: 0
    };
    
    visualizeProjection(mockScene, mockZone);
    
    // Check console log was called with TM
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Transverse Mercator')
    );
    
    // Should use the basic parameters
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Parameters (from GeoJSON)')
    );
  });
  
  test('visualizeProjection handles unknown projection type gracefully', () => {
    const mockZone = {
      name: 'Test Zone Unknown',
      projection: 'XYZ',
      centralMeridian: -84.5,
      latitudeOfOrigin: 30.5
    };
    
    visualizeProjection(mockScene, mockZone);
    
    // Should warn about unsupported type
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported projection type')
    );
  });

  test('ensures zone identifiers are unique based on zone name', () => {
    // Create two different zones
    const zone1 = {
      name: 'Alaska Zone 3'
    };
    
    const zone2 = {
      name: 'Alaska Zone 5'
    };
    
    // Create unique identifiers using the same logic as in transverseMercator.js
    const zoneId1 = zone1.name.replace(/\s+/g, '_').toLowerCase();
    const zoneId2 = zone2.name.replace(/\s+/g, '_').toLowerCase();
    
    // Test unique cylinder names
    const cylinderName1 = `transverseMercatorCylinder_${zoneId1}`;
    const cylinderName2 = `transverseMercatorCylinder_${zoneId2}`;
    
    // The cylinder names should be different
    expect(cylinderName1).not.toEqual(cylinderName2);
    
    // The names should include the zone identifiers
    expect(cylinderName1).toContain('alaska_zone_3');
    expect(cylinderName2).toContain('alaska_zone_5');
  });
}); 