package dev.ply.jetbrains

import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.nio.file.Path

sealed interface PlyHostMessage {
    data class NavigateSource(
        val file: String,
        val startLine: Int,
        val startColumn: Int,
        val endLine: Int,
        val endColumn: Int,
    ) : PlyHostMessage
    data class PersistState(val state: JsonElement) : PlyHostMessage
    data object RequestArtifact : PlyHostMessage
    data object Ready : PlyHostMessage
    data class ViewerError(val message: String) : PlyHostMessage
    /** The viewer drew this run. See `PlyToolWindowPanel.handleMessage`. */
    data class ArtifactAccepted(val runId: String) : PlyHostMessage
    /**
     * Asking for a diagnostic to be explained. The JetBrains plugin has no
     * explainer, and never advertises one, so the viewer does not offer the
     * menu entry that sends these -- but "we don't do that here" and "that
     * is not a message" are different answers, and only the first is true.
     */
    data object ExplainPrompt : PlyHostMessage
    data class Explain(val code: String) : PlyHostMessage

    companion object {
        fun parse(json: String): PlyHostMessage {
            val root = JsonParser.parseString(json).takeIf { it.isJsonObject }?.asJsonObject
                ?: error("Ply host message must be a JSON object")
            require(root.get("channel")?.asString == "ply-vis") { "Unsupported host message channel" }
            require(root.get("version")?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }
                ?.asString?.toIntOrNull() == 1) { "Unsupported host message protocol version" }
            return when (val type = root.get("type")?.asString ?: error("Ply host message needs a type")) {
                "navigate" -> {
                    requireExact(root, "channel", "version", "type", "source")
                    navigate(
                        root.get("source")?.takeIf { it.isJsonObject }?.asJsonObject
                            ?: error("navigate needs source"),
                    )
                }
                "persist-state" -> {
                    requireExact(root, "channel", "version", "type", "state")
                    PersistState(root.get("state")?.takeIf { it.isJsonObject } ?: error("persist-state needs object state"))
                }
                "request-artifact" -> {
                    requireExact(root, "channel", "version", "type")
                    RequestArtifact
                }
                "ready" -> {
                    requireExact(root, "channel", "version", "type")
                    Ready
                }
                "error" -> {
                    requireExact(root, "channel", "version", "type", "message")
                    ViewerError(root.get("message")?.asString ?: "Unknown viewer error")
                }
                // Every type the shared viewer can send has a case here, and
                // a test compares this `when` against the viewer's own union
                // so it stays that way. It did not before: `artifact-accepted`
                // was added to the viewer and every successful load in
                // JetBrains fell through to the `else` below, putting
                // "Unsupported Ply host message type" in the status line
                // under a drawing that had loaded perfectly.
                "artifact-accepted" -> {
                    requireExact(root, "channel", "version", "type", "runId")
                    ArtifactAccepted(root.get("runId")?.asString ?: error("artifact-accepted needs a runId"))
                }
                "explain-prompt" -> {
                    requireExact(root, "channel", "version", "type")
                    ExplainPrompt
                }
                "explain" -> {
                    requireExact(root, "channel", "version", "type", "code")
                    Explain(root.get("code")?.asString ?: error("explain needs a code"))
                }
                else -> error("Unsupported Ply host message type `$type`")
            }
        }

        private fun requireExact(root: JsonObject, vararg keys: String) {
            require(root.keySet() == keys.toSet()) { "Ply host message has unexpected fields" }
        }

        private fun navigate(source: JsonObject): NavigateSource {
            requireExact(source, "file", "startLine", "startColumn", "endLine", "endColumn")
            val file = source.get("file")?.asString.orEmpty()
            val path = Path.of(file)
            require(file.isNotEmpty() && !path.isAbsolute && path.none { it.toString() == ".." }) {
                "Source file must be a safe workspace-relative path"
            }
            val startLine = nonNegative(source, "startLine")
            val startColumn = nonNegative(source, "startColumn")
            val endLine = nonNegative(source, "endLine")
            val endColumn = nonNegative(source, "endColumn")
            require(endLine > startLine || endLine == startLine && endColumn >= startColumn) {
                "Source range ends before it starts"
            }
            return NavigateSource(file, startLine, startColumn, endLine, endColumn)
        }

        private fun nonNegative(root: JsonObject, field: String): Int {
            val value = root.get(field)?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }
                ?.asString?.toIntOrNull() ?: error("navigate needs integer $field")
            require(value >= 0) { "$field must be non-negative" }
            return value
        }
    }
}
