import { mountViewer } from './ply-vis/index.js';

const root = document.getElementById('root');
const host = window.__plyHost;
if (!root || !host || host.protocolVersion !== 1 || typeof host.postMessage !== 'function') {
  throw new Error('The Ply VS Code host bridge is unavailable or incompatible.');
}
mountViewer(root, { post: (message) => host.postMessage(message) });
