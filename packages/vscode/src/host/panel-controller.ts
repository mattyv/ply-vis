import type { Disposable } from './surface';
import type { LoadState, VisualEnvelope, WorkspaceRoot } from '../core/result-source';
import { firstUseMessage } from '../core/first-use';
import { artifactMessage, capabilitiesMessage, clearMessage, parseViewerRequest, restoreStateMessage, type HostResponse } from './bridge';
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

/** How many unacknowledged artifacts to remember. Loads are one per project
 *  switch or index change, and each acknowledgement clears everything older,
 *  so this is only ever reached by a run of refused artifacts. */
const PENDING_LIMIT = 32;

export class PanelController implements Disposable {
  private loadState: LoadState = {};
  private root: WorkspaceRoot | undefined;
  /** The root of the drawing actually on screen, which is not always the
   * selected one: selecting a project with no completed run leaves the
   * previous project's drawing up. Navigation follows what the reader can
   * see, or a source link in one project's drawing opened the same relative
   * path inside another (external review, 2026-09-06). */
  private displayedRoot: WorkspaceRoot | undefined;
  /** Every artifact sent and not yet acknowledged, oldest first, each with
   *  the run id it carried. One is promoted to `displayedRoot` when the
   *  viewer says it drew that run -- the host and the viewer validate
   *  separately, and an envelope this side accepts is not one the other side
   *  drew.
   *
   *  This is a list rather than a single slot because acknowledgements are
   *  not guaranteed to arrive before the next load is posted. With one slot,
   *  a second load overwrote the first's identity, the first's
   *  acknowledgement then matched nothing, and `displayedRoot` kept pointing
   *  at a project two switches back -- so a source link in the drawing on
   *  screen opened a file from a project the reader had left twice over. */
  private pending: { root: WorkspaceRoot; deliveryId: string }[] = [];
  /** Distinguishes one *delivery* from another. The run's own id does not:
   *  two deliveries can carry the same run -- copies of one project's
   *  artifacts, one of them damaged -- and matching on it resolved the good
   *  copy's acknowledgement to the refused delivery, pointing source links
   *  at a project the reader was not looking at. */
  private deliveries = 0;
  private readonly subscription: Disposable;
  public constructor(private readonly surface: PanelSurface, private readonly state: StateStore,
    private readonly navigator: SourceNavigator, private readonly reporter: HostReporter,
    private readonly explainer?: CodeExplainer,
    private readonly installedTool?: () => string | undefined) {
    this.subscription = surface.onMessage((message) => this.receive(message));
  }
  public update(root: WorkspaceRoot, state: LoadState): void {
    this.root = root;
    this.loadState = state;
    if (state.snapshot) {
      void this.surface.postMessage(this.deliver(root, state.snapshot.envelope));
    } else if (this.showing() && this.showing()!.path !== root.path) {
      // Nothing to replace the drawing with, and it belongs to a different
      // project than the one now selected. Say so rather than leaving it up
      // as though it described the new one.
      //
      // This was already the intent; it did not happen. The message was
      // built as `error`, which travels viewer-to-host, so the viewer's own
      // guard dropped it and the drawing stayed exactly where it was. A
      // `clear` is a message the viewer accepts and acts on.
      void this.surface.postMessage(clearMessage(
        `No completed Ply run for ${root.name} yet. Showing nothing rather than ${this.showing()!.name}'s last run, which describes a different project.`,
      ));
      this.displayedRoot = undefined;
      this.pending = [];
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
  /** What the reader is looking at, or is about to be: an artifact already
   *  in flight ends up on screen just as surely as one acknowledged, and
   *  deciding only from the acknowledged one meant selecting an empty
   *  project during that gap sent no clear at all -- the in-flight drawing
   *  then arrived and represented a project that has no run. */
  /** Sends an artifact and remembers that it awaits acknowledgement. Every
   *  send goes through here, including the resend a viewer asks for when it
   *  comes up: a fresh viewer has drawn nothing yet, so its resend is as
   *  unacknowledged as a first delivery. */
  private deliver(root: WorkspaceRoot, envelope: VisualEnvelope): HostResponse {
    const deliveryId = `d${(this.deliveries += 1)}`;
    this.pending.push({ root, deliveryId });
    // An artifact the viewer refuses is never acknowledged, so its entry
    // would sit here forever. The list is bounded rather than pruned by
    // rejection, because a rejection carries no id to prune by.
    if (this.pending.length > PENDING_LIMIT) this.pending.shift();
    return artifactMessage(envelope, deliveryId);
  }
  private showing(): WorkspaceRoot | undefined {
    return this.pending.length > 0 ? this.pending[this.pending.length - 1]!.root : this.displayedRoot;
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
    if (message.type === 'artifact-accepted') {
      // The viewer drew it, so this is now what the reader is looking at.
      // An envelope it refused never gets here, which is the point: source
      // links keep resolving against the drawing that is actually on screen.
      const at = this.pending.findIndex((sent) => sent.deliveryId === message.deliveryId);
      if (at >= 0) {
        this.displayedRoot = this.pending[at]!.root;
        // Anything posted before it was either refused or superseded; either
        // way it is not what the reader is looking at now.
        this.pending.splice(0, at + 1);
      }
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
      await this.surface.postMessage(capabilitiesMessage(this.explainer !== undefined, this.installedTool?.()));
      await this.surface.postMessage(restoreStateMessage(this.state.viewState()));
    }
    if (this.loadState.snapshot && this.root) {
      await this.surface.postMessage(this.deliver(this.root, this.loadState.snapshot.envelope));
    } else {
      this.displayedRoot = undefined;
      this.pending = [];
      await this.surface.postMessage(clearMessage(this.loadState.error ?? firstUseMessage(true)));
    }
  }
}
