package dev.ply.jetbrains

import kotlin.test.Test
import kotlin.test.assertEquals

class PlyFirstUseStateTest {
    @Test
    fun `distinguishes no specs from specs with no completed runs`() {
        assertEquals("No Ply specs found in this project.", PlyFirstUseState.message(hasSpecs = false))
        assertEquals("Ply specs found, but no completed visual runs have been published yet. Run `cargo ply verify <root> --publish-view` to publish one.", PlyFirstUseState.message(hasSpecs = true))
    }
}
