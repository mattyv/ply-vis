import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/tests/harness/'); });

test('boots offline with every supplied visual state and accessible controls', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Ply visual evidence viewer' })).toBeVisible();
  await expect(page.locator('[data-state="earned"]')).toHaveCount(2);
  await expect(page.locator('[data-state="gap"]')).toHaveCount(1);
  await expect(page.locator('[data-state="violation"]')).toHaveCount(1);
  await expect(page.locator('[data-element-id="workspace"] rect')).toHaveCSS('fill', 'rgb(238, 242, 246)');
  await expect(page.locator('[data-state="gap"]')).toHaveCSS('outline-style', 'dashed');
  await expect(page.locator('[data-state="violation"]')).toHaveCSS('outline-style', 'double');
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light dark');
  await page.locator('html').evaluate((element) => { element.style.fontSize = '24px'; });
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
});

test('zooms, pans, fits, filters overlays, and restores immutable view state', async ({ page }) => {
  const stage = page.locator('.ply-stage');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(stage).toHaveCSS('transform', /matrix\(1\.2/);
  const canvas = page.locator('.ply-canvas');
  await canvas.evaluate((element) => {
    element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, clientX: 100, clientY: 100 }));
    element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 130, clientY: 140 }));
    element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 130, clientY: 140 }));
  });
  await expect(stage).toHaveCSS('transform', /matrix\(1\.2, 0, 0, 1\.2, 30, 40\)/);
  await page.getByRole('button', { name: 'Fit canvas' }).click();
  await expect(stage).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, 0\)/);
  await page.getByRole('checkbox', { name: 'Gap', exact: true }).uncheck(); await expect(page.locator('[data-element-id="component"]')).toBeHidden();
  await page.evaluate(() => window.postMessage({ channel: 'ply-vis', version: 1, type: 'restore-state', state: { zoom: 2, panX: 12, panY: 18, overlays: { earned: true, gap: true, violation: true }, selectedId: 'function', focusedId: 'component', runId: 'run-001' } }, '*'));
  await expect(stage).toHaveCSS('transform', /matrix\(2, 0, 0, 2, 12, 18\)/);
  await expect(page.getByRole('heading', { name: 'settle' })).toBeVisible();
});

test('semantic focus, selection, inspector, and exact source navigation use stable IDs', async ({ page }) => {
  await page.locator('[data-element-id="component"]').dispatchEvent('dblclick');
  await expect(page.getByRole('navigation', { name: 'Semantic focus' }).getByText('Ledger')).toBeVisible();
  await page.locator('[data-element-id="function"]').click();
  await expect(page.getByRole('heading', { name: 'settle' })).toBeVisible();
  await expect(page.locator('.ply-inspector').getByText('cases: 101', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Open src\/ledger.rs/ }).click();
  const navigate = await page.evaluate(() => (window as any).messages.find((message: any) => message.type === 'navigate'));
  expect(navigate.source).toEqual({ file: 'src/ledger.rs', startLine: 41, startColumn: 4, endLine: 57, endColumn: 5 });
});

test('shows an accessible first-party tooltip on node hover and keyboard focus', async ({ page }) => {
  const node = page.locator('[data-element-id="contract"]');
  const tooltip = page.getByRole('tooltip');

  await node.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('amount stays positive');
  await expect(tooltip).toContainText('Verdict: violation');
  await expect(tooltip).toContainText('E1001 — error: A counterexample returned a negative amount.');
  await expect(node).toHaveAttribute('aria-describedby', 'ply-vis-tooltip');

  const position = await tooltip.evaluate((element) => {
    const tip = element.getBoundingClientRect();
    const canvas = element.parentElement!.getBoundingClientRect();
    return {
      left: tip.left - canvas.left,
      top: tip.top - canvas.top,
      right: canvas.right - tip.right,
      bottom: canvas.bottom - tip.bottom,
    };
  });
  expect(position.left).toBeGreaterThanOrEqual(0);
  expect(position.top).toBeGreaterThanOrEqual(0);
  expect(position.right).toBeGreaterThanOrEqual(0);
  expect(position.bottom).toBeGreaterThanOrEqual(0);

  await page.locator('.ply-toolbar').hover();
  await expect(tooltip).toBeHidden();
  await expect(node).not.toHaveAttribute('aria-describedby', 'ply-vis-tooltip');

  const canvas = page.locator('.ply-canvas');
  await page.locator('[data-element-id="component"]').dispatchEvent('dblclick');
  await canvas.focus();
  await canvas.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(node).toBeFocused();
  await expect(node).toHaveAttribute('tabindex', '0');
  await expect(tooltip).toBeVisible();
  await expect(node).toHaveAttribute('aria-describedby', 'ply-vis-tooltip');
  await page.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  expect(await page.evaluate(() => (window as any).viewer.getState().focusedId)).toBe('component');

  await canvas.focus();
  await canvas.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(tooltip).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in' }).focus();
  await expect(tooltip).toBeHidden();
});

