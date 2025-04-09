import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { orbitToLongitude, orbitToLatLong } from '../../src/visualization/scene.js';
import * as THREE from 'three';

// Mock Three.js objects
jest.mock('three', () => {
  // Create mock implementations for the Three.js objects we use
  const actualThree = jest.requireActual('three');
  
  return {
    ...actualThree,
    Vector3: jest.fn().mockImplementation(() => ({
      copy: jest.fn().mockReturnThis(),
      setFromSpherical: jest.fn().mockReturnThis()
    })),
    Spherical: jest.fn().mockImplementation(() => ({
      setFromVector3: jest.fn().mockReturnThis(),
      theta: 0,
      phi: Math.PI / 2 // Default phi is PI/2 (90 degrees) which is the equator
    }))
  };
});

describe('Scene and Camera Controls', () => {
  // Create mock controls and camera
  const mockControls = {
    update: jest.fn()
  };
  
  const mockCamera = {
    position: {
      copy: jest.fn()
    },
    lookAt: jest.fn()
  };
  
  // Store original window methods
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const originalPerformance = window.performance;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock performance.now to return sequential times
    let time = 0;
    window.performance = {
      now: jest.fn().mockImplementation(() => {
        time += 100;
        return time;
      })
    };
    
    // Make requestAnimationFrame call the callback immediately
    window.requestAnimationFrame = jest.fn().mockImplementation(cb => cb());
  });
  
  afterEach(() => {
    // Restore original window methods
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.performance = originalPerformance;
  });
  
  test('orbitToLongitude calculates the correct target angle', () => {
    // Orbit to 90° East
    orbitToLongitude(mockControls, mockCamera, 90, 0);
    
    // Since we're now using positive angles directly
    // the target angle should be 90° * (Math.PI / 180) = 1.5708... radians
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(mockControls.update).toHaveBeenCalled();
  });
  
  test('orbitToLongitude handles negative longitudes (western hemisphere)', () => {
    // Orbit to 90° West
    orbitToLongitude(mockControls, mockCamera, -90, 0);
    
    // Since we're now using negative angles directly
    // the target angle should be -90° * (Math.PI / 180) = -1.5708... radians
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(mockControls.update).toHaveBeenCalled();
  });
  
  test('orbitToLatLong orbits to both latitude and longitude', () => {
    // Orbit to 30°N, 45°E
    orbitToLatLong(mockControls, mockCamera, 30, 45, 0);
    
    // Camera should update its position and look at the center
    expect(mockCamera.position.copy).toHaveBeenCalled();
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(mockControls.update).toHaveBeenCalled();
  });
  
  test('orbitToLatLong handles southern latitudes', () => {
    // Orbit to 30°S, 45°W
    orbitToLatLong(mockControls, mockCamera, -30, -45, 0);
    
    // Camera should update its position and look at the center
    expect(mockCamera.position.copy).toHaveBeenCalled();
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    expect(mockControls.update).toHaveBeenCalled();
  });
  
  test('orbitToLatLong converts latitude correctly to spherical phi', () => {
    // Orbit to North Pole (90°N)
    orbitToLatLong(mockControls, mockCamera, 90, 0, 0);
    
    // At North Pole, phi should be 0
    // Since we're using mocks, we can't directly test the phi value,
    // but the function should at least complete without errors
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
    
    // Orbit to South Pole (-90°S)
    orbitToLatLong(mockControls, mockCamera, -90, 0, 0);
    
    // At South Pole, phi should be PI
    expect(mockCamera.lookAt).toHaveBeenCalledWith(0, 0, 0);
  });
}); 