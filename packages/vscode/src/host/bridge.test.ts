import { describe, expect, it } from 'vitest';
import { parseViewerRequest } from './bridge';

const base = { channel: 'ply-vis', version: 1 } as const;
describe('viewer bridge validation', () => {
  it('accepts only known, exact messages', () => {
    expect(parseViewerRequest({ ...base, type: 'ready' })).toEqual({ ...base, type: 'ready' });
    expect(parseViewerRequest({ ...base, type: 'ready', surprise: true })).toBeUndefined();
    expect(parseViewerRequest({ ...base, type: 'run-ply' })).toBeUndefined();
  });
  it('requires a complete exact source range and never infers one', () => {
    expect(parseViewerRequest({ ...base, type: 'navigate', source: { file: 'src/lib.rs', startLine: 0, startColumn: 0, endLine: 0, endColumn: 7 } })?.type).toBe('navigate');
    expect(parseViewerRequest({ ...base, type: 'navigate', source: { file: 'src/lib.rs', startLine: 0, startColumn: 0 } })).toBeUndefined();
  });
});
