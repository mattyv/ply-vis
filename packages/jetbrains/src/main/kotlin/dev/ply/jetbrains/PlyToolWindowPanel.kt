package dev.ply.jetbrains

import com.google.gson.Gson
import com.intellij.openapi.Disposable
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.components.service
import com.intellij.openapi.project.Project
import com.intellij.ui.components.JBLabel
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefJSQuery
import com.intellij.openapi.vfs.VirtualFileManager
import com.intellij.openapi.vfs.newvfs.BulkFileListener
import com.intellij.openapi.vfs.newvfs.events.VFileEvent
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefLoadHandlerAdapter
import java.awt.BorderLayout
import java.awt.FlowLayout
import java.nio.file.Files
import java.nio.file.Path
import javax.swing.JButton
import javax.swing.JComboBox
import javax.swing.JPanel
import javax.swing.Timer

class PlyToolWindowPanel(private val project: Project) : JPanel(BorderLayout()), Disposable {
    private val gson = Gson()
    private val projectState = project.service<PlyProjectService>()
    private val viewState = projectState.viewState
    private val artifacts = projectState.artifacts
    private val discoveryState = projectState.discoveryState
    private val roots = JComboBox<Path>()
    private val status = JBLabel(PlyFirstUseState.message(hasSpecs = false))
    private val browser: JBCefBrowser?
    private var query: JBCefJSQuery? = null
    private var loaded: LoadedPlyRun? = null
    private var suppressRootEvents = false
    private val indexTimes = mutableMapOf<Path, Long>()
    private val poller = Timer(1_000) { pollIndex() }

    init {
        val controls = JPanel(FlowLayout(FlowLayout.LEADING, 6, 4))
        val refresh = JButton("Refresh")
        controls.add(roots)
        controls.add(refresh)
        controls.add(status)
        add(controls, BorderLayout.NORTH)

        refresh.addActionListener { refreshRootsAndLoad(useRemembered = false) }
        roots.addActionListener { if (!suppressRootEvents) loadSelectedRoot() }
        installWorkspaceWatcher()

        browser = if (JBCefApp.isSupported()) JBCefBrowser() else null
        if (browser == null) {
            add(JBLabel("JCEF is unavailable in this IDE runtime."), BorderLayout.CENTER)
        } else {
            installBridge(browser)
            loadViewer(browser)
            add(browser.component, BorderLayout.CENTER)
        }
        refreshRootsAndLoad(useRemembered = true)
        poller.start()
    }

    private fun installWorkspaceWatcher() {
        project.messageBus.connect(this).subscribe(VirtualFileManager.VFS_CHANGES, object : BulkFileListener {
            override fun after(events: List<VFileEvent>) {
                val projectRoots = PlyArtifactDiscovery.projectRoots(project)
                val relevant = events.any { event ->
                    runCatching { PlyWatchPaths.isRelevant(Path.of(event.path), projectRoots) }.getOrDefault(false)
                }
                if (relevant) ApplicationManager.getApplication().invokeLater {
                    if (!project.isDisposed) refreshRootsAndLoad(useRemembered = false)
                }
            }
        })
    }

