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