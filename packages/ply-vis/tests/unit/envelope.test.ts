import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseEnvelope } from '../../src/protocol/envelope';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/canonical-v1.json', import.meta.url), 'utf8'));

describe('VisualEnvelope v1', () => {
  it('accepts the canonical immutable snapshot and exact zero-based source range', () => {
    const envelope = parseEnvelope(fixture);
    expect(envelope.elements.function?.source).toEqual({ file: 'src/ledger.rs', startLine: 41, startColumn: 4, endLine: 57, endColumn: 5 });
    expect(Object.isFrozen(envelope)).toBe(true);
    expect(Object.isFrozen(envelope.elements.function)).toBe(true);
    expect(envelope.elements.function?.evidence).toEqual({ verdict: 'earned', statuses: ['bounded'], reused: false, engine: 'bounded-check', cases: 101 });
    expect(Object.isFrozen(envelope.elements.function?.evidence)).toBe(true);
  });
  it.each([
    ['wrong version', { ...fixture, protocolVersion: 2 }],
    ['missing diagnostics', (({ diagnostics: _, ...rest }) => rest)(fixture)],
    ['mismatched stable id', { ...fixture, elements: { ...fixture.elements, function: { ...fixture.elements.function, id: 'other' } } }],
    ['unknown parent', { ...fixture, elements: { ...fixture.elements, function: { ...fixture.elements.function, parentId: 'missing' } } }],
    ['missing required evidence', { ...fixture, elements: { ...fixture.elements, function: (({ evidence: _, ...rest }) => rest)(fixture.elements.function) } }],
    ['missing diagnostic code', { ...fixture, diagnostics: [(({ code: _, ...rest }) => rest)(fixture.diagnostics[0])] }],
    ['unknown diagnostic element', { ...fixture, diagnostics: [{ ...fixture.diagnostics[0], elementId: 'missing' }] }],
    ['unsafe source path', { ...fixture, elements: { ...fixture.elements, function: { ...fixture.elements.function, source: { ...fixture.elements.function.source, file: '../Cargo.toml' } } } }],
    ['backwards source range', { ...fixture, elements: { ...fixture.elements, function: { ...fixture.elements.function, source: { file: 'x', startLine: 2, startColumn: 1, endLine: 1, endColumn: 1 } } } }],
    ['unknown evidence state', { ...fixture, elements: { ...fixture.elements, function: { ...fixture.elements.function, evidence: { ...fixture.elements.function.evidence, state: 'unclaimed' } } } }],
  ])('rejects %s atomically', (_name, value) => expect(() => parseEnvelope(value)).toThrow());
  it('carries the optional evidence state Ply computes, one of exactly the four published values', () => {
    const value = structuredClone(fixture);
    value.elements.function.evidence.state = 'earned';
    expect(parseEnvelope(value).elements.function?.evidence.state).toBe('earned');
  });
  it('reads an older envelope with no evidence state at all', () => {
    expect(parseEnvelope(fixture).elements.function?.evidence.state).toBeUndefined();
  });
  it('ignores safe additive element and diagnostic metadata', () => {
    const value = structuredClone(fixture);
    value.elements.function.futureField = { opaque: true };
    value.diagnostics[0].futureField = ['opaque'];
    expect(parseEnvelope(value).elements.function?.label).toBe('settle');
  });
});

describe('shorter drawings for less detail', () => {
  const base = {
    protocolVersion: 1,
    run: { id: 'r', completedAt: '2026-09-02T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 't' }, outcome: 'clean' },
    svg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    elements: {},
    diagnostics: [],
  };

  it('keeps the drawing offered for each level a reader can fold to', () => {
    const parsed = parseEnvelope({ ...base, folded: [{ depth: 1, svg: '<svg xmlns="http://www.w3.org/2000/svg" id="one"></svg>' }] });
    expect(parsed.folded).toEqual([{ depth: 1, svg: '<svg xmlns="http://www.w3.org/2000/svg" id="one"></svg>' }]);
  });

  it('reads an envelope that offers none, because most documents do not nest', () => {
    expect(parseEnvelope(base).folded).toEqual([]);
  });

  it('refuses a level that selects nothing, rather than drawing an empty picture', () => {
    expect(() => parseEnvelope({ ...base, folded: [{ depth: 0, svg: '<svg/>' }] })).toThrow();
  });
});
