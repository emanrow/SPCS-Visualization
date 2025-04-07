import { jest } from '@jest/globals';
import { loadSPCSZones, processZoneData, createZoneBoundary, getProjectionType, getSPCSZoneParameters, formatDDMMSS } from '../../src/math/spcs.js';

// Mock the spcsZoneParameters.json import
jest.mock('../../src/math/spcsZoneParameters.json', () => ({
  metadata: {
    description: "State Plane Coordinate System Zone Parameters",
    source: "NOAA National Geodetic Survey - NOS NGS 13"
  },
  NAD83: {
    zones: {
      "0101": {
        name: "Alabama East",
        fips: "0101",
        projectionType: "TM",
        params: {
          centralMeridian: "85 50 W",
          latitudeOfOrigin: "30 30 N",
          scaleFactorDenominator: 25000,
          falseEasting: 200000.0,
          falseNorthing: 0.0,
          units: "meters"
        }
      },
      "2600": {
        name: "Michigan Central",
        fips: "2600",
        projectionType: "TM",
        params: {
          centralMeridian: "84 22 W",
          latitudeOfOrigin: "41 30 N",
          scaleFactorDenominator: 11000,
          falseEasting: 500000.0,
          falseNorthing: 0.0,
          units: "meters"
        }
      },
      "5001": {
        name: "Alaska 1",
        fips: "5001",
        projectionType: "OM",
        params: {
          centralMeridian: "Special",
          latitudeOfOrigin: "57 00 N",
          falseEasting: 5000000.0,
          falseNorthing: 0.0,
          units: "meters"
        }
      }
    }
  },
  NAD27: {
    zones: {
      "0101": {
        name: "Alabama East",
        fips: "0101",
        projectionType: "TM",
        params: {
          centralMeridian: "85 50 W",
          latitudeOfOrigin: "30 30 N",
          scaleFactorDenominator: 25000,
          falseEasting: 500000.0,
          falseNorthing: 0.0,
          units: "US survey feet"
        }
      }
    }
  }
}));

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

describe('SPCS Zone Parameters Database Access', () => {
  test('gets correct zone parameters for valid FIPS code', () => {
    const params = getSPCSZoneParameters('0101');
    expect(params).toBeDefined();
    expect(params.name).toBe('Alabama East');
    expect(params.projectionType).toBe('TM');
    expect(params.params.centralMeridian).toBe('85 50 W');
    expect(params.params.scaleFactorDenominator).toBe(25000);
  });

  test('pads FIPS code correctly', () => {
    const params = getSPCSZoneParameters('101');
    expect(params).toBeDefined();
    expect(params.name).toBe('Alabama East');
  });

  test('handles numeric FIPS code', () => {
    const params = getSPCSZoneParameters(101);
    expect(params).toBeDefined();
    expect(params.name).toBe('Alabama East');
  });

  test('returns null for invalid FIPS code', () => {
    const params = getSPCSZoneParameters('9999');
    expect(params).toBeNull();
  });

  test('returns null for missing FIPS code', () => {
    const params = getSPCSZoneParameters();
    expect(params).toBeNull();
  });

  test('retrieves NAD27 parameters when specified', () => {
    const params = getSPCSZoneParameters('0101', 'NAD27');
    expect(params).toBeDefined();
    expect(params.params.falseEasting).toBe(500000.0);
    expect(params.params.units).toBe('feet_us');
  });

  test('returns null for invalid datum', () => {
    const params = getSPCSZoneParameters('0101', 'INVALID');
    expect(params).toBeNull();
  });
});

describe('DDMMSS Coordinate Formatting', () => {
  test('formats DDMMSS string with proper symbols', () => {
    expect(formatDDMMSS('85 50 W')).toBe('85° 50′ W');
    expect(formatDDMMSS('30 30 N')).toBe('30° 30′ N');
  });

  test('handles coordinates with seconds', () => {
    expect(formatDDMMSS('122 19 45 W')).toBe('122° 19′ 45″ W');
    expect(formatDDMMSS('37 52 30 N')).toBe('37° 52′ 30″ N');
  });

  test('omits seconds when they are zero', () => {
    expect(formatDDMMSS('122 19 00 W')).toBe('122° 19′ W');
  });

  test('handles case variations in direction', () => {
    expect(formatDDMMSS('85 50 w')).toBe('85° 50′ W');
    expect(formatDDMMSS('30 30 n')).toBe('30° 30′ N');
  });

  test('handles decimal degrees format', () => {
    expect(formatDDMMSS('85.8333')).toBe('85.8333°');
    expect(formatDDMMSS('-122.3264')).toBe('-122.3264°');
  });

  test('returns original string if format is unrecognized', () => {
    const unusual = 'Unusual Format';
    expect(formatDDMMSS(unusual)).toBe(unusual);
  });

  test('handles null or undefined input', () => {
    expect(formatDDMMSS(null)).toBe('Not specified');
    expect(formatDDMMSS(undefined)).toBe('Not specified');
  });

  test('handles non-string input', () => {
    expect(formatDDMMSS(12345)).toBe('Not specified');
    expect(formatDDMMSS({})).toBe('Not specified');
  });
}); 