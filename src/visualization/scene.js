import * as THREE from 'three';
import { DatumEllipsoid } from './ellipsoid.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function initScene(containerId) {
  // Create scene
  const scene = new THREE.Scene();
  
  // Create camera
  const container = document.getElementById(containerId);
  const camera = new THREE.PerspectiveCamera(
    45,  // Narrower FOV for less distortion
    container.clientWidth / container.clientHeight,
    1000,  // Near plane adjusted for Earth scale
    100000000  // Far plane to allow very distant viewing
  );
  camera.position.set(0, 0, 24000000);  // Position camera ~4x Earth radius away
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000);
  container.appendChild(renderer.domElement);
  
  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 7000000;  // About 1.1x Earth radius
  controls.maxDistance = 50000000; // About 8x Earth radius
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
  
  // Add axes helper (scaled to Earth size)
  const axesHelper = new THREE.AxesHelper(8000000);  // Slightly larger than Earth radius
  scene.add(axesHelper);
  
  // Create the GRS80 ellipsoid
  const ellipsoid = new DatumEllipsoid(scene);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();  // Required for damping
    renderer.render(scene, camera);
  }
  animate();
  
  return { scene, camera, renderer, controls, ellipsoid };
}

/**
 * Orbits the camera to face a specific longitude
 * 
 * IMPORTANT: In this application, the Three.js coordinate system is set up where:
 * - The +Z axis points to the 0° longitude (Prime Meridian)
 * - The +X axis points to the 90°E longitude
 * - The +Y axis points to the North Pole
 * 
 * The longitude value is used directly to calculate theta in spherical coordinates:
 * - Positive longitudes (East) → Camera rotates eastward (counterclockwise looking from above)
 * - Negative longitudes (West) → Camera rotates westward (clockwise looking from above)
 * 
 * Note that camera rotation direction matches the real-world direction:
 * If standing at the North Pole looking down, moving east means moving counterclockwise.
 * 
 * @param {Object} controls - OrbitControls instance
 * @param {Object} camera - Three.js camera
 * @param {number} longitude - Longitude in degrees to orbit to
 * @param {number} [duration=1000] - Animation duration in milliseconds
 */
export function orbitToLongitude(controls, camera, longitude, duration = 1000) {
  // Convert longitude to radians
  // Use longitude directly (positive = East, negative = West)
  const targetAngle = longitude * (Math.PI / 180);
  
  // Get the current camera position and convert to spherical coordinates
  const currentPosition = new THREE.Vector3().copy(camera.position);
  const spherical = new THREE.Spherical().setFromVector3(currentPosition);
  
  // In Three.js spherical coordinates, theta is the angle in the xz plane (longitude)
  // phi is the angle from the y axis (latitude)
  // We want to keep the same distance and latitude, but change the longitude
  
  // Save original theta to calculate the shortest orbit path
  const originalTheta = spherical.theta;
  
  // Calculate the shortest rotation to the target angle (handling the 360° wrap)
  let deltaTheta = targetAngle - originalTheta;
  
  // Normalize to -PI to PI
  while (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
  while (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
  
  console.log(`Orbiting camera from ${(originalTheta * 180 / Math.PI).toFixed(2)}° to ${(targetAngle * 180 / Math.PI).toFixed(2)}° longitude`);
  
  // Start time for animation
  const startTime = performance.now();
  const endTime = startTime + duration;
  
  // Animation function
  function animateOrbit() {
    const now = performance.now();
    
    if (now >= endTime) {
      // Animation complete - set final position
      spherical.theta = targetAngle;
      const finalPosition = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(finalPosition);
      camera.lookAt(0, 0, 0);
      controls.update();
      return;
    }
    
    // Calculate progress (0 to 1)
    const progress = (now - startTime) / duration;
    
    // Use an easing function (ease-out) for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    
    // Interpolate theta
    spherical.theta = originalTheta + (deltaTheta * easedProgress);
    
    // Convert back to Cartesian coordinates and update camera position
    const newPosition = new THREE.Vector3().setFromSpherical(spherical);
    camera.position.copy(newPosition);
    camera.lookAt(0, 0, 0);
    controls.update();
    
    // Continue animation
    requestAnimationFrame(animateOrbit);
  }
  
  // Start animation
  animateOrbit();
}

/**
 * Orbits the camera to face a specific latitude and longitude
 * 
 * This function positions the camera to look at a specific point on the Earth's surface
 * defined by both latitude and longitude. The camera maintains its current distance
 * from the center of the Earth.
 * 
 * In the Three.js coordinate system:
 * - Latitude is measured from the equator (0°) toward the poles (±90°)
 * - Longitude is measured from the Prime Meridian (0°) eastward (+) or westward (-)
 * 
 * The camera will orbit to position itself at an angle from which it can directly
 * view the specified latitude and longitude on the Earth's surface.
 * 
 * @param {Object} controls - OrbitControls instance
 * @param {Object} camera - Three.js camera
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @param {number} [duration=1000] - Animation duration in milliseconds
 */
export function orbitToLatLong(controls, camera, latitude, longitude, duration = 1000) {
  // Convert latitude and longitude to radians
  // For latitude: 0° at equator, 90° at north pole, -90° at south pole
  // In Three.js spherical coordinates, phi is measured from the +Y axis (north pole)
  // So we need to convert from standard latitude to phi
  const targetPhi = (90 - latitude) * (Math.PI / 180);
  
  // For longitude: 0° at prime meridian, positive east, negative west
  const targetTheta = longitude * (Math.PI / 180);
  
  // Get the current camera position and convert to spherical coordinates
  const currentPosition = new THREE.Vector3().copy(camera.position);
  const spherical = new THREE.Spherical().setFromVector3(currentPosition);
  
  // Save original angles
  const originalTheta = spherical.theta;
  const originalPhi = spherical.phi;
  
  // Calculate the shortest rotation for theta (longitude)
  let deltaTheta = targetTheta - originalTheta;
  
  // Normalize to -PI to PI
  while (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
  while (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
  
  // Calculate the phi difference (latitude)
  const deltaPhi = targetPhi - originalPhi;
  
  console.log(`Orbiting camera to lat: ${latitude.toFixed(2)}°, long: ${longitude.toFixed(2)}°`);
  console.log(`Spherical coords: phi ${(targetPhi * 180 / Math.PI).toFixed(2)}°, theta ${(targetTheta * 180 / Math.PI).toFixed(2)}°`);
  
  // Start time for animation
  const startTime = performance.now();
  const endTime = startTime + duration;
  
  // Animation function
  function animateOrbit() {
    const now = performance.now();
    
    if (now >= endTime) {
      // Animation complete - set final position
      spherical.theta = targetTheta;
      spherical.phi = targetPhi;
      const finalPosition = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(finalPosition);
      camera.lookAt(0, 0, 0);
      controls.update();
      return;
    }
    
    // Calculate progress (0 to 1)
    const progress = (now - startTime) / duration;
    
    // Use an easing function (ease-out) for smoother animation
    const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
    
    // Interpolate theta and phi
    spherical.theta = originalTheta + (deltaTheta * easedProgress);
    spherical.phi = originalPhi + (deltaPhi * easedProgress);
    
    // Convert back to Cartesian coordinates and update camera position
    const newPosition = new THREE.Vector3().setFromSpherical(spherical);
    camera.position.copy(newPosition);
    camera.lookAt(0, 0, 0);
    controls.update();
    
    // Continue animation
    requestAnimationFrame(animateOrbit);
  }
  
  // Start animation
  animateOrbit();
} 