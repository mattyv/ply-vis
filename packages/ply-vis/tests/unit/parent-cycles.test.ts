// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { parseEnvelope, type VisualElement } from '../../src/protocol/envelope';
import { mountViewer } from '../../src/viewer/viewer';
import { ancestry } from '../../src/viewer/ancestry';

const element = (id: string, parentId?: string) => ({
  id, kind: 'component', label: id,
  evidence: { verdict: 'earned', statuses: [], reused: false },
  diagnosticIds: [],
  ...(parentId ? { parentId } : {}),
});

/** The drawing has to *contain* the elements, or the ancestry walks never
 *  run and a hang test passes for the wrong reason -- which the first draft
 *  of this file did, in 53ms. */
const envelopeWith = (elements: Record<string, unknown>) => ({
  protocolVersion: 1,
  run: { id: 'r', completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">${
    Object.keys(elements).map((id) => `<g data-element-id="${id}"><rect width="10" height="10" fill="#fff"/></g>`).join('')
  }</svg>`,
  elements,
  diagnostics: [],
});

/**
 * The parser checked that every `parentId` names an element that exists. It
 * did not check that following those links ever ends.
 *
 * `a.parentId = b` and `b.parentId = a` passed validation, and the two
 * unbounded ancestry walks in the viewer -- the one that computes how deep
 * an element sits, and the one that builds the breadcrumb trail -- then
 * looped forever. Loading never returned. A viewer that hangs is worse than
 * one that refuses: the reader has no drawing *and* no way to ask for
 * another.
 *
 * Reported and reproduced by external review, 2026-09-06.
 */
describe('parent cycles', () => {
  it('are refused rather than drawn', () => {
    expect(() => parseEnvelope(envelopeWith({
      a: element('a', 'b'),
      b: element('b', 'a'),
    }))).toThrow(/cycle/i);
  });

  it('are refused however long the loop is', () => {
    expect(() => parseEnvelope(envelopeWith({
      a: element('a', 'b'),
      b: element('b', 'c'),
      c: element('c', 'a'),
    }))).toThrow(/cycle/i);
  });

  it('are refused when an element is its own parent', () => {
    expect(() => parseEnvelope(envelopeWith({
      a: element('a', 'a'),
    }))).toThrow(/cycle/i);
  });

  // The shape that must keep working: an ordinary nesting chain.
  it('leave an ordinary tree alone', () => {
    const parsed = parseEnvelope(envelopeWith({
      root: element('root'),
      mid: element('mid', 'root'),
      leaf: element('leaf', 'mid'),
    }));
    expect(Object.keys(parsed.elements).sort()).toEqual(['leaf', 'mid', 'root']);
  });

  // And the viewer must come back rather than hang when handed one. 2000ms
  // is far above the milliseconds a real load takes and far below the "never"
  // a cycle used to take.
  it('do not hang the viewer if one reaches it', { timeout: 2000 }, () => {
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: () => undefined });
    expect(viewer.load(envelopeWith({ a: element('a', 'b'), b: element('b', 'a') }))).toBe(false);
    expect(container.textContent).toMatch(/cycle/i);
    viewer.destroy();
  });

  // The walks are bounded separately from the parser, and tested separately,
  // because they fail differently: the parser refusing is what a reader sees,
  // and the bound is what keeps a caller safe if any other path ever builds an
  // element map without going through it. Going through `load` cannot show the
  // bound working -- the parser now stops the envelope first, so that test
  // would pass whether the walks were bounded or not.
  it('leave the walk up the nesting chain bounded', { timeout: 2000 }, () => {
    const elements = { a: element('a', 'b'), b: element('b', 'a') } as never;
    expect([...ancestry(elements.a, elements)].map((e: VisualElement) => e.id)).toEqual(['a', 'b']);
  });

  it('leave an ordinary chain walked in full', () => {
    const elements = { root: element('root'), mid: element('mid', 'root'), leaf: element('leaf', 'mid') } as never;
    expect([...ancestry(elements.leaf, elements)].map((e: VisualElement) => e.id)).toEqual(['leaf', 'mid', 'root']);
  });
});
