import { jest } from '@jest/globals';
import { visualizeProjection } from '../../src/visualization/projections.js';

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  group: jest.fn(),
  groupEnd: jest.fn(),
  warn: jest.fn()
};

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
}); 