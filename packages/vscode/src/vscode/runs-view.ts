import * as vscode from 'vscode';
import { randomUUID } from 'node:crypto';
import { buildSpecTree, type SpecTreeNode } from '../core/spec-tree';
import { ResultSource, type ArtifactSnapshot, type WorkspaceRoot } from '../core/result-source';

type RunNode = { readonly kind: 'run'; readonly root: WorkspaceRoot; readonly snapshot: ArtifactSnapshot };
type ErrorNode = { readonly kind: 'error'; readonly message: string };
export type RunsTreeNode = SpecTreeNode | RunNode | ErrorNode;

export class RunsView implements vscode.TreeDataProvider<RunsTreeNode> {
  private readonly sessionId = randomUUID();
  private readonly changed = new vscode.EventEmitter<RunsTreeNode | undefined>();
  public readonly onDidChangeTreeData = this.changed.event;
  private roots: readonly WorkspaceRoot[] = [];

  public constructor(private readonly results: ResultSource) {}

  public update(roots: readonly WorkspaceRoot[]): void {
    this.roots = roots;
    this.changed.fire(undefined);
  }

  public getTreeItem(node: RunsTreeNode): vscode.TreeItem {
    if (node.kind === 'folder') {
      const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
      item.resourceUri = vscode.Uri.file(node.path);
      item.id = `${this.sessionId}:${node.path}`;
      item.contextValue = 'ply.folder';
      item.iconPath = vscode.ThemeIcon.Folder;
      return item;
    }
    if (node.kind === 'spec') {
      const item = new vscode.TreeItem(node.name, node.root.specPath
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed);
      item.resourceUri = vscode.Uri.file(node.path);
      item.id = `${this.sessionId}:${node.path}`;
      item.contextValue = node.root.specPath ? 'ply.namedSpec' : 'ply.workspaceSpec';
      item.iconPath = new vscode.ThemeIcon('symbol-file');
      item.command = { command: 'ply.renderSpec', title: 'Render Ply Spec', arguments: [node.root] };
      return item;
    }
    if (node.kind === 'run') {
      const item = new vscode.TreeItem(node.snapshot.envelope.run.id, vscode.TreeItemCollapsibleState.None);
      item.description = node.snapshot.entry.outcome;
      item.tooltip = `Completed ${node.snapshot.entry.completedAt}`;
      item.contextValue = 'ply.visualRun';
      item.iconPath = new vscode.ThemeIcon('preview');
      item.command = { command: 'ply.openVisual', title: 'Open Visual', arguments: [node.root] };
      return item;
    }
    const item = new vscode.TreeItem(node.message, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon('error');
    item.tooltip = node.message;
    return item;
  }

  public async getChildren(node?: RunsTreeNode): Promise<RunsTreeNode[]> {
    if (!node) {
      const workspaces = (vscode.workspace.workspaceFolders ?? []).map((folder) => ({ name: folder.name, path: folder.uri.fsPath }));
      return buildSpecTree(workspaces, this.roots);
    }
    if (node.kind === 'folder') return node.children;
    if (node.kind !== 'spec' || node.root.specPath) return [];
    const state = await this.results.reload(node.root);
    const children: RunsTreeNode[] = [];
    if (state.snapshot) children.push({ kind: 'run', root: node.root, snapshot: state.snapshot });
    if (state.error) children.push({ kind: 'error', message: state.error });
    return children;
  }
}
