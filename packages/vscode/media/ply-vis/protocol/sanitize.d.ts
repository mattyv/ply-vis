/** Options for {@link sanitizeSvg}. */
export interface SanitizeSvgOptions {
    /** Whether the host is currently in a dark theme. When true, declarations
     * from a `prefers-color-scheme: dark` block are inlined after the base
     * ones, so they take effect; when false (the default), that block is
     * dropped exactly as any other unhandled `@media` block is. This is an
     * explicit input rather than something read from `window.matchMedia`
     * inside this function, because what "dark" means depends on the host
     * (VS Code's editor theme, a plain browser's OS setting, ...) and this
     * module has no business guessing that. */
    readonly prefersDark?: boolean;
}
export declare function sanitizeSvg(source: string, options?: SanitizeSvgOptions): string;
