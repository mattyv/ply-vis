import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceViewer = resolve(packageRoot, '..', 'ply-vis', 'dist');
const destination = join(packageRoot, 'media', 'ply-vis');
async function directoryExists(path) {
  try { return (await stat(path)).isDirectory(); } catch { return false; }
}
if (!(await directoryExists(workspaceViewer))) {
  throw new Error('Build @ply/vis first; its dist directory is the pinned viewer input.');
}
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(workspaceViewer, destination, { recursive: true });
if (!(await readdir(destination)).some((name) => name.endsWith('.js'))) {
  throw new Error('The pinned @ply/vis build contains no JavaScript entry asset.');
}
