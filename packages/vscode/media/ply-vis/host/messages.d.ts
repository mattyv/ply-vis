import type { SourceLocation, VisualEnvelope } from '../protocol/envelope';
import type { ViewState } from '../state/view-state';
export declare const HOST_PROTOCOL_VERSION: 1;
export type HostRequest = {
    channel: 'ply-vis';
    version: 1;
    type: 'ready';
} | {
    channel: 'ply-vis';
    version: 1;
    type: 'error';
    message: string;
} | {
    channel: 'ply-vis';
    version: 1;
    type: 'navigate';
    source: SourceLocation;
} | {
    channel: 'ply-vis';
    version: 1;
    type: 'persist-state';
    state: ViewState;
} | {
    channel: 'ply-vis';
    version: 1;
    type: 'request-artifact';
};
export type HostResponse = {
    channel: 'ply-vis';
    version: 1;
    type: 'artifact';
    envelope: VisualEnvelope;
} | {
    channel: 'ply-vis';
    version: 1;
    type: 'restore-state';
    state: ViewState;
};
export interface HostBridge {
    post(message: HostRequest): void;
}
export declare const windowHostBridge: () => HostBridge;
export declare function isHostResponse(value: unknown): value is HostResponse;
