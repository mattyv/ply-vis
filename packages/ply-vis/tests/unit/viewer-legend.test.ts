// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

const states = ['declared', 'earned', 'gap', 'violation'] as const;

function mountLegend(svgExtras = '') {
  const container = document.createElement('div');
  document.body.append(container);
  const viewer = mountViewer(container, { post: () => undefined });
  viewer.load({
    protocolVersion: 1,
    run: { id: 'legend', completedAt: '2026-09-07T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'violation' },
    svg: `<svg xmlns="http://www.w3.org/2000/svg">${states.map((state) => `<g data-element-id="${state}"><rect width="10" height="10"/></g>`).join('')}${svgExtras}</svg>`,
    elements: Object.fromEntries(states.map((state) => [state, { id: state, kind: 'function', label: state, evidence: { verdict: state, statuses: [], reused: false, state }, diagnosticIds: [] }])),
    diagnostics: [],
  });
  const toggle = container.querySelector<HTMLInputElement>('[data-show-legend]')!;
  const legend = container.querySelector<HTMLElement>('.ply-legend-panel')!;
  return { container, viewer, toggle, legend };
}

function check(toggle: HTMLInputElement) {
  toggle.checked = true;
  toggle.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('evidence legend', () => {
  it('starts hidden and renders outside the SVG when requested', () => {
    const { container, viewer, toggle, legend } = mountLegend();
    expect(toggle.checked).toBe(false);
    expect(legend.hidden).toBe(true);

    check(toggle);

    expect(legend.hidden).toBe(false);
    expect(legend.querySelectorAll('li')).toHaveLength(4);
    expect(legend.textContent).toContain('DeclaredPromised, not checked');
    expect(legend.textContent).toContain('EarnedEvidence completed');
    expect(container.querySelector('svg .ply-legend-panel')).toBeNull();
    expect(viewer.getState().legendVisible).toBe(true);
    viewer.destroy();
  });

  it('lists only evidence states still visible in the current drawing', () => {
    const { container, viewer, toggle, legend } = mountLegend();
    check(toggle);
    const earned = container.querySelector<HTMLInputElement>('[data-overlay="earned"]')!;
    earned.checked = false;
    earned.dispatchEvent(new Event('change', { bubbles: true }));

    expect(legend.textContent).not.toContain('Earned');
    expect(legend.querySelectorAll('li')).toHaveLength(3);
    viewer.destroy();
  });

  it('adds only the declaration notation and color channels present in the SVG', () => {
    const svg = '<rect class="ceiling-bounded"/><rect class="ceiling-unclaimed"/><rect class="fn-chip-box-synth"/><path class="strict-notch"/><g class="fn-shield"><text>shield</text></g><g class="unresolved-pin"><circle r="4"/><text>#6</text></g><g class="edge-call"><path/></g><g class="edge-flow"><path/></g><g class="edge-entry"><path/></g><g class="deny-rule"><path class="deny-line"/><line class="deny-bar"/></g>';
    const { viewer, toggle, legend } = mountLegend(svg);
    check(toggle);

    expect(legend.textContent).toContain('Grey depthDarker means stronger checks promised');
    expect(legend.textContent).toContain('Hatched fillNothing here promises a check');
    expect(legend.textContent).toContain('Violet fillMachine-written from its contract');
    expect(legend.textContent).toContain('Strict requestAsks for errors, not warnings');
    expect(legend.textContent).toContain('Trusted claimHuman-attested, not machine-checked');
    expect(legend.textContent).toContain('Open decisionA question still needs an answer');
    expect(legend.textContent).toContain('CallSolid arrow');
    expect(legend.textContent).toContain('Data flowDashed arrow');
    expect(legend.textContent).toContain('External entryDashed arrow from outside');
    expect(legend.textContent).toContain('Forbidden callThis call is not allowed');
    expect(legend.querySelector('[data-symbol="strict"]')).not.toBeNull();
    expect(legend.querySelector('[data-symbol="call"]')).not.toBeNull();
    expect(legend.querySelector('[data-symbol="flow"]')).not.toBeNull();
    expect(legend.querySelector('[data-symbol="decision"]')?.textContent).toBe('#');
    expect(legend.querySelector('[data-symbol="trusted"]')?.textContent).toBe('\u26c9');
    expect(legend.querySelector('[data-symbol="denied"]')).not.toBeNull();
    viewer.destroy();
  });

  it('gets out of the way while the canvas is being dragged, then returns', () => {
    const { container, viewer, toggle, legend } = mountLegend();
    check(toggle);
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;

    canvas.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
    canvas.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 20, clientY: 20 }));
    expect(legend.hidden).toBe(true);
    expect(viewer.getState().legendVisible).toBe(true);

    canvas.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 20, clientY: 20 }));
    expect(legend.hidden).toBe(false);
    viewer.destroy();
  });

  it('shows nothing rather than inventing a declared entry when filters empty the drawing', () => {
    // A drawing whose every item is earned, with the Earned overlay off, has
    // nothing visible -- and nothing declared. The fallback below exists for
    // a declaration-only render that carries no indexed elements at all, and
    // firing it here put a "Declared" entry in the legend for items that do
    // not exist (external review, 2026-09-07).
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: { id: 'earned-only', completedAt: '2026-09-07T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="a"><rect width="10" height="10"/></g></svg>',
      elements: {
        a: { id: 'a', kind: 'function', label: 'a', evidence: { verdict: 'earned', statuses: [], reused: false, state: 'earned' }, diagnosticIds: [] },
      },
      diagnostics: [],
    });
    check(container.querySelector<HTMLInputElement>('[data-show-legend]')!);
    const legend = container.querySelector<HTMLElement>('.ply-legend-panel')!;
    expect(legend.textContent).toContain('Earned');

    const earned = container.querySelector<HTMLInputElement>('[data-overlay="earned"]')!;
    earned.checked = false;
    earned.dispatchEvent(new Event('change', { bubbles: true }));

    expect(legend.textContent).not.toContain('Declared');
    expect(legend.querySelectorAll('li')).toHaveLength(0);
    viewer.destroy();
  });

  it('shows one declared entry for a declaration-only SVG with no indexed evidence', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: { id: 'spec', completedAt: '2026-09-07T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'missing_evidence' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
      elements: {}, diagnostics: [],
    });
    check(container.querySelector<HTMLInputElement>('[data-show-legend]')!);

    const legend = container.querySelector<HTMLElement>('.ply-legend-panel')!;
    expect(legend.querySelectorAll('li')).toHaveLength(1);
    expect(legend.textContent).toContain('Declared');
    viewer.destroy();
  });
});
