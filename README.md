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

## Project Structure

```
projection-demo/
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── map.js         # Leaflet map initialization
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

### Phase 1: Core Infrastructure (Current)
- [x] Set up project structure
- [x] Configure build system (Vite)
- [x] Set up testing environment
- [x] Implement basic 3D scene setup
- [x] Create basic coordinate conversion utilities
- [x] Display SPCS zones on 2D map
- [x] Support both Polygon and MultiPolygon geometries
- [x] Add robust error handling for zone display

### Phase 2: SPCS Implementation
- [ ] Create SPCS zone parameter database
- [ ] Implement TM projection calculations
- [ ] Implement LCC projection calculations
- [ ] Add scale factor calculations
- [ ] Add convergence angle calculations
- [ ] Write unit tests for all calculations

### Phase 3: Visualization Components
- [ ] Create Earth visualization
- [ ] Implement projection surface visualization (cylinders/cones)
- [ ] Add coordinate transformation visualization
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

## Development Guidelines

1. **Code Organization**:
   - Keep components modular and focused
   - Use ES modules for imports/exports
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

## 2D Map Visualization Functionality

### SPCS Zone Display
When a user toggles an SPCS zone checkbox in the control panel:

1. **Zone Boundary Visualization**:
   - The selected zone's boundary appears on the Leaflet map as a polygon with a distinct border color
   - Each zone has a semi-transparent fill color to distinguish it from other zones
   - Colors are assigned by projection type (blue for Transverse Mercator, orange for Lambert Conformal Conic)

2. **Information Display**:
   - Clicking on a zone polygon displays a popup with key information:
     - Zone name and ID
     - Projection type (TM or LCC)
     - Key parameters (Central Meridian/Longitude of Origin, Latitude of Origin, etc.)
     - Standard parallels for LCC projections

3. **Toggle Functionality**:
   - Individual toggles: Each zone can be independently shown/hidden
   - "Toggle All" checkbox: Controls visibility of all zones simultaneously
   - When a zone is toggled on, it is added to the map immediately
   - When a zone is toggled off, it is removed from the map immediately

4. **Geometry Support**:
   - Handles both simple Polygon geometries and complex MultiPolygon geometries
   - Properly renders zones with multiple disconnected parts
   - Supports zones with missing or undefined parameters 