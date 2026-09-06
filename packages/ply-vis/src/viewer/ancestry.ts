import type { VisualElement, VisualEnvelope } from '../protocol/envelope';

/**
 * Walks outward through the nesting chain, yielding `from` and then each
 * enclosing element in turn, ending at the outermost one.
 *
 * It stops if it ever revisits an element. The parser refuses cyclic nesting,
 * so reaching that guard means an element map was built some other way -- and
 * a short answer is worth having then, because the three walks this replaces
 * ran during a load with no bound at all. Given `a` inside `b` inside `a`,
 * they looped forever and the tab froze with nothing drawn.
 */
export function* ancestry(
  from: VisualElement | undefined,
  elements: VisualEnvelope['elements'],
): Generator<VisualElement> {
  const seen = new Set<string>();
  let current = from;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    yield current;
    current = current.parentId ? elements[current.parentId] : undefined;
  }
}
