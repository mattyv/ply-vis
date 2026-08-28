package dev.ply.jetbrains

import com.google.gson.Gson
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.project.Project
import java.nio.file.Path

class PlyDiscoveryStateStore internal constructor(
    private val readRaw: () -> String?,
    private val writeRaw: (String) -> Unit,
) {
    private val gson = Gson()

    fun read(): List<Path> = readRaw()?.let { raw ->
        runCatching { gson.fromJson(raw, Array<String>::class.java).map(Path::of) }.getOrDefault(emptyList())
    } ?: emptyList()

    fun write(specs: Iterable<Path>) {
        writeRaw(gson.toJson(specs.map { it.toAbsolutePath().normalize().toString() }))
    }

    companion object {
        private const val KEY = "ply.discovery.specs"

        fun forProject(project: Project): PlyDiscoveryStateStore {
            val properties = PropertiesComponent.getInstance(project)
            return PlyDiscoveryStateStore(
                { properties.getValue(KEY) },
                { properties.setValue(KEY, it) },
            )
        }
    }
}
