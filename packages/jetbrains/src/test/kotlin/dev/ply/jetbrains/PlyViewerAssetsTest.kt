package dev.ply.jetbrains

import java.util.zip.ZipFile
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import java.io.ByteArrayOutputStream
import java.nio.file.Files
import kotlin.test.Test
import kotlin.test.assertNotNull
import kotlin.test.assertFailsWith
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class PlyViewerAssetsTest {
    @Test
    fun `viewer archive contains its shell and pinned shared build`() {
        val archive = java.io.File("build/generated-resources/ply-vis.zip")
        assertTrue(archive.isFile, "Run the plyVisArchive task before tests")
        ZipFile(archive).use { zip ->
            assertNotNull(zip.getEntry("lib/index.js"))
            assertNotNull(zip.getEntry("lib/styles.css"))
        }
    }

    @Test
    fun `offline shell boots the shared module from a CSP allowed blob`() {
        val root = Files.createTempDirectory("ply-viewer-shell")
        Files.createDirectories(root.resolve("lib"))
        Files.writeString(root.resolve("lib/index.js"), "export function mountViewer() {}")
        Files.writeString(root.resolve("lib/styles.css"), ".ply-vis { color: white; }")
        val template = checkNotNull(javaClass.getResource("/viewer-shell.html")).readText()

        val html = PlyViewerAssets.renderHtml(root, template, "fixed-nonce")

        assertTrue(html.contains("script-src 'nonce-fixed-nonce' blob:"))
        assertTrue(html.contains("import(moduleUrl)"))
        assertTrue(html.contains("data-ply-jetbrains=\"true\""))
        assertTrue(html.contains(".ply-vis { color: white; }"))
    }

    @Test
    fun `viewer archives use content addressed cache directories`() {
        val cache = Files.createTempDirectory("ply-viewer-cache")
        val first = PlyViewerAssets.extractArchive(archive("one"), cache)
        val again = PlyViewerAssets.extractArchive(archive("one"), cache)
        val second = PlyViewerAssets.extractArchive(archive("two"), cache)

        assertTrue(Files.isSameFile(first, again))
        assertNotEquals(first, second)
        assertTrue(Files.readString(first.resolve("index.html")).contains("one"))
        assertTrue(Files.readString(second.resolve("index.html")).contains("two"))
    }

    @Test
    fun `viewer extraction rejects archive traversal`() {
        val bytes = ByteArrayOutputStream().use { output ->
            ZipOutputStream(output).use { zip ->
                zip.putNextEntry(ZipEntry("../escape"))
                zip.write(byteArrayOf(1))
            }
            output.toByteArray()
        }
        assertFailsWith<IllegalArgumentException> {
            PlyViewerAssets.extractArchive(bytes, Files.createTempDirectory("ply-viewer-unsafe"))
        }
    }

    private fun archive(version: String): ByteArray = ByteArrayOutputStream().use { output ->
        ZipOutputStream(output).use { zip ->
            zip.putNextEntry(ZipEntry("index.html"))
            zip.write("<html>$version</html>".toByteArray())
        }
        output.toByteArray()
    }
}
