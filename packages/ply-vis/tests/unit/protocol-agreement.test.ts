import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const read = (relative: string) => readFileSync(resolve(here, '../../../..', relative), 'utf8');

/**
 * The `type:` members of one union declaration, in source order.
 *
 * Deliberately reads the source rather than the compiled types: what drifted
 * is two *declarations*, and TypeScript cannot compare them at build time
 * because each is written against its own payload types.
 */
function members(source: string, unionName: string): string[] {
  const start = source.indexOf(`export type ${unionName} =`);
  if (start < 0) throw new Error(`no declaration of ${unionName}`);
  // The terminating semicolon is the one at brace depth zero. Every member
  // is an object literal type full of semicolons of its own, and stopping
  // at the first of those read one member and called it the union -- caught
  // by the vacuity check at the bottom of this file, which is why that
  // check is here.
  let depth = 0;
  let end = -1;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    else if (c === ';' && depth === 0) { end = i; break; }
  }
  if (end < 0) throw new Error(`${unionName} has no terminating semicolon`);
  return [...source.slice(start, end).matchAll(/type:\s*'([^']+)'/g)].map((m) => m[1]!);
}

/**
 * The viewer and the VS Code host each hand-write the same message protocol,
 * against their own payload types. Nothing checked that the two agreed, and
 * they stopped agreeing: the host's `HostResponse` carried an `error` member
 * the viewer's never had, so the host could build and send a message the
 * viewer's guard rejected — correctly, and silently.
 *
 * The visible cost was a drawing that would not go away. The host announced
 * "showing nothing rather than the last project's run", the viewer never
 * received it, and the reader kept looking at a picture of a project they
 * had switched away from with nothing saying so. Two separate fixes aimed at
 * that behaviour both missed, because both were about *when* to send the
 * message rather than whether it could arrive.
 *
 * Reported by external review 2026-09-06. This is the invariant rather than
 * another spot-check: a member added to one declaration and not the other
 * fails here, whatever the member is.
 */
/**
 * The message types the Kotlin parser's `when` actually handles. Same
 * reasoning as `members` above: what drifts is a hand-written declaration,
 * and no compiler can compare it to a TypeScript union.
 */
function kotlinHandledTypes(source: string): string[] {
  const start = source.indexOf('fun parse(json: String)');
  if (start < 0) throw new Error('no parse function in the JetBrains host message');
  const end = source.indexOf('private fun', start);
  if (end < 0) throw new Error('parse function has no end');
  return [...source.slice(start, end).matchAll(/^\s*"([a-z-]+)"\s*->/gm)].map((m) => m[1]!);
}

describe('the three copies of the host protocol', () => {
  const viewer = read('packages/ply-vis/src/host/messages.ts');
  const host = read('packages/vscode/src/host/bridge.ts');
  const jetbrains = read('packages/jetbrains/src/main/kotlin/dev/ply/jetbrains/PlyHostMessage.kt');

  it('agree on what the host may send the viewer', () => {
    expect([...members(host, 'HostResponse')].sort())
      .toEqual([...members(viewer, 'HostResponse')].sort());
  });

  it('agree on what the viewer may send the host', () => {
    expect([...members(host, 'ViewerRequest')].sort())
      .toEqual([...members(viewer, 'HostRequest')].sort());
  });

  /**
   * And a third hand-written copy, in Kotlin. Nothing compared it to either
   * of the other two, and it fell behind the moment `artifact-accepted` was
   * added to the viewer: JetBrains parsed every successful load as an
   * unsupported message type and put an error in the status line under a
   * drawing that had loaded perfectly.
   *
   * That is the same defect as the one above -- one copy of a protocol
   * taught something the others were not -- and the fix for the first one
   * did not cover it because the test only knew about two copies.
   *
   * Reported by external review 2026-09-06.
   */
  it('agree with the JetBrains host on what the viewer may send', () => {
    expect(kotlinHandledTypes(jetbrains).sort())
      .toEqual([...members(viewer, 'HostRequest')].sort());
  });

  // The guard is only worth having if it reads real members. A declaration
  // this parser silently returned nothing for would make both tests above
  // pass by comparing two empty lists — the vacuous-pass failure, one level
  // up from the thing being tested.
  it('is reading real members rather than passing on two empty lists', () => {
    expect(members(viewer, 'HostResponse').length).toBeGreaterThan(2);
    expect(members(viewer, 'HostRequest').length).toBeGreaterThan(2);
    expect(members(viewer, 'HostResponse')).toContain('clear');
    expect(kotlinHandledTypes(jetbrains).length).toBeGreaterThan(2);
    expect(kotlinHandledTypes(jetbrains)).toContain('navigate');
  });
});
