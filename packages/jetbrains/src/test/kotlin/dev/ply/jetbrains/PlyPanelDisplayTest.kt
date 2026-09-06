package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

/**
 * The panel had a third answer besides "draw this" and "draw nothing": it
 * could quietly do neither. Selecting a project with no published runs, or a
 * project offering no workspace to select, wrote a sentence into the status
 * line and left the previous project's drawing on screen. The reader was
 * looking at one project's evidence under a line about another.
 *
 * Reported by external review, 2026-09-06.
 */
class PlyPanelDisplayTest {
    private fun run(id: String) = LoadedPlyRun(
        root = Path.of("/tmp/ply"),
        entry = PlyRunEntry(id = id, path = "runs/$id.json", completedAt = "2026-09-01T00:00:00Z", outcome = "clean"),
        envelopeJson = """{"run":"$id"}""",
    )

    @Test
    fun `a project with no published runs clears the drawing rather than only the status line`() {
        val display = PlyPanelDisplays.forRoot(PlyArtifactLoadState())

        assertIs<PlyPanelDisplay.Clear>(display)
        assertEquals(PlyFirstUseState.message(hasSpecs = true), display.status)
    }

    @Test
    fun `a project offering no workspace to select clears it too`() {
        val display = PlyPanelDisplays.noRoot()

        assertIs<PlyPanelDisplay.Clear>(display)
        assertEquals(PlyFirstUseState.message(hasSpecs = false), display.status)
    }

    @Test
    fun `a run that cannot be read clears the drawing and carries the reason`() {
        val display = PlyPanelDisplays.forRoot(PlyArtifactLoadState(error = "view.json is not valid JSON"))

        assertIs<PlyPanelDisplay.Clear>(display)
        assertEquals("view.json is not valid JSON", display.status)
    }

    // The shapes that must keep drawing.
    @Test
    fun `a published run is drawn`() {
        val display = PlyPanelDisplays.forRoot(PlyArtifactLoadState(snapshot = run("r1")))

        assertEquals(PlyPanelDisplay.Draw("""{"run":"r1"}""", "Showing run r1"), display)
    }

    @Test
    fun `an unreadable update keeps the run already on screen and says why`() {
        val display = PlyPanelDisplays.forRoot(PlyArtifactLoadState(snapshot = run("r1"), error = "the newer run is unreadable"))

        assertEquals(PlyPanelDisplay.Draw("""{"run":"r1"}""", "Keeping run r1: the newer run is unreadable"), display)
    }
}
