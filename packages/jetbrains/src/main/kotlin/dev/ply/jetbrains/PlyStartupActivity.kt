package dev.ply.jetbrains

import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity
import com.intellij.openapi.util.registry.Registry
import com.intellij.openapi.wm.ToolWindowManager

class PlyStartupActivity : ProjectActivity {
    override suspend fun execute(project: Project) {
        if (System.getenv("PLY_JETBRAINS_TEST_MODE") != "1") return
        Registry.get("ide.browser.jcef.debug.port").setValue(9222)
        ApplicationManager.getApplication().invokeLater {
            ToolWindowManager.getInstance(project).getToolWindow("Ply")?.show()
        }
    }
}
