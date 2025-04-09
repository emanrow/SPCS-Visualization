import { loadSPCSZones, processZoneData } from '../math/spcs.js';
import { createZoneLayer, createZonePopup } from './map.js';
import { zoomToVisibleZones } from './mapUtils.js';
import { visualizeProjection } from '../visualization/projections.js';
import { orbitToLongitude, orbitToLatLong } from '../visualization/scene.js';
import * as THREE from 'three';

export function initControls(map, scene, camera, controls) {
  const coordInput = document.getElementById('coord-input');
  const projectBtn = document.getElementById('project-btn');
  const spcsToggle = document.getElementById('spcs-toggle');
  const toggleAllContainer = document.getElementById('toggle-all-container');
  
  // Store zone data and layers
  const zoneData = {
    zones: [],
    layers: {},
    visible: new Set()
  };
  
  // Create a projection map to store references to 3D objects by zone index
  // This ensures each zone's 3D visualization can be individually tracked and removed
  // without affecting other zones' visualizations
  const projectionObjects = {};
  
  // Handle coordinate projection
  projectBtn.addEventListener('click', () => {
    const coord = coordInput.value;
    const [lat, lon] = coord.split(',').map(Number);
    
    if (isNaN(lat) || isNaN(lon)) {
      alert('Invalid coordinate format! Please use lat,lon');
      return;
    }
    
    // Add marker to map
    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`)
      .openPopup();
    
    // Center map on coordinate
    map.flyTo([lat, lon], 10);
    
    // TODO: Add 3D visualization
  });
  
  // Show loading status
  spcsToggle.innerHTML = 'Loading SPCS zones...';
  
  // Load SPCS zones
  loadSPCSZones()
    .then(data => {
      console.log('Loaded SPCS data:', data);
      
      // Process the zone data
      zoneData.zones = processZoneData(data);
      console.log('Processed zones:', zoneData.zones);
      
      // Sort zones by name
      zoneData.zones.sort((a, b) => a.name.localeCompare(b.name));
      
      // Create toggle UI
      spcsToggle.innerHTML = '';
      
      // Add "Clear All" checkbox to the toggle-all-container
      const toggleAllDiv = document.createElement('div');
      toggleAllDiv.className = 'form-check mb-2';
      
      const toggleAllCheckbox = document.createElement('input');
      toggleAllCheckbox.className = 'form-check-input';
      toggleAllCheckbox.type = 'checkbox';
      toggleAllCheckbox.id = 'toggle-all';
      toggleAllCheckbox.disabled = true; // Initially disabled
      
      const toggleAllLabel = document.createElement('label');
      toggleAllLabel.className = 'form-check-label fw-bold text-muted'; // Initially greyed out
      toggleAllLabel.htmlFor = 'toggle-all';
      toggleAllLabel.textContent = 'Clear All Zones';
      
      toggleAllDiv.appendChild(toggleAllCheckbox);
      toggleAllDiv.appendChild(toggleAllLabel);
      toggleAllContainer.appendChild(toggleAllDiv);
      
      // Check if we have zones
      if (zoneData.zones.length === 0) {
        spcsToggle.innerHTML += '<p>No SPCS zones found. Please check the console for errors.</p>';
        return;
      }
      
      // Add zone checkboxes
      zoneData.zones.forEach((zone, idx) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.id = `zone-${idx}`;
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `zone-${idx}`;
        label.textContent = zone.name;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        spcsToggle.appendChild(div);
        
        try {
          // Create layer for this zone (but don't add to map yet)
          const layer = createZoneLayer(zone);
          layer.bindPopup(() => createZonePopup(zone));
          zoneData.layers[idx] = layer;
          
          // Add toggle event handler
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              // Add zone to map
              layer.addTo(map);
              zoneData.visible.add(idx);
              
              try {
                // Call the projection visualization function when zone is selected
                // and store the returned 3D objects for later reference
                const projectionObject = visualizeProjection(scene, zone);
                
                // Store the projection object for this zone using its index as the key
                // This allows us to retrieve exactly the right 3D objects when removing them
                if (projectionObject) {
                  projectionObjects[idx] = projectionObject;
                } else {
                  console.warn(`No projection visualization created for zone: ${zone.name}`);
                }
                
                // Orbit the camera to the Central Meridian of the selected zone
                let centralMeridian = 0; // Default to Prime Meridian
                let latitudeOfOrigin = 0; // Default to Equator
                
                // Get the central meridian and latitude of origin from the zone parameters
                if (zone.spcsParams && zone.spcsParams.params) {
                  const params = zone.spcsParams.params;
                  
                  // Extract central meridian
                  if (params.centralMeridian) {
                    const cmStr = params.centralMeridian;
                    // Parse the DMS string (e.g., "146 00 W" -> -146 degrees)
                    const matches = cmStr.match(/(\d+)\s+(\d+)\s+([WE])/);
                    if (matches) {
                      const degrees = parseInt(matches[1]);
                      const minutes = parseInt(matches[2]);
                      const direction = matches[3];
                      centralMeridian = degrees + (minutes / 60);
                      if (direction === 'W') centralMeridian = -centralMeridian;
                    }
                  } else if (params.longitudeOfOrigin) {
                    // Some LCC zones use longitudeOfOrigin instead of centralMeridian
                    const cmStr = params.longitudeOfOrigin;
                    const matches = cmStr.match(/(\d+)\s+(\d+)\s+([WE])/);
                    if (matches) {
                      const degrees = parseInt(matches[1]);
                      const minutes = parseInt(matches[2]);
                      const direction = matches[3];
                      centralMeridian = degrees + (minutes / 60);
                      if (direction === 'W') centralMeridian = -centralMeridian;
                    }
                  }
                  
                  // Extract latitude of origin
                  if (params.latitudeOfOrigin) {
                    const latStr = params.latitudeOfOrigin;
                    // Parse the DMS string (e.g., "54 00 N" -> 54 degrees)
                    const matches = latStr.match(/(\d+)\s+(\d+)\s+([NS])/);
                    if (matches) {
                      const degrees = parseInt(matches[1]);
                      const minutes = parseInt(matches[2]);
                      const direction = matches[3];
                      latitudeOfOrigin = degrees + (minutes / 60);
                      if (direction === 'S') latitudeOfOrigin = -latitudeOfOrigin;
                    }
                  }
                  
                  // Orbit to both central meridian and latitude of origin
                  orbitToLatLong(controls, camera, latitudeOfOrigin, centralMeridian);
                  
                } else if (zone.centralMeridian !== undefined) {
                  // Use the numeric central meridian directly
                  centralMeridian = zone.centralMeridian;
                  
                  // Try to get latitude of origin
                  if (zone.latitudeOfOrigin !== undefined) {
                    latitudeOfOrigin = zone.latitudeOfOrigin;
                    orbitToLatLong(controls, camera, latitudeOfOrigin, centralMeridian);
                  } else {
                    // If only central meridian is available, use orbitToLongitude
                    orbitToLongitude(controls, camera, centralMeridian);
                  }
                }
              } catch (error) {
                console.error(`Error visualizing projection for zone ${zone.name}:`, error);
              }
            } else {
              // Remove zone from map
              map.removeLayer(layer);
              zoneData.visible.delete(idx);
              
              try {
                // Remove the projection visualization for this specific zone only
                // using the stored reference from when it was created
                const projection = projectionObjects[idx];
                if (projection && projection.cylinderGroup) {
                  scene.remove(projection.cylinderGroup);
                  // Dispose of geometries and materials to prevent memory leaks
                  projection.cylinderGroup.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                      object.geometry.dispose();
                      object.material.dispose();
                    } else if (object instanceof THREE.Line) {
                      object.geometry.dispose();
                      object.material.dispose();
                    }
                  });
                  // Remove the reference to avoid memory leaks
                  delete projectionObjects[idx];
                } else {
                  console.warn(`No projection visualization found for zone index: ${idx}`);
                }
              } catch (error) {
                console.error(`Error removing projection for zone ${zone.name}:`, error);
              }
            }
            
            // Update "Toggle All" checkbox state
            updateToggleAllState();
            
            // Zoom to all visible zones
            zoomToVisibleZones(map, zoneData.zones, zoneData.visible);
          });
        } catch (error) {
          console.error(`Error creating layer for zone ${zone.name}:`, error);
          label.style.color = 'red';
          label.title = 'Error: ' + error.message;
        }
      });
      
      // Add "Toggle All" handler
      toggleAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = spcsToggle.querySelectorAll('input[type="checkbox"]:not(#toggle-all)');
        
        checkboxes.forEach((checkbox, idx) => {
          // Skip checkboxes for zones with errors
          if (!zoneData.layers[idx]) return;
          
          // Only uncheck selected checkboxes
          if (checkbox.checked) {
            checkbox.checked = false;
            
            // Remove zone from map
            map.removeLayer(zoneData.layers[idx]);
            zoneData.visible.delete(idx);
            
            // Remove projection visualization for this zone
            const projection = projectionObjects[idx];
            if (projection && projection.cylinderGroup) {
              scene.remove(projection.cylinderGroup);
              // Dispose of geometries and materials to prevent memory leaks
              projection.cylinderGroup.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                  object.geometry.dispose();
                  object.material.dispose();
                } else if (object instanceof THREE.Line) {
                  object.geometry.dispose();
                  object.material.dispose();
                }
              });
              // Remove the reference
              delete projectionObjects[idx];
            }
          }
        });
        
        // Reset toggle checkbox state
        e.target.checked = false;
        e.target.indeterminate = false;
        
        // Update the toggle button's disabled state
        updateToggleAllState();
        
        // Zoom to all visible zones after clearing
        zoomToVisibleZones(map, zoneData.zones, zoneData.visible);
      });
      
      // Function to update "Toggle All" state based on individual checkboxes
      function updateToggleAllState() {
        const checkboxes = spcsToggle.querySelectorAll('input[type="checkbox"]:not(#toggle-all)');
        const allChecked = zoneData.visible.size === checkboxes.length;
        const someChecked = zoneData.visible.size > 0 && zoneData.visible.size < checkboxes.length;
        
        toggleAllCheckbox.checked = allChecked;
        toggleAllCheckbox.indeterminate = someChecked;
        
        // Enable or disable based on whether any zones are selected
        if (zoneData.visible.size > 0) {
          toggleAllCheckbox.disabled = false;
          toggleAllLabel.classList.remove('text-muted');
        } else {
          toggleAllCheckbox.disabled = true;
          toggleAllLabel.classList.add('text-muted');
        }
      }
    })
    .catch(error => {
      console.error('Failed to load SPCS zones:', error);
      spcsToggle.innerHTML = `<div class="alert alert-danger">Failed to load SPCS zones: ${error.message}</div>`;
    });
} 