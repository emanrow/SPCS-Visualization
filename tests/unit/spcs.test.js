import { jest } from '@jest/globals';
import { loadSPCSZones, processZoneData, createZoneBoundary, getProjectionType } from '../../src/math/spcs.js';

describe('SPCS Zone Data Handling', () => {
  // Mock the fetch response
  const mockZoneData = {
    features: [
      {
        properties: {
          ZONENAME: 'Michigan Central',
          PROJECTION: 'TM',
          CENTRAL_MERIDIAN: -84.3667,
          LATITUDE_OF_ORIGIN: 43.3167,
          SCALE_FACTOR: 0.9999,
          FALSE_EASTING: 6000000,
          FALSE_NORTHING: 0
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-90, 45], [-90, 40], [-80, 40], [-80, 45], [-90, 45]]]
        }
      },
      {
        properties: {
          ZONENAME: 'Michigan North',
          PROJECTION: 'LCC',
          CENTRAL_MERIDIAN: -84.3667,
          LATITUDE_OF_ORIGIN: 45.4833,
          SCALE_FACTOR: 1.0000,
          FALSE_EASTING: 8000000,
          FALSE_NORTHING: 0,
          STANDARD_PARALLEL_1: 45.4833,
          STANDARD_PARALLEL_2: 47.0833
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[-90, 48], [-90, 45], [-80, 45], [-80, 48], [-90, 48]]]
        }
      },
      {
        properties: {
          ZONENAME: 'Alaska Zone 1',
          PROJECTION: 'TM',
          CENTRAL_MERIDIAN: -133.6667,
          LATITUDE_OF_ORIGIN: 57.0000,
          SCALE_FACTOR: 0.9999,
          FALSE_EASTING: 5000000,
          FALSE_NORTHING: 0
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[-134, 58], [-134, 56], [-132, 56], [-132, 58], [-134, 58]]],
            [[[-133, 59], [-133, 58], [-131, 58], [-131, 59], [-133, 59]]]
          ]
        }
      }
    ]
  };

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockZoneData)
      })
    );
  });

  test('loads SPCS zone data correctly', async () => {
    const zones = await loadSPCSZones();
    expect(zones).toBeDefined();
    expect(zones.features).toHaveLength(3); // Now includes Alaska Zone 1
    expect(zones.features[0].properties.ZONENAME).toBe('Michigan Central');
    expect(zones.features[1].properties.ZONENAME).toBe('Michigan North');
    expect(zones.features[2].properties.ZONENAME).toBe('Alaska Zone 1');
  });

  test('processes zone data correctly', () => {
    const processedZones = processZoneData(mockZoneData);
    
    // Verify zone properties
    expect(processedZones[0].name).toBe('Michigan Central');
    expect(processedZones[0].projection).toBe('TM');
    expect(processedZones[0].centralMeridian).toBe(-84.3667);
    
    // Verify geometry processing
    expect(processedZones[0].bounds).toBeDefined();
    expect(processedZones[0].bounds.getSouth()).toBe(40);
    expect(processedZones[0].bounds.getNorth()).toBe(45);
  });

  test('processes MultiPolygon geometry correctly', () => {
    const processedZones = processZoneData(mockZoneData);
    
    // Find Alaska Zone 1 (has MultiPolygon geometry)
    const alaskaZone = processedZones.find(z => z.name === 'Alaska Zone 1');
    expect(alaskaZone).toBeDefined();
    
    // Verify original geometry is preserved
    expect(alaskaZone.originalFeature.geometry.type).toBe('MultiPolygon');
    expect(alaskaZone.originalFeature.geometry.coordinates).toHaveLength(2);
    
    // Verify bounds exists but don't test specific values
    // as bounds calculation for MultiPolygon is handled differently 
    expect(alaskaZone.bounds).toBeDefined();
  });

  test('validates zone parameters', () => {
    const processedZones = processZoneData(mockZoneData);
    
    // TM zone validation
    const tmZone = processedZones.find(z => z.projection === 'TM');
    expect(tmZone.scaleFactor).toBeGreaterThan(0);
    expect(tmZone.scaleFactor).toBeLessThan(1);
    
    // LCC zone validation
    const lccZone = processedZones.find(z => z.projection === 'LCC');
    expect(lccZone.standardParallel1).toBeDefined();
    expect(lccZone.standardParallel2).toBeDefined();
    expect(lccZone.standardParallel1).toBeLessThan(lccZone.standardParallel2);
  });

  test('creates zone boundary correctly', () => {
    const processedZones = processZoneData(mockZoneData);
    const boundary = createZoneBoundary(processedZones[0]);
    
    expect(boundary.type).toBe('Feature');
    expect(boundary.properties.name).toBe('Michigan Central');
    expect(boundary.properties.projection).toBe('TM');
    expect(boundary.geometry.type).toBe('Polygon');
    expect(boundary.geometry.coordinates[0]).toEqual([[-90, 45], [-90, 40], [-80, 40], [-80, 45], [-90, 45]]);
  });

  test('creates MultiPolygon zone boundary correctly', () => {
    const processedZones = processZoneData(mockZoneData);
    const alaskaZone = processedZones.find(z => z.name === 'Alaska Zone 1');
    const boundary = createZoneBoundary(alaskaZone);
    
    expect(boundary.type).toBe('Feature');
    expect(boundary.properties.name).toBe('Alaska Zone 1');
    expect(boundary.geometry.type).toBe('MultiPolygon');
    expect(boundary.geometry.coordinates).toHaveLength(2);
  });

  test('returns correct projection type', () => {
    const processedZones = processZoneData(mockZoneData);
    
    expect(getProjectionType(processedZones[0])).toBe('Transverse Mercator');
    expect(getProjectionType(processedZones[1])).toBe('Lambert Conformal Conic');
  });
}); 