// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

const envelope = (id: string) => ({
  protocolVersion: 1 as const,
  run: { id, completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' as const },
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>',
  elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [], declaration: 'fn only_in_the_first_run()' } },
  diagnostics: [],
});

afterEach(() => {
  document.body.className = '';
  delete document.body.dataset.vscodeThemeKind;
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

  // Clearing the canvas is not clearing the drawing if the envelope that
  // produced it is still held. A theme flip repaints from that retained
  // copy, so the drawing a reader was told they were not being shown comes
  // straight back -- onto a canvas still captioned with the reason it is
  // empty. The reader is then looking at another project's run with an
  // explanation underneath saying they are not.
  //
  // Reported and reproduced by external review, 2026-09-06, on the fix for
  // the clearing bug above.
  it('does not resurrect the cleared drawing when the host flips theme', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });

    viewer.load(envelope('first'));
    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'clear', message: 'Showing nothing: different project.',
    } }));
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    expect(canvas.querySelector('svg')).toBeNull();

    document.body.dataset.vscodeThemeKind = 'vscode-dark';
    document.body.classList.add('vscode-dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(canvas.querySelector('svg')).toBeNull();
    expect(canvas.dataset.empty).toBe('true');
    expect(container.textContent).toContain('Showing nothing: different project.');
    viewer.destroy();
  });

  // The canvas going empty is not the whole panel going empty. The details
  // pane holds the declaration, verdict and evidence of whatever the reader
  // last clicked, and clearing left every word of it on screen beside a
  // caption saying there is nothing to show. Worse than stale: the toggle is
  // hidden at the same moment, so the reader cannot even close the panel that
  // is lying to them.
  //
  // Reported by external review, 2026-09-06.
  it('does not leave the previous run evidence in an open details panel', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });

    viewer.load(envelope('first'));
    container.querySelector<SVGGElement>('[data-element-id="workspace"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const inspector = container.querySelector<HTMLElement>('.ply-inspector')!;
    expect(inspector.hidden).toBe(false);
    expect(inspector.textContent).toContain('fn only_in_the_first_run()');

    window.dispatchEvent(new MessageEvent('message', { data: {
      channel: 'ply-vis', version: 1, type: 'clear', message: 'Showing nothing: different project.',
    } }));

    expect(inspector.textContent).not.toContain('fn only_in_the_first_run()');
    expect(inspector.hidden).toBe(true);
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
