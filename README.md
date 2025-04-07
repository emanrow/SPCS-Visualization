# SPCS Visualization Project

A web-based visualization tool for State Plane Coordinate System (SPCS) zones, their coordinate systems, and projection errors. This project provides both 2D and 3D visualizations of SPCS zones, allowing users to understand the relationship between geographic coordinates and their projections in different SPCS zones.

## Project Goals

1. Create a visualization of SPCS zones and their coordinate systems
2. Create a visualization showing how points on the reference ellipsoid (defined by the datum) are transformed through either:
   - Transverse Mercator projection (cylinder tangent to a meridian)
   - Lambert Conformal Conic projection (cone intersecting the ellipsoid at two parallels)
3. Create a visualization of the distortion effects (scale factor variations and convergence angles) across each zone

## SPCS Background

SPCS is built on three fundamental components:

1. **Datum and Reference Ellipsoid**
   - NAD27 uses the Clarke 1866 ellipsoid
   - NAD83 uses the GRS80 ellipsoid
   - The ellipsoid defines the reference surface for all calculations

2. **Projection Types**
   - Transverse Mercator (TM): Uses a cylinder tangent to a meridian
   - Lambert Conformal Conic (LCC): Uses a cone intersecting the ellipsoid at two parallels

3. **Zone Parameters**
   - Central Meridian (TM) or Longitude of Origin (LCC)
   - Latitude of Origin
   - Scale Factor at Origin
   - False Easting/Northing
   - Standard Parallels (LCC only)

The visualization should help users understand:
- How points on the reference ellipsoid are transformed to grid coordinates
- The geometric relationship between the ellipsoid and projection surface
- Scale factor variations across the zone
- Convergence angle (difference between true north and grid north)
- How different datums affect the same geographic location

## SPCS Zone Parameter Sources

For the implementation of SPCS zones and their projections, we need accurate parameters for each zone. The following resources provide official parameters:

