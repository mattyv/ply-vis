// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

describe('long tooltips', () => {
  it('stay inside the canvas and remain open for scrolling', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load({
      protocolVersion: 1,
      run: { id: 'long-tip', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="fn"><title>Long details</title><rect width="10" height="10"/></g></svg>',
      elements: {}, diagnostics: [],
    });
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 300, bottom: 200, width: 300, height: 200, toJSON: () => ({}) });
    const node = container.querySelector<SVGElement>('[data-element-id="fn"]')!;
    const tooltip = container.querySelector<HTMLElement>('.ply-tooltip')!;

    node.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, clientX: 10, clientY: 10 }));
    vi.advanceTimersByTime(500);
    expect(tooltip.hidden).toBe(false);
    expect(tooltip.style.maxHeight).toBe('184px');

    node.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: tooltip }));
    expect(tooltip.hidden).toBe(false);
    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 10 }));
    expect(viewer.getState().zoom).toBe(1);
    tooltip.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    expect(tooltip.hidden).toBe(true);

    viewer.destroy();
    vi.useRealTimers();
  });
});
