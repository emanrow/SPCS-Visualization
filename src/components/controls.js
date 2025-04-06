export function initControls(map, scene, camera) {
  const coordInput = document.getElementById('coord-input');
  const projectBtn = document.getElementById('project-btn');
  const spcsToggle = document.getElementById('spcs-toggle');
  
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
  
  // Load SPCS zones
  fetch('https://opendata.arcgis.com/datasets/23178a639bdc4d658816b3ea8ee6c3ae_0.geojson')
    .then(res => res.json())
    .then(data => {
      // Sort features by zone name
      const sortedFeatures = [...data.features].sort((a, b) => 
        a.properties.ZONENAME.localeCompare(b.properties.ZONENAME)
      );
      
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
      
      // Add zone checkboxes
      sortedFeatures.forEach((feature, idx) => {
        const div = document.createElement('div');
        div.className = 'form-check';
        
        const checkbox = document.createElement('input');
        checkbox.className = 'form-check-input';
        checkbox.type = 'checkbox';
        checkbox.id = `zone-${idx}`;
        
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `zone-${idx}`;
        label.textContent = feature.properties.ZONENAME;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        spcsToggle.appendChild(div);
        
        // TODO: Add zone visualization toggle
      });
    })
    .catch(console.error);
} 