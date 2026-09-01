import { describe, expect, it } from 'vitest';
import { loadRenderedSpec } from './rendered-spec';

describe('rendered Ply spec', () => {
  it('keeps the declaration hierarchy used for semantic focus', () => {
    const workspace = { id: 'workspace', kind: 'workspace', label: 'workspace', evidence: { verdict: 'unclaimed', statuses: [], reused: false }, diagnosticIds: [] };
    const component = { id: 'component', kind: 'component', label: 'decoder', parentId: 'workspace', evidence: { verdict: 'unclaimed', statuses: [], reused: false }, diagnosticIds: [] };
    const fn = { id: 'fn', kind: 'fn', label: 'decode', parentId: 'component', evidence: { verdict: 'unclaimed', statuses: [], reused: false }, diagnosticIds: [] };
    const json = JSON.stringify({
      protocolVersion: 1,
      run: { id: 'render-1', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'cargo-ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="component"/></svg>',
      elements: { workspace, component, fn }, diagnostics: [],
    });

    const loaded = loadRenderedSpec({ name: 'demo', path: '/demo', specPath: '/demo/finding-header.ply.yaml' }, json);

    expect(loaded.snapshot?.envelope.elements.fn?.parentId).toBe('component');
    expect(loaded.snapshot?.index.currentRun).toBe('render-1');
  });
});
