package dev.ply.jetbrains

import com.intellij.openapi.project.Project
import com.intellij.openapi.roots.ProjectRootManager
import java.nio.file.FileVisitResult
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.SimpleFileVisitor
import java.nio.file.attribute.BasicFileAttributes
import java.io.IOException

object PlyArtifactDiscovery {
    private val excludedDirectories = setOf(
        ".git", "target", "node_modules", "build", ".gradle", ".gradle-user", ".intellijPlatform",
    )

    fun findRoots(project: Project): List<Path> {
        return findRoots(projectRoots(project))
    }

    fun projectRoots(project: Project): List<Path> {
        val contentRoots = ProjectRootManager.getInstance(project).contentRoots.map { it.toNioPath() }
        return normalizeRoots(contentRoots + listOfNotNull(project.basePath?.let(Path::of)))
    }

    fun findRoots(projectRoots: Iterable<Path>): List<Path> {
        val candidates = mutableListOf<Path>()
        normalizeRoots(projectRoots).forEach { boundary ->
            if (!Files.isDirectory(boundary)) return@forEach
            Files.walkFileTree(boundary, object : SimpleFileVisitor<Path>() {
                override fun preVisitDirectory(directory: Path, attributes: BasicFileAttributes): FileVisitResult {
                    if (directory != boundary && directory.fileName?.toString() in excludedDirectories) return FileVisitResult.SKIP_SUBTREE
                    return FileVisitResult.CONTINUE
                }

                override fun visitFile(file: Path, attributes: BasicFileAttributes): FileVisitResult {
                    val normalized = file.toAbsolutePath().normalize()
                    if (attributes.isRegularFile && file.fileName.toString() == "ply.yaml" && normalized.startsWith(boundary)) {
                        candidates.add(normalized.parent)
                    }
                    return FileVisitResult.CONTINUE
                }

                override fun visitFileFailed(file: Path, error: IOException): FileVisitResult = FileVisitResult.CONTINUE
            })
        }
        return normalizeRoots(candidates)
    }

    fun normalizeRoots(candidates: Iterable<Path>): List<Path> = candidates
        .map { it.toAbsolutePath().normalize() }
        .distinct()
        .sortedBy(Path::toString)
}
