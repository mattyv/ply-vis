import type { Disposable } from './surface';
import type { LoadState, WorkspaceRoot } from '../core/result-source';
import { firstUseMessage } from '../core/first-use';
import { artifactMessage, errorMessage, parseViewerRequest, restoreStateMessage } from './bridge';
import type { StateStore } from './state-store';
import type { SourceNavigator } from '../vscode/source-navigation';

export interface PanelSurface {
  postMessage(message: unknown): PromiseLike<boolean>;
  onMessage(listener: (message: unknown) => void | Promise<void>): Disposable;
}
export interface HostReporter { error(message: string): void }
/** Shows Ply's own explanation of a diagnostic code. Kept behind an interface
 * so the controller can be tested without spawning a process. */
export interface CodeExplainer {
  explain(root: WorkspaceRoot, code: string): Promise<void>;
  /** Asks the reader which code they want, then explains it. */
  prompt(root: WorkspaceRoot): Promise<void>;
}

export class PanelController implements Disposable {
  private loadState: LoadState = {};
  private root: WorkspaceRoot | undefined;
  private readonly subscription: Disposable;
  public constructor(private readonly surface: PanelSurface, private readonly state: StateStore,
    private readonly navigator: SourceNavigator, private readonly reporter: HostReporter,
    private readonly explainer?: CodeExplainer) {
    this.subscription = surface.onMessage((message) => this.receive(message));
  }
  public update(root: WorkspaceRoot, state: LoadState): void {
    this.root = root;
    this.loadState = state;
    if (state.snapshot) void this.surface.postMessage(artifactMessage(state.snapshot.envelope));
    if (state.error) void this.surface.postMessage(errorMessage(`${state.error}${state.snapshot ? ' Showing the last complete run.' : ''}`));
  }
  public dispose(): void { this.subscription.dispose(); }
  private async receive(raw: unknown): Promise<void> {
    const message = parseViewerRequest(raw);
    if (!message) { this.reporter.error('Ply visual sent an invalid host message.'); return; }
    if (message.type === 'error') { this.reporter.error(`Ply visual: ${message.message}`); return; }
    if (message.type === 'persist-state') { await this.state.persistViewState(message.state); return; }
    if (message.type === 'explain-prompt') {
      if (!this.root) { this.reporter.error('Select a Ply workspace root before explaining a code.'); return; }
      await this.explainer?.prompt(this.root);
      return;
    }
    if (message.type === 'explain') {
      if (!this.root) { this.reporter.error('Select a Ply workspace root before explaining a code.'); return; }
      await this.explainer?.explain(this.root, message.code);
      return;
    }
    if (message.type === 'navigate') {
      if (!this.root) { this.reporter.error('Select a Ply workspace root before opening source.'); return; }
      await this.navigator.open(this.root, message.source);
      return;
    }
    if (message.type === 'ready') await this.surface.postMessage(restoreStateMessage(this.state.viewState()));
    if (this.loadState.snapshot) await this.surface.postMessage(artifactMessage(this.loadState.snapshot.envelope));
    else await this.surface.postMessage(errorMessage(this.loadState.error ?? firstUseMessage(true)));
  }
}
