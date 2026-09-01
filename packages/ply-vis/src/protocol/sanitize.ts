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
function withoutMediaRules(source: string): string {
  let result = source;
  for (;;) {
    const start = result.search(/@media\b/i);
    if (start < 0) return result;
    const open = result.indexOf('{', start);
    if (open < 0) return result.slice(0, start);
    let depth = 0;
    let end = open;
    for (; end < result.length; end += 1) {
      if (result[end] === '{') depth += 1;
      else if (result[end] === '}' && --depth === 0) break;
    }
    result = result.slice(0, start) + result.slice(Math.min(end + 1, result.length));
  }
}


interface SafeCssRule { readonly selectors: readonly string[]; readonly declarations: readonly (readonly [string, string])[] }

function parseSafeStylesheet(source: string): SafeCssRule[] | undefined {
  if (!source.trim() || source.length > 32_768) return undefined;
  const baseStyles = withoutMediaRules(source);
  const rule = /\s*([^{}]+)\{([^{}]*)\}/gy;
  const parsed: SafeCssRule[] = [];
  let cursor = 0;
  while (cursor < baseStyles.length) {
    rule.lastIndex = cursor;
    const match = rule.exec(baseStyles);
    if (!match) return baseStyles.slice(cursor).trim() === '' ? parsed : undefined;
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

export function sanitizeSvg(source: string): string {
  if (/<!doctype|<\?xml-stylesheet/i.test(source)) throw new Error('The artifact contains forbidden XML directives');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('The artifact contains invalid SVG');
  for (const element of [...document.querySelectorAll('*')]) {
    if (element.localName.toLowerCase() === 'style') {
      const rules = parseSafeStylesheet(element.textContent ?? '');
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
