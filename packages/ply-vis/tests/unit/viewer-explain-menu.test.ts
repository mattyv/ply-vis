// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// A code like `W0532` means nothing on sight, and the inspector prints it
// with no way to ask what it is. The viewer already has a right-click menu
// for zooming, so the question goes there: right-click the box a finding is
// on, and the menu offers to explain it. The explaining itself is the CLI's
// job -- the viewer only says which code was asked about.
const envelope = (diagnosticIds: readonly string[]) => ({
  protocolVersion: 1 as const,
  run: {
    id: '1', completedAt: '2026-09-06T00:00:00Z',
    root: { path: '.' }, tool: { name: 'cargo-ply', version: 'x' },
    outcome: 'violation' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="a"><rect width="10" height="10"/></g></svg>',
  elements: {
    a: { id: 'a', kind: 'component' as const, label: 'Ledger', evidence: { verdict: 'violation', statuses: [], reused: false }, diagnosticIds },
  },
  diagnostics: [
    { id: 'd1', code: 'W0532', severity: 'warning' as const, message: 'first' },
    { id: 'd2', code: 'P0502', severity: 'error' as const, message: 'second' },
  ],
});

// The host announces what it can do; these tests are about a host that can
// explain. A host that cannot is covered by viewer-explain-capability.test.ts.
const announceExplain = () => window.dispatchEvent(new MessageEvent('message', {
  data: { channel: 'ply-vis', version: 1, type: 'capabilities', explain: true },
}));

const openMenuOn = (container: HTMLElement) => {
  container.querySelector<SVGElement>('[data-element-id="a"]')!
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  return [...container.querySelectorAll<HTMLButtonElement>('.ply-context-menu button')];
};

describe('explaining a finding from the right-click menu', () => {
  it('offers one entry per code reported on the item, naming the code', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(envelope(['d1', 'd2']));
    announceExplain();

    const labels = openMenuOn(container).map((button) => button.textContent);
    expect(labels).toContain('Explain W0532');
    expect(labels).toContain('Explain P0502');
    // The zoom entry it already had must survive alongside them.
    expect(labels).toContain('Zoom into Ledger');
    viewer.destroy();
  });

  it('asks the host to explain the code that was clicked, and nothing else', () => {
    const posted: unknown[] = [];
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { posted.push(message); } });
    viewer.load(envelope(['d1', 'd2']));
    announceExplain();

    openMenuOn(container).find((button) => button.textContent === 'Explain P0502')!.click();

    expect(posted.filter((message) => (message as { type?: string }).type === 'explain')).toEqual([
      { channel: 'ply-vis', version: 1, type: 'explain', code: 'P0502' },
    ]);
    viewer.destroy();
  });

  // The unconditional "Explain a code…" entry is always there; what must not
  // appear is a per-code entry for a finding this item never reported.
  it('names no specific code on an item that reported no findings', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(envelope([]));
    announceExplain();

    const labels = openMenuOn(container).map((button) => button.textContent);
    expect(labels.filter((label) => /^Explain [A-Z][0-9]{4}$/.test(label ?? ''))).toEqual([]);
    expect(labels).toContain('Explain a code…');
    viewer.destroy();
  });
});

describe('the menu always offers a way in', () => {
  // Right-clicking used to open nothing at all when an item had no zoom and
  // no findings -- which is what happens on a finding's own line, and on any
  // item at all when the run carried no diagnostics. Silence reads as a
  // broken menu, and there is no way to tell it from one.
  const bare = {
    protocolVersion: 1 as const,
    run: {
      id: '1', completedAt: '2026-09-06T00:00:00Z',
      root: { path: '.' }, tool: { name: 'cargo-ply', version: 'x' },
      outcome: 'missing_evidence' as const,
    },
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-ply-id="edge-1"><line x1="0" y1="0" x2="9" y2="9"/></g></svg>',
    elements: {},
    diagnostics: [],
  };

  it('opens on an item that has nothing to zoom into or explain', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(bare);
    announceExplain();

    const labels = openMenuOn2(container, 'edge-1');
    expect(labels).toContain('Explain a code…');
    viewer.destroy();
  });

  it('asks the host to prompt for a code when that entry is chosen', () => {
    const posted: unknown[] = [];
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { posted.push(message); } });
    viewer.load(bare);
    announceExplain();

    const buttons = [...container.querySelectorAll<HTMLButtonElement>('.ply-context-menu button')];
    container.querySelector<SVGElement>('[data-ply-id="edge-1"]')!
      .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    [...container.querySelectorAll<HTMLButtonElement>('.ply-context-menu button')]
      .find((button) => button.textContent === 'Explain a code…')!.click();
    void buttons;

    expect(posted.filter((message) => (message as { type?: string }).type === 'explain-prompt')).toEqual([
      { channel: 'ply-vis', version: 1, type: 'explain-prompt' },
    ]);
    viewer.destroy();
  });
});

function openMenuOn2(container: HTMLElement, plyId: string): (string | null)[] {
  container.querySelector<SVGElement>(`[data-ply-id="${plyId}"]`)!
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  return [...container.querySelectorAll<HTMLButtonElement>('.ply-context-menu button')].map((button) => button.textContent);
}
