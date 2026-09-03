export declare const PROTOCOL_VERSION: 1;
export type ElementKind = string;
export type EvidenceState = 'declared' | 'earned' | 'gap' | 'violation';
export type JsonValue = null | boolean | number | string | readonly JsonValue[] | {
    readonly [key: string]: JsonValue;
};
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
    readonly evidence: Readonly<{
        verdict: string;
        statuses: readonly string[];
        reused: boolean;
        state?: EvidenceState;
        [key: string]: JsonValue;
    }>;
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
        readonly root: {
            readonly path: string;
        };
        readonly tool: {
            readonly name: string;
            readonly version: string;
        };
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
export declare class EnvelopeError extends Error {
}
export declare function parseEnvelope(value: unknown): VisualEnvelope;
