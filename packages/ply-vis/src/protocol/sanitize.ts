const blockedElements = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'animate', 'animatemotion', 'animatetransform', 'set']);
const externalAttributes = new Set(['href', 'xlink:href', 'src']);
const safeSelector = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/;
const paint = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i;
const safeCssValues: Readonly<Record<string, RegExp>> = {
  fill: paint,
  stroke: paint,
  'stroke-width': /^\d+(?:\.\d+)?$/,
  'stroke-dasharray': /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  'font-size': /^\d+(?:\.\d+)?px$/,
  'font-style': /^(?:normal|italic)$/,
  'font-weight': /^(?:normal|bold|[1-9]00)$/,
  'text-anchor': /^(?:start|middle|end)$/,
};
// The only media condition inlining can honestly express: it does not
// change at runtime, so its declarations can be baked in once as attributes.
// Anything else (print, min-width, hover, a compound condition that adds
// prefers-color-scheme to something else) is dropped rather than
// half-applied -- a rule this can't honour must not be partly honoured.
const darkMediaCondition = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;

/** Strips every `@media` block from `source`, returning what is left plus the
 * text bodies of any block whose condition was exactly
 * `prefers-color-scheme: dark`, in the order they appeared. */
function extractMediaRules(source: string): { base: string; darkBody: string } {
  let result = source;
  let darkBody = '';
  for (;;) {
    const start = result.search(/@media\b/i);
    if (start < 0) return { base: result, darkBody };
    const open = result.indexOf('{', start);
    if (open < 0) return { base: result.slice(0, start), darkBody };
    const condition = result.slice(start, open).trim();
    let depth = 0;
    let end = open;
    for (; end < result.length; end += 1) {
      if (result[end] === '{') depth += 1;
      else if (result[end] === '}' && --depth === 0) break;
    }
    if (darkMediaCondition.test(condition)) darkBody += `${result.slice(open + 1, end)}\n`;
    result = result.slice(0, start) + result.slice(Math.min(end + 1, result.length));
  }
}


interface SafeCssRule { readonly selectors: readonly string[]; readonly declarations: readonly (readonly [string, string])[] }

function parseSafeStylesheet(source: string, prefersDark: boolean): SafeCssRule[] | undefined {
  if (!source.trim() || source.length > 32_768) return undefined;
  const { base, darkBody } = extractMediaRules(source);
  // The dark declarations are appended after the light ones and parsed as
  // one stream, so they are applied to elements after the light rule --
  // last write wins on `setAttribute`, which is what lets a dark override
  // actually override rather than just also being true.
  const styles = prefersDark ? `${base}\n${darkBody}` : base;
  const rule = /\s*([^{}]+)\{([^{}]*)\}/gy;
  const parsed: SafeCssRule[] = [];
  let cursor = 0;
  while (cursor < styles.length) {
    rule.lastIndex = cursor;
    const match = rule.exec(styles);
    if (!match) return styles.slice(cursor).trim() === '' ? parsed : undefined;
    cursor = rule.lastIndex;
    const selectorSource = match[1];
    const declarationSource = match[2];
    if (selectorSource === undefined || declarationSource === undefined) return undefined;
    const selectors = selectorSource.split(',').map((selector) => selector.trim());
    if (!selectors.every((selector) => safeSelector.test(selector))) return undefined;
    const declarations: Array<readonly [string, string]> = [];
    for (const declaration of declarationSource.split(';')) {
      const separator = declaration.indexOf(':');
      if (separator < 1) continue;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (safeCssValues[property]?.test(value) === true) declarations.push([property, value]);
    }
    if (declarations.length) parsed.push({ selectors, declarations });
  }
  return parsed;
}

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

export function sanitizeSvg(source: string, options: SanitizeSvgOptions = {}): string {
  const prefersDark = options.prefersDark === true;
  if (/<!doctype|<\?xml-stylesheet/i.test(source)) throw new Error('The artifact contains forbidden XML directives');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('The artifact contains invalid SVG');
  for (const element of [...document.querySelectorAll('*')]) {
    if (element.localName.toLowerCase() === 'style') {
      const rules = parseSafeStylesheet(element.textContent ?? '', prefersDark);
      if (rules) for (const rule of rules) for (const selector of rule.selectors) {
        for (const target of [...document.documentElement.querySelectorAll(selector)]) {
          for (const [property, value] of rule.declarations) target.setAttribute(property, value);
        }
      }
      element.remove();
      continue;
    }
    if (blockedElements.has(element.localName.toLowerCase())) { element.remove(); continue; }
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      const externalUrl = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(value);
      if (name.startsWith('on') || name === 'style' || externalUrl || externalAttributes.has(name) && value !== '' && !value.startsWith('#')) element.removeAttribute(attribute.name);
    }
  }
  return new XMLSerializer().serializeToString(document.documentElement);
}
