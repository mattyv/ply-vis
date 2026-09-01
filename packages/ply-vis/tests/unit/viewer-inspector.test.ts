// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

describe('run details', () => {
  it('explains the result without exposing machine identifiers', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: {
        id: '1788168166-166428000-17374', completedAt: '2026-08-31T09:22:46Z',
        root: { path: '.' }, tool: { name: 'cargo-ply', version: 'd0a489779afde70b82c986de8e2ed3c' },
        outcome: 'missing_evidence',
      },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><rect width="10" height="10"/></g></svg>',
      elements: {
        workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'unclaimed', statuses: [], reused: false }, diagnosticIds: [] },
      },
      diagnostics: [],
    });
    container.querySelector<SVGElement>('[data-element-id="workspace"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const text = container.querySelector('.ply-inspector')!.textContent!;

    expect(text).toContain('Run details');
    expect(text).toContain('Some promised evidence is missing');
    expect(text).toContain('Workspace root');
    expect(text).not.toContain('missing_evidence');
    expect(text).not.toContain('d0a489779afde70b82c986de8e2ed3c');
    viewer.destroy();
  });

  it('shows input and postconditions as separate declaration lines', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: {
        id: 'contract-lines', completedAt: '2026-08-31T09:22:46Z',
        root: { path: '.' }, tool: { name: 'cargo-ply', version: 'test' }, outcome: 'clean',
      },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="fee"><rect width="10" height="10"/></g></svg>',
      elements: {
        fee: {
          id: 'fee', kind: 'function', label: 'carded_fee_cents',
          declaration: 'Input (requires): amount_cents <= 100_000_000 && tier < 4\nPostcondition (ensures): result <= amount_cents',
          evidence: { verdict: 'bounded(2)', statuses: [], reused: false }, diagnosticIds: [],
        },
      },
      diagnostics: [],
    });
    container.querySelector<SVGElement>('[data-element-id="fee"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const lines = [...container.querySelectorAll('.ply-inspector section:first-of-type li')]
      .map((item) => item.textContent);
    expect(lines).toEqual([
      'Input (requires): amount_cents <= 100_000_000 && tier < 4',
      'Postcondition (ensures): result <= amount_cents',
    ]);
    viewer.destroy();
  });
});
