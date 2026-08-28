import org.gradle.api.tasks.bundling.Zip

plugins {
    kotlin("jvm") version "2.4.0"
    id("org.jetbrains.intellij.platform") version "2.18.1"
}

group = "dev.ply"
version = "0.1.0"

repositories {
    mavenCentral()
    intellijPlatform { defaultRepositories() }
}

dependencies {
    intellijPlatform {
        rustRover("2026.2")
        bundledPlugin("com.intellij.modules.jcef")
    }
    testImplementation(kotlin("test"))
    testImplementation("org.junit.jupiter:junit-jupiter:5.12.2")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.12.2")
}

kotlin { jvmToolchain(21) }

intellijPlatform {
    pluginConfiguration {
        id = "dev.ply.jetbrains"
        name = "Ply Visual"
        version = project.version.toString()
        ideaVersion { sinceBuild = "262" }
        vendor { name = "Ply" }
        description = "Navigate Ply specifications and verification evidence in JetBrains IDEs."
    }
}

val plyVisArchive by tasks.registering(Zip::class) {
    val viewerDist = project.layout.projectDirectory.dir("../ply-vis/dist")
    inputs.dir(viewerDist)
    archiveFileName.set("ply-vis.zip")
    destinationDirectory.set(layout.buildDirectory.dir("generated-resources"))
    from(viewerDist) { into("lib") }
}

tasks.test {
    dependsOn(plyVisArchive)
    useJUnitPlatform()
}

tasks.processResources {
    dependsOn(plyVisArchive)
    from(plyVisArchive.flatMap { it.archiveFile })
}
