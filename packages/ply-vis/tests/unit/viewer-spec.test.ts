// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

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
