package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlySourceNavigatorTest {
    @Test
    fun `resolves a recorded relative path inside the Ply root`() {
        val root = Path.of("build/tmp/ply-root").toAbsolutePath().normalize()
        assertEquals(root.resolve("src/lib.rs"), PlySourceNavigator.resolveTarget(root, "src/lib.rs"))
    }

    @Test
    fun `refuses to guess outside the Ply root`() {
        val root = Path.of("build/tmp/ply-root").toAbsolutePath().normalize()
        assertNull(PlySourceNavigator.resolveTarget(root, "../other/src/lib.rs"))
        assertNull(PlySourceNavigator.resolveTarget(root, root.resolve("src/lib.rs").toString()))
    }

    @Test
    fun `maps both recorded endpoints without clamping`() {
        val request = PlyHostMessage.NavigateSource("src/lib.rs", 0, 1, 1, 2)
        assertEquals(
            1 to 6,
            PlySourceNavigator.offsetRange(intArrayOf(0, 4), intArrayOf(3, 7), request),
        )
        assertNull(
            PlySourceNavigator.offsetRange(
                intArrayOf(0, 4),
                intArrayOf(3, 7),
                request.copy(endColumn = 4),
            ),
        )
    }
}
