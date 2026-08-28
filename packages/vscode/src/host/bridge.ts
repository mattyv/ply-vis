import type { SourceRange, VisualEnvelope } from '../core/result-source';

export const HOST_PROTOCOL_VERSION = 1 as const;
export type PersistedViewState = Readonly<Record<string, unknown>>;
export type ViewerRequest =
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'ready' }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'error'; readonly message: string }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'navigate'; readonly source: SourceRange }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'persist-state'; readonly state: PersistedViewState }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'request-artifact' };
export type HostResponse =
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'artifact'; readonly envelope: VisualEnvelope }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'restore-state'; readonly state: PersistedViewState }
  | { readonly channel: 'ply-vis'; readonly version: 1; readonly type: 'error'; readonly message: string };

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
    case 'request-artifact':
      return exact(value, ['channel', 'version', 'type']) ? value as ViewerRequest : undefined;
    case 'error':
      return exact(value, ['channel', 'version', 'type', 'message']) && typeof value.message === 'string' ? value as ViewerRequest : undefined;
    case 'persist-state':
      return exact(value, ['channel', 'version', 'type', 'state']) && record(value.state) ? value as ViewerRequest : undefined;
    case 'navigate': {
      if (!exact(value, ['channel', 'version', 'type', 'source'])) return undefined;
      const source = parseExactSource(value.source);
      return source ? { channel: 'ply-vis', version: 1, type: 'navigate', source } : undefined;
    }
    default:
      return undefined;
  }
}

export const artifactMessage = (envelope: VisualEnvelope): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'artifact', envelope });
export const restoreStateMessage = (state: PersistedViewState): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'restore-state', state });
export const errorMessage = (message: string): HostResponse => ({ channel: 'ply-vis', version: 1, type: 'error', message });
