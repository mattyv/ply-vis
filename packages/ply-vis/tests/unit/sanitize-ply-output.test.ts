// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../../src/protocol/sanitize';

describe('current Ply SVG sanitization', () => {
  it('keeps safe base colours when the stylesheet also contains patterns, font shorthand, and dark mode', () => {
    const clean = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg">
      <style>
        .workspace-frame{fill:#fbfbfd;stroke:#c8ccd4;stroke-width:2.5}
        .ceiling-unclaimed{fill:url(#unclaimed-hatch)}
        .fn-clause{font:11px ui-monospace,monospace;fill:#3c4658}
        @media (prefers-color-scheme: dark){.workspace-frame{fill:#15171c}}
      </style>
      <defs><pattern id="unclaimed-hatch"/></defs>
      <rect class="workspace-frame" width="10" height="10"/>
      <rect class="ceiling-unclaimed" width="5" height="5"/>
      <text class="fn-clause">check</text>
    </svg>`);

    expect(clean).not.toContain('<style>');
    expect(clean).toContain('fill="#fbfbfd"');
    expect(clean).toContain('fill="url(#unclaimed-hatch)"');
    expect(clean).toContain('fill="#3c4658"');
  });
});
