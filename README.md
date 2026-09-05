# Ply Visual

Ply Visual renders completed [Ply](https://github.com/mattyv/ply) verification runs as interactive, inspectable views. It aims to speed up experienced developers by providing a useful middle ground between “trust me, bro” generated code and reading every changed line slowly. You can see what a specification describes, inspect its evidence, and jump to exact source locations at a glance.

This project is still being built and is **extremely beta**. Its protocol, packaging, and user interface may change quickly.

## How it fits together

Ply produces immutable visual evidence after a run. Each IDE extension observes
completed artifacts, renders them with the shared viewer, and navigates back to
source. VS Code can also start verification or directly render a named spec when
the selected spec has no published run.

The repository contains three packages:

- `packages/ply-vis`: the shared browser viewer and visual protocol
- `packages/vscode`: the thin VS Code observer and navigator
- `packages/jetbrains`: the thin JetBrains observer and navigator

VS Code and JetBrains use the same viewer. This keeps interaction, rendering, and protocol behavior consistent without tying Ply to one editor.

Visual runs are snapshots of verification evidence, not graphical diffs. Ply Visual deliberately omits code-change highlighting. Your editor and version-control tools already handle changes; this project focuses on what the specification and its verification evidence mean.

## Finding Ply projects

Ply Visual searches every open workspace or project recursively for `ply.yaml`
and named `*.ply.yaml` files.
It skips generated and dependency directories such as `.git`, `target`,
`node_modules`, `build`, and Gradle caches, so monorepo packages work without
moving their specs to the workspace root. It remembers the previous search's
spec paths and checks them first at startup. If any remembered path is stale, it
falls back to a full search and replaces the cache.

The sidebar and tool window distinguish the two common first-use states:

- **No Ply specs found** means the open workspace does not contain a discoverable
  `ply.yaml`.
- **No completed visual runs** means a spec was found, but Ply has not published
  `target/ply/view.json` for it yet. Run
  `cargo ply verify <spec-directory> --publish-view` to publish one.

Named `*.ply.yaml` files can be rendered directly from the sidebar with
`cargo ply render`; they do not need a Cargo project or a completed verification
run.

The JetBrains extension only observes completed artifacts. VS Code exposes an
explicit run action; it does not start Ply automatically.

In VS Code, click a completed run to reuse the current Ply Visual tab. Right-click
the run and choose **Open in New Tab** to keep multiple visuals open.

Drag anywhere on the canvas to pan, or double-click an item to focus and fit it.
Ply Visual hides unrelated geometry while focused. Hover diagram items for Ply's
tooltips. The Details pane starts closed; select an item to open it, or use the
edge control to show or hide it.

## Install locally

Build, package, and install the VS Code extension from this repository:

```sh
npm run install:local
```

Reload the VS Code window after installation so the running extension host picks
up the new package.

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

JetBrains builds keep Gradle downloads and IntelliJ Platform caches outside the
checkout, under the current user's cache directory. Set `PLY_VIS_CACHE_HOME` to
choose a different shared cache root, or `GRADLE_USER_HOME` to override Gradle's
cache alone.

Ply Visual reads artifacts produced by Ply. It does not replace Ply's verifier or define the artifact format independently.

## License

Licensed under either of [Apache License, Version 2.0](LICENSE-APACHE) or
[MIT license](LICENSE-MIT) at your option.

Unless you explicitly state otherwise, any contribution intentionally submitted for
inclusion in this project by you, as defined in the Apache-2.0 license, shall be
dual-licensed as above, without any additional terms or conditions.
