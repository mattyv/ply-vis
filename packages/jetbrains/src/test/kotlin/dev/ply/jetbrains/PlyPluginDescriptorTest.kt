package dev.ply.jetbrains

import kotlin.test.Test
import kotlin.test.assertContains

class PlyPluginDescriptorTest {
    @Test
    fun `registers the tool window lifecycle and test startup hook`() {
        val descriptor = checkNotNull(javaClass.getResource("/META-INF/plugin.xml")).readText()
        assertContains(descriptor, "factoryClass=\"dev.ply.jetbrains.PlyToolWindowFactory\"")
        assertContains(descriptor, "implementation=\"dev.ply.jetbrains.PlyStartupActivity\"")
        assertContains(descriptor, "icon=\"/icons/ply.svg\"")
    }
}
