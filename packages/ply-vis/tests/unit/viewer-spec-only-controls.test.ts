// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// A spec-only drawing (rendered from ply.yaml before any run) has no
// evidence, so the Earned/Gap/Violation filters have nothing to filter and
// are hidden. The Detail controls -- folding and tooltips -- still work on a
// spec-only drawing and must stay.
const specOnly = {
  protocolVersion: 1 as const,
  run: {
    id: '1', completedAt: '2026-09-06T00:00:00Z',
    root: { path: '.' }, tool: { name: 'cargo-ply', version: 'render' },
    outcome: 'missing_evidence' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-ply-id="x"><rect width="10" height="10"/></g></svg>',
  elements: {},
  diagnostics: [],
};

const fieldsetByLegend = (container: HTMLElement, legend: string) =>
  [...container.querySelectorAll<HTMLFieldSetElement>('.ply-toolbar fieldset')]
    .find((set) => set.querySelector('legend')?.textContent === legend)!;

describe('a drawing with no evidence in it', () => {
  it('hides the evidence filters and keeps the detail controls', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(specOnly);

    expect(fieldsetByLegend(container, 'Overlays').hidden).toBe(true);
    expect(fieldsetByLegend(container, 'Detail').hidden).toBe(false);
    viewer.destroy();
  });
});
