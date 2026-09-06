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
});
