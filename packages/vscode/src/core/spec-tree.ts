import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { WorkspaceRoot } from './result-source';

export interface SpecWorkspace { readonly name: string; readonly path: string }
export interface SpecNode { readonly kind: 'spec'; readonly name: string; readonly path: string; readonly root: WorkspaceRoot }
export interface SpecFolderNode { readonly kind: 'folder'; readonly name: string; readonly path: string; readonly children: SpecTreeNode[] }
export type SpecTreeNode = SpecFolderNode | SpecNode;

function contains(parent: string, child: string): boolean {
  const nested = relative(resolve(parent), resolve(child));
  return nested === '' || (!isAbsolute(nested) && nested !== '..' && !nested.startsWith(`..${sep}`));
}

function sortNodes(nodes: SpecTreeNode[]): void {
  nodes.sort((left, right) => left.kind === right.kind
    ? left.name.localeCompare(right.name)
    : left.kind === 'folder' ? -1 : 1);
  for (const node of nodes) if (node.kind === 'folder') sortNodes(node.children);
}

export function buildSpecTree(workspaces: readonly SpecWorkspace[], roots: readonly WorkspaceRoot[]): SpecFolderNode[] {
  const folders = workspaces.map((workspace): SpecFolderNode => ({ kind: 'folder', name: workspace.name, path: workspace.path, children: [] }));
  for (const root of roots) {
    const specPath = root.specPath ?? join(root.path, 'ply.yaml');
    const candidates = workspaces.map((workspace, index) => ({ workspace, folder: folders[index]! }))
      .filter(({ workspace }) => contains(workspace.path, specPath))
      .sort((left, right) => right.workspace.path.length - left.workspace.path.length);
    const match = candidates[0];
    if (!match) continue;
    const parts = relative(match.workspace.path, specPath).split(sep);
    const specName = parts.pop() ?? basename(specPath);
    let parent = match.folder;
    for (const part of parts) {
      let child = parent.children.find((node): node is SpecFolderNode => node.kind === 'folder' && node.name === part);
      if (!child) {
        child = { kind: 'folder', name: part, path: join(parent.path, part), children: [] };
        parent.children.push(child);
      }
      parent = child;
    }
    parent.children.push({ kind: 'spec', name: specName, path: specPath, root });
  }
  sortNodes(folders);
  return folders.filter((folder) => folder.children.length > 0);
}
