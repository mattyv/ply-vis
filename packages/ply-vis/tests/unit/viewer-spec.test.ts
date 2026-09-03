// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

function envelopeWith(elements: Record<string, unknown>) {
  const boxes = Object.keys(elements).map((id) => `<g data-element-id="${id}"><rect width="10" height="10"/></g>`).join('');
  return {
    protocolVersion: 1,
    run: { id: 'overlay-spec', completedAt: '2026-09-02T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
    svg: `<svg xmlns="http://www.w3.org/2000/svg">${boxes}</svg>`,
    elements,
    diagnostics: [],
  };
}

function untick(container: HTMLElement, overlay: 'earned' | 'gap' | 'violation') {
  const input = container.querySelector<HTMLInputElement>(`[data-overlay="${overlay}"]`)!;
  input.checked = false;
  input.dispatchEvent(new Event('change'));
}

describe('overlay checkboxes hide items by the state Ply actually publishes', () => {
  it('hides an earned item (a real verdict like fuzzed(64), state "earned") when the Earned box is unticked', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    expect(viewer.load(envelopeWith({
      thing: { id: 'thing', kind: 'function', label: 'thing', evidence: { verdict: 'fuzzed(64)', statuses: [], reused: false, state: 'earned' }, diagnosticIds: [] },
    }))).toBe(true);

    const node = container.querySelector<SVGElement>('[data-element-id="thing"]')!;
    expect(node.hasAttribute('hidden')).toBe(false);
    untick(container, 'earned');
    expect(node.hasAttribute('hidden')).toBe(true);
  });

  it('hides a gap item (an absence verdict like timeout, state "gap") when the Gap box is unticked', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    expect(viewer.load(envelopeWith({
      thing: { id: 'thing', kind: 'function', label: 'thing', evidence: { verdict: 'timeout', statuses: [], reused: false, state: 'gap' }, diagnosticIds: [] },
    }))).toBe(true);

    const node = container.querySelector<SVGElement>('[data-element-id="thing"]')!;
    expect(node.hasAttribute('hidden')).toBe(false);
    untick(container, 'gap');
    expect(node.hasAttribute('hidden')).toBe(true);
  });

  it('leaves an older envelope with no evidence state exactly as it behaves today', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    expect(viewer.load(envelopeWith({
      thing: { id: 'thing', kind: 'function', label: 'thing', evidence: { verdict: 'bounded(2)', statuses: [], reused: false }, diagnosticIds: [] },
    }))).toBe(true);

    const node = container.querySelector<SVGElement>('[data-element-id="thing"]')!;
    expect(node.hasAttribute('hidden')).toBe(false);
    untick(container, 'earned');
    untick(container, 'gap');
    untick(container, 'violation');
    // No status/verdict string is the literal words 'gap' or 'earned', and it
    // is not 'violation' either, so today it falls through to 'declared' —
    // which line 294's `stateClass === 'declared'` keeps permanently visible.
    expect(node.hasAttribute('hidden')).toBe(false);
  });
});

describe('spec-only viewer', () => {
  it('shows an embedded tooltip only after the pointer rests', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    expect(viewer.load({
      protocolVersion: 1,
      run: { id: 'render-spec', completedAt: '2026-08-31T10:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="component"><title>Component details</title><rect width="10" height="10" fill="#fff"/></g></svg>',
      elements: {}, diagnostics: [],
    })).toBe(true);

    const node = container.querySelector<SVGElement>('[data-element-id="component"]')!;
    expect(node.hasAttribute('hidden')).toBe(false);
    expect(container.querySelector('[data-role="runs"]')).toBeNull();
    node.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, clientX: 1, clientY: 1 }));
    expect(container.querySelector<HTMLElement>('.ply-tooltip')?.hidden).toBe(true);
    node.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 2, clientY: 2 }));
    vi.advanceTimersByTime(499);
    expect(container.querySelector<HTMLElement>('.ply-tooltip')?.hidden).toBe(true);
    vi.advanceTimersByTime(1);
    expect(container.querySelector('.ply-tooltip')?.textContent).toContain('Component details');
    viewer.destroy();
    vi.useRealTimers();
  });
});
