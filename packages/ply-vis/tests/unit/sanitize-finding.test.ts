// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeSvg } from '../../src/protocol/sanitize';

describe('Ply finding styles', () => {
  it('preserves safe rules emitted after the dark-mode block', () => {
    const clean = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg"><style>
      .fn-chip-box{fill:#f6f7f9}
      @media (prefers-color-scheme: dark){.fn-chip-box{fill:#1c1f27}}
      .fn-chip-box-finding{fill:#fdecec;stroke:#c9534f;stroke-width:2.5}
    </style><rect class="fn-chip-box-finding" width="10" height="10"/></svg>`);

    expect(clean).toContain('fill="#fdecec"');
    expect(clean).toContain('stroke="#c9534f"');
  });
});
