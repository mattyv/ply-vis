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

  it('hides a tooltip left open from hovering when the toolbar zoom buttons are used', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: { id: 'zoom-hides-tooltip', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="fn"><title>Some details</title><rect width="10" height="10"/></g></svg>',
      elements: {}, diagnostics: [],
    });
    const node = container.querySelector<SVGElement>('[data-element-id="fn"]')!;
    const tooltip = container.querySelector<HTMLElement>('.ply-tooltip')!;
    // focusin shows the tooltip immediately, with no hover delay to fake.
    node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(tooltip.hidden).toBe(false);

    container.querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!.click();

    expect(viewer.getState().zoom).toBeGreaterThan(1);
    expect(tooltip.hidden).toBe(true);
    viewer.destroy();
  });
});

describe('persistent provenance', () => {
  // A real declaration-only render's `tool.version` is the CLI's own build
  // version (e.g. "0.1.0") -- never the literal string "render". Using that
  // literal as the signal, as the code used to, means this case never fires
  // outside a test fixture. What is actually true for every render, and
  // untrue the moment a real check has run, is that no element carries
  // earned/gap/violation evidence -- so that is what provenance keys off.
  function declaredOnlyEnvelope() {
    const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
    return {
      protocolVersion: 1,
      run: { id: 'declared-run', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: '0.1.0' }, outcome: 'missing_evidence' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><rect width="10" height="10"/></g></svg>',
      elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence, diagnosticIds: [] } },
      diagnostics: [],
    };
  }

  function publishedRunEnvelope() {
    return {
      protocolVersion: 1,
      run: { id: '1788395523-974148000-28612', completedAt: '2026-09-04T13:18:13Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: '0.1.0' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><rect width="10" height="10"/></g></svg>',
      elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence: { verdict: 'fuzzed(64)', statuses: [], reused: false, state: 'earned' }, diagnosticIds: [] } },
      diagnostics: [],
    };
  }

  function provenanceOf(container: HTMLElement) {
    return container.querySelector<HTMLElement>('.ply-provenance')!;
  }

  it('tells the reader a declaration-only render is promises only, with nothing ever green', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(declaredOnlyEnvelope());

    expect(provenanceOf(container).textContent).toBe('Promises only — no run has checked this yet, so nothing here can ever be green.');
    viewer.destroy();
  });

  it('names a published run by when it finished, keeping the run id reachable as a title', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    const envelope = publishedRunEnvelope();
    viewer.load(envelope);

    const when = new Date(envelope.run.completedAt).toLocaleString();
    expect(provenanceOf(container).textContent).toBe(`Showing a run completed ${when}.`);
    expect(provenanceOf(container).title).toBe(`Run ${envelope.run.id}`);
    viewer.destroy();
  });

  it('does not let zooming change or clear the provenance line', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(publishedRunEnvelope());
    const before = provenanceOf(container).textContent;

    container.querySelector<HTMLElement>('.ply-canvas')!.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }));

    expect(provenanceOf(container).textContent).toBe(before);
    expect(container.querySelector('.ply-status')!.textContent).toMatch(/^Zoom \d+%$/);
    viewer.destroy();
  });

  it('does not let fitting the canvas change or clear the provenance line', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(publishedRunEnvelope());
    const before = provenanceOf(container).textContent;

    container.querySelector<HTMLButtonElement>('[aria-label="Fit canvas"]')!.click();

    expect(provenanceOf(container).textContent).toBe(before);
    expect(container.querySelector('.ply-status')!.textContent).toBe('Canvas fitted');
    viewer.destroy();
  });

  it('does not let focusing an element change or clear the provenance line', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
    viewer.load({
      protocolVersion: 1,
      run: { id: 'focus-run', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: '0.1.0' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><g data-element-id="component"><rect width="10" height="10"/></g></g></svg>',
      elements: {
        workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence: { verdict: 'fuzzed(64)', statuses: [], reused: false, state: 'earned' }, diagnosticIds: [] },
        component: { id: 'component', kind: 'component', label: 'component', parentId: 'workspace', evidence, diagnosticIds: [] },
      },
      diagnostics: [],
    });
    const before = provenanceOf(container).textContent;

    container.querySelector('[data-element-id="component"]')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(provenanceOf(container).textContent).toBe(before);
    viewer.destroy();
  });

  it('shows a rejected-artifact error in the status area without touching the provenance line', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(publishedRunEnvelope());
    const before = provenanceOf(container).textContent;

    const accepted = viewer.load({ not: 'a valid envelope' });

    expect(accepted).toBe(false);
    expect(container.querySelector('.ply-status')!.textContent).toMatch(/^Artifact rejected:/);
    expect(provenanceOf(container).textContent).toBe(before);
    viewer.destroy();
  });
});
