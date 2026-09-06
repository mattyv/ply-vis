import type { SourceRange, VisualEnvelope } from '../core/result-source';
import { isPlyCode } from '../core/ply-code';

export const HOST_PROTOCOL_VERSION = 1 as const;
export type PersistedViewState = Readonly<Record<string, unknown>>;
export type ViewerRequest =
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'ready' }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'error'; readonly message: string }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'navigate'; readonly source: SourceRange }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'persist-state'; readonly state: PersistedViewState }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'request-artifact' }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'explain'; readonly code: string }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'explain-prompt' }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'artifact-accepted'; readonly deliveryId: string };
// A second, hand-written copy of the viewer's own `HostResponse`. It exists
// because this package types the payloads with its own `SourceRange` and
// `PersistedViewState` rather than the viewer's, and it had **drifted**: it
// carried an `error` member the viewer's union never had, so the host could
// build and send a message the viewer's guard was right to reject, and did.
// That is the whole of the "announces it cleared the drawing and never
// clears it" defect (external review, 2026-09-06).
//
// `protocol-agreement.test.ts` compares the two declarations member for
// member now, so a member added to one and not the other fails here rather
// than shipping as a message nobody receives.
export type HostResponse =
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'artifact'; readonly envelope: VisualEnvelope; readonly deliveryId: string }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'restore-state'; readonly state: PersistedViewState }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'capabilities'; readonly explain: boolean; readonly installedTool?: string | undefined }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'clear'; readonly message: string };

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: readonly string[]): boolean => {
  const allowed = new Set(keys);
  return keys.every((key) => key in value) && Object.keys(value).every((key) => allowed.has(key));
};
const sourceCoordinate = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

function parseExactSource(value: unknown): SourceRange | undefined {
  if (!record(value) || !exact(value, ['file', 'startLine', 'startColumn', 'endLine', 'endColumn']) || typeof value.file !== 'string' || !value.file ||
      !sourceCoordinate(value.startLine) || !sourceCoordinate(value.startColumn) || !sourceCoordinate(value.endLine) || !sourceCoordinate(value.endColumn)) return undefined;
  if (value.endLine < value.startLine || (value.endLine === value.startLine && value.endColumn < value.startColumn)) return undefined;
  return { file: value.file, startLine: value.startLine, startColumn: value.startColumn, endLine: value.endLine, endColumn: value.endColumn };
}

export function parseViewerRequest(value: unknown): ViewerRequest | undefined {
  if (!record(value) || value.channel !== 'ply-vis' || value.version !== HOST_PROTOCOL_VERSION || typeof value.type !== 'string') return undefined;
  switch (value.type) {
    case 'ready':
    case 'explain-prompt':
    case 'request-artifact':
      return exact(value, ['channel', 'version', 'type']) ? value as ViewerRequest : undefined;
    case 'error':
      return exact(value, ['channel', 'version', 'type', 'message']) && typeof value.message === 'string' ? value as ViewerRequest : undefined;
    case 'artifact-accepted':
      return exact(value, ['channel', 'version', 'type', 'deliveryId']) && typeof value.deliveryId === 'string'
        ? value as ViewerRequest : undefined;
    case 'persist-state':
      return exact(value, ['channel', 'version', 'type', 'state']) && record(value.state) ? value as ViewerRequest : undefined;
    case 'explain':
      // The code is about to become an argument to a spawned process, so it
      // is checked for shape here rather than trusted because it arrived on
      // the channel.
      return exact(value, ['channel', 'version', 'type', 'code']) && typeof value.code === 'string' && isPlyCode(value.code)
        ? value as ViewerRequest : undefined;
    case 'navigate': {
      if (!exact(value, ['channel', 'version', 'type', 'source'])) return undefined;
      const source = parseExactSource(value.source);
      return source ? { channel: 'ply-vis', version: 1, type: 'navigate', source } : undefined;
    }
    default:
      return undefined;
  }
}

export const artifactMessage = (envelope: VisualEnvelope, deliveryId: string): HostResponse =>
  ({ channel: 'ply-vis', version: 1, type: 'artifact', envelope, deliveryId });
export const restoreStateMessage = (state: PersistedViewState): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'restore-state', state });
/** What this host can do beyond drawing. The viewer hides an action rather
 * than offering one the host will fail -- JetBrains reads the same messages
 * and cannot run the CLI at all, so it simply never sends this. */
export const capabilitiesMessage = (explain: boolean, installedTool?: string): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'capabilities', explain, installedTool });
/**
 * Take the drawing down and say why.
 *
 * This used to build an `error` message, and `error` travels the other way
 * -- viewer to host, for a runtime failure the host should log. The viewer's
 * own guard rejected it, correctly, so the host announced it was showing
 * nothing while the previous drawing stayed on screen: a picture of a run
 * that is no longer the selected one, with nothing saying so. That is what
 * made "switching projects leaves the old drawing up" survive the fix that
 * was meant to stop it -- the message explaining the blank was never
 * delivered, so there was no blank either.
 *
 * Only for when there is genuinely nothing to draw. A message *about* a
 * drawing that is still up belongs in the host's own reporter, not here --
 * sending this would wipe the very drawing the message says is being shown.
 */
export const clearMessage = (message: string): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'clear', message });
