import { describe, expect, it, vi } from 'vitest';
import { PanelController, type PanelSurface } from './panel-controller';
import type { LoadState, WorkspaceRoot } from '../core/result-source';

const A: WorkspaceRoot = { name: 'alpha', path: '/projects/alpha' };
const B: WorkspaceRoot = { name: 'beta', path: '/projects/beta' };

const snapshotFor = (root: WorkspaceRoot): LoadState => ({
  snapshot: {
    envelope: {
      protocolVersion: 1,
      run: { id: `${root.name}-1`, completedAt: '2026-09-06T00:00:00Z', root: { path: root.path }, tool: { name: 'cargo-ply', version: 'x' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      elements: {},
      diagnostics: [],
    },
  },
} as unknown as LoadState);

function harness() {
  const listeners: ((message: unknown) => void | Promise<void>)[] = [];
  const surface: PanelSurface = {
    postMessage: () => Promise.resolve(true),
    onMessage: (listener) => { listeners.push(listener); return { dispose: () => undefined }; },
  };
  const state = { persistViewState: vi.fn(), viewState: () => ({}) } as never;
  const navigator = { open: vi.fn(() => Promise.resolve()) };
  const reporter = { error: vi.fn() };
  const controller = new PanelController(surface, state, navigator as never, reporter);
  const send = async (message: unknown) => { for (const listener of listeners) await listener(message); };
  return { controller, navigator, reporter, send };
}

const navigateMessage = {
  channel: 'ply-vis', version: 1, type: 'navigate',
  source: { file: 'src/lib.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 },
};

/** The viewer's half of the handshake: "I drew this run."
 *
 *  This surface is a stand-in with no viewer behind it, so nothing sends it
 *  on its own. A real viewer does, on every envelope it accepts, and the
 *  host promotes what it sent to what is displayed only then -- because the
 *  two validate separately and an envelope the host accepts is not one the
 *  viewer drew. Simulating it here is what makes this a test of the host's
 *  behaviour rather than of half a conversation. */
const acceptedMessage = (root: WorkspaceRoot) => ({
  channel: 'ply-vis', version: 1, type: 'artifact-accepted', runId: `${root.name}-1`,
});

describe('changing which project is displayed', () => {
  // Selecting a project that has no completed run used to leave the previous
  // project's drawing on screen while pointing navigation at the new one, so
  // clicking a source link in the drawing you could see opened the same
  // relative path inside a different project.
  it('never opens source in a project other than the one being displayed', async () => {
    const { controller, navigator, send } = harness();
    controller.update(A, snapshotFor(A));
    await send(acceptedMessage(A));
    controller.update(B, {});

    await send(navigateMessage);

    const openedIn = navigator.open.mock.calls.map((call) => (call[0] as WorkspaceRoot).path);
    expect(openedIn).not.toContain(B.path);
  });

  // And the case the acknowledgement exists for: the host sent B's artifact
  // and the viewer never drew it. Navigation must stay with A, which is what
  // the reader can still see.
  it('stays with the drawn project when the viewer never accepted the new one', async () => {
    const { controller, navigator, send } = harness();
    controller.update(A, snapshotFor(A));
    await send(acceptedMessage(A));
    controller.update(B, snapshotFor(B));

    await send(navigateMessage);

    expect(navigator.open.mock.calls.map((call) => (call[0] as WorkspaceRoot).path)).toEqual([A.path]);
  });

  it('opens source in the new project once that project actually has a run', async () => {
    const { controller, navigator, send } = harness();
    controller.update(A, snapshotFor(A));
    await send(acceptedMessage(A));
    controller.update(B, snapshotFor(B));
    await send(acceptedMessage(B));

    await send(navigateMessage);

    expect(navigator.open.mock.calls.map((call) => (call[0] as WorkspaceRoot).path)).toEqual([B.path]);
  });
});
