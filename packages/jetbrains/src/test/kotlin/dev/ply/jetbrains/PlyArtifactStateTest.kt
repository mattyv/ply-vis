package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlyArtifactStateTest {
    @Test
    fun `keeps the last complete run for the same root after a failed reload`() {
        val root = Path.of("build/tmp/root").toAbsolutePath().normalize()
        val run = LoadedPlyRun(root, PlyRunEntry("r1", "views/r1/visual.json", "2026-08-28T00:00:00Z", "clean"), "{}")
        var fail = false
        val state = PlyArtifactState { if (fail) error("partial replacement") else run }

        assertEquals(run, state.reload(root).snapshot)
        fail = true
        val retained = state.reload(root)

        assertEquals(run, retained.snapshot)
        assertEquals("partial replacement", retained.error)
    }

    @Test
    fun `does not leak another roots last view`() {
        val first = Path.of("build/tmp/first").toAbsolutePath().normalize()
        val second = Path.of("build/tmp/second").toAbsolutePath().normalize()
        val run = LoadedPlyRun(first, PlyRunEntry("r1", "views/r1/visual.json", "2026-08-28T00:00:00Z", "clean"), "{}")
        val state = PlyArtifactState { root -> if (root == first) run else error("missing") }

        state.reload(first)

        assertNull(state.reload(second).snapshot)
    }
}
