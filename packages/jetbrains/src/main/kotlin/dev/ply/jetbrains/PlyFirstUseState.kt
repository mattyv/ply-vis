package dev.ply.jetbrains

object PlyFirstUseState {
    fun message(hasSpecs: Boolean): String = if (hasSpecs) {
        "Ply specs found, but no completed visual runs have been published yet. Run `cargo ply verify <root> --publish-view` to publish one."
    } else {
        "No Ply specs found in this project."
    }
}
