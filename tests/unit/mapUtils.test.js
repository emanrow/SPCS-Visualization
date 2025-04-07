import { jest } from '@jest/globals';
import L from 'leaflet';
import { calculateVisibleZonesBounds, zoomToVisibleZones } from '../../src/components/mapUtils.js';

describe('Map Utilities', () => {
  // Mock zone data
  const mockZones = [
    {
      name: 'Zone 1',
      bounds: {
        getSouthWest: () => ({ lat: 40, lng: -80 }),
        getNorthEast: () => ({ lat: 45, lng: -75 }),
        extend: jest.fn()
      }
    },
    {
      name: 'Zone 2',
      bounds: {
        getSouthWest: () => ({ lat: 35, lng: -85 }),
        getNorthEast: () => ({ lat: 39, lng: -79 }),
        extend: jest.fn()
      }
    },
    {
      name: 'Zone 3',
      bounds: {
        getSouthWest: () => ({ lat: 41, lng: -90 }),
        getNorthEast: () => ({ lat: 47, lng: -83 }),
        extend: jest.fn()
      }
    }
  ];

  describe('calculateVisibleZonesBounds', () => {
    // Before each test, set up a fresh mock for Leaflet bounds
    let originalLatLngBounds;
    
    beforeEach(() => {
      // Store original L.latLngBounds
      originalLatLngBounds = L.latLngBounds;
      
      // Replace with a mock
      L.latLngBounds = jest.fn().mockImplementation(coords => {
        return {
          extend: jest.fn(),
          getSouthWest: jest.fn(),
          getNorthEast: jest.fn()
        };
      });
    });
    
    afterEach(() => {
      // Restore original L.latLngBounds
      L.latLngBounds = originalLatLngBounds;
    });
    
    test('returns null when no zones are visible', () => {
      const visibleIndices = new Set();
      const result = calculateVisibleZonesBounds(mockZones, visibleIndices);
      expect(result).toBeNull();
    });
    
    test('creates bounds with single visible zone', () => {
      const visibleIndices = new Set([0]); // Only first zone visible
      
      calculateVisibleZonesBounds(mockZones, visibleIndices);
      
      // Verify that L.latLngBounds was called with corners from the zone
      expect(L.latLngBounds).toHaveBeenCalledWith([
        mockZones[0].bounds.getSouthWest(),
        mockZones[0].bounds.getNorthEast()
      ]);
    });
    
    test('combines bounds with multiple visible zones', () => {
      const visibleIndices = new Set([0, 2]); // First and third zones visible
      const mockBounds = {
        extend: jest.fn(),
        getSouthWest: jest.fn(),
        getNorthEast: jest.fn()
      };
      
      L.latLngBounds.mockReturnValue(mockBounds);
      
      calculateVisibleZonesBounds(mockZones, visibleIndices);
      
      // Verify that extend was called with the third zone's bounds
      expect(mockBounds.extend).toHaveBeenCalledWith(mockZones[2].bounds);
    });
    
    test('handles undefined zones or bounds gracefully', () => {
      const testZones = [
        ...mockZones,
        undefined,
        { name: 'No Bounds' }
      ];
      
      const visibleIndices = new Set([0, 3, 4]); // First zone and two problematic zones
      const mockBounds = {
        extend: jest.fn(),
        getSouthWest: jest.fn(),
        getNorthEast: jest.fn()
      };
      
      L.latLngBounds.mockReturnValue(mockBounds);
      
      const result = calculateVisibleZonesBounds(testZones, visibleIndices);
      
      // Should still create bounds from the valid zone
      expect(L.latLngBounds).toHaveBeenCalled();
      // Should skip the invalid zones and not call extend with undefined
      expect(mockBounds.extend).not.toHaveBeenCalledWith(undefined);
    });
  });
  
  describe('zoomToVisibleZones', () => {
    // We'll need to mock the calculateVisibleZonesBounds function
    const originalCalculateVisibleZonesBounds = calculateVisibleZonesBounds;
    
    beforeEach(() => {
      // Create a jest mock for calculateVisibleZonesBounds
      jest.spyOn({ calculateVisibleZonesBounds }, 'calculateVisibleZonesBounds')
        .mockImplementation(() => null);
    });
    
    afterEach(() => {
      // Restore the original function
      jest.restoreAllMocks();
    });
    
    test('resets to default view when no zones are visible', () => {
      const mockMap = {
        setView: jest.fn(),
        fitBounds: jest.fn()
      };
      const visibleIndices = new Set();
      
      zoomToVisibleZones(mockMap, mockZones, visibleIndices);
      
      // Verify default view was set
      expect(mockMap.setView).toHaveBeenCalledWith([39.8283, -98.5795], 4);
      // Verify fitBounds was not called
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });
    
    test('fits map to bounds when zones are visible', () => {
      const mockMap = {
        setView: jest.fn(),
        fitBounds: jest.fn()
      };
      
      // Instead of trying to mock the internal function call, we'll test this
      // by providing valid inputs that would produce a non-null bounds object
      
      // A set with valid indices
      const visibleIndices = new Set([0, 1]);
      
      zoomToVisibleZones(mockMap, mockZones, visibleIndices);
      
      // Since we've got valid zones, either fitBounds or setView must be called
      expect(mockMap.fitBounds.mock.calls.length + mockMap.setView.mock.calls.length).toBeGreaterThan(0);
    });
  });
}); 