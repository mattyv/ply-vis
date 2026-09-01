// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

describe('viewer framing', () => {
  it('does not carry stale zoom and pan into a different spec', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'restore-state',
      state: { runId: 'old', detailsHidden: true, zoom: 0.2, panX: 300, panY: 200, overlays: { earned: true, gap: true, violation: true } },
    } }));

    viewer.load({
      protocolVersion: 1,
      run: { id: 'new', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50" fill="#fff"/></svg>',
      elements: {}, diagnostics: [],
    });

    expect(viewer.getState()).toMatchObject({ runId: 'new', zoom: 1, panX: 0, panY: 0 });
    viewer.destroy();
  });
});
