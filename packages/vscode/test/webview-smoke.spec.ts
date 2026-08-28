import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('the compiled viewer boots inside the VS Code host bridge', async ({ page }) => {
  const messages: unknown[] = [];
  await page.exposeFunction('capturePlyMessage', (message: unknown) => { messages.push(message); });
  await page.setContent('<div id="root"></div>');
  await page.evaluate(() => {
    const host = { protocolVersion: 1, postMessage: (message: unknown) => (window as unknown as { capturePlyMessage(message: unknown): void }).capturePlyMessage(message), getState: () => ({}), setState: () => undefined };
    (window as unknown as { __plyHost: unknown }).__plyHost = host;
  });
  const viewer = await readFile(resolve(__dirname, '../media/ply-vis/index.js'), 'utf8');
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(viewer).toString('base64')}`;
  await page.evaluate(async (url) => {
    const viewerModule = await import(url) as { mountViewer(container: HTMLElement, bridge: { post(message: unknown): void }): unknown };
    const host = (window as unknown as { __plyHost: { postMessage(message: unknown): void } }).__plyHost;
    viewerModule.mountViewer(document.getElementById('root')!, { post: (message) => host.postMessage(message) });
  }, moduleUrl);
  await expect(page.locator('#root')).toBeAttached();
  await expect.poll(() => messages.some((message) => typeof message === 'object' && message !== null && (message as { type?: string }).type === 'ready')).toBe(true);
});
