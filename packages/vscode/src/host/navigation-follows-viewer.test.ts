// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '@ply/vis';
import type { LoadState, WorkspaceRoot } from '../core/result-source';
import { PanelController, type PanelSurface } from './panel-controller';
import type { Disposable } from './surface';
import { StateStore, type KeyValueState } from './state-store';

/**
 * A surface wired to a *real* viewer, so the host's idea of what is on
 * screen is tested against what actually got there.
 *
 * The two have separate validators, and that is the whole defect: the host
 * accepts an envelope, records it as displayed, and the viewer rejects it
 * and keeps the previous drawing. Only running both can catch that; a test
 * against a fake surface sees the host's opinion twice.
 */
class WiredSurface implements PanelSurface {
  public listener: ((message: unknown) => void | Promise<void>) | undefined;
  public disposed = false;
  public constructor(private readonly window: Window) {}
  public async postMessage(message: unknown): Promise<boolean> {
    this.window.dispatchEvent(new MessageEvent('message', { data: message }));
    return true;
  }
  public onMessage(listener: (message: unknown) => void | Promise<void>): Disposable {
    this.listener = listener;
    return { dispose: () => { this.disposed = true; } };
  }
}
class MemoryState implements KeyValueState {
  private readonly values = new Map<string, unknown>();
  public get<T>(key: string): T | undefined { return this.values.get(key) as T | undefined; }
  public async update(key: string, value: unknown): Promise<void> { this.values.set(key, value); }
}

const good = (id: string): LoadState => ({
  snapshot: {
    envelope: {
      protocolVersion: 1,
      run: { id, completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>',
      elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } },
      diagnostics: [],
    },
  },
} as unknown as LoadState);

/** Accepted by the host's parser, rejected by the viewer's: an edge whose
 *  endpoint names no element. */
const danglingEdge = (id: string): LoadState => {
  const state = good(id) as { snapshot: { envelope: Record<string, unknown> } };
  state.snapshot.envelope.edges = [{ id: 'e1', fromId: 'workspace', toId: 'nowhere' }];
  return state as unknown as LoadState;
};

/** A project with no completed run: nothing to draw. */
const empty = (): LoadState => ({} as unknown as LoadState);

