import { describe, expect, it } from 'vitest';
import { discoverPlyRoots, parseRunIndex, parseVisualEnvelope, ResultSource, shouldHandleWorkspaceChange, type FileReader, type VisualEnvelope } from './result-source';

const envelope = (id = 'run-1'): VisualEnvelope => ({
  protocolVersion: 1, run: { id, completedAt: '2026-08-28T00:00:00Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: 'build-1' }, outcome: 'clean' },
  svg: '<svg/>', elements: { fn: { id: 'fn', kind: 'function', label: 'check', evidence: { verdict: 'opaque', statuses: [], reused: false }, diagnosticIds: [], source: { file: 'src/lib.rs', startLine: 1, startColumn: 2, endLine: 1, endColumn: 7 } } }, diagnostics: [],
});
const index = { protocolVersion: 1, currentRun: 'run-1', runs: [{ id: 'run-1', path: 'views/run-1/visual.json', completedAt: '2026-08-28T00:00:00Z', outcome: 'clean' }] };

class MemoryFiles implements FileReader {
  public constructor(public readonly values: Record<string, string>) {}
  public async readText(path: string): Promise<string> { const value = this.values[path]; if (value === undefined) throw new Error(`missing ${path}`); return value; }
  public async exists(path: string): Promise<boolean> { return path in this.values; }
  public async findPlySpecs(root: string): Promise<string[]> {
    return Object.keys(this.values).filter((path) => path.startsWith(`${root}/`) && path.endsWith('/ply.yaml'));
  }
}

describe('Ply result discovery', () => {
  it('discovers every workspace root containing ply.yaml without merging roots', async () => {
    const files = new MemoryFiles({ '/a/ply.yaml': '', '/c/ply.yaml': '' });
    await expect(discoverPlyRoots([{ name: 'a', path: '/a' }, { name: 'b', path: '/b' }, { name: 'c', path: '/c' }], files))
      .resolves.toEqual([{ name: 'a', path: '/a' }, { name: 'c', path: '/c' }]);
  });
  it('discovers nested specs and excludes generated or dependency trees', async () => {
    const files = new MemoryFiles({
      '/repo/crates/a/ply.yaml': '',
      '/repo/services/b/ply.yaml': '',
      '/repo/.git/fixtures/ply.yaml': '',
      '/repo/target/copied/ply.yaml': '',
      '/repo/node_modules/pkg/ply.yaml': '',
      '/repo/build/generated/ply.yaml': '',
      '/repo/.gradle/cache/ply.yaml': '',
      '/repo/.gradle-user/cache/ply.yaml': '',
      '/repo/.intellijPlatform/cache/ply.yaml': '',
    });
    await expect(discoverPlyRoots([{ name: 'repo', path: '/repo' }], files)).resolves.toEqual([
      { name: 'repo: crates/a', path: '/repo/crates/a' },
      { name: 'repo: services/b', path: '/repo/services/b' },
    ]);
  });
  it('rejects discovered specs outside the workspace boundary', async () => {
    const files = new MemoryFiles({ '/repo/ply.yaml': '', '/repo-other/ply.yaml': '' });
    files.findPlySpecs = async () => ['/repo/ply.yaml', '/repo-other/ply.yaml'];
    await expect(discoverPlyRoots([{ name: 'repo', path: '/repo' }], files)).resolves.toEqual([{ name: 'repo', path: '/repo' }]);
  });
  it('matches recursive spec and artifact changes without watching excluded trees or paths outside the workspace', () => {
    expect(shouldHandleWorkspaceChange('/repo', '/repo/crates/a/ply.yaml')).toBe(true);
    expect(shouldHandleWorkspaceChange('/repo', '/repo/crates/a/target/ply/view.json')).toBe(true);
    expect(shouldHandleWorkspaceChange('/repo', '/repo/crates/a/target/ply/views/r1/visual.json')).toBe(true);
    expect(shouldHandleWorkspaceChange('/repo', '/repo/.gradle/cache/ply.yaml')).toBe(false);
    expect(shouldHandleWorkspaceChange('/repo', '/repo/node_modules/pkg/target/ply/view.json')).toBe(false);
    expect(shouldHandleWorkspaceChange('/repo', '/repo-other/ply.yaml')).toBe(false);
  });
  it('accepts only the strict v1 index and contained immutable JSON paths', () => {
    expect(parseRunIndex(index).currentRun).toBe('run-1');
    expect(() => parseRunIndex({ ...index, protocolVersion: 2 })).toThrow('Unsupported Ply visual index version');
    expect(() => parseRunIndex({ ...index, extra: true })).toThrow('Malformed Ply visual index');
    expect(() => parseRunIndex({ ...index, runs: [{ ...index.runs[0], path: '../outside.json' }] })).toThrow('Malformed run entry');
  });
});

describe('VisualEnvelope compatibility', () => {
  it('accepts a complete v1 artifact but does not interpret its verdict fields', () => {
    const value = envelope();
    expect(parseVisualEnvelope(value)).toEqual(value);
  });
  it('rejects unknown versions, malformed artifacts, and unsafe or reversed source ranges', () => {
    expect(() => parseVisualEnvelope({ ...envelope(), protocolVersion: 9 })).toThrow('Unsupported Ply visual artifact version');
    expect(() => parseVisualEnvelope({ ...envelope(), svg: '' })).toThrow('Malformed Ply visual artifact');
    const unsafe = envelope();
    expect(() => parseVisualEnvelope({ ...unsafe, elements: { fn: { ...unsafe.elements.fn!, source: { file: '../secret', startLine: 2, startColumn: 3, endLine: 1, endColumn: 1 } } } }))
      .toThrow(/source location|source range/);
  });
  it('keeps the last complete run and reports a later partial write clearly', async () => {
    const files = new MemoryFiles({ '/root/target/ply/view.json': JSON.stringify(index), '/root/target/ply/views/run-1/visual.json': JSON.stringify(envelope()) });
    const source = new ResultSource(files);
    const root = { name: 'root', path: '/root' };
    const first = await source.reload(root);
    files.values['/root/target/ply/views/run-1/visual.json'] = '{partial';
    const second = await source.reload(root);
    expect(first.snapshot?.envelope.run.id).toBe('run-1');
    expect(second.snapshot).toBe(first.snapshot);
    expect(second.error).toBe('A Ply visual artifact is not valid JSON.');
  });
  it('treats a missing index as specs found with no completed visual runs', async () => {
    const source = new ResultSource(new MemoryFiles({ '/root/ply.yaml': '' }));
    await expect(source.reload({ name: 'root', path: '/root' })).resolves.toEqual({});
  });
});
