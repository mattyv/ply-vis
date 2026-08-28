package dev.ply.jetbrains

import java.nio.file.Path
import java.nio.file.Files
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

    @Test
    fun `discovers nested specs but skips generated and dependency trees`() {
        val project = Files.createTempDirectory("ply-discovery-")
        listOf(
            "crates/a/ply.yaml",
            "services/b/ply.yaml",
            ".git/fixtures/ply.yaml",
            "target/copied/ply.yaml",
            "node_modules/pkg/ply.yaml",
            "build/generated/ply.yaml",
            ".gradle/cache/ply.yaml",
            ".gradle-user/cache/ply.yaml",
            ".intellijPlatform/cache/ply.yaml",
        ).forEach { relative ->
            project.resolve(relative).also { Files.createDirectories(it.parent); Files.writeString(it, "") }
        }

        assertEquals(
            listOf(project.resolve("crates/a"), project.resolve("services/b")).map { it.toAbsolutePath().normalize() },
            PlyArtifactDiscovery.findRoots(listOf(project)),
        )
    }
}
