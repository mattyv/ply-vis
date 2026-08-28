import { describe, expect, it } from 'vitest';
import { firstUseMessage } from './first-use';

describe('Ply first-use messages', () => {
  it('distinguishes no specs from specs with no completed runs', () => {
    expect(firstUseMessage(false)).toBe('No Ply specs found in this workspace.');
    expect(firstUseMessage(true)).toBe('Ply specs found, but no completed visual runs have been published yet. Run `cargo ply verify <root> --publish-view` to publish one.');
  });
});
