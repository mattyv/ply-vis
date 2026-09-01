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
});
