import { describe, expect, it } from 'vitest';
import { containsRect, fitRect, zoomAt } from '../../src/viewer/viewport';

describe('viewport layout', () => {
  it('centres content and uses the available canvas while preserving aspect ratio', () => {
    expect(fitRect(
      { width: 1000, height: 700 },
      { x: 200, y: 100, width: 300, height: 200 },
      { margin: 50 },
    )).toEqual({ zoom: 3, panX: -550, panY: -250 });
  });

  it('clamps extreme fit scales', () => {
    expect(fitRect({ width: 1000, height: 700 }, { x: 0, y: 0, width: 10, height: 10 }).zoom).toBe(4);
    expect(fitRect({ width: 100, height: 100 }, { x: 0, y: 0, width: 2000, height: 2000 }).zoom).toBe(0.2);
  });

  it('distinguishes internal geometry from crossing and external geometry', () => {
    const focus = { x: 100, y: 100, width: 300, height: 200 };
    expect(containsRect(focus, { x: 120, y: 110, width: 250, height: 180 })).toBe(true);
    expect(containsRect(focus, { x: 50, y: 150, width: 200, height: 10 })).toBe(false);
    expect(containsRect(focus, { x: 450, y: 150, width: 50, height: 10 })).toBe(false);
  });

  it('keeps the pointer position fixed while zooming', () => {
    expect(zoomAt({ zoom: 1, panX: 0, panY: 0 }, 2, { x: 100, y: 50 })).toEqual({ zoom: 2, panX: -100, panY: -50 });
  });
});
