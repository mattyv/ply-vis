package dev.ply.jetbrains

import com.google.gson.JsonParser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class PlyViewStateStoreTest {
    @Test
    fun `persists and restores object state without changing it`() {
        var stored: String? = null
        val state = PlyViewStateStore({ stored }, { stored = it })
        val expected = JsonParser.parseString(
            """{"zoom":1.2,"panX":4,"panY":5,"overlays":{"earned":true,"gap":false,"violation":true}}""",
        )

        state.write(expected)

        assertEquals(expected, state.read())
    }

    @Test
    fun `ignores corrupt and non-object persisted state`() {
        assertNull(PlyViewStateStore({ "not-json" }, {}).read())
        assertNull(PlyViewStateStore({ "[]" }, {}).read())
    }
}
