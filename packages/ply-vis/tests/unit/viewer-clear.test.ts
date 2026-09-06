// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

const envelope = (id: string) => ({
  protocolVersion: 1 as const,
  run: { id, completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' as const },
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>',
  elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } },
  diagnostics: [],
});

describe('clearing the drawing', () => {
  // The host says "showing nothing, here is why" and the viewer has no way
  // to hear it: the host sent an `error` message, and `error` is a
  // *viewer-to-host* type, so `isHostResponse` rejected it and the handler
  // never ran. The old drawing stayed on screen with no explanation, which
  // is the worst of both -- the reader is looking at a picture of a run
  // that is no longer the one selected, and nothing says so.
  //
  // Reported and reproduced by external review, 2026-09-06.
  it('replaces the drawing with the reason when the host has nothing to show', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });

    viewer.load(envelope('first'));
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    expect(canvas.dataset.empty).toBe('false');
    expect(canvas.querySelector('svg')).not.toBeNull();

    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'clear',
      message: 'Showing nothing: pick a Ply workspace root.',
    } }));

    expect(canvas.querySelector('svg')).toBeNull();
    expect(canvas.dataset.empty).toBe('true');
    expect(container.textContent).toContain('Showing nothing: pick a Ply workspace root.');
    viewer.destroy();
  });

  // A clear is not a permanent state. The next run has to draw normally,
  // or the panel is dead until the reader closes and reopens it.
  it('draws the next run normally after a clear', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });

    viewer.load(envelope('first'));
    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'clear', message: 'Nothing to show.',
    } }));
    viewer.load(envelope('second'));

    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    expect(canvas.dataset.empty).toBe('false');
    expect(canvas.querySelector('svg')).not.toBeNull();
    expect(container.textContent).not.toContain('Nothing to show.');
    viewer.destroy();
  });
});
