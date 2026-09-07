const Vt = 1;
class E extends Error {
}
const $ = (n) => typeof n == "object" && n !== null && !Array.isArray(n), B = (n, r, v = []) => {
  const f = /* @__PURE__ */ new Set([...r, ...v]);
  return r.every((m) => m in n) && Object.keys(n).every((m) => f.has(m));
}, be = (n) => Array.isArray(n) && n.every((r) => typeof r == "string"), wt = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function Se(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(Se));
  if ($(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([r, v]) => [r, Se(v)])));
  throw new E("Evidence contains a non-JSON value");
}
function We(n) {
  if (n !== void 0) {
    if (!$(n) || !B(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new E("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new E("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[r]) || n[r] < 0) throw new E("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new E("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function It(n) {
  if (!$(n) || !B(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new E("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new E(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!$(n.run) || !B(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !$(n.run.root) || !B(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !$(n.run.tool) || !B(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !r.has(n.run.outcome)) throw new E("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new E("Invalid SVG");
  const v = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new E("Invalid folded drawings");
    for (const d of n.folded) {
      if (!$(d) || !B(d, ["depth", "svg"]) || !Number.isInteger(d.depth) || d.depth < 1 || typeof d.svg != "string" || !d.svg.trim()) throw new E("Invalid folded drawing");
      v.push(Object.freeze({ depth: d.depth, svg: d.svg }));
    }
  }
  if (!$(n.elements)) throw new E("Invalid element index");
  const f = /* @__PURE__ */ Object.create(null);
  for (const [d, p] of Object.entries(n.elements)) {
    if (!$(p) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((k) => k in p) || !$(p.evidence)) throw new E(`Invalid element: ${d}`);
    if (p.id !== d || typeof p.id != "string" || !p.id || typeof p.kind != "string" || !p.kind || typeof p.label != "string" || !p.label || typeof p.evidence.verdict != "string" || !be(p.evidence.statuses) || typeof p.evidence.reused != "boolean" || p.evidence.state !== void 0 && !wt.has(p.evidence.state) || !be(p.diagnosticIds) || p.parentId !== void 0 && typeof p.parentId != "string" || p.declaration !== void 0 && typeof p.declaration != "string" || p.limitations !== void 0 && !be(p.limitations)) throw new E(`Invalid element: ${d}`);
    const A = Se(p.evidence);
    f[d] = Object.freeze({ id: d, kind: p.kind, label: p.label, evidence: A, diagnosticIds: Object.freeze([...p.diagnosticIds]), ...p.parentId === void 0 ? {} : { parentId: p.parentId }, ...p.declaration === void 0 ? {} : { declaration: p.declaration }, ...p.limitations === void 0 ? {} : { limitations: Object.freeze([...p.limitations]) }, ...p.source === void 0 ? {} : { source: We(p.source) } });
  }
  for (const d of Object.values(f)) if (d.parentId && !f[d.parentId]) throw new E(`Unknown parent: ${d.parentId}`);
  const m = /* @__PURE__ */ new Set();
  for (const d of Object.values(f)) {
    const p = /* @__PURE__ */ new Set();
    let A = d;
    for (; A && !m.has(A.id); ) {
      if (p.has(A.id)) throw new E(`Element nesting forms a cycle: ${A.id}`);
      p.add(A.id), A = A.parentId ? f[A.parentId] : void 0;
    }
    for (const k of p) m.add(k);
  }
  const b = [], x = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new E("Invalid edge list");
    for (const d of n.edges) {
      if (!$(d) || !B(d, ["id", "fromId", "toId", "kind", "label"]) || typeof d.id != "string" || !d.id || d.id in f || x.has(d.id) || typeof d.fromId != "string" || !d.fromId || typeof d.toId != "string" || !d.toId || typeof d.kind != "string" || !d.kind || typeof d.label != "string" || !d.label) throw new E("Invalid edge");
      if (!f[d.fromId] || !f[d.toId]) throw new E("Unknown edge endpoint");
      x.add(d.id), b.push(Object.freeze({ id: d.id, fromId: d.fromId, toId: d.toId, kind: d.kind, label: d.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new E("Invalid diagnostics");
  const h = [], w = /* @__PURE__ */ new Set();
  for (const d of n.diagnostics) {
    if (!$(d) || typeof d.id != "string" || !d.id || w.has(d.id) || typeof d.code != "string" || !d.code || typeof d.severity != "string" || !d.severity || typeof d.message != "string" || !d.message || d.elementId !== void 0 && typeof d.elementId != "string") throw new E("Invalid diagnostic");
    w.add(d.id), h.push(Object.freeze({ id: d.id, code: d.code, severity: d.severity, message: d.message, ...d.elementId === void 0 ? {} : { elementId: d.elementId }, ...d.source === void 0 ? {} : { source: We(d.source) } }));
  }
  for (const d of Object.values(f)) for (const p of d.diagnosticIds ?? []) if (!w.has(p)) throw new E(`Unknown diagnostic: ${p}`);
  for (const d of h) if (d.elementId && !f[d.elementId]) throw new E(`Unknown diagnostic element: ${d.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), edges: Object.freeze(b), diagnostics: Object.freeze(h), folded: Object.freeze(v) });
}
const xt = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), Et = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), St = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ue = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, kt = {
  fill: Ue,
  stroke: Ue,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, At = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function Ct(n) {
  let r = n, v = "";
  for (; ; ) {
    const f = r.search(/@media\b/i);
    if (f < 0) return { base: r, darkBody: v };
    const m = r.indexOf("{", f);
    if (m < 0) return { base: r.slice(0, f), darkBody: v };
    const b = r.slice(f, m).trim();
    let x = 0, h = m;
    for (; h < r.length; h += 1)
      if (r[h] === "{") x += 1;
      else if (r[h] === "}" && --x === 0) break;
    At.test(b) && (v += `${r.slice(m + 1, h)}
`), r = r.slice(0, f) + r.slice(Math.min(h + 1, r.length));
  }
}
function Lt(n, r) {
  if (!n.trim() || n.length > 32768) return;
  const { base: v, darkBody: f } = Ct(n), m = r ? `${v}
${f}` : v, b = /\s*([^{}]+)\{([^{}]*)\}/gy, x = [];
  let h = 0;
  for (; h < m.length; ) {
    b.lastIndex = h;
    const w = b.exec(m);
    if (!w) return m.slice(h).trim() === "" ? x : void 0;
    h = b.lastIndex;
    const d = w[1], p = w[2];
    if (d === void 0 || p === void 0) return;
    const A = d.split(",").map((T) => T.trim());
    if (!A.every((T) => St.test(T))) return;
    const k = [];
    for (const T of p.split(";")) {
      const W = T.indexOf(":");
      if (W < 1) continue;
      const q = T.slice(0, W).trim().toLowerCase(), D = T.slice(W + 1).trim();
      kt[q]?.test(D) === !0 && k.push([q, D]);
    }
    k.length && x.push({ selectors: A, declarations: k });
  }
  return x;
}
function Ge(n, r = {}) {
  const v = r.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const m of [...f.querySelectorAll("*")]) {
    if (m.localName.toLowerCase() === "style") {
      const b = Lt(m.textContent ?? "", v);
      if (b) for (const x of b) for (const h of x.selectors)
        for (const w of [...f.documentElement.querySelectorAll(h)])
          for (const [d, p] of x.declarations) w.setAttribute(d, p);
      m.remove();
      continue;
    }
    if (xt.has(m.localName.toLowerCase())) {
      m.remove();
      continue;
    }
    for (const b of [...m.attributes]) {
      const x = b.name.toLowerCase(), h = b.value.trim().toLowerCase(), w = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(h);
      (x.startsWith("on") || x === "style" || w || Et.has(x) && h !== "" && !h.startsWith("#")) && m.removeAttribute(b.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const we = 1, Rt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function Ot(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n, v = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof v == "object" && v !== null && typeof v.earned == "boolean" && typeof v.gap == "boolean" && typeof v.violation == "boolean" && (r.detailsHidden === void 0 || typeof r.detailsHidden == "boolean") && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string") && (r.hoverTooltips === void 0 || typeof r.hoverTooltips == "boolean") && (r.legendVisible === void 0 || typeof r.legendVisible == "boolean");
}
function $t(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r && typeof r.deliveryId == "string" || r.type === "restore-state" && Ot(r.state) || r.type === "capabilities" && typeof r.explain == "boolean" || r.type === "clear" && typeof r.message == "string");
}
const Tt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, legendVisible: !1, optionsHidden: !1, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Ke = (n, r) => Object.freeze({ ...n, ...r, overlays: Object.freeze({ ...n.overlays, ...r.overlays }) });
function* Ie(n, r) {
  const v = /* @__PURE__ */ new Set();
  let f = n;
  for (; f && !v.has(f.id); )
    v.add(f.id), yield f, f = f.parentId ? r[f.parentId] : void 0;
}
function Dt(n, r, v = 0.5) {
  return r.x >= n.x - v && r.y >= n.y - v && r.x + r.width <= n.x + n.width + v && r.y + r.height <= n.y + n.height + v;
}
function Mt(n, r, v = {}) {
  const f = v.margin ?? 24, m = v.minZoom ?? 0.2, b = v.maxZoom ?? 4, x = Math.max(1, n.width - f * 2), h = Math.max(1, n.height - f * 2), w = Math.max(1, r.width), d = Math.max(1, r.height), p = Math.min(b, Math.max(m, Math.min(x / w, h / d)));
  return {
    zoom: p,
    panX: n.width / 2 - (r.x + w / 2) * p,
    panY: n.height / 2 - (r.y + d / 2) * p
  };
}
function zt(n, r, v) {
  return {
    zoom: r,
    panX: v.x - (v.x - n.panX) / n.zoom * r,
    panY: v.y - (v.y - n.panY) / n.zoom * r
  };
}
const Nt = 500, jt = 160, Je = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), qt = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function xe() {
  const n = typeof document < "u" ? document.body : void 0, r = n?.dataset.vscodeThemeKind;
  if (r !== void 0) return Je.has(r);
  if (n) {
    for (const v of Je) if (n.classList.contains(v)) return !0;
    for (const v of qt) if (n.classList.contains(v)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const Ee = (n, r) => `<button type="button" aria-label="${n}" title="${n}">${r}</button>`, Ht = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${Ee("Zoom out", "−")}${Ee("Zoom in", "+")}${Ee("Fit canvas", "Fit")}
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
function Bt(n, r, v = []) {
  n.innerHTML = Ht;
  const f = n.querySelector(".ply-vis"), m = f.querySelector(".ply-canvas"), b = f.querySelector(".ply-stage"), x = f.querySelector(".ply-legend-panel"), h = f.querySelector(".ply-tooltip"), w = f.querySelector(".ply-context-menu"), d = f.querySelector(".ply-inspector"), p = f.querySelector(".ply-inspector-toggle"), A = f.querySelector(".ply-workspace"), k = f.querySelector(".ply-status"), T = f.querySelector(".ply-toolbar [data-evidence-filters]"), W = f.querySelector(".ply-options"), q = f.querySelector(".ply-options-toggle"), D = f.querySelector(".ply-breadcrumbs"), U = f.querySelector(".ply-provenance");
  let a = Tt(), g, ne = /* @__PURE__ */ new Map(), oe, G = xe(), H;
  const ie = /* @__PURE__ */ new Set();
  let C, ke = 0, L, K, ae, ce = !1, J;
  const Ae = () => r.post({ channel: "ply-vis", version: we, type: "persist-state", state: a }), O = (e, t = !0) => {
    a = Ke(a, e), t && Ae();
  }, F = () => {
    b.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, Qe = () => g ? Object.values(g.elements).filter((e) => !a.focusedId || e.id === a.focusedId || fe(e, a.focusedId, g.elements)) : [];
  function V() {
    d.hidden = a.detailsHidden, A.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    p.setAttribute("aria-label", e), p.title = e, p.setAttribute("aria-expanded", String(!a.detailsHidden)), p.textContent = a.detailsHidden ? "‹" : "›";
  }
  function le() {
    W.hidden = a.optionsHidden;
    const e = a.optionsHidden ? "Show options" : "Hide options";
    q.setAttribute("aria-label", e), q.title = e, q.setAttribute("aria-expanded", String(!a.optionsHidden)), q.textContent = a.optionsHidden ? "⌄" : "⌃";
  }
  function et(e, t = !0) {
    O({ optionsHidden: e }, t), le();
  }
  function Ce(e, t = !0) {
    O({ detailsHidden: e }, t), V();
  }
  function Le(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  const Oe = {
    declared: ["Declared", "Promised, not checked"],
    earned: ["Earned", "Evidence completed"],
    gap: ["Gap", "Evidence missing"],
    violation: ["Violation", "A rule was broken"]
  };
  function se() {
    if (x.replaceChildren(), !g || !a.legendVisible) {
      x.hidden = !0;
      return;
    }
    const e = (c) => [...b.querySelectorAll(c)].some((l) => !l.closest("[hidden]")), t = /* @__PURE__ */ new Set();
    for (const c of b.querySelectorAll("[data-state]")) {
      if (c.closest("[hidden]")) continue;
      const l = c.dataset.state;
      l in Oe && t.add(l);
    }
    !t.size && b.querySelector("svg") && t.add("declared");
    const o = document.createElement("h2");
    o.textContent = "Legend";
    const s = document.createElement("ul"), i = (c, l, y) => {
      const u = document.createElement("li"), I = document.createElement("span");
      I.className = "ply-legend-swatch", I.setAttribute("aria-hidden", "true"), y.state && (I.dataset.state = y.state), y.symbol && (I.dataset.symbol = y.symbol), y.symbol === "trusted" && (I.textContent = "⛉"), y.symbol === "decision" && (I.textContent = "#");
      const j = document.createElement("span"), P = document.createElement("strong");
      P.textContent = c;
      const de = document.createElement("span");
      de.textContent = l, j.append(P, de), u.append(I, j), s.append(u);
    };
    for (const c of ["declared", "earned", "gap", "violation"]) {
      if (!t.has(c)) continue;
      const [l, y] = Oe[c];
      i(l, y, { state: c });
    }
    e(".ceiling-tested, .ceiling-fuzzed, .ceiling-bounded, .ceiling-proved") && i("Grey depth", "Darker means stronger checks promised", { symbol: "ceiling" }), e(".ceiling-unclaimed") && i("Hatched fill", "Nothing here promises a check", { symbol: "unclaimed" }), e(".fn-chip-box-synth") && i("Violet fill", "Machine-written from its contract", { symbol: "synth" }), e(".strict-notch") && i("Strict request", "Asks for errors, not warnings", { symbol: "strict" }), e(".fn-shield") && i("Trusted claim", "Human-attested, not machine-checked", { symbol: "trusted" }), e(".unresolved-pin, .registry-pin") && i("Open decision", "A question still needs an answer", { symbol: "decision" }), e(".edge-call") && i("Call", "Solid arrow", { symbol: "call" }), e(".edge-flow") && i("Data flow", "Dashed arrow", { symbol: "flow" }), e(".edge-entry") && i("External entry", "Dashed arrow from outside", { symbol: "entry" }), e(".deny-rule") && i("Forbidden call", "This call is not allowed", { symbol: "denied" }), x.append(o, s), x.hidden = !1;
  }
  function tt(e) {
    if (e.run.tool.version === "render" || Object.values(e.elements).every((c) => Le(c) === "declared")) return { text: "Promises only — no run has checked this yet, so nothing here can ever be green." };
    const o = `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, s = e.run.tool.version;
    return J !== void 0 && /^[0-9a-f]{64}$/.test(s) && /^[0-9a-f]{64}$/.test(J) && s !== J ? {
      text: `${o} Ply itself has changed since this run, so nothing here would be carried forward — every check would run again.`,
      title: `Run ${e.run.id}
Ran by ${s}
Installed ${J}`
    } : { text: o, title: `Run ${e.run.id}` };
  }
  function fe(e, t, o) {
    for (const s of Ie(e.parentId ? o[e.parentId] : void 0, o)) if (s.id === t) return !0;
    return !1;
  }
  function nt(e) {
    let t = 0, o = e;
    for (const s of Ie(e, g?.elements ?? {})) {
      if (o = s, !s.parentId || s.id === a.focusedId) break;
      t += 1;
    }
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const $e = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function ot() {
    if (D.replaceChildren(), !g) return;
    const e = [];
    for (const o of Ie(a.focusedId ? g.elements[a.focusedId] : void 0, g.elements)) {
      if (!o.parentId) break;
      e.unshift(o);
    }
    const t = document.createElement("button");
    t.type = "button", t.textContent = "Workspace", t.dataset.focusId = "", D.append(t);
    for (const o of e) {
      const s = document.createElement("button");
      s.type = "button", s.textContent = o.label, s.dataset.focusId = o.id, D.append(s);
    }
  }
  function Y(e) {
    d.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", d.append(t), !e || !g) {
      const u = document.createElement("p");
      u.textContent = "Select an item to inspect its declaration and evidence.", d.append(u);
      return;
    }
    if ("fromId" in e) {
      d.append(M("Type", [e.kind])), d.append(M("From", [g.elements[e.fromId].label])), d.append(M("To", [g.elements[e.toId].label]));
      return;
    }
    const o = e, s = o.declaration?.split(`
`).filter(Boolean);
    d.append(M("Declaration", s?.length ? s : ["No declaration text supplied."])), d.append(M("Verdict", [o.evidence.verdict])), d.append(M("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const i = Object.entries(o.evidence).filter(([u]) => !["verdict", "statuses"].includes(u)).map(([u, I]) => `${u}: ${typeof I == "string" ? I : JSON.stringify(I)}`);
    d.append(M("Earned evidence", i.length ? i : ["No additional evidence details supplied."])), d.append(M("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const c = new Map(g.diagnostics.map((u) => [u.id, u])), y = o.diagnosticIds.map((u) => c.get(u)).filter((u) => u !== void 0).map((u) => `${u.code} — ${u.severity}: ${u.message}`);
    if (d.append(M("Diagnostics", y.length ? y : ["No diagnostics supplied."])), d.append(it(g.run)), o.source) {
      const u = document.createElement("button");
      u.type = "button", u.className = "ply-source", u.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, u.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), d.append(u);
    }
  }
  function M(e, t) {
    const o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = e, o.append(s);
    const i = document.createElement("ul");
    for (const c of t) {
      const l = document.createElement("li");
      l.textContent = c, i.append(l);
    }
    return o.append(i), o;
  }
  function it(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = "Run details";
    const i = document.createElement("dl"), c = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [l, y] of c) {
      const u = document.createElement("dt");
      u.textContent = l;
      const I = document.createElement("dd");
      I.textContent = y, i.append(u, I);
    }
    return o.append(s, i), o;
  }
  function Q(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function st(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function ee(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? g?.elements[t] : void 0;
  }
  function te(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? ne.get(t) : void 0;
  }
  function R(e) {
    return te(e) ?? ee(e);
  }
  function pe() {
    if (!(!g || !a.selectedId))
      return ne.get(a.selectedId) ?? g.elements[a.selectedId];
  }
  function Te(e) {
    return g ? `${e.kind}: ${e.label}; from ${g.elements[e.fromId].label} to ${g.elements[e.toId].label}` : e.label;
  }
  function rt(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(h.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function De(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== h.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function dt(e) {
    return h.scrollHeight <= h.clientHeight ? !1 : e > 0 ? h.scrollTop + h.clientHeight < h.scrollHeight : e < 0 ? h.scrollTop > 0 : !1;
  }
  function _() {
    K !== void 0 && window.clearTimeout(K), K = void 0;
  }
  function S() {
    L && De(L), _(), L = void 0, h.hidden = !0, h.replaceChildren();
  }
  function at(e, t) {
    if (!g) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const s = Object.entries(e.evidence).filter(([l, y]) => !["verdict", "statuses"].includes(l) && y !== !1 && y !== void 0).map(([l, y]) => `${l}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    o.push(...s), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const i = new Map(g.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const y = i.get(l);
      y && o.push(`${y.code} — ${y.severity}: ${y.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const c = t.dataset.plyTitle?.trim();
    return c && c !== e.label && !o.includes(c) && o.push(c), o;
  }
  function ct(e, t) {
    const o = m.getBoundingClientRect(), s = 8;
    h.style.maxHeight = `${Math.max(0, o.height - s * 2)}px`;
    const i = 12, c = h.offsetWidth, l = h.offsetHeight, y = Math.max(s, o.width - c - s), u = Math.max(s, o.height - l - s), I = e - o.left + i, j = t - o.top + i, P = j + l <= o.height - s ? j : t - o.top - l - i;
    h.style.left = `${Math.min(y, Math.max(s, I))}px`, h.style.top = `${Math.min(u, Math.max(s, P))}px`;
  }
  function Me(e, t, o) {
    const s = ee(e), i = te(e), c = e.dataset.plyTitle?.trim();
    if (!s && !i && !c || e.hasAttribute("hidden")) {
      S();
      return;
    }
    L && L !== e && De(L), L = e;
    const l = document.createElement("span");
    if (i) {
      const u = document.createElement("strong");
      u.textContent = i.label, l.textContent = Te(i), h.replaceChildren(u, l);
    } else if (s) {
      const u = document.createElement("strong");
      u.textContent = s.label, l.textContent = at(s, e).join(`
`), h.replaceChildren(u, l);
    } else
      l.textContent = c, h.replaceChildren(l);
    h.hidden = !1, rt(e);
    const y = e.getBoundingClientRect();
    ct(t ?? y.left + y.width / 2, o ?? y.bottom);
  }
  function ze(e, t, o) {
    _(), L && L !== e && S(), K = window.setTimeout(() => {
      K = void 0, Me(e, t, o);
    }, Nt);
  }
  function lt(e, t, o) {
    const s = m.getBoundingClientRect(), i = 8, c = Math.max(i, s.width - e.offsetWidth - i), l = Math.max(i, s.height - e.offsetHeight - i);
    e.style.left = `${Math.min(c, Math.max(i, t - s.left))}px`, e.style.top = `${Math.min(l, Math.max(i, o - s.top))}px`;
  }
  function z() {
    if (w.hidden) return;
    const e = w.contains(document.activeElement), t = ae;
    w.hidden = !0, w.replaceChildren(), ae = void 0, e && (t?.isConnected ? t : m).focus();
  }
  function Ne() {
    return [...w.querySelectorAll('button[role="menuitem"]')];
  }
  function ue(e) {
    const t = Ne();
    if (!t.length) return;
    for (const s of t) s.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function ft(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? R(t) : void 0, s = o && !("fromId" in o) ? o : void 0, i = [];
    if (s && i.push({ label: `Zoom into ${s.label}`, run: () => Z(s.id) }), a.focusedId && i.push({ label: "Back to Workspace", run: () => Z(void 0) }), g) {
      const l = new Map(g.diagnostics.map((y) => [y.id, y]));
      for (const y of ce ? s?.diagnosticIds ?? [] : []) {
        const u = l.get(y)?.code;
        u && i.push({ label: `Explain ${u}`, run: () => r.post({ channel: "ply-vis", version: we, type: "explain", code: u }) });
      }
    }
    if (t && ce && i.push({ label: "Explain a code…", run: () => r.post({ channel: "ply-vis", version: we, type: "explain-prompt" }) }), !i.length) return;
    e.preventDefault(), S();
    const c = document.activeElement;
    ae = c instanceof HTMLElement || c instanceof SVGElement ? c : void 0, w.replaceChildren();
    for (const l of i) {
      const y = document.createElement("li");
      y.setAttribute("role", "presentation");
      const u = document.createElement("button");
      u.type = "button", u.setAttribute("role", "menuitem"), u.textContent = l.label, u.tabIndex = -1, u.addEventListener("click", () => {
        z(), l.run();
      }), y.append(u), w.append(y);
    }
    w.hidden = !1, lt(w, e.clientX, e.clientY), ue(0);
  }
  w.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), z();
      return;
    }
    const o = Ne().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), ue(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), ue(o - 1));
  }), m.addEventListener("contextmenu", ft);
  const je = (e) => {
    !w.hidden && e.target instanceof Node && !w.contains(e.target) && z();
  };
  window.addEventListener("pointerdown", je);
  function N() {
    if (!g) return;
    ht();
    const e = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? g.elements[a.focusedId] : void 0;
    for (const i of e) {
      const c = i.dataset.elementId ?? i.dataset.plyId ?? "", l = g.elements[c], y = te(i);
      if (y) {
        i.removeAttribute("hidden"), i.setAttribute("role", "button"), i.setAttribute("aria-label", Te(y)), i.classList.toggle("is-selected", y.id === a.selectedId);
        continue;
      }
      if (!l) {
        i.removeAttribute("hidden");
        continue;
      }
      const u = Le(l), I = u === "declared" || a.overlays[u], j = t ? fe(t, l.id, g.elements) : !1, P = !a.focusedId || l.id === a.focusedId || fe(l, a.focusedId, g.elements) || j, de = j || nt(l) <= $e();
      i.toggleAttribute("hidden", !P || !de || !I && !j);
      const bt = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${l.kind}: ${l.label}; ${bt}`), i.dataset.state = u, i.classList.toggle("is-selected", l.id === a.selectedId), i === L && (i.hasAttribute("hidden") || !i.isConnected) && S();
    }
    pt(), se();
    const o = e.filter((i) => !i.hasAttribute("hidden") && R(i)), s = o.find((i) => R(i)?.id === a.selectedId) ?? o[0];
    for (const i of e) i.setAttribute("tabindex", i === s ? "0" : "-1");
    ot();
  }
  function pt() {
    const e = b.querySelector("svg");
    if (!e) return;
    for (const i of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      i.removeAttribute("hidden"), i.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => ee(i)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), s = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const i of [...e.children]) {
      if (!(i instanceof SVGElement) || i.matches("defs, style, title") || i.matches("[data-element-id], [data-ply-id]") && !te(i) || i.contains(t)) continue;
      const c = i;
      if (typeof c.getBBox != "function") continue;
      let l;
      try {
        l = c.getBBox();
      } catch {
        continue;
      }
      Dt(s, l) || (i.setAttribute("hidden", ""), i.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function ut(e) {
    X(), g = e, ne = new Map(e.edges.map((i) => [i.id, i])), O({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    T.hidden = !t, D.hidden = !t, p.hidden = !t, t || Ce(!0, !1), V(), S(), z(), H = void 0, me(e.svg), m.dataset.empty = "false";
    const o = m.querySelector(".ply-empty");
    o && o.remove(), F(), N(), Y(pe());
    const s = tt(e);
    U.textContent = s.text, s.title ? U.title = s.title : U.removeAttribute("title"), k.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => ge(!1));
  }
  function me(e) {
    b.innerHTML = e;
    for (const t of [...b.querySelectorAll("title")]) {
      const o = t.parentElement, s = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), i = t.textContent?.trim();
      s && i && (s.dataset.plyTitle = i, ee(s) || (s.setAttribute("tabindex", "0"), s.setAttribute("role", "img"), s.setAttribute("aria-label", i))), t.remove();
    }
  }
  function X() {
    for (const e of ie) e.cancel();
    ie.clear();
  }
  function qe() {
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
  function mt(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = qe();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const s of b.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const i = s.dataset.elementId ?? s.dataset.plyId, c = i ? e.get(i) : void 0, l = i ? t.get(i) : void 0;
      if (!c || !l || c.width <= 0 || c.height <= 0 || l.width <= 0 || l.height <= 0) continue;
      const y = c.width / l.width, u = c.height / l.height;
      if (![y, u].every(Number.isFinite)) continue;
      let I;
      try {
        if (I = s.animate([
          { transform: `translate(${(c.left - l.left) / o}px, ${(c.top - l.top) / o}px) scale(${y}, ${u})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: jt, easing: "ease-out", composite: "add" }), !(I.effect instanceof KeyframeEffect) || I.effect.composite !== "add") {
          I.cancel();
          continue;
        }
      } catch {
        continue;
      }
      ie.add(I), I.onfinish = I.oncancel = () => ie.delete(I);
    }
  }
  function ht() {
    if (!g) return;
    const e = a.focusedId ? void 0 : yt();
    if (e === H) return;
    const t = e === void 0 ? g.svg : g.folded.find((s) => s.depth === e)?.svg;
    if (!t) {
      H = e;
      return;
    }
    S(), z(), X();
    const o = qe();
    me(t), H = e, o && !a.focusedId && mt(o);
  }
  function yt() {
    if (!g) return;
    const e = $e();
    if (Number.isFinite(e))
      return g.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function He(e) {
    return Object.freeze({
      ...e,
      svg: Ge(e.svg, { prefersDark: G }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Ge(t.svg, { prefersDark: G }) })))
    });
  }
  function he(e, t) {
    try {
      const o = It(e), s = He(o);
      return oe = o, ut(s), delete f.dataset.error, t !== void 0 && r.post({
        channel: "ply-vis",
        version: 1,
        type: "artifact-accepted",
        deliveryId: t
      }), !0;
    } catch (o) {
      const s = o instanceof E || o instanceof Error ? o.message : "Unknown artifact error";
      return k.textContent = `Artifact rejected: ${s}. The previous snapshot is unchanged.`, f.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: s }), !1;
    }
  }
  function Ve(e) {
    if (e === G || !oe) {
      G = e;
      return;
    }
    G = e, g = He(oe), S(), z(), X();
    const t = H === void 0 ? g.svg : g.folded.find((o) => o.depth === H)?.svg ?? g.svg;
    me(t), N(), F(), Y(pe());
  }
  function re(e) {
    const t = g && (ne.get(e) ?? g.elements[e]);
    t && (O({ selectedId: e, detailsHidden: !1 }), V(), N(), Y(t));
  }
  function Re(e) {
    [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => R(o)?.id === e)?.focus();
  }
  function Z(e) {
    e && !g?.elements[e] || (e && !g.elements[e].parentId && (e = void 0), S(), z(), O({ focusedId: e, selectedId: e, detailsHidden: !e }), V(), N(), Y(e ? g?.elements[e] : void 0), ge());
  }
  function gt() {
    const e = m.getBoundingClientRect(), o = (a.selectedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((s) => R(s)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function ye(e, t) {
    S(), z(), X(), t ??= gt(), O(zt(a, Math.min(4, Math.max(0.2, e)), t)), F(), N(), k.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function ge(e = !0) {
    X();
    const t = b.querySelector("svg");
    if (!t) return;
    const o = a.focusedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((y) => ee(y)?.id === a.focusedId) : t;
    if (!o) return;
    e && (k.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
    const s = b.getBoundingClientRect(), i = o.getBoundingClientRect(), c = a.zoom || 1, l = {
      x: (i.left - s.left) / c,
      y: (i.top - s.top) / c,
      width: i.width / c,
      height: i.height / c
    };
    O(Mt({ width: m.clientWidth, height: m.clientHeight }, l)), F(), N();
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => ye(a.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => ye(a.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => ge()), p.addEventListener("click", () => Ce(!a.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    O({ overlays: { ...a.overlays, [t]: e.checked } }), N();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    O({ foldDetail: e.target.checked }), N(), k.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    O({ hoverTooltips: t }), t || (_(), L && document.activeElement !== L && S()), k.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), f.querySelector("[data-show-legend]").addEventListener("change", (e) => {
    const t = e.target.checked;
    O({ legendVisible: t }), se(), k.textContent = t ? "Legend shown" : "Legend hidden";
  }), D.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && Z(t.dataset.focusId || void 0);
  }), b.addEventListener("click", (e) => {
    if (performance.now() < ke) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && re(o.id);
  }), b.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && !("fromId" in o) && Z(o.id);
  }), b.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = Q(e.target);
    t && ze(t, e.clientX, e.clientY);
  }), b.addEventListener("pointermove", (e) => {
    const t = Q(e.target);
    if (h.hidden || S(), !a.hoverTooltips || !t) {
      _();
      return;
    }
    ze(t, e.clientX, e.clientY);
  }), b.addEventListener("pointerout", (e) => {
    const t = Q(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || h.contains(e.relatedTarget)) || t.contains(document.activeElement) || S();
  }), b.addEventListener("focusin", (e) => {
    const t = Q(e.target);
    t && (!a.hoverTooltips && !st(t) || (_(), Me(t)));
  }), b.addEventListener("focusout", (e) => {
    const t = Q(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || S();
  }), h.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && L?.contains(e.relatedTarget) || S();
  }), h.addEventListener("wheel", (e) => {
    if (dt(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    S();
  }, { passive: !0 }), h.addEventListener("pointerdown", (e) => e.stopPropagation()), m.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = m.getBoundingClientRect();
    ye(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    e.button === 0 && (C = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), m.addEventListener("pointermove", (e) => {
    if (!C) return;
    const t = e.clientX - C.x, o = e.clientY - C.y;
    if (!(!C.moved && Math.hypot(t, o) < 3)) {
      if (!C.moved) {
        C.moved = !0, m.classList.add("is-panning"), S(), x.hidden = !0;
        try {
          m.setPointerCapture(C.pointerId);
        } catch {
        }
      }
      e.preventDefault(), O({ panX: C.panX + t, panY: C.panY + o }, !1), F();
    }
  });
  const ve = () => {
    if (!C) return;
    const e = C.moved;
    e && (ke = performance.now() + 250, Ae()), C = void 0, m.classList.remove("is-panning"), e && se();
  };
  m.addEventListener("pointerup", ve), m.addEventListener("pointercancel", ve), m.addEventListener("lostpointercapture", ve), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !h.hidden) {
      e.preventDefault(), S();
      return;
    }
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((c) => !c.hasAttribute("hidden") && te(c)).map((c) => c.dataset.elementId ?? c.dataset.plyId)), s = [...Qe(), ...(g?.edges ?? []).filter((c) => o.has(c.id))];
    if (!s.length) return;
    const i = Math.max(0, s.findIndex((c) => c.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = s[(i + 1) % s.length].id;
      re(c), Re(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = s[(i - 1 + s.length) % s.length].id;
      re(c), Re(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = s[i];
      "fromId" in c ? re(c.id) : Z(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = a.focusedId ? g?.elements[a.focusedId]?.parentId : void 0;
      Z(c);
    }
  });
  function vt(e) {
    g = void 0, oe = void 0, H = void 0, a = { ...a, selectedId: void 0, focusedId: void 0, detailsHidden: !0 }, b.innerHTML = "", se(), S(), z(), m.dataset.empty = "true";
    const t = m.querySelector(".ply-empty");
    if (t) t.textContent = e;
    else {
      const o = document.createElement("p");
      o.className = "ply-empty", o.textContent = e, m.append(o);
    }
    D.hidden = !0, p.hidden = !0, Y(void 0), V(), U.textContent = "", U.removeAttribute("title"), k.textContent = "";
  }
  const Be = (e) => {
    $t(e.data) && (e.data.type === "artifact" ? he(e.data.envelope, e.data.deliveryId) : e.data.type === "capabilities" ? (ce = e.data.explain, J = e.data.installedTool) : e.data.type === "clear" ? vt(e.data.message) : (a = Ke(a, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = a.foldDetail, f.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, f.querySelector("[data-show-legend]").checked = a.legendVisible, le(), g && (V(), F(), N(), Y(pe()))));
  }, Fe = (e) => {
    k.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, Ye = (e) => Fe(e.message || "Unknown runtime error"), _e = (e) => Fe(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", Be), window.addEventListener("error", Ye), window.addEventListener("unhandledrejection", _e);
  const Xe = typeof MutationObserver == "function" ? new MutationObserver(() => Ve(xe())) : void 0;
  Xe?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Ze = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, Pe = () => Ve(xe());
  Ze?.addEventListener("change", Pe), q.addEventListener("click", () => et(!a.optionsHidden)), V(), le();
  for (const e of v) he(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), v.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: he, getState: () => a, destroy: () => {
    _(), X(), window.removeEventListener("message", Be), window.removeEventListener("error", Ye), window.removeEventListener("unhandledrejection", _e), window.removeEventListener("pointerdown", je), Xe?.disconnect(), Ze?.removeEventListener("change", Pe), n.replaceChildren();
  } };
}
const Ft = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Ft as CONTENT_SECURITY_POLICY,
  E as EnvelopeError,
  we as HOST_PROTOCOL_VERSION,
  Vt as PROTOCOL_VERSION,
  Tt as initialViewState,
  $t as isHostResponse,
  Bt as mountViewer,
  It as parseEnvelope,
  Ge as sanitizeSvg,
  Ke as updateViewState,
  Rt as windowHostBridge
};
//# sourceMappingURL=index.js.map
