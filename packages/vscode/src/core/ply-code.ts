/// A Ply code is one letter and four digits (`W0532`, `P0502`, `E0203`).
/// Checked before it is ever handed to a spawned process: the value arrives
/// from the webview, and only a code should reach the command line.
export function isPlyCode(value: string): boolean {
  return /^[A-Z][0-9]{4}$/.test(value);
}

/// The right-click menu hands back whatever `data-vscode-context` the row
/// under the pointer declared. Anything that is not a Ply code is treated as
/// no code at all rather than passed along.
export function plyCode(context: unknown): string | undefined {
  if (typeof context !== 'object' || context === null) return undefined;
  const value = (context as { readonly plyCode?: unknown }).plyCode;
  return typeof value === 'string' && isPlyCode(value) ? value : undefined;
}
