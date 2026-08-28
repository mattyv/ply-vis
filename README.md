# Ply Visual

Ply Visual renders completed [Ply](https://github.com/mattyv/ply) verification runs as interactive, inspectable views. It aims to speed up experienced developers by providing a useful middle ground between “trust me, bro” generated code and reading every changed line slowly. You can see what a specification describes, inspect its evidence, and jump to exact source locations at a glance.

This project is still being built and is **extremely beta**. Its protocol, packaging, and user interface may change quickly.

## How it fits together

Ply produces immutable visual evidence after a run. The LLM manages Ply runs; the IDE does not execute or supervise them. Each IDE extension observes completed artifacts, renders them with the shared viewer, and navigates back to source.

The repository contains three packages:

- `packages/ply-vis`: the shared browser viewer and visual protocol
- `packages/vscode`: the thin VS Code observer and navigator
- `packages/jetbrains`: the thin JetBrains observer and navigator

VS Code and JetBrains use the same viewer. This keeps interaction, rendering, and protocol behavior consistent without tying Ply to one editor.

Visual runs are snapshots of verification evidence, not graphical diffs. Ply Visual deliberately omits code-change highlighting. Your editor and version-control tools already handle changes; this project focuses on what the specification and its verification evidence mean.

## Development

Install dependencies and run the shared checks from the repository root:

```sh
npm install
npm run build
npm test
npm run test:e2e
npm run test:extension
```

The Playwright suites cover the shared viewer and its VS Code webview host. The extension-host smoke test launches VS Code and loads the built extension. JetBrains uses Gradle from its package directory:

```sh
cd packages/jetbrains
./gradlew test
```

Ply Visual reads artifacts produced by Ply. It does not replace Ply's verifier or define the artifact format independently.
