/**
 * Unit tests for the star catalog data pipeline.
 * Tests coordinate conversion and vertex data building.
 */

import { describe, expect, it } from 'vitest';

import { buildCatalogVertexData, type CatalogStar } from '@/data/loadCatalog';

/**
 * Helper to create a mock CatalogStar with RA/Dec position.
 */
function mockStar(rarad: number, decrad: number, mag: number, ci = 0.656, hip = 0): CatalogStar {
  const radius = 50;
  const cosDec = Math.cos(decrad);
  return {
    rarad,
    decrad,
    mag,
    ci,
    hip,
    x: radius * cosDec * Math.cos(rarad),
    y: radius * Math.sin(decrad),
    z: radius * cosDec * Math.sin(rarad),
  };
}

describe('RA/Dec → Cartesian conversion', () => {
  it('places north pole along +Y axis', () => {
    const star = mockStar(0, Math.PI / 2, 0);
    expect(star.y).toBeCloseTo(50, 1);
    expect(Math.abs(star.x)).toBeLessThan(0.01);
    expect(Math.abs(star.z)).toBeLessThan(0.01);
  });

  it('places south pole along -Y axis', () => {
    const star = mockStar(0, -Math.PI / 2, 0);
    expect(star.y).toBeCloseTo(-50, 1);
    expect(Math.abs(star.x)).toBeLessThan(0.01);
    expect(Math.abs(star.z)).toBeLessThan(0.01);
  });

  it('RA=0, Dec=0 lies on +X axis', () => {
    const star = mockStar(0, 0, 0);
    expect(star.x).toBeCloseTo(50, 1);
    expect(Math.abs(star.y)).toBeLessThan(0.01);
    expect(Math.abs(star.z)).toBeLessThan(0.01);
  });

  it('RA=π/2, Dec=0 lies on +Z axis', () => {
    const star = mockStar(Math.PI / 2, 0, 0);
    expect(star.z).toBeCloseTo(50, 1);
    expect(Math.abs(star.x)).toBeLessThan(0.01);
    expect(Math.abs(star.y)).toBeLessThan(0.01);
  });

  it('all stars lie on sphere of radius 50', () => {
    const stars = [
      mockStar(0, 0, 3),
      mockStar(1.5, 0.5, 5),
      mockStar(4.0, -0.8, 2),
      mockStar(Math.PI, Math.PI / 4, 1),
    ];
    for (const s of stars) {
      const dist = Math.sqrt(s.x ** 2 + s.y ** 2 + s.z ** 2);
      expect(dist).toBeCloseTo(50, 1);
    }
  });
});

describe('buildCatalogVertexData', () => {
  const testStars: CatalogStar[] = [
    mockStar(0, 0, -1.46, 0.009), // Sirius-like (brightest)
    mockStar(1, 0.3, 0.08, 0.171), // Vega-like
    mockStar(2, -0.5, 2.0, 1.239), // Betelgeuse-like
    mockStar(3, 0.8, 5.5, 0.656), // Sun-like, dim
    mockStar(4, -0.2, 7.0, 0.4), // At mag 7 limit
    mockStar(5, 0.1, 8.0, 0.3), // Beyond typical limit
  ];

  const identityColor = (_ci: number): [number, number, number] => [1, 1, 1];

  it('filters by magnitude limit', () => {
    const { count } = buildCatalogVertexData(testStars, 6.5, 1.0, identityColor);
    // Should include stars with mag -1.46, 0.08, 2.0, 5.5 (4 stars)
    expect(count).toBe(4);
  });

  it('includes all stars at high mag limit', () => {
    const { count } = buildCatalogVertexData(testStars, 10.0, 1.0, identityColor);
    expect(count).toBe(6);
  });

  it('produces 7 floats per star', () => {
    const { data, count } = buildCatalogVertexData(testStars, 6.5, 1.0, identityColor);
    expect(data.length).toBe(count * 7);
  });

  it('brighter stars get larger point sizes', () => {
    const { data } = buildCatalogVertexData(testStars, 6.5, 1.0, identityColor);
    // First star (mag -1.46) should have larger size than second (mag 0.08)
    const size0 = data[3]; // offset 3 = size
    const size1 = data[10]; // 7 + 3 = offset of second star's size
    expect(size0).toBeGreaterThan(size1);
  });

  it('applies sizeScale multiplier', () => {
    const { data: d1 } = buildCatalogVertexData(testStars, 6.5, 1.0, identityColor);
    const { data: d2 } = buildCatalogVertexData(testStars, 6.5, 2.0, identityColor);
    // Second run with 2x scale should have ~2x sizes
    const size1 = d1[3];
    const size2 = d2[3];
    expect(size2 / size1).toBeCloseTo(2.0, 1);
  });

  it('applies color function to each star', () => {
    const redColor = (_ci: number): [number, number, number] => [1, 0, 0];
    const { data } = buildCatalogVertexData(testStars, 6.5, 1.0, redColor);
    // Check first star's color (offsets 4, 5, 6)
    expect(data[4]).toBe(1);
    expect(data[5]).toBe(0);
    expect(data[6]).toBe(0);
  });
});
