package dev.ply.jetbrains

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PlyHostMessageTest {
    @Test
    fun `parses an exact zero based source range`() {
        val message = PlyHostMessage.parse(
            """{"channel":"ply-vis","version":1,"type":"navigate","source":{"file":"src/lib.rs","startLine":4,"startColumn":2,"endLine":4,"endColumn":8}}"""
        ) as PlyHostMessage.NavigateSource
        assertEquals(4, message.startLine)
        assertEquals("src/lib.rs", message.file)
    }

    @Test
    fun `rejects source traversal`() {
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse(
                """{"channel":"ply-vis","version":1,"type":"navigate","source":{"file":"../secret","startLine":0,"startColumn":0,"endLine":0,"endColumn":0}}"""
            )
        }
    }

    @Test
    fun `rejects a message outside the pinned host protocol`() {
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse("""{"channel":"other","version":1,"type":"ready"}""")
        }
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1.5,"type":"ready"}""")
        }
    }

    @Test
    fun `rejects the legacy flattened navigation shape`() {
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse(
                """{"channel":"ply-vis","version":1,"type":"navigate","file":"src/lib.rs","startLine":0,"startColumn":0,"endLine":0,"endColumn":0}"""
            )
        }
    }

    @Test
    fun `rejects extra message fields and non-object persisted state`() {
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1,"type":"ready","extra":true}""")
        }
        assertFailsWith<IllegalStateException> {
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1,"type":"persist-state","state":[]}""")
        }
    }
}
