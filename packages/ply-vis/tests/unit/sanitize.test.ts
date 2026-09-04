// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../../src/protocol/sanitize';

describe('SVG sanitization', () => {
  it('preserves the safe class stylesheet emitted by Ply', () => {
    const clean = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><style>.workspace-frame{fill:#fbfbfd;stroke:#c8ccd4;stroke-width:2.5}.component-name{fill:#1f2430;font-weight:bold}.edge-label{fill:#3b4252;font-size:10px;text-anchor:middle}#arrow path{fill:#3b4252}</style><rect class="workspace-frame" width="10" height="10"/></svg>`);

    expect(clean).not.toContain('<style>');
    expect(clean).toContain('fill="#fbfbfd"');
    expect(clean).toContain('stroke="#c8ccd4"');
    expect(clean).toContain('stroke-width="2.5"');
  });

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

describe('dark-mode-aware sanitization', () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg"><style>.box{fill:#ffffff}@media (prefers-color-scheme: dark){.box{fill:#111111}}</style><rect class="box" data-element-id="thing" width="10" height="10"/></svg>`;

  it('inlines the light declaration when prefersDark is false', () => {
    const clean = sanitizeSvg(source, { prefersDark: false });
    const element = new DOMParser().parseFromString(clean, 'image/svg+xml').querySelector('[data-element-id="thing"]')!;
    expect(element.getAttribute('fill')).toBe('#ffffff');
  });

  it('inlines the dark declaration, applied after the light one, when prefersDark is true', () => {
    const clean = sanitizeSvg(source, { prefersDark: true });
    const element = new DOMParser().parseFromString(clean, 'image/svg+xml').querySelector('[data-element-id="thing"]')!;
    expect(element.getAttribute('fill')).toBe('#111111');
  });

  it('leaves existing (no options argument) behaviour exactly as before -- dark rules dropped', () => {
    const clean = sanitizeSvg(source);
    const element = new DOMParser().parseFromString(clean, 'image/svg+xml').querySelector('[data-element-id="thing"]')!;
    expect(element.getAttribute('fill')).toBe('#ffffff');
  });

  it('still drops a media query that is not prefers-color-scheme: dark, in both modes', () => {
    const printSource = `<svg xmlns="http://www.w3.org/2000/svg"><style>.box{fill:#ffffff}@media print{.box{fill:#000000}}</style><rect class="box" data-element-id="thing" width="10" height="10"/></svg>`;
    for (const prefersDark of [false, true]) {
      const clean = sanitizeSvg(printSource, { prefersDark });
      const element = new DOMParser().parseFromString(clean, 'image/svg+xml').querySelector('[data-element-id="thing"]')!;
      expect(element.getAttribute('fill')).toBe('#ffffff');
      expect(clean).not.toContain('#000000');
    }
  });

  it('rejects a disallowed property or value inside the dark block exactly as it would reject a base rule', () => {
    const unsafeSource = `<svg xmlns="http://www.w3.org/2000/svg"><style>.box{fill:#ffffff}@media (prefers-color-scheme: dark){.box{fill:url(https://attacker.invalid/x);opacity:0.5}}</style><rect class="box" data-element-id="thing" width="10" height="10"/></svg>`;
    const clean = sanitizeSvg(unsafeSource, { prefersDark: true });
    expect(clean).not.toContain('attacker');
    expect(clean).not.toContain('opacity');
    const element = new DOMParser().parseFromString(clean, 'image/svg+xml').querySelector('[data-element-id="thing"]')!;
    // Neither disallowed dark declaration survives, so the safe light value underneath is what's left.
    expect(element.getAttribute('fill')).toBe('#ffffff');
  });
});
