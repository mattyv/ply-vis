package dev.ply.jetbrains

import com.google.gson.JsonObject
import com.google.gson.JsonParser
import java.nio.file.Files
import java.nio.file.Path

data class PlyRunEntry(val id: String, val path: String, val completedAt: String, val outcome: String)
data class PlyRunIndex(val currentRun: String, val runs: List<PlyRunEntry>) {
    val current: PlyRunEntry get() = runs.first { it.id == currentRun }
}
data class LoadedPlyRun(val root: Path, val entry: PlyRunEntry, val envelopeJson: String)
data class PlyEnvelopeMetadata(val id: String, val completedAt: String, val outcome: String)

object PlyRunIndexReader {
    const val PROTOCOL_VERSION = 1

    fun parse(json: String): PlyRunIndex {
        val root = JsonParser.parseString(json).takeIf { it.isJsonObject }?.asJsonObject
            ?: error("Ply run index must be a JSON object")
        requireVersion(root)
        val currentRun = requireString(root, "currentRun")
        val array = root.get("runs")?.takeIf { it.isJsonArray }?.asJsonArray
            ?: error("Ply run index field `runs` must be an array")
        val runs = array.mapIndexed { index, element ->
            val item = element.takeIf { it.isJsonObject }?.asJsonObject
                ?: error("Ply run index runs[$index] must be an object")
            val entry = PlyRunEntry(
                requireString(item, "id"),
                requireString(item, "path"),
                requireString(item, "completedAt"),
                requireString(item, "outcome"),
            )
            requireRunId(entry.id)
            requireTimestamp(entry.completedAt)
            require(entry.outcome in OUTCOMES) { "Unsupported Ply run outcome `${entry.outcome}`" }
            require(entry.path == "views/${entry.id}/visual.json") {
                "Ply run path is not canonical for `${entry.id}`"
            }
            entry
        }
        requireRunId(currentRun)
        require(runs.map { it.id }.toSet().size == runs.size) { "Ply run index contains duplicate run IDs" }
        require(runs.any { it.id == currentRun }) { "Ply run index currentRun does not name a listed run" }
        return PlyRunIndex(currentRun, runs)
    }

    fun loadLatest(plyRoot: Path): LoadedPlyRun {
        val ownedRoot = plyRoot.resolve("target/ply").toAbsolutePath().normalize()
        val index = parse(Files.readString(ownedRoot.resolve("view.json")))
        val entry = index.current
        val relative = Path.of(entry.path)
        require(!relative.isAbsolute && relative.none { it.toString() == ".." }) {
            "Ply run path must stay inside target/ply"
        }
        val artifact = ownedRoot.resolve(relative).normalize()
        require(artifact.startsWith(ownedRoot)) { "Ply run path escapes target/ply" }
        val json = Files.readString(artifact)
        val metadata = validateEnvelope(json, entry.id)
        require(metadata.completedAt == entry.completedAt && metadata.outcome == entry.outcome) {
            "VisualEnvelope metadata does not match its index entry"
        }
        return LoadedPlyRun(plyRoot.toAbsolutePath().normalize(), entry, json)
    }

    fun validateEnvelope(json: String, expectedRunId: String? = null): PlyEnvelopeMetadata {
        val root = JsonParser.parseString(json).takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope must be a JSON object")
        requireVersion(root)
        val run = root.get("run")?.takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope field `run` must be an object")
        val runId = requireString(run, "id")
        requireRunId(runId)
        val completedAt = requireString(run, "completedAt")
        requireTimestamp(completedAt)
        val outcome = requireString(run, "outcome")
        require(outcome in OUTCOMES) { "Unsupported Ply run outcome `$outcome`" }
        val runRoot = run.get("root")?.takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope run.root must be an object")
        requireString(runRoot, "path")
        val tool = run.get("tool")?.takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope run.tool must be an object")
        requireString(tool, "name")
        requireString(tool, "version")
        if (expectedRunId != null) require(runId == expectedRunId) {
            "VisualEnvelope run ID does not match its index entry"
        }
        requireString(root, "svg")
        val elements = root.get("elements")?.takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope field `elements` must be an object")
        val diagnostics = root.get("diagnostics")?.takeIf { it.isJsonArray }?.asJsonArray
            ?: error("VisualEnvelope field `diagnostics` must be an array")
        validateElements(elements)
        validateDiagnostics(elements, diagnostics)
        return PlyEnvelopeMetadata(runId, completedAt, outcome)
    }

