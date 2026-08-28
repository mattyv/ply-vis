package dev.ply.jetbrains

import com.intellij.openapi.components.Service
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertNotNull

class PlyProjectServiceTest {
    @Test
    fun `owns observer state at project scope`() {
        val annotation = assertNotNull(PlyProjectService::class.java.getAnnotation(Service::class.java))
        assertContentEquals(arrayOf(Service.Level.PROJECT), annotation.value)
    }
}
