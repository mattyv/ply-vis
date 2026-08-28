package dev.ply.jetbrains

import java.nio.file.Path

object PlyWatchPaths {
    private val excludedDirectories = setOf(
        ".git", "node_modules", "build", ".gradle", ".gradle-user", ".intellijPlatform",
    )

    fun isRelevant(changedPath: Path, projectRoots: Iterable<Path>): Boolean {
        val changed = changedPath.toAbsolutePath().normalize()
        val boundary = projectRoots.map { it.toAbsolutePath().normalize() }.firstOrNull(changed::startsWith) ?: return false
        val parts = boundary.relativize(changed).map(Path::toString)
        if (parts.isEmpty() || parts.any(excludedDirectories::contains)) return false
        if (parts.last() == "ply.yaml") return "target" !in parts
        parts.indices.firstOrNull { parts[it] == "target" && parts.getOrNull(it + 1) == "ply" } ?: return false
        return parts.last().endsWith(".json")
    }
}
