import { basename, dirname, isAbsolute, posix, relative, resolve, sep } from 'node:path';

export const INDEX_RELATIVE_PATH = 'target/ply/view.json';
export const DISCOVERY_EXCLUDED_DIRECTORIES = new Set(['.git', 'target', 'node_modules', 'build', '.gradle', '.gradle-user', '.intellijPlatform']);
const WATCH_EXCLUDED_DIRECTORIES = new Set([...DISCOVERY_EXCLUDED_DIRECTORIES].filter((directory) => directory !== 'target'));
export interface FileReader {
  readText(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
  findPlySpecs(root: string): Promise<string[]>;
}
export interface WorkspaceRoot { readonly name: string; readonly path: string }
export type RunOutcome = 'clean' | 'violation' | 'timeout' | 'missing_evidence' | 'narrowed_evidence';
export interface RunIndexEntry { readonly id: string; readonly path: string; readonly completedAt: string; readonly outcome: RunOutcome }
export interface RunIndex { readonly protocolVersion: 1; readonly currentRun: string; readonly runs: readonly RunIndexEntry[] }
export interface SourceRange { readonly file: string; readonly startLine: number; readonly startColumn: number; readonly endLine: number; readonly endColumn: number }
export interface ElementEvidence { readonly verdict: string; readonly statuses: readonly string[]; readonly reused: boolean; readonly engine?: string; readonly seed?: string; readonly cases?: number }
export interface VisualElement {
  readonly id: string; readonly kind: string; readonly label: string; readonly parentId?: string;
  readonly source?: SourceRange; readonly evidence: ElementEvidence; readonly diagnosticIds: readonly string[];
}
export interface VisualDiagnostic { readonly id: string; readonly code: string; readonly severity: string; readonly message: string; readonly elementId?: string; readonly source?: SourceRange }
export interface VisualEnvelope {
  readonly protocolVersion: 1;
  readonly run: { readonly id: string; readonly completedAt: string; readonly root: { readonly path: string }; readonly tool: { readonly name: string; readonly version: string }; readonly outcome: RunOutcome };
  readonly svg: string; readonly elements: Readonly<Record<string, VisualElement>>; readonly diagnostics: readonly VisualDiagnostic[];
}
export interface ArtifactSnapshot { readonly root: WorkspaceRoot; readonly index: RunIndex; readonly entry: RunIndexEntry; readonly envelope: VisualEnvelope }
export interface LoadState { readonly snapshot?: ArtifactSnapshot; readonly error?: string }
export class ArtifactError extends Error {}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const exactKeys = (value: Record<string, unknown>, required: readonly string[]): boolean => {
  const expected = new Set(required);
  return required.every((key) => key in value) && Object.keys(value).every((key) => expected.has(key));
};
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const validDate = (value: unknown): value is string => nonEmpty(value) && !Number.isNaN(Date.parse(value));
const outcomes = new Set<RunOutcome>(['clean', 'violation', 'timeout', 'missing_evidence', 'narrowed_evidence']);

/** Accept only portable relative paths; callers select the containment root. */
export function isSafeRelativePath(value: string): boolean {
  if (!value || isAbsolute(value) || value.includes('\\') || value.includes('\0')) return false;
  const normalized = posix.normalize(value);
  return normalized === value && normalized !== '.' && normalized !== '..' && !normalized.startsWith('../');
}

export function parseRunIndex(value: unknown): RunIndex {
  if (!record(value) || !exactKeys(value, ['protocolVersion', 'currentRun', 'runs'])) throw new ArtifactError('Malformed Ply visual index.');
  if (value.protocolVersion !== 1) throw new ArtifactError(`Unsupported Ply visual index version: ${String(value.protocolVersion)}.`);
  if (!nonEmpty(value.currentRun) || !Array.isArray(value.runs)) throw new ArtifactError('Malformed Ply visual index.');
  const ids = new Set<string>();
  const runs = value.runs.map((raw): RunIndexEntry => {
    if (!record(raw) || !exactKeys(raw, ['id', 'path', 'completedAt', 'outcome']) || !nonEmpty(raw.id) || !nonEmpty(raw.path) ||
        !validDate(raw.completedAt) || !outcomes.has(raw.outcome as RunOutcome) || raw.path !== `views/${raw.id}/visual.json` || !isSafeRelativePath(raw.path)) {
      throw new ArtifactError('Malformed run entry in Ply visual index.');
    }
    if (ids.has(raw.id)) throw new ArtifactError(`Duplicate visual run id: ${raw.id}.`);
    ids.add(raw.id);
    return Object.freeze({ id: raw.id, path: raw.path, completedAt: raw.completedAt, outcome: raw.outcome as RunOutcome });
  });
  if (!ids.has(value.currentRun)) throw new ArtifactError(`Current visual run is missing: ${value.currentRun}.`);
  return Object.freeze({ protocolVersion: 1, currentRun: value.currentRun, runs: Object.freeze(runs) });
}

function parseSource(value: unknown, elementId: string): SourceRange | undefined {
  if (value === undefined) return undefined;
  if (!record(value) || !exactKeys(value, ['file', 'startLine', 'startColumn', 'endLine', 'endColumn']) || !nonEmpty(value.file) || !isSafeRelativePath(value.file)) {
    throw new ArtifactError(`Malformed source location for visual element ${elementId}.`);
  }
  const numbers = [value.startLine, value.startColumn, value.endLine, value.endColumn];
  if (!numbers.every((part) => Number.isInteger(part) && (part as number) >= 0)) throw new ArtifactError(`Malformed source range for visual element ${elementId}.`);
  const [startLine, startColumn, endLine, endColumn] = numbers as number[];
  if (endLine! < startLine! || (endLine === startLine && endColumn! < startColumn!)) throw new ArtifactError(`Reversed source range for visual element ${elementId}.`);
  return Object.freeze({ file: value.file, startLine: startLine!, startColumn: startColumn!, endLine: endLine!, endColumn: endColumn! });
}

export function parseVisualEnvelope(value: unknown): VisualEnvelope {
  if (!record(value)) throw new ArtifactError('Malformed Ply visual artifact.');
  if (value.protocolVersion !== 1) throw new ArtifactError(`Unsupported Ply visual artifact version: ${String(value.protocolVersion)}.`);
  if (!record(value.run) || !nonEmpty(value.run.id) || !validDate(value.run.completedAt) || !record(value.run.root) || !nonEmpty(value.run.root.path) ||
      !record(value.run.tool) || !nonEmpty(value.run.tool.name) || !nonEmpty(value.run.tool.version) || !outcomes.has(value.run.outcome as RunOutcome) || typeof value.svg !== 'string' || !value.svg.trim() ||
      !record(value.elements) || !Array.isArray(value.diagnostics)) throw new ArtifactError('Malformed Ply visual artifact.');
  for (const [stableId, raw] of Object.entries(value.elements)) {
    if (!record(raw) || raw.id !== stableId || !nonEmpty(raw.id) || !nonEmpty(raw.kind) || !nonEmpty(raw.label) ||
        (raw.parentId !== undefined && !nonEmpty(raw.parentId)) || !record(raw.evidence) || !nonEmpty(raw.evidence.verdict) ||
        !Array.isArray(raw.evidence.statuses) || !raw.evidence.statuses.every((item) => typeof item === 'string') || typeof raw.evidence.reused !== 'boolean' ||
        !Array.isArray(raw.diagnosticIds) || !raw.diagnosticIds.every((item) => typeof item === 'string')) {
      throw new ArtifactError(`Malformed visual element: ${stableId}.`);
    }
    parseSource(raw.source, stableId);
  }
  const elementRecords = value.elements as Record<string, Record<string, unknown>>;
  for (const element of Object.values(elementRecords)) if (typeof element.parentId === 'string' && !elementRecords[element.parentId]) throw new ArtifactError(`Unknown visual parent: ${element.parentId}.`);
  const diagnosticIds = new Set<string>();
  for (const raw of value.diagnostics) {
    if (!record(raw) || !nonEmpty(raw.id) || !nonEmpty(raw.code) || !nonEmpty(raw.severity) || typeof raw.message !== 'string' ||
        (raw.elementId !== undefined && (!nonEmpty(raw.elementId) || !elementRecords[raw.elementId]))) throw new ArtifactError('Malformed Ply visual diagnostic.');
    if (diagnosticIds.has(raw.id)) throw new ArtifactError(`Duplicate visual diagnostic id: ${raw.id}.`);
    diagnosticIds.add(raw.id); parseSource(raw.source, `diagnostic ${raw.id}`);
  }
  for (const element of Object.values(elementRecords)) for (const diagnosticId of element.diagnosticIds as string[]) {
    if (!diagnosticIds.has(diagnosticId)) throw new ArtifactError(`Unknown visual diagnostic: ${diagnosticId}.`);
  }
  return value as unknown as VisualEnvelope;
}

function rootForSpec(workspaces: readonly WorkspaceRoot[], spec: string): WorkspaceRoot | undefined {
  const absolute = resolve(spec);
  if (basename(absolute) !== 'ply.yaml') return undefined;
  for (const workspace of workspaces) {
    const boundary = resolve(workspace.path);
    const fromBoundary = relative(boundary, absolute);
    if (fromBoundary === '..' || fromBoundary.startsWith(`..${sep}`) || isAbsolute(fromBoundary)) continue;
    const parts = fromBoundary.split(sep);
    if (parts.some((part) => DISCOVERY_EXCLUDED_DIRECTORIES.has(part))) return undefined;
    const path = dirname(absolute);
    const nested = relative(boundary, path);
    return { name: nested ? `${workspace.name}: ${nested}` : workspace.name, path };
  }
  return undefined;
}

function uniqueRoots(roots: readonly WorkspaceRoot[]): WorkspaceRoot[] {
  const unique = new Map<string, WorkspaceRoot>();
  for (const root of roots) unique.set(root.path, root);
  return [...unique.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export async function discoverPlyRoots(roots: readonly WorkspaceRoot[], files: FileReader,
  rememberedSpecs: readonly string[] = []): Promise<WorkspaceRoot[]> {
  if (rememberedSpecs.length > 0) {
    const cached = await Promise.all(rememberedSpecs.map(async (spec) => {
      const root = rootForSpec(roots, spec);
      return root && await files.exists(resolve(spec)) ? root : undefined;
    }));
    if (cached.every((root): root is WorkspaceRoot => root !== undefined)) return uniqueRoots(cached);
  }
  const discovered = await Promise.all(roots.map(async (workspace) => {
    const boundary = resolve(workspace.path);
    const specs = await files.findPlySpecs(boundary);
    return specs.flatMap((spec): WorkspaceRoot[] => {
      const root = rootForSpec([workspace], spec);
      return root ? [root] : [];
    });
  }));
  return uniqueRoots(discovered.flat());
}

export function shouldHandleWorkspaceChange(workspacePath: string, changedPath: string): boolean {
  const boundary = resolve(workspacePath);
  const absolute = resolve(changedPath);
  const fromBoundary = relative(boundary, absolute);
  if (!fromBoundary || fromBoundary === '..' || fromBoundary.startsWith(`..${sep}`) || isAbsolute(fromBoundary)) return false;
  const parts = fromBoundary.split(sep);
  if (parts.some((part) => WATCH_EXCLUDED_DIRECTORIES.has(part))) return false;
  if (parts.at(-1) === 'ply.yaml') return !parts.some((part) => DISCOVERY_EXCLUDED_DIRECTORIES.has(part));
  const target = parts.findIndex((part, index) => part === 'target' && parts[index + 1] === 'ply');
  return target >= 0 && parts.at(-1)?.endsWith('.json') === true;
}

export class ResultSource {
  private readonly lastGood = new Map<string, ArtifactSnapshot>();
  private readonly reloadSequence = new Map<string, number>();
  public constructor(private readonly files: FileReader) {}
  public state(root: WorkspaceRoot): LoadState { const snapshot = this.lastGood.get(root.path); return snapshot ? { snapshot } : {}; }
  public async reload(root: WorkspaceRoot): Promise<LoadState> {
    const sequence = (this.reloadSequence.get(root.path) ?? 0) + 1;
    this.reloadSequence.set(root.path, sequence);
    try {
      const indexPath = posix.join(root.path, INDEX_RELATIVE_PATH);
      if (!await this.files.exists(indexPath)) {
        const snapshot = this.lastGood.get(root.path);
        return snapshot ? { snapshot, error: 'The published Ply visual index was removed.' } : {};
      }
      const index = parseRunIndex(JSON.parse(await this.files.readText(indexPath)) as unknown);
      const entry = index.runs.find((run) => run.id === index.currentRun)!;
      const envelope = parseVisualEnvelope(JSON.parse(await this.files.readText(posix.join(root.path, 'target/ply', entry.path))) as unknown);
      if (envelope.run.id !== entry.id || envelope.run.completedAt !== entry.completedAt || envelope.run.outcome !== entry.outcome) {
        throw new ArtifactError('The current artifact does not match the indexed run.');
      }
      const snapshot = Object.freeze({ root, index, entry, envelope });
      if (this.reloadSequence.get(root.path) === sequence) this.lastGood.set(root.path, snapshot);
      return { snapshot };
    } catch (error) {
      const message = error instanceof SyntaxError ? 'A Ply visual artifact is not valid JSON.' : error instanceof Error ? error.message : String(error);
      const snapshot = this.lastGood.get(root.path);
      return snapshot ? { snapshot, error: message } : { error: message };
    }
  }
}
