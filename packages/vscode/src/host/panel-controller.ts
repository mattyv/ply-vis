import type { Disposable } from './surface';
import type { LoadState, WorkspaceRoot } from '../core/result-source';
import { firstUseMessage } from '../core/first-use';
import { artifactMessage, capabilitiesMessage, clearMessage, parseViewerRequest, restoreStateMessage } from './bridge';
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
  /** The root of the drawing actually on screen, which is not always the
   * selected one: selecting a project with no completed run leaves the
   * previous project's drawing up. Navigation follows what the reader can
   * see, or a source link in one project's drawing opened the same relative
   * path inside another (external review, 2026-09-06). */
  private displayedRoot: WorkspaceRoot | undefined;
  private readonly subscription: Disposable;
  public constructor(private readonly surface: PanelSurface, private readonly state: StateStore,
    private readonly navigator: SourceNavigator, private readonly reporter: HostReporter,
    private readonly explainer?: CodeExplainer) {
    this.subscription = surface.onMessage((message) => this.receive(message));
  }
  public update(root: WorkspaceRoot, state: LoadState): void {
    this.root = root;
    this.loadState = state;
    if (state.snapshot) {
      this.displayedRoot = root;
      void this.surface.postMessage(artifactMessage(state.snapshot.envelope));
    } else if (this.displayedRoot && this.displayedRoot.path !== root.path) {
      // Nothing to replace the drawing with, and it belongs to a different
      // project than the one now selected. Say so rather than leaving it up
      // as though it described the new one.
      //
      // This was already the intent; it did not happen. The message was
      // built as `error`, which travels viewer-to-host, so the viewer's own
      // guard dropped it and the drawing stayed exactly where it was. A
      // `clear` is a message the viewer accepts and acts on.
      void this.surface.postMessage(clearMessage(
        `No completed Ply run for ${root.name} yet. Showing nothing rather than ${this.displayedRoot.name}'s last run, which describes a different project.`,
      ));
      this.displayedRoot = undefined;
    }
    // A notice *about* a drawing that is still on screen must not clear it,
    // so those two situations no longer share one message: with a snapshot
    // up, the reader is told through the host's own reporter; with nothing
    // to draw, the viewer is told to show the reason instead.
    if (state.error) {
      if (state.snapshot) this.reporter.error(`${state.error} Showing the last complete run.`);
      else void this.surface.postMessage(clearMessage(state.error));
    }
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
      // The displayed root, never the selected one: they differ exactly when
      // a project with no run was selected, and opening the selected one's
      // path would land the reader in a file they were not looking at.
      const root = this.displayedRoot;
      if (!root) { this.reporter.error('Select a Ply workspace root with a completed run before opening source.'); return; }
      await this.navigator.open(root, message.source);
      return;
    }
    if (message.type === 'ready') {
      await this.surface.postMessage(capabilitiesMessage(this.explainer !== undefined));
      await this.surface.postMessage(restoreStateMessage(this.state.viewState()));
    }
    if (this.loadState.snapshot) await this.surface.postMessage(artifactMessage(this.loadState.snapshot.envelope));
    else await this.surface.postMessage(clearMessage(this.loadState.error ?? firstUseMessage(true)));
  }
}
