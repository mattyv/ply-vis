import { type HostBridge } from '../host/messages';
import { type ViewState } from '../state/view-state';
export interface Viewer {
    load(value: unknown): boolean;
    destroy(): void;
    getState(): ViewState;
}
export declare function mountViewer(container: HTMLElement, bridge: HostBridge, initialEnvelopes?: readonly unknown[]): Viewer;
