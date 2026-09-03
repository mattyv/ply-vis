// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

describe('viewer reopen', () => {
  it('clears saved focus and framing even when reopening the same run', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'restore-state',
      state: { runId: 'same', selectedId: 'workspace', focusedId: 'workspace', detailsHidden: false, zoom: 0.2, panX: 300, panY: 200, overlays: { earned: true, gap: true, violation: true } },
    } }));
    viewer.load({
      protocolVersion: 1,
      run: { id: 'same', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>',
      elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } }, diagnostics: [],
    });

    expect(viewer.getState()).toMatchObject({ runId: 'same', selectedId: undefined, focusedId: undefined, detailsHidden: true, zoom: 1, panX: 0, panY: 0 });
    viewer.destroy();
  });

  it('turns hover tooltips on when restoring state saved before that setting existed', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    // No `hoverTooltips` key at all -- the shape persisted before this setting
    // was added. Missing must land ON, the same as a first-ever open, not OFF.
    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'restore-state',
      state: { runId: 'old', selectedId: undefined, focusedId: undefined, detailsHidden: true, zoom: 1, panX: 0, panY: 0, overlays: { earned: true, gap: true, violation: true } },
    } }));

    expect(viewer.getState().hoverTooltips).toBe(true);
    expect(container.querySelector<HTMLInputElement>('[data-hover-tooltips]')!.checked).toBe(true);
    viewer.destroy();
  });
});
