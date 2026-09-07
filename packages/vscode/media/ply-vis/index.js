const Rt = 1;
class x extends Error {
}
const T = (n) => typeof n == "object" && n !== null && !Array.isArray(n), B = (n, i, v = []) => {
  const f = /* @__PURE__ */ new Set([...i, ...v]);
  return i.every((h) => h in n) && Object.keys(n).every((h) => f.has(h));
}, Ie = (n) => Array.isArray(n) && n.every((i) => typeof i == "string"), It = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function ke(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(ke));
  if (T(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([i, v]) => [i, ke(v)])));
  throw new x("Evidence contains a non-JSON value");
}
function Ue(n) {
  if (n !== void 0) {
    if (!T(n) || !B(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new x("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((i) => i === ".." || i === ".")) throw new x("Invalid source location");
    for (const i of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[i]) || n[i] < 0) throw new x("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new x("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function xt(n) {
  if (!T(n) || !B(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new x("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new x(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const i = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!T(n.run) || !B(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !T(n.run.root) || !B(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !T(n.run.tool) || !B(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !i.has(n.run.outcome)) throw new x("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new x("Invalid SVG");
  const v = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new x("Invalid folded drawings");
    for (const d of n.folded) {
      if (!T(d) || !B(d, ["depth", "svg"]) || !Number.isInteger(d.depth) || d.depth < 1 || typeof d.svg != "string" || !d.svg.trim()) throw new x("Invalid folded drawing");
      v.push(Object.freeze({ depth: d.depth, svg: d.svg }));
    }
  }
  if (!T(n.elements)) throw new x("Invalid element index");
  const f = /* @__PURE__ */ Object.create(null);
  for (const [d, u] of Object.entries(n.elements)) {
    if (!T(u) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((k) => k in u) || !T(u.evidence)) throw new x(`Invalid element: ${d}`);
    if (u.id !== d || typeof u.id != "string" || !u.id || typeof u.kind != "string" || !u.kind || typeof u.label != "string" || !u.label || typeof u.evidence.verdict != "string" || !Ie(u.evidence.statuses) || typeof u.evidence.reused != "boolean" || u.evidence.state !== void 0 && !It.has(u.evidence.state) || !Ie(u.diagnosticIds) || u.parentId !== void 0 && typeof u.parentId != "string" || u.declaration !== void 0 && typeof u.declaration != "string" || u.limitations !== void 0 && !Ie(u.limitations)) throw new x(`Invalid element: ${d}`);
    const A = ke(u.evidence);
    f[d] = Object.freeze({ id: d, kind: u.kind, label: u.label, evidence: A, diagnosticIds: Object.freeze([...u.diagnosticIds]), ...u.parentId === void 0 ? {} : { parentId: u.parentId }, ...u.declaration === void 0 ? {} : { declaration: u.declaration }, ...u.limitations === void 0 ? {} : { limitations: Object.freeze([...u.limitations]) }, ...u.source === void 0 ? {} : { source: Ue(u.source) } });
  }
  for (const d of Object.values(f)) if (d.parentId && !f[d.parentId]) throw new x(`Unknown parent: ${d.parentId}`);
  const h = /* @__PURE__ */ new Set();
  for (const d of Object.values(f)) {
    const u = /* @__PURE__ */ new Set();
    let A = d;
    for (; A && !h.has(A.id); ) {
      if (u.has(A.id)) throw new x(`Element nesting forms a cycle: ${A.id}`);
      u.add(A.id), A = A.parentId ? f[A.parentId] : void 0;
    }
    for (const k of u) h.add(k);
  }
  const b = [], I = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new x("Invalid edge list");
    for (const d of n.edges) {
      if (!T(d) || !B(d, ["id", "fromId", "toId", "kind", "label"]) || typeof d.id != "string" || !d.id || d.id in f || I.has(d.id) || typeof d.fromId != "string" || !d.fromId || typeof d.toId != "string" || !d.toId || typeof d.kind != "string" || !d.kind || typeof d.label != "string" || !d.label) throw new x("Invalid edge");
      if (!f[d.fromId] || !f[d.toId]) throw new x("Unknown edge endpoint");
      I.add(d.id), b.push(Object.freeze({ id: d.id, fromId: d.fromId, toId: d.toId, kind: d.kind, label: d.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new x("Invalid diagnostics");
  const y = [], w = /* @__PURE__ */ new Set();
  for (const d of n.diagnostics) {
    if (!T(d) || typeof d.id != "string" || !d.id || w.has(d.id) || typeof d.code != "string" || !d.code || typeof d.severity != "string" || !d.severity || typeof d.message != "string" || !d.message || d.elementId !== void 0 && typeof d.elementId != "string") throw new x("Invalid diagnostic");
    w.add(d.id), y.push(Object.freeze({ id: d.id, code: d.code, severity: d.severity, message: d.message, ...d.elementId === void 0 ? {} : { elementId: d.elementId }, ...d.source === void 0 ? {} : { source: Ue(d.source) } }));
  }
  for (const d of Object.values(f)) for (const u of d.diagnosticIds ?? []) if (!w.has(u)) throw new x(`Unknown diagnostic: ${u}`);
  for (const d of y) if (d.elementId && !f[d.elementId]) throw new x(`Unknown diagnostic element: ${d.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), edges: Object.freeze(b), diagnostics: Object.freeze(y), folded: Object.freeze(v) });
}
const Et = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), St = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), kt = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ge = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, At = {
  fill: Ge,
  stroke: Ge,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, Ct = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function Lt(n) {
  let i = n, v = "";
  for (; ; ) {
    const f = i.search(/@media\b/i);
    if (f < 0) return { base: i, darkBody: v };
    const h = i.indexOf("{", f);
    if (h < 0) return { base: i.slice(0, f), darkBody: v };
    const b = i.slice(f, h).trim();
    let I = 0, y = h;
    for (; y < i.length; y += 1)
      if (i[y] === "{") I += 1;
      else if (i[y] === "}" && --I === 0) break;
    Ct.test(b) && (v += `${i.slice(h + 1, y)}
`), i = i.slice(0, f) + i.slice(Math.min(y + 1, i.length));
  }
}
function Ot(n, i) {
  if (!n.trim() || n.length > 32768) return;
  const { base: v, darkBody: f } = Lt(n), h = i ? `${v}
${f}` : v, b = /\s*([^{}]+)\{([^{}]*)\}/gy, I = [];
  let y = 0;
  for (; y < h.length; ) {
    b.lastIndex = y;
    const w = b.exec(h);
    if (!w) return h.slice(y).trim() === "" ? I : void 0;
    y = b.lastIndex;
    const d = w[1], u = w[2];
    if (d === void 0 || u === void 0) return;
    const A = d.split(",").map((D) => D.trim());
    if (!A.every((D) => kt.test(D))) return;
    const k = [];
    for (const D of u.split(";")) {
      const W = D.indexOf(":");
      if (W < 1) continue;
      const q = D.slice(0, W).trim().toLowerCase(), M = D.slice(W + 1).trim();
      At[q]?.test(M) === !0 && k.push([q, M]);
    }
    k.length && I.push({ selectors: A, declarations: k });
  }
  return I;
}
function Ke(n, i = {}) {
  const v = i.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const h of [...f.querySelectorAll("*")]) {
    if (h.localName.toLowerCase() === "style") {
      const b = Ot(h.textContent ?? "", v);
      if (b) for (const I of b) for (const y of I.selectors)
        for (const w of [...f.documentElement.querySelectorAll(y)])
          for (const [d, u] of I.declarations) w.setAttribute(d, u);
      h.remove();
      continue;
    }
    if (Et.has(h.localName.toLowerCase())) {
      h.remove();
      continue;
    }
    for (const b of [...h.attributes]) {
      const I = b.name.toLowerCase(), y = b.value.trim().toLowerCase(), w = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(y);
      (I.startsWith("on") || I === "style" || w || St.has(I) && y !== "" && !y.startsWith("#")) && h.removeAttribute(b.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const xe = 1, Bt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function $t(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n, v = i.overlays;
  return typeof i.zoom == "number" && Number.isFinite(i.zoom) && typeof i.panX == "number" && Number.isFinite(i.panX) && typeof i.panY == "number" && Number.isFinite(i.panY) && typeof v == "object" && v !== null && typeof v.earned == "boolean" && typeof v.gap == "boolean" && typeof v.violation == "boolean" && (i.detailsHidden === void 0 || typeof i.detailsHidden == "boolean") && (i.runId === void 0 || typeof i.runId == "string") && (i.selectedId === void 0 || typeof i.selectedId == "string") && (i.focusedId === void 0 || typeof i.focusedId == "string") && (i.hoverTooltips === void 0 || typeof i.hoverTooltips == "boolean") && (i.legendVisible === void 0 || typeof i.legendVisible == "boolean");
}
function Tt(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n;
  return i.channel === "ply-vis" && i.version === 1 && (i.type === "artifact" && "envelope" in i && typeof i.deliveryId == "string" || i.type === "restore-state" && $t(i.state) || i.type === "capabilities" && typeof i.explain == "boolean" || i.type === "clear" && typeof i.message == "string");
}
const Dt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, legendVisible: !1, optionsHidden: !1, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Je = (n, i) => Object.freeze({ ...n, ...i, overlays: Object.freeze({ ...n.overlays, ...i.overlays }) });
function* ce(n, i) {
  const v = /* @__PURE__ */ new Set();
  let f = n;
  for (; f && !v.has(f.id); )
    v.add(f.id), yield f, f = f.parentId ? i[f.parentId] : void 0;
}
function Mt(n, i, v = 0.5) {
  return i.x >= n.x - v && i.y >= n.y - v && i.x + i.width <= n.x + n.width + v && i.y + i.height <= n.y + n.height + v;
}
function zt(n, i, v = {}) {
  const f = v.margin ?? 24, h = v.minZoom ?? 0.2, b = v.maxZoom ?? 4, I = Math.max(1, n.width - f * 2), y = Math.max(1, n.height - f * 2), w = Math.max(1, i.width), d = Math.max(1, i.height), u = Math.min(b, Math.max(h, Math.min(I / w, y / d)));
  return {
    zoom: u,
    panX: n.width / 2 - (i.x + w / 2) * u,
    panY: n.height / 2 - (i.y + d / 2) * u
  };
}
function Nt(n, i, v) {
  return {
    zoom: i,
    panX: v.x - (v.x - n.panX) / n.zoom * i,
    panY: v.y - (v.y - n.panY) / n.zoom * i
  };
}
const jt = 500, qt = 160, Qe = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), Ht = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function Ee() {
  const n = typeof document < "u" ? document.body : void 0, i = n?.dataset.vscodeThemeKind;
  if (i !== void 0) return Qe.has(i);
  if (n) {
    for (const v of Qe) if (n.classList.contains(v)) return !0;
    for (const v of Ht) if (n.classList.contains(v)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const Se = (n, i) => `<button type="button" aria-label="${n}" title="${n}">${i}</button>`, Vt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${Se("Zoom out", "−")}${Se("Zoom in", "+")}${Se("Fit canvas", "Fit")}
      </div>
      <button type="button" class="ply-options-toggle" aria-controls="ply-vis-options" aria-expanded="true" aria-label="Hide options" title="Hide options">⌃</button>
      <div class="ply-options" id="ply-vis-options">
      <fieldset><legend>Detail</legend>
        <label><input type="checkbox" data-fold-detail checked> Fold detail when zoomed out</label>
        <label><input type="checkbox" data-hover-tooltips checked> Show tooltips on hover</label>
        <label><input type="checkbox" data-show-legend> Show legend</label>
      </fieldset>
      <fieldset data-evidence-filters><legend>Overlays</legend>
        <label><input type="checkbox" data-overlay="earned" checked> Earned</label>
        <label><input type="checkbox" data-overlay="gap" checked> Gap</label>
        <label><input type="checkbox" data-overlay="violation" checked> Violation</label>
      </fieldset>
      </div>
    </header>
    <div class="ply-identity">
      <nav class="ply-breadcrumbs" aria-label="Semantic focus"></nav>
      <p class="ply-provenance"></p>
    </div>
    <div class="ply-workspace is-inspector-hidden">
      <main class="ply-canvas" tabindex="0" aria-label="Architecture canvas. Use arrow keys to move between items and Enter to inspect." data-empty="true">
        <div class="ply-stage"></div>
        <section class="ply-legend-panel" aria-label="Diagram legend" hidden></section>
        <div class="ply-tooltip" id="ply-vis-tooltip" role="tooltip" hidden></div>
        <ul class="ply-context-menu" id="ply-vis-context-menu" role="menu" aria-label="Item options" hidden></ul>
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <button type="button" class="ply-inspector-toggle" aria-label="Show details" title="Show details" aria-controls="ply-inspector" aria-expanded="false">‹</button>
      <aside class="ply-inspector" id="ply-inspector" aria-label="Item details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function Ft(n, i, v = []) {
  n.innerHTML = Vt;
  const f = n.querySelector(".ply-vis"), h = f.querySelector(".ply-canvas"), b = f.querySelector(".ply-stage"), I = f.querySelector(".ply-legend-panel"), y = f.querySelector(".ply-tooltip"), w = f.querySelector(".ply-context-menu"), d = f.querySelector(".ply-inspector"), u = f.querySelector(".ply-inspector-toggle"), A = f.querySelector(".ply-workspace"), k = f.querySelector(".ply-status"), D = f.querySelector(".ply-toolbar [data-evidence-filters]"), W = f.querySelector(".ply-options"), q = f.querySelector(".ply-options-toggle"), M = f.querySelector(".ply-breadcrumbs"), U = f.querySelector(".ply-provenance");
  let a = Dt(), m, ne = /* @__PURE__ */ new Map(), oe, G = Ee(), H;
  const ie = /* @__PURE__ */ new Set();
  let L, Ae = 0, O, K, le, fe = !1, J;
  const Ce = () => i.post({ channel: "ply-vis", version: xe, type: "persist-state", state: a }), $ = (e, t = !0) => {
    a = Je(a, e), t && Ce();
  }, F = () => {
    b.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, et = () => m ? Object.values(m.elements).filter((e) => !a.focusedId || e.id === a.focusedId || ue(e, a.focusedId, m.elements)) : [];
  function V() {
    d.hidden = a.detailsHidden, A.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    u.setAttribute("aria-label", e), u.title = e, u.setAttribute("aria-expanded", String(!a.detailsHidden)), u.textContent = a.detailsHidden ? "‹" : "›";
  }
  function pe() {
    W.hidden = a.optionsHidden;
    const e = a.optionsHidden ? "Show options" : "Hide options";
    q.setAttribute("aria-label", e), q.title = e, q.setAttribute("aria-expanded", String(!a.optionsHidden)), q.textContent = a.optionsHidden ? "⌄" : "⌃";
  }
  function tt(e, t = !0) {
    $({ optionsHidden: e }, t), pe();
  }
  function Le(e, t = !0) {
    $({ detailsHidden: e }, t), V();
  }
  function Oe(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  const $e = {
    declared: ["Declared", "Promised, not checked"],
    earned: ["Earned", "Evidence completed"],
    gap: ["Gap", "Evidence missing"],
    violation: ["Violation", "A rule was broken"]
  };
  function se() {
    if (I.replaceChildren(), !m || !a.legendVisible) {
      I.hidden = !0;
      return;
    }
    const e = (l) => [...b.querySelectorAll(l)].some((g) => !g.closest("[hidden]")), t = /* @__PURE__ */ new Set();
    for (const l of b.querySelectorAll("[data-state]")) {
      if (l.closest("[hidden]")) continue;
      const g = l.dataset.state;
      g in $e && t.add(g);
    }
    const o = Object.keys(m.elements).length > 0;
    !t.size && !o && b.querySelector("svg") && t.add("declared");
    const s = document.createElement("h2");
    s.textContent = "Legend";
    const r = document.createElement("ul"), c = (l, g, p) => {
      const E = document.createElement("li"), C = document.createElement("span");
      C.className = "ply-legend-swatch", C.setAttribute("aria-hidden", "true"), p.state && (C.dataset.state = p.state), p.symbol && (C.dataset.symbol = p.symbol), p.symbol === "trusted" && (C.textContent = "⛉"), p.symbol === "decision" && (C.textContent = "#");
      const P = document.createElement("span"), de = document.createElement("strong");
      de.textContent = l;
      const ae = document.createElement("span");
      ae.textContent = g, P.append(de, ae), E.append(C, P), r.append(E);
    };
    for (const l of ["declared", "earned", "gap", "violation"]) {
      if (!t.has(l)) continue;
      const [g, p] = $e[l];
      c(g, p, { state: l });
    }
    e(".ceiling-tested, .ceiling-fuzzed, .ceiling-bounded, .ceiling-proved") && c("Grey depth", "Darker means stronger checks promised", { symbol: "ceiling" }), e(".ceiling-unclaimed") && c("Hatched fill", "Nothing here promises a check", { symbol: "unclaimed" }), e(".fn-chip-box-synth") && c("Violet fill", "Machine-written from its contract", { symbol: "synth" }), e(".strict-notch") && c("Strict request", "Asks for errors, not warnings", { symbol: "strict" }), e(".fn-shield") && c("Trusted claim", "Human-attested, not machine-checked", { symbol: "trusted" }), e(".unresolved-pin, .registry-pin") && c("Open decision", "A question still needs an answer", { symbol: "decision" }), e(".edge-call") && c("Call", "Solid arrow", { symbol: "call" }), e(".edge-flow") && c("Data flow", "Dashed arrow", { symbol: "flow" }), e(".edge-entry") && c("External entry", "Dashed arrow from outside", { symbol: "entry" }), e(".deny-rule") && c("Forbidden call", "This call is not allowed", { symbol: "denied" }), I.append(s, r), I.hidden = !1;
  }
  function nt(e) {
    const t = Object.values(e.elements);
    if (e.run.tool.version === "render" || t.length > 0 && t.every((l) => Oe(l) === "declared")) return { text: "Promises only — no run has checked this yet, so nothing here can ever be green." };
    const s = `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, r = e.run.tool.version;
    return J !== void 0 && /^[0-9a-f]{64}$/.test(r) && /^[0-9a-f]{64}$/.test(J) && r !== J ? {
      text: `${s} Ply itself has changed since this run, so nothing here would be carried forward — every check would run again.`,
      title: `Run ${e.run.id}
Ran by ${r}
Installed ${J}`
    } : { text: s, title: `Run ${e.run.id}` };
  }
  function ue(e, t, o) {
    for (const s of ce(e.parentId ? o[e.parentId] : void 0, o)) if (s.id === t) return !0;
    return !1;
  }
  function ot(e) {
    let t = 0, o = e;
    for (const s of ce(e, m?.elements ?? {})) {
      if (o = s, !s.parentId || s.id === a.focusedId) break;
      t += 1;
    }
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  function it(e) {
    let t = 0;
    for (const o of ce(e, m?.elements ?? {}))
      o.kind === "component" && (t += 1);
    return t;
  }
  const Te = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function st() {
    if (M.replaceChildren(), !m) return;
    const e = [];
    for (const o of ce(a.focusedId ? m.elements[a.focusedId] : void 0, m.elements)) {
      if (!o.parentId) break;
      e.unshift(o);
    }
    const t = document.createElement("button");
    t.type = "button", t.textContent = "Workspace", t.dataset.focusId = "", M.append(t);
    for (const o of e) {
      const s = document.createElement("button");
      s.type = "button", s.textContent = o.label, s.dataset.focusId = o.id, M.append(s);
    }
  }
  function Y(e) {
    d.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", d.append(t), !e || !m) {
      const p = document.createElement("p");
      p.textContent = "Select an item to inspect its declaration and evidence.", d.append(p);
      return;
    }
    if ("fromId" in e) {
      d.append(z("Type", [e.kind])), d.append(z("From", [m.elements[e.fromId].label])), d.append(z("To", [m.elements[e.toId].label]));
      return;
    }
    const o = e, s = o.declaration?.split(`
`).filter(Boolean);
    d.append(z("Declaration", s?.length ? s : ["No declaration text supplied."])), d.append(z("Verdict", [o.evidence.verdict])), d.append(z("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const r = Object.entries(o.evidence).filter(([p]) => !["verdict", "statuses"].includes(p)).map(([p, E]) => `${p}: ${typeof E == "string" ? E : JSON.stringify(E)}`);
    d.append(z("Earned evidence", r.length ? r : ["No additional evidence details supplied."])), d.append(z("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const c = new Map(m.diagnostics.map((p) => [p.id, p])), g = o.diagnosticIds.map((p) => c.get(p)).filter((p) => p !== void 0).map((p) => `${p.code} — ${p.severity}: ${p.message}`);
    if (d.append(z("Diagnostics", g.length ? g : ["No diagnostics supplied."])), d.append(rt(m.run)), o.source) {
      const p = document.createElement("button");
      p.type = "button", p.className = "ply-source", p.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, p.addEventListener("click", () => i.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), d.append(p);
    }
  }
  function z(e, t) {
    const o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = e, o.append(s);
    const r = document.createElement("ul");
    for (const c of t) {
      const l = document.createElement("li");
      l.textContent = c, r.append(l);
    }
    return o.append(r), o;
  }
  function rt(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = "Run details";
    const r = document.createElement("dl"), c = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [l, g] of c) {
      const p = document.createElement("dt");
      p.textContent = l;
      const E = document.createElement("dd");
      E.textContent = g, r.append(p, E);
    }
    return o.append(s, r), o;
  }
  function Q(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function dt(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function ee(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? m?.elements[t] : void 0;
  }
  function te(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? ne.get(t) : void 0;
  }
  function R(e) {
    return te(e) ?? ee(e);
  }
  function me() {
    if (!(!m || !a.selectedId))
      return ne.get(a.selectedId) ?? m.elements[a.selectedId];
  }
  function De(e) {
    return m ? `${e.kind}: ${e.label}; from ${m.elements[e.fromId].label} to ${m.elements[e.toId].label}` : e.label;
  }
  function at(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(y.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function Me(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== y.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function ct(e) {
    return y.scrollHeight <= y.clientHeight ? !1 : e > 0 ? y.scrollTop + y.clientHeight < y.scrollHeight : e < 0 ? y.scrollTop > 0 : !1;
  }
  function _() {
    K !== void 0 && window.clearTimeout(K), K = void 0;
  }
  function S() {
    O && Me(O), _(), O = void 0, y.hidden = !0, y.replaceChildren();
  }
  function lt(e, t) {
    if (!m) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const s = Object.entries(e.evidence).filter(([l, g]) => !["verdict", "statuses"].includes(l) && g !== !1 && g !== void 0).map(([l, g]) => `${l}: ${typeof g == "string" ? g : JSON.stringify(g)}`);
    o.push(...s), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const r = new Map(m.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const g = r.get(l);
      g && o.push(`${g.code} — ${g.severity}: ${g.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const c = t.dataset.plyTitle?.trim();
    return c && c !== e.label && !o.includes(c) && o.push(c), o;
  }
  function ft(e, t) {
    const o = h.getBoundingClientRect(), s = 8;
    y.style.maxHeight = `${Math.max(0, o.height - s * 2)}px`;
    const r = 12, c = y.offsetWidth, l = y.offsetHeight, g = Math.max(s, o.width - c - s), p = Math.max(s, o.height - l - s), E = e - o.left + r, C = t - o.top + r, P = C + l <= o.height - s ? C : t - o.top - l - r;
    y.style.left = `${Math.min(g, Math.max(s, E))}px`, y.style.top = `${Math.min(p, Math.max(s, P))}px`;
  }
  function ze(e, t, o) {
    const s = ee(e), r = te(e), c = e.dataset.plyTitle?.trim();
    if (!s && !r && !c || e.hasAttribute("hidden")) {
      S();
      return;
    }
    O && O !== e && Me(O), O = e;
    const l = document.createElement("span");
    if (r) {
      const p = document.createElement("strong");
      p.textContent = r.label, l.textContent = De(r), y.replaceChildren(p, l);
    } else if (s) {
      const p = document.createElement("strong");
      p.textContent = s.label, l.textContent = lt(s, e).join(`
`), y.replaceChildren(p, l);
    } else
      l.textContent = c, y.replaceChildren(l);
    y.hidden = !1, at(e);
    const g = e.getBoundingClientRect();
    ft(t ?? g.left + g.width / 2, o ?? g.bottom);
  }
  function Ne(e, t, o) {
    _(), O && O !== e && S(), K = window.setTimeout(() => {
      K = void 0, ze(e, t, o);
    }, jt);
  }
  function pt(e, t, o) {
    const s = h.getBoundingClientRect(), r = 8, c = Math.max(r, s.width - e.offsetWidth - r), l = Math.max(r, s.height - e.offsetHeight - r);
    e.style.left = `${Math.min(c, Math.max(r, t - s.left))}px`, e.style.top = `${Math.min(l, Math.max(r, o - s.top))}px`;
  }
  function N() {
    if (w.hidden) return;
    const e = w.contains(document.activeElement), t = le;
    w.hidden = !0, w.replaceChildren(), le = void 0, e && (t?.isConnected ? t : h).focus();
  }
  function je() {
    return [...w.querySelectorAll('button[role="menuitem"]')];
  }
  function he(e) {
    const t = je();
    if (!t.length) return;
    for (const s of t) s.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function ut(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? R(t) : void 0, s = o && !("fromId" in o) ? o : void 0, r = [];
    if (s && r.push({ label: `Zoom into ${s.label}`, run: () => Z(s.id) }), a.focusedId && r.push({ label: "Back to Workspace", run: () => Z(void 0) }), m) {
      const l = new Map(m.diagnostics.map((g) => [g.id, g]));
      for (const g of fe ? s?.diagnosticIds ?? [] : []) {
        const p = l.get(g)?.code;
        p && r.push({ label: `Explain ${p}`, run: () => i.post({ channel: "ply-vis", version: xe, type: "explain", code: p }) });
      }
    }
    if (t && fe && r.push({ label: "Explain a code…", run: () => i.post({ channel: "ply-vis", version: xe, type: "explain-prompt" }) }), !r.length) return;
    e.preventDefault(), S();
    const c = document.activeElement;
    le = c instanceof HTMLElement || c instanceof SVGElement ? c : void 0, w.replaceChildren();
    for (const l of r) {
      const g = document.createElement("li");
      g.setAttribute("role", "presentation");
      const p = document.createElement("button");
      p.type = "button", p.setAttribute("role", "menuitem"), p.textContent = l.label, p.tabIndex = -1, p.addEventListener("click", () => {
        N(), l.run();
      }), g.append(p), w.append(g);
    }
    w.hidden = !1, pt(w, e.clientX, e.clientY), he(0);
  }
  w.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), N();
      return;
    }
    const o = je().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), he(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), he(o - 1));
  }), h.addEventListener("contextmenu", ut);
  const qe = (e) => {
    !w.hidden && e.target instanceof Node && !w.contains(e.target) && N();
  };
  window.addEventListener("pointerdown", qe);
  function j() {
    if (!m) return;
    gt();
    const e = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? m.elements[a.focusedId] : void 0;
    for (const r of e) {
      const c = r.dataset.elementId ?? r.dataset.plyId ?? "", l = m.elements[c], g = te(r);
      if (g) {
        r.removeAttribute("hidden"), r.setAttribute("role", "button"), r.setAttribute("aria-label", De(g)), r.classList.toggle("is-selected", g.id === a.selectedId);
        continue;
      }
      if (!l) {
        r.removeAttribute("hidden");
        continue;
      }
      const p = Oe(l), E = p === "declared" || a.overlays[p], C = t ? ue(t, l.id, m.elements) : !1, P = !a.focusedId || l.id === a.focusedId || ue(l, a.focusedId, m.elements) || C, de = H === void 0 || C || ot(l) <= Te();
      r.toggleAttribute("hidden", !P || !de || !E && !C);
      const ae = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      r.setAttribute("role", "button"), r.setAttribute("aria-label", `${l.kind}: ${l.label}; ${ae}`), r.dataset.state = p, r.classList.toggle("is-selected", l.id === a.selectedId), r === O && (r.hasAttribute("hidden") || !r.isConnected) && S();
    }
    mt(), se();
    const o = e.filter((r) => !r.hasAttribute("hidden") && R(r)), s = o.find((r) => R(r)?.id === a.selectedId) ?? o[0];
    for (const r of e) r.setAttribute("tabindex", r === s ? "0" : "-1");
    st();
  }
  function mt() {
    const e = b.querySelector("svg");
    if (!e) return;
    for (const r of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      r.removeAttribute("hidden"), r.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => ee(r)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), s = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const r of [...e.children]) {
      if (!(r instanceof SVGElement) || r.matches("defs, style, title") || r.matches("[data-element-id], [data-ply-id]") && !te(r) || r.contains(t)) continue;
      const c = r;
      if (typeof c.getBBox != "function") continue;
      let l;
      try {
        l = c.getBBox();
      } catch {
        continue;
      }
      Mt(s, l) || (r.setAttribute("hidden", ""), r.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function ht(e) {
    X(), m = e, ne = new Map(e.edges.map((r) => [r.id, r])), $({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    D.hidden = !t, M.hidden = !t, u.hidden = !t, t || Le(!0, !1), V(), S(), N(), H = void 0, ye(e.svg), h.dataset.empty = "false";
    const o = h.querySelector(".ply-empty");
    o && o.remove(), F(), j(), Y(me());
    const s = nt(e);
    U.textContent = s.text, s.title ? U.title = s.title : U.removeAttribute("title"), k.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => be(!1));
  }
  function ye(e) {
    b.innerHTML = e;
    for (const t of [...b.querySelectorAll("title")]) {
      const o = t.parentElement, s = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), r = t.textContent?.trim();
      s && r && (s.dataset.plyTitle = r, ee(s) || (s.setAttribute("tabindex", "0"), s.setAttribute("role", "img"), s.setAttribute("aria-label", r))), t.remove();
    }
  }
  function X() {
    for (const e of ie) e.cancel();
    ie.clear();
  }
  function He() {
    const e = /* @__PURE__ */ new Map();
    for (const t of b.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const o = t.dataset.elementId ?? t.dataset.plyId;
      if (!o || e.has(o) || typeof t.getBoundingClientRect != "function") continue;
      let s;
      try {
        s = t.getBoundingClientRect();
      } catch {
        return;
      }
      if (![s.left, s.top, s.width, s.height].every(Number.isFinite)) return;
      e.set(o, s);
    }
    return e;
  }
  function yt(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = He();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const s of b.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const r = s.dataset.elementId ?? s.dataset.plyId, c = r ? e.get(r) : void 0, l = r ? t.get(r) : void 0;
      if (!c || !l || c.width <= 0 || c.height <= 0 || l.width <= 0 || l.height <= 0) continue;
      const g = c.width / l.width, p = c.height / l.height;
      if (![g, p].every(Number.isFinite)) continue;
      let E;
      try {
        if (E = s.animate([
          { transform: `translate(${(c.left - l.left) / o}px, ${(c.top - l.top) / o}px) scale(${g}, ${p})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: qt, easing: "ease-out", composite: "add" }), !(E.effect instanceof KeyframeEffect) || E.effect.composite !== "add") {
          E.cancel();
          continue;
        }
      } catch {
        continue;
      }
      ie.add(E), E.onfinish = E.oncancel = () => ie.delete(E);
    }
  }
  function gt() {
    if (!m) return;
    const e = vt();
    if (e === H) return;
    const t = e === void 0 ? m.svg : m.folded.find((s) => s.depth === e)?.svg;
    if (!t) {
      H = e;
      return;
    }
    S(), N(), X();
    const o = He();
    ye(t), H = e, o && !a.focusedId && yt(o);
  }
  function vt() {
    if (!m) return;
    let e = Te();
    if (Number.isFinite(e)) {
      if (a.focusedId) {
        const t = m.elements[a.focusedId];
        if (!t || t.kind !== "component") return;
        e += it(t);
      }
      return m.folded.some((t) => t.depth === e) ? e : void 0;
    }
  }
  function Ve(e) {
    return Object.freeze({
      ...e,
      svg: Ke(e.svg, { prefersDark: G }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Ke(t.svg, { prefersDark: G }) })))
    });
  }
  function ge(e, t) {
    try {
      const o = xt(e), s = Ve(o);
      return oe = o, ht(s), delete f.dataset.error, t !== void 0 && i.post({
        channel: "ply-vis",
        version: 1,
        type: "artifact-accepted",
        deliveryId: t
      }), !0;
    } catch (o) {
      const s = o instanceof x || o instanceof Error ? o.message : "Unknown artifact error";
      return k.textContent = `Artifact rejected: ${s}. The previous snapshot is unchanged.`, f.dataset.error = "true", i.post({ channel: "ply-vis", version: 1, type: "error", message: s }), !1;
    }
  }
  function Re(e) {
    if (e === G || !oe) {
      G = e;
      return;
    }
    G = e, m = Ve(oe), S(), N(), X();
    const t = H === void 0 ? m.svg : m.folded.find((o) => o.depth === H)?.svg ?? m.svg;
    ye(t), j(), F(), Y(me());
  }
  function re(e) {
    const t = m && (ne.get(e) ?? m.elements[e]);
    t && ($({ selectedId: e, detailsHidden: !1 }), V(), j(), Y(t));
  }
  function Be(e) {
    [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => R(o)?.id === e)?.focus();
  }
  function Z(e) {
    e && !m?.elements[e] || (e && !m.elements[e].parentId && (e = void 0), S(), N(), $({ focusedId: e, selectedId: e, detailsHidden: !e }), V(), j(), Y(e ? m?.elements[e] : void 0), be());
  }
  function bt() {
    const e = h.getBoundingClientRect(), o = (a.selectedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((s) => R(s)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function ve(e, t) {
    S(), N(), X(), t ??= bt(), $(Nt(a, Math.min(4, Math.max(0.2, e)), t)), F(), j(), k.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function be(e = !0) {
    X();
    const t = b.querySelector("svg");
    if (!t) return;
    const o = a.focusedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((g) => ee(g)?.id === a.focusedId) : t;
    if (!o) return;
    e && (k.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
    const s = b.getBoundingClientRect(), r = o.getBoundingClientRect(), c = a.zoom || 1, l = {
      x: (r.left - s.left) / c,
      y: (r.top - s.top) / c,
      width: r.width / c,
      height: r.height / c
    };
    $(zt({ width: h.clientWidth, height: h.clientHeight }, l)), F(), j();
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => ve(a.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => ve(a.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => be()), u.addEventListener("click", () => Le(!a.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    $({ overlays: { ...a.overlays, [t]: e.checked } }), j();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    $({ foldDetail: e.target.checked }), j(), k.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    $({ hoverTooltips: t }), t || (_(), O && document.activeElement !== O && S()), k.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), f.querySelector("[data-show-legend]").addEventListener("change", (e) => {
    const t = e.target.checked;
    $({ legendVisible: t }), se(), k.textContent = t ? "Legend shown" : "Legend hidden";
  }), M.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && Z(t.dataset.focusId || void 0);
  }), b.addEventListener("click", (e) => {
    if (performance.now() < Ae) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && re(o.id);
  }), b.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && !("fromId" in o) && Z(o.id);
  }), b.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = Q(e.target);
    t && Ne(t, e.clientX, e.clientY);
  }), b.addEventListener("pointermove", (e) => {
    const t = Q(e.target);
    if (y.hidden || S(), !a.hoverTooltips || !t) {
      _();
      return;
    }
    Ne(t, e.clientX, e.clientY);
  }), b.addEventListener("pointerout", (e) => {
    const t = Q(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || y.contains(e.relatedTarget)) || t.contains(document.activeElement) || S();
  }), b.addEventListener("focusin", (e) => {
    const t = Q(e.target);
    t && (!a.hoverTooltips && !dt(t) || (_(), ze(t)));
  }), b.addEventListener("focusout", (e) => {
    const t = Q(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || S();
  }), y.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && O?.contains(e.relatedTarget) || S();
  }), y.addEventListener("wheel", (e) => {
    if (ct(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    S();
  }, { passive: !0 }), y.addEventListener("pointerdown", (e) => e.stopPropagation()), h.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = h.getBoundingClientRect();
    ve(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), h.addEventListener("pointerdown", (e) => {
    e.button === 0 && (L = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), h.addEventListener("pointermove", (e) => {
    if (!L) return;
    const t = e.clientX - L.x, o = e.clientY - L.y;
    if (!(!L.moved && Math.hypot(t, o) < 3)) {
      if (!L.moved) {
        L.moved = !0, h.classList.add("is-panning"), S(), I.hidden = !0;
        try {
          h.setPointerCapture(L.pointerId);
        } catch {
        }
      }
      e.preventDefault(), $({ panX: L.panX + t, panY: L.panY + o }, !1), F();
    }
  });
  const we = () => {
    if (!L) return;
    const e = L.moved;
    e && (Ae = performance.now() + 250, Ce()), L = void 0, h.classList.remove("is-panning"), e && se();
  };
  h.addEventListener("pointerup", we), h.addEventListener("pointercancel", we), h.addEventListener("lostpointercapture", we), h.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !y.hidden) {
      e.preventDefault(), S();
      return;
    }
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((c) => !c.hasAttribute("hidden") && te(c)).map((c) => c.dataset.elementId ?? c.dataset.plyId)), s = [...et(), ...(m?.edges ?? []).filter((c) => o.has(c.id))];
    if (!s.length) return;
    const r = Math.max(0, s.findIndex((c) => c.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = s[(r + 1) % s.length].id;
      re(c), Be(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = s[(r - 1 + s.length) % s.length].id;
      re(c), Be(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = s[r];
      "fromId" in c ? re(c.id) : Z(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = a.focusedId ? m?.elements[a.focusedId]?.parentId : void 0;
      Z(c);
    }
  });
  function wt(e) {
    m = void 0, oe = void 0, H = void 0, a = { ...a, selectedId: void 0, focusedId: void 0, detailsHidden: !0 }, b.innerHTML = "", se(), S(), N(), h.dataset.empty = "true";
    const t = h.querySelector(".ply-empty");
    if (t) t.textContent = e;
    else {
      const o = document.createElement("p");
      o.className = "ply-empty", o.textContent = e, h.append(o);
    }
    M.hidden = !0, u.hidden = !0, Y(void 0), V(), U.textContent = "", U.removeAttribute("title"), k.textContent = "";
  }
  const Fe = (e) => {
    Tt(e.data) && (e.data.type === "artifact" ? ge(e.data.envelope, e.data.deliveryId) : e.data.type === "capabilities" ? (fe = e.data.explain, J = e.data.installedTool) : e.data.type === "clear" ? wt(e.data.message) : (a = Je(a, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = a.foldDetail, f.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, f.querySelector("[data-show-legend]").checked = a.legendVisible, pe(), m && (V(), F(), j(), Y(me()))));
  }, Ye = (e) => {
    k.textContent = `Viewer error: ${e}`, i.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, _e = (e) => Ye(e.message || "Unknown runtime error"), Xe = (e) => Ye(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", Fe), window.addEventListener("error", _e), window.addEventListener("unhandledrejection", Xe);
  const Ze = typeof MutationObserver == "function" ? new MutationObserver(() => Re(Ee())) : void 0;
  Ze?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Pe = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, We = () => Re(Ee());
  Pe?.addEventListener("change", We), q.addEventListener("click", () => tt(!a.optionsHidden)), V(), pe();
  for (const e of v) ge(e);
  return i.post({ channel: "ply-vis", version: 1, type: "ready" }), v.length || i.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: ge, getState: () => a, destroy: () => {
    _(), X(), window.removeEventListener("message", Fe), window.removeEventListener("error", _e), window.removeEventListener("unhandledrejection", Xe), window.removeEventListener("pointerdown", qe), Ze?.disconnect(), Pe?.removeEventListener("change", We), n.replaceChildren();
  } };
}
const Yt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Yt as CONTENT_SECURITY_POLICY,
  x as EnvelopeError,
  xe as HOST_PROTOCOL_VERSION,
  Rt as PROTOCOL_VERSION,
  Dt as initialViewState,
  Tt as isHostResponse,
  Ft as mountViewer,
  xt as parseEnvelope,
  Ke as sanitizeSvg,
  Je as updateViewState,
  Bt as windowHostBridge
};
//# sourceMappingURL=index.js.map
