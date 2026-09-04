const gt = 1;
class b extends Error {
}
const k = (n) => typeof n == "object" && n !== null && !Array.isArray(n), B = (n, i, p = []) => {
  const f = /* @__PURE__ */ new Set([...i, ...p]);
  return i.every((u) => u in n) && Object.keys(n).every((u) => f.has(u));
}, se = (n) => Array.isArray(n) && n.every((i) => typeof i == "string"), Je = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function ae(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(ae));
  if (k(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([i, p]) => [i, ae(p)])));
  throw new b("Evidence contains a non-JSON value");
}
function Te(n) {
  if (n !== void 0) {
    if (!k(n) || !B(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new b("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((i) => i === ".." || i === ".")) throw new b("Invalid source location");
    for (const i of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[i]) || n[i] < 0) throw new b("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new b("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function Qe(n) {
  if (!k(n) || !B(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["folded"])) throw new b("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new b(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const i = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!k(n.run) || !B(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !k(n.run.root) || !B(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !k(n.run.tool) || !B(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !i.has(n.run.outcome)) throw new b("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new b("Invalid SVG");
  const p = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new b("Invalid folded drawings");
    for (const s of n.folded) {
      if (!k(s) || !B(s, ["depth", "svg"]) || !Number.isInteger(s.depth) || s.depth < 1 || typeof s.svg != "string" || !s.svg.trim()) throw new b("Invalid folded drawing");
      p.push(Object.freeze({ depth: s.depth, svg: s.svg }));
    }
  }
  if (!k(n.elements)) throw new b("Invalid element index");
  const f = {};
  for (const [s, c] of Object.entries(n.elements)) {
    if (!k(c) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in c) || !k(c.evidence)) throw new b(`Invalid element: ${s}`);
    if (c.id !== s || typeof c.id != "string" || !c.id || typeof c.kind != "string" || !c.kind || typeof c.label != "string" || !c.label || typeof c.evidence.verdict != "string" || !se(c.evidence.statuses) || typeof c.evidence.reused != "boolean" || c.evidence.state !== void 0 && !Je.has(c.evidence.state) || !se(c.diagnosticIds) || c.parentId !== void 0 && typeof c.parentId != "string" || c.declaration !== void 0 && typeof c.declaration != "string" || c.limitations !== void 0 && !se(c.limitations)) throw new b(`Invalid element: ${s}`);
    const v = ae(c.evidence);
    f[s] = Object.freeze({ id: s, kind: c.kind, label: c.label, evidence: v, diagnosticIds: Object.freeze([...c.diagnosticIds]), ...c.parentId === void 0 ? {} : { parentId: c.parentId }, ...c.declaration === void 0 ? {} : { declaration: c.declaration }, ...c.limitations === void 0 ? {} : { limitations: Object.freeze([...c.limitations]) }, ...c.source === void 0 ? {} : { source: Te(c.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new b(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(n.diagnostics)) throw new b("Invalid diagnostics");
  const u = [], h = /* @__PURE__ */ new Set();
  for (const s of n.diagnostics) {
    if (!k(s) || typeof s.id != "string" || !s.id || h.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new b("Invalid diagnostic");
    h.add(s.id), u.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: Te(s.source) } }));
  }
  for (const s of Object.values(f)) for (const c of s.diagnosticIds ?? []) if (!h.has(c)) throw new b(`Unknown diagnostic: ${c}`);
  for (const s of u) if (s.elementId && !f[s.elementId]) throw new b(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), diagnostics: Object.freeze(u), folded: Object.freeze(p) });
}
const et = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), tt = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), nt = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, $e = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, ot = {
  fill: $e,
  stroke: $e,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, it = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function st(n) {
  let i = n, p = "";
  for (; ; ) {
    const f = i.search(/@media\b/i);
    if (f < 0) return { base: i, darkBody: p };
    const u = i.indexOf("{", f);
    if (u < 0) return { base: i.slice(0, f), darkBody: p };
    const h = i.slice(f, u).trim();
    let s = 0, c = u;
    for (; c < i.length; c += 1)
      if (i[c] === "{") s += 1;
      else if (i[c] === "}" && --s === 0) break;
    it.test(h) && (p += `${i.slice(u + 1, c)}
`), i = i.slice(0, f) + i.slice(Math.min(c + 1, i.length));
  }
}
function rt(n, i) {
  if (!n.trim() || n.length > 32768) return;
  const { base: p, darkBody: f } = st(n), u = i ? `${p}
${f}` : p, h = /\s*([^{}]+)\{([^{}]*)\}/gy, s = [];
  let c = 0;
  for (; c < u.length; ) {
    h.lastIndex = c;
    const v = h.exec(u);
    if (!v) return u.slice(c).trim() === "" ? s : void 0;
    c = h.lastIndex;
    const w = v[1], L = v[2];
    if (w === void 0 || L === void 0) return;
    const C = w.split(",").map((E) => E.trim());
    if (!C.every((E) => nt.test(E))) return;
    const Y = [];
    for (const E of L.split(";")) {
      const M = E.indexOf(":");
      if (M < 1) continue;
      const a = E.slice(0, M).trim().toLowerCase(), m = E.slice(M + 1).trim();
      ot[a]?.test(m) === !0 && Y.push([a, m]);
    }
    Y.length && s.push({ selectors: C, declarations: Y });
  }
  return s;
}
function De(n, i = {}) {
  const p = i.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const u of [...f.querySelectorAll("*")]) {
    if (u.localName.toLowerCase() === "style") {
      const h = rt(u.textContent ?? "", p);
      if (h) for (const s of h) for (const c of s.selectors)
        for (const v of [...f.documentElement.querySelectorAll(c)])
          for (const [w, L] of s.declarations) v.setAttribute(w, L);
      u.remove();
      continue;
    }
    if (et.has(u.localName.toLowerCase())) {
      u.remove();
      continue;
    }
    for (const h of [...u.attributes]) {
      const s = h.name.toLowerCase(), c = h.value.trim().toLowerCase(), v = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(c);
      (s.startsWith("on") || s === "style" || v || tt.has(s) && c !== "" && !c.startsWith("#")) && u.removeAttribute(h.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const dt = 1, vt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function at(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n, p = i.overlays;
  return typeof i.zoom == "number" && Number.isFinite(i.zoom) && typeof i.panX == "number" && Number.isFinite(i.panX) && typeof i.panY == "number" && Number.isFinite(i.panY) && typeof p == "object" && p !== null && typeof p.earned == "boolean" && typeof p.gap == "boolean" && typeof p.violation == "boolean" && (i.detailsHidden === void 0 || typeof i.detailsHidden == "boolean") && (i.runId === void 0 || typeof i.runId == "string") && (i.selectedId === void 0 || typeof i.selectedId == "string") && (i.focusedId === void 0 || typeof i.focusedId == "string") && (i.hoverTooltips === void 0 || typeof i.hoverTooltips == "boolean");
}
function ct(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n;
  return i.channel === "ply-vis" && i.version === 1 && (i.type === "artifact" && "envelope" in i || i.type === "restore-state" && at(i.state));
}
const lt = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Me = (n, i) => Object.freeze({ ...n, ...i, overlays: Object.freeze({ ...n.overlays, ...i.overlays }) });
function ft(n, i, p = 0.5) {
  return i.x >= n.x - p && i.y >= n.y - p && i.x + i.width <= n.x + n.width + p && i.y + i.height <= n.y + n.height + p;
}
function ut(n, i, p = {}) {
  const f = p.margin ?? 24, u = p.minZoom ?? 0.2, h = p.maxZoom ?? 4, s = Math.max(1, n.width - f * 2), c = Math.max(1, n.height - f * 2), v = Math.max(1, i.width), w = Math.max(1, i.height), L = Math.min(h, Math.max(u, Math.min(s / v, c / w)));
  return {
    zoom: L,
    panX: n.width / 2 - (i.x + v / 2) * L,
    panY: n.height / 2 - (i.y + w / 2) * L
  };
}
function pt(n, i, p) {
  return {
    zoom: i,
    panX: p.x - (p.x - n.panX) / n.zoom * i,
    panY: p.y - (p.y - n.panY) / n.zoom * i
  };
}
const mt = 500, ze = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), ht = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function re() {
  const n = typeof document < "u" ? document.body : void 0, i = n?.dataset.vscodeThemeKind;
  if (i !== void 0) return ze.has(i);
  if (n) {
    for (const p of ze) if (n.classList.contains(p)) return !0;
    for (const p of ht) if (n.classList.contains(p)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const de = (n, i) => `<button type="button" aria-label="${n}" title="${n}">${i}</button>`, yt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${de("Zoom out", "−")}${de("Zoom in", "+")}${de("Fit canvas", "Fit")}
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
      <aside class="ply-inspector" id="ply-inspector" aria-label="Element details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function bt(n, i, p = []) {
  n.innerHTML = yt;
  const f = n.querySelector(".ply-vis"), u = f.querySelector(".ply-canvas"), h = f.querySelector(".ply-stage"), s = f.querySelector(".ply-tooltip"), c = f.querySelector(".ply-context-menu"), v = f.querySelector(".ply-inspector"), w = f.querySelector(".ply-inspector-toggle"), L = f.querySelector(".ply-workspace"), C = f.querySelector(".ply-status"), Y = f.querySelector(".ply-toolbar fieldset"), E = f.querySelector(".ply-breadcrumbs"), M = f.querySelector(".ply-provenance");
  let a = lt(), m, W, _ = re(), j, S, ce = 0, x, F, U;
  const le = () => i.post({ channel: "ply-vis", version: dt, type: "persist-state", state: a }), A = (e, t = !0) => {
    a = Me(a, e), t && le();
  }, N = () => {
    h.style.transform = `translate(${a.panX}px, ${a.panY}px) scale(${a.zoom})`;
  }, je = () => m ? Object.values(m.elements).filter((e) => !a.focusedId || e.id === a.focusedId || G(e, a.focusedId, m.elements)) : [];
  function q() {
    v.hidden = a.detailsHidden, L.classList.toggle("is-inspector-hidden", a.detailsHidden);
    const e = a.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!a.detailsHidden)), w.textContent = a.detailsHidden ? "‹" : "›";
  }
  function fe(e, t = !0) {
    A({ detailsHidden: e }, t), q();
  }
  function ue(e) {
    if (e.evidence.state) return e.evidence.state;
    const t = /* @__PURE__ */ new Set([e.evidence.verdict, ...e.evidence.statuses]);
    return t.has("violation") ? "violation" : t.has("gap") ? "gap" : t.has("earned") ? "earned" : "declared";
  }
  function Ne(e) {
    return e.run.tool.version === "render" || Object.values(e.elements).every((o) => ue(o) === "declared") ? { text: "Promises only — no run has checked this yet, so nothing here can ever be green." } : { text: `Showing a run completed ${new Date(e.run.completedAt).toLocaleString()}.`, title: `Run ${e.run.id}` };
  }
  function G(e, t, o) {
    let r = e.parentId;
    for (; r; ) {
      if (r === t) return !0;
      r = o[r]?.parentId;
    }
    return !1;
  }
  function qe(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== a.focusedId; )
      o = m?.elements[o.parentId], t += 1;
    return a.focusedId && o?.id !== a.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const pe = () => a.foldDetail ? a.zoom < 0.8 ? 1 : a.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function Re() {
    if (E.replaceChildren(), !m) return;
    const e = [];
    let t = a.focusedId ? m.elements[a.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = m.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", E.append(o);
    for (const r of e) {
      const d = document.createElement("button");
      d.type = "button", d.textContent = r.label, d.dataset.focusId = r.id, E.append(d);
    }
  }
  function X(e) {
    v.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", v.append(t), !e || !m) {
      const l = document.createElement("p");
      l.textContent = "Select an item to inspect its declaration and evidence.", v.append(l);
      return;
    }
    const o = e.declaration?.split(`
`).filter(Boolean);
    v.append(R("Declaration", o?.length ? o : ["No declaration text supplied."])), v.append(R("Verdict", [e.evidence.verdict])), v.append(R("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const r = Object.entries(e.evidence).filter(([l]) => !["verdict", "statuses"].includes(l)).map(([l, y]) => `${l}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    v.append(R("Earned evidence", r.length ? r : ["No additional evidence details supplied."])), v.append(R("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const d = new Map(m.diagnostics.map((l) => [l.id, l])), g = e.diagnosticIds.map((l) => d.get(l)).filter((l) => l !== void 0).map((l) => `${l.code} — ${l.severity}: ${l.message}`);
    if (v.append(R("Diagnostics", g.length ? g : ["No diagnostics supplied."])), v.append(Ve(m.run)), e.source) {
      const l = document.createElement("button");
      l.type = "button", l.className = "ply-source", l.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, l.addEventListener("click", () => i.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), v.append(l);
    }
  }
  function R(e, t) {
    const o = document.createElement("section"), r = document.createElement("h3");
    r.textContent = e, o.append(r);
    const d = document.createElement("ul");
    for (const g of t) {
      const l = document.createElement("li");
      l.textContent = g, d.append(l);
    }
    return o.append(d), o;
  }
  function Ve(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), r = document.createElement("h3");
    r.textContent = "Run details";
    const d = document.createElement("dl"), g = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [l, y] of g) {
      const H = document.createElement("dt");
      H.textContent = l;
      const D = document.createElement("dd");
      D.textContent = y, d.append(H, D);
    }
    return o.append(r, d), o;
  }
  function Z(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function He(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function O(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? m?.elements[t] : void 0;
  }
  function Be(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(s.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function me(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== s.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function Ye(e) {
    return s.scrollHeight <= s.clientHeight ? !1 : e > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight : e < 0 ? s.scrollTop > 0 : !1;
  }
  function z() {
    F !== void 0 && window.clearTimeout(F), F = void 0;
  }
  function I() {
    x && me(x), z(), x = void 0, s.hidden = !0, s.replaceChildren();
  }
  function _e(e, t) {
    if (!m) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const r = Object.entries(e.evidence).filter(([l, y]) => !["verdict", "statuses"].includes(l) && y !== !1 && y !== void 0).map(([l, y]) => `${l}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    o.push(...r), o.push(...(e.limitations ?? []).map((l) => `Limitation: ${l}`));
    const d = new Map(m.diagnostics.map((l) => [l.id, l]));
    for (const l of e.diagnosticIds) {
      const y = d.get(l);
      y && o.push(`${y.code} — ${y.severity}: ${y.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const g = t.dataset.plyTitle?.trim();
    return g && g !== e.label && !o.includes(g) && o.push(g), o;
  }
  function he(e, t) {
    const o = u.getBoundingClientRect(), r = 8;
    s.style.maxHeight = `${Math.max(0, o.height - r * 2)}px`;
    const d = 12, g = s.offsetWidth, l = s.offsetHeight, y = Math.max(r, o.width - g - r), H = Math.max(r, o.height - l - r), D = e - o.left + d, P = t - o.top + d, ie = P + l <= o.height - r ? P : t - o.top - l - d;
    s.style.left = `${Math.min(y, Math.max(r, D))}px`, s.style.top = `${Math.min(H, Math.max(r, ie))}px`;
  }
  function ye(e, t, o) {
    const r = O(e), d = e.dataset.plyTitle?.trim();
    if (!r && !d || e.hasAttribute("hidden")) {
      I();
      return;
    }
    x && x !== e && me(x), x = e;
    const g = document.createElement("span");
    if (r) {
      const y = document.createElement("strong");
      y.textContent = r.label, g.textContent = _e(r, e).join(`
`), s.replaceChildren(y, g);
    } else
      g.textContent = d, s.replaceChildren(g);
    s.hidden = !1, Be(e);
    const l = e.getBoundingClientRect();
    he(t ?? l.left + l.width / 2, o ?? l.bottom);
  }
  function ge(e, t, o) {
    z(), x && x !== e && I(), F = window.setTimeout(() => {
      F = void 0, ye(e, t, o);
    }, mt);
  }
  function Fe(e, t, o) {
    const r = u.getBoundingClientRect(), d = 8, g = Math.max(d, r.width - e.offsetWidth - d), l = Math.max(d, r.height - e.offsetHeight - d);
    e.style.left = `${Math.min(g, Math.max(d, t - r.left))}px`, e.style.top = `${Math.min(l, Math.max(d, o - r.top))}px`;
  }
  function $() {
    if (c.hidden) return;
    const e = c.contains(document.activeElement), t = U;
    c.hidden = !0, c.replaceChildren(), U = void 0, e && (t?.isConnected ? t : u).focus();
  }
  function ve() {
    return [...c.querySelectorAll('button[role="menuitem"]')];
  }
  function K(e) {
    const t = ve();
    if (!t.length) return;
    for (const r of t) r.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function Xe(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? O(t) : void 0, r = [];
    if (o && r.push({ label: `Zoom into ${o.label}`, run: () => V(o.id) }), a.focusedId && r.push({ label: "Back to Workspace", run: () => V(void 0) }), !r.length) return;
    e.preventDefault(), I();
    const d = document.activeElement;
    U = d instanceof HTMLElement || d instanceof SVGElement ? d : void 0, c.replaceChildren();
    for (const g of r) {
      const l = document.createElement("li");
      l.setAttribute("role", "presentation");
      const y = document.createElement("button");
      y.type = "button", y.setAttribute("role", "menuitem"), y.textContent = g.label, y.tabIndex = -1, y.addEventListener("click", () => {
        $(), g.run();
      }), l.append(y), c.append(l);
    }
    c.hidden = !1, Fe(c, e.clientX, e.clientY), K(0);
  }
  c.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), $();
      return;
    }
    const o = ve().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), K(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), K(o - 1));
  }), u.addEventListener("contextmenu", Xe);
  const be = (e) => {
    !c.hidden && e.target instanceof Node && !c.contains(e.target) && $();
  };
  window.addEventListener("pointerdown", be);
  function T() {
    if (!m) return;
    We();
    const e = [...h.querySelectorAll("[data-element-id], [data-ply-id]")], t = a.focusedId ? m.elements[a.focusedId] : void 0;
    for (const d of e) {
      const g = d.dataset.elementId ?? d.dataset.plyId ?? "", l = m.elements[g];
      if (!l) {
        d.removeAttribute("hidden");
        continue;
      }
      const y = ue(l), H = y === "declared" || a.overlays[y], D = t ? G(t, l.id, m.elements) : !1, P = !a.focusedId || l.id === a.focusedId || G(l, a.focusedId, m.elements) || D, ie = D || qe(l) <= pe();
      d.toggleAttribute("hidden", !P || !ie || !H && !D);
      const Ke = [l.evidence.verdict, ...l.evidence.statuses].filter(Boolean).join(", ") || "declared";
      d.setAttribute("role", "button"), d.setAttribute("aria-label", `${l.kind}: ${l.label}; ${Ke}`), d.dataset.state = y, d.classList.toggle("is-selected", l.id === a.selectedId), d === x && (d.hasAttribute("hidden") || !d.isConnected) && I();
    }
    const o = e.filter((d) => !d.hasAttribute("hidden") && O(d)), r = o.find((d) => O(d)?.id === a.selectedId) ?? o[0];
    for (const d of e) d.setAttribute("tabindex", d === r ? "0" : "-1");
    Ze(), Re();
  }
  function Ze() {
    const e = h.querySelector("svg");
    if (!e) return;
    for (const d of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      d.removeAttribute("hidden"), d.removeAttribute("data-ply-focus-hidden");
    if (!a.focusedId) return;
    const t = [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => O(d)?.id === a.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), r = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const d of [...e.children]) {
      if (!(d instanceof SVGElement) || d.matches("[data-element-id], [data-ply-id], defs, style, title") || d.contains(t)) continue;
      const g = d;
      if (typeof g.getBBox != "function") continue;
      let l;
      try {
        l = g.getBBox();
      } catch {
        continue;
      }
      ft(r, l) || (d.setAttribute("hidden", ""), d.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function Pe(e) {
    m = e, A({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    Y.hidden = !t, E.hidden = !t, w.hidden = !t, t || fe(!0, !1), q(), I(), $(), j = void 0, J(e.svg), u.dataset.empty = "false";
    const o = u.querySelector(".ply-empty");
    o && o.remove(), T(), N(), X(a.selectedId ? e.elements[a.selectedId] : void 0);
    const r = Ne(e);
    M.textContent = r.text, r.title ? M.title = r.title : M.removeAttribute("title"), C.textContent = "", typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => ne(!1));
  }
  function J(e) {
    h.innerHTML = e;
    for (const t of [...h.querySelectorAll("title")]) {
      const o = t.parentElement, r = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), d = t.textContent?.trim();
      r && d && (r.dataset.plyTitle = d, O(r) || (r.setAttribute("tabindex", "0"), r.setAttribute("role", "img"), r.setAttribute("aria-label", d))), t.remove();
    }
  }
  function We() {
    if (!m) return;
    const e = a.focusedId ? void 0 : Ue();
    if (e === j) return;
    const t = e === void 0 ? m.svg : m.folded.find((o) => o.depth === e)?.svg;
    if (!t) {
      j = e;
      return;
    }
    I(), $(), J(t), j = e;
  }
  function Ue() {
    if (!m) return;
    const e = pe();
    if (Number.isFinite(e))
      return m.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function we(e) {
    return Object.freeze({
      ...e,
      svg: De(e.svg, { prefersDark: _ }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: De(t.svg, { prefersDark: _ }) })))
    });
  }
  function Q(e) {
    try {
      const t = Qe(e);
      return W = t, Pe(we(t)), delete f.dataset.error, !0;
    } catch (t) {
      const o = t instanceof b || t instanceof Error ? t.message : "Unknown artifact error";
      return C.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, f.dataset.error = "true", i.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function Ie(e) {
    if (e === _ || !W) {
      _ = e;
      return;
    }
    _ = e, m = we(W), I(), $();
    const t = j === void 0 ? m.svg : m.folded.find((o) => o.depth === j)?.svg ?? m.svg;
    J(t), T(), N(), X(a.selectedId ? m.elements[a.selectedId] : void 0);
  }
  function ee(e) {
    m?.elements[e] && (A({ selectedId: e, detailsHidden: !1 }), q(), T(), X(m.elements[e]));
  }
  function xe(e) {
    [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => O(o)?.id === e)?.focus();
  }
  function V(e) {
    e && !m?.elements[e] || (e && !m.elements[e].parentId && (e = void 0), I(), $(), A({ focusedId: e, selectedId: e, detailsHidden: !e }), q(), T(), X(e ? m?.elements[e] : void 0), ne());
  }
  function Ge() {
    const e = u.getBoundingClientRect(), o = (a.selectedId ? [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => O(r)?.id === a.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function te(e, t = Ge()) {
    I(), $(), A(pt(a, Math.min(4, Math.max(0.2, e)), t)), T(), N(), C.textContent = `Zoom ${Math.round(a.zoom * 100)}%`;
  }
  function ne(e = !0) {
    const t = h.querySelector("svg");
    if (!t) return;
    const o = h.getBoundingClientRect(), r = a.focusedId ? [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((y) => O(y)?.id === a.focusedId) : t;
    if (!r) return;
    const d = r.getBoundingClientRect(), g = a.zoom || 1, l = {
      x: (d.left - o.left) / g,
      y: (d.top - o.top) / g,
      width: d.width / g,
      height: d.height / g
    };
    A(ut({ width: u.clientWidth, height: u.clientHeight }, l)), T(), N(), e && (C.textContent = a.focusedId ? "Focused element fitted" : "Canvas fitted");
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => te(a.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => te(a.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => ne()), w.addEventListener("click", () => fe(!a.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    A({ overlays: { ...a.overlays, [t]: e.checked } }), T();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    A({ foldDetail: e.target.checked }), T(), C.textContent = a.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    A({ hoverTooltips: t }), t || (z(), x && document.activeElement !== x && I()), C.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), E.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && V(t.dataset.focusId || void 0);
  }), h.addEventListener("click", (e) => {
    if (performance.now() < ce) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && ee(o);
  }), h.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && V(o);
  }), h.addEventListener("pointerover", (e) => {
    if (!a.hoverTooltips) return;
    const t = Z(e.target);
    t && ge(t, e.clientX, e.clientY);
  }), h.addEventListener("pointermove", (e) => {
    if (!a.hoverTooltips) {
      z();
      return;
    }
    const t = Z(e.target);
    if (!t) {
      z();
      return;
    }
    t === x && !s.hidden ? he(e.clientX, e.clientY) : ge(t, e.clientX, e.clientY);
  }), h.addEventListener("pointerout", (e) => {
    const t = Z(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || s.contains(e.relatedTarget)) || t.contains(document.activeElement) || I();
  }), h.addEventListener("focusin", (e) => {
    const t = Z(e.target);
    t && (!a.hoverTooltips && !He(t) || (z(), ye(t)));
  }), h.addEventListener("focusout", (e) => {
    const t = Z(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || I();
  }), s.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && x?.contains(e.relatedTarget) || I();
  }), s.addEventListener("wheel", (e) => {
    if (Ye(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    I();
  }, { passive: !0 }), s.addEventListener("pointerdown", (e) => e.stopPropagation()), u.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = u.getBoundingClientRect();
    te(a.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), u.addEventListener("pointerdown", (e) => {
    e.button === 0 && (S = { x: e.clientX, y: e.clientY, panX: a.panX, panY: a.panY, pointerId: e.pointerId, moved: !1 });
  }), u.addEventListener("pointermove", (e) => {
    if (!S) return;
    const t = e.clientX - S.x, o = e.clientY - S.y;
    if (!(!S.moved && Math.hypot(t, o) < 3)) {
      if (!S.moved) {
        S.moved = !0, u.classList.add("is-panning");
        try {
          u.setPointerCapture(S.pointerId);
        } catch {
        }
      }
      e.preventDefault(), A({ panX: S.panX + t, panY: S.panY + o }, !1), N();
    }
  });
  const oe = () => {
    S && (S.moved && (ce = performance.now() + 250, le()), S = void 0, u.classList.remove("is-panning"));
  };
  u.addEventListener("pointerup", oe), u.addEventListener("pointercancel", oe), u.addEventListener("lostpointercapture", oe), u.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !s.hidden) {
      e.preventDefault(), I();
      return;
    }
    const t = je();
    if (!t.length) return;
    const o = Math.max(0, t.findIndex((r) => r.id === a.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const r = t[(o + 1) % t.length].id;
      ee(r), xe(r);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const r = t[(o - 1 + t.length) % t.length].id;
      ee(r), xe(r);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = t[o];
      V(r.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const r = a.focusedId ? m?.elements[a.focusedId]?.parentId : void 0;
      V(r);
    }
  });
  const Ee = (e) => {
    ct(e.data) && (e.data.type === "artifact" ? Q(e.data.envelope) : (a = Me(a, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = a.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = a.foldDetail, f.querySelector("[data-hover-tooltips]").checked = a.hoverTooltips, m && (q(), T(), N(), X(a.selectedId ? m.elements[a.selectedId] : void 0))));
  }, Se = (e) => {
    C.textContent = `Viewer error: ${e}`, i.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ke = (e) => Se(e.message || "Unknown runtime error"), Le = (e) => Se(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", Ee), window.addEventListener("error", ke), window.addEventListener("unhandledrejection", Le);
  const Ce = typeof MutationObserver == "function" ? new MutationObserver(() => Ie(re())) : void 0;
  Ce?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Ae = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, Oe = () => Ie(re());
  Ae?.addEventListener("change", Oe), q();
  for (const e of p) Q(e);
  return i.post({ channel: "ply-vis", version: 1, type: "ready" }), p.length || i.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: Q, getState: () => a, destroy: () => {
    z(), window.removeEventListener("message", Ee), window.removeEventListener("error", ke), window.removeEventListener("unhandledrejection", Le), window.removeEventListener("pointerdown", be), Ce?.disconnect(), Ae?.removeEventListener("change", Oe), n.replaceChildren();
  } };
}
const wt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  wt as CONTENT_SECURITY_POLICY,
  b as EnvelopeError,
  dt as HOST_PROTOCOL_VERSION,
  gt as PROTOCOL_VERSION,
  lt as initialViewState,
  ct as isHostResponse,
  bt as mountViewer,
  Qe as parseEnvelope,
  De as sanitizeSvg,
  Me as updateViewState,
  vt as windowHostBridge
};
//# sourceMappingURL=index.js.map
