package dev.ply.jetbrains

import java.nio.file.Path
import kotlin.test.Test
import kotlin.test.assertEquals

class PlyDiscoveryStateStoreTest {
    @Test
    fun `successful discovery replaces the previous generation`() {
        var raw: String? = null
        val store = PlyDiscoveryStateStore({ raw }, { raw = it })
        store.write(listOf(Path.of("/repo/a/ply.yaml"), Path.of("/repo/b/ply.yaml")))
        assertEquals(listOf(Path.of("/repo/a/ply.yaml"), Path.of("/repo/b/ply.yaml")), store.read())
        store.write(listOf(Path.of("/repo/c/ply.yaml")))
        assertEquals(listOf(Path.of("/repo/c/ply.yaml")), store.read())
    }
}
