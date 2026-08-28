import { describe, expect, it } from 'vitest';
import { StateStore, type KeyValueState } from './state-store';

class MemoryState implements KeyValueState {
  public values = new Map<string, unknown>();
  public get<T>(key: string): T | undefined { return this.values.get(key) as T | undefined; }
  public async update(key: string, value: unknown): Promise<void> { this.values.set(key, value); }
}
describe('workspace and viewer state', () => {
  it('persists selected root and opaque viewer state independently', async () => {
    const backing = new MemoryState(); const state = new StateStore(backing);
    await state.selectRoot('/work/b'); await state.persistViewState({ selectedId: 'fn', zoom: 2 });
    expect(new StateStore(backing).selectedRoot()).toBe('/work/b');
    expect(new StateStore(backing).viewState()).toEqual({ selectedId: 'fn', zoom: 2 });
  });
  it('keeps exactly one generation of discovered spec paths', async () => {
    const backing = new MemoryState(); const state = new StateStore(backing);
    await state.rememberSpecs(['/work/a/ply.yaml', '/work/b/ply.yaml']);
    expect(state.rememberedSpecs()).toEqual(['/work/a/ply.yaml', '/work/b/ply.yaml']);
    await state.rememberSpecs(['/work/c/ply.yaml']);
    expect(state.rememberedSpecs()).toEqual(['/work/c/ply.yaml']);
  });
});
