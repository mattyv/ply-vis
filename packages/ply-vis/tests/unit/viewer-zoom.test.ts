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

  it('hides buried detail when zooming out and restores it when zooming in', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
    viewer.load({
      protocolVersion: 1,
      run: { id: 'semantic', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><g data-element-id="component"><g data-element-id="function"><rect width="10" height="10"/></g></g></g></svg>',
      elements: {
        workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence, diagnosticIds: [] },
        component: { id: 'component', kind: 'component', label: 'component', parentId: 'workspace', evidence, diagnosticIds: [] },
        function: { id: 'function', kind: 'fn', label: 'function', parentId: 'component', evidence, diagnosticIds: [] },
      }, diagnostics: [],
    });
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    const fn = container.querySelector('[data-element-id="function"]')!;

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 1000 }));
    expect(fn.hasAttribute('hidden')).toBe(true);
    expect(container.querySelector('[data-element-id="component"]')!.hasAttribute('hidden')).toBe(false);

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -1000 }));
    expect(fn.hasAttribute('hidden')).toBe(false);
    viewer.destroy();
  });
});
