import { strict as assert } from 'node:assert';
import * as vscode from 'vscode';

export async function run(): Promise<void> {
  await vscode.commands.executeCommand('ply.openVisual');
  await vscode.commands.executeCommand('ply.openVisualInNewTab');
  const deadline = Date.now() + 3_000;
  let visualTabs: readonly vscode.Tab[] = [];
  while (visualTabs.length < 2 && Date.now() < deadline) {
    visualTabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs).filter((tab) => tab.label.startsWith('Ply Visual'));
    if (visualTabs.length < 2) await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.equal(visualTabs.length, 2, 'Open in New Tab should create a second Ply Visual webview tab');
  await vscode.commands.executeCommand('ply.__testNavigate', {
    channel: 'ply-vis', version: 1, type: 'navigate',
    source: { file: 'src/lib.rs', startLine: 1, startColumn: 4, endLine: 1, endColumn: 24 },
  });
  const editor = vscode.window.activeTextEditor;
  assert(editor, 'exact navigation should open the fixture editor');
  assert.equal(editor.document.fileName.endsWith('src/lib.rs'), true);
  assert.deepEqual([editor.selection.start.line, editor.selection.start.character, editor.selection.end.line, editor.selection.end.character], [1, 4, 1, 24]);
}
