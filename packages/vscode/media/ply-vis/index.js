const Nt = 1;
class I extends Error {
}
const L = (n) => typeof n == "object" && n !== null && !Array.isArray(n), V = (n, r, g = []) => {
  const f = /* @__PURE__ */ new Set([...r, ...g]);
  return r.every((m) => m in n) && Object.keys(n).every((m) => f.has(m));
}, ye = (n) => Array.isArray(n) && n.every((r) => typeof r == "string"), yt = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function we(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(we));
  if (L(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([r, g]) => [r, we(g)])));
  throw new I("Evidence contains a non-JSON value");
}
function _e(n) {
  if (n !== void 0) {
    if (!L(n) || !V(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new I("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new I("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[r]) || n[r] < 0) throw new I("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new I("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function gt(n) {
  if (!L(n) || !V(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new I("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new I(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!L(n.run) || !V(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !L(n.run.root) || !V(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !L(n.run.tool) || !V(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !r.has(n.run.outcome)) throw new I("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new I("Invalid SVG");
  const g = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new I("Invalid folded drawings");
    for (const s of n.folded) {
      if (!L(s) || !V(s, ["depth", "svg"]) || !Number.isInteger(s.depth) || s.depth < 1 || typeof s.svg != "string" || !s.svg.trim()) throw new I("Invalid folded drawing");
      g.push(Object.freeze({ depth: s.depth, svg: s.svg }));
    }
  }
  if (!L(n.elements)) throw new I("Invalid element index");
  const f = /* @__PURE__ */ Object.create(null);
  for (const [s, p] of Object.entries(n.elements)) {
    if (!L(p) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((k) => k in p) || !L(p.evidence)) throw new I(`Invalid element: ${s}`);
    if (p.id !== s || typeof p.id != "string" || !p.id || typeof p.kind != "string" || !p.kind || typeof p.label != "string" || !p.label || typeof p.evidence.verdict != "string" || !ye(p.evidence.statuses) || typeof p.evidence.reused != "boolean" || p.evidence.state !== void 0 && !yt.has(p.evidence.state) || !ye(p.diagnosticIds) || p.parentId !== void 0 && typeof p.parentId != "string" || p.declaration !== void 0 && typeof p.declaration != "string" || p.limitations !== void 0 && !ye(p.limitations)) throw new I(`Invalid element: ${s}`);
    const C = we(p.evidence);
    f[s] = Object.freeze({ id: s, kind: p.kind, label: p.label, evidence: C, diagnosticIds: Object.freeze([...p.diagnosticIds]), ...p.parentId === void 0 ? {} : { parentId: p.parentId }, ...p.declaration === void 0 ? {} : { declaration: p.declaration }, ...p.limitations === void 0 ? {} : { limitations: Object.freeze([...p.limitations]) }, ...p.source === void 0 ? {} : { source: _e(p.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new I(`Unknown parent: ${s.parentId}`);
  const m = [], v = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new I("Invalid edge list");
    for (const s of n.edges) {
      if (!L(s) || !V(s, ["id", "fromId", "toId", "kind", "label"]) || typeof s.id != "string" || !s.id || s.id in f || v.has(s.id) || typeof s.fromId != "string" || !s.fromId || typeof s.toId != "string" || !s.toId || typeof s.kind != "string" || !s.kind || typeof s.label != "string" || !s.label) throw new I("Invalid edge");
      if (!f[s.fromId] || !f[s.toId]) throw new I("Unknown edge endpoint");
      v.add(s.id), m.push(Object.freeze({ id: s.id, fromId: s.fromId, toId: s.toId, kind: s.kind, label: s.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new I("Invalid diagnostics");
  const y = [], w = /* @__PURE__ */ new Set();
  for (const s of n.diagnostics) {
    if (!L(s) || typeof s.id != "string" || !s.id || w.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new I("Invalid diagnostic");
    w.add(s.id), y.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: _e(s.source) } }));
  }
  for (const s of Object.values(f)) for (const p of s.diagnosticIds ?? []) if (!w.has(p)) throw new I(`Unknown diagnostic: ${p}`);
  for (const s of y) if (s.elementId && !f[s.elementId]) throw new I(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), edges: Object.freeze(m), diagnostics: Object.freeze(y), folded: Object.freeze(g) });
}
const vt = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), bt = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), wt = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Xe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, It = {
  fill: Xe,
  stroke: Xe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, xt = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function Et(n) {
  let r = n, g = "";
  for (; ; ) {
    const f = r.search(/@media\b/i);
    if (f < 0) return { base: r, darkBody: g };
    const m = r.indexOf("{", f);
    if (m < 0) return { base: r.slice(0, f), darkBody: g };
    const v = r.slice(f, m).trim();
    let y = 0, w = m;
    for (; w < r.length; w += 1)
      if (r[w] === "{") y += 1;
      else if (r[w] === "}" && --y === 0) break;
    xt.test(v) && (g += `${r.slice(m + 1, w)}
`), r = r.slice(0, f) + r.slice(Math.min(w + 1, r.length));
  }
}
function St(n, r) {
  if (!n.trim() || n.length > 32768) return;
  const { base: g, darkBody: f } = Et(n), m = r ? `${g}
${f}` : g, v = /\s*([^{}]+)\{([^{}]*)\}/gy, y = [];
  let w = 0;
  for (; w < m.length; ) {
    v.lastIndex = w;
    const s = v.exec(m);
    if (!s) return m.slice(w).trim() === "" ? y : void 0;
    w = v.lastIndex;
    const p = s[1], C = s[2];
    if (p === void 0 || C === void 0) return;
    const k = p.split(",").map(($) => $.trim());
    if (!k.every(($) => wt.test($))) return;
    const Z = [];
    for (const $ of C.split(";")) {
      const T = $.indexOf(":");
      if (T < 1) continue;
      const M = $.slice(0, T).trim().toLowerCase(), j = $.slice(T + 1).trim();
      It[M]?.test(j) === !0 && Z.push([M, j]);
    }
    Z.length && y.push({ selectors: k, declarations: Z });
  }
  return y;
}
function Ze(n, r = {}) {
  const g = r.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const m of [...f.querySelectorAll("*")]) {
    if (m.localName.toLowerCase() === "style") {
      const v = St(m.textContent ?? "", g);
      if (v) for (const y of v) for (const w of y.selectors)
        for (const s of [...f.documentElement.querySelectorAll(w)])
          for (const [p, C] of y.declarations) s.setAttribute(p, C);
      m.remove();
      continue;
    }
    if (vt.has(m.localName.toLowerCase())) {
      m.remove();
      continue;
    }
    for (const v of [...m.attributes]) {
      const y = v.name.toLowerCase(), w = v.value.trim().toLowerCase(), s = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(w);
      (y.startsWith("on") || y === "style" || s || bt.has(y) && w !== "" && !w.startsWith("#")) && m.removeAttribute(v.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const ge = 1, jt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function kt(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n, g = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof g == "object" && g !== null && typeof g.earned == "boolean" && typeof g.gap == "boolean" && typeof g.violation == "boolean" && (r.detailsHidden === void 0 || typeof r.detailsHidden == "boolean") && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string") && (r.hoverTooltips === void 0 || typeof r.hoverTooltips == "boolean");
}
function At(n) {
  if (typeof n != "object" || n === null) return !1;
  const r = n;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r || r.type === "restore-state" && kt(r.state) || r.type === "capabilities" && typeof r.explain == "boolean" || r.type === "clear" && typeof r.message == "string");
}
const Ct = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, optionsHidden: !1, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Pe = (n, r) => Object.freeze({ ...n, ...r, overlays: Object.freeze({ ...n.overlays, ...r.overlays }) });
function Lt(n, r, g = 0.5) {
  return r.x >= n.x - g && r.y >= n.y - g && r.x + r.width <= n.x + n.width + g && r.y + r.height <= n.y + n.height + g;
}
function Ot(n, r, g = {}) {
  const f = g.margin ?? 24, m = g.minZoom ?? 0.2, v = g.maxZoom ?? 4, y = Math.max(1, n.width - f * 2), w = Math.max(1, n.height - f * 2), s = Math.max(1, r.width), p = Math.max(1, r.height), C = Math.min(v, Math.max(m, Math.min(y / s, w / p)));
  return {
    zoom: C,
    panX: n.width / 2 - (r.x + s / 2) * C,
    panY: n.height / 2 - (r.y + p / 2) * C
  };
}
function $t(n, r, g) {
  return {
    zoom: r,
    panX: g.x - (g.x - n.panX) / n.zoom * r,
    panY: g.y - (g.y - n.panY) / n.zoom * r
  };
}
const Tt = 500, Mt = 160, We = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), zt = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function ve() {
  const n = typeof document < "u" ? document.body : void 0, r = n?.dataset.vscodeThemeKind;
  if (r !== void 0) return We.has(r);
  if (n) {
    for (const g of We) if (n.classList.contains(g)) return !0;
    for (const g of zt) if (n.classList.contains(g)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const be = (n, r) => `<button type="button" aria-label="${n}" title="${n}">${r}</button>`, Dt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${be("Zoom out", "−")}${be("Zoom in", "+")}${be("Fit canvas", "Fit")}
      </div>
      <button type="button" class="ply-options-toggle" aria-controls="ply-vis-options" aria-expanded="true" aria-label="Hide options" title="Hide options">⌃</button>
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
function qt(n, r, g = []) {
  n.innerHTML = Dt;
  const f = n.querySelector(".ply-vis"), m = f.querySelector(".ply-canvas"), v = f.querySelector(".ply-stage"), y = f.querySelector(".ply-tooltip"), w = f.querySelector(".ply-context-menu"), s = f.querySelector(".ply-inspector"), p = f.querySelector(".ply-inspector-toggle"), C = f.querySelector(".ply-workspace"), k = f.querySelector(".ply-status"), Z = f.querySelector(".ply-toolbar [data-evidence-filters]"), $ = f.querySelector(".ply-options"), T = f.querySelector(".ply-options-toggle"), M = f.querySelector(".ply-breadcrumbs"), j = f.querySelector(".ply-provenance");
  let a = Ct(), h, ee = /* @__PURE__ */ new Map(), te, P = ve(), q;
  const ne = /* @__PURE__ */ new Set();
  let A, Ie = 0, S, W, ie, se = !1, U;
  const xe = () => r.post({ channel: "ply-vis", version: ge, type: "persist-state", state: a }), O = (e, t = !0) => {
    a = Pe(a, e), t && xe();
  }, F = () => {
    v.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, Ue = () => h ? Object.values(h.elements).filter((e) => !a.focusedId || e.id === a.focusedId || de(e, a.focusedId, h.elements)) : [];
  function H() {
    s.hidden = a.detailsHidden, C.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    p.setAttribute("aria-label", e), p.title = e, p.setAttribute("aria-expanded", String(!a.detailsHidden)), p.textContent = a.detailsHidden ? "‹" : "›";
  }
  function re() {
    $.hidden = a.optionsHidden;
    const e = a.optionsHidden ? "Show options" : "Hide options";
    T.setAttribute("aria-label", e), T.title = e, T.setAttribute("aria-expanded", String(!a.optionsHidden)), T.textContent = a.optionsHidden ? "⌄" : "⌃";
  }
  function Ge(e, t = !0) {
    O({ optionsHidden: e }, t), re();
  }
  function Ee(e, t = !0) {
    O({ detailsHidden: e }, t), H();
  }
  function Se(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  function Ke(e) {
    if (e.run.tool.version === "render" || Object.values(e.elements).every((c) => Se(c) === "declared")) return { text: "Promises only — no run has checked this yet, so nothing here can ever be green." };
    const o = `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, d = e.run.tool.version;
    return U !== void 0 && /^[0-9a-f]{64}$/.test(d) && /^[0-9a-f]{64}$/.test(U) && d !== U ? {
      text: `${o} Ply itself has changed since this run, so nothing here would be carried forward — every check would run again.`,
      title: `Run ${e.run.id}
Ran by ${d}
Installed ${U}`
    } : { text: o, title: `Run ${e.run.id}` };
  }
  function de(e, t, o) {
    let d = e.parentId;
    for (; d; ) {
      if (d === t) return !0;
      d = o[d]?.parentId;
    }
    return !1;
  }
  function Je(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== a.focusedId; )
      o = h?.elements[o.parentId], t += 1;
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const ke = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function Qe() {
    if (M.replaceChildren(), !h) return;
    const e = [];
    let t = a.focusedId ? h.elements[a.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = h.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", M.append(o);
    for (const d of e) {
      const i = document.createElement("button");
      i.type = "button", i.textContent = d.label, i.dataset.focusId = d.id, M.append(i);
    }
  }
  function G(e) {
    s.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", s.append(t), !e || !h) {
      const u = document.createElement("p");
      u.textContent = "Select an item to inspect its declaration and evidence.", s.append(u);
      return;
    }
    if ("fromId" in e) {
      s.append(z("Type", [e.kind])), s.append(z("From", [h.elements[e.fromId].label])), s.append(z("To", [h.elements[e.toId].label]));
      return;
    }
    const o = e, d = o.declaration?.split(`
`).filter(Boolean);
    s.append(z("Declaration", d?.length ? d : ["No declaration text supplied."])), s.append(z("Verdict", [o.evidence.verdict])), s.append(z("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const i = Object.entries(o.evidence).filter(([u]) => !["verdict", "statuses"].includes(u)).map(([u, x]) => `${u}: ${typeof x == "string" ? x : JSON.stringify(x)}`);
    s.append(z("Earned evidence", i.length ? i : ["No additional evidence details supplied."])), s.append(z("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const c = new Map(h.diagnostics.map((u) => [u.id, u])), b = o.diagnosticIds.map((u) => c.get(u)).filter((u) => u !== void 0).map((u) => `${u.code} — ${u.severity}: ${u.message}`);
    if (s.append(z("Diagnostics", b.length ? b : ["No diagnostics supplied."])), s.append(et(h.run)), o.source) {
      const u = document.createElement("button");
      u.type = "button", u.className = "ply-source", u.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, u.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), s.append(u);
    }
  }
  function z(e, t) {
    const o = document.createElement("section"), d = document.createElement("h3");
    d.textContent = e, o.append(d);
    const i = document.createElement("ul");
    for (const c of t) {
      const l = document.createElement("li");
      l.textContent = c, i.append(l);
    }
    return o.append(i), o;
  }
  function et(e) {
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
    for (const [l, b] of c) {
      const u = document.createElement("dt");
      u.textContent = l;
      const x = document.createElement("dd");
      x.textContent = b, i.append(u, x);
    }
    return o.append(d, i), o;
  }
  function K(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function tt(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function J(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? h?.elements[t] : void 0;
  }
  function Q(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? ee.get(t) : void 0;
  }
  function R(e) {
    return Q(e) ?? J(e);
  }
  function ae() {
    if (!(!h || !a.selectedId))
      return ee.get(a.selectedId) ?? h.elements[a.selectedId];
  }
  function Ae(e) {
    return h ? `${e.kind}: ${e.label}; from ${h.elements[e.fromId].label} to ${h.elements[e.toId].label}` : e.label;
  }
  function nt(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(y.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function Ce(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== y.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function ot(e) {
    return y.scrollHeight <= y.clientHeight ? !1 : e > 0 ? y.scrollTop + y.clientHeight < y.scrollHeight : e < 0 ? y.scrollTop > 0 : !1;
  }
  function B() {
    W !== void 0 && window.clearTimeout(W), W = void 0;
  }
  function E() {
    S && Ce(S), B(), S = void 0, y.hidden = !0, y.replaceChildren();
  }
  function it(e, t) {
    if (!h) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const d = Object.entries(e.evidence).filter(([l, b]) => !["verdict", "statuses"].includes(l) && b !== !1 && b !== void 0).map(([l, b]) => `${l}: ${typeof b == "string" ? b : JSON.stringify(b)}`);
    o.push(...d), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const i = new Map(h.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const b = i.get(l);
      b && o.push(`${b.code} — ${b.severity}: ${b.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const c = t.dataset.plyTitle?.trim();
    return c && c !== e.label && !o.includes(c) && o.push(c), o;
  }
  function Le(e, t) {
    const o = m.getBoundingClientRect(), d = 8;
    y.style.maxHeight = `${Math.max(0, o.height - d * 2)}px`;
    const i = 12, c = y.offsetWidth, l = y.offsetHeight, b = Math.max(d, o.width - c - d), u = Math.max(d, o.height - l - d), x = e - o.left + i, X = t - o.top + i, he = X + l <= o.height - d ? X : t - o.top - l - i;
    y.style.left = `${Math.min(b, Math.max(d, x))}px`, y.style.top = `${Math.min(u, Math.max(d, he))}px`;
  }
  function Oe(e, t, o) {
    const d = J(e), i = Q(e), c = e.dataset.plyTitle?.trim();
    if (!d && !i && !c || e.hasAttribute("hidden")) {
      E();
      return;
    }
    S && S !== e && Ce(S), S = e;
    const l = document.createElement("span");
    if (i) {
      const u = document.createElement("strong");
      u.textContent = i.label, l.textContent = Ae(i), y.replaceChildren(u, l);
    } else if (d) {
      const u = document.createElement("strong");
      u.textContent = d.label, l.textContent = it(d, e).join(`
`), y.replaceChildren(u, l);
    } else
      l.textContent = c, y.replaceChildren(l);
    y.hidden = !1, nt(e);
    const b = e.getBoundingClientRect();
    Le(t ?? b.left + b.width / 2, o ?? b.bottom);
  }
  function $e(e, t, o) {
    B(), S && S !== e && E(), W = window.setTimeout(() => {
      W = void 0, Oe(e, t, o);
    }, Tt);
  }
  function st(e, t, o) {
    const d = m.getBoundingClientRect(), i = 8, c = Math.max(i, d.width - e.offsetWidth - i), l = Math.max(i, d.height - e.offsetHeight - i);
    e.style.left = `${Math.min(c, Math.max(i, t - d.left))}px`, e.style.top = `${Math.min(l, Math.max(i, o - d.top))}px`;
  }
  function D() {
    if (w.hidden) return;
    const e = w.contains(document.activeElement), t = ie;
    w.hidden = !0, w.replaceChildren(), ie = void 0, e && (t?.isConnected ? t : m).focus();
  }
  function Te() {
    return [...w.querySelectorAll('button[role="menuitem"]')];
  }
  function ce(e) {
    const t = Te();
    if (!t.length) return;
    for (const d of t) d.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function rt(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? R(t) : void 0, d = o && !("fromId" in o) ? o : void 0, i = [];
    if (d && i.push({ label: `Zoom into ${d.label}`, run: () => _(d.id) }), a.focusedId && i.push({ label: "Back to Workspace", run: () => _(void 0) }), h) {
      const l = new Map(h.diagnostics.map((b) => [b.id, b]));
      for (const b of se ? d?.diagnosticIds ?? [] : []) {
        const u = l.get(b)?.code;
        u && i.push({ label: `Explain ${u}`, run: () => r.post({ channel: "ply-vis", version: ge, type: "explain", code: u }) });
      }
    }
    if (t && se && i.push({ label: "Explain a code…", run: () => r.post({ channel: "ply-vis", version: ge, type: "explain-prompt" }) }), !i.length) return;
    e.preventDefault(), E();
    const c = document.activeElement;
    ie = c instanceof HTMLElement || c instanceof SVGElement ? c : void 0, w.replaceChildren();
    for (const l of i) {
      const b = document.createElement("li");
      b.setAttribute("role", "presentation");
      const u = document.createElement("button");
      u.type = "button", u.setAttribute("role", "menuitem"), u.textContent = l.label, u.tabIndex = -1, u.addEventListener("click", () => {
        D(), l.run();
      }), b.append(u), w.append(b);
    }
    w.hidden = !1, st(w, e.clientX, e.clientY), ce(0);
  }
  w.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), D();
      return;
    }
    const o = Te().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), ce(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), ce(o - 1));
  }), m.addEventListener("contextmenu", rt);
  const Me = (e) => {
    !w.hidden && e.target instanceof Node && !w.contains(e.target) && D();
  };
  window.addEventListener("pointerdown", Me);
  function N() {
    if (!h) return;
    lt();
    const e = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? h.elements[a.focusedId] : void 0;
    for (const i of e) {
      const c = i.dataset.elementId ?? i.dataset.plyId ?? "", l = h.elements[c], b = Q(i);
      if (b) {
        i.removeAttribute("hidden"), i.setAttribute("role", "button"), i.setAttribute("aria-label", Ae(b)), i.classList.toggle("is-selected", b.id === a.selectedId);
        continue;
      }
      if (!l) {
        i.removeAttribute("hidden");
        continue;
      }
      const u = Se(l), x = u === "declared" || a.overlays[u], X = t ? de(t, l.id, h.elements) : !1, he = !a.focusedId || l.id === a.focusedId || de(l, a.focusedId, h.elements) || X, mt = X || Je(l) <= ke();
      i.toggleAttribute("hidden", !he || !mt || !x && !X);
      const ht = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${l.kind}: ${l.label}; ${ht}`), i.dataset.state = u, i.classList.toggle("is-selected", l.id === a.selectedId), i === S && (i.hasAttribute("hidden") || !i.isConnected) && E();
    }
    dt();
    const o = e.filter((i) => !i.hasAttribute("hidden") && R(i)), d = o.find((i) => R(i)?.id === a.selectedId) ?? o[0];
    for (const i of e) i.setAttribute("tabindex", i === d ? "0" : "-1");
    Qe();
  }
  function dt() {
    const e = v.querySelector("svg");
    if (!e) return;
    for (const i of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      i.removeAttribute("hidden"), i.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => J(i)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), d = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const i of [...e.children]) {
      if (!(i instanceof SVGElement) || i.matches("defs, style, title") || i.matches("[data-element-id], [data-ply-id]") && !Q(i) || i.contains(t)) continue;
      const c = i;
      if (typeof c.getBBox != "function") continue;
      let l;
      try {
        l = c.getBBox();
      } catch {
        continue;
      }
      Lt(d, l) || (i.setAttribute("hidden", ""), i.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function at(e) {
    Y(), h = e, ee = new Map(e.edges.map((i) => [i.id, i])), O({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    Z.hidden = !t, M.hidden = !t, p.hidden = !t, t || Ee(!0, !1), H(), E(), D(), q = void 0, le(e.svg), m.dataset.empty = "false";
    const o = m.querySelector(".ply-empty");
    o && o.remove(), F(), N(), G(ae());
    const d = Ke(e);
    j.textContent = d.text, d.title ? j.title = d.title : j.removeAttribute("title"), k.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => ue(!1));
  }
  function le(e) {
    v.innerHTML = e;
    for (const t of [...v.querySelectorAll("title")]) {
      const o = t.parentElement, d = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), i = t.textContent?.trim();
      d && i && (d.dataset.plyTitle = i, J(d) || (d.setAttribute("tabindex", "0"), d.setAttribute("role", "img"), d.setAttribute("aria-label", i))), t.remove();
    }
  }
  function Y() {
    for (const e of ne) e.cancel();
    ne.clear();
  }
  function ze() {
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
  function ct(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = ze();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const d of v.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const i = d.dataset.elementId ?? d.dataset.plyId, c = i ? e.get(i) : void 0, l = i ? t.get(i) : void 0;
      if (!c || !l || c.width <= 0 || c.height <= 0 || l.width <= 0 || l.height <= 0) continue;
      const b = c.width / l.width, u = c.height / l.height;
      if (![b, u].every(Number.isFinite)) continue;
      let x;
      try {
        if (x = d.animate([
          { transform: `translate(${(c.left - l.left) / o}px, ${(c.top - l.top) / o}px) scale(${b}, ${u})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: Mt, easing: "ease-out", composite: "add" }), !(x.effect instanceof KeyframeEffect) || x.effect.composite !== "add") {
          x.cancel();
          continue;
        }
      } catch {
        continue;
      }
      ne.add(x), x.onfinish = x.oncancel = () => ne.delete(x);
    }
  }
  function lt() {
    if (!h) return;
    const e = a.focusedId ? void 0 : ft();
    if (e === q) return;
    const t = e === void 0 ? h.svg : h.folded.find((d) => d.depth === e)?.svg;
    if (!t) {
      q = e;
      return;
    }
    E(), D(), Y();
    const o = ze();
    le(t), q = e, o && !a.focusedId && ct(o);
  }
  function ft() {
    if (!h) return;
    const e = ke();
    if (Number.isFinite(e))
      return h.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function De(e) {
    return Object.freeze({
      ...e,
      svg: Ze(e.svg, { prefersDark: P }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Ze(t.svg, { prefersDark: P }) })))
    });
  }
  function fe(e) {
    try {
      const t = gt(e);
      return te = t, at(De(t)), delete f.dataset.error, !0;
    } catch (t) {
      const o = t instanceof I || t instanceof Error ? t.message : "Unknown artifact error";
      return k.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, f.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function Ne(e) {
    if (e === P || !te) {
      P = e;
      return;
    }
    P = e, h = De(te), E(), D(), Y();
    const t = q === void 0 ? h.svg : h.folded.find((o) => o.depth === q)?.svg ?? h.svg;
    le(t), N(), F(), G(ae());
  }
  function oe(e) {
    const t = h && (ee.get(e) ?? h.elements[e]);
    t && (O({ selectedId: e, detailsHidden: !1 }), H(), N(), G(t));
  }
  function je(e) {
    [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => R(o)?.id === e)?.focus();
  }
  function _(e) {
    e && !h?.elements[e] || (e && !h.elements[e].parentId && (e = void 0), E(), D(), O({ focusedId: e, selectedId: e, detailsHidden: !e }), H(), N(), G(e ? h?.elements[e] : void 0), ue());
  }
  function pt() {
    const e = m.getBoundingClientRect(), o = (a.selectedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => R(d)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function pe(e, t) {
    E(), D(), Y(), t ??= pt(), O($t(a, Math.min(4, Math.max(0.2, e)), t)), F(), N(), k.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function ue(e = !0) {
    Y();
    const t = v.querySelector("svg");
    if (!t) return;
    const o = a.focusedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((b) => J(b)?.id === a.focusedId) : t;
    if (!o) return;
    e && (k.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
    const d = v.getBoundingClientRect(), i = o.getBoundingClientRect(), c = a.zoom || 1, l = {
      x: (i.left - d.left) / c,
      y: (i.top - d.top) / c,
      width: i.width / c,
      height: i.height / c
    };
    O(Ot({ width: m.clientWidth, height: m.clientHeight }, l)), F(), N();
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => pe(a.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => pe(a.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => ue()), p.addEventListener("click", () => Ee(!a.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    O({ overlays: { ...a.overlays, [t]: e.checked } }), N();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    O({ foldDetail: e.target.checked }), N(), k.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    O({ hoverTooltips: t }), t || (B(), S && document.activeElement !== S && E()), k.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), M.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && _(t.dataset.focusId || void 0);
  }), v.addEventListener("click", (e) => {
    if (performance.now() < Ie) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && oe(o.id);
  }), v.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && R(t);
    o && !("fromId" in o) && _(o.id);
  }), v.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = K(e.target);
    t && $e(t, e.clientX, e.clientY);
  }), v.addEventListener("pointermove", (e) => {
    if (!a.hoverTooltips) {
      B();
      return;
    }
    const t = K(e.target);
    if (!t) {
      B();
      return;
    }
    t === S && !y.hidden ? Le(e.clientX, e.clientY) : $e(t, e.clientX, e.clientY);
  }), v.addEventListener("pointerout", (e) => {
    const t = K(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || y.contains(e.relatedTarget)) || t.contains(document.activeElement) || E();
  }), v.addEventListener("focusin", (e) => {
    const t = K(e.target);
    t && (!a.hoverTooltips && !tt(t) || (B(), Oe(t)));
  }), v.addEventListener("focusout", (e) => {
    const t = K(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || E();
  }), y.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && S?.contains(e.relatedTarget) || E();
  }), y.addEventListener("wheel", (e) => {
    if (ot(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    E();
  }, { passive: !0 }), y.addEventListener("pointerdown", (e) => e.stopPropagation()), m.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = m.getBoundingClientRect();
    pe(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
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
      e.preventDefault(), O({ panX: A.panX + t, panY: A.panY + o }, !1), F();
    }
  });
  const me = () => {
    A && (A.moved && (Ie = performance.now() + 250, xe()), A = void 0, m.classList.remove("is-panning"));
  };
  m.addEventListener("pointerup", me), m.addEventListener("pointercancel", me), m.addEventListener("lostpointercapture", me), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !y.hidden) {
      e.preventDefault(), E();
      return;
    }
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((c) => !c.hasAttribute("hidden") && Q(c)).map((c) => c.dataset.elementId ?? c.dataset.plyId)), d = [...Ue(), ...(h?.edges ?? []).filter((c) => o.has(c.id))];
    if (!d.length) return;
    const i = Math.max(0, d.findIndex((c) => c.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = d[(i + 1) % d.length].id;
      oe(c), je(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = d[(i - 1 + d.length) % d.length].id;
      oe(c), je(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = d[i];
      "fromId" in c ? oe(c.id) : _(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = a.focusedId ? h?.elements[a.focusedId]?.parentId : void 0;
      _(c);
    }
  });
  function ut(e) {
    h = void 0, te = void 0, q = void 0, a = { ...a, selectedId: void 0, focusedId: void 0 }, v.innerHTML = "", E(), D(), m.dataset.empty = "true";
    const t = m.querySelector(".ply-empty");
    if (t) t.textContent = e;
    else {
      const o = document.createElement("p");
      o.className = "ply-empty", o.textContent = e, m.append(o);
    }
    M.hidden = !0, p.hidden = !0, H(), j.textContent = "", j.removeAttribute("title"), k.textContent = "";
  }
  const qe = (e) => {
    At(e.data) && (e.data.type === "artifact" ? fe(e.data.envelope) : e.data.type === "capabilities" ? (se = e.data.explain, U = e.data.installedTool) : e.data.type === "clear" ? ut(e.data.message) : (a = Pe(a, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = a.foldDetail, f.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, re(), h && (H(), F(), N(), G(ae()))));
  }, He = (e) => {
    k.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, Re = (e) => He(e.message || "Unknown runtime error"), Be = (e) => He(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", qe), window.addEventListener("error", Re), window.addEventListener("unhandledrejection", Be);
  const Ve = typeof MutationObserver == "function" ? new MutationObserver(() => Ne(ve())) : void 0;
  Ve?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Fe = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, Ye = () => Ne(ve());
  Fe?.addEventListener("change", Ye), T.addEventListener("click", () => Ge(!a.optionsHidden)), H(), re();
  for (const e of g) fe(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), g.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: fe, getState: () => a, destroy: () => {
    B(), Y(), window.removeEventListener("message", qe), window.removeEventListener("error", Re), window.removeEventListener("unhandledrejection", Be), window.removeEventListener("pointerdown", Me), Ve?.disconnect(), Fe?.removeEventListener("change", Ye), n.replaceChildren();
  } };
}
const Ht = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Ht as CONTENT_SECURITY_POLICY,
  I as EnvelopeError,
  ge as HOST_PROTOCOL_VERSION,
  Nt as PROTOCOL_VERSION,
  Ct as initialViewState,
  At as isHostResponse,
  qt as mountViewer,
  gt as parseEnvelope,
  Ze as sanitizeSvg,
  Pe as updateViewState,
  jt as windowHostBridge
};
//# sourceMappingURL=index.js.map