    private fun installBridge(jcef: JBCefBrowser) {
        val bridge = JBCefJSQuery.create(jcef as JBCefBrowserBase)
        bridge.addHandler { raw ->
            handleMessage(raw)
            null
        }
        query = bridge
        jcef.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(browser: CefBrowser, frame: CefFrame, httpStatusCode: Int) {
                if (!frame.isMain) return
                val state = viewState.read()
                val js = """
                    window.__plyHost = {
                      protocolVersion: 1,
                      postMessage(message) {
                        if (window.__plyTestHostMessages) window.__plyTestHostMessages.push(message);
                        ${bridge.inject("JSON.stringify(message)")}
                      }
                    };
                    ${if (testMode()) "window.__plyTestHostMessages = window.__plyTestHostMessages || [];" else ""}
                    window.dispatchEvent(new Event('ply-host-ready'));
                """.trimIndent()
                browser.executeJavaScript(js, browser.url, 0)
                state?.let { sendState(it.toString()) }
                resend()
            }
        }, jcef.cefBrowser)
    }

    private fun loadViewer(jcef: JBCefBrowser) {
        try {
            jcef.loadHTML(PlyViewerAssets.html())
        } catch (error: Exception) {
            status.text = error.message ?: "Could not load bundled ply-vis"
            jcef.loadHTML("<html><body><p>${escapeHtml(status.text)}</p></body></html>")
        }
    }

    private fun refreshRootsAndLoad(useRemembered: Boolean) {
        val selected = roots.selectedItem as? Path
        val projectRoots = PlyArtifactDiscovery.projectRoots(project)
        val discovered = PlyArtifactDiscovery.findRoots(projectRoots, if (useRemembered) discoveryState.read() else emptyList())
        discoveryState.write(discovered.map { it.resolve("ply.yaml") })
        suppressRootEvents = true
        try {
            roots.removeAllItems()
            discovered.forEach(roots::addItem)
            roots.selectedItem = selected?.takeIf(discovered::contains) ?: discovered.firstOrNull()
        } finally {
            suppressRootEvents = false
        }
        loadSelectedRoot()
    }

    private fun loadSelectedRoot() {
        val root = roots.selectedItem as? Path ?: run {
            loaded = null
            show(PlyPanelDisplays.noRoot())
            return
        }
        val state = artifacts.reload(root)
        loaded = state.snapshot
        indexTimes[indexPath(root)] = modified(indexPath(root))
        show(PlyPanelDisplays.forRoot(state))
    }

    /**
     * Every path through loading ends here, and every one of them tells the
     * drawing what it told the status line. Clearing used to be the case
     * nobody wrote: the line said "no completed runs" and the last project's
     * picture stayed up behind it.
     */
    private fun show(display: PlyPanelDisplay) {
        status.text = display.status
        when (display) {
            is PlyPanelDisplay.Draw -> sendEnvelope(display.envelopeJson)
            is PlyPanelDisplay.Clear -> sendClear(display.status)
        }
    }

    private fun pollIndex() {
        val root = roots.selectedItem as? Path ?: return
        val path = indexPath(root)
        val next = modified(path)
        if (indexTimes[path] != next) {
            indexTimes[path] = next
            loadSelectedRoot()
        }
    }

    private fun handleMessage(raw: String) {
        try {
            when (val message = PlyHostMessage.parse(raw)) {
                is PlyHostMessage.NavigateSource -> {
                    val root = loaded?.root ?: error("No Ply run is loaded")
                    if (!PlySourceNavigator.navigate(project, root, message)) {
                        error("The recorded source location no longer resolves")
                    }
                }
                is PlyHostMessage.PersistState -> viewState.write(message.state)
                PlyHostMessage.Ready -> {
                    viewState.read()?.let { sendState(it.toString()) }
                    resend()
                }
                PlyHostMessage.RequestArtifact -> resend()
                is PlyHostMessage.ViewerError -> status.text = message.message
            }
        } catch (error: Exception) {
            status.text = error.message ?: "Invalid viewer message"
            sendHostError(status.text)
        }
    }

    /**
     * Answers a viewer that has just come up, or asked again, with whatever is
     * currently true -- including that there is nothing, which is an answer.
     * Staying silent left a reloaded viewer showing whatever it had drawn
     * before, with no way to find out that it was stale.
     */
    private fun resend() {
        val run = loaded
        if (run != null) sendEnvelope(run.envelopeJson) else sendClear(status.text)
    }

    private fun sendEnvelope(rawJson: String) = execute(
        "window.dispatchEvent(new MessageEvent('message',{data:{channel:'ply-vis',version:1,type:'artifact',envelope:$rawJson}}));"
    )

    private fun sendClear(message: String) = execute(
        "window.dispatchEvent(new MessageEvent('message',{data:{channel:'ply-vis',version:1,type:'clear',message:${gson.toJson(message)}}}));"
    )

    private fun sendState(rawJson: String) = execute(
        "window.dispatchEvent(new MessageEvent('message',{data:{channel:'ply-vis',version:1,type:'restore-state',state:$rawJson}}));"
    )

    private fun sendHostError(message: String) {
        status.text = message
    }

    private fun testMode() = System.getenv("PLY_JETBRAINS_TEST_MODE") == "1"

    private fun execute(script: String) {
        browser?.cefBrowser?.executeJavaScript(script, browser.cefBrowser.url, 0)
    }

    private fun indexPath(root: Path) = root.resolve("target/ply/view.json")
    private fun modified(path: Path) = runCatching { Files.getLastModifiedTime(path).toMillis() }.getOrDefault(-1)
    private fun escapeHtml(value: String) = value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    override fun dispose() {
        poller.stop()
        query?.dispose()
        browser?.dispose()
    }
}