1. **NOAA National Geodetic Survey Documentation**:
   - [NOAA Manual NOS NGS 5: State Plane Coordinate System of 1983](https://geodesy.noaa.gov/library/pdfs/NOAA_Manual_NOS_NGS_0005.pdf) - Comprehensive manual on SPCS83
   - [NOS NGS 13: The State Plane Coordinate System (Appendices)](https://geodesy.noaa.gov/library/pdfs/SP_NOS_NGS_13.pdf) - Contains complete tables of parameters for NAD 1983 and 1927 in the appendices

2. **EPSG Database**:
   - [EPSG.io](https://epsg.io/) - Searchable database of coordinate reference systems
   - Contains definitions for SPCS zones with projection parameters

3. **Proj4js Library**:
   - [Proj4js GitHub](https://github.com/proj4js/proj4js) - JavaScript library for coordinate transformations
   - Supports Transverse Mercator and Lambert Conformal Conic projections

For our implementation, we will primarily use the NOAA documentation as the authoritative source for zone parameters.

## SPCS Zone Parameters Database

This project includes a comprehensive JSON database (`src/math/spcsZoneParameters.json`) containing parameters for all 125 zones of the State Plane Coordinate System:

### Database Features

- **Complete Coverage**: Contains all 125 SPCS zones defined for NAD83 and selected NAD27 zones
- **Official Parameters**: Based on NOAA NGS documentation (NOS NGS 13)
- **Reference System**: All NAD83 projections are defined with respect to the Geodetic Reference System of 1980 (GRS 80) ellipsoid:
  - Semi-major axis = 6,378,137 meters (exact)
  - Inverse geometric flattening 1/f = 298.257222101 (derived)
- **Data Format**:
  - Coordinates stored in DDMMSS format (e.g., "85 50 W" for longitude)
  - Scale factors stored as integer denominators for maximum precision
  - False easting/northing values in meters or US survey feet
- **Projection Types**:
  - Transverse Mercator (TM)
  - Lambert Conformal Conic (LCC)
  - Oblique Mercator (OM) - used for Alaska Zone 1 only
- **Organization**:
  - Zones identified by FIPS codes
  - Grouped by datum (NAD83 and NAD27)
  - Includes metadata with source information

### Access and Usage

The database can be imported and used for:
- Accurate coordinate transformations between geographic and SPCS grid coordinates
- Visualization of projection surfaces (cylinders, cones)
- Analysis of scale factors and distortion patterns across zones
- Historical comparisons between NAD27 and NAD83 projections

## Tech Stack

- Frontend:
  - Three.js for 3D visualization
  - Leaflet for 2D map visualization
  - Bootstrap for UI components
- Build Tools:
  - Vite for development and building
  - Babel for JavaScript transpilation
- Testing:
  - Jest for unit testing
  - API Surface Validation testing

## Dependencies and Version Requirements

- Three.js >= 0.160.0
  - Uses ES modules import system
  - Requires explicit imports from `three/addons/` for certain geometries
  - Import map configured in index.html for module resolution
- Leaflet 1.9.4
- Bootstrap 5.3.2

## Project Structure

```
projection-demo/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── map.js         # Leaflet map initialization
│   │   ├── mapUtils.js    # Map utility functions
│   │   └── controls.js    # UI control handlers
│   ├── math/              # Mathematical utilities
│   │   ├── coordinates.js # Coordinate conversion functions
│   │   ├── projections.js # Projection calculations
│   │   └── spcs.js        # SPCS zone parameters
│   ├── visualization/     # Visualization logic
│   │   ├── scene.js       # Three.js scene setup
│   │   ├── earth.js       # Earth visualization
│   │   └── zones.js       # SPCS zone visualization
│   └── index.js          # Main entry point
├── tests/
│   ├── unit/             # Unit tests
│   │   ├── math/         # Math utility tests
│   │   ├── api.test.js   # API surface validation tests 
│   │   ├── mapUtils.test.js # Map utility tests
│   │   └── spcs.test.js  # SPCS data handling tests
│   └── integration/      # Integration tests
├── public/
│   └── assets/           # Static assets (images, etc.)
├── package.json
├── vite.config.js
├── .babelrc
└── README.md
```

## Coordinate System Notes

- Three.js uses a right-handed coordinate system where:
  - +X points right (east)
  - +Y points up (north)
  - +Z points out of the screen (towards viewer)
- For geographic coordinates:
  - Longitude 0° aligns with +Z axis
  - Longitude 90°E aligns with +X axis
  - North pole aligns with +Y axis

## Three.js Implementation Notes

### Datum Ellipsoid Visualization
- Uses `ParametricGeometry` from Three.js addons (requires version >= 0.160.0)
- Earth texture is aligned so that:
  - Prime Meridian (0° longitude) aligns with +Z axis
  - 90°E aligns with +X axis
  - North Pole points to +Y axis
- Graticule lines are rendered with:
  - `depthTest: false` to ensure visibility at all zoom levels
  - Semi-transparent (opacity: 0.5) to prevent visual clutter
  - Primary lines (Equator, Prime Meridian) in lighter color

### Camera and Controls
- Camera positioned initially at ~4x Earth radius
- OrbitControls configured for Earth-scale navigation:
  - Minimum distance: 1.1x Earth radius
  - Maximum distance: 8x Earth radius
  - Damping enabled for smooth movement
- Uses adjusted near/far planes for Earth-scale rendering

### Required Three.js Imports
```javascript
// In index.html importmap
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}

// In your modules
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

4. Build for production:
```bash
npm run build
```

## Implementation Plan

### Phase 1: Core Infrastructure (Complete)
- [x] Set up project structure
- [x] Configure build system (Vite)
- [x] Set up testing environment
- [x] Implement basic 3D scene setup
- [x] Create basic coordinate conversion utilities
- [x] Display SPCS zones on 2D map
- [x] Support both Polygon and MultiPolygon geometries
- [x] Add robust error handling for zone display
- [x] Fix zone information display in popups with actual API data
- [x] Add auto-zoom to selected zone(s) feature

### Phase 2: SPCS Zone 3D Visualization (Current)
- [x] Create SPCS zone parameter database using NOAA official documentation
- [x] Extract zone parameters from NOS NGS 13 appendices for both NAD83 and NAD27
- [x] Implement datum ellipsoid visualization with graticule
- [ ] Implement TM projection coordinate system geometry
- [ ] Implement LCC projection coordinate system geometry
- [ ] Add coordinate system axes and labels for each SPCS zone
- [ ] Implement zone selection sync between 2D and 3D views
- [ ] Write unit tests for coordinate system calculations
- [ ] Add visual tests for geometry alignment

### Phase 3: Advanced Visualization Features (Future)
- [ ] Show SPCS zone boundaries on datum ellipsoid
- [ ] Show zone boundaries on their respective coordinate planes
- [ ] Implement coordinate transformation visualization
  - [ ] Add pins/rays from datum surface through coordinate systems
  - [ ] Show transformation path animations
- [ ] Add scale factor visualization
- [ ] Add convergence angle visualization
- [ ] Write unit tests for visualization components

### Phase 4: UI/UX
- [ ] Design and implement control panel
- [ ] Add zone selection interface
- [ ] Create coordinate input system
- [ ] Implement camera controls
- [ ] Add visualization toggles
- [ ] Write integration tests for UI components

### Phase 5: Documentation & Examples
- [ ] Document API and usage
- [ ] Add examples and tutorials
- [ ] Create visual regression tests
- [ ] Add performance benchmarks

## Testing Strategy

The project follows a pragmatic testing approach:

1. **Unit Tests**: 
   - Test mathematical functions
   - Verify SPCS zone data processing
   - Test coordinate transformations
   - Test map utility functions

2. **API Surface Validation Tests**:
   - Verify that methods we use on external libraries actually exist
   - Ensure consistent API usage
   - Prevent runtime errors from calling non-existent methods
   - Test different parameter types (e.g., MultiPolygon vs Polygon)

3. **Manual Testing**:
   - Visual verification of zone display
   - UI interaction testing
   - Overall system integration

This balanced approach focuses testing efforts on the core mathematical components while keeping UI testing manageable.

## 2D Map Features

### SPCS Zone Display
When a user toggles an SPCS zone checkbox in the control panel:

1. **Zone Boundary Visualization**:
   - The selected zone's boundary appears on the Leaflet map as a polygon with a distinct border color
   - Each zone has a semi-transparent fill color to distinguish it from other zones
   - Colors are assigned based on the zone's COLORMAP property from the API data, with a consistent color scheme
   - Fallback colors are assigned by projection type when COLORMAP is unavailable

2. **Information Display**:
   - Clicking on a zone polygon displays a popup with detailed information:
     - Zone name (from ZONENAME property)
     - Zone Code (from ZONE property)
     - FIPS Zone code (from FIPSZONE property)
     - Object ID (from OBJECTID property)
     - Area in square miles (from SQMI property)
     - Projection type (if available)
     - Other SPCS parameters when available (Central Meridian, Latitude of Origin, etc.)

3. **Toggle Functionality**:
   - Individual toggles: Each zone can be independently shown/hidden
   - "Toggle All" checkbox: Controls visibility of all zones simultaneously
   - When a zone is toggled on, it is added to the map immediately
   - When a zone is toggled off, it is removed from the map immediately

4. **Auto-Zoom Functionality**:
   - When zones are selected, the map automatically zooms to show all selected zones
   - When multiple zones are selected, the map shows all selected zones within view
   - When zones are deselected, the map adjusts to show only the remaining selected zones
   - When no zones are selected, the map returns to the default view of the entire US

### Geometry Support
   - Handles both simple Polygon geometries and complex MultiPolygon geometries
   - Properly renders zones with multiple disconnected parts
   - Calculates correct bounds for both geometry types
   - Gracefully handles zones with missing or undefined parameters

## Development Guidelines

1. **Code Organization**:
   - Keep components modular and focused
   - Extract reusable functionality into separate modules
   - Use proper unit testing for all functionality
   - Follow Three.js coordinate system conventions
   - Document all public APIs

2. **Testing**:
   - Focus tests on core mathematical functions
   - Use API surface validation to prevent runtime errors
   - Add tests for edge cases (e.g., MultiPolygon geometries)
   - Be practical about UI testing (avoid complex mocking)

3. **Performance**:
   - Optimize 3D rendering
   - Use efficient data structures
   - Implement proper cleanup
   - Profile complex calculations

4. **Documentation**:
   - Document all public APIs
   - Include usage examples
   - Keep README up to date
   - Add inline comments for complex calculations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Implement features
5. Submit a pull request

## License

MIT License 