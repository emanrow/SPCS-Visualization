/**
 * API Surface Validation Tests
 * 
 * These tests verify that the API methods we use actually exist on their objects.
 * This helps catch errors when we try to use methods that don't exist without complex mocking.
 */

// Import the actual libraries we use
import L from 'leaflet';

describe('API Surface Validation', () => {
  
  describe('Leaflet API', () => {
    test('map methods exist', () => {
      // Get an instance of the map
      const container = document.createElement('div');
      const map = L.map(container);
      
      // Verify methods and properties we use
      expect(typeof map.setView).toBe('function');
      expect(typeof map.addLayer).toBe('function');
      expect(typeof map.removeLayer).toBe('function');
      expect(typeof map.flyTo).toBe('function');
    });
    
    test('layer creation methods exist', () => {
      // Verify layer creation methods
      expect(typeof L.tileLayer).toBe('function');
      expect(typeof L.marker).toBe('function');
      expect(typeof L.polygon).toBe('function');
    });
    
    test('polygon methods exist', () => {
      // Create a simple polygon
      const polygon = L.polygon([
        [0, 0],
        [0, 1],
        [1, 1]
      ]);
      
      // Verify methods we use
      expect(typeof polygon.addTo).toBe('function');
      expect(typeof polygon.bindPopup).toBe('function');
    });
    
    test('polygon handles multi-polygon arrays', () => {
      // Create a multi-polygon (array of polygon coordinates)
      const multiPolygon = L.polygon([
        // First polygon
        [
          [0, 0],
          [0, 1], 
          [1, 1]
        ],
        // Second polygon
        [
          [2, 2],
          [2, 3],
          [3, 3]
        ]
      ]);
      
      // Verify multiPolygon is created successfully
      expect(multiPolygon).toBeDefined();
      expect(typeof multiPolygon.addTo).toBe('function');
    });
    
    test('latLngBounds properties and methods', () => {
      // Create bounds object
      const bounds = L.latLngBounds([
        [0, 0],
        [1, 1]
      ]);
      
      // Verify methods we use
      expect(typeof bounds.getSouth).toBe('function');
      expect(typeof bounds.getNorth).toBe('function');
      expect(typeof bounds.getWest).toBe('function');
      expect(typeof bounds.getEast).toBe('function');
      
      // Verify extend method exists (used for combining bounds)
      expect(typeof bounds.extend).toBe('function');
      
      // Verify that we can create a new bounds object from an existing one
      const newBounds = L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());
      expect(newBounds).toBeDefined();
      expect(typeof newBounds.extend).toBe('function');
      
      // Check that this is how we should copy bounds (not using clone)
      expect(typeof bounds.clone).not.toBe('function');
    });
  });
  
  // Add more API validation tests for other libraries as needed
}); 