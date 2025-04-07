import { jest } from '@jest/globals';
import { loadSPCSZones, processZoneData } from '../../src/math/spcs.js';

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
    expect(zones.features).toHaveLength(2);
    expect(zones.features[0].properties.ZONENAME).toBe('Michigan Central');
    expect(zones.features[1].properties.ZONENAME).toBe('Michigan North');
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
}); 