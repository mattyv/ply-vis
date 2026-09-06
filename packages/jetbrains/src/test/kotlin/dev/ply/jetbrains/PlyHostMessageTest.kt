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

    /**
     * Every successful load in JetBrains produced an error status. The
     * shared viewer began acknowledging the artifact it drew, and this
     * parser -- a third hand-written copy of the protocol, which nothing
     * compared against the other two -- fell through to "unsupported message
     * type" on every one of them. The reader saw a drawing that had loaded
     * perfectly with an error underneath it.
     *
     * Reported by external review 2026-09-06. The invariant that keeps the
     * three copies together lives in the TypeScript suite
     * (`protocol-agreement.test.ts`), which now reads this file's `when`;
     * this test pins the message's own shape.
     */
    @Test
    fun `understands the acknowledgement the viewer sends after drawing`() {
        val message = PlyHostMessage.parse(
            """{"channel":"ply-vis","version":1,"type":"artifact-accepted","deliveryId":"d1"}"""
        ) as PlyHostMessage.ArtifactAccepted
        assertEquals("d1", message.deliveryId)
    }

    /** It names the delivery, not the run: two deliveries can carry one run,
     *  and matching on the run's id bound navigation to the wrong one. */
    @Test
    fun `requires a delivery id on the acknowledgement`() {
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1,"type":"artifact-accepted"}""")
        }
        assertFailsWith<IllegalArgumentException> {
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1,"type":"artifact-accepted","runId":"r1"}""")
        }
    }

    /** No explainer here, but "we do not do that" is not "that is not a
     *  message" -- the parser reads it and the panel declines it in words. */
    @Test
    fun `understands the explain requests it cannot serve`() {
        assertEquals(
            PlyHostMessage.ExplainPrompt,
            PlyHostMessage.parse("""{"channel":"ply-vis","version":1,"type":"explain-prompt"}"""),
        )
        val explain = PlyHostMessage.parse(
            """{"channel":"ply-vis","version":1,"type":"explain","code":"E0203"}"""
        ) as PlyHostMessage.Explain
        assertEquals("E0203", explain.code)
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
