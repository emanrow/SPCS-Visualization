/**
 * Transverse Mercator projection visualization
 * 
 * This file contains functions for visualizing the Transverse Mercator projection,
 * which uses a cylinder tangent to a meridian.
 */

import * as THREE from 'three';
import { formatDDMMSS } from '../math/spcs.js';

// Constants for visualization
const CYLINDER_SEGMENTS = 64; // Number of segments around the cylinder
const CYLINDER_RINGS = 20;    // Number of rings along the cylinder
const EARTH_RADIUS = 6378137; // GRS80 semi-major axis in meters
const CYLINDER_HEIGHT = EARTH_RADIUS * 2.0;    // Height of the cylinder (along y-axis)
const CYLINDER_RADIUS = EARTH_RADIUS;  // Same radius as the Earth
const PRIMARY_LINE_COLOR = 0xffff00; // Bright yellow for primary lines
const SECONDARY_LINE_COLOR = 0x888888; // Gray for secondary lines
const LINE_OPACITY = 0.8;

/**
 * Create a Transverse Mercator projection cylinder
 * 
 * @param {Object} scene - Three.js scene to add the cylinder to
 * @param {Object} zone - SPCS zone data
 * @returns {Object} - Object containing the cylinder and related objects
 */
export function createTransverseMercatorCylinder(scene, zone) {
  // Create a unique identifier for this zone
  const zoneId = zone.name.replace(/\s+/g, '_').toLowerCase();
  
  // Create a cylinder group to hold all the cylinder components
  const cylinderGroup = new THREE.Group();
  cylinderGroup.name = `transverseMercatorCylinder_${zoneId}`;
  
  // Create the main cylinder geometry
  const cylinderGeometry = new THREE.CylinderGeometry(
    CYLINDER_RADIUS,    // Top radius
    CYLINDER_RADIUS,    // Bottom radius
    CYLINDER_HEIGHT,    // Height
    CYLINDER_SEGMENTS,  // Segments around the circumference
    CYLINDER_RINGS,     // Height segments
    true                // Open-ended
  );
  
  // Create a material for the cylinder - semitransparent
  const cylinderMaterial = new THREE.MeshBasicMaterial({
    color: 0x3366ff,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
    wireframe: false
  });
  
  // Create the cylinder mesh
  const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  cylinder.name = `tmCylinder_${zoneId}`;
  cylinderGroup.add(cylinder);
  
  // Add baseline lines to the cylinder
  addBaselineLines(cylinderGroup);
  
  // Add a local axes helper to visualize the cylinder's coordinate system
  const axesHelper = new THREE.AxesHelper(EARTH_RADIUS * 0.2); // 20% of Earth radius
  axesHelper.name = 'cylinderAxes';
  // Make the axes more visible
  axesHelper.material.linewidth = 3;
  axesHelper.material.depthTest = false;
  cylinderGroup.add(axesHelper);
  
  // Align cylinder with Earth's coordinate system:
  cylinderGroup.rotateX(Math.PI / 2);
  cylinderGroup.rotateZ(Math.PI / 2);
  
  // Apply SPCS zone-specific rotations
  if (zone.spcsParams && zone.spcsParams.params) {
    const params = zone.spcsParams.params;
    
    // 1. Rotate to Central Meridian (around Z-axis)
    if (params.centralMeridian) {
      // Parse the DMS string (e.g., "146 00 W" -> -146 degrees)
      const matches = params.centralMeridian.match(/(\d+)\s+(\d+)\s+([WE])/);
      if (matches) {
        const degrees = parseInt(matches[1]);
        const minutes = parseInt(matches[2]);
        const direction = matches[3];
        let angle = degrees + (minutes / 60);
        if (direction === 'W') angle = -angle;
        
        // Convert to radians and rotate
        cylinderGroup.rotateZ(-angle * Math.PI / 180);
        console.log(`Rotated cylinder to Central Meridian: ${angle}°`);
      }
    }
    
    // 2. Rotate to Latitude of Origin (around Y-axis)
    if (params.latitudeOfOrigin) {
      // Parse the DMS string (e.g., "54 00 N" -> 54 degrees)
      const matches = params.latitudeOfOrigin.match(/(\d+)\s+(\d+)\s+([NS])/);
      if (matches) {
        const degrees = parseInt(matches[1]);
        const minutes = parseInt(matches[2]);
        const direction = matches[3];
        let angle = degrees + (minutes / 60);
        if (direction === 'S') angle = -angle;
        
        // Convert to radians and rotate
        cylinderGroup.rotateY(angle * Math.PI / 180);
        console.log(`Rotated cylinder to Latitude of Origin: ${angle}°`);
      }
    }
    
    // 3. Apply scale factor
    if (params.scaleFactor) {
      // Extract the integer denominator (e.g. 10000 means 1 - 1/10000 = 0.9999)
      let scaleFactorNumber;
      
      // Try parsing as a direct number first
      if (typeof params.scaleFactor === 'number') {
        scaleFactorNumber = params.scaleFactor;
      } 
      // Then try parsing as a string representation
      else if (typeof params.scaleFactor === 'string') {
        // Handle different possible formats
        if (params.scaleFactor.includes('/')) {
          // Format like "1/10000"
          const parts = params.scaleFactor.split('/');
          if (parts.length === 2) {
            scaleFactorNumber = parseInt(parts[1]);
          }
        } else {
          // Direct integer format
          scaleFactorNumber = parseInt(params.scaleFactor);
        }
      }
      
      if (scaleFactorNumber && !isNaN(scaleFactorNumber)) {
        // Calculate actual scale factor: 1 - 1/denominator
        const actualScaleFactor = 1 - (1 / scaleFactorNumber);
        
        // Apply scale (scale the radius)
        cylinderGroup.scale.set(actualScaleFactor, 1, actualScaleFactor);
        console.log(`Applied scale factor: ${actualScaleFactor} (1 - 1/${scaleFactorNumber})`);
      }
    }
  }
  
  // Add the cylinder group to the scene
  scene.add(cylinderGroup);
  
  // Log that we've created the cylinder
  console.log(`Created Transverse Mercator cylinder for zone: ${zone.name}`);
  
  return {
    cylinderGroup,
    cylinder
  };
}

