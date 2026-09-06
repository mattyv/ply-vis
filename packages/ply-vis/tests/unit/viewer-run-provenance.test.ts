// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

// A reader looking at a drawing needs to know whether it still describes
// what today's Ply would find. The run records the build that made it; the
// host says which build is installed; the viewer reports the difference as
// a fact and leaves the conclusion alone.
const RAN_BY = 'd0a489779afde70b82c986de8e2ed3c06e4848b990ef3886cdeb6e160f212958';
const INSTALLED = 'fb53f5c0fd85e6ae5d08b7849881bcc8d5a41a6345d01fd2618be62b64e2274b';

const envelope = (version: string) => ({
  protocolVersion: 1 as const,
  run: {
    id: '1788168166-166428000-17374', completedAt: '2026-08-31T09:22:46Z',
    root: { path: '.' }, tool: { name: 'cargo-ply', version },
    outcome: 'violation' as const,
  },
  svg: '<svg xmlns="http://www.w3.org/2000/svg"><g data-element-id="a"><rect width="10" height="10"/></g></svg>',
  elements: {
    a: { id: 'a', kind: 'component' as const, label: 'A', evidence: { verdict: 'violation', statuses: [], reused: false, state: 'violation' }, diagnosticIds: [] },
  },
  diagnostics: [],
});

const mount = (version: string, installed?: string) => {
  const container = document.createElement('div');
  document.body.append(container);
  const viewer = mountViewer(container, { post: () => undefined });
  if (installed !== undefined) {
    window.dispatchEvent(new MessageEvent('message', {
      data: { channel: 'ply-vis', version: 1, type: 'capabilities', explain: false, installedTool: installed },
    }));
  }
  viewer.load(envelope(version));
  return { container, viewer, text: () => container.querySelector('.ply-provenance')!.textContent ?? '' };
};

describe('saying whether the drawing still describes today', () => {
  it('reports a different build as a fact, never ranking the two', () => {
    const { viewer, text } = mount(RAN_BY, INSTALLED);
    expect(text()).toContain('Ply itself has changed since this run');
    for (const forbidden of ['older', 'newer', 'stale', 'outdated']) {
      expect(text().toLowerCase()).not.toContain(forbidden);
    }
    viewer.destroy();
  });

  it('says nothing about the build when it matches the installed one', () => {
    const { viewer, text } = mount(INSTALLED, INSTALLED);
    expect(text()).not.toContain('Ply itself has changed');
    expect(text()).toContain('run');
    viewer.destroy();
  });

  it('says nothing when the host never told it which Ply is installed', () => {
    const { viewer, text } = mount(RAN_BY);
    expect(text()).not.toContain('Ply itself has changed');
    viewer.destroy();
  });
});
