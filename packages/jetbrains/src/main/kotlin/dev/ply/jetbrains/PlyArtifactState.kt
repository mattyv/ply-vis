package dev.ply.jetbrains

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
        } catch (error: Exception) {
            PlyArtifactLoadState(lastGood[key], error.message ?: "Could not load the published Ply view")
        }
    }
}