/**
 * Add baseline lines to the cylinder
 * - A vertical line at 0 degrees (angular basis)
 * - A horizontal ring at the center
 * 
 * @param {Object} cylinderGroup - Three.js group to add the lines to
 */
function addBaselineLines(cylinderGroup) {
  const radius = CYLINDER_RADIUS;
  const height = CYLINDER_HEIGHT;
  
  // Create the vertical line at 0 degrees (angular basis)
  const verticalLineGeometry = new THREE.BufferGeometry();
  const verticalPositions = [];
  
  // Bottom point (at 0 degrees)
  verticalPositions.push(radius, -height/2, 0);
  // Top point (at 0 degrees)
  verticalPositions.push(radius, height/2, 0);
  
  verticalLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticalPositions, 3));
  
  const verticalLineMaterial = new THREE.LineBasicMaterial({
    color: PRIMARY_LINE_COLOR,
    opacity: LINE_OPACITY,
    transparent: true,
    depthTest: false,  // Make line always visible
    linewidth: 2       // Thicker line for better visibility
  });
  
  const verticalLine = new THREE.Line(verticalLineGeometry, verticalLineMaterial);
  verticalLine.name = 'angularBasis';
  cylinderGroup.add(verticalLine);
  
  // Create the horizontal ring at the center - create a full circle but make it always visible
  const centerRingGeometry = new THREE.BufferGeometry();
  const centerRingPositions = [];
  
  // Create points around the complete circle at y=0 (center)
  for (let i = 0; i <= CYLINDER_SEGMENTS; i++) {
    const theta = (i / CYLINDER_SEGMENTS) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    centerRingPositions.push(x, 0, z);
  }
  
  centerRingGeometry.setAttribute('position', new THREE.Float32BufferAttribute(centerRingPositions, 3));
  
  // Create two materials - one for the front half and one for the back half
  const frontMaterial = new THREE.LineBasicMaterial({
    color: PRIMARY_LINE_COLOR,
    opacity: LINE_OPACITY,
    transparent: true,
    depthTest: false,  // Make line always visible
    linewidth: 3       // Extra thick for the front half
  });
  
  const backMaterial = new THREE.LineBasicMaterial({
    color: PRIMARY_LINE_COLOR,
    opacity: LINE_OPACITY * 0.5,  // More transparent for the back half
    transparent: true,
    depthTest: false,  // Make line always visible
    linewidth: 1       // Thinner for the back half
  });
  
  // Create a custom shader material that makes the ring always face the camera
  const centerRingMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(PRIMARY_LINE_COLOR) },
      opacity: { value: LINE_OPACITY }
    },
    vertexShader: `
      varying vec3 vViewPosition;
      
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec3 vViewPosition;
      
      void main() {
        // Calculate dot product between view direction and normal
        float cosAngle = normalize(vViewPosition).z;
        
        // Fade out the back side
        float finalOpacity = opacity * (0.3 + 0.7 * abs(cosAngle));
        
        gl_FragColor = vec4(color, finalOpacity);
      }
    `,
    transparent: true,
    depthTest: false
  });
  
  const centerRing = new THREE.Line(centerRingGeometry, frontMaterial);
  centerRing.name = 'centerRing';
  centerRing.renderOrder = 999;  // Ensure this renders last (on top)
  cylinderGroup.add(centerRing);
}

