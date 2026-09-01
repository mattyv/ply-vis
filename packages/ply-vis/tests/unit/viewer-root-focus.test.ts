// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

describe('workspace focus', () => {
  it('treats focusing the root workspace as showing the whole diagram', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: { id: 'run', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>',
      elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } }, diagnostics: [],
    });
    container.querySelector('[data-element-id="workspace"]')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(viewer.getState().focusedId).toBeUndefined();
    viewer.destroy();
  });

  it('keeps nested focus visible through its ancestor SVG groups', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
    viewer.load({
      protocolVersion: 1,
      run: { id: 'nested', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><g data-element-id="ingest"><g data-element-id="ring"><rect width="10" height="10"/></g><g data-element-id="other"><rect width="10" height="10"/></g></g></g></svg>',
      elements: {
        workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence, diagnosticIds: [] },
        ingest: { id: 'ingest', kind: 'component', label: 'ingest', parentId: 'workspace', evidence, diagnosticIds: [] },
        ring: { id: 'ring', kind: 'component', label: 'ring', parentId: 'ingest', evidence, diagnosticIds: [] },
        other: { id: 'other', kind: 'component', label: 'other', parentId: 'ingest', evidence, diagnosticIds: [] },
      }, diagnostics: [],
    });
    container.querySelector('[data-element-id="ring"]')!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(container.querySelector('[data-element-id="workspace"]')!.hasAttribute('hidden')).toBe(false);
    expect(container.querySelector('[data-element-id="ingest"]')!.hasAttribute('hidden')).toBe(false);
    expect(container.querySelector('[data-element-id="ring"]')!.hasAttribute('hidden')).toBe(false);
    expect(container.querySelector('[data-element-id="other"]')!.hasAttribute('hidden')).toBe(true);
    viewer.destroy();
  });
});
