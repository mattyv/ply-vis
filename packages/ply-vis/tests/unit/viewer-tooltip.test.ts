// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

function mountWithNode() {
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
  const hoverToggle = container.querySelector<HTMLInputElement>('[data-hover-tooltips]')!;
  return { viewer, tooltip, node, hoverToggle };
}

function hover(node: SVGElement, clientX = 10, clientY = 10) {
  node.dispatchEvent(new MouseEvent('pointerover', { bubbles: true, clientX, clientY }));
  vi.advanceTimersByTime(500);
}

function uncheck(toggle: HTMLInputElement) {
  toggle.checked = false;
  toggle.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulates a real browser focusing a clicked, focusable item: the browser
 * moves focus there but marks it as NOT `:focus-visible` (a mouse click
 * never earns a focus ring). jsdom's selector engine doesn't implement that
 * distinction -- `matches(':focus-visible')` there just mirrors `:focus`,
 * true for any focused element no matter how it got focused -- so calling
 * `.focus()` alone here would not reproduce the click case at all. The
 * `matches` stub answers `:focus-visible` the way a real browser would for
 * a click, so the test exercises the app's real branching logic (the
 * `isFocusVisible` check in viewer.ts) rather than jsdom's inaccurate stand-in
 * for it.
 */
function focusByClick(node: SVGElement) {
  const real = node.matches.bind(node);
  vi.spyOn(node, 'matches').mockImplementation((selector: string) => (selector === ':focus-visible' ? false : real(selector)));
  node.focus();
  node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Simulates Tab landing on an item. Unlike the click case, jsdom's
 * `:focus-visible` (really just `:focus`) already agrees with a real
 * browser here -- both report `true` -- so no stubbing is needed.
 */
function focusByKeyboard(node: SVGElement) {
  node.focus();
  node.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

function mountWithHoveredTooltip() {
  const { viewer, tooltip, node, hoverToggle } = mountWithNode();
  hover(node);
  return { viewer, tooltip, node, hoverToggle };
}

/** jsdom does no layout: scrollHeight/clientHeight are 0 unless set explicitly. */
function setScrollable(tooltip: HTMLElement, scrollHeight: number, clientHeight: number, scrollTop: number) {
  Object.defineProperty(tooltip, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(tooltip, 'clientHeight', { value: clientHeight, configurable: true });
  tooltip.scrollTop = scrollTop;
}

describe('long tooltips', () => {
  it('stay inside the canvas and remain open for scrolling', () => {
    vi.useFakeTimers();
    const { viewer, tooltip } = mountWithHoveredTooltip();
    // Content taller than the tooltip's own box, scrolled to the very top:
    // there is still more below, so this wheel should scroll the tooltip,
    // not the canvas.
    setScrollable(tooltip, 400, 184, 0);
    expect(tooltip.style.maxHeight).toBe('184px');

    tooltip.dispatchEvent(new MouseEvent('pointerout', { bubbles: true, relatedTarget: tooltip }));
    expect(tooltip.hidden).toBe(false);
    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 10 }));
    expect(viewer.getState().zoom).toBe(1);
    expect(tooltip.hidden).toBe(false);
    tooltip.dispatchEvent(new MouseEvent('pointerleave', { bubbles: true }));
    expect(tooltip.hidden).toBe(true);

    viewer.destroy();
    vi.useRealTimers();
  });
});

