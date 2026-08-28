// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../../src/protocol/sanitize';

describe('SVG sanitization', () => {
  it('removes executable and external content while preserving local geometry', () => {
    const clean = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" onload="pwn()"><script>pwn()</script><style>@import "https://attacker.invalid/a.css"</style><animate attributeName="href" values="javascript:pwn()"/><foreignObject><div>bad</div></foreignObject><image href="file:///etc/passwd"/><a href="javascript:pwn()"><rect data-element-id="safe" width="10" height="10" fill="url(https://attacker.invalid/x)" style="fill:red" onclick="pwn()"/></a></svg>`);
    expect(clean).toContain('data-element-id="safe"');
    expect(clean).not.toMatch(/script|foreignObject|attacker|javascript|onload|onclick|style=/i);
  });
  it('rejects malformed or non-SVG documents', () => {
    expect(() => sanitizeSvg('<svg><g></svg>')).toThrow('invalid SVG');
    expect(() => sanitizeSvg('<html/>')).toThrow('invalid SVG');
  });
});
