import { loadSPCSZones, processZoneData } from '../math/spcs.js';
import { createZoneLayer, createZonePopup } from './map.js';
import { zoomToVisibleZones } from './mapUtils.js';
import { visualizeProjection } from '../visualization/projections.js';
import * as THREE from 'three';

export function initControls(map, scene, camera) {
  const coordInput = document.getElementById('coord-input');
  const projectBtn = document.getElementById('project-btn');
  const spcsToggle = document.getElementById('spcs-toggle');
  
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
      
      // Add "Toggle All" checkbox
      const toggleAllDiv = document.createElement('div');
      toggleAllDiv.className = 'form-check mb-2';
      
      const toggleAllCheckbox = document.createElement('input');
      toggleAllCheckbox.className = 'form-check-input';
      toggleAllCheckbox.type = 'checkbox';
      toggleAllCheckbox.id = 'toggle-all';
      
      const toggleAllLabel = document.createElement('label');
      toggleAllLabel.className = 'form-check-label fw-bold';
      toggleAllLabel.htmlFor = 'toggle-all';
      toggleAllLabel.textContent = 'Toggle All Zones';
      
      toggleAllDiv.appendChild(toggleAllCheckbox);
      toggleAllDiv.appendChild(toggleAllLabel);
      spcsToggle.appendChild(toggleAllDiv);
      
      // Add horizontal rule
      const hr = document.createElement('hr');
      hr.className = 'my-2';
      spcsToggle.appendChild(hr);
      
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
          
          checkbox.checked = e.target.checked;
          
          if (e.target.checked) {
            // Add all zones to map
            zoneData.layers[idx].addTo(map);
            zoneData.visible.add(idx);
            
            // Visualize projection for this zone
            const projectionObject = visualizeProjection(scene, zoneData.zones[idx]);
            projectionObjects[idx] = projectionObject;
          } else {
            // Remove all zones from map
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
        
        // Zoom to all visible zones after toggling all
        zoomToVisibleZones(map, zoneData.zones, zoneData.visible);
      });
      
      // Function to update "Toggle All" state based on individual checkboxes
      function updateToggleAllState() {
        const checkboxes = spcsToggle.querySelectorAll('input[type="checkbox"]:not(#toggle-all)');
        const allChecked = zoneData.visible.size === checkboxes.length;
        const someChecked = zoneData.visible.size > 0 && zoneData.visible.size < checkboxes.length;
        
        toggleAllCheckbox.checked = allChecked;
        toggleAllCheckbox.indeterminate = someChecked;
      }
    })
    .catch(error => {
      console.error('Failed to load SPCS zones:', error);
      spcsToggle.innerHTML = `<div class="alert alert-danger">Failed to load SPCS zones: ${error.message}</div>`;
    });
} 