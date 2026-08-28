package dev.ply.jetbrains

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import java.nio.file.Files

class PlyRunIndexTest {
    @Test
    fun `parses a strict current run`() {
        val index = PlyRunIndexReader.parse(
            """{"protocolVersion":1,"currentRun":"r1","runs":[{"id":"r1","path":"views/r1/visual.json","completedAt":"2026-08-28T00:00:00Z","outcome":"violation"}]}"""
        )
        assertEquals("views/r1/visual.json", index.current.path)
    }

    @Test
    fun `rejects an unknown protocol`() {
        assertFailsWith<IllegalArgumentException> {
            PlyRunIndexReader.parse(
                """{"protocolVersion":2,"currentRun":"r1","runs":[{"id":"r1","path":"views/r1/visual.json","completedAt":"now","outcome":"clean"}]}"""
            )
        }
    }

    @Test
    fun `rejects a current run absent from history`() {
        assertFailsWith<IllegalArgumentException> {
            PlyRunIndexReader.parse("""{"protocolVersion":1,"currentRun":"missing","runs":[]}""")
        }
    }

    @Test
    fun `rejects a noncanonical artifact location`() {
        assertFailsWith<IllegalArgumentException> {
            PlyRunIndexReader.parse(
                """{"protocolVersion":1,"currentRun":"r1","runs":[{"id":"r1","path":"views/other/visual.json","completedAt":"2026-08-28T00:00:00Z","outcome":"clean"}]}""",
            )
        }
    }

    @Test
    fun `accepts canonical structured run provenance`() {
        PlyRunIndexReader.validateEnvelope(
            """{"protocolVersion":1,"run":{"id":"r1","completedAt":"2026-08-28T00:00:00Z","root":{"path":"."},"tool":{"name":"ply","version":"abc"},"outcome":"clean"},"svg":"<svg></svg>","elements":{},"diagnostics":[]}""",
            "r1",
        )
    }

    @Test
    fun `loads only the indexed artifact inside target ply`() {
        val root = Files.createTempDirectory("ply-run-index")
        val runDir = root.resolve("target/ply/views/r1")
        Files.createDirectories(runDir)
        Files.writeString(
            root.resolve("target/ply/view.json"),
            """{"protocolVersion":1,"currentRun":"r1","runs":[{"id":"r1","path":"views/r1/visual.json","completedAt":"2026-08-28T00:00:00Z","outcome":"clean"}]}""",
        )
        Files.writeString(
            runDir.resolve("visual.json"),
            """{"protocolVersion":1,"run":{"id":"r1","completedAt":"2026-08-28T00:00:00Z","root":{"path":"."},"tool":{"name":"ply","version":"abc"},"outcome":"clean"},"svg":"<svg></svg>","elements":{},"diagnostics":[]}""",
        )

        assertEquals("r1", PlyRunIndexReader.loadLatest(root).entry.id)
    }

    @Test
    fun `rejects an indexed artifact path that escapes target ply`() {
        val root = Files.createTempDirectory("ply-run-index-escape")
        Files.createDirectories(root.resolve("target/ply"))
        Files.writeString(
            root.resolve("target/ply/view.json"),
            """{"protocolVersion":1,"currentRun":"r1","runs":[{"id":"r1","path":"../visual.json","completedAt":"2026-08-28T00:00:00Z","outcome":"clean"}]}""",
        )

        assertFailsWith<IllegalArgumentException> { PlyRunIndexReader.loadLatest(root) }
    }

    @Test
    fun `rejects an artifact whose metadata differs from its index entry`() {
        val root = Files.createTempDirectory("ply-run-index-mismatch")
        val runDir = root.resolve("target/ply/views/r1")
        Files.createDirectories(runDir)
        Files.writeString(
            root.resolve("target/ply/view.json"),
            """{"protocolVersion":1,"currentRun":"r1","runs":[{"id":"r1","path":"views/r1/visual.json","completedAt":"2026-08-28T00:00:00Z","outcome":"clean"}]}""",
        )
        Files.writeString(
            runDir.resolve("visual.json"),
            """{"protocolVersion":1,"run":{"id":"r1","completedAt":"2026-08-28T00:00:01Z","root":{"path":"."},"tool":{"name":"ply","version":"abc"},"outcome":"violation"},"svg":"<svg></svg>","elements":{},"diagnostics":[]}""",
        )

        assertFailsWith<IllegalArgumentException> { PlyRunIndexReader.loadLatest(root) }
    }

    @Test
    fun `rejects malformed element evidence before replacing the last good view`() {
        assertFailsWith<IllegalStateException> {
            PlyRunIndexReader.validateEnvelope(
                """{"protocolVersion":1,"run":{"id":"r1","completedAt":"2026-08-28T00:00:00Z","root":{"path":"."},"tool":{"name":"ply","version":"abc"},"outcome":"clean"},"svg":"<svg></svg>","elements":{"bad":{"id":"bad","kind":"function","label":"Bad","evidence":{},"diagnosticIds":[]}},"diagnostics":[]}""",
                "r1",
            )
        }
    }
}
