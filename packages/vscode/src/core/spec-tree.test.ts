import { describe, expect, it } from 'vitest';
import { buildSpecTree } from './spec-tree';

describe('buildSpecTree', () => {
  it('groups every discovered spec into workspace-relative folders', () => {
    const tree = buildSpecTree(
      [{ name: 'ply', path: '/repo' }],
      [
        { name: 'ply: vetting/002-ingest.ply.yaml', path: '/repo/vetting', specPath: '/repo/vetting/002-ingest.ply.yaml' },
        { name: 'ply: demos/basic', path: '/repo/demos/basic' },
        { name: 'ply: vetting/001-spsc.ply.yaml', path: '/repo/vetting', specPath: '/repo/vetting/001-spsc.ply.yaml' },
      ],
    );

    expect(tree).toEqual([{
      kind: 'folder', name: 'ply', path: '/repo', children: [
        { kind: 'folder', name: 'demos', path: '/repo/demos', children: [
          { kind: 'folder', name: 'basic', path: '/repo/demos/basic', children: [
            { kind: 'spec', name: 'ply.yaml', path: '/repo/demos/basic/ply.yaml', root: { name: 'ply: demos/basic', path: '/repo/demos/basic' } },
          ] },
        ] },
        { kind: 'folder', name: 'vetting', path: '/repo/vetting', children: [
          { kind: 'spec', name: '001-spsc.ply.yaml', path: '/repo/vetting/001-spsc.ply.yaml', root: { name: 'ply: vetting/001-spsc.ply.yaml', path: '/repo/vetting', specPath: '/repo/vetting/001-spsc.ply.yaml' } },
          { kind: 'spec', name: '002-ingest.ply.yaml', path: '/repo/vetting/002-ingest.ply.yaml', root: { name: 'ply: vetting/002-ingest.ply.yaml', path: '/repo/vetting', specPath: '/repo/vetting/002-ingest.ply.yaml' } },
        ] },
      ],
    }]);
  });

  it('keeps separate workspace folders', () => {
    const tree = buildSpecTree(
      [{ name: 'one', path: '/one' }, { name: 'two', path: '/two' }],
      [{ name: 'one', path: '/one' }, { name: 'two', path: '/two' }],
    );
    expect(tree.map((node) => node.name)).toEqual(['one', 'two']);
  });
});
