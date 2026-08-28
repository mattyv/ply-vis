package dev.ply.jetbrains

import com.google.gson.Gson
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.intellij.ide.util.PropertiesComponent
import com.intellij.openapi.project.Project

class PlyViewStateStore internal constructor(
    private val readRaw: () -> String?,
    private val writeRaw: (String) -> Unit,
) {
    private val gson = Gson()

    fun read(): JsonObject? = readRaw()?.let { raw ->
        runCatching { JsonParser.parseString(raw).takeIf { it.isJsonObject }?.asJsonObject }.getOrNull()
    }

    fun write(state: JsonElement) {
        require(state.isJsonObject) { "Ply view state must be an object" }
        writeRaw(gson.toJson(state))
    }

    companion object {
        private const val KEY = "ply.viewer.state"

        fun forProject(project: Project): PlyViewStateStore {
            val properties = PropertiesComponent.getInstance(project)
            return PlyViewStateStore(
                { properties.getValue(KEY) },
                { properties.setValue(KEY, it) },
            )
        }
    }
}
