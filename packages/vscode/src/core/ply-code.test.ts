import { describe, expect, it } from 'vitest';
import { isPlyCode, plyCode } from './ply-code';

describe('the code the explain menu will accept', () => {
  it('accepts a code in the shape Ply actually prints', () => {
    for (const code of ['W0532', 'P0502', 'E0203', 'A0417', 'V0508']) {
      expect(isPlyCode(code), code).toBe(true);
    }
  });

  // The value arrives from the webview and is then handed to a spawned
  // process, so anything that is not a code must be refused here rather than
  // passed along and explained by the shell.
  it('refuses anything that is not a code, including things that embed one', () => {
    for (const value of ['', 'W053', 'W05321', 'w0532', 'WW532', 'W0532 ', ' W0532', 'W0532; rm -rf /', '$(echo W0532)', 'W0532\nP0502', '--help']) {
      expect(isPlyCode(value), JSON.stringify(value)).toBe(false);
    }
  });

  it('reads the code off a right-click context and ignores the rest of it', () => {
    expect(plyCode({ webviewSection: 'plyDiagnostic', plyCode: 'W0532' })).toBe('W0532');
  });

  it('treats a context with no usable code as no code at all', () => {
    for (const value of [undefined, null, 'W0532', 42, {}, { plyCode: 42 }, { plyCode: 'not a code' }, { plyCode: '' }]) {
      expect(plyCode(value), JSON.stringify(value ?? null)).toBeUndefined();
    }
  });
});
