export const PROTOCOL_VERSION = 1 as const;

export type ElementKind = string;
export type EvidenceState = 'declared' | 'earned' | 'gap' | 'violation';
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface SourceLocation {
  readonly file: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface VisualElement {
  readonly id: string;
  readonly kind: ElementKind;
  readonly label: string;
  readonly parentId?: string;
  readonly declaration?: string;
  readonly evidence: Readonly<{ verdict: string; statuses: readonly string[]; reused: boolean; [key: string]: JsonValue }>;
  readonly diagnosticIds: readonly string[];
  readonly limitations?: readonly string[];
  readonly source?: SourceLocation;
}

export interface VisualDiagnostic {
  readonly id: string;
  readonly code: string;
  readonly severity: string;
  readonly message: string;
  readonly elementId?: string;
  readonly source?: SourceLocation;
}

export interface VisualEnvelope {
  readonly protocolVersion: 1;
  readonly run: {
    readonly id: string;
    readonly completedAt: string;
    readonly root: { readonly path: string };
    readonly tool: { readonly name: string; readonly version: string };
    readonly outcome: 'clean' | 'violation' | 'timeout' | 'missing_evidence' | 'narrowed_evidence';
  };
  readonly svg: string;
  readonly elements: Readonly<Record<string, VisualElement>>;
  readonly diagnostics: readonly VisualDiagnostic[];
  /**
   * The same document drawn again with everything below `depth` folded into
   * its containing box, shallowest first, laid out properly at that level.
   *
   * A viewer that gives a reader less detail by hiding parts of `svg` leaves
   * every box at the size its hidden contents needed, so pulling back
   * produces large empty rectangles. These are the drawings to show instead.
   * Empty when the document does not nest deeply enough for any level to
   * change anything.
   */
  readonly folded: readonly FoldedDrawing[];
}

export interface FoldedDrawing {
  /** Boxes this many levels deep or deeper are folded away; top level is 1. */
  readonly depth: number;
  readonly svg: string;
}

export class EnvelopeError extends Error {}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const exactKeys = (v: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) => {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => key in v) && Object.keys(v).every((key) => allowed.has(key));
};
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((item) => typeof item === 'string');
function cloneJson(value: unknown): JsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return Object.freeze(value.map(cloneJson));
  if (isRecord(value)) return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneJson(item)])));
  throw new EnvelopeError('Evidence contains a non-JSON value');
}

function parseSource(value: unknown): SourceLocation | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !exactKeys(value, ['file', 'startLine', 'startColumn', 'endLine', 'endColumn'])) throw new EnvelopeError('Invalid source location');
  if (typeof value.file !== 'string' || !value.file || value.file.startsWith('/') || value.file.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(value.file) || value.file.split(/[\\/]/).some((part) => part === '..' || part === '.')) throw new EnvelopeError('Invalid source location');
  for (const key of ['startLine', 'startColumn', 'endLine', 'endColumn'] as const) if (!Number.isInteger(value[key]) || (value[key] as number) < 0) throw new EnvelopeError('Invalid source location');
  if ((value.endLine as number) < (value.startLine as number) || ((value.endLine as number) === (value.startLine as number) && (value.endColumn as number) < (value.startColumn as number))) throw new EnvelopeError('Invalid source range');
  return Object.freeze({ file: value.file, startLine: value.startLine as number, startColumn: value.startColumn as number, endLine: value.endLine as number, endColumn: value.endColumn as number });
}

