const jt = 1;
class x extends Error {
}
const L = (n) => typeof n == "object" && n !== null && !Array.isArray(n), F = (n, i, y = []) => {
  const c = /* @__PURE__ */ new Set([...i, ...y]);
  return i.every((m) => m in n) && Object.keys(n).every((m) => c.has(m));
}, ye = (n) => Array.isArray(n) && n.every((i) => typeof i == "string"), gt = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function Ie(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(Ie));
  if (L(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([i, y]) => [i, Ie(y)])));
  throw new x("Evidence contains a non-JSON value");
}
function Xe(n) {
  if (n !== void 0) {
    if (!L(n) || !F(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new x("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((i) => i === ".." || i === ".")) throw new x("Invalid source location");
    for (const i of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[i]) || n[i] < 0) throw new x("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new x("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function vt(n) {
  if (!L(n) || !F(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["edges", "folded"])) throw new x("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new x(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const i = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!L(n.run) || !F(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !L(n.run.root) || !F(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !L(n.run.tool) || !F(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !i.has(n.run.outcome)) throw new x("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new x("Invalid SVG");
  const y = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new x("Invalid folded drawings");
    for (const d of n.folded) {
      if (!L(d) || !F(d, ["depth", "svg"]) || !Number.isInteger(d.depth) || d.depth < 1 || typeof d.svg != "string" || !d.svg.trim()) throw new x("Invalid folded drawing");
      y.push(Object.freeze({ depth: d.depth, svg: d.svg }));
    }
  }
  if (!L(n.elements)) throw new x("Invalid element index");
  const c = /* @__PURE__ */ Object.create(null);
  for (const [d, p] of Object.entries(n.elements)) {
    if (!L(p) || !["id", "kind", "label", "evidence", "diagnosticIds"].every(($) => $ in p) || !L(p.evidence)) throw new x(`Invalid element: ${d}`);
    if (p.id !== d || typeof p.id != "string" || !p.id || typeof p.kind != "string" || !p.kind || typeof p.label != "string" || !p.label || typeof p.evidence.verdict != "string" || !ye(p.evidence.statuses) || typeof p.evidence.reused != "boolean" || p.evidence.state !== void 0 && !gt.has(p.evidence.state) || !ye(p.diagnosticIds) || p.parentId !== void 0 && typeof p.parentId != "string" || p.declaration !== void 0 && typeof p.declaration != "string" || p.limitations !== void 0 && !ye(p.limitations)) throw new x(`Invalid element: ${d}`);
    const E = Ie(p.evidence);
    c[d] = Object.freeze({ id: d, kind: p.kind, label: p.label, evidence: E, diagnosticIds: Object.freeze([...p.diagnosticIds]), ...p.parentId === void 0 ? {} : { parentId: p.parentId }, ...p.declaration === void 0 ? {} : { declaration: p.declaration }, ...p.limitations === void 0 ? {} : { limitations: Object.freeze([...p.limitations]) }, ...p.source === void 0 ? {} : { source: Xe(p.source) } });
  }
  for (const d of Object.values(c)) if (d.parentId && !c[d.parentId]) throw new x(`Unknown parent: ${d.parentId}`);
  const m = /* @__PURE__ */ new Set();
  for (const d of Object.values(c)) {
    const p = /* @__PURE__ */ new Set();
    let E = d;
    for (; E && !m.has(E.id); ) {
      if (p.has(E.id)) throw new x(`Element nesting forms a cycle: ${E.id}`);
      p.add(E.id), E = E.parentId ? c[E.parentId] : void 0;
    }
    for (const $ of p) m.add($);
  }
  const v = [], g = /* @__PURE__ */ new Set();
  if (n.edges !== void 0) {
    if (!Array.isArray(n.edges)) throw new x("Invalid edge list");
    for (const d of n.edges) {
      if (!L(d) || !F(d, ["id", "fromId", "toId", "kind", "label"]) || typeof d.id != "string" || !d.id || d.id in c || g.has(d.id) || typeof d.fromId != "string" || !d.fromId || typeof d.toId != "string" || !d.toId || typeof d.kind != "string" || !d.kind || typeof d.label != "string" || !d.label) throw new x("Invalid edge");
      if (!c[d.fromId] || !c[d.toId]) throw new x("Unknown edge endpoint");
      g.add(d.id), v.push(Object.freeze({ id: d.id, fromId: d.fromId, toId: d.toId, kind: d.kind, label: d.label }));
    }
  }
  if (!Array.isArray(n.diagnostics)) throw new x("Invalid diagnostics");
  const w = [], I = /* @__PURE__ */ new Set();
  for (const d of n.diagnostics) {
    if (!L(d) || typeof d.id != "string" || !d.id || I.has(d.id) || typeof d.code != "string" || !d.code || typeof d.severity != "string" || !d.severity || typeof d.message != "string" || !d.message || d.elementId !== void 0 && typeof d.elementId != "string") throw new x("Invalid diagnostic");
    I.add(d.id), w.push(Object.freeze({ id: d.id, code: d.code, severity: d.severity, message: d.message, ...d.elementId === void 0 ? {} : { elementId: d.elementId }, ...d.source === void 0 ? {} : { source: Xe(d.source) } }));
  }
  for (const d of Object.values(c)) for (const p of d.diagnosticIds ?? []) if (!I.has(p)) throw new x(`Unknown diagnostic: ${p}`);
  for (const d of w) if (d.elementId && !c[d.elementId]) throw new x(`Unknown diagnostic element: ${d.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(c), edges: Object.freeze(v), diagnostics: Object.freeze(w), folded: Object.freeze(y) });
}
const bt = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), wt = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), It = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ze = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, xt = {
  fill: Ze,
  stroke: Ze,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, Et = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function St(n) {
  let i = n, y = "";
  for (; ; ) {
    const c = i.search(/@media\b/i);
    if (c < 0) return { base: i, darkBody: y };
    const m = i.indexOf("{", c);
    if (m < 0) return { base: i.slice(0, c), darkBody: y };
    const v = i.slice(c, m).trim();
    let g = 0, w = m;
    for (; w < i.length; w += 1)
      if (i[w] === "{") g += 1;
      else if (i[w] === "}" && --g === 0) break;
    Et.test(v) && (y += `${i.slice(m + 1, w)}
`), i = i.slice(0, c) + i.slice(Math.min(w + 1, i.length));
  }
}
function kt(n, i) {
  if (!n.trim() || n.length > 32768) return;
  const { base: y, darkBody: c } = St(n), m = i ? `${y}
${c}` : y, v = /\s*([^{}]+)\{([^{}]*)\}/gy, g = [];
  let w = 0;
  for (; w < m.length; ) {
    v.lastIndex = w;
    const I = v.exec(m);
    if (!I) return m.slice(w).trim() === "" ? g : void 0;
    w = v.lastIndex;
    const d = I[1], p = I[2];
    if (d === void 0 || p === void 0) return;
    const E = d.split(",").map((T) => T.trim());
    if (!E.every((T) => It.test(T))) return;
    const $ = [];
    for (const T of p.split(";")) {
      const M = T.indexOf(":");
      if (M < 1) continue;
      const z = T.slice(0, M).trim().toLowerCase(), q = T.slice(M + 1).trim();
      xt[z]?.test(q) === !0 && $.push([z, q]);
    }
    $.length && g.push({ selectors: E, declarations: $ });
  }
  return g;
}
function Pe(n, i = {}) {
  const y = i.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const c = new DOMParser().parseFromString(n, "image/svg+xml");
  if (c.querySelector("parsererror") || c.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const m of [...c.querySelectorAll("*")]) {
    if (m.localName.toLowerCase() === "style") {
      const v = kt(m.textContent ?? "", y);
      if (v) for (const g of v) for (const w of g.selectors)
        for (const I of [...c.documentElement.querySelectorAll(w)])
          for (const [d, p] of g.declarations) I.setAttribute(d, p);
      m.remove();
      continue;
    }
    if (bt.has(m.localName.toLowerCase())) {
      m.remove();
      continue;
    }
    for (const v of [...m.attributes]) {
      const g = v.name.toLowerCase(), w = v.value.trim().toLowerCase(), I = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(w);
      (g.startsWith("on") || g === "style" || I || wt.has(g) && w !== "" && !w.startsWith("#")) && m.removeAttribute(v.name);
    }
  }
  return new XMLSerializer().serializeToString(c.documentElement);
}
const ge = 1, qt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function At(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n, y = i.overlays;
  return typeof i.zoom == "number" && Number.isFinite(i.zoom) && typeof i.panX == "number" && Number.isFinite(i.panX) && typeof i.panY == "number" && Number.isFinite(i.panY) && typeof y == "object" && y !== null && typeof y.earned == "boolean" && typeof y.gap == "boolean" && typeof y.violation == "boolean" && (i.detailsHidden === void 0 || typeof i.detailsHidden == "boolean") && (i.runId === void 0 || typeof i.runId == "string") && (i.selectedId === void 0 || typeof i.selectedId == "string") && (i.focusedId === void 0 || typeof i.focusedId == "string") && (i.hoverTooltips === void 0 || typeof i.hoverTooltips == "boolean");
}
function Ct(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n;
  return i.channel === "ply-vis" && i.version === 1 && (i.type === "artifact" && "envelope" in i && typeof i.deliveryId == "string" || i.type === "restore-state" && At(i.state) || i.type === "capabilities" && typeof i.explain == "boolean" || i.type === "clear" && typeof i.message == "string");
}
const Lt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, optionsHidden: !1, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), We = (n, i) => Object.freeze({ ...n, ...i, overlays: Object.freeze({ ...n.overlays, ...i.overlays }) });
function* ve(n, i) {
  const y = /* @__PURE__ */ new Set();
  let c = n;
  for (; c && !y.has(c.id); )
    y.add(c.id), yield c, c = c.parentId ? i[c.parentId] : void 0;
}
function Ot(n, i, y = 0.5) {
  return i.x >= n.x - y && i.y >= n.y - y && i.x + i.width <= n.x + n.width + y && i.y + i.height <= n.y + n.height + y;
}
function $t(n, i, y = {}) {
  const c = y.margin ?? 24, m = y.minZoom ?? 0.2, v = y.maxZoom ?? 4, g = Math.max(1, n.width - c * 2), w = Math.max(1, n.height - c * 2), I = Math.max(1, i.width), d = Math.max(1, i.height), p = Math.min(v, Math.max(m, Math.min(g / I, w / d)));
  return {
    zoom: p,
    panX: n.width / 2 - (i.x + I / 2) * p,
    panY: n.height / 2 - (i.y + d / 2) * p
  };
}
function Tt(n, i, y) {
  return {
    zoom: i,
    panX: y.x - (y.x - n.panX) / n.zoom * i,
    panY: y.y - (y.y - n.panY) / n.zoom * i
  };
}
const Mt = 500, zt = 160, Ue = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), Dt = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function be() {
  const n = typeof document < "u" ? document.body : void 0, i = n?.dataset.vscodeThemeKind;
  if (i !== void 0) return Ue.has(i);
  if (n) {
    for (const y of Ue) if (n.classList.contains(y)) return !0;
    for (const y of Dt) if (n.classList.contains(y)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const we = (n, i) => `<button type="button" aria-label="${n}" title="${n}">${i}</button>`, Nt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${we("Zoom out", "−")}${we("Zoom in", "+")}${we("Fit canvas", "Fit")}
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
function Ht(n, i, y = []) {
  n.innerHTML = Nt;
  const c = n.querySelector(".ply-vis"), m = c.querySelector(".ply-canvas"), v = c.querySelector(".ply-stage"), g = c.querySelector(".ply-tooltip"), w = c.querySelector(".ply-context-menu"), I = c.querySelector(".ply-inspector"), d = c.querySelector(".ply-inspector-toggle"), p = c.querySelector(".ply-workspace"), E = c.querySelector(".ply-status"), $ = c.querySelector(".ply-toolbar [data-evidence-filters]"), T = c.querySelector(".ply-options"), M = c.querySelector(".ply-options-toggle"), z = c.querySelector(".ply-breadcrumbs"), q = c.querySelector(".ply-provenance");
  let a = Lt(), h, ee = /* @__PURE__ */ new Map(), te, W = be(), H;
  const ne = /* @__PURE__ */ new Set();
  let C, xe = 0, A, U, ie, se = !1, G;
  const Ee = () => i.post({ channel: "ply-vis", version: ge, type: "persist-state", state: a }), O = (e, t = !0) => {
    a = We(a, e), t && Ee();
  }, Y = () => {
    v.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, Ge = () => h ? Object.values(h.elements).filter((e) => !a.focusedId || e.id === a.focusedId || de(e, a.focusedId, h.elements)) : [];
  function R() {
    I.hidden = a.detailsHidden, p.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    d.setAttribute("aria-label", e), d.title = e, d.setAttribute("aria-expanded", String(!a.detailsHidden)), d.textContent = a.detailsHidden ? "‹" : "›";
  }
  function re() {
    T.hidden = a.optionsHidden;
    const e = a.optionsHidden ? "Show options" : "Hide options";
    M.setAttribute("aria-label", e), M.title = e, M.setAttribute("aria-expanded", String(!a.optionsHidden)), M.textContent = a.optionsHidden ? "⌄" : "⌃";
  }
  function Ke(e, t = !0) {
    O({ optionsHidden: e }, t), re();
  }
  function Se(e, t = !0) {
    O({ detailsHidden: e }, t), R();
  }
  function ke(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  function Je(e) {
    if (e.run.tool.version === "render" || Object.values(e.elements).every((l) => ke(l) === "declared")) return { text: "Promises only — no run has checked this yet, so nothing here can ever be green." };
    const o = `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, s = e.run.tool.version;
    return G !== void 0 && /^[0-9a-f]{64}$/.test(s) && /^[0-9a-f]{64}$/.test(G) && s !== G ? {
      text: `${o} Ply itself has changed since this run, so nothing here would be carried forward — every check would run again.`,
      title: `Run ${e.run.id}
Ran by ${s}
Installed ${G}`
    } : { text: o, title: `Run ${e.run.id}` };
  }
  function de(e, t, o) {
    for (const s of ve(e.parentId ? o[e.parentId] : void 0, o)) if (s.id === t) return !0;
    return !1;
  }
  function Qe(e) {
    let t = 0, o = e;
    for (const s of ve(e, h?.elements ?? {})) {
      if (o = s, !s.parentId || s.id === a.focusedId) break;
      t += 1;
    }
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const Ae = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function et() {
    if (z.replaceChildren(), !h) return;
    const e = [];
    for (const o of ve(a.focusedId ? h.elements[a.focusedId] : void 0, h.elements)) {
      if (!o.parentId) break;
      e.unshift(o);
    }
    const t = document.createElement("button");
    t.type = "button", t.textContent = "Workspace", t.dataset.focusId = "", z.append(t);
    for (const o of e) {
      const s = document.createElement("button");
      s.type = "button", s.textContent = o.label, s.dataset.focusId = o.id, z.append(s);
    }
  }
  function _(e) {
    I.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", I.append(t), !e || !h) {
      const u = document.createElement("p");
      u.textContent = "Select an item to inspect its declaration and evidence.", I.append(u);
      return;
    }
    if ("fromId" in e) {
      I.append(D("Type", [e.kind])), I.append(D("From", [h.elements[e.fromId].label])), I.append(D("To", [h.elements[e.toId].label]));
      return;
    }
    const o = e, s = o.declaration?.split(`
`).filter(Boolean);
    I.append(D("Declaration", s?.length ? s : ["No declaration text supplied."])), I.append(D("Verdict", [o.evidence.verdict])), I.append(D("Statuses", o.evidence.statuses.length ? o.evidence.statuses : ["No statuses supplied."]));
    const r = Object.entries(o.evidence).filter(([u]) => !["verdict", "statuses"].includes(u)).map(([u, S]) => `${u}: ${typeof S == "string" ? S : JSON.stringify(S)}`);
    I.append(D("Earned evidence", r.length ? r : ["No additional evidence details supplied."])), I.append(D("Limitations", o.limitations?.length ? o.limitations : ["No limitations supplied."]));
    const l = new Map(h.diagnostics.map((u) => [u.id, u])), b = o.diagnosticIds.map((u) => l.get(u)).filter((u) => u !== void 0).map((u) => `${u.code} — ${u.severity}: ${u.message}`);
    if (I.append(D("Diagnostics", b.length ? b : ["No diagnostics supplied."])), I.append(tt(h.run)), o.source) {
      const u = document.createElement("button");
      u.type = "button", u.className = "ply-source", u.textContent = `Open ${o.source.file}:${o.source.startLine + 1}:${o.source.startColumn + 1}`, u.addEventListener("click", () => i.post({ channel: "ply-vis", version: 1, type: "navigate", source: o.source })), I.append(u);
    }
  }
  function D(e, t) {
    const o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = e, o.append(s);
    const r = document.createElement("ul");
    for (const l of t) {
      const f = document.createElement("li");
      f.textContent = l, r.append(f);
    }
    return o.append(r), o;
  }
  function tt(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), s = document.createElement("h3");
    s.textContent = "Run details";
    const r = document.createElement("dl"), l = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [f, b] of l) {
      const u = document.createElement("dt");
      u.textContent = f;
      const S = document.createElement("dd");
      S.textContent = b, r.append(u, S);
    }
    return o.append(s, r), o;
  }
  function K(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function nt(e) {
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
  function B(e) {
    return Q(e) ?? J(e);
  }
  function ae() {
    if (!(!h || !a.selectedId))
      return ee.get(a.selectedId) ?? h.elements[a.selectedId];
  }
  function Ce(e) {
    return h ? `${e.kind}: ${e.label}; from ${h.elements[e.fromId].label} to ${h.elements[e.toId].label}` : e.label;
  }
  function ot(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(g.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function Le(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== g.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function it(e) {
    return g.scrollHeight <= g.clientHeight ? !1 : e > 0 ? g.scrollTop + g.clientHeight < g.scrollHeight : e < 0 ? g.scrollTop > 0 : !1;
  }
  function V() {
    U !== void 0 && window.clearTimeout(U), U = void 0;
  }
  function k() {
    A && Le(A), V(), A = void 0, g.hidden = !0, g.replaceChildren();
  }
  function st(e, t) {
    if (!h) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const s = Object.entries(e.evidence).filter(([f, b]) => !["verdict", "statuses"].includes(f) && b !== !1 && b !== void 0).map(([f, b]) => `${f}: ${typeof b == "string" ? b : JSON.stringify(b)}`);
    o.push(...s), o.push(...(e.limitations ?? []).map((f) => `Limitation: ${f}`));
    const r = new Map(h.diagnostics.map((f) => [f.id, f]));
    for (const f of e.diagnosticIds) {
      const b = r.get(f);
      b && o.push(`${b.code} — ${b.severity}: ${b.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const l = t.dataset.plyTitle?.trim();
    return l && l !== e.label && !o.includes(l) && o.push(l), o;
  }
  function Oe(e, t) {
    const o = m.getBoundingClientRect(), s = 8;
    g.style.maxHeight = `${Math.max(0, o.height - s * 2)}px`;
    const r = 12, l = g.offsetWidth, f = g.offsetHeight, b = Math.max(s, o.width - l - s), u = Math.max(s, o.height - f - s), S = e - o.left + r, P = t - o.top + r, he = P + f <= o.height - s ? P : t - o.top - f - r;
    g.style.left = `${Math.min(b, Math.max(s, S))}px`, g.style.top = `${Math.min(u, Math.max(s, he))}px`;
  }
  function $e(e, t, o) {
    const s = J(e), r = Q(e), l = e.dataset.plyTitle?.trim();
    if (!s && !r && !l || e.hasAttribute("hidden")) {
      k();
      return;
    }
    A && A !== e && Le(A), A = e;
    const f = document.createElement("span");
    if (r) {
      const u = document.createElement("strong");
      u.textContent = r.label, f.textContent = Ce(r), g.replaceChildren(u, f);
    } else if (s) {
      const u = document.createElement("strong");
      u.textContent = s.label, f.textContent = st(s, e).join(`
`), g.replaceChildren(u, f);
    } else
      f.textContent = l, g.replaceChildren(f);
    g.hidden = !1, ot(e);
    const b = e.getBoundingClientRect();
    Oe(t ?? b.left + b.width / 2, o ?? b.bottom);
  }
  function Te(e, t, o) {
    V(), A && A !== e && k(), U = window.setTimeout(() => {
      U = void 0, $e(e, t, o);
    }, Mt);
  }
  function rt(e, t, o) {
    const s = m.getBoundingClientRect(), r = 8, l = Math.max(r, s.width - e.offsetWidth - r), f = Math.max(r, s.height - e.offsetHeight - r);
    e.style.left = `${Math.min(l, Math.max(r, t - s.left))}px`, e.style.top = `${Math.min(f, Math.max(r, o - s.top))}px`;
  }
  function N() {
    if (w.hidden) return;
    const e = w.contains(document.activeElement), t = ie;
    w.hidden = !0, w.replaceChildren(), ie = void 0, e && (t?.isConnected ? t : m).focus();
  }
  function Me() {
    return [...w.querySelectorAll('button[role="menuitem"]')];
  }
  function ce(e) {
    const t = Me();
    if (!t.length) return;
    for (const s of t) s.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function dt(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? B(t) : void 0, s = o && !("fromId" in o) ? o : void 0, r = [];
    if (s && r.push({ label: `Zoom into ${s.label}`, run: () => Z(s.id) }), a.focusedId && r.push({ label: "Back to Workspace", run: () => Z(void 0) }), h) {
      const f = new Map(h.diagnostics.map((b) => [b.id, b]));
      for (const b of se ? s?.diagnosticIds ?? [] : []) {
        const u = f.get(b)?.code;
        u && r.push({ label: `Explain ${u}`, run: () => i.post({ channel: "ply-vis", version: ge, type: "explain", code: u }) });
      }
    }
    if (t && se && r.push({ label: "Explain a code…", run: () => i.post({ channel: "ply-vis", version: ge, type: "explain-prompt" }) }), !r.length) return;
    e.preventDefault(), k();
    const l = document.activeElement;
    ie = l instanceof HTMLElement || l instanceof SVGElement ? l : void 0, w.replaceChildren();
    for (const f of r) {
      const b = document.createElement("li");
      b.setAttribute("role", "presentation");
      const u = document.createElement("button");
      u.type = "button", u.setAttribute("role", "menuitem"), u.textContent = f.label, u.tabIndex = -1, u.addEventListener("click", () => {
        N(), f.run();
      }), b.append(u), w.append(b);
    }
    w.hidden = !1, rt(w, e.clientX, e.clientY), ce(0);
  }
  w.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), N();
      return;
    }
    const o = Me().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), ce(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), ce(o - 1));
  }), m.addEventListener("contextmenu", dt);
  const ze = (e) => {
    !w.hidden && e.target instanceof Node && !w.contains(e.target) && N();
  };
  window.addEventListener("pointerdown", ze);
  function j() {
    if (!h) return;
    ft();
    const e = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? h.elements[a.focusedId] : void 0;
    for (const r of e) {
      const l = r.dataset.elementId ?? r.dataset.plyId ?? "", f = h.elements[l], b = Q(r);
      if (b) {
        r.removeAttribute("hidden"), r.setAttribute("role", "button"), r.setAttribute("aria-label", Ce(b)), r.classList.toggle("is-selected", b.id === a.selectedId);
        continue;
      }
      if (!f) {
        r.removeAttribute("hidden");
        continue;
      }
      const u = ke(f), S = u === "declared" || a.overlays[u], P = t ? de(t, f.id, h.elements) : !1, he = !a.focusedId || f.id === a.focusedId || de(f, a.focusedId, h.elements) || P, ht = P || Qe(f) <= Ae();
      r.toggleAttribute("hidden", !he || !ht || !S && !P);
      const yt = [f.evidence.verdict, ...f.evidence.statuses].filter(Boolean).join(", ") || "declared";
      r.setAttribute("role", "button"), r.setAttribute("aria-label", `${f.kind}: ${f.label}; ${yt}`), r.dataset.state = u, r.classList.toggle("is-selected", f.id === a.selectedId), r === A && (r.hasAttribute("hidden") || !r.isConnected) && k();
    }
    at();
    const o = e.filter((r) => !r.hasAttribute("hidden") && B(r)), s = o.find((r) => B(r)?.id === a.selectedId) ?? o[0];
    for (const r of e) r.setAttribute("tabindex", r === s ? "0" : "-1");
    et();
  }
  function at() {
    const e = v.querySelector("svg");
    if (!e) return;
    for (const r of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      r.removeAttribute("hidden"), r.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => J(r)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), s = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const r of [...e.children]) {
      if (!(r instanceof SVGElement) || r.matches("defs, style, title") || r.matches("[data-element-id], [data-ply-id]") && !Q(r) || r.contains(t)) continue;
      const l = r;
      if (typeof l.getBBox != "function") continue;
      let f;
      try {
        f = l.getBBox();
      } catch {
        continue;
      }
      Ot(s, f) || (r.setAttribute("hidden", ""), r.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function ct(e) {
    X(), h = e, ee = new Map(e.edges.map((r) => [r.id, r])), O({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    $.hidden = !t, z.hidden = !t, d.hidden = !t, t || Se(!0, !1), R(), k(), N(), H = void 0, le(e.svg), m.dataset.empty = "false";
    const o = m.querySelector(".ply-empty");
    o && o.remove(), Y(), j(), _(ae());
    const s = Je(e);
    q.textContent = s.text, s.title ? q.title = s.title : q.removeAttribute("title"), E.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => ue(!1));
  }
  function le(e) {
    v.innerHTML = e;
    for (const t of [...v.querySelectorAll("title")]) {
      const o = t.parentElement, s = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), r = t.textContent?.trim();
      s && r && (s.dataset.plyTitle = r, J(s) || (s.setAttribute("tabindex", "0"), s.setAttribute("role", "img"), s.setAttribute("aria-label", r))), t.remove();
    }
  }
  function X() {
    for (const e of ne) e.cancel();
    ne.clear();
  }
  function De() {
    const e = /* @__PURE__ */ new Map();
    for (const t of v.querySelectorAll("[data-element-id], [data-ply-id]")) {
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
  function lt(e) {
    if (typeof Element > "u" || typeof Element.prototype.animate != "function" || typeof KeyframeEffect != "function") return;
    try {
      if (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch {
      return;
    }
    const t = De();
    if (!t || !Number.isFinite(a.zoom) || a.zoom <= 0) return;
    const o = a.zoom;
    for (const s of v.querySelectorAll("[data-element-id], [data-ply-id]")) {
      const r = s.dataset.elementId ?? s.dataset.plyId, l = r ? e.get(r) : void 0, f = r ? t.get(r) : void 0;
      if (!l || !f || l.width <= 0 || l.height <= 0 || f.width <= 0 || f.height <= 0) continue;
      const b = l.width / f.width, u = l.height / f.height;
      if (![b, u].every(Number.isFinite)) continue;
      let S;
      try {
        if (S = s.animate([
          { transform: `translate(${(l.left - f.left) / o}px, ${(l.top - f.top) / o}px) scale(${b}, ${u})`, transformOrigin: "0 0" },
          { transform: "none", transformOrigin: "0 0" }
        ], { duration: zt, easing: "ease-out", composite: "add" }), !(S.effect instanceof KeyframeEffect) || S.effect.composite !== "add") {
          S.cancel();
          continue;
        }
      } catch {
        continue;
      }
      ne.add(S), S.onfinish = S.oncancel = () => ne.delete(S);
    }
  }
  function ft() {
    if (!h) return;
    const e = a.focusedId ? void 0 : pt();
    if (e === H) return;
    const t = e === void 0 ? h.svg : h.folded.find((s) => s.depth === e)?.svg;
    if (!t) {
      H = e;
      return;
    }
    k(), N(), X();
    const o = De();
    le(t), H = e, o && !a.focusedId && lt(o);
  }
  function pt() {
    if (!h) return;
    const e = Ae();
    if (Number.isFinite(e))
      return h.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function Ne(e) {
    return Object.freeze({
      ...e,
      svg: Pe(e.svg, { prefersDark: W }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Pe(t.svg, { prefersDark: W }) })))
    });
  }
  function fe(e, t) {
    try {
      const o = vt(e), s = Ne(o);
      return te = o, ct(s), delete c.dataset.error, t !== void 0 && i.post({
        channel: "ply-vis",
        version: 1,
        type: "artifact-accepted",
        deliveryId: t
      }), !0;
    } catch (o) {
      const s = o instanceof x || o instanceof Error ? o.message : "Unknown artifact error";
      return E.textContent = `Artifact rejected: ${s}. The previous snapshot is unchanged.`, c.dataset.error = "true", i.post({ channel: "ply-vis", version: 1, type: "error", message: s }), !1;
    }
  }
  function je(e) {
    if (e === W || !te) {
      W = e;
      return;
    }
    W = e, h = Ne(te), k(), N(), X();
    const t = H === void 0 ? h.svg : h.folded.find((o) => o.depth === H)?.svg ?? h.svg;
    le(t), j(), Y(), _(ae());
  }
  function oe(e) {
    const t = h && (ee.get(e) ?? h.elements[e]);
    t && (O({ selectedId: e, detailsHidden: !1 }), R(), j(), _(t));
  }
  function qe(e) {
    [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => B(o)?.id === e)?.focus();
  }
  function Z(e) {
    e && !h?.elements[e] || (e && !h.elements[e].parentId && (e = void 0), k(), N(), O({ focusedId: e, selectedId: e, detailsHidden: !e }), R(), j(), _(e ? h?.elements[e] : void 0), ue());
  }
  function ut() {
    const e = m.getBoundingClientRect(), o = (a.selectedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((s) => B(s)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function pe(e, t) {
    k(), N(), X(), t ??= ut(), O(Tt(a, Math.min(4, Math.max(0.2, e)), t)), Y(), j(), E.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function ue(e = !0) {
    X();
    const t = v.querySelector("svg");
    if (!t) return;
    const o = a.focusedId ? [...v.querySelectorAll("[data-element-id], [data-ply-id]")].find((b) => J(b)?.id === a.focusedId) : t;
    if (!o) return;
    e && (E.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
    const s = v.getBoundingClientRect(), r = o.getBoundingClientRect(), l = a.zoom || 1, f = {
      x: (r.left - s.left) / l,
      y: (r.top - s.top) / l,
      width: r.width / l,
      height: r.height / l
    };
    O($t({ width: m.clientWidth, height: m.clientHeight }, f)), Y(), j();
  }
  c.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => pe(a.zoom * 1.2)), c.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => pe(a.zoom / 1.2)), c.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => ue()), d.addEventListener("click", () => Se(!a.detailsHidden)), c.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    O({ overlays: { ...a.overlays, [t]: e.checked } }), j();
  })), c.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    O({ foldDetail: e.target.checked }), j(), E.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), c.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    O({ hoverTooltips: t }), t || (V(), A && document.activeElement !== A && k()), E.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), z.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && Z(t.dataset.focusId || void 0);
  }), v.addEventListener("click", (e) => {
    if (performance.now() < xe) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && B(t);
    o && oe(o.id);
  }), v.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t && B(t);
    o && !("fromId" in o) && Z(o.id);
  }), v.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = K(e.target);
    t && Te(t, e.clientX, e.clientY);
  }), v.addEventListener("pointermove", (e) => {
    if (!a.hoverTooltips) {
      V();
      return;
    }
    const t = K(e.target);
    if (!t) {
      V();
      return;
    }
    t === A && !g.hidden ? Oe(e.clientX, e.clientY) : Te(t, e.clientX, e.clientY);
  }), v.addEventListener("pointerout", (e) => {
    const t = K(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || g.contains(e.relatedTarget)) || t.contains(document.activeElement) || k();
  }), v.addEventListener("focusin", (e) => {
    const t = K(e.target);
    t && (!a.hoverTooltips && !nt(t) || (V(), $e(t)));
  }), v.addEventListener("focusout", (e) => {
    const t = K(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || k();
  }), g.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && A?.contains(e.relatedTarget) || k();
  }), g.addEventListener("wheel", (e) => {
    if (it(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    k();
  }, { passive: !0 }), g.addEventListener("pointerdown", (e) => e.stopPropagation()), m.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = m.getBoundingClientRect();
    pe(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    e.button === 0 && (C = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), m.addEventListener("pointermove", (e) => {
    if (!C) return;
    const t = e.clientX - C.x, o = e.clientY - C.y;
    if (!(!C.moved && Math.hypot(t, o) < 3)) {
      if (!C.moved) {
        C.moved = !0, m.classList.add("is-panning");
        try {
          m.setPointerCapture(C.pointerId);
        } catch {
        }
      }
      e.preventDefault(), O({ panX: C.panX + t, panY: C.panY + o }, !1), Y();
    }
  });
  const me = () => {
    C && (C.moved && (xe = performance.now() + 250, Ee()), C = void 0, m.classList.remove("is-panning"));
  };
  m.addEventListener("pointerup", me), m.addEventListener("pointercancel", me), m.addEventListener("lostpointercapture", me), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !g.hidden) {
      e.preventDefault(), k();
      return;
    }
    const t = [...v.querySelectorAll("[data-element-id], [data-ply-id]")], o = new Set(t.filter((l) => !l.hasAttribute("hidden") && Q(l)).map((l) => l.dataset.elementId ?? l.dataset.plyId)), s = [...Ge(), ...(h?.edges ?? []).filter((l) => o.has(l.id))];
    if (!s.length) return;
    const r = Math.max(0, s.findIndex((l) => l.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const l = s[(r + 1) % s.length].id;
      oe(l), qe(l);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const l = s[(r - 1 + s.length) % s.length].id;
      oe(l), qe(l);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const l = s[r];
      "fromId" in l ? oe(l.id) : Z(l.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const l = a.focusedId ? h?.elements[a.focusedId]?.parentId : void 0;
      Z(l);
    }
  });
  function mt(e) {
    h = void 0, te = void 0, H = void 0, a = { ...a, selectedId: void 0, focusedId: void 0, detailsHidden: !0 }, v.innerHTML = "", k(), N(), m.dataset.empty = "true";
    const t = m.querySelector(".ply-empty");
    if (t) t.textContent = e;
    else {
      const o = document.createElement("p");
      o.className = "ply-empty", o.textContent = e, m.append(o);
    }
    z.hidden = !0, d.hidden = !0, _(void 0), R(), q.textContent = "", q.removeAttribute("title"), E.textContent = "";
  }
  const He = (e) => {
    Ct(e.data) && (e.data.type === "artifact" ? fe(e.data.envelope, e.data.deliveryId) : e.data.type === "capabilities" ? (se = e.data.explain, G = e.data.installedTool) : e.data.type === "clear" ? mt(e.data.message) : (a = We(a, e.data.state), c.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), c.querySelector("[data-fold-detail]").checked = a.foldDetail, c.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, re(), h && (R(), Y(), j(), _(ae()))));
  }, Re = (e) => {
    E.textContent = `Viewer error: ${e}`, i.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, Be = (e) => Re(e.message || "Unknown runtime error"), Ve = (e) => Re(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", He), window.addEventListener("error", Be), window.addEventListener("unhandledrejection", Ve);
  const Fe = typeof MutationObserver == "function" ? new MutationObserver(() => je(be())) : void 0;
  Fe?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Ye = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, _e = () => je(be());
  Ye?.addEventListener("change", _e), M.addEventListener("click", () => Ke(!a.optionsHidden)), R(), re();
  for (const e of y) fe(e);
  return i.post({ channel: "ply-vis", version: 1, type: "ready" }), y.length || i.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: fe, getState: () => a, destroy: () => {
    V(), X(), window.removeEventListener("message", He), window.removeEventListener("error", Be), window.removeEventListener("unhandledrejection", Ve), window.removeEventListener("pointerdown", ze), Fe?.disconnect(), Ye?.removeEventListener("change", _e), n.replaceChildren();
  } };
}
const Rt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Rt as CONTENT_SECURITY_POLICY,
  x as EnvelopeError,
  ge as HOST_PROTOCOL_VERSION,
  jt as PROTOCOL_VERSION,
  Lt as initialViewState,
  Ct as isHostResponse,
  Ht as mountViewer,
  vt as parseEnvelope,
  Pe as sanitizeSvg,
  We as updateViewState,
  qt as windowHostBridge
};
//# sourceMappingURL=index.js.map
