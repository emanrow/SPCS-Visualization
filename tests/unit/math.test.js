import { latLonToPoint } from '../../src/math/coordinates.js';

describe('Coordinate Conversion', () => {
  test('converts lat/lon to 3D point', () => {
    const point = latLonToPoint(0, 0, 1);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(0);
    expect(point.z).toBeCloseTo(1);
  });
  
  test('handles north pole', () => {
    const point = latLonToPoint(90, 0, 1);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(1);
    expect(point.z).toBeCloseTo(0);
  });
  
  test('handles south pole', () => {
    const point = latLonToPoint(-90, 0, 1);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(-1);
    expect(point.z).toBeCloseTo(0);
  });
}); 