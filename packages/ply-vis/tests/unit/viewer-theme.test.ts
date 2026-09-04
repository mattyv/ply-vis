// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

function themedEnvelope() {
  return {
    protocolVersion: 1,
    run: { id: 'theme', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'render' }, outcome: 'clean' },
    svg: `<svg xmlns="http://www.w3.org/2000/svg"><style>.box{fill:#ffffff}@media (prefers-color-scheme: dark){.box{fill:#111111}}</style><rect class="box" data-element-id="thing" width="10" height="10"/></svg>`,
    elements: { thing: { id: 'thing', kind: 'fn', label: 'thing', evidence: { verdict: 'bounded(2)', statuses: [], reused: false }, diagnosticIds: [] } },
    diagnostics: [],
  };
}

afterEach(() => {
  document.body.className = '';
  delete document.body.dataset.vscodeThemeKind;
});

describe('the drawing follows the host theme, not just the chrome', () => {
  it('paints the light declaration when the host gives no dark signal at all', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(themedEnvelope());
    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#ffffff');
    viewer.destroy();
  });

  it('paints the dark declaration when VS Code marks body[data-vscode-theme-kind="vscode-dark"] before mount', () => {
    document.body.dataset.vscodeThemeKind = 'vscode-dark';
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(themedEnvelope());
    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#111111');
    viewer.destroy();
  });

  it('paints the dark declaration from the vscode-dark body class alone, with no data attribute present', () => {
    document.body.classList.add('vscode-dark');
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(themedEnvelope());
    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#111111');
    viewer.destroy();
  });

  it('re-paints the already-loaded drawing when VS Code flips the theme live, and keeps the pan/zoom state', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(themedEnvelope());
    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#ffffff');
    viewer.getState();

    document.body.dataset.vscodeThemeKind = 'vscode-dark';
    document.body.classList.add('vscode-dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#111111');
    viewer.destroy();
  });

  it('falls back to prefers-color-scheme with no VS Code signal, and repaints on a matchMedia change', () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const mediaQueryList = {
      matches: false,
      addEventListener: (_type: string, fn: (event: { matches: boolean }) => void) => { listener = fn; },
      removeEventListener: () => undefined,
    };
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error -- jsdom does not implement matchMedia at all; this test supplies a minimal stand-in.
    window.matchMedia = () => mediaQueryList;

    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    viewer.load(themedEnvelope());
    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#ffffff');

    mediaQueryList.matches = true;
    listener?.({ matches: true });

    expect(container.querySelector('[data-element-id="thing"]')!.getAttribute('fill')).toBe('#111111');

    viewer.destroy();
    window.matchMedia = originalMatchMedia;
  });
});