test('retains the last good snapshot after malformed, incompatible, and hostile artifacts', async ({ page }) => {
  for (const mutate of ['version', 'malformed', 'hostile']) {
    const accepted = await page.evaluate((kind) => {
      const value = structuredClone((window as any).fixture);
      if (kind === 'version') value.protocolVersion = 2;
      if (kind === 'malformed') delete value.run.root;
      if (kind === 'hostile') value.svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>window.pwned=1</script><style>@import "https://attacker.invalid/a.css"</style><animate attributeName="href" values="javascript:pwn()"/><foreignObject><p>bad</p></foreignObject><image href="https://attacker.invalid/x"/><g data-element-id="workspace" onclick="window.pwned=1"><rect width="5" height="5" fill="url(https://attacker.invalid/fill)"/></g></svg>';
      return (window as any).viewer.load(value);
    }, mutate);
    if (mutate === 'hostile') expect(accepted).toBe(true); else expect(accepted).toBe(false);
    await expect(page.getByRole('heading', { name: 'Details' })).toBeVisible();
  }
  await expect(page.locator('script').filter({ hasText: 'pwned' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).pwned)).toBeUndefined();
  await expect(page.locator('foreignObject, image[href]')).toHaveCount(0);
});

test('keyboard navigation selects and focuses semantically', async ({ page }) => {
  const canvas = page.locator('.ply-canvas'); await canvas.focus(); await canvas.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Ledger' })).toBeVisible();
  await canvas.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Semantic focus' }).getByText('Ledger')).toBeVisible();
  await canvas.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Semantic focus' }).getByText('Demo workspace')).toBeVisible();
});

test('reports runtime errors through the versioned bridge without discarding the snapshot', async ({ page }) => {
  await page.evaluate(() => window.dispatchEvent(new ErrorEvent('error', { message: 'fixture runtime failure' })));
  await expect(page.getByRole('status')).toContainText('fixture runtime failure');
  expect(await page.evaluate(() => (window as any).messages.some((message: any) => message.type === 'error' && message.message === 'fixture runtime failure'))).toBe(true);
  await expect(page.locator('[data-element-id="workspace"]')).toBeAttached();
});

test('selects among immutable supplied runs without drawing a graphical diff', async ({ page }) => {
  await page.evaluate(() => {
    const second = structuredClone((window as any).fixture);
    second.run.id = 'run-002'; second.run.completedAt = '2026-08-28T06:00:00Z';
    (window as any).viewer.load(second);
  });
  await expect(page.getByLabel('Run snapshot')).toHaveValue('run-002');
  await page.getByLabel('Run snapshot').selectOption('run-001');
  await expect(page.getByRole('status')).toHaveText('Showing run run-001');
  await expect(page.locator('[data-run-diff]')).toHaveCount(0);
});

test('opens 500 components and 5,000 functions within two seconds and focuses responsively', async ({ page }) => {
  const result = await page.evaluate(() => { const start = performance.now(); const accepted = (window as any).viewer.load((window as any).makeLargeFixture()); return { accepted, elapsed: performance.now() - start, status: document.querySelector('.ply-status')?.textContent }; });
  expect(result.accepted, result.status).toBe(true);
  const elapsed = result.elapsed;
  expect(elapsed).toBeLessThan(2000);
  await expect(page.locator('[data-element-id="c499-f9"]')).toBeAttached();
  const focusElapsed = await page.evaluate(() => { const start = performance.now(); (document.querySelector('[data-element-id="c499"]') as Element).dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); return performance.now() - start; });
  expect(focusElapsed).toBeLessThan(500);
  await expect(page.locator('[data-element-id="c0"]')).toBeHidden();
});
