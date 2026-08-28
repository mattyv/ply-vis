const blockedElements = new Set(['script', 'style', 'foreignobject', 'iframe', 'object', 'embed', 'audio', 'video', 'animate', 'animatemotion', 'animatetransform', 'set']);
const externalAttributes = new Set(['href', 'xlink:href', 'src']);

export function sanitizeSvg(source: string): string {
  if (/<!doctype|<\?xml-stylesheet/i.test(source)) throw new Error('The artifact contains forbidden XML directives');
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') throw new Error('The artifact contains invalid SVG');
  for (const element of [...document.querySelectorAll('*')]) {
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
