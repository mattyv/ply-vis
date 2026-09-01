export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Viewport {
    width: number;
    height: number;
}
export interface ViewTransform {
    zoom: number;
    panX: number;
    panY: number;
}
export declare function containsRect(container: Rect, candidate: Rect, tolerance?: number): boolean;
export declare function fitRect(viewport: Viewport, content: Rect, options?: {
    margin?: number;
    minZoom?: number;
    maxZoom?: number;
}): ViewTransform;
/** Keep one canvas point stationary while changing scale. */
export declare function zoomAt(transform: ViewTransform, zoom: number, anchor: {
    x: number;
    y: number;
}): ViewTransform;
