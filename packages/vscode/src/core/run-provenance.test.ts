import { describe, expect, it } from 'vitest';
import { describeRun, isBuildIdentity } from './run-provenance';

const RAN_BY = 'd0a489779afde70b82c986de8e2ed3c06e4848b990ef3886cdeb6e160f212958';
const INSTALLED = 'fb53f5c0fd85e6ae5d08b7849881bcc8d5a41a6345d01fd2618be62b64e2274b';
const run = (version: string) => ({
  id: '1788168166-166428000-17374',
  completedAt: '2026-08-31T09:22:46Z',
  tool: { name: 'cargo-ply', version },
});

describe('telling a reader whether a run is still current', () => {
  it('says a different build made it, without ranking the two builds', () => {
    const facts = describeRun(run(RAN_BY), INSTALLED);
    expect(facts.differentBuild).toBe(true);
    const said = facts.lines.join(' ');
    expect(said).toContain('Ply itself has changed since this run');
    expect(said).toContain('every check would run again');
    // A run from a *newer* Ply is equally "a different build". The viewer
    // compares opaque strings and cannot order them, so it must never imply
    // one is ahead of the other.
    for (const forbidden of ['older', 'newer', 'out of date', 'outdated', 'stale']) {
      expect(said.toLowerCase()).not.toContain(forbidden);
    }
  });

  it('says nothing about the build when the two identities match', () => {
    const facts = describeRun(run(INSTALLED), INSTALLED);
    expect(facts.differentBuild).toBe(false);
    expect(facts.lines.join(' ')).not.toContain('Ply itself has changed');
  });

  // The extension resolves `cargo ply` through its own PATH, which is not
  // always the terminal's, and a binary can be replaced underneath it.
  // Comparing against the wrong binary is worse than saying nothing.
  it('says nothing when it could not learn which Ply is installed', () => {
    for (const unknown of [undefined, '', '0.1.0']) {
      const facts = describeRun(run(RAN_BY), unknown);
      expect(facts.differentBuild, JSON.stringify(unknown)).toBe(false);
      expect(facts.lines.join(' ')).not.toContain('Ply itself has changed');
    }
  });

  it('says nothing when the run itself recorded no build identity', () => {
    const facts = describeRun(run('0.1.0'), INSTALLED);
    expect(facts.differentBuild).toBe(false);
  });

  it('always leads with when the run finished, in words not a serial number', () => {
    const facts = describeRun(run(INSTALLED), INSTALLED);
    expect(facts.lines[0]).toMatch(/^Finished /);
    expect(facts.lines[0]).not.toContain('1788168166');
  });

  it('recognises a build identity and rejects a hand-edited version', () => {
    expect(isBuildIdentity(RAN_BY)).toBe(true);
    for (const no of ['0.1.0', 'render', '', 'abc', RAN_BY.slice(0, 63), `${RAN_BY}0`, RAN_BY.toUpperCase()]) {
      expect(isBuildIdentity(no), JSON.stringify(no)).toBe(false);
    }
  });
});
