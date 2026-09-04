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

describe('edge details', () => {
  it('makes an identified edge keyboard-reachable and inspectable without making it a focus target', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
    viewer.load({
      protocolVersion: 1,
      run: { id: 'edge-details', completedAt: '2026-09-04T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="caller"><rect width="10" height="10"/></g><g data-element-id="callee"><rect x="20" width="10" height="10"/></g><g data-element-id="call-edge"><path d="M 10 5 L 20 5"/></g></svg>',
      elements: {
        caller: { id: 'caller', kind: 'component', label: 'Caller', evidence, diagnosticIds: [] },
        callee: { id: 'callee', kind: 'component', label: 'Callee', evidence, diagnosticIds: [] },
      },
      edges: [{ id: 'call-edge', fromId: 'caller', toId: 'callee', kind: 'call', label: 'may call' }],
      diagnostics: [],
    });
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    const edge = container.querySelector<SVGElement>('[data-element-id="call-edge"]')!;

    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(viewer.getState()).toMatchObject({ selectedId: 'call-edge', focusedId: undefined });
    expect(edge.getAttribute('tabindex')).toBe('0');
    expect(edge.getAttribute('role')).toBe('button');
    expect(edge.getAttribute('aria-label')).toBe('call: may call; from Caller to Callee');
    expect(container.querySelector('.ply-inspector')?.textContent).toContain('TypecallFromCallerToCallee');

    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    edge.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(viewer.getState().focusedId).toBeUndefined();
    viewer.destroy();
  });
});
