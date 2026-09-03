// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

function fire(node: Element, type: string, init: MouseEventInit = {}): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 5, clientY: 5, ...init });
  node.dispatchEvent(event);
  return event;
}

function mountNested() {
  const container = document.createElement('div');
  document.body.append(container);
  const viewer = mountViewer(container, { post: () => undefined });
  const evidence = { verdict: 'unclaimed', statuses: [], reused: false };
  viewer.load({
    protocolVersion: 1,
    run: { id: 'context-menu', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
    svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="workspace"><g data-element-id="component"><rect width="10" height="10"/></g></g></svg>',
    elements: {
      workspace: { id: 'workspace', kind: 'workspace', label: 'workspace', evidence, diagnosticIds: [] },
      component: { id: 'component', kind: 'component', label: 'the ingest component', parentId: 'workspace', evidence, diagnosticIds: [] },
    },
    diagnostics: [],
  });
  const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
  const menu = container.querySelector<HTMLElement>('.ply-context-menu')!;
  const component = container.querySelector<SVGElement>('[data-element-id="component"]')!;
  return { viewer, container, canvas, menu, component };
}

describe('right-click context menu', () => {
  it('names the item under the cursor and zooms into it exactly like a double-click, when its entry is chosen', () => {
    const { viewer, menu, component } = mountNested();

    fire(component, 'contextmenu');

    expect(menu.hidden).toBe(false);
    expect(menu.textContent).toContain('the ingest component');
    const entry = menu.querySelector<HTMLButtonElement>('button[role="menuitem"]')!;
    entry.click();

    expect(viewer.getState().focusedId).toBe('component');
    expect(menu.hidden).toBe(true);
    viewer.destroy();
  });

  it('suppresses the built-in context menu when right-clicking an item', () => {
    const { component } = mountNested();

    const event = fire(component, 'contextmenu');

    expect(event.defaultPrevented).toBe(true);
  });

  it('leaves double-click zooming in exactly as it worked before this feature existed', () => {
    const { viewer, component } = mountNested();

    component.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));

    expect(viewer.getState().focusedId).toBe('component');
    viewer.destroy();
  });

  it('closes on Escape', () => {
    const { menu, component } = mountNested();
    fire(component, 'contextmenu');
    expect(menu.hidden).toBe(false);

    menu.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape', cancelable: true }));

    expect(menu.hidden).toBe(true);
  });

  it('closes when the canvas is zoomed by scrolling, so it does not float over a drawing that has moved', () => {
    const { canvas, menu, component } = mountNested();
    fire(component, 'contextmenu');
    expect(menu.hidden).toBe(false);

    canvas.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }));

    expect(menu.hidden).toBe(true);
  });

  it('closes when the reader clicks elsewhere', () => {
    const { container, menu, component } = mountNested();
    fire(component, 'contextmenu');
    expect(menu.hidden).toBe(false);

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    expect(menu.hidden).toBe(true);
    expect(container).toBeDefined();
  });

  it('opens no menu and leaves the built-in menu alone when right-clicking empty canvas with nothing focused', () => {
    const { canvas, menu } = mountNested();

    const event = fire(canvas, 'contextmenu');

    expect(menu.hidden).toBe(true);
    expect(event.defaultPrevented).toBe(false);
  });

  it('offers only a way back out, worded like the breadcrumb trail, when right-clicking empty canvas while zoomed in', () => {
    const { viewer, canvas, menu, component } = mountNested();
    component.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(viewer.getState().focusedId).toBe('component');

    const event = fire(canvas, 'contextmenu');

    expect(event.defaultPrevented).toBe(true);
    expect(menu.hidden).toBe(false);
    const entries = [...menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]')];
    expect(entries).toHaveLength(1);
    expect(entries[0]!.textContent).toContain('Workspace');

    entries[0]!.click();

    expect(viewer.getState().focusedId).toBeUndefined();
    viewer.destroy();
  });
});
