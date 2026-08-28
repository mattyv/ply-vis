package dev.ply.jetbrains

import java.nio.file.Path
import java.nio.file.NoSuchFileException
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlyArtifactStateTest {
    @Test
    fun `treats a missing visual index as no completed runs without leaking the file error`() {
        val root = Path.of("build/tmp/no-runs").toAbsolutePath().normalize()
        val state = PlyArtifactState { throw NoSuchFileException(root.resolve("target/ply/view.json").toString()) }

        assertEquals(PlyArtifactLoadState(), state.reload(root))
    }

    @Test
    fun `does not mistake a missing indexed artifact for a first run`() {
        val root = Path.of("build/tmp/missing-artifact").toAbsolutePath().normalize()
        val missing = root.resolve("target/ply/views/r1/visual.json")
        val state = PlyArtifactState { throw NoSuchFileException(missing.toString()) }

        assertEquals(missing.toString(), state.reload(root).error)
    }

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
