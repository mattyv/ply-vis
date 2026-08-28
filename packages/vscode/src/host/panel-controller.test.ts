import { describe, expect, it } from 'vitest';
import type { LoadState } from '../core/result-source';
import { PanelController, type PanelSurface } from './panel-controller';
import type { Disposable } from './surface';
import { StateStore, type KeyValueState } from './state-store';

class Surface implements PanelSurface {
  public listener: ((message: unknown) => void | Promise<void>) | undefined;
  public messages: unknown[] = [];
  public disposed = false;
  public async postMessage(message: unknown): Promise<boolean> { this.messages.push(message); return true; }
  public onMessage(listener: (message: unknown) => void | Promise<void>): Disposable { this.listener = listener; return { dispose: () => { this.disposed = true; } }; }
}
class MemoryState implements KeyValueState {
  private readonly values = new Map<string, unknown>();
  public get<T>(key: string): T | undefined { return this.values.get(key) as T | undefined; }
  public async update(key: string, value: unknown): Promise<void> { this.values.set(key, value); }
}

describe('panel lifecycle', () => {
  it('restores state and serves the last loaded artifact when the viewer becomes ready', async () => {
    const surface = new Surface(); const state = new StateStore(new MemoryState());
    await state.persistViewState({ selectedId: 'fn' });
    const controller = new PanelController(surface, state, { open: async () => undefined } as never, { error: () => undefined });
    const load = { snapshot: { root: { name: 'r', path: '/r' }, index: { protocolVersion: 1, currentRun: 'one', runs: [] }, entry: { id: 'one', path: 'views/one/visual.json', completedAt: '2026-01-01T00:00:00Z', outcome: 'clean' }, envelope: { protocolVersion: 1, run: { id: 'one', completedAt: '2026-01-01T00:00:00Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: 'b' }, outcome: 'clean' }, svg: '<svg/>', elements: {}, diagnostics: [] } } } satisfies LoadState;
    controller.update({ name: 'r', path: '/r' }, load);
    surface.messages = [];
    await surface.listener?.({ channel: 'ply-vis', version: 1, type: 'ready' });
    expect(surface.messages).toMatchObject([{ type: 'restore-state', state: { selectedId: 'fn' } }, { type: 'artifact' }]);
    controller.dispose(); expect(surface.disposed).toBe(true);
  });
});
