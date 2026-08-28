const blockedElements = new Set(['script', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'animate', 'animatemotion', 'animatetransform', 'set']);
const externalAttributes = new Set(['href', 'xlink:href', 'src']);
const safeSelector = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/;
const safeCssValues: Readonly<Record<string, RegExp>> = {
  fill: /^(?:none|#[0-9a-f]{3,8})$/i,
  stroke: /^(?:none|#[0-9a-f]{3,8})$/i,
  'stroke-width': /^\d+(?:\.\d+)?$/,
  'stroke-dasharray': /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  'font-size': /^\d+(?:\.\d+)?px$/,
  'font-style': /^(?:normal|italic)$/,
  'font-weight': /^(?:normal|bold|[1-9]00)$/,
  'text-anchor': /^(?:start|middle|end)$/,
};

interface SafeCssRule { readonly selectors: readonly string[]; readonly declarations: readonly (readonly [string, string])[] }

function parseSafeStylesheet(source: string): SafeCssRule[] | undefined {
  if (!source.trim() || source.length > 32_768) return undefined;
  const rule = /\s*([^{}]+)\{([^{}]*)\}/gy;
  const parsed: SafeCssRule[] = [];
  let cursor = 0;
  while (cursor < source.length) {
    rule.lastIndex = cursor;
    const match = rule.exec(source);
    if (!match) return source.slice(cursor).trim() === '' ? parsed : undefined;
    cursor = rule.lastIndex;
    const selectorSource = match[1];
    const declarationSource = match[2];
    if (selectorSource === undefined || declarationSource === undefined) return undefined;
    const selectors = selectorSource.split(',').map((selector) => selector.trim());
    if (!selectors.every((selector) => safeSelector.test(selector))) return undefined;
    const rawDeclarations = declarationSource.split(';').filter((part) => part.trim() !== '');
    const declarations: Array<readonly [string, string]> = [];
    if (!rawDeclarations.length || !rawDeclarations.every((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator < 1) return false;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const value = declaration.slice(separator + 1).trim();
      if (safeCssValues[property]?.test(value) !== true) return false;
      declarations.push([property, value]);
      return true;
    })) return undefined;
    parsed.push({ selectors, declarations });
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
