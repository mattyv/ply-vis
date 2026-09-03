export interface ViewState {
    readonly runId?: string | undefined;
    readonly selectedId?: string | undefined;
    readonly focusedId?: string | undefined;
    readonly detailsHidden: boolean;
    readonly zoom: number;
    readonly panX: number;
    readonly panY: number;
    readonly overlays: Readonly<{
        earned: boolean;
        gap: boolean;
        violation: boolean;
    }>;
    /** Fold buried detail away as the reader pulls back. On by default: at 40% the text is too small to read, so drawing it is noise. A reader who wants everything on screen at once can switch it off. */
    readonly foldDetail: boolean;
    /** Show the tooltip when the pointer hovers an item. On by default. Keyboard focus shows the tooltip regardless of this setting -- hovering isn't available to a keyboard user, and most of a drawing's detail lives in hover text, so muting only the hover path can't cut anyone off from it. */
    readonly hoverTooltips: boolean;
}
export declare const initialViewState: () => ViewState;
export declare const updateViewState: (state: ViewState, patch: Partial<ViewState>) => ViewState;
