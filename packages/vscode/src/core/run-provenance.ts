/// What a reader needs to know about whether a published run still describes
/// the current world, and how to say it.
///
/// Ply moves its build identity whenever its behaviour could have changed,
/// and refuses to carry a stored result forward across that move. The viewer
/// listed a run with only its id and outcome, so a reader could not tell a
/// run made by today's Ply from one made a week ago by a different build —
/// they had to ask a person, who compared two hashes by hand.
///
/// Two rules this module exists to keep:
///
/// **Facts, not a verdict.** The spec is explicit that there is no `stale`
/// state and nothing for a human to re-bless: the hash is the confirmation.
/// So this reports what moved, and leaves the conclusion to the reader.
///
/// **Identities are opaque.** Ply owns the rule; this only compares two
/// strings for equality. It can say *different*, never *older* or *newer* —
/// a run made by a build newer than the one installed is equally "a
/// different build", and the remedy is the same either way.

/// A run's own record of when and by what it was made. Deliberately a
/// structural type: this takes the run block of a §8 envelope without
/// depending on the rest of it.
export interface RunIdentity {
  readonly completedAt: string;
  readonly tool: { readonly version: string };
}

export interface RunFacts {
  /// Whether a build other than the installed one made this run. False
  /// whenever that cannot be established, never a guess.
  readonly differentBuild: boolean;
  /// Plain sentences, in reading order, each one true on its own.
  readonly lines: readonly string[];
}

/// Ply's build identity is a blake3 digest: 64 lowercase hex characters.
///
/// Checked rather than assumed, because the same field carried the
/// hand-edited package version (`0.1.0`) from four of Ply's commands until
/// 2026-09-06. Comparing against that would have reported a different build
/// for the same binary, every time.
export function isBuildIdentity(value: string | undefined): boolean {
  return value !== undefined && /^[0-9a-f]{64}$/.test(value);
}

const finishedWhen = (completedAt: string): string => {
  const when = new Date(completedAt);
  // An unparseable date is still worth reporting verbatim -- it came from
  // the run, and hiding it would lose the only timing a reader has.
  if (Number.isNaN(when.getTime())) return `Finished ${completedAt}.`;
  return `Finished ${when.toLocaleString()}.`;
};

export function describeRun(run: RunIdentity, installedTool: string | undefined): RunFacts {
  const lines = [finishedWhen(run.completedAt)];
  // Both sides must be real identities. If either is the old package
  // version, or the host could not be asked, the honest output is silence:
  // comparing against the wrong binary is worse than saying nothing.
  const comparable = isBuildIdentity(installedTool) && isBuildIdentity(run.tool.version);
  const differentBuild = comparable && run.tool.version !== installedTool;
  if (differentBuild) {
    lines.push(
      'Ply itself has changed since this run: the build installed now is not the one that made it, '
      + 'so nothing here would be carried forward — every check would run again.',
    );
  }
  return { differentBuild, lines };
}

/// The one-line tail for a list entry, or nothing when there is nothing to
/// add. Kept here so the list and the drawing cannot word it differently.
export function runListNote(facts: RunFacts): string | undefined {
  return facts.differentBuild ? 'made by a different Ply' : undefined;
}
