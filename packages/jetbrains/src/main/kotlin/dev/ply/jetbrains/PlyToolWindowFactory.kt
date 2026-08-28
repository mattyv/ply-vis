package dev.ply.jetbrains

import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

class PlyToolWindowFactory : ToolWindowFactory, DumbAware {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = PlyToolWindowPanel(project)
        val content = ContentFactory.getInstance().createContent(panel, "Visual", false)
        content.setDisposer(panel)
        toolWindow.contentManager.addContent(content)
    }
}
