import { parseVisualEnvelope, type LoadState, type WorkspaceRoot } from './result-source';

export function loadRenderedSpec(root: WorkspaceRoot, json: string): LoadState {
  const envelope = parseVisualEnvelope(JSON.parse(json));
  const entry = {
    id: envelope.run.id,
    path: `views/${envelope.run.id}/visual.json`,
    completedAt: envelope.run.completedAt,
    outcome: envelope.run.outcome,
  } as const;
  return { snapshot: { root, index: { protocolVersion: 1, currentRun: entry.id, runs: [entry] }, entry, envelope } };
}
