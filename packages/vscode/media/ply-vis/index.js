const zt = 1;
class I extends Error {
}
const L = (n) => typeof n == "object" && n !== null && !Array.isArray(n), H = (n, r, g = []) => {
  const f = /* @__PURE__ */ new Set([...r, ...g]);
  return r.every((m) => m in n) && Object.keys(n).every((m) => f.has(m));
}, he = (n) => Array.isArray(n) && n.every((r) => typeof r == "string"), mt = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function be(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(be));
  if (L(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([r, g]) => [r, be(g)])));
  throw new I("Evidence contains a non-JSON value");
}
function Ye(n) {
  if (n !== void 0) {
    if (!L(n) || !H(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new I("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new I("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[r]) || n[r] < 0) throw new I("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new I("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function ht(n) {
  if (!L(n) || !H(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new I("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new I(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!L(n.run) || !H(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !L(n.run.root) || !H(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !L(n.run.tool) || !H(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !r.has(n.run.outcome)) throw new I("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new I("Invalid SVG");
  const g = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new I("Invalid folded drawings");
    for (const s of n.folded) {
      if (!L(s) || !H(s, ["depth", "svg"]) || !Number.isInteger(s.depth) || s.depth < 1 || typeof s.svg != "string" || !s.svg.trim()) throw new I("Invalid folded drawing");
      g.push(Object.freeze({ depth: s.depth, svg: s.svg }));
    }
  }
  if (!L(n.elements)) throw new I("Invalid element index");
  const f = /* @__PURE__ */ Object.create(null);
  for (const [s, p] of Object.entries(n.elements)) {
    if (!L(p) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((C) => C in p) || !L(p.evidence)) throw new I(`Invalid element: ${s}`);
    if (p.id !== s || typeof p.id != "string" || !p.id || typeof p.kind != "string" || !p.kind || typeof p.label != "string" || !p.label || typeof p.evidence.verdict != "string" || !he(p.evidence.statuses) || typeof p.evidence.reused != "boolean" || p.evidence.state !== void 0 && !mt.has(p.evidence.state) || !he(p.diagnosticIds) || p.parentId !== void 0 && typeof p.parentId != "string" || p.declaration !== void 0 && typeof p.declaration != "string" || p.limitations !== void 0 && !he(p.limitations)) throw new I(`Invalid element: ${s}`);
    const A = be(p.evidence);
    f[s] = Object.freeze({ id: s, kind: p.kind, label: p.label, evidence: A, diagnosticIds: Object.freeze([...p.diagnosticIds]), ...p.parentId === void 0 ? {} : { parentId: p.parentId }, ...p.declaration === void 0 ? {} : { declaration: p.declaration }, ...p.limitations === void 0 ? {} : { limitations: Object.freeze([...p.limitations]) }, ...p.source === void 0 ? {} : { source: Ye(p.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new I(`Unknown parent: ${s.parentId}`);
  const m = [], b = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new I("Invalid edge list");
    for (const s of n.edges) {
      if (!L(s) || !H(s, ["id", "fromId", "toId", "kind", "label"]) || typeof s.id != "string" || !s.id || s.id in f || b.has(s.id) || typeof s.fromId != "string" || !s.fromId || typeof s.toId != "string" || !s.toId || typeof s.kind != "string" || !s.kind || typeof s.label != "string" || !s.label) throw new I("Invalid edge");
      if (!f[s.fromId] || !f[s.toId]) throw new I("Unknown edge endpoint");
      b.add(s.id), m.push(Object.freeze({ id: s.id, fromId: s.fromId, toId: s.toId, kind: s.kind, label: s.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new I("Invalid diagnostics");
  const h = [], w = /* @__PURE__ */ new Set();
  for (const s of n.diagnostics) {
    if (!L(s) || typeof s.id != "string" || !s.id || w.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new I("Invalid diagnostic");
    w.add(s.id), h.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: Ye(s.source) } }));
  }
  for (const s of Object.values(f)) for (const p of s.diagnosticIds ?? []) if (!w.has(p)) throw new I(`Unknown diagnostic: ${p}`);
  for (const s of h) if (s.elementId && !f[s.elementId]) throw new I(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), edges: Object.freeze(m), diagnostics: Object.freeze(h), folded: Object.freeze(g) });
}
const yt = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), gt = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), vt = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, _e = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, bt = {
  fill: _e,
  stroke: _e,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, wt = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function It(n) {
  let r = n, g = "";
  for (; ; ) {
    const f = r.search(/@media\b/i);
    if (f < 0) return { base: r, darkBody: g };
    const m = r.indexOf("{", f);
    if (m < 0) return { base: r.slice(0, f), darkBody: g };
    const b = r.slice(f, m).trim();
    let h = 0, w = m;
    for (; w < r.length; w += 1)
      if (r[w] === "{") h += 1;
      else if (r[w] === "}" && --h === 0) break;
    wt.test(b) && (g += `${r.slice(m + 1, w)}
`), r = r.slice(0, f) + r.slice(Math.min(w + 1, r.length));
  }
}
function xt(n, r) {
  if (!n.trim() || n.length > 32768) return;
  const { base: g, darkBody: f } = It(n), m = r ? `${g}
${f}` : g, b = /\s*([^{}]+)\{([^{}]*)\}/gy, h = [];
  let w = 0;
  for (; w < m.length; ) {
    b.lastIndex = w;
    const s = b.exec(m);
    if (!s) return m.slice(w).trim() === "" ? h : void 0;
    w = b.lastIndex;
    const p = s[1], A = s[2];
    if (p === void 0 || A === void 0) return;
    const C = p.split(",").map(($) => $.trim());
    if (!C.every(($) => vt.test($))) return;
    const Z = [];
    for (const $ of A.split(";")) {
      const z = $.indexOf(":");
      if (z < 1) continue;
      const D = $.slice(0, z).trim().toLowerCase(), R = $.slice(z + 1).trim();
      bt[D]?.test(R) === !0 && Z.push([D, R]);
    }
    Z.length && h.push({ selectors: C, declarations: Z });
  }
  return h;
}
function Xe(n, r = {}) {
  const g = r.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const m of [...f.querySelectorAll("*")]) {
    if (m.localName.toLowerCase() === "style") {
      const b = xt(m.textContent ?? "", g);
      if (b) for (const h of b) for (const w of h.selectors)
        for (const s of [...f.documentElement.querySelectorAll(w)])
          for (const [p, A] of h.declarations) s.setAttribute(p, A);
      m.remove();
      continue;
    }
    if (yt.has(m.localName.toLowerCase())) {
      m.remove();
      continue;
    }
    for (const b of [...m.attributes]) {
      const h = b.name.toLowerCase(), w = b.value.trim().toLowerCase(), s = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(w);
      (h.startsWith("on") || h === "style" || s || gt.has(h) && w !== "" && !w.startsWith("#")) && m.removeAttribute(b.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const ye = 1, Dt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function Et(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n, g = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof g == "object" && g !== null && typeof g.earned == "boolean" && typeof g.gap == "boolean" && typeof g.violation == "boolean" && (r.detailsHidden === void 0 || typeof r.detailsHidden == "boolean") && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string") && (r.hoverTooltips === void 0 || typeof r.hoverTooltips == "boolean");
}
function St(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r || r.type === "restore-state" && Et(r.state) || r.type === "capabilities" && typeof r.explain == "boolean");
}
const kt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, optionsHidden: !1, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Ze = (n, r) => Object.freeze({ ...n, ...r, overlays: Object.freeze({ ...n.overlays, ...r.overlays }) });
function At(n, r, g = 0.5) {
  return r.x >= n.x - g && r.y >= n.y - g && r.x + r.width <= n.x + n.width + g && r.y + r.height <= n.y + n.height + g;
}
function Ct(n, r, g = {}) {
  const f = g.margin ?? 24, m = g.minZoom ?? 0.2, b = g.maxZoom ?? 4, h = Math.max(1, n.width - f * 2), w = Math.max(1, n.height - f * 2), s = Math.max(1, r.width), p = Math.max(1, r.height), A = Math.min(b, Math.max(m, Math.min(h / s, w / p)));
  return {
    zoom: A,
    panX: n.width / 2 - (r.x + s / 2) * A,
    panY: n.height / 2 - (r.y + p / 2) * A
  };
}
function Lt(n, r, g) {
  return {
    zoom: r,
    panX: g.x - (g.x - n.panX) / n.zoom * r,
    panY: g.y - (g.y - n.panY) / n.zoom * r
  };
}
const Ot = 500, $t = 160, Pe = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), Tt = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function ge() {
  const n = typeof document < "u" ? document.body : void 0, r = n?.dataset.vscodeThemeKind;
  if (r !== void 0) return Pe.has(r);
  if (n) {
    for (const g of Pe) if (n.classList.contains(g)) return !0;
    for (const g of Tt) if (n.classList.contains(g)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const ve = (n, r) => `<button type="button" aria-label="${n}" title="${n}">${r}</button>`, Mt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${ve("Zoom out", "−")}${ve("Zoom in", "+")}${ve("Fit canvas", "Fit")}
      </div>
      <button type="button" class="ply-options-toggle" aria-controls="ply-vis-options" aria-expanded="true" aria-label="Hide options" title="Hide options">⋯</button>
      <div class="ply-options" id="ply-vis-options">
      <fieldset><legend>Detail</legend>
        <label><input type="checkbox" data-fold-detail checked> Fold detail when zoomed out</label>
        <label><input type="checkbox" data-hover-tooltips checked> Show tooltips on hover</label>
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
        <div class="ply-tooltip" id="ply-vis-tooltip" role="tooltip" hidden></div>
        <ul class="ply-context-menu" id="ply-vis-context-menu" role="menu" aria-label="Item options" hidden></ul>
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <button type="button" class="ply-inspector-toggle" aria-label="Show details" title="Show details" aria-controls="ply-inspector" aria-expanded="false">‹</button>
      <aside class="ply-inspector" id="ply-inspector" aria-label="Item details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function Nt(n, r, g = []) {
  n.innerHTML = Mt;
  const f = n.querySelector(".ply-vis"), m = f.querySelector(".ply-canvas"), b = f.querySelector(".ply-stage"), h = f.querySelector(".ply-tooltip"), w = f.querySelector(".ply-context-menu"), s = f.querySelector(".ply-inspector"), p = f.querySelector(".ply-inspector-toggle"), A = f.querySelector(".ply-workspace"), C = f.querySelector(".ply-status"), Z = f.querySelector(".ply-toolbar [data-evidence-filters]"), $ = f.querySelector(".ply-options"), z = f.querySelector(".ply-options-toggle"), D = f.querySelector(".ply-breadcrumbs"), R = f.querySelector(".ply-provenance");
  let a = kt(), y, Q = /* @__PURE__ */ new Map(), ne, P = ge(), V;
  const ee = /* @__PURE__ */ new Set();
  let k, we = 0, S, W, oe, ie = !1;
  const Ie = () => r.post({ channel: "ply-vis", version: ye, type: "persist-state", state: a }), O = (e, t = !0) => {
    a = Ze(a, e), t && Ie();
  }, B = () => {
    b.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, We = () => y ? Object.values(y.elements).filter((e) => !a.focusedId || e.id === a.focusedId || re(e, a.focusedId, y.elements)) : [];
  function F() {
    s.hidden = a.detailsHidden, A.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    p.setAttribute("aria-label", e), p.title = e, p.setAttribute("aria-expanded", String(!a.detailsHidden)), p.textContent = a.detailsHidden ? "‹" : "›";
  }
  function se() {
    $.hidden = a.optionsHidden;
    const e = a.optionsHidden ? "Show options" : "Hide options";
    z.setAttribute("aria-label", e), z.title = e, z.setAttribute("aria-expanded", String(!a.optionsHidden));
  }
  function Ue(e, t = !0) {
    O({ optionsHidden: e }, t), se();
  }
  function xe(e, t = !0) {
    O({ detailsHidden: e }, t), F();
  }
  function Ee(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  function Ge(e) {
    return e.run.tool.version === "render" || Object.values(e.elements).every((o) => Ee(o) === "declared") ? { text: "Promises only — no run has checked this yet, so nothing here can ever be green." } : { text: `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, title: `Run ${e.run.id}` };
  }
  function re(e, t, o) {
    let d = e.parentId;
    for (; d; ) {
      if (d === t) return !0;
      d = o[d]?.parentId;
    }
    return !1;
  }
  function Ke(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== a.focusedId; )
      o = y?.elements[o.parentId], t += 1;
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const Se = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function Je() {
    if (D.replaceChildren(), !y) return;
    const e = [];
    let t = a.focusedId ? y.elements[a.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = y.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", D.append(o);
    for (const d of e) {
      const i = document.createElement("button");
      i.type = "button", i.textContent = d.label, i.dataset.focusId = d.id, D.append(i);
    }
  }
  function U(e) {
    s.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", s.append(t), !e || !y) {
      const u = document.createElement("p");
      u.textContent = "Select an item to inspect its declaration and evidence.", s.append(u);
      return;
    }
    if ("fromId" in e) {
      s.append(T("Type", [e.kind])), s.append(T("From", [y.elements[e.fromId].label])), s.append(T("To", [y.elements[e.toId].label]));
      return;
    }
    const o = e, d = o.declaration?.split(`
`).filter(Boolean);
    s.append(T("Declaration", d?.length ? d : ["No declaration text supplied."])), s.append(T("Verdict", [o.evidence.verdict])), s.append(T("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const i = Object.entries(o.evidence).filter(([u]) => !["verdict", "statuses"].includes(u)).map(([u, x]) => `${u}: ${typeof x == "string" ? x : JSON.stringify(x)}`);
    s.append(T("Earned evidence", i.length ? i : ["No additional evidence details supplied."])), s.append(T("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const c = new Map(y.diagnostics.map((u) => [u.id, u])), v = o.diagnosticIds.map((u) => c.get(u)).filter((u) => u !== void 0).map((u) => `${u.code} — ${u.severity}: ${u.message}`);
    if (s.append(T("Diagnostics", v.length ? v : ["No diagnostics supplied."])), s.append(Qe(y.run)), o.source) {
      const u = document.createElement("button");
      u.type = "button", u.className = "ply-source", u.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, u.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), s.append(u);
    }
  }
  function T(e, t) {
    const o = document.createElement("section"), d = document.createElement("h3");
    d.textContent = e, o.append(d);
    const i = document.createElement("ul");
    for (const c of t) {
      const l = document.createElement("li");
      l.textContent = c, i.append(l);
    }
    return o.append(i), o;
  }
  function Qe(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), d = document.createElement("h3");
    d.textContent = "Run details";
    const i = document.createElement("dl"), c = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [l, v] of c) {
      const u = document.createElement("dt");
      u.textContent = l;
      const x = document.createElement("dd");
      x.textContent = v, i.append(u, x);
    }
    return o.append(d, i), o;
  }
  function G(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function et(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function K(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? y?.elements[t] : void 0;
  }
  function J(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? Q.get(t) : void 0;
  }
  function j(e) {
    return J(e) ?? K(e);
  }
  function de() {
    if (!(!y || !a.selectedId))
      return Q.get(a.selectedId) ?? y.elements[a.selectedId];
  }
  function ke(e) {
    return y ? `${e.kind}: ${e.label}; from ${y.elements[e.fromId].label} to ${y.elements[e.toId].label}` : e.label;
  }
  function tt(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(h.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function Ae(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== h.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function nt(e) {
    return h.scrollHeight <= h.clientHeight ? !1 : e > 0 ? h.scrollTop + h.clientHeight < h.scrollHeight : e < 0 ? h.scrollTop > 0 : !1;
  }
  function q() {
    W !== void 0 && window.clearTimeout(W), W = void 0;
  }
  function E() {
    S && Ae(S), q(), S = void 0, h.hidden = !0, h.replaceChildren();
  }
  function ot(e, t) {
    if (!y) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const d = Object.entries(e.evidence).filter(([l, v]) => !["verdict", "statuses"].includes(l) && v !== !1 && v !== void 0).map(([l, v]) => `${l}: ${typeof v == "string" ? v : JSON.stringify(v)}`);
    o.push(...d), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const i = new Map(y.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const v = i.get(l);
      v && o.push(`${v.code} — ${v.severity}: ${v.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const c = t.dataset.plyTitle?.trim();
    return c && c !== e.label && !o.includes(c) && o.push(c), o;
  }
  function Ce(e, t) {
    const o = m.getBoundingClientRect(), d = 8;
    h.style.maxHeight = `${Math.max(0, o.height - d * 2)}px`;
    const i = 12, c = h.offsetWidth, l = h.offsetHeight, v = Math.max(d, o.width - c - d), u = Math.max(d, o.height - l - d), x = e - o.left + i, X = t - o.top + i, me = X + l <= o.height - d ? X : t - o.top - l - i;
    h.style.left = `${Math.min(v, Math.max(d, x))}px`, h.style.top = `${Math.min(u, Math.max(d, me))}px`;
  }
  function Le(e, t, o) {
    const d = K(e), i = J(e), c = e.dataset.plyTitle?.trim();
    if (!d && !i && !c || e.hasAttribute("hidden")) {
      E();
      return;
    }
    S && S !== e && Ae(S), S = e;
    const l = document.createElement("span");
    if (i) {
      const u = document.createElement("strong");
      u.textContent = i.label, l.textContent = ke(i), h.replaceChildren(u, l);
    } else if (d) {
      const u = document.createElement("strong");
      u.textContent = d.label, l.textContent = ot(d, e).join(`
`), h.replaceChildren(u, l);
    } else
      l.textContent = c, h.replaceChildren(l);
    h.hidden = !1, tt(e);
    const v = e.getBoundingClientRect();
    Ce(t ?? v.left + v.width / 2, o ?? v.bottom);
  }
  function Oe(e, t, o) {
    q(), S && S !== e && E(), W = window.setTimeout(() => {
      W = void 0, Le(e, t, o);
    }, Ot);
  }
  function it(e, t, o) {
    const d = m.getBoundingClientRect(), i = 8, c = Math.max(i, d.width - e.offsetWidth - i), l = Math.max(i, d.height - e.offsetHeight - i);
    e.style.left = `${Math.min(c, Math.max(i, t - d.left))}px`, e.style.top = `${Math.min(l, Math.max(i, o - d.top))}px`;
  }
  function N() {
    if (w.hidden) return;
    const e = w.contains(document.activeElement), t = oe;
    w.hidden = !0, w.replaceChildren(), oe = void 0, e && (t?.isConnected ? t : m).focus();
  }
  function $e() {
    return [...w.querySelectorAll('button[role="menuitem"]')];
  }
  function ae(e) {
    const t = $e();
    if (!t.length) return;
    for (const d of t) d.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function st(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? j(t) : void 0, d = o && !("fromId" in o) ? o : void 0, i = [];
    if (d && i.push({ label: `Zoom into ${d.label}`, run: () => _(d.id) }), a.focusedId && i.push({ label: "Back to Workspace", run: () => _(void 0) }), y) {
      const l = new Map(y.diagnostics.map((v) => [v.id, v]));
      for (const v of ie ? d?.diagnosticIds ?? [] : []) {
        const u = l.get(v)?.code;
        u && i.push({ label: `Explain ${u}`, run: () => r.post({ channel: "ply-vis", version: ye, type: "explain", code: u }) });
      }
    }
    if (t && ie && i.push({ label: "Explain a code…", run: () => r.post({ channel: "ply-vis", version: ye, type: "explain-prompt" }) }), !i.length) return;
    e.preventDefault(), E();
    const c = document.activeElement;
    oe = c instanceof HTMLElement || c instanceof SVGElement ? c : void 0, w.replaceChildren();
    for (const l of i) {
      const v = document.createElement("li");
      v.setAttribute("role", "presentation");
      const u = document.createElement("button");
      u.type = "button", u.setAttribute("role", "menuitem"), u.textContent = l.label, u.tabIndex = -1, u.addEventListener("click", () => {
        N(), l.run();
      }), v.append(u), w.append(v);
    }
    w.hidden = !1, it(w, e.clientX, e.clientY), ae(0);
  }
  w.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), N();
      return;
    }
    const o = $e().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), ae(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), ae(o - 1));
  }), m.addEventListener("contextmenu", st);
  const Te = (e) => {
    !w.hidden && e.target instanceof Node && !w.contains(e.target) && N();
  };
  window.addEventListener("pointerdown", Te);
  function M() {
    if (!y) return;
    ct();
    const e = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? y.elements[a.focusedId] : void 0;
    for (const i of e) {
      const c = i.dataset.elementId ?? i.dataset.plyId ?? "", l = y.elements[c], v = J(i);
      if (v) {
        i.removeAttribute("hidden"), i.setAttribute("role", "button"), i.setAttribute("aria-label", ke(v)), i.classList.toggle("is-selected", v.id === a.selectedId);
        continue;
      }
      if (!l) {
        i.removeAttribute("hidden");
        continue;
      }
      const u = Ee(l), x = u === "declared" || a.overlays[u], X = t ? re(t, l.id, y.elements) : !1, me = !a.focusedId || l.id === a.focusedId || re(l, a.focusedId, y.elements) || X, pt = X || Ke(l) <= Se();
      i.toggleAttribute("hidden", !me || !pt || !x && !X);
      const ut = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${l.kind}: ${l.label}; ${ut}`), i.dataset.state = u, i.classList.toggle("is-selected", l.id === a.selectedId), i === S && (i.hasAttribute("hidden") || !i.isConnected) && E();
    }
    rt();
    const o = e.filter((i) => !i.hasAttribute("hidden") && j(i)), d = o.find((i) => j(i)?.id === a.selectedId) ?? o[0];
    for (const i of e) i.setAttribute("tabindex", i === d ? "0" : "-1");
    Je();
  }
  function rt() {
    const e = b.querySelector("svg");
    if (!e) return;
    for (const i of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      i.removeAttribute("hidden"), i.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => K(i)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), d = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const i of [...e.children]) {
      if (!(i instanceof SVGElement) || i.matches("defs, style, title") || i.matches("[data-element-id], [data-ply-id]") && !J(i) || i.contains(t)) continue;
      const c = i;
      if (typeof c.getBBox != "function") continue;
      let l;
      try {
        l = c.getBBox();
      } catch {
        continue;
      }
      At(d, l) || (i.setAttribute("hidden", ""), i.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function dt(e) {
    Y(), y = e, Q = new Map(e.edges.map((i) => [i.id, i])), O({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    Z.hidden = !t, D.hidden = !t, p.hidden = !t, t || xe(!0, !1), F(), E(), N(), V = void 0, ce(e.svg), m.dataset.empty = "false";
    const o = m.querySelector(".ply-empty");
    o && o.remove(), B(), M(), U(de());
    const d = Ge(e);
    R.textContent = d.text, d.title ? R.title = d.title : R.removeAttribute("title"), C.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => pe(!1));
  }
  function ce(e) {
    b.innerHTML = e;
    for (const t of [...b.querySelectorAll("title")]) {
      const o = t.parentElement, d = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), i = t.textContent?.trim();
      d && i && (d.dataset.plyTitle = i, K(d) || (d.setAttribute("tabindex", "0"), d.setAttribute("role", "img"), d.setAttribute("aria-label", i))), t.remove();
    }
  }
  function Y() {
    for (const e of ee) e.cancel();
    ee.clear();
  }
  function Me() {
    const e = /* @__PURE__ */ new Map();
    for (const t of b.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const o = t.dataset.elementId ?? t.dataset.plyId;
      if (!o || e.has(o) || typeof t.getBoundingClientRect != "function") continue;
      let d;
      try {
        d = t.getBoundingClientRect();
      } catch {
        return;
      }
      if (![d.left, d.top, d.width, d.height].every(Number.isFinite)) return;
      e.set(o, d);
    }
    return e;
  }
  function at(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = Me();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const d of b.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const i = d.dataset.elementId ?? d.dataset.plyId, c = i ? e.get(i) : void 0, l = i ? t.get(i) : void 0;
      if (!c || !l || c.width <= 0 || c.height <= 0 || l.width <= 0 || l.height <= 0) continue;
      const v = c.width / l.width, u = c.height / l.height;
      if (![v, u].every(Number.isFinite)) continue;
      let x;
      try {
        if (x = d.animate([
          { transform: `translate(${(c.left - l.left) / o}px, ${(c.top - l.top) / o}px) scale(${v}, ${u})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: $t, easing: "ease-out", composite: "add" }), !(x.effect instanceof KeyframeEffect) || x.effect.composite !== "add") {
          x.cancel();
          continue;
        }
      } catch {
        continue;
      }
      ee.add(x), x.onfinish = x.oncancel = () => ee.delete(x);
    }
  }
  function ct() {
    if (!y) return;
    const e = a.focusedId ? void 0 : lt();
    if (e === V) return;
    const t = e === void 0 ? y.svg : y.folded.find((d) => d.depth === e)?.svg;
    if (!t) {
      V = e;
      return;
    }
    E(), N(), Y();
    const o = Me();
    ce(t), V = e, o && !a.focusedId && at(o);
  }
  function lt() {
    if (!y) return;
    const e = Se();
    if (Number.isFinite(e))
      return y.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function ze(e) {
    return Object.freeze({
      ...e,
      svg: Xe(e.svg, { prefersDark: P }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Xe(t.svg, { prefersDark: P }) })))
    });
  }
  function le(e) {
    try {
      const t = ht(e);
      return ne = t, dt(ze(t)), delete f.dataset.error, !0;
    } catch (t) {
      const o = t instanceof I || t instanceof Error ? t.message : "Unknown artifact error";
      return C.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, f.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function De(e) {
    if (e === P || !ne) {
      P = e;
      return;
    }
    P = e, y = ze(ne), E(), N(), Y();
    const t = V === void 0 ? y.svg : y.folded.find((o) => o.depth === V)?.svg ?? y.svg;
    ce(t), M(), B(), U(de());
  }
  function te(e) {
    const t = y && (Q.get(e) ?? y.elements[e]);
    t && (O({ selectedId: e, detailsHidden: !1 }), F(), M(), U(t));
  }
  function Ne(e) {
    [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => j(o)?.id === e)?.focus();
  }
  function _(e) {
    e && !y?.elements[e] || (e && !y.elements[e].parentId && (e = void 0), E(), N(), O({ focusedId: e, selectedId: e, detailsHidden: !e }), F(), M(), U(e ? y?.elements[e] : void 0), pe());
  }
  function ft() {
    const e = m.getBoundingClientRect(), o = (a.selectedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => j(d)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function fe(e, t) {
    E(), N(), Y(), t ??= ft(), O(Lt(a, Math.min(4, Math.max(0.2, e)), t)), B(), M(), C.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function pe(e = !0) {
    Y();
    const t = b.querySelector("svg");
    if (!t) return;
    const o = a.focusedId ? [...b.querySelectorAll("[data-element-id], [data-ply-id]")].find((v) => K(v)?.id === a.focusedId) : t;
    if (!o) return;
    e && (C.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
    const d = b.getBoundingClientRect(), i = o.getBoundingClientRect(), c = a.zoom || 1, l = {
      x: (i.left - d.left) / c,
      y: (i.top - d.top) / c,
      width: i.width / c,
      height: i.height / c
    };
    O(Ct({ width: m.clientWidth, height: m.clientHeight }, l)), B(), M();
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => fe(a.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => fe(a.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => pe()), p.addEventListener("click", () => xe(!a.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    O({ overlays: { ...a.overlays, [t]: e.checked } }), M();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    O({ foldDetail: e.target.checked }), M(), C.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    O({ hoverTooltips: t }), t || (q(), S && document.activeElement !== S && E()), C.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), D.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && _(t.dataset.focusId || void 0);
  }), b.addEventListener("click", (e) => {
    if (performance.now() < we) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && j(t);
    o && te(o.id);
  }), b.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && j(t);
    o && !("fromId" in o) && _(o.id);
  }), b.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = G(e.target);
    t && Oe(t, e.clientX, e.clientY);
  }), b.addEventListener("pointermove", (e) => {
    if (!a.hoverTooltips) {
      q();
      return;
    }
    const t = G(e.target);
    if (!t) {
      q();
      return;
    }
    t === S && !h.hidden ? Ce(e.clientX, e.clientY) : Oe(t, e.clientX, e.clientY);
  }), b.addEventListener("pointerout", (e) => {
    const t = G(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || h.contains(e.relatedTarget)) || t.contains(document.activeElement) || E();
  }), b.addEventListener("focusin", (e) => {
    const t = G(e.target);
    t && (!a.hoverTooltips && !et(t) || (q(), Le(t)));
  }), b.addEventListener("focusout", (e) => {
    const t = G(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || E();
  }), h.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && S?.contains(e.relatedTarget) || E();
  }), h.addEventListener("wheel", (e) => {
    if (nt(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    E();
  }, { passive: !0 }), h.addEventListener("pointerdown", (e) => e.stopPropagation()), m.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = m.getBoundingClientRect();
    fe(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    e.button === 0 && (k = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), m.addEventListener("pointermove", (e) => {
    if (!k) return;
    const t = e.clientX - k.x, o = e.clientY - k.y;
    if (!(!k.moved && Math.hypot(t, o) < 3)) {
      if (!k.moved) {
        k.moved = !0, m.classList.add("is-panning");
        try {
          m.setPointerCapture(k.pointerId);
        } catch {
        }
      }
      e.preventDefault(), O({ panX: k.panX + t, panY: k.panY + o }, !1), B();
    }
  });
  const ue = () => {
    k && (k.moved && (we = performance.now() + 250, Ie()), k = void 0, m.classList.remove("is-panning"));
  };
  m.addEventListener("pointerup", ue), m.addEventListener("pointercancel", ue), m.addEventListener("lostpointercapture", ue), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !h.hidden) {
      e.preventDefault(), E();
      return;
    }
    const t = [...b.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((c) => !c.hasAttribute("hidden") && J(c)).map((c) => c.dataset.elementId ?? c.dataset.plyId)), d = [...We(), ...(y?.edges ?? []).filter((c) => o.has(c.id))];
    if (!d.length) return;
    const i = Math.max(0, d.findIndex((c) => c.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = d[(i + 1) % d.length].id;
      te(c), Ne(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = d[(i - 1 + d.length) % d.length].id;
      te(c), Ne(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = d[i];
      "fromId" in c ? te(c.id) : _(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = a.focusedId ? y?.elements[a.focusedId]?.parentId : void 0;
      _(c);
    }
  });
  const je = (e) => {
    St(e.data) && (e.data.type === "artifact" ? le(e.data.envelope) : e.data.type === "capabilities" ? ie = e.data.explain : (a = Ze(a, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = a.foldDetail, f.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, se(), y && (F(), B(), M(), U(de()))));
  }, qe = (e) => {
    C.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, He = (e) => qe(e.message || "Unknown runtime error"), Re = (e) => qe(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", je), window.addEventListener("error", He), window.addEventListener("unhandledrejection", Re);
  const Ve = typeof MutationObserver == "function" ? new MutationObserver(() => De(ge())) : void 0;
  Ve?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Be = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, Fe = () => De(ge());
  Be?.addEventListener("change", Fe), z.addEventListener("click", () => Ue(!a.optionsHidden)), F(), se();
  for (const e of g) le(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), g.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: le, getState: () => a, destroy: () => {
    q(), Y(), window.removeEventListener("message", je), window.removeEventListener("error", He), window.removeEventListener("unhandledrejection", Re), window.removeEventListener("pointerdown", Te), Ve?.disconnect(), Be?.removeEventListener("change", Fe), n.replaceChildren();
  } };
}
const jt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  jt as CONTENT_SECURITY_POLICY,
  I as EnvelopeError,
  ye as HOST_PROTOCOL_VERSION,
  zt as PROTOCOL_VERSION,
  kt as initialViewState,
  St as isHostResponse,
  Nt as mountViewer,
  ht as parseEnvelope,
  Xe as sanitizeSvg,
  Ze as updateViewState,
  Dt as windowHostBridge
};
//# sourceMappingURL=index.js.map
