// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// `Array.prototype.every` is true for an empty array, so an envelope that
// carries no elements at all satisfied "every element is declaration-only"
// and was described as a drawing nothing has ever checked. A real run that
// happens to draw no elements is not a declaration-only render, and saying
// so invents a claim about evidence that does not exist (external review,
// 2026-09-07).
const runIdentity = 'a'.repeat(64);

const emptyRealRun = {
  protocolVersion: 1 as const,
  run: {
    id: '1',
    completedAt: '2026-09-06T00:00:00Z',
    root: { path: '.' },
    tool: { name: 'cargo-ply', version: runIdentity },
    outcome: 'clean' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  elements: {},
  diagnostics: [],
};

const provenanceText = (container: HTMLElement) =>
  container.querySelector('.ply-provenance')!.textContent ?? '';

describe('a run whose drawing carries no elements', () => {
  it('is not described as a drawing nothing has checked', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(emptyRealRun);

    expect(provenanceText(container)).not.toContain('Promises only');
    expect(provenanceText(container)).toContain('Showing a run completed');
    viewer.destroy();
  });

  it('still describes a declaration-only render as promises only', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      ...emptyRealRun,
      run: { ...emptyRealRun.run, tool: { name: 'cargo-ply', version: 'render' } },
      elements: {
        a: {
          id: 'a',
          kind: 'fn',
          label: 'a',
          evidence: { verdict: 'unclaimed', statuses: [], reused: false },
          diagnosticIds: [],
        },
      },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-ply-id="a"><rect width="10" height="10"/></g></svg>',
    } as never);

    expect(provenanceText(container)).toContain('Promises only');
    viewer.destroy();
  });
});