/**
 * Add latitude lines to the cylinder
 * 
 * @param {Object} cylinderGroup - Three.js group to add the lines to
 * @param {Object} zone - SPCS zone data
 */
function addLatitudeLines(cylinderGroup, zone) {
  // Get the cylinder radius and height
  const radius = CYLINDER_RADIUS;
  const height = CYLINDER_HEIGHT;
  
  // Extract the latitude of origin from the zone parameters
  let originLatitude = 0; // Default to equator
  
  // Try to get the latitude of origin from the zone parameters
  if (zone.spcsParams && zone.spcsParams.params && zone.spcsParams.params.latitudeOfOrigin) {
    const latOriginStr = zone.spcsParams.params.latitudeOfOrigin;
    console.log(`Latitude of origin: ${formatDDMMSS(latOriginStr)}`);
    // We'll parse this later for exact positioning
  } else if (zone.latitudeOfOrigin !== undefined) {
    originLatitude = zone.latitudeOfOrigin;
    console.log(`Latitude of origin: ${originLatitude.toFixed(4)}°`);
  }
  
  // For now, we'll draw evenly spaced latitude rings
  const numLatLines = 11; // Including origin latitude
  const latStep = height / (numLatLines - 1);
  
  for (let i = 0; i < numLatLines; i++) {
    const y = -height / 2 + i * latStep;
    const isOrigin = i === Math.floor(numLatLines / 2); // Middle line is origin for now
    
    // Create a circle for this latitude
    const circleGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    // Create points around the circle
    for (let j = 0; j <= CYLINDER_SEGMENTS; j++) {
      const theta = (j / CYLINDER_SEGMENTS) * Math.PI * 2;
      const x = radius * Math.cos(theta);
      const z = radius * Math.sin(theta);
      positions.push(x, y, z);
    }
    
    circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Create material - highlighted for origin
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isOrigin ? PRIMARY_LINE_COLOR : SECONDARY_LINE_COLOR,
      opacity: isOrigin ? LINE_OPACITY + 0.1 : LINE_OPACITY,
      transparent: true
    });
    
    // Create the line and add to the group
    const line = new THREE.Line(circleGeometry, lineMaterial);
    line.name = isOrigin ? 'originLatitude' : `latitude_${i}`;
    cylinderGroup.add(line);
  }
}

/**
 * Add longitude lines to the cylinder
 * 
 * @param {Object} cylinderGroup - Three.js group to add the lines to
 * @param {Object} zone - SPCS zone data
 */
function addLongitudeLines(cylinderGroup, zone) {
  // Get the cylinder radius and height
  const radius = CYLINDER_RADIUS;
  const height = CYLINDER_HEIGHT;
  
  // Extract the central meridian from the zone parameters
  let centralMeridian = 0; // Default to prime meridian
  
  // Try to get the central meridian from the zone parameters
  if (zone.spcsParams && zone.spcsParams.params && zone.spcsParams.params.centralMeridian) {
    const cmStr = zone.spcsParams.params.centralMeridian;
    console.log(`Central meridian: ${formatDDMMSS(cmStr)}`);
    // We'll parse this later for exact positioning
  } else if (zone.centralMeridian !== undefined) {
    centralMeridian = zone.centralMeridian;
    console.log(`Central meridian: ${centralMeridian.toFixed(4)}°`);
  }
  
  // For now, we'll draw evenly spaced longitude lines
  const numLongLines = 12; // Including central meridian
  
  for (let i = 0; i < numLongLines; i++) {
    const theta = (i / numLongLines) * Math.PI * 2;
    const isCentralMeridian = i === 0; // First line is central meridian for now
    
    // Create a line for this longitude
    const lineGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    // Create points along the line
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    
    // Bottom point
    positions.push(x, -height / 2, z);
    
    // Top point
    positions.push(x, height / 2, z);
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    // Create material - highlighted for central meridian
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isCentralMeridian ? PRIMARY_LINE_COLOR : SECONDARY_LINE_COLOR,
      opacity: isCentralMeridian ? LINE_OPACITY + 0.1 : LINE_OPACITY,
      transparent: true
    });
    
    // Create the line and add to the group
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.name = isCentralMeridian ? 'centralMeridian' : `longitude_${i}`;
    cylinderGroup.add(line);
  }
} 