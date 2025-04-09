import * as THREE from 'three';
import { initMap } from './components/map.js';
import { initScene } from './visualization/scene.js';
import { initControls } from './components/controls.js';

// Initialize the application
async function init() {
  // Initialize Leaflet map
  const map = initMap('map');
  
  // Initialize Three.js scene
  const { scene, camera, renderer, controls } = initScene('three-container');
  
  // Initialize UI controls
  initControls(map, scene, camera, controls);
  
  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// Start the application
init().catch(console.error); 