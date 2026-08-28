package dev.ply.jetbrains

import com.intellij.openapi.project.Project
import com.intellij.openapi.roots.ProjectFileIndex
import java.nio.file.Files
import java.nio.file.Path

object PlyArtifactDiscovery {
    fun findRoots(project: Project): List<Path> {
        val candidates = mutableListOf<Path>()
        ProjectFileIndex.getInstance(project).iterateContent { file ->
            if (!file.isDirectory && file.name == "ply.yaml") candidates.add(file.parent.toNioPath())
            true
        }
        project.basePath?.let { base ->
            val root = Path.of(base)
            if (Files.isRegularFile(root.resolve("ply.yaml"))) candidates.add(root)
        }
        return normalizeRoots(candidates)
    }

    fun normalizeRoots(candidates: Iterable<Path>): List<Path> = candidates
        .map { it.toAbsolutePath().normalize() }
        .distinct()
        .sortedBy(Path::toString)
}
