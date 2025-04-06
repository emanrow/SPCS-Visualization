export function initMap(containerId) {
  // Initialize map centered on the US
  const map = L.map(containerId, { zoomControl: false }).setView([39.8283, -98.5795], 4);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  
  return map;
} 