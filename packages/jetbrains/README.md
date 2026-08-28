# Ply Visual for JetBrains

This package hosts the shared Ply viewer in a JetBrains tool window. It targets RustRover first and uses standard IntelliJ Platform APIs. It watches complete visual artifacts published by Ply, keeps the last valid view when a reload fails, and opens recorded source locations. It never runs Ply or interprets `ply.yaml` and `ply.lock`.

## Build and test

Build `@ply/vis` first so `../ply-vis/dist` exists. Then run:

```sh
./gradlew clean test buildPlugin
```

The build needs JDK 21. It packages the shared viewer and a small offline JCEF shell in the plugin archive.

Gradle downloads and IntelliJ Platform files are cached outside the repository:
`$XDG_CACHE_HOME/ply-vis` when set, otherwise `$HOME/.cache/ply-vis` on Unix, or
the local application-data directory on Windows. Set `PLY_VIS_CACHE_HOME` to
move both caches. An existing `GRADLE_USER_HOME` still takes precedence for
Gradle itself.

## Live JCEF smoke test

Open a project that contains `ply.yaml` and a published `target/ply/view.json`. Start the test IDE with JCEF debugging enabled:

```sh
PLY_JETBRAINS_TEST_MODE=1 ./gradlew runIde --args /path/to/project
```

Then run this command from the repository root:

```sh
node packages/jetbrains/scripts/test-jcef.mjs
```

The smoke test connects Playwright to JCEF on port 9222. It checks startup, zoom, focus, inspection, state persistence, and source navigation. The published test artifact must include at least one recorded source location. Set `PLY_JCEF_CDP` to use another endpoint.