export function parseEnvelope(value: unknown): VisualEnvelope {
  if (!isRecord(value) || !exactKeys(value, ['protocolVersion', 'run', 'svg', 'elements', 'diagnostics'], ['folded'])) throw new EnvelopeError('Invalid visual envelope');
  if (value.protocolVersion !== PROTOCOL_VERSION) throw new EnvelopeError(`Unsupported visual protocol version: ${String(value.protocolVersion)}`);
  const outcomes = new Set(['clean', 'violation', 'timeout', 'missing_evidence', 'narrowed_evidence']);
  if (!isRecord(value.run) || !exactKeys(value.run, ['id', 'completedAt', 'root', 'tool', 'outcome']) || typeof value.run.id !== 'string' || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(value.run.id) || typeof value.run.completedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value.run.completedAt) || Number.isNaN(Date.parse(value.run.completedAt)) || !isRecord(value.run.root) || !exactKeys(value.run.root, ['path']) || typeof value.run.root.path !== 'string' || !value.run.root.path || !isRecord(value.run.tool) || !exactKeys(value.run.tool, ['name', 'version']) || typeof value.run.tool.name !== 'string' || !value.run.tool.name || typeof value.run.tool.version !== 'string' || !value.run.tool.version || !outcomes.has(value.run.outcome as string)) throw new EnvelopeError('Invalid run metadata');
  if (typeof value.svg !== 'string' || !value.svg.trim()) throw new EnvelopeError('Invalid SVG');
  const folded: FoldedDrawing[] = [];
  if (value.folded !== undefined) {
    if (!Array.isArray(value.folded)) throw new EnvelopeError('Invalid folded drawings');
    for (const raw of value.folded) {
      if (!isRecord(raw) || !exactKeys(raw, ['depth', 'svg']) || !Number.isInteger(raw.depth) || (raw.depth as number) < 1 || typeof raw.svg !== 'string' || !raw.svg.trim()) throw new EnvelopeError('Invalid folded drawing');
      folded.push(Object.freeze({ depth: raw.depth as number, svg: raw.svg }));
    }
  }
  if (!isRecord(value.elements)) throw new EnvelopeError('Invalid element index');
  const parsed: Record<string, VisualElement> = {};
  for (const [id, raw] of Object.entries(value.elements)) {
    if (!isRecord(raw) || !['id', 'kind', 'label', 'evidence', 'diagnosticIds'].every((key) => key in raw) || !isRecord(raw.evidence)) throw new EnvelopeError(`Invalid element: ${id}`);
    if (raw.id !== id || typeof raw.id !== 'string' || !raw.id || typeof raw.kind !== 'string' || !raw.kind || typeof raw.label !== 'string' || !raw.label || typeof raw.evidence.verdict !== 'string' || !strings(raw.evidence.statuses) || typeof raw.evidence.reused !== 'boolean' || !strings(raw.diagnosticIds) || (raw.parentId !== undefined && typeof raw.parentId !== 'string') || (raw.declaration !== undefined && typeof raw.declaration !== 'string') || (raw.limitations !== undefined && !strings(raw.limitations))) throw new EnvelopeError(`Invalid element: ${id}`);
    const evidence = cloneJson(raw.evidence) as VisualElement['evidence'];
    parsed[id] = Object.freeze({ id, kind: raw.kind, label: raw.label, evidence, diagnosticIds: Object.freeze([...raw.diagnosticIds]), ...(raw.parentId === undefined ? {} : { parentId: raw.parentId as string }), ...(raw.declaration === undefined ? {} : { declaration: raw.declaration as string }), ...(raw.limitations === undefined ? {} : { limitations: Object.freeze([...(raw.limitations as string[])]) }), ...(raw.source === undefined ? {} : { source: parseSource(raw.source)! }) });
  }
  for (const element of Object.values(parsed)) if (element.parentId && !parsed[element.parentId]) throw new EnvelopeError(`Unknown parent: ${element.parentId}`);
  if (!Array.isArray(value.diagnostics)) throw new EnvelopeError('Invalid diagnostics');
  const diagnostics: VisualDiagnostic[] = [];
  const diagnosticIds = new Set<string>();
  for (const raw of value.diagnostics) {
    if (!isRecord(raw) || typeof raw.id !== 'string' || !raw.id || diagnosticIds.has(raw.id) || typeof raw.code !== 'string' || !raw.code || typeof raw.severity !== 'string' || !raw.severity || typeof raw.message !== 'string' || !raw.message || (raw.elementId !== undefined && typeof raw.elementId !== 'string')) throw new EnvelopeError('Invalid diagnostic');
    diagnosticIds.add(raw.id);
    diagnostics.push(Object.freeze({ id: raw.id, code: raw.code, severity: raw.severity, message: raw.message, ...(raw.elementId === undefined ? {} : { elementId: raw.elementId as string }), ...(raw.source === undefined ? {} : { source: parseSource(raw.source)! }) }));
  }
  for (const element of Object.values(parsed)) for (const id of element.diagnosticIds ?? []) if (!diagnosticIds.has(id)) throw new EnvelopeError(`Unknown diagnostic: ${id}`);
  for (const diagnostic of diagnostics) if (diagnostic.elementId && !parsed[diagnostic.elementId]) throw new EnvelopeError(`Unknown diagnostic element: ${diagnostic.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: value.run.id, completedAt: value.run.completedAt, root: Object.freeze({ path: value.run.root.path }), tool: Object.freeze({ name: value.run.tool.name, version: value.run.tool.version }), outcome: value.run.outcome as VisualEnvelope['run']['outcome'] }), svg: value.svg, elements: Object.freeze(parsed), diagnostics: Object.freeze(diagnostics), folded: Object.freeze(folded) });
}
