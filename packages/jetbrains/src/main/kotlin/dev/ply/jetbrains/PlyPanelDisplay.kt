package dev.ply.jetbrains

/**
 * What the panel should put on screen, decided away from the panel so it can
 * be checked without a running IDE.
 *
 * It exists because of one shape of bug: a path that ends with nothing to draw
 * has to say so to the drawing as well as to the status line. Selecting a
 * project with no published runs updated the status line only, and the
 * previous project's drawing stayed on screen underneath a sentence about a
 * different one. Making "draw this" and "draw nothing, here is why" the only
 * two answers means a path cannot pick neither.
 */
sealed interface PlyPanelDisplay {
    /** The line under the drawing, in both cases. */
    val status: String

    data class Draw(val envelopeJson: String, override val status: String) : PlyPanelDisplay

    data class Clear(override val status: String) : PlyPanelDisplay
}

object PlyPanelDisplays {
    /** Nothing is selected, because the project offered nothing to select. */
    fun noRoot(): PlyPanelDisplay = PlyPanelDisplay.Clear(PlyFirstUseState.message(hasSpecs = false))

    fun forRoot(state: PlyArtifactLoadState): PlyPanelDisplay {
        val snapshot = state.snapshot
        return when {
            // A run that could not be re-read, with an older one still held: the
            // older one is what the reader keeps looking at, and the line says
            // which and why.
            snapshot != null && state.error != null ->
                PlyPanelDisplay.Draw(snapshot.envelopeJson, "Keeping run ${snapshot.entry.id}: ${state.error}")
            snapshot != null -> PlyPanelDisplay.Draw(snapshot.envelopeJson, "Showing run ${snapshot.entry.id}")
            else -> PlyPanelDisplay.Clear(state.error ?: PlyFirstUseState.message(hasSpecs = true))
        }
    }
}