describe('scrolling a tooltip that has nowhere left to scroll', () => {
  it('zooms the canvas instead of doing nothing (the reported bug: tooltips get in the way of zooming)', () => {
    vi.useFakeTimers();
    const { viewer, tooltip } = mountWithHoveredTooltip();
    // Short tooltip: its content fits without scrolling at all.
    setScrollable(tooltip, 100, 100, 0);

    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 10, clientX: 10, clientY: 10 }));

    expect(viewer.getState().zoom).not.toBe(1);
    viewer.destroy();
    vi.useRealTimers();
  });

  it('hides the tooltip once the wheel is passed through to the canvas, so it stops covering the drawing being zoomed', () => {
    vi.useFakeTimers();
    const { viewer, tooltip } = mountWithHoveredTooltip();
    setScrollable(tooltip, 100, 100, 0);

    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 10, clientX: 10, clientY: 10 }));

    expect(tooltip.hidden).toBe(true);
    viewer.destroy();
    vi.useRealTimers();
  });

  it('zooms once a scrollable tooltip is already at the bottom edge and is scrolled further down', () => {
    vi.useFakeTimers();
    const { viewer, tooltip } = mountWithHoveredTooltip();
    // scrollTop (216) + clientHeight (184) === scrollHeight (400): already at the bottom.
    setScrollable(tooltip, 400, 184, 216);

    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 10, clientX: 10, clientY: 10 }));

    expect(viewer.getState().zoom).not.toBe(1);
    expect(tooltip.hidden).toBe(true);
    viewer.destroy();
    vi.useRealTimers();
  });

  it('does not zoom while a scrollable tooltip can still scroll further up', () => {
    vi.useFakeTimers();
    const { viewer, tooltip } = mountWithHoveredTooltip();
    setScrollable(tooltip, 400, 184, 216);

    // Scrolling back up: not at the top edge yet, so this should scroll the tooltip.
    tooltip.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -10, clientX: 10, clientY: 10 }));

    expect(viewer.getState().zoom).toBe(1);
    expect(tooltip.hidden).toBe(false);
    viewer.destroy();
    vi.useRealTimers();
  });
});

// The maintainer's complaint was specifically about the popup that chases the
// pointer around -- so the checkbox added for it must only silence hover.
// Keyboard focus has no other way to reach the same information (most of a
// drawing's detail lives in hover text, not on the canvas), so that path is
// wired straight past the setting rather than reading it.
describe('the "Show tooltips on hover" setting', () => {
  it('is on by default, so hovering an item shows its tooltip', () => {
    vi.useFakeTimers();
    const { tooltip, hoverToggle } = mountWithHoveredTooltip();
    expect(hoverToggle.checked).toBe(true);
    expect(tooltip.hidden).toBe(false);
    vi.useRealTimers();
  });

  it('shows no tooltip on hover once switched off', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    uncheck(hoverToggle);
    hover(node);
    expect(tooltip.hidden).toBe(true);
    vi.useRealTimers();
  });

  it('still shows the tooltip on keyboard focus even when hover is switched off', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    uncheck(hoverToggle);
    focusByKeyboard(node);
    expect(tooltip.hidden).toBe(false);
    vi.useRealTimers();
  });

  it('does NOT show a tooltip when a mouse click focuses an item, even though the click also fires focusin (the reported bug)', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    uncheck(hoverToggle);
    focusByClick(node);
    expect(tooltip.hidden).toBe(true);
    vi.useRealTimers();
  });

  it('does not wire an accessible description to the item on a click focus, matching the hidden tooltip', () => {
    vi.useFakeTimers();
    const { node, hoverToggle } = mountWithNode();
    uncheck(hoverToggle);
    focusByClick(node);
    expect(node.hasAttribute('aria-describedby')).toBe(false);
    vi.useRealTimers();
  });

  it('still wires an accessible description to the item on keyboard focus, even when hover is switched off', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    uncheck(hoverToggle);
    focusByKeyboard(node);
    expect(node.getAttribute('aria-describedby')).toBe(tooltip.id);
    vi.useRealTimers();
  });

  it('shows the tooltip on a click focus when hover is switched on, unchanged from before this setting existed', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    expect(hoverToggle.checked).toBe(true);
    focusByClick(node);
    expect(tooltip.hidden).toBe(false);
    vi.useRealTimers();
  });

  it('hides an open hover tooltip immediately when switched off, without waiting for a pointer move', () => {
    vi.useFakeTimers();
    const { tooltip, hoverToggle } = mountWithHoveredTooltip();
    expect(tooltip.hidden).toBe(false);
    uncheck(hoverToggle);
    expect(tooltip.hidden).toBe(true);
    vi.useRealTimers();
  });

  it('does not hide a tooltip that keyboard focus put on screen', () => {
    vi.useFakeTimers();
    const { tooltip, node, hoverToggle } = mountWithNode();
    focusByKeyboard(node);
    expect(tooltip.hidden).toBe(false);
    uncheck(hoverToggle);
    expect(tooltip.hidden).toBe(false);
    vi.useRealTimers();
  });
});
