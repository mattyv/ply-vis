#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(projectRoot, 'packages', 'vscode', 'package.json'), 'utf8'));
const output = path.join(projectRoot, `ply-vis-${manifest.version}.vsix`);

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: capture ? 'utf8' : undefined,
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  return capture ? result.stdout : '';
}

run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'package:local', '--', output]);
run(process.platform === 'win32' ? 'code.cmd' : 'code', ['--install-extension', output, '--force']);
const extensions = run(process.platform === 'win32' ? 'code.cmd' : 'code', ['--list-extensions', '--show-versions'], true);
const expected = `${manifest.publisher}.${manifest.name}@${manifest.version}`.toLowerCase();
if (!extensions.split(/\r?\n/).some((line) => line.trim().toLowerCase() === expected)) {
  throw new Error(`VS Code did not report ${expected} after installation.`);
}
process.stdout.write(`Installed ${expected}. Reload VS Code to show the Ply Activity Bar icon.\n`);
