import * as vscode from 'vscode';
import { discoverPlyRoots, type LoadState, ResultSource, type WorkspaceRoot } from '../core/result-source';
import type { StateStore } from '../host/state-store';
import type { NodeFileReader } from './vscode-adapters';

export interface ResultListener { (root: WorkspaceRoot, state: LoadState): void }

export class WorkspaceController implements vscode.Disposable {
  private roots: WorkspaceRoot[] = [];
  private selected: WorkspaceRoot | undefined;
  private readonly watchers: vscode.Disposable[] = [];
  private debounce: NodeJS.Timeout | undefined;
  private generation = 0;
  public constructor(private readonly files: NodeFileReader, private readonly results: ResultSource,
    private readonly state: StateStore, private readonly listener: ResultListener) {}

  public currentRoot(): WorkspaceRoot | undefined { return this.selected; }
  public discoveredRoots(): readonly WorkspaceRoot[] { return this.roots; }

  public async initialize(): Promise<void> {
    await this.discover();
    const folders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of folders) {
      for (const pattern of ['ply.yaml', 'target/ply/view.json', 'target/ply/**/*.json']) {
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, pattern));
        watcher.onDidCreate(() => this.schedule()); watcher.onDidChange(() => this.schedule()); watcher.onDidDelete(() => this.schedule());
        this.watchers.push(watcher);
      }
    }
    if (this.selected) await this.refresh();
  }

  public async chooseRoot(): Promise<WorkspaceRoot | undefined> {
    await this.discover();
    if (!this.roots.length) { await vscode.window.showInformationMessage('No workspace root containing ply.yaml is open.'); return undefined; }
    const selected = this.roots.length === 1 ? this.roots[0] : await vscode.window.showQuickPick(this.roots.map((root) => ({ label: root.name, description: root.path, root })),
      { placeHolder: 'Select the Ply workspace root to inspect' }).then((item) => item?.root);
    if (!selected) return undefined;
    this.selected = selected;
    await this.state.selectRoot(selected.path);
    await this.refresh();
    return selected;
  }

  public async refresh(): Promise<LoadState | undefined> {
    if (!this.selected) return undefined;
    const selected = this.selected;
    const generation = ++this.generation;
    const loaded = await this.results.reload(selected);
    if (generation === this.generation && this.selected?.path === selected.path) this.listener(selected, loaded);
    return loaded;
  }

  public dispose(): void { if (this.debounce) clearTimeout(this.debounce); for (const watcher of this.watchers) watcher.dispose(); }

  private async discover(): Promise<void> {
    const candidates = (vscode.workspace.workspaceFolders ?? []).map((folder) => ({ name: folder.name, path: folder.uri.fsPath }));
    this.roots = await discoverPlyRoots(candidates, this.files);
    const persisted = this.state.selectedRoot();
    this.selected = this.roots.find((root) => root.path === persisted) ?? this.roots[0];
  }

  private schedule(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { void this.discover().then(() => this.refresh()); }, 150);
  }
}
