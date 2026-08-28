import { describe, expect, it } from 'vitest';
import { SourceNavigator, type ExactEditorTarget } from './source-navigation';
describe('exact source navigation', () => {
  it('passes the artifact range unchanged to the editor seam', async () => {
    let opened: ExactEditorTarget | undefined;
    const navigator = new SourceNavigator({ openExact: async (target) => { opened = target; } });
    await navigator.open({ name: 'root', path: '/work/root' }, { file: 'src/lib.rs', startLine: 6, startColumn: 2, endLine: 8, endColumn: 4 });
    expect(opened).toEqual({ path: '/work/root/src/lib.rs', startLine: 6, startColumn: 2, endLine: 8, endColumn: 4 });
  });
  it('refuses paths outside the selected root', async () => {
    const navigator = new SourceNavigator({ openExact: async () => { throw new Error('must not open'); } });
    await expect(navigator.open({ name: 'root', path: '/work/root' }, { file: '../other.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 })).rejects.toThrow('safe exact source path');
  });
});
