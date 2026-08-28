import { chromium } from '@playwright/test';

const endpoint = process.env.PLY_JCEF_CDP ?? 'http://127.0.0.1:9222';
const timeout = Number(process.env.PLY_JCEF_TIMEOUT_MS ?? 30_000);
const browser = await chromium.connectOverCDP(endpoint);
try {
  const deadline = Date.now() + timeout;
  let page;
  while (!page && Date.now() < deadline) {
    for (const candidate of browser.contexts().flatMap((context) => context.pages())) {
      if (await candidate.locator('body[data-ply-jetbrains="true"]').count()) {
        page = candidate;
        break;
      }
    }
    if (!page) await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!page) throw new Error(`No Ply JCEF page found at ${endpoint}; open the Ply tool window first`);

  await page.getByRole('region', { name: 'Ply visual evidence viewer' }).waitFor({ timeout });
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByText(/Zoom 120%/).waitFor();

  const node = page.locator('[data-element-id], [data-ply-id]').first();
  await node.waitFor({ timeout });
  await node.click();
  await page.getByRole('heading', { name: 'Declaration' }).waitFor();
  await node.dblclick();
  if (await page.getByRole('navigation', { name: 'Semantic focus' }).getByRole('button').count() < 2) {
    throw new Error('Double-click did not focus the selected visual element');
  }

  const messages = await page.evaluate(() => window.__plyTestHostMessages ?? []);
  if (!messages.some((message) => message.channel === 'ply-vis' && message.type === 'ready')) {
    throw new Error('The viewer did not complete the typed JCEF host handshake');
  }
  if (!messages.some((message) => message.channel === 'ply-vis' && message.type === 'persist-state')) {
    throw new Error('Zoom did not persist through the JCEF host bridge');
  }

  await page.getByRole('navigation', { name: 'Semantic focus' }).getByRole('button', { name: 'Workspace' }).click();
  const source = page.getByRole('button', { name: /^Open / });
  const nodes = page.locator('[data-element-id], [data-ply-id]');
  for (let index = 0; index < await nodes.count() && !await source.count(); index += 1) {
    await nodes.nth(index).click();
  }
  if (!await source.count()) {
    throw new Error('The smoke-test artifact needs at least one recorded source location');
  }
  await source.first().click();
  const after = await page.evaluate(() => window.__plyTestHostMessages ?? []);
  if (!after.some((message) => message.channel === 'ply-vis' && message.type === 'navigate')) {
    throw new Error('Source navigation did not cross the typed JCEF host bridge');
  }
  console.log('Ply JCEF smoke test passed');
} finally {
  await browser.close();
}
