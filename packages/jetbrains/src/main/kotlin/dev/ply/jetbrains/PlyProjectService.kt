package dev.ply.jetbrains

import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project

@Service(Service.Level.PROJECT)
class PlyProjectService(project: Project) {
    val artifacts = PlyArtifactState()
    val viewState = PlyViewStateStore.forProject(project)
}
