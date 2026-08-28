import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('packages/vscode/package.json', root), 'utf8'));
const workspace = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const workflow = await readFile(new URL('.github/workflows/ci.yml', root), 'utf8');

test('VS Code manifest has a stable installable identity', () => {
  assert.equal(manifest.publisher, 'mattyv');
  assert.equal(manifest.name, 'ply-vis');
  assert.equal(manifest.contributes.viewsContainers.activitybar[0].id, 'plyVisuals');
});

test('VS Code activates without recursively searching for ply.yaml', () => {
  assert.ok(!manifest.activationEvents.some((event) => event.startsWith('workspaceContains:')));
});

test('completed visual runs offer an Open in New Tab context action', () => {
  assert.ok(manifest.contributes.commands.some(({ command, title }) => command === 'ply.openVisualInNewTab' && title === 'Open in New Tab'));
  assert.ok(manifest.contributes.menus['view/item/context'].some(({ command, when }) => command === 'ply.openVisualInNewTab' && when.includes('viewItem == ply.visualRun')));
});

test('local package and install commands are part of the product workflow', () => {
  assert.equal(workspace.scripts['package:local'], 'node scripts/package-local.mjs');
  assert.equal(workspace.scripts['install:local'], 'node scripts/install-local.mjs');
});

test('CI retains installable VS Code and JetBrains packages and releases tags', () => {
  assert.match(workflow, /name: ply-vscode-extension/);
  assert.match(workflow, /name: ply-jetbrains-plugin/);
  assert.match(workflow, /gh release create/);
});
