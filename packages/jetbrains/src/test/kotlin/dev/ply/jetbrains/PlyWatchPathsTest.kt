package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class PlyWatchPathsTest {
    @Test
    fun `matches recursive specs and artifacts within project boundaries`() {
        val root = Path.of("/repo")
        assertTrue(PlyWatchPaths.isRelevant(Path.of("/repo/crates/a/ply.yaml"), listOf(root)))
        assertTrue(PlyWatchPaths.isRelevant(Path.of("/repo/crates/a/target/ply/view.json"), listOf(root)))
        assertTrue(PlyWatchPaths.isRelevant(Path.of("/repo/crates/a/target/ply/views/r1/visual.json"), listOf(root)))
        assertFalse(PlyWatchPaths.isRelevant(Path.of("/repo/.gradle/cache/ply.yaml"), listOf(root)))
        assertFalse(PlyWatchPaths.isRelevant(Path.of("/repo/node_modules/pkg/target/ply/view.json"), listOf(root)))
        assertFalse(PlyWatchPaths.isRelevant(Path.of("/repo-other/ply.yaml"), listOf(root)))
    }
}
