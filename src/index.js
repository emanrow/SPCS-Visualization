import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initMap } from './components/map.js';
import { initScene } from './visualization/scene.js';
import { initControls } from './components/controls.js';

// Initialize the application
async function init() {
  // Initialize Leaflet map
  const map = initMap('map');
  
  // Initialize Three.js scene
  const { scene, camera, renderer } = initScene('three-container');
  
  // Add orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  
  // Initialize UI controls
  initControls(map, scene, camera);
  
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