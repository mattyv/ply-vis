import { randomBytes } from 'node:crypto';
import * as vscode from 'vscode';
import type { LoadState, WorkspaceRoot } from '../core/result-source';
import { PanelController, type PanelSurface } from '../host/panel-controller';
import type { StateStore } from '../host/state-store';
import { createNonce, webviewHtml } from '../host/webview-html';
import type { SourceNavigator } from './source-navigation';

class VsCodeSurface implements PanelSurface {
  public constructor(private readonly webview: vscode.Webview) {}
  public postMessage(message: unknown): Thenable<boolean> { return this.webview.postMessage(message); }
  public onMessage(listener: (message: unknown) => void | Promise<void>): vscode.Disposable { return this.webview.onDidReceiveMessage(listener); }
}

export class PlyPanel implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private controller: PanelController | undefined;
  public constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly state: StateStore,
    private readonly navigator: SourceNavigator,
    private readonly title = 'Ply Visual',
  ) {}

  public show(root: WorkspaceRoot, loadState: LoadState): void {
    if (!this.panel) this.create();
    this.panel!.reveal(vscode.ViewColumn.Active, true);
    this.controller!.update(root, loadState);
  }

  public update(root: WorkspaceRoot, loadState: LoadState): void { this.controller?.update(root, loadState); }
  public dispose(): void { this.controller?.dispose(); this.controller = undefined; this.panel?.dispose(); this.panel = undefined; }

  private create(): void {
    const mediaRoot = vscode.Uri.joinPath(this.extensionUri, 'media');
    const panel = vscode.window.createWebviewPanel('ply.visual', this.title, vscode.ViewColumn.Active, {
      enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [mediaRoot],
    });
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js')).toString();
    const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'ply-vis', 'styles.css')).toString();
    panel.webview.html = webviewHtml({ scriptUri, styleUri, cspSource: panel.webview.cspSource, nonce: createNonce(randomBytes(16)) });
    this.panel = panel;
    this.controller = new PanelController(new VsCodeSurface(panel.webview), this.state, this.navigator,
      { error: (message) => { void vscode.window.showErrorMessage(message); } });
    panel.onDidDispose(() => { this.controller?.dispose(); this.controller = undefined; this.panel = undefined; });
  }
}
