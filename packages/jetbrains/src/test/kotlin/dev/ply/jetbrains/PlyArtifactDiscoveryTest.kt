package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals

class PlyArtifactDiscoveryTest {
    @Test
    fun `normalizes deduplicates and sorts roots`() {
        val base = Path.of("build/tmp/project").toAbsolutePath()
        assertEquals(
            listOf(base.resolve("a").normalize(), base.resolve("b").normalize()),
            PlyArtifactDiscovery.normalizeRoots(
                listOf(base.resolve("b"), base.resolve("a/../a"), base.resolve("a"))
            )
        )
    }
}
