import { latLonToPoint } from '../../src/math/coordinates.js';

describe('Coordinate Conversion', () => {
  test('converts Prime Meridian equator point (0°,0°)', () => {
    const point = latLonToPoint(0, 0, 1);
    expect(point.x).toBeCloseTo(0);     // No east-west displacement at prime meridian
    expect(point.y).toBeCloseTo(0);     // No elevation at equator
    expect(point.z).toBeCloseTo(1);     // Point lies on prime meridian (+Z)
  });
  
  test('handles north pole (90°N)', () => {
    const point = latLonToPoint(90, 0, 1);
    expect(point.x).toBeCloseTo(0);     // No east-west displacement at poles
    expect(point.y).toBeCloseTo(1);     // Maximum elevation at north pole (+Y)
    expect(point.z).toBeCloseTo(0);     // No forward-back displacement at poles
  });
  
  test('handles south pole (90°S)', () => {
    const point = latLonToPoint(-90, 0, 1);
    expect(point.x).toBeCloseTo(0);     // No east-west displacement at poles
    expect(point.y).toBeCloseTo(-1);    // Maximum negative elevation at south pole (-Y)
    expect(point.z).toBeCloseTo(0);     // No forward-back displacement at poles
  });

  test('handles 90° East point on equator', () => {
    const point = latLonToPoint(0, 90, 1);
    expect(point.x).toBeCloseTo(1);     // Maximum eastward displacement (+X)
    expect(point.y).toBeCloseTo(0);     // No elevation at equator
    expect(point.z).toBeCloseTo(0);     // No forward-back displacement at 90°
  });

  test('handles 90° West point on equator', () => {
    const point = latLonToPoint(0, -90, 1);
    expect(point.x).toBeCloseTo(-1);    // Maximum westward displacement (-X)
    expect(point.y).toBeCloseTo(0);     // No elevation at equator
    expect(point.z).toBeCloseTo(0);     // No forward-back displacement at 90°
  });

  test('handles custom radius', () => {
    const point = latLonToPoint(0, 0, 2);
    expect(point.x).toBeCloseTo(0);     // Still on prime meridian
    expect(point.y).toBeCloseTo(0);     // Still on equator
    expect(point.z).toBeCloseTo(2);     // Double distance along prime meridian
  });
}); 