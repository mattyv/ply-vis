import { describe, expect, it } from 'vitest';
import { isHostResponse } from '../../src/host/messages';

describe('host protocol', () => {
  it('accepts only the named v1 response channel', () => {
    const state = { zoom: 1, panX: 0, panY: 0, overlays: { earned: true, gap: true, violation: true } };
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state })).toBe(true);
    expect(isHostResponse({ channel: 'ply-vis', version: 2, type: 'restore-state', state })).toBe(false);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { zoom: 'bad' } })).toBe(false);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'verify' })).toBe(false);
  });

  it('accepts persisted state saved before optional display settings existed, and rejects fields of the wrong type', () => {
    const state = { zoom: 1, panX: 0, panY: 0, overlays: { earned: true, gap: true, violation: true } };
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state })).toBe(true);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { ...state, hoverTooltips: false } })).toBe(true);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { ...state, hoverTooltips: 'nope' } })).toBe(false);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { ...state, legendVisible: true } })).toBe(true);
    expect(isHostResponse({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { ...state, legendVisible: 'yes' } })).toBe(false);
  });
});
