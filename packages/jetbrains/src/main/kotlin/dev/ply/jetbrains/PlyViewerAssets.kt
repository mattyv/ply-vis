package dev.ply.jetbrains

import com.intellij.openapi.application.PathManager
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.util.Base64
import java.util.HexFormat
import java.util.UUID
import java.util.zip.ZipInputStream

object PlyViewerAssets {
    fun html(): String {
        val archive = PlyViewerAssets::class.java.getResourceAsStream("/ply-vis.zip")
            ?: error("The plugin does not contain its pinned ply-vis assets")
        val root = archive.use { extractArchive(it.readAllBytes(), Path.of(PathManager.getSystemPath(), "ply-visual", "viewer")) }
        val template = PlyViewerAssets::class.java.getResource("/viewer-shell.html")?.readText()
            ?: error("The plugin does not contain its JCEF viewer shell")
        return renderHtml(root, template, UUID.randomUUID().toString())
    }

    internal fun renderHtml(root: Path, template: String, nonce: String): String {
        val script = Files.readAllBytes(root.resolve("lib/index.js"))
        val encodedScript = Base64.getEncoder().encodeToString(script)
        val styles = Files.readString(root.resolve("lib/styles.css")).replace("</style", "<\\/style", ignoreCase = true)
        return template
            .replace("{{NONCE}}", nonce)
            .replace("{{STYLES}}", styles)
            .replace("{{MODULE_BASE64}}", encodedScript)
    }

    internal fun extractArchive(bytes: ByteArray, cache: Path): Path {
        Files.createDirectories(cache)
        val digest = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes), 0, 8)
        val destination = cache.resolve(digest)
        if (Files.isDirectory(destination)) return destination
        val temporary = cache.resolve("$digest.tmp-${UUID.randomUUID()}")
        Files.createDirectories(temporary)
        try {
            extractInto(bytes, temporary)
            try {
                Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE)
            } catch (_: AtomicMoveNotSupportedException) {
                runCatching { Files.move(temporary, destination) }
                    .getOrElse { if (!Files.isDirectory(destination)) throw it }
            } catch (error: java.nio.file.FileAlreadyExistsException) {
                if (!Files.isDirectory(destination)) throw error
            }
        } finally {
            deleteTree(temporary)
        }
        return destination
    }

    private fun extractInto(bytes: ByteArray, destination: Path) {
        ZipInputStream(ByteArrayInputStream(bytes)).use { archive ->
            while (true) {
                val entry = archive.nextEntry ?: break
                val output = destination.resolve(entry.name).normalize()
                require(output.startsWith(destination)) { "Unsafe path in bundled ply-vis assets" }
                if (entry.isDirectory) {
                    Files.createDirectories(output)
                } else {
                    Files.createDirectories(output.parent)
                    Files.copy(archive, output, StandardCopyOption.REPLACE_EXISTING)
                }
            }
        }
    }

    private fun deleteTree(root: Path) {
        if (!Files.exists(root)) return
        Files.walk(root).use { paths ->
            paths.sorted(Comparator.reverseOrder()).forEach { Files.deleteIfExists(it) }
        }
    }
}
