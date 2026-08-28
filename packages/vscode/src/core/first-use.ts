export const NO_SPECS_MESSAGE = 'No Ply specs found in this workspace.';
export const NO_COMPLETED_RUNS_MESSAGE = 'Ply specs found, but no completed visual runs have been published yet. Run `cargo ply verify <root> --publish-view` to publish one.';

export function firstUseMessage(hasSpecs: boolean): string {
  return hasSpecs ? NO_COMPLETED_RUNS_MESSAGE : NO_SPECS_MESSAGE;
}
