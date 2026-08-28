import { describe, expect, it } from 'vitest';
import { createNonce, webviewHtml } from './webview-html';
describe('webview shell', () => {
  it('uses only local assets under a nonce-bound strict CSP', () => {
    const html = webviewHtml({ scriptUri: 'vscode-resource:index.js', styleUri: 'vscode-resource:styles.css', cspSource: 'vscode-webview:', nonce: 'abc123' });
    expect(html).toContain("default-src 'none'"); expect(html).toContain("script-src 'nonce-abc123'");
    expect(html).not.toMatch(/https?:\/\//); expect(html).toContain('window.__plyHost');
  });
  it('creates a stable hex nonce', () => { expect(createNonce(new Uint8Array([0, 15, 255]))).toBe('000fff'); });
});
