package dev.ply.jetbrains

import com.intellij.openapi.fileEditor.OpenFileDescriptor
import com.intellij.openapi.fileEditor.FileDocumentManager
import com.intellij.openapi.fileEditor.FileEditorManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.vfs.LocalFileSystem
import com.intellij.openapi.editor.ScrollType
import java.nio.file.Path

object PlySourceNavigator {
    fun resolveTarget(plyRoot: Path, file: String): Path? {
        val root = plyRoot.toAbsolutePath().normalize()
        if (file.isBlank()) return null
        val relative = Path.of(file)
        if (relative.isAbsolute || relative.any { it.toString() == ".." || it.toString() == "." }) return null
        return root.resolve(relative).normalize().takeIf { it.startsWith(root) }
    }

    fun navigate(project: Project, plyRoot: Path, request: PlyHostMessage.NavigateSource): Boolean {
        val target = resolveTarget(plyRoot, request.file) ?: return false
        val file = LocalFileSystem.getInstance().refreshAndFindFileByNioFile(target) ?: return false
        val document = FileDocumentManager.getInstance().getDocument(file) ?: return false
        val starts = IntArray(document.lineCount) { document.getLineStartOffset(it) }
        val ends = IntArray(document.lineCount) { document.getLineEndOffset(it) }
        val (start, end) = offsetRange(starts, ends, request) ?: return false
        val editor = FileEditorManager.getInstance(project).openTextEditor(
            OpenFileDescriptor(project, file, start),
            true,
        ) ?: return false
        editor.caretModel.moveToOffset(start)
        editor.selectionModel.setSelection(start, end)
        editor.scrollingModel.scrollToCaret(ScrollType.CENTER)
        return true
    }

    internal fun offsetRange(
        lineStarts: IntArray,
        lineEnds: IntArray,
        request: PlyHostMessage.NavigateSource,
    ): Pair<Int, Int>? {
        if (lineStarts.size != lineEnds.size || request.startLine !in lineStarts.indices || request.endLine !in lineEnds.indices) {
            return null
        }
        val start = lineStarts[request.startLine] + request.startColumn
        val end = lineStarts[request.endLine] + request.endColumn
        if (start > lineEnds[request.startLine] || end > lineEnds[request.endLine]) return null
        return start to end
    }
}
