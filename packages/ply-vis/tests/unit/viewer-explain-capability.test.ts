// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// The viewer is shared by every host, but only a host that can run Ply can
// answer "what does this code mean". Offering the action everywhere produced
// an error dialog in JetBrains, which reads the same messages and cannot run
// the CLI. So the entries appear only when the host has said it can explain.
const envelope = {
  protocolVersion: 1 as const,
  run: {
    id: '1', completedAt: '2026-09-06T00:00:00Z',
    root: { path: '.' }, tool: { name: 'cargo-ply', version: 'x' },
    outcome: 'violation' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="a"><rect width="10" height="10"/></g></svg>',
  elements: {
    a: { id: 'a', kind: 'component' as const, label: 'A', evidence: { verdict: 'violation', statuses: [], reused: false }, diagnosticIds: ['d1'] },
  },
  diagnostics: [{ id: 'd1', code: 'W0419', severity: 'warning' as const, message: 'first' }],
};

const menuLabels = (container: HTMLElement) => {
  container.querySelector<SVGElement>('[data-element-id="a"]')!
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  return [...container.querySelectorAll<HTMLButtonElement>('.ply-context-menu button')].map((b) => b.textContent);
};

const mount = () => {
  const container = document.createElement('div');
  document.body.append(container);
  const viewer = mountViewer(container, { post: () => undefined });
  viewer.load(envelope);
  return { container, viewer };
};

describe('offering to explain a code only where it can be done', () => {
  it('offers nothing to explain until the host says it can', () => {
    const { container, viewer } = mount();
    const labels = menuLabels(container);
    expect(labels.filter((l) => l?.startsWith('Explain'))).toEqual([]);
    // The zoom entry must survive: gating explain must not empty the menu.
    expect(labels).toContain('Zoom into A');
    viewer.destroy();
  });

  it('offers both entries once the host announces it can explain', () => {
    const { container, viewer } = mount();
    window.dispatchEvent(new MessageEvent('message', {
      data: { channel: 'ply-vis', version: 1, type: 'capabilities', explain: true },
    }));

    const labels = menuLabels(container);
    expect(labels).toContain('Explain W0419');
    expect(labels).toContain('Explain a code…');
    viewer.destroy();
  });
});
