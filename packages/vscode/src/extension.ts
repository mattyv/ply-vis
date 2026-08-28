import * as vscode from 'vscode';
import { ResultSource, type LoadState, type WorkspaceRoot } from './core/result-source';
import { parseViewerRequest } from './host/bridge';
import { StateStore } from './host/state-store';
import { PlyPanel } from './vscode/panel';
import { SourceNavigator } from './vscode/source-navigation';
import { NodeFileReader, VsCodeEditor } from './vscode/vscode-adapters';
import { WorkspaceController } from './vscode/workspace-controller';

class RunsView implements vscode.TreeDataProvider<vscode.TreeItem> {
  private readonly changed = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this.changed.event;
  private items: vscode.TreeItem[] = [new vscode.TreeItem('No complete visual run loaded')];
  public update(root: WorkspaceRoot, state: LoadState): void {
    const items: vscode.TreeItem[] = [new vscode.TreeItem(root.name, vscode.TreeItemCollapsibleState.None)];
    if (state.snapshot) items.push(new vscode.TreeItem(`${state.snapshot.envelope.run.id} · ${state.snapshot.entry.outcome}`));
    if (state.error) { const error = new vscode.TreeItem(`Error: ${state.error}`); error.tooltip = state.snapshot ? 'Showing the last complete run.' : state.error; items.push(error); }
    this.items = items; this.changed.fire();
  }
  public getTreeItem(item: vscode.TreeItem): vscode.TreeItem { return item; }
  public getChildren(): vscode.TreeItem[] { return this.items; }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const files = new NodeFileReader();
  const results = new ResultSource(files);
  const state = new StateStore(context.workspaceState);
  const navigator = new SourceNavigator(new VsCodeEditor());
  const panel = new PlyPanel(context.extensionUri, state, navigator);
  const runsView = new RunsView();
  const workspace = new WorkspaceController(files, results, state, (root, load) => { runsView.update(root, load); panel.update(root, load); });
  context.subscriptions.push(panel, workspace, vscode.window.registerTreeDataProvider('ply.visualRuns', runsView));
  context.subscriptions.push(vscode.commands.registerCommand('ply.refreshVisual', () => workspace.refresh()));
  context.subscriptions.push(vscode.commands.registerCommand('ply.selectRoot', () => workspace.chooseRoot()));
  context.subscriptions.push(vscode.commands.registerCommand('ply.openVisual', async () => {
    const root = workspace.currentRoot() ?? await workspace.chooseRoot();
    if (!root) return;
    const loaded = await workspace.refresh() ?? results.state(root);
    panel.show(root, loaded);
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
