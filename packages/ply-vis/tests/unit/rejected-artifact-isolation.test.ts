// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mountViewer } from '../../src/viewer/viewer';

const envelope = (id: string, svg: string) => ({
  protocolVersion: 1,
  run: { id, completedAt: '2026-09-01T00:00:00Z', root: { path: '.' }, tool: { name: 'ply', version: 'test' }, outcome: 'clean' },
  svg,
  elements: { workspace: { id: 'workspace', kind: 'workspace', label: 'Workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } },
  diagnostics: [],
});

const good = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><g data-element-id="workspace"><rect width="100" height="50" fill="#fff"/></g></svg>';
// Parses as an envelope, and dies in the SVG sanitizer rather than the
// envelope parser -- which is the whole point: the two run at different
// moments, and the state between them is what leaked.
const unsanitizable = '<svg xmlns="http://www.w3.org/2000/svg"><rect</rect</svg>';

/**
 * A refused artifact is supposed to leave the reader exactly where they
 * were. It did, on screen -- and not underneath: the unsanitised copy the
 * viewer keeps for repainting was replaced *before* sanitising was known to
 * succeed, so a refused artifact quietly became the copy every later repaint
 * would use.
 *
 * Nothing showed until the reader flipped light/dark. The theme handler then
 * re-sanitised the refused envelope, threw, and the drawing that had been on
 * screen the whole time did not come back.
 *
 * Reported and reproduced by external review, 2026-09-06.
 */
describe('an artifact the viewer refused', () => {
  it('does not become the copy later repaints are built from', async () => {
    const posted: { type: string; message?: string }[] = [];
    const container = document.createElement('div');
    document.body.append(container);
    const viewer = mountViewer(container, { post: (m) => { posted.push(m as never); } });

    expect(viewer.load(envelope('a', good))).toBe(true);
    expect(viewer.load(envelope('b', unsanitizable))).toBe(false);
    posted.length = 0;

    // The flip a reader makes, which is when the damage surfaces. Repainting
    // is driven by a mutation observer, so it happens a tick later -- an
    // earlier draft of this test checked synchronously and passed before the
    // repaint had run at all.
    document.body.dataset.vscodeThemeKind = 'vscode-dark';
    document.body.classList.add('vscode-dark');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      posted.filter((m) => m.type === 'error'),
      'repainting for the new theme must rebuild the drawing on screen, which is A -- '
        + 'rebuilding the refused envelope instead fails, and reports failure, over an '
        + 'artifact the reader was told had been rejected',
    ).toEqual([]);
    const canvas = container.querySelector<HTMLElement>('.ply-canvas')!;
    expect(canvas.querySelector('svg'), 'and A must still be on screen').not.toBeNull();
    viewer.destroy();
    document.body.className = '';
    delete document.body.dataset.vscodeThemeKind;
  });
});
