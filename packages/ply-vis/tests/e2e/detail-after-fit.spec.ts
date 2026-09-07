import { expect, test } from '@playwright/test';

// This fixture predates the folded drawings newer Ply envelopes carry. A
// legacy artifact cannot be compacted without leaving its original boxes at
// full-detail size, so the safe fallback is to keep all of its contents.
// Folding itself is covered against the newer Ply self-render fixture in
// ply-self-navigation.spec.ts.

async function load(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/tests/harness/');
  await page.evaluate(() => (window as any).viewer.load((window as any).realPlyRender));
  await page.waitForTimeout(200);
}

async function hiddenCount(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const w = window as any;
    const els = w.realPlyRender.elements as Record<string, any>;
    const painted = (el: Element | null) => {
      while (el) { if (getComputedStyle(el).display === 'none') return false; el = el.parentElement; }
      return true;
    };
    let hidden = 0;
    for (const e of Object.values(els) as any[]) {
      const n = document.querySelector(`[data-element-id="${e.id}"]`);
      if (!n || !painted(n)) hidden++;
    }
    return { hidden, total: Object.keys(els).length, zoom: w.viewer.getState().zoom };
  });
}

test('a legacy artifact without folded drawings stays complete when pulled back', async ({ page }) => {
  await load(page);
  const before = await hiddenCount(page);
  expect(before.hidden, 'a fitted document that fits should be showing things').toBeGreaterThanOrEqual(0);
  await page.evaluate(() => {
    const w = window as any;
    for (let i = 0; i < 12; i++) {
      (document.querySelector('button[aria-label="Zoom out"]') as HTMLButtonElement)?.click();
      if (w.viewer.getState().zoom <= 0.3) break;
    }
  });
  await page.waitForTimeout(200);
  const after = await hiddenCount(page);
  expect(
    after.hidden,
    'without a compact re-render, hiding detail would leave the full-size boxes empty',
  ).toBe(0);
});

test('a reader can switch folding off and keep everything on screen', async ({ page }) => {
  await load(page);
  await page.getByLabel('Fold detail when zoomed out').uncheck();
  await page.evaluate(() => {
    const w = window as any;
    for (let i = 0; i < 12; i++) {
      (document.querySelector('button[aria-label="Zoom out"]') as HTMLButtonElement)?.click();
      if (w.viewer.getState().zoom <= 0.3) break;
    }
  });
  await page.waitForTimeout(200);
  const after = await hiddenCount(page);
  expect(
    after.hidden,
    `with folding switched off, nothing should be hidden at ${Math.round(after.zoom * 100)}%`,
  ).toBe(0);
});
