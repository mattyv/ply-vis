const Lt = 1;
class I extends Error {
}
const O = (n) => typeof n == "object" && n !== null && !Array.isArray(n), q = (n, r, g = []) => {
  const p = /* @__PURE__ */ new Set([...r, ...g]);
  return r.every((m) => m in n) && Object.keys(n).every((m) => p.has(m));
}, fe = (n) => Array.isArray(n) && n.every((r) => typeof r == "string"), at = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function me(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(me));
  if (O(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([r, g]) => [r, me(g)])));
  throw new I("Evidence contains a non-JSON value");
}
function Re(n) {
  if (n !== void 0) {
    if (!O(n) || !q(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new I("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new I("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[r]) || n[r] < 0) throw new I("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new I("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function ct(n) {
  if (!O(n) || !q(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new I("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new I(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!O(n.run) || !q(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !O(n.run.root) || !q(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !O(n.run.tool) || !q(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !r.has(n.run.outcome)) throw new I("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new I("Invalid SVG");
  const g = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new I("Invalid folded drawings");
    for (const i of n.folded) {
      if (!O(i) || !q(i, ["depth", "svg"]) || !Number.isInteger(i.depth) || i.depth < 1 || typeof i.svg != "string" || !i.svg.trim()) throw new I("Invalid folded drawing");
      g.push(Object.freeze({ depth: i.depth, svg: i.svg }));
    }
  }
  if (!O(n.elements)) throw new I("Invalid element index");
  const p = /* @__PURE__ */ Object.create(null);
  for (const [i, u] of Object.entries(n.elements)) {
    if (!O(u) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((L) => L in u) || !O(u.evidence)) throw new I(`Invalid element: ${i}`);
    if (u.id !== i || typeof u.id != "string" || !u.id || typeof u.kind != "string" || !u.kind || typeof u.label != "string" || !u.label || typeof u.evidence.verdict != "string" || !fe(u.evidence.statuses) || typeof u.evidence.reused != "boolean" || u.evidence.state !== void 0 && !at.has(u.evidence.state) || !fe(u.diagnosticIds) || u.parentId !== void 0 && typeof u.parentId != "string" || u.declaration !== void 0 && typeof u.declaration != "string" || u.limitations !== void 0 && !fe(u.limitations)) throw new I(`Invalid element: ${i}`);
    const C = me(u.evidence);
    p[i] = Object.freeze({ id: i, kind: u.kind, label: u.label, evidence: C, diagnosticIds: Object.freeze([...u.diagnosticIds]), ...u.parentId === void 0 ? {} : { parentId: u.parentId }, ...u.declaration === void 0 ? {} : { declaration: u.declaration }, ...u.limitations === void 0 ? {} : { limitations: Object.freeze([...u.limitations]) }, ...u.source === void 0 ? {} : { source: Re(u.source) } });
  }
  for (const i of Object.values(p)) if (i.parentId && !p[i.parentId]) throw new I(`Unknown parent: ${i.parentId}`);
  const m = [], v = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new I("Invalid edge list");
    for (const i of n.edges) {
      if (!O(i) || !q(i, ["id", "fromId", "toId", "kind", "label"]) || typeof i.id != "string" || !i.id || i.id in p || v.has(i.id) || typeof i.fromId != "string" || !i.fromId || typeof i.toId != "string" || !i.toId || typeof i.kind != "string" || !i.kind || typeof i.label != "string" || !i.label) throw new I("Invalid edge");
      if (!p[i.fromId] || !p[i.toId]) throw new I("Unknown edge endpoint");
      v.add(i.id), m.push(Object.freeze({ id: i.id, fromId: i.fromId, toId: i.toId, kind: i.kind, label: i.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new I("Invalid diagnostics");
  const y = [], b = /* @__PURE__ */ new Set();
  for (const i of n.diagnostics) {
    if (!O(i) || typeof i.id != "string" || !i.id || b.has(i.id) || typeof i.code != "string" || !i.code || typeof i.severity != "string" || !i.severity || typeof i.message != "string" || !i.message || i.elementId !== void 0 && typeof i.elementId != "string") throw new I("Invalid diagnostic");
    b.add(i.id), y.push(Object.freeze({ id: i.id, code: i.code, severity: i.severity, message: i.message, ...i.elementId === void 0 ? {} : { elementId: i.elementId }, ...i.source === void 0 ? {} : { source: Re(i.source) } }));
  }
  for (const i of Object.values(p)) for (const u of i.diagnosticIds ?? []) if (!b.has(u)) throw new I(`Unknown diagnostic: ${u}`);
  for (const i of y) if (i.elementId && !p[i.elementId]) throw new I(`Unknown diagnostic element: ${i.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(p), edges: Object.freeze(m), diagnostics: Object.freeze(y), folded: Object.freeze(g) });
}
const lt = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), ft = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), ut = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ve = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, pt = {
  fill: Ve,
  stroke: Ve,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, mt = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function ht(n) {
  let r = n, g = "";
  for (; ; ) {
    const p = r.search(/@media\b/i);
    if (p < 0) return { base: r, darkBody: g };
    const m = r.indexOf("{", p);
    if (m < 0) return { base: r.slice(0, p), darkBody: g };
    const v = r.slice(p, m).trim();
    let y = 0, b = m;
    for (; b < r.length; b += 1)
      if (r[b] === "{") y += 1;
      else if (r[b] === "}" && --y === 0) break;
    mt.test(v) && (g += `${r.slice(m + 1, b)}
`), r = r.slice(0, p) + r.slice(Math.min(b + 1, r.length));
  }
}
function yt(n, r) {
  if (!n.trim() || n.length > 32768) return;
  const { base: g, darkBody: p } = ht(n), m = r ? `${g}
${p}` : g, v = /\s*([^{}]+)\{([^{}]*)\}/gy, y = [];
  let b = 0;
  for (; b < m.length; ) {
    v.lastIndex = b;
    const i = v.exec(m);
    if (!i) return m.slice(b).trim() === "" ? y : void 0;
    b = v.lastIndex;
    const u = i[1], C = i[2];
    if (u === void 0 || C === void 0) return;
    const L = u.split(",").map((k) => k.trim());
    if (!L.every((k) => ut.test(k))) return;
    const _ = [];
    for (const k of C.split(";")) {
      const D = k.indexOf(":");
      if (D < 1) continue;
      const a = k.slice(0, D).trim().toLowerCase(), h = k.slice(D + 1).trim();
      pt[a]?.test(h) === !0 && _.push([a, h]);
    }
    _.length && y.push({ selectors: L, declarations: _ });
  }
  return y;
}
function Be(n, r = {}) {
  const g = r.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const p = new DOMParser().parseFromString(n, "image/svg+xml");
  if (p.querySelector("parsererror") || p.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const m of [...p.querySelectorAll("*")]) {
    if (m.localName.toLowerCase() === "style") {
      const v = yt(m.textContent ?? "", g);
      if (v) for (const y of v) for (const b of y.selectors)
        for (const i of [...p.documentElement.querySelectorAll(b)])
          for (const [u, C] of y.declarations) i.setAttribute(u, C);
      m.remove();
      continue;
    }
    if (lt.has(m.localName.toLowerCase())) {
      m.remove();
      continue;
    }
    for (const v of [...m.attributes]) {
      const y = v.name.toLowerCase(), b = v.value.trim().toLowerCase(), i = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(b);
      (y.startsWith("on") || y === "style" || i || ft.has(y) && b !== "" && !b.startsWith("#")) && m.removeAttribute(v.name);
    }
  }
  return new XMLSerializer().serializeToString(p.documentElement);
}
const gt = 1, Ot = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function vt(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n, g = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof g == "object" && g !== null && typeof g.earned == "boolean" && typeof g.gap == "boolean" && typeof g.violation == "boolean" && (r.detailsHidden === void 0 || typeof r.detailsHidden == "boolean") && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string") && (r.hoverTooltips === void 0 || typeof r.hoverTooltips == "boolean");
}
function bt(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r || r.type === "restore-state" && vt(r.state));
}
const wt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Fe = (n, r) => Object.freeze({ ...n, ...r, overlays: Object.freeze({ ...n.overlays, ...r.overlays }) });
function It(n, r, g = 0.5) {
  return r.x >= n.x - g && r.y >= n.y - g && r.x + r.width <= n.x + n.width + g && r.y + r.height <= n.y + n.height + g;
}
function xt(n, r, g = {}) {
  const p = g.margin ?? 24, m = g.minZoom ?? 0.2, v = g.maxZoom ?? 4, y = Math.max(1, n.width - p * 2), b = Math.max(1, n.height - p * 2), i = Math.max(1, r.width), u = Math.max(1, r.height), C = Math.min(v, Math.max(m, Math.min(y / i, b / u)));
  return {
    zoom: C,
    panX: n.width / 2 - (r.x + i / 2) * C,
    panY: n.height / 2 - (r.y + u / 2) * C
  };
}
function Et(n, r, g) {
  return {
    zoom: r,
    panX: g.x - (g.x - n.panX) / n.zoom * r,
    panY: g.y - (g.y - n.panY) / n.zoom * r
  };
}
const St = 500, kt = 160, He = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), At = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function ue() {
  const n = typeof document < "u" ? document.body : void 0, r = n?.dataset.vscodeThemeKind;
  if (r !== void 0) return He.has(r);
  if (n) {
    for (const g of He) if (n.classList.contains(g)) return !0;
    for (const g of At) if (n.classList.contains(g)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const pe = (n, r) => `<button type="button" aria-label="${n}" title="${n}">${r}</button>`, Ct = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${pe("Zoom out", "−")}${pe("Zoom in", "+")}${pe("Fit canvas", "Fit")}
      </div>
      <fieldset><legend>Detail</legend>
        <label><input type="checkbox" data-fold-detail checked> Fold detail when zoomed out</label>
        <label><input type="checkbox" data-hover-tooltips checked> Show tooltips on hover</label>
      </fieldset>
      <fieldset><legend>Overlays</legend>
        <label><input type="checkbox" data-overlay="earned" checked> Earned</label>
        <label><input type="checkbox" data-overlay="gap" checked> Gap</label>
        <label><input type="checkbox" data-overlay="violation" checked> Violation</label>
      </fieldset>
    </header>
    <div class="ply-identity">
      <nav class="ply-breadcrumbs" aria-label="Semantic focus"></nav>
      <p class="ply-provenance"></p>
    </div>
    <div class="ply-workspace is-inspector-hidden">
      <main class="ply-canvas" tabindex="0" aria-label="Architecture canvas. Use arrow keys to move between items and Enter to inspect." data-empty="true">
        <div class="ply-stage"></div>
        <div class="ply-tooltip" id="ply-vis-tooltip" role="tooltip" hidden></div>
        <ul class="ply-context-menu" id="ply-vis-context-menu" role="menu" aria-label="Zoom options" hidden></ul>
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <button type="button" class="ply-inspector-toggle" aria-label="Show details" title="Show details" aria-controls="ply-inspector" aria-expanded="false">‹</button>
      <aside class="ply-inspector" id="ply-inspector" aria-label="Item details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function $t(n, r, g = []) {
  n.innerHTML = Ct;
  const p = n.querySelector(".ply-vis"), m = p.querySelector(".ply-canvas"), v = p.querySelector(".ply-stage"), y = p.querySelector(".ply-tooltip"), b = p.querySelector(".ply-context-menu"), i = p.querySelector(".ply-inspector"), u = p.querySelector(".ply-inspector-toggle"), C = p.querySelector(".ply-workspace"), L = p.querySelector(".ply-status"), _ = p.querySelector(".ply-toolbar fieldset"), k = p.querySelector(".ply-breadcrumbs"), D = p.querySelector(".ply-provenance");
  let a = wt(), h, K = /* @__PURE__ */ new Map(), ee, X = ue(), R;
  const J = /* @__PURE__ */ new Set();
  let A, he = 0, S, Z, te;
  const ye = () => r.post({ channel: "ply-vis", version: gt, type: "persist-state", state: a }), $ = (e, t = !0) => {
    a = Fe(a, e), t && ye();
  }, V = () => {
    v.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, Ye = () => h ? Object.values(h.elements).filter((e) => !a.focusedId || e.id === a.focusedId || ne(e, a.focusedId, h.elements)) : [];
  function B() {
    i.hidden = a.detailsHidden, C.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    u.setAttribute("aria-label", e), u.title = e, u.setAttribute("aria-expanded", String(!a.detailsHidden)), u.textContent = a.detailsHidden ? "‹" : "›";
  }
  function ge(e, t = !0) {
    $({ detailsHidden: e }, t), B();
  }
  function ve(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  function _e(e) {
    return e.run.tool.version === "render" || Object.values(e.elements).every((o) => ve(o) === "declared") ? { text: "Promises only — no run has checked this yet, so nothing here can ever be green." } : { text: `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, title: `Run ${e.run.id}` };
  }
  function ne(e, t, o) {
    let d = e.parentId;
    for (; d; ) {
      if (d === t) return !0;
      d = o[d]?.parentId;
    }
    return !1;
  }
  function Xe(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== a.focusedId; )
      o = h?.elements[o.parentId], t += 1;
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const be = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function Ze() {
    if (k.replaceChildren(), !h) return;
    const e = [];
    let t = a.focusedId ? h.elements[a.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = h.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", k.append(o);
    for (const d of e) {
      const s = document.createElement("button");
      s.type = "button", s.textContent = d.label, s.dataset.focusId = d.id, k.append(s);
    }
  }
  function P(e) {
    i.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", i.append(t), !e || !h) {
      const f = document.createElement("p");
      f.textContent = "Select an item to inspect its declaration and evidence.", i.append(f);
      return;
    }
    if ("fromId" in e) {
      i.append(T("Type", [e.kind])), i.append(T("From", [h.elements[e.fromId].label])), i.append(T("To", [h.elements[e.toId].label]));
      return;
    }
    const o = e, d = o.declaration?.split(`
`).filter(Boolean);
    i.append(T("Declaration", d?.length ? d : ["No declaration text supplied."])), i.append(T("Verdict", [o.evidence.verdict])), i.append(T("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const s = Object.entries(o.evidence).filter(([f]) => !["verdict", "statuses"].includes(f)).map(([f, w]) => `${f}: ${typeof w == "string" ? w : JSON.stringify(w)}`);
    i.append(T("Earned evidence", s.length ? s : ["No additional evidence details supplied."])), i.append(T("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const c = new Map(h.diagnostics.map((f) => [f.id, f])), l = o.diagnosticIds.map((f) => c.get(f)).filter((f) => f !== void 0).map((f) => `${f.code} — ${f.severity}: ${f.message}`);
    if (i.append(T("Diagnostics", l.length ? l : ["No diagnostics supplied."])), i.append(Pe(h.run)), o.source) {
      const f = document.createElement("button");
      f.type = "button", f.className = "ply-source", f.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, f.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), i.append(f);
    }
  }
  function T(e, t) {
    const o = document.createElement("section"), d = document.createElement("h3");
    d.textContent = e, o.append(d);
    const s = document.createElement("ul");
    for (const c of t) {
      const l = document.createElement("li");
      l.textContent = c, s.append(l);
    }
    return o.append(s), o;
  }
  function Pe(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), d = document.createElement("h3");
    d.textContent = "Run details";
    const s = document.createElement("dl"), c = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [l, f] of c) {
      const w = document.createElement("dt");
      w.textContent = l;
      const E = document.createElement("dd");
      E.textContent = f, s.append(w, E);
    }
    return o.append(d, s), o;
  }
  function W(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function We(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function U(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? h?.elements[t] : void 0;
  }
  function G(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? K.get(t) : void 0;
  }
  function N(e) {
    return G(e) ?? U(e);
  }
  function oe() {
    if (!(!h || !a.selectedId))
      return K.get(a.selectedId) ?? h.elements[a.selectedId];
  }
  function we(e) {
    return h ? `${e.kind}: ${e.label}; from ${h.elements[e.fromId].label} to ${h.elements[e.toId].label}` : e.label;
  }
  function Ue(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(y.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function Ie(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== y.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function Ge(e) {
    return y.scrollHeight <= y.clientHeight ? !1 : e > 0 ? y.scrollTop + y.clientHeight < y.scrollHeight : e < 0 ? y.scrollTop > 0 : !1;
  }
  function j() {
    Z !== void 0 && window.clearTimeout(Z), Z = void 0;
  }
  function x() {
    S && Ie(S), j(), S = void 0, y.hidden = !0, y.replaceChildren();
  }
  function Ke(e, t) {
    if (!h) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const d = Object.entries(e.evidence).filter(([l, f]) => !["verdict", "statuses"].includes(l) && f !== !1 && f !== void 0).map(([l, f]) => `${l}: ${typeof f == "string" ? f : JSON.stringify(f)}`);
    o.push(...d), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const s = new Map(h.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const f = s.get(l);
      f && o.push(`${f.code} — ${f.severity}: ${f.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const c = t.dataset.plyTitle?.trim();
    return c && c !== e.label && !o.includes(c) && o.push(c), o;
  }
  function xe(e, t) {
    const o = m.getBoundingClientRect(), d = 8;
    y.style.maxHeight = `${Math.max(0, o.height - d * 2)}px`;
    const s = 12, c = y.offsetWidth, l = y.offsetHeight, f = Math.max(d, o.width - c - d), w = Math.max(d, o.height - l - d), E = e - o.left + s, Y = t - o.top + s, le = Y + l <= o.height - d ? Y : t - o.top - l - s;
    y.style.left = `${Math.min(f, Math.max(d, E))}px`, y.style.top = `${Math.min(w, Math.max(d, le))}px`;
  }
  function Ee(e, t, o) {
    const d = U(e), s = G(e), c = e.dataset.plyTitle?.trim();
    if (!d && !s && !c || e.hasAttribute("hidden")) {
      x();
      return;
    }
    S && S !== e && Ie(S), S = e;
    const l = document.createElement("span");
    if (s) {
      const w = document.createElement("strong");
      w.textContent = s.label, l.textContent = we(s), y.replaceChildren(w, l);
    } else if (d) {
      const w = document.createElement("strong");
      w.textContent = d.label, l.textContent = Ke(d, e).join(`
`), y.replaceChildren(w, l);
    } else
      l.textContent = c, y.replaceChildren(l);
    y.hidden = !1, Ue(e);
    const f = e.getBoundingClientRect();
    xe(t ?? f.left + f.width / 2, o ?? f.bottom);
  }
  function Se(e, t, o) {
    j(), S && S !== e && x(), Z = window.setTimeout(() => {
      Z = void 0, Ee(e, t, o);
    }, St);
  }
  function Je(e, t, o) {
    const d = m.getBoundingClientRect(), s = 8, c = Math.max(s, d.width - e.offsetWidth - s), l = Math.max(s, d.height - e.offsetHeight - s);
    e.style.left = `${Math.min(c, Math.max(s, t - d.left))}px`, e.style.top = `${Math.min(l, Math.max(s, o - d.top))}px`;
  }
  function z() {
    if (b.hidden) return;
    const e = b.contains(document.activeElement), t = te;
    b.hidden = !0, b.replaceChildren(), te = void 0, e && (t?.isConnected ? t : m).focus();
  }
  function ke() {
    return [...b.querySelectorAll('button[role="menuitem"]')];
  }
  function ie(e) {
    const t = ke();
    if (!t.length) return;
    for (const d of t) d.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function Qe(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? N(t) : void 0, d = o && !("fromId" in o) ? o : void 0, s = [];
    if (d && s.push({ label: `Zoom into ${d.label}`, run: () => H(d.id) }), a.focusedId && s.push({ label: "Back to Workspace", run: () => H(void 0) }), !s.length) return;
    e.preventDefault(), x();
    const c = document.activeElement;
    te = c instanceof HTMLElement || c instanceof SVGElement ? c : void 0, b.replaceChildren();
    for (const l of s) {
      const f = document.createElement("li");
      f.setAttribute("role", "presentation");
      const w = document.createElement("button");
      w.type = "button", w.setAttribute("role", "menuitem"), w.textContent = l.label, w.tabIndex = -1, w.addEventListener("click", () => {
        z(), l.run();
      }), f.append(w), b.append(f);
    }
    b.hidden = !1, Je(b, e.clientX, e.clientY), ie(0);
  }
  b.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), z();
      return;
    }
    const o = ke().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), ie(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), ie(o - 1));
  }), m.addEventListener("contextmenu", Qe);
  const Ae = (e) => {
    !b.hidden && e.target instanceof Node && !b.contains(e.target) && z();
  };
  window.addEventListener("pointerdown", Ae);
  function M() {
    if (!h) return;
    ot();
    const e = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? h.elements[a.focusedId] : void 0;
    for (const s of e) {
      const c = s.dataset.elementId ?? s.dataset.plyId ?? "", l = h.elements[c], f = G(s);
      if (f) {
        s.removeAttribute("hidden"), s.setAttribute("role", "button"), s.setAttribute("aria-label", we(f)), s.classList.toggle("is-selected", f.id === a.selectedId);
        continue;
      }
      if (!l) {
        s.removeAttribute("hidden");
        continue;
      }
      const w = ve(l), E = w === "declared" || a.overlays[w], Y = t ? ne(t, l.id, h.elements) : !1, le = !a.focusedId || l.id === a.focusedId || ne(l, a.focusedId, h.elements) || Y, rt = Y || Xe(l) <= be();
      s.toggleAttribute("hidden", !le || !rt || !E && !Y);
      const dt = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      s.setAttribute("role", "button"), s.setAttribute("aria-label", `${l.kind}: ${l.label}; ${dt}`), s.dataset.state = w, s.classList.toggle("is-selected", l.id === a.selectedId), s === S && (s.hasAttribute("hidden") || !s.isConnected) && x();
    }
    et();
    const o = e.filter((s) => !s.hasAttribute("hidden") && N(s)), d = o.find((s) => N(s)?.id === a.selectedId) ?? o[0];
    for (const s of e) s.setAttribute("tabindex", s === d ? "0" : "-1");
    Ze();
  }
  function et() {
    const e = v.querySelector("svg");
    if (!e) return;
    for (const s of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      s.removeAttribute("hidden"), s.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((s) => U(s)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), d = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const s of [...e.children]) {
      if (!(s instanceof SVGElement) || s.matches("defs, style, title") || s.matches("[data-element-id], [data-ply-id]") && !G(s) || s.contains(t)) continue;
      const c = s;
      if (typeof c.getBBox != "function") continue;
      let l;
      try {
        l = c.getBBox();
      } catch {
        continue;
      }
      It(d, l) || (s.setAttribute("hidden", ""), s.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function tt(e) {
    F(), h = e, K = new Map(e.edges.map((s) => [s.id, s])), $({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    _.hidden = !t, k.hidden = !t, u.hidden = !t, t || ge(!0, !1), B(), x(), z(), R = void 0, se(e.svg), m.dataset.empty = "false";
    const o = m.querySelector(".ply-empty");
    o && o.remove(), V(), M(), P(oe());
    const d = _e(e);
    D.textContent = d.text, d.title ? D.title = d.title : D.removeAttribute("title"), L.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => ae(!1));
  }
  function se(e) {
    v.innerHTML = e;
    for (const t of [...v.querySelectorAll("title")]) {
      const o = t.parentElement, d = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), s = t.textContent?.trim();
      d && s && (d.dataset.plyTitle = s, U(d) || (d.setAttribute("tabindex", "0"), d.setAttribute("role", "img"), d.setAttribute("aria-label", s))), t.remove();
    }
  }
  function F() {
    for (const e of J) e.cancel();
    J.clear();
  }
  function Ce() {
    const e = /* @__PURE__ */ new Map();
    for (const t of v.querySelectorAll("[data-element-id], [data-ply-id]")) {
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
  function nt(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = Ce();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const d of v.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const s = d.dataset.elementId ?? d.dataset.plyId, c = s ? e.get(s) : void 0, l = s ? t.get(s) : void 0;
      if (!c || !l || c.width <= 0 || c.height <= 0 || l.width <= 0 || l.height <= 0) continue;
      const f = c.width / l.width, w = c.height / l.height;
      if (![f, w].every(Number.isFinite)) continue;
      let E;
      try {
        if (E = d.animate([
          { transform: `translate(${(c.left - l.left) / o}px, ${(c.top - l.top) / o}px) scale(${f}, ${w})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: kt, easing: "ease-out", composite: "add" }), !(E.effect instanceof KeyframeEffect) || E.effect.composite !== "add") {
          E.cancel();
          continue;
        }
      } catch {
        continue;
      }
      J.add(E), E.onfinish = E.oncancel = () => J.delete(E);
    }
  }
  function ot() {
    if (!h) return;
    const e = a.focusedId ? void 0 : it();
    if (e === R) return;
    const t = e === void 0 ? h.svg : h.folded.find((d) => d.depth === e)?.svg;
    if (!t) {
      R = e;
      return;
    }
    x(), z(), F();
    const o = Ce();
    se(t), R = e, o && !a.focusedId && nt(o);
  }
  function it() {
    if (!h) return;
    const e = be();
    if (Number.isFinite(e))
      return h.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function Le(e) {
    return Object.freeze({
      ...e,
      svg: Be(e.svg, { prefersDark: X }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Be(t.svg, { prefersDark: X }) })))
    });
  }
  function re(e) {
    try {
      const t = ct(e);
      return ee = t, tt(Le(t)), delete p.dataset.error, !0;
    } catch (t) {
      const o = t instanceof I || t instanceof Error ? t.message : "Unknown artifact error";
      return L.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, p.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function Oe(e) {
    if (e === X || !ee) {
      X = e;
      return;
    }
    X = e, h = Le(ee), x(), z(), F();
    const t = R === void 0 ? h.svg : h.folded.find((o) => o.depth === R)?.svg ?? h.svg;
    se(t), M(), V(), P(oe());
  }
  function Q(e) {
    const t = h && (K.get(e) ?? h.elements[e]);
    t && ($({ selectedId: e, detailsHidden: !1 }), B(), M(), P(t));
  }
  function $e(e) {
    [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => N(o)?.id === e)?.focus();
  }
  function H(e) {
    e && !h?.elements[e] || (e && !h.elements[e].parentId && (e = void 0), x(), z(), $({ focusedId: e, selectedId: e, detailsHidden: !e }), B(), M(), P(e ? h?.elements[e] : void 0), ae());
  }
  function st() {
    const e = m.getBoundingClientRect(), o = (a.selectedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => N(d)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function de(e, t) {
    x(), z(), F(), t ??= st(), $(Et(a, Math.min(4, Math.max(0.2, e)), t)), V(), M(), L.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function ae(e = !0) {
    F();
    const t = v.querySelector("svg");
    if (!t) return;
    const o = v.getBoundingClientRect(), d = a.focusedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((f) => U(f)?.id === a.focusedId) : t;
    if (!d) return;
    const s = d.getBoundingClientRect(), c = a.zoom || 1, l = {
      x: (s.left - o.left) / c,
      y: (s.top - o.top) / c,
      width: s.width / c,
      height: s.height / c
    };
    $(xt({ width: m.clientWidth, height: m.clientHeight }, l)), V(), M(), e && (L.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
  }
  p.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => de(a.zoom * 1.2)), p.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => de(a.zoom / 1.2)), p.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => ae()), u.addEventListener("click", () => ge(!a.detailsHidden)), p.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    $({ overlays: { ...a.overlays, [t]: e.checked } }), M();
  })), p.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    $({ foldDetail: e.target.checked }), M(), L.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), p.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    $({ hoverTooltips: t }), t || (j(), S && document.activeElement !== S && x()), L.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), k.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && H(t.dataset.focusId || void 0);
  }), v.addEventListener("click", (e) => {
    if (performance.now() < he) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && N(t);
    o && Q(o.id);
  }), v.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && N(t);
    o && !("fromId" in o) && H(o.id);
  }), v.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = W(e.target);
    t && Se(t, e.clientX, e.clientY);
  }), v.addEventListener("pointermove", (e) => {
    if (!a.hoverTooltips) {
      j();
      return;
    }
    const t = W(e.target);
    if (!t) {
      j();
      return;
    }
    t === S && !y.hidden ? xe(e.clientX, e.clientY) : Se(t, e.clientX, e.clientY);
  }), v.addEventListener("pointerout", (e) => {
    const t = W(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || y.contains(e.relatedTarget)) || t.contains(document.activeElement) || x();
  }), v.addEventListener("focusin", (e) => {
    const t = W(e.target);
    t && (!a.hoverTooltips && !We(t) || (j(), Ee(t)));
  }), v.addEventListener("focusout", (e) => {
    const t = W(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || x();
  }), y.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && S?.contains(e.relatedTarget) || x();
  }), y.addEventListener("wheel", (e) => {
    if (Ge(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    x();
  }, { passive: !0 }), y.addEventListener("pointerdown", (e) => e.stopPropagation()), m.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = m.getBoundingClientRect();
    de(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    e.button === 0 && (A = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), m.addEventListener("pointermove", (e) => {
    if (!A) return;
    const t = e.clientX - A.x, o = e.clientY - A.y;
    if (!(!A.moved && Math.hypot(t, o) < 3)) {
      if (!A.moved) {
        A.moved = !0, m.classList.add("is-panning");
        try {
          m.setPointerCapture(A.pointerId);
        } catch {
        }
      }
      e.preventDefault(), $({ panX: A.panX + t, panY: A.panY + o }, !1), V();
    }
  });
  const ce = () => {
    A && (A.moved && (he = performance.now() + 250, ye()), A = void 0, m.classList.remove("is-panning"));
  };
  m.addEventListener("pointerup", ce), m.addEventListener("pointercancel", ce), m.addEventListener("lostpointercapture", ce), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !y.hidden) {
      e.preventDefault(), x();
      return;
    }
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((c) => !c.hasAttribute("hidden") && G(c)).map((c) => c.dataset.elementId ?? c.dataset.plyId)), d = [...Ye(), ...(h?.edges ?? []).filter((c) => o.has(c.id))];
    if (!d.length) return;
    const s = Math.max(0, d.findIndex((c) => c.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = d[(s + 1) % d.length].id;
      Q(c), $e(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = d[(s - 1 + d.length) % d.length].id;
      Q(c), $e(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = d[s];
      "fromId" in c ? Q(c.id) : H(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = a.focusedId ? h?.elements[a.focusedId]?.parentId : void 0;
      H(c);
    }
  });
  const Te = (e) => {
    bt(e.data) && (e.data.type === "artifact" ? re(e.data.envelope) : (a = Fe(a, e.data.state), p.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), p.querySelector("[data-fold-detail]").checked = a.foldDetail, p.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, h && (B(), V(), M(), P(oe()))));
  }, Me = (e) => {
    L.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ze = (e) => Me(e.message || "Unknown runtime error"), De = (e) => Me(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", Te), window.addEventListener("error", ze), window.addEventListener("unhandledrejection", De);
  const Ne = typeof MutationObserver == "function" ? new MutationObserver(() => Oe(ue())) : void 0;
  Ne?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const je = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, qe = () => Oe(ue());
  je?.addEventListener("change", qe), B();
  for (const e of g) re(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), g.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: re, getState: () => a, destroy: () => {
    j(), F(), window.removeEventListener("message", Te), window.removeEventListener("error", ze), window.removeEventListener("unhandledrejection", De), window.removeEventListener("pointerdown", Ae), Ne?.disconnect(), je?.removeEventListener("change", qe), n.replaceChildren();
  } };
}
const Tt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Tt as CONTENT_SECURITY_POLICY,
  I as EnvelopeError,
  gt as HOST_PROTOCOL_VERSION,
  Lt as PROTOCOL_VERSION,
  wt as initialViewState,
  bt as isHostResponse,
  $t as mountViewer,
  ct as parseEnvelope,
  Be as sanitizeSvg,
  Fe as updateViewState,
  Ot as windowHostBridge
};
//# sourceMappingURL=index.js.map
