export interface ViewState {
  readonly runId?: string | undefined;
  readonly selectedId?: string | undefined;
  readonly focusedId?: string | undefined;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly overlays: Readonly<{ earned: boolean; gap: boolean; violation: boolean }>;
}
export const initialViewState = (): ViewState => Object.freeze({ zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: true, gap: true, violation: true }) });
export const updateViewState = (state: ViewState, patch: Partial<ViewState>): ViewState => Object.freeze({ ...state, ...patch, overlays: Object.freeze({ ...state.overlays, ...patch.overlays }) });
