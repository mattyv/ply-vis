package dev.ply.jetbrains

import java.nio.file.NoSuchFileException
import java.nio.file.Path

data class PlyArtifactLoadState(val snapshot: LoadedPlyRun? = null, val error: String? = null)

class PlyArtifactState(
    private val loader: (Path) -> LoadedPlyRun = PlyRunIndexReader::loadLatest,
) {
    private val lastGood = mutableMapOf<Path, LoadedPlyRun>()

    fun reload(root: Path): PlyArtifactLoadState {
        val key = root.toAbsolutePath().normalize()
        return try {
            val loaded = loader(key)
            lastGood[key] = loaded
            PlyArtifactLoadState(snapshot = loaded)
        } catch (error: NoSuchFileException) {
            val missing = runCatching { Path.of(error.file).toAbsolutePath().normalize() }.getOrNull()
            val snapshot = lastGood[key]
            if (missing == key.resolve("target/ply/view.json")) {
                if (snapshot == null) PlyArtifactLoadState() else PlyArtifactLoadState(snapshot, "The published Ply visual index was removed.")
            } else {
                PlyArtifactLoadState(snapshot, error.message ?: "A published Ply visual artifact is missing.")
            }
        } catch (error: Exception) {
            PlyArtifactLoadState(lastGood[key], error.message ?: "Could not load the published Ply view")
        }
    }
}
