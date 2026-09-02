export interface ViewState {
  readonly runId?: string | undefined;
  readonly selectedId?: string | undefined;
  readonly focusedId?: string | undefined;
  readonly detailsHidden: boolean;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
  readonly overlays: Readonly<{ earned: boolean; gap: boolean; violation: boolean }>;
  /** Fold buried detail away as the reader pulls back. On by default: at 40% the text is too small to read, so drawing it is noise. A reader who wants everything on screen at once can switch it off. */
  readonly foldDetail: boolean;
}
export const initialViewState = (): ViewState => Object.freeze({ detailsHidden: true, zoom: 1, panX: 0, panY: 0, foldDetail: true, overlays: Object.freeze({ earned: true, gap: true, violation: true }) });
export const updateViewState = (state: ViewState, patch: Partial<ViewState>): ViewState => Object.freeze({ ...state, ...patch, overlays: Object.freeze({ ...state.overlays, ...patch.overlays }) });
