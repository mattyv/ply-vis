import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { ResultSource, type LoadState, type WorkspaceRoot } from './core/result-source';
import { loadRenderedSpec } from './core/rendered-spec';
import { parseViewerRequest } from './host/bridge';
import { StateStore } from './host/state-store';
import { PlyPanel } from './vscode/panel';
import { RunsView } from './vscode/runs-view';
import { SourceNavigator } from './vscode/source-navigation';
import { NodeFileReader, VsCodeEditor } from './vscode/vscode-adapters';
import { WorkspaceController } from './vscode/workspace-controller';

const run = promisify(execFile);

function requestedRoot(target: unknown): WorkspaceRoot | undefined {
  if (typeof target !== 'object' || target === null) return undefined;
  const node = target as { readonly root?: unknown };
  const candidate = (typeof node.root === 'object' && node.root !== null ? node.root : target) as Partial<WorkspaceRoot>;
  return typeof candidate.name === 'string' && typeof candidate.path === 'string' ? candidate as WorkspaceRoot : undefined;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const files = new NodeFileReader();
  const results = new ResultSource(files);
  const state = new StateStore(context.workspaceState);
  const navigator = new SourceNavigator(new VsCodeEditor());
  const panel = new PlyPanel(context.extensionUri, state, navigator);
  const runsView = new RunsView(results);
  let workspace: WorkspaceController;
  workspace = new WorkspaceController(files, results, state, (root, load) => {
    runsView.update(workspace.discoveredRoots());
    if (root) panel.update(root, load);
  });
  context.subscriptions.push(panel, workspace, vscode.window.registerTreeDataProvider('ply.visualRuns', runsView));
  context.subscriptions.push(vscode.commands.registerCommand('ply.refreshVisual', () => workspace.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand('ply.selectRoot', () => workspace.chooseRoot()));
  context.subscriptions.push(vscode.commands.registerCommand('ply.openSpec', async (target?: unknown) => {
    const root = requestedRoot(target) ?? workspace.currentRoot() ?? await workspace.chooseRoot();
    if (!root) return;
    await workspace.selectRoot(root);
    const specPath = root.specPath ?? join(root.path, 'ply.yaml');
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(vscode.Uri.file(specPath)));
  }));

  const renderSpec = async (target?: unknown): Promise<void> => {
    const root = requestedRoot(target) ?? workspace.currentRoot() ?? await workspace.chooseRoot();
    if (!root) return;
    await workspace.selectRoot(root);
    const specPath = root.specPath ?? join(root.path, 'ply.yaml');
    await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `Rendering ${vscode.workspace.asRelativePath(specPath)}` }, async () => {
      try {
        const { stdout } = await run('cargo', ['ply', '--json', 'render', specPath], { cwd: root.path, maxBuffer: 10 * 1024 * 1024 });
        panel.show(root, loadRenderedSpec(root, stdout));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`Ply render failed: ${message}`);
      }
    });
  };
  const runAndPublish = async (target?: unknown): Promise<void> => {
    const root = requestedRoot(target) ?? workspace.currentRoot() ?? await workspace.chooseRoot();
    if (!root) return;
    if (root.specPath) { await renderSpec(root); return; }
    await workspace.selectRoot(root);
    const terminal = vscode.window.createTerminal({ name: 'Ply Verify', cwd: root.path });
    terminal.show();
    terminal.sendText('cargo ply verify . --publish-view');
  };
  context.subscriptions.push(vscode.commands.registerCommand('ply.runAndPublish', runAndPublish));
  context.subscriptions.push(vscode.commands.registerCommand('ply.renderSpec', renderSpec));

  const visual = async (target?: unknown): Promise<{ root: WorkspaceRoot; loaded: LoadState } | undefined> => {
    const root = requestedRoot(target) ?? workspace.currentRoot() ?? await workspace.chooseRoot();
    if (!root) return undefined;
    await workspace.selectRoot(root);
    if (root.specPath) { await renderSpec(root); return undefined; }
    const loaded = await workspace.refresh() ?? results.state(root);
    return { root, loaded };
  };
  context.subscriptions.push(vscode.commands.registerCommand('ply.openVisual', async (target?: unknown) => {
    const selected = await visual(target);
    if (!selected) return;
    panel.show(selected.root, selected.loaded);
  }));
  context.subscriptions.push(vscode.commands.registerCommand('ply.openVisualInNewTab', async (target?: unknown) => {
    const selected = await visual(target);
    if (!selected) return;
    const tab = new PlyPanel(context.extensionUri, state, navigator, `Ply Visual — ${selected.root.name}`);
    context.subscriptions.push(tab);
    tab.show(selected.root, selected.loaded);
  }));
  if (process.env.PLY_VSCODE_TEST === '1') {
    context.subscriptions.push(vscode.commands.registerCommand('ply.__testNavigate', async (message: unknown) => {
      const parsed = parseViewerRequest(message);
      const root = workspace.currentRoot();
      if (parsed?.type !== 'navigate' || !root) throw new Error('Expected an exact navigation message and selected root.');
      await navigator.open(root, parsed.source);
    }));
  }
  await workspace.initialize();
}

export function deactivate(): void {}
