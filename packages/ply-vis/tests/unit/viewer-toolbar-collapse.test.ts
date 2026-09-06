// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// The two checkbox groups cost a whole toolbar row and are set once and then
// left alone, so they fold away. The zoom buttons stay put: those are used
// constantly, and hiding them behind a toggle would cost a click every time.
const envelope = {
  protocolVersion: 1 as const,
  run: {
    id: '1', completedAt: '2026-09-06T00:00:00Z',
    root: { path: '.' }, tool: { name: 'cargo-ply', version: 'x' },
    outcome: 'clean' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="a"><rect width="10" height="10"/></g></svg>',
  elements: {
    a: { id: 'a', kind: 'component' as const, label: 'A', evidence: { verdict: 'unclaimed', statuses: [], reused: false }, diagnosticIds: [] },
  },
  diagnostics: [],
};

const mount = () => {
  const container = document.createElement('div');
  document.body.append(container);
  const viewer = mountViewer(container, { post: () => undefined });
  viewer.load(envelope);
  return {
    viewer,
    container,
    toggle: container.querySelector<HTMLButtonElement>('.ply-options-toggle')!,
    options: container.querySelector<HTMLElement>('.ply-options')!,
    zoomIn: container.querySelector<HTMLButtonElement>('[aria-label="Zoom in"]')!,
  };
};

describe('folding the checkbox groups away', () => {
  it('starts open, so nothing a reader relies on disappears without them asking', () => {
    const { options, toggle, viewer } = mount();
    expect(options.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    viewer.destroy();
  });

  it('folds and unfolds them, and says which state it is in', () => {
    const { options, toggle, viewer } = mount();

    toggle.click();
    expect(options.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    expect(options.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    viewer.destroy();
  });

  it('leaves the zoom controls alone, folded or not', () => {
    const { toggle, zoomIn, viewer } = mount();
    toggle.click();
    expect(zoomIn.isConnected).toBe(true);
    expect(zoomIn.closest('[hidden]')).toBeNull();
    viewer.destroy();
  });

  it('remembers the fold, so it does not spring open on every run', () => {
    const { toggle, viewer } = mount();
    toggle.click();
    expect(viewer.getState().optionsHidden).toBe(true);
    viewer.destroy();
  });
});