    private fun validateElements(elements: JsonObject) {
        for ((id, value) in elements.entrySet()) {
            val element = value.takeIf { it.isJsonObject }?.asJsonObject
                ?: error("VisualEnvelope element `$id` must be an object")
            require(requireString(element, "id") == id) { "VisualEnvelope element key does not match its ID" }
            requireString(element, "kind")
            requireString(element, "label")
            element.get("parentId")?.let { parent ->
                val parentId = parent.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString
                    ?: error("VisualEnvelope element `$id` has an invalid parentId")
                require(elements.has(parentId)) { "VisualEnvelope element `$id` names a missing parent" }
            }
            val evidence = element.get("evidence")?.takeIf { it.isJsonObject }?.asJsonObject
                ?: error("VisualEnvelope element `$id` needs evidence")
            requireString(evidence, "verdict")
            requireStringArray(evidence, "statuses", "VisualEnvelope element `$id`")
            evidence.get("reused")?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isBoolean }
                ?: error("VisualEnvelope element `$id` needs a boolean reused flag")
            requireStringArray(element, "diagnosticIds", "VisualEnvelope element `$id`")
            element.get("source")?.let(::validateSource)
        }
    }

    private fun validateDiagnostics(elements: JsonObject, diagnostics: com.google.gson.JsonArray) {
        val seen = mutableSetOf<String>()
        for (value in diagnostics) {
            val diagnostic = value.takeIf { it.isJsonObject }?.asJsonObject
                ?: error("VisualEnvelope diagnostic must be an object")
            val id = requireString(diagnostic, "id")
            require(seen.add(id)) { "VisualEnvelope diagnostic IDs must be unique" }
            requireString(diagnostic, "code")
            requireString(diagnostic, "severity")
            requireString(diagnostic, "message")
            diagnostic.get("elementId")?.let { elementId ->
                val referenced = elementId.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }?.asString
                    ?: error("VisualEnvelope diagnostic `$id` has an invalid elementId")
                require(elements.has(referenced)) { "VisualEnvelope diagnostic `$id` names a missing element" }
            }
            diagnostic.get("source")?.let(::validateSource)
        }
        for ((id, value) in elements.entrySet()) {
            for (diagnosticId in value.asJsonObject.getAsJsonArray("diagnosticIds").map { it.asString }) {
                require(diagnosticId in seen) { "VisualEnvelope element `$id` names a missing diagnostic" }
            }
        }
    }

    private fun validateSource(value: com.google.gson.JsonElement) {
        val source = value.takeIf { it.isJsonObject }?.asJsonObject
            ?: error("VisualEnvelope source location must be an object")
        val file = requireString(source, "file")
        val path = Path.of(file)
        require(!path.isAbsolute && path.none { it.toString() == ".." || it.toString() == "." }) {
            "VisualEnvelope source file must be workspace-relative"
        }
        val startLine = requireNonNegative(source, "startLine")
        val startColumn = requireNonNegative(source, "startColumn")
        val endLine = requireNonNegative(source, "endLine")
        val endColumn = requireNonNegative(source, "endColumn")
        require(endLine > startLine || endLine == startLine && endColumn >= startColumn) {
            "VisualEnvelope source range ends before it starts"
        }
    }

    private fun requireStringArray(root: JsonObject, field: String, owner: String) {
        val array = root.get(field)?.takeIf { it.isJsonArray }?.asJsonArray
            ?: error("$owner field `$field` must be an array")
        require(array.all { it.isJsonPrimitive && it.asJsonPrimitive.isString }) {
            "$owner field `$field` must contain only strings"
        }
    }

    private fun requireNonNegative(root: JsonObject, field: String): Int {
        val value = root.get(field)?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }
            ?.asString?.toIntOrNull()
            ?: error("VisualEnvelope source location needs $field")
        require(value >= 0) { "VisualEnvelope source coordinate must be non-negative" }
        return value
    }

    private fun requireRunId(id: String) {
        require(RUN_ID.matches(id) && id != "." && id != "..") { "Invalid Ply run ID `$id`" }
    }

    private fun requireTimestamp(value: String) {
        require(TIMESTAMP.matches(value)) { "Invalid Ply completedAt timestamp `$value`" }
    }

    private fun requireVersion(root: JsonObject) {
        val value = root.get("protocolVersion")
            ?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isNumber }?.asString?.toIntOrNull()
            ?: error("Ply JSON field `protocolVersion` must be an integer")
        require(value == PROTOCOL_VERSION) {
            "Unsupported Ply protocol version $value; this plugin supports $PROTOCOL_VERSION"
        }
    }

    private fun requireString(root: JsonObject, field: String): String {
        val value = root.get(field)?.takeIf { it.isJsonPrimitive && it.asJsonPrimitive.isString }
            ?.asString ?: error("Ply JSON field `$field` must be a non-empty string")
        require(value.isNotBlank()) { "Ply JSON field `$field` must be a non-empty string" }
        return value
    }

    private val OUTCOMES = setOf("clean", "violation", "timeout", "missing_evidence", "narrowed_evidence")
    private val RUN_ID = Regex("[A-Za-z0-9._-]{1,128}")
    private val TIMESTAMP = Regex("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z")
}