describe('navigation follows what the viewer accepted', () => {
  // Load project A. Then select project B, whose artifact the host accepts
  // and the viewer rejects. The reader is still looking at A's drawing --
  // and before this fix, clicking a source link in it opened the same
  // relative path inside B.
  //
  // Reported and reproduced by external review, 2026-09-06, on the fix that
  // introduced `displayedRoot` for exactly this class of bug. That fix bound
  // navigation to what the host *sent* rather than to what arrived.
  it('does not follow a root whose artifact the viewer refused', async () => {
    const opened: WorkspaceRoot[] = [];
    const surface = new WiredSurface(window);
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { void surface.listener?.(message); } });

    const controller = new PanelController(
      surface,
      new StateStore(new MemoryState()),
      { open: async (root: WorkspaceRoot) => { opened.push(root); } } as never,
      { error: () => undefined },
    );

    const a: WorkspaceRoot = { name: 'a', path: '/a' };
    const b: WorkspaceRoot = { name: 'b', path: '/b' };
    controller.update(a, good('a'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.update(b, danglingEdge('b'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await surface.listener?.({
      channel: 'ply-vis', version: 1, type: 'navigate',
      source: { file: 'src/lib.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
    });

    expect(opened.map((root) => root.path)).toEqual(['/a']);
    controller.dispose();
    viewer.destroy();
  });

  /**
   * The same defect one step further out. The fix above remembered *one*
   * artifact awaiting the viewer's acknowledgement, so a second load posted
   * before the first was acknowledged overwrote the first's identity -- and
   * when the acknowledgement for the first arrived, its run id matched
   * nothing and the promotion never happened.
   *
   * The reader ends up looking at A having never left C behind, so a source
   * link in A's drawing opens the same relative path inside C: a file from a
   * project two switches ago.
   *
   * Reported and reproduced by external review, 2026-09-06, on the fix for
   * the case above. Acknowledgements are not guaranteed to arrive before the
   * next load is posted, and one slot assumed they were.
   */
  it('does not lose an artifact whose acknowledgement is overtaken by the next load', async () => {
    const opened: WorkspaceRoot[] = [];
    // Host-to-viewer deliveries are held until the test releases them, so
    // two loads can be in flight at once -- which a synchronous surface can
    // never arrange, and which is the whole of this bug.
    const held: unknown[] = [];
    const surface = new (class extends WiredSurface {
      public override async postMessage(message: unknown): Promise<boolean> { held.push(message); return true; }
    })(window);
    const release = () => { const next = held.shift(); if (next !== undefined) window.dispatchEvent(new MessageEvent('message', { data: next })); };

    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { void surface.listener?.(message); } });
    const controller = new PanelController(
      surface,
      new StateStore(new MemoryState()),
      { open: async (root: WorkspaceRoot) => { opened.push(root); } } as never,
      { error: () => undefined },
    );

    const c: WorkspaceRoot = { name: 'c', path: '/c' };
    const a: WorkspaceRoot = { name: 'a', path: '/a' };
    const b: WorkspaceRoot = { name: 'b', path: '/b' };

    controller.update(c, good('c'));
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Both posted before either is acknowledged.
    controller.update(a, good('a'));
    controller.update(b, danglingEdge('b'));
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));

    await surface.listener?.({
      channel: 'ply-vis', version: 1, type: 'navigate',
      source: { file: 'src/lib.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
    });

    expect(opened.map((root) => root.path)).toEqual(
      ['/a'],
      'the viewer accepted A and refused B, so A is what the reader sees and A is where a \
source link must land -- opening C is a file from a project two switches ago',
    );
    controller.dispose();
    viewer.destroy();
  });

  /**
   * A run id names a *run*, not a delivery, and two deliveries can carry the
   * same one: copies of one project's artifacts placed in two workspaces,
   * with one copy damaged. The host matched acknowledgements on the run id,
   * found the first entry carrying it -- the refused delivery -- and bound
   * navigation to that project. The reader is looking at B and a source
   * link opens A.
   *
   * Reported and reproduced by external review, 2026-09-06. Fixed by giving
   * each delivery its own id, which the viewer echoes back.
   */
  it('tells two deliveries of the same run apart', async () => {
    const opened: WorkspaceRoot[] = [];
    const surface = new WiredSurface(window);
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { void surface.listener?.(message); } });
    const controller = new PanelController(
      surface,
      new StateStore(new MemoryState()),
      { open: async (root: WorkspaceRoot) => { opened.push(root); } } as never,
      { error: () => undefined },
    );

    const a: WorkspaceRoot = { name: 'a', path: '/a' };
    const b: WorkspaceRoot = { name: 'b', path: '/b' };
    // The same run id in both, one damaged: A's copy is refused, B's is drawn.
    controller.update(a, danglingEdge('shared'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.update(b, good('shared'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    await surface.listener?.({
      channel: 'ply-vis', version: 1, type: 'navigate',
      source: { file: 'src/lib.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
    });

    expect(opened.map((root) => root.path)).toEqual(['/b']);
    controller.dispose();
    viewer.destroy();
  });

  /**
   * Selecting a project with no run is supposed to clear the drawing rather
   * than leave another project's up. That decision was made from what the
   * viewer had *acknowledged*, so during the gap before the first
   * acknowledgement arrives it saw nothing displayed and stayed silent --
   * and the artifact already in flight then arrived and drew itself, under
   * the name of a project that has no run at all.
   *
   * The reader ends up looking at A's drawing with B selected and nothing
   * saying so: the exact state the clear exists to prevent, reached by
   * being early rather than by being wrong.
   *
   * Reported and reproduced by external review, 2026-09-06.
   */
  it('clears a drawing still in flight when an empty project is selected', async () => {
    const held: unknown[] = [];
    const surface = new (class extends WiredSurface {
      public override async postMessage(message: unknown): Promise<boolean> { held.push(message); return true; }
    })(window);
    const releaseAll = () => {
      while (held.length > 0) window.dispatchEvent(new MessageEvent('message', { data: held.shift() }));
    };

    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (message) => { void surface.listener?.(message); } });
    const controller = new PanelController(
      surface,
      new StateStore(new MemoryState()),
      { open: async () => undefined } as never,
      { error: () => undefined },
    );

    const a: WorkspaceRoot = { name: 'a', path: '/a' };
    const b: WorkspaceRoot = { name: 'b', path: '/b' };

    // A's artifact is sent but not yet delivered, so nothing is displayed
    // and nothing is acknowledged when B is selected.
    controller.update(a, good('a'));
    controller.update(b, empty());
    releaseAll();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    expect(
      canvas.dataset.empty,
      'B has no run, so B must not be represented by A\'s drawing -- and the reader must be '
        + 'told that is why the canvas is empty',
    ).toBe('true');
    expect(container.textContent).toContain('No completed Ply run for b');
    controller.dispose();
    viewer.destroy();
  });
});
