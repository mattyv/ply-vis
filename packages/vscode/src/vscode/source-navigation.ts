import { posix } from 'node:path';
import type { SourceRange, WorkspaceRoot } from '../core/result-source';
import { isSafeRelativePath } from '../core/result-source';

export interface ExactEditorTarget { readonly path: string; readonly startLine: number; readonly startColumn: number; readonly endLine: number; readonly endColumn: number }
export interface EditorPort { openExact(target: ExactEditorTarget): Promise<void> }

export class SourceNavigator {
  public constructor(private readonly editor: EditorPort) {}
  public async open(root: WorkspaceRoot, source: SourceRange): Promise<void> {
    if (!isSafeRelativePath(source.file)) throw new Error('The visual artifact does not contain a safe exact source path.');
    await this.editor.openExact({ path: posix.join(root.path, source.file), startLine: source.startLine, startColumn: source.startColumn,
      endLine: source.endLine, endColumn: source.endColumn });
  }
}
