import { promises as fs } from 'node:fs';
import * as vscode from 'vscode';
import type { FileReader } from '../core/result-source';
import type { EditorPort, ExactEditorTarget } from './source-navigation';

export class NodeFileReader implements FileReader {
  public async readText(path: string): Promise<string> { return fs.readFile(path, 'utf8'); }
  public async exists(path: string): Promise<boolean> { try { await fs.access(path); return true; } catch { return false; } }
}

export class VsCodeEditor implements EditorPort {
  public async openExact(target: ExactEditorTarget): Promise<void> {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.file(target.path));
    const editor = await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false });
    const range = new vscode.Range(target.startLine, target.startColumn, target.endLine, target.endColumn);
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }
}
