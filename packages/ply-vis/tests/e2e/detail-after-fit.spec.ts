import { expect, test } from '@playwright/test';

// Opening a real document fits it to the window, which for a three-deep
// drawing lands around 40%. The level-of-detail rule was written against
// absolute zoom and starts folding below 80%, so the first thing a person
// saw when they opened a document was empty boxes with arrows pointing into
// them -- every nested box and every function hidden before they had done
// anything at all. Fitting a drawing is not a request to hide what is in it.
test('a document that has only just been fitted still shows what is in it', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/tests/harness/');
  const result = await page.evaluate(async () => {
    const w = window as any;
    w.viewer.load(w.realPlyRender);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const els = w.realPlyRender.elements as Record<string, any>;
    const painted = (el: Element | null) => {
      while (el) { if (getComputedStyle(el).display === 'none') return false; el = el.parentElement; }
      return true;
    };
    const hidden: string[] = [];
    for (const e of Object.values(els) as any[]) {
      const n = document.querySelector(`[data-element-id="${e.id}"]`);
      if (!n || !painted(n)) hidden.push(`${e.kind} ${e.label}`);
    }
    return { zoom: w.viewer.getState().zoom, total: Object.keys(els).length, hidden };
  });
  expect(
    result.hidden,
    `at the zoom the viewer itself chose (${Math.round(result.zoom * 100)}%), ` +
      `${result.hidden.length} of ${result.total} items were hidden before the reader touched anything`,
  ).toEqual([]);
});

// The other half, and the one that proves the fix is not just the feature
// switched off: pulling back from the fitted view must still fold detail.
test('pulling back from the fitted view still folds detail away', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/tests/harness/');
  const result = await page.evaluate(async () => {
    const w = window as any;
    w.viewer.load(w.realPlyRender);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const els = w.realPlyRender.elements as Record<string, any>;
    const depth = (e: any) => { let n = 0, c = e; while (c.parentId) { c = els[c.parentId]; n++; } return n; };
    const painted = (el: Element | null) => {
      while (el) { if (getComputedStyle(el).display === 'none') return false; el = el.parentElement; }
      return true;
    };
    const shownAtDepth = () => {
      const out: Record<number, number> = {};
      for (const e of Object.values(els) as any[]) {
        const n = document.querySelector(`[data-element-id="${e.id}"]`);
        if (n && painted(n)) out[depth(e)] = (out[depth(e)] || 0) + 1;
      }
      return out;
    };
    const fitted = shownAtDepth();
    const fittedZoom = w.viewer.getState().zoom;
    for (let i = 0; i < 10; i++) {
      (document.querySelector('button[aria-label="Zoom out"]') as HTMLButtonElement)?.click();
      if (w.viewer.getState().zoom <= fittedZoom * 0.45) break;
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { fitted, pulledBack: shownAtDepth() };
  });
  expect(result.fitted[3] ?? 0, 'the deepest items show when fitted').toBeGreaterThan(0);
  expect(result.pulledBack[3] ?? 0, 'and are folded away once the reader pulls back').toBe(0);
  expect(result.pulledBack[1] ?? 0, 'while the top-level boxes stay').toBeGreaterThan(0);
});
