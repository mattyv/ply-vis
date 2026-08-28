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

export function containsRect(container: Rect, candidate: Rect, tolerance = 0.5): boolean {
  return candidate.x >= container.x - tolerance
    && candidate.y >= container.y - tolerance
    && candidate.x + candidate.width <= container.x + container.width + tolerance
    && candidate.y + candidate.height <= container.y + container.height + tolerance;
}

export function fitRect(
  viewport: Viewport,
  content: Rect,
  options: { margin?: number; minZoom?: number; maxZoom?: number } = {},
): ViewTransform {
  const margin = options.margin ?? 24;
  const minZoom = options.minZoom ?? 0.2;
  const maxZoom = options.maxZoom ?? 4;
  const availableWidth = Math.max(1, viewport.width - margin * 2);
  const availableHeight = Math.max(1, viewport.height - margin * 2);
  const width = Math.max(1, content.width);
  const height = Math.max(1, content.height);
  const zoom = Math.min(maxZoom, Math.max(minZoom, Math.min(availableWidth / width, availableHeight / height)));

  return {
    zoom,
    panX: viewport.width / 2 - (content.x + width / 2) * zoom,
    panY: viewport.height / 2 - (content.y + height / 2) * zoom,
  };
}
