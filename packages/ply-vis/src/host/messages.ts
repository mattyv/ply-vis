import type { SourceLocation, VisualEnvelope } from '../protocol/envelope';
import type { ViewState } from '../state/view-state';

export const HOST_PROTOCOL_VERSION = 1 as const;
export type HostRequest =
  | { channel: 'ply-vis'; version: 1; type: 'ready' }
  | { channel: 'ply-vis'; version: 1; type: 'error'; message: string }
  | { channel: 'ply-vis'; version: 1; type: 'navigate'; source: SourceLocation }
  | { channel: 'ply-vis'; version: 1; type: 'persist-state'; state: ViewState }
  | { channel: 'ply-vis'; version: 1; type: 'request-artifact' };
export type HostResponse =
  | { channel: 'ply-vis'; version: 1; type: 'artifact'; envelope: VisualEnvelope }
  | { channel: 'ply-vis'; version: 1; type: 'restore-state'; state: ViewState };

export interface HostBridge { post(message: HostRequest): void }
export const windowHostBridge = (): HostBridge => ({ post: (message) => window.parent.postMessage(message, '*') });
function isViewState(value: unknown): value is ViewState {
  if (typeof value !== 'object' || value === null) return false;
  const state = value as Record<string, unknown>;
  const overlays = state.overlays as Record<string, unknown> | undefined;
  return typeof state.zoom === 'number' && Number.isFinite(state.zoom) && typeof state.panX === 'number' && Number.isFinite(state.panX) && typeof state.panY === 'number' && Number.isFinite(state.panY) && typeof overlays === 'object' && overlays !== null && typeof overlays.earned === 'boolean' && typeof overlays.gap === 'boolean' && typeof overlays.violation === 'boolean' && (state.runId === undefined || typeof state.runId === 'string') && (state.selectedId === undefined || typeof state.selectedId === 'string') && (state.focusedId === undefined || typeof state.focusedId === 'string');
}
export function isHostResponse(value: unknown): value is HostResponse {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return message.channel === 'ply-vis' && message.version === 1 && (message.type === 'artifact' && 'envelope' in message || message.type === 'restore-state' && isViewState(message.state));
}
