export interface ViewState {
    readonly runId?: string | undefined;
    readonly selectedId?: string | undefined;
    readonly focusedId?: string | undefined;
    readonly zoom: number;
    readonly panX: number;
    readonly panY: number;
    readonly overlays: Readonly<{
        earned: boolean;
        gap: boolean;
        violation: boolean;
    }>;
}
export declare const initialViewState: () => ViewState;
export declare const updateViewState: (state: ViewState, patch: Partial<ViewState>) => ViewState;
