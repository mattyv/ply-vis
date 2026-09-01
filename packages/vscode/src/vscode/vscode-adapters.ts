import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import * as vscode from 'vscode';
import type { FileReader } from '../core/result-source';
import { DISCOVERY_EXCLUDED_DIRECTORIES } from '../core/result-source';
import type { EditorPort, ExactEditorTarget } from './source-navigation';

export class NodeFileReader implements FileReader {
  public async readText(path: string): Promise<string> { return fs.readFile(path, 'utf8'); }
  public async exists(path: string): Promise<boolean> { try { await fs.access(path); return true; } catch { return false; } }
  public async findPlySpecs(root: string): Promise<string[]> {
    const found: string[] = [];
    const pending = [root];
    while (pending.length > 0) {
      const directory = pending.pop()!;
      let entries;
      try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        const path = join(directory, entry.name);
        if (entry.isDirectory() && !DISCOVERY_EXCLUDED_DIRECTORIES.has(entry.name)) pending.push(path);
        else if (entry.isFile() && (entry.name === 'ply.yaml' || entry.name.endsWith('.ply.yaml'))) found.push(path);
      }
    }
    return found.sort();
  }
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
