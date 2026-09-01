import { expect, test } from '@playwright/test';

// Every other focus test in this repository draws its own SVG: a flat list of
// `<g data-element-id>` sitting directly under `<svg>`. Ply does not emit that
// shape. It wraps each top-level box in an untagged `<g transform="translate(...)">`,
// so the thing you focus is a grandchild of the drawing, not a child of it.
// These run against a drawing `cargo ply render --json` actually produced.
//
// They also assert what a person would see rather than what the DOM says: an
// element can keep every attribute the viewer sets on it and still be invisible
// because something above it was switched off. That is the failure this file
// exists to catch, so measuring the painted box is the whole point.
//
// Regenerate the drawing they run against with:
//   cargo ply render <a ply.yaml with a box inside a box> --json \
//     > packages/ply-vis/tests/fixtures/real-ply-render.json

async function loadRealDrawing(page: import('@playwright/test').Page) {
  await page.goto('/tests/harness/');
  await page.evaluate(() => {
    const w = window as unknown as { viewer: { load: (e: unknown) => void }; realPlyRender: unknown };
    w.viewer.load(w.realPlyRender);
  });
}

async function focusAndMeasure(page: import('@playwright/test').Page, pick: 'nested-fn' | 'nested-component') {
  return page.evaluate(async (which) => {
    const w = window as unknown as { realPlyRender: any; viewer: { getState: () => any } };
    const elements = w.realPlyRender.elements as Record<string, any>;
    const target = Object.values(elements).find((element: any) =>
      which === 'nested-fn'
        ? element.kind === 'fn' && elements[element.parentId]?.label === 'decoder'
        : element.kind === 'component' && element.label === 'decoder',
    );
    const node = document.querySelector(`[data-element-id="${target.id}"]`);
    node!.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const after = document.querySelector(`[data-element-id="${target.id}"]`)!;
    const box = after.getBoundingClientRect();
    let ancestor: Element | null = after;
    let switchedOffBy: string | undefined;
    while (ancestor && !switchedOffBy) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility === 'hidden') {
        switchedOffBy = `${ancestor.tagName}${ancestor.getAttribute('transform') ? ` transform=${ancestor.getAttribute('transform')}` : ''}${ancestor.getAttribute('class') ? ` class=${ancestor.getAttribute('class')}` : ''}`;
      }
      ancestor = ancestor.parentElement;
    }
    return { label: target.label, width: box.width, height: box.height, switchedOffBy };
  }, pick);
}

test('a function focused inside a nested box is still on screen', async ({ page }) => {
  await loadRealDrawing(page);
  const result = await focusAndMeasure(page, 'nested-fn');
  expect(
    result.switchedOffBy,
    `focusing \`${result.label}\` should leave it on screen, but it was switched off by ${result.switchedOffBy}`,
  ).toBeUndefined();
  expect(result.width, 'the focused function should occupy real space on screen').toBeGreaterThan(0);
  expect(result.height, 'the focused function should occupy real space on screen').toBeGreaterThan(0);
});

test('a nested box that is focused is still on screen', async ({ page }) => {
  await loadRealDrawing(page);
  const result = await focusAndMeasure(page, 'nested-component');
  expect(
    result.switchedOffBy,
    `focusing \`${result.label}\` should leave it on screen, but it was switched off by ${result.switchedOffBy}`,
  ).toBeUndefined();
  expect(result.width, 'the focused box should occupy real space on screen').toBeGreaterThan(0);
  expect(result.height, 'the focused box should occupy real space on screen').toBeGreaterThan(0);
});

test('focusing still puts unrelated boxes away', async ({ page }) => {
  await loadRealDrawing(page);
  await focusAndMeasure(page, 'nested-component');
  const unrelated = await page.evaluate(() => {
    const w = window as unknown as { realPlyRender: any };
    const elements = w.realPlyRender.elements as Record<string, any>;
    const orders = Object.values(elements).find((element: any) => element.label === 'orders') as any;
    const node = document.querySelector(`[data-element-id="${orders.id}"]`)!;
    return { hidden: node.hasAttribute('hidden'), width: node.getBoundingClientRect().width };
  });
  expect(unrelated.hidden, 'a box outside the focus should be put away, not left on screen').toBe(true);
  expect(unrelated.width).toBe(0);
});
