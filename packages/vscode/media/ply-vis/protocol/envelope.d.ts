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
}
export declare class EnvelopeError extends Error {
}
export declare function parseEnvelope(value: unknown): VisualEnvelope;
