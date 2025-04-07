/**
 * Note: This code requires Three.js >= 0.160.0 as it uses the modular import system
 * and ParametricGeometry from the addons/geometries package.
 */
import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { latLonToPoint } from '../math/coordinates.js';

// Visual configuration for the graticule
const GRATICULE_CONFIG = {
    regularLineColor: 0x444444,
    primaryLineColor: 0x888888,  // equator & prime meridian
    lineWidth: 1,
    latInterval: 15,  // degrees between latitude lines
    lonInterval: 15   // degrees between longitude lines
};

/**
 * Represents a reference ellipsoid (datum) in the 3D scene
 */
export class DatumEllipsoid {
    constructor(scene, params = {}) {
        // Verify Three.js version compatibility
        if (!THREE.REVISION || parseInt(THREE.REVISION) < 160) {
            throw new Error('DatumEllipsoid requires Three.js version 160 or higher. Current version: ' + 
                          (THREE.REVISION || 'unknown'));
        }
        
        this.scene = scene;
        this.a = params.a || 6378137;  // GRS80 semi-major axis (meters)
        this.f = params.f || 1/298.257222101;  // GRS80 flattening
        this.b = this.a * (1 - this.f);  // semi-minor axis

        this.surface = null;
        this.graticule = null;
        
        // Create the ellipsoid surface and graticule
        this.createSurface();
        this.createGraticule();
    }

    createSurface() {
        // Create parametric geometry for the ellipsoid
        const geometry = new ParametricGeometry((u, v, target) => {
            // u goes from 0 to 1 (longitude: 0 to 2π)
            // v goes from 0 to 1 (latitude: -π/2 to π/2)
            const lon = u * 2 * Math.PI;
            const lat = (v - 0.5) * Math.PI;
            
            // Convert to Cartesian coordinates on the ellipsoid
            const cosLat = Math.cos(lat);
            const sinLat = Math.sin(lat);
            const cosLon = Math.cos(lon);
            const sinLon = Math.sin(lon);
            
            // Ellipsoid surface point
            target.x = this.a * cosLat * sinLon;  // toward 90°E
            target.y = this.b * sinLat;           // toward North pole
            target.z = this.a * cosLat * cosLon;  // toward prime meridian
        }, 64, 32);  // resolution: 64 segments around, 32 segments top to bottom

        // Load and apply the Earth texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/assets/earth.jpg', (texture) => {
            // The texture's coordinates need to match our coordinate system
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.offset.x = 0.5;  // Shift by 180° to align prime meridian with +Z
            
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                shininess: 5,
                side: THREE.FrontSide  // Only render front faces
            });

            this.surface = new THREE.Mesh(geometry, material);
            this.scene.add(this.surface);
        });
    }

    createGraticule() {
        const lineGroup = new THREE.Group();
        
        // Create latitude lines
        for (let lat = -90; lat <= 90; lat += GRATICULE_CONFIG.latInterval) {
            const isEquator = lat === 0;
            const linePoints = [];
            
            // Generate points around this parallel
            for (let lon = 0; lon <= 360; lon += 2) {
                const point = latLonToPoint(lat, lon, this.a);
                // Adjust for ellipsoid shape
                point.y *= (this.b / this.a);
                linePoints.push(new THREE.Vector3(point.x, point.y, point.z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
            const material = new THREE.LineBasicMaterial({
                color: isEquator ? GRATICULE_CONFIG.primaryLineColor : GRATICULE_CONFIG.regularLineColor,
                linewidth: GRATICULE_CONFIG.lineWidth,
                transparent: true,
                opacity: 0.5,
                depthTest: false  // Lines will always be visible
            });
            
            const line = new THREE.Line(geometry, material);
            lineGroup.add(line);
        }
        
        // Create longitude lines
        for (let lon = 0; lon < 360; lon += GRATICULE_CONFIG.lonInterval) {
            const isPrimeMeridian = lon === 0;
            const linePoints = [];
            
            // Generate points along this meridian
            for (let lat = -90; lat <= 90; lat += 2) {
                const point = latLonToPoint(lat, lon, this.a);
                // Adjust for ellipsoid shape
                point.y *= (this.b / this.a);
                linePoints.push(new THREE.Vector3(point.x, point.y, point.z));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
            const material = new THREE.LineBasicMaterial({
                color: isPrimeMeridian ? GRATICULE_CONFIG.primaryLineColor : GRATICULE_CONFIG.regularLineColor,
                linewidth: GRATICULE_CONFIG.lineWidth,
                transparent: true,
                opacity: 0.5,
                depthTest: false  // Lines will always be visible
            });
            
            const line = new THREE.Line(geometry, material);
            lineGroup.add(line);
        }

        this.graticule = lineGroup;
        this.scene.add(this.graticule);
    }

    setVisibility(showSurface = true, showGraticule = true) {
        if (this.surface) {
            this.surface.visible = showSurface;
        }
        if (this.graticule) {
            this.graticule.visible = showGraticule;
        }
    }
} 