#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const extensionRoot = path.join(projectRoot, 'packages', 'vscode');
const manifest = JSON.parse(await readFile(path.join(extensionRoot, 'package.json'), 'utf8'));
const output = path.resolve(process.argv[2] ?? path.join(projectRoot, `ply-vis-${manifest.version}.vsix`));

const packaged = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['--yes', '@vscode/vsce', 'package', '--no-dependencies', '--ignoreFile', '.vscodeignore', '--out', output],
  { cwd: extensionRoot, stdio: 'inherit' },
);
if (packaged.error) throw packaged.error;
if (packaged.status !== 0) throw new Error(`VSIX packaging failed with exit code ${packaged.status}`);

const listed = spawnSync('unzip', ['-Z1', output], { encoding: 'utf8' });
if (listed.error || listed.status !== 0) throw new Error('Could not inspect the packaged VSIX with unzip.');
const entries = new Set(listed.stdout.split(/\r?\n/).filter(Boolean));
const required = [
  'extension/package.json',
  'extension/out/src/extension.js',
  'extension/media/ply.svg',
  'extension/media/webview.js',
  'extension/media/ply-vis/index.js',
  'extension/media/ply-vis/styles.css',
];
const missing = required.filter((entry) => !entries.has(entry));
if (missing.length) throw new Error(`Refusing to use an incomplete VSIX. Missing:\n${missing.join('\n')}`);
process.stdout.write(`Packaged and verified ${output}\n`);
