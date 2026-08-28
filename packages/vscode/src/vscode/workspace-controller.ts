import * as vscode from 'vscode';
import { discoverPlyRoots, type LoadState, ResultSource, shouldHandleWorkspaceChange, type WorkspaceRoot } from '../core/result-source';
import type { StateStore } from '../host/state-store';
import type { NodeFileReader } from './vscode-adapters';

export const WATCH_PATTERNS = ['**/ply.yaml', '**/target/ply/view.json', '**/target/ply/**/*.json'] as const;
export interface ResultListener { (root: WorkspaceRoot | undefined, state: LoadState): void }

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
      for (const pattern of WATCH_PATTERNS) {
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, pattern));
        const handle = (uri: vscode.Uri) => { if (shouldHandleWorkspaceChange(folder.uri.fsPath, uri.fsPath)) this.schedule(); };
        watcher.onDidCreate(handle); watcher.onDidChange(handle); watcher.onDidDelete(handle);
        this.watchers.push(watcher);
      }
    }
    if (this.selected) await this.refresh(); else this.listener(undefined, {});
  }

  public async chooseRoot(): Promise<WorkspaceRoot | undefined> {
    await this.discover();
    if (!this.roots.length) { await vscode.window.showInformationMessage('No Ply specs found in this workspace.'); return undefined; }
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
    this.debounce = setTimeout(() => { void this.discover().then(async () => { if (this.selected) await this.refresh(); else this.listener(undefined, {}); }); }, 150);
  }
}
