// Run: node docs/spikes/3d-layouts/check.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('http://spike.test/', route => route.fulfill({
    contentType: 'text/html',
    body: html.replace('fontsReady.then(start);', `fontsReady.then(() => {
      start();
      window.spike = { nodes, root, camera, orbit, edgeGroup, worldPos, facePanes,
        applyCamera, applyLayout, buildEdges, showsConnections,
        layout: () => currentLayout, transitioning: () => tween !== null, spinning: () => spin !== null,
        selected: () => selectedId,
        select(id) { selectedId = id; buildEdges(); } };
    });`),
  }));
  await page.goto('http://spike.test/');
  await page.waitForFunction(() => window.spike);
  assert.equal(await page.evaluate(() => document.characterSet), 'UTF-8');
  assert.equal(await page.evaluate(() => spike.edgeGroup.children.length), 0);
  await page.evaluate(() => {
    const s = spike;
    for (const az of [0, 1.7, 3.8, 6.1]) {
      s.root.rotation.y = az / 2;
      s.orbit.az = az; s.orbit.el = 0.65;
      s.applyCamera(); s.facePanes();
      s.root.updateMatrixWorld(true);
      for (const rec of s.nodes.values()) {
        const q = rec.mesh.getWorldQuaternion(new THREE.Quaternion());
        if (1 - Math.abs(q.dot(s.camera.quaternion)) > 1e-8) throw Error('Card turned away');
        const anchor = s.root.localToWorld(s.worldPos(rec.node.id, 'flow'));
        if (anchor.distanceTo(rec.mesh.getWorldPosition(new THREE.Vector3())) > 1e-8)
          throw Error('Connection detached during rotation');
      }
    }
    s.select('ingest');
    if (!s.showsConnections('ingest.feed', 'venue') || s.showsConnections('oms', 'gateway'))
      throw Error('Selection filter failed');
  });
  assert.ok(await page.evaluate(() => spike.edgeGroup.children.length > 0));
  await page.evaluate(() => {
    spike.root.rotation.y = 0;
    spike.orbit.az = 0.45; spike.orbit.el = 0.48;
    spike.applyCamera(); spike.facePanes();
  });
  const clickPoint = await page.evaluate(() => {
    const p = spike.nodes.get('oms').mesh.getWorldPosition(new THREE.Vector3()).project(spike.camera);
    return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
  });
  await page.mouse.click(clickPoint.x, clickPoint.y);
  await page.waitForFunction(() => spike.selected() === 'oms');
  await page.waitForFunction(() => !spike.spinning());
  assert.ok(await page.evaluate(() => Math.abs(spike.root.rotation.y - (0.45 - Math.PI)) < 1e-6));
  await page.getByLabel('All connections', { exact: true }).focus();
  await page.keyboard.press('Space');
  assert.equal(await page.getByLabel('All connections', { exact: true }).isChecked(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => spike.edgeGroup.children.length), 0);
  await page.getByLabel('All connections', { exact: true }).check();
  assert.ok(await page.evaluate(() => spike.edgeGroup.children.length > 40));
  await page.keyboard.press('Escape');
  for (const layout of ['sheets', 'cube', 'flat', 'cone']) {
    await page.evaluate(k => spike.applyLayout(k, false), layout);
  }
  await page.getByRole('button', { name: 'Stacked sheets' }).click();
  await page.waitForFunction(() => spike.layout() === 'sheets' && !spike.transitioning());
  await page.getByRole('button', { name: 'Cone tree' }).click();
  await page.waitForFunction(() => spike.layout() === 'cone' && !spike.transitioning());
  await page.screenshot({ path: '/tmp/ply-cone-layout.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: camera-facing cards, rotated anchors, selection, Escape, all connections, UI layout transitions.');
} finally {
  await browser.close();
}
