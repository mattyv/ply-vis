const it = 1;
class b extends Error {
}
const C = (n) => typeof n == "object" && n !== null && !Array.isArray(n), V = (n, i, u = []) => {
  const f = /* @__PURE__ */ new Set([...i, ...u]);
  return i.every((p) => p in n) && Object.keys(n).every((p) => f.has(p));
}, te = (n) => Array.isArray(n) && n.every((i) => typeof i == "string"), Be = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function oe(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(oe));
  if (C(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([i, u]) => [i, oe(u)])));
  throw new b("Evidence contains a non-JSON value");
}
function we(n) {
  if (n !== void 0) {
    if (!C(n) || !V(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new b("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((i) => i === ".." || i === ".")) throw new b("Invalid source location");
    for (const i of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[i]) || n[i] < 0) throw new b("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new b("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function Ye(n) {
  if (!C(n) || !V(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["folded"])) throw new b("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new b(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const i = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!C(n.run) || !V(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !C(n.run.root) || !V(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !C(n.run.tool) || !V(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !i.has(n.run.outcome)) throw new b("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new b("Invalid SVG");
  const u = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new b("Invalid folded drawings");
    for (const s of n.folded) {
      if (!C(s) || !V(s, ["depth", "svg"]) || !Number.isInteger(s.depth) || s.depth < 1 || typeof s.svg != "string" || !s.svg.trim()) throw new b("Invalid folded drawing");
      u.push(Object.freeze({ depth: s.depth, svg: s.svg }));
    }
  }
  if (!C(n.elements)) throw new b("Invalid element index");
  const f = {};
  for (const [s, l] of Object.entries(n.elements)) {
    if (!C(l) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in l) || !C(l.evidence)) throw new b(`Invalid element: ${s}`);
    if (l.id !== s || typeof l.id != "string" || !l.id || typeof l.kind != "string" || !l.kind || typeof l.label != "string" || !l.label || typeof l.evidence.verdict != "string" || !te(l.evidence.statuses) || typeof l.evidence.reused != "boolean" || l.evidence.state !== void 0 && !Be.has(l.evidence.state) || !te(l.diagnosticIds) || l.parentId !== void 0 && typeof l.parentId != "string" || l.declaration !== void 0 && typeof l.declaration != "string" || l.limitations !== void 0 && !te(l.limitations)) throw new b(`Invalid element: ${s}`);
    const v = oe(l.evidence);
    f[s] = Object.freeze({ id: s, kind: l.kind, label: l.label, evidence: v, diagnosticIds: Object.freeze([...l.diagnosticIds]), ...l.parentId === void 0 ? {} : { parentId: l.parentId }, ...l.declaration === void 0 ? {} : { declaration: l.declaration }, ...l.limitations === void 0 ? {} : { limitations: Object.freeze([...l.limitations]) }, ...l.source === void 0 ? {} : { source: we(l.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new b(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(n.diagnostics)) throw new b("Invalid diagnostics");
  const p = [], m = /* @__PURE__ */ new Set();
  for (const s of n.diagnostics) {
    if (!C(s) || typeof s.id != "string" || !s.id || m.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new b("Invalid diagnostic");
    m.add(s.id), p.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: we(s.source) } }));
  }
  for (const s of Object.values(f)) for (const l of s.diagnosticIds ?? []) if (!m.has(l)) throw new b(`Unknown diagnostic: ${l}`);
  for (const s of p) if (s.elementId && !f[s.elementId]) throw new b(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), diagnostics: Object.freeze(p), folded: Object.freeze(u) });
}
const Fe = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), Xe = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), Ze = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ie = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, _e = {
  fill: Ie,
  stroke: Ie,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function Pe(n) {
  let i = n;
  for (; ; ) {
    const u = i.search(/@media\b/i);
    if (u < 0) return i;
    const f = i.indexOf("{", u);
    if (f < 0) return i.slice(0, u);
    let p = 0, m = f;
    for (; m < i.length; m += 1)
      if (i[m] === "{") p += 1;
      else if (i[m] === "}" && --p === 0) break;
    i = i.slice(0, u) + i.slice(Math.min(m + 1, i.length));
  }
}
function We(n) {
  if (!n.trim() || n.length > 32768) return;
  const i = Pe(n), u = /\s*([^{}]+)\{([^{}]*)\}/gy, f = [];
  let p = 0;
  for (; p < i.length; ) {
    u.lastIndex = p;
    const m = u.exec(i);
    if (!m) return i.slice(p).trim() === "" ? f : void 0;
    p = u.lastIndex;
    const s = m[1], l = m[2];
    if (s === void 0 || l === void 0) return;
    const v = s.split(",").map((E) => E.trim());
    if (!v.every((E) => Ze.test(E))) return;
    const w = [];
    for (const E of l.split(";")) {
      const A = E.indexOf(":");
      if (A < 1) continue;
      const F = E.slice(0, A).trim().toLowerCase(), T = E.slice(A + 1).trim();
      _e[F]?.test(T) === !0 && w.push([F, T]);
    }
    w.length && f.push({ selectors: v, declarations: w });
  }
  return f;
}
function xe(n) {
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const i = new DOMParser().parseFromString(n, "image/svg+xml");
  if (i.querySelector("parsererror") || i.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const u of [...i.querySelectorAll("*")]) {
    if (u.localName.toLowerCase() === "style") {
      const f = We(u.textContent ?? "");
      if (f) for (const p of f) for (const m of p.selectors)
        for (const s of [...i.documentElement.querySelectorAll(m)])
          for (const [l, v] of p.declarations) s.setAttribute(l, v);
      u.remove();
      continue;
    }
    if (Fe.has(u.localName.toLowerCase())) {
      u.remove();
      continue;
    }
    for (const f of [...u.attributes]) {
      const p = f.name.toLowerCase(), m = f.value.trim().toLowerCase(), s = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(m);
      (p.startsWith("on") || p === "style" || s || Xe.has(p) && m !== "" && !m.startsWith("#")) && u.removeAttribute(f.name);
    }
  }
  return new XMLSerializer().serializeToString(i.documentElement);
}
const Ue = 1, st = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function Ge(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n, u = i.overlays;
  return typeof i.zoom == "number" && Number.isFinite(i.zoom) && typeof i.panX == "number" && Number.isFinite(i.panX) && typeof i.panY == "number" && Number.isFinite(i.panY) && typeof u == "object" && u !== null && typeof u.earned == "boolean" && typeof u.gap == "boolean" && typeof u.violation == "boolean" && (i.detailsHidden === void 0 || typeof i.detailsHidden == "boolean") && (i.runId === void 0 || typeof i.runId == "string") && (i.selectedId === void 0 || typeof i.selectedId == "string") && (i.focusedId === void 0 || typeof i.focusedId == "string") && (i.hoverTooltips === void 0 || typeof i.hoverTooltips == "boolean");
}
function Je(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n;
  return i.channel === "ply-vis" && i.version === 1 && (i.type === "artifact" && "envelope" in i || i.type === "restore-state" && Ge(i.state));
}
const Ke = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), Ee = (n, i) => Object.freeze({ ...n, ...i, overlays: Object.freeze({ ...n.overlays, ...i.overlays }) });
function Qe(n, i, u = 0.5) {
  return i.x >= n.x - u && i.y >= n.y - u && i.x + i.width <= n.x + n.width + u && i.y + i.height <= n.y + n.height + u;
}
function et(n, i, u = {}) {
  const f = u.margin ?? 24, p = u.minZoom ?? 0.2, m = u.maxZoom ?? 4, s = Math.max(1, n.width - f * 2), l = Math.max(1, n.height - f * 2), v = Math.max(1, i.width), w = Math.max(1, i.height), E = Math.min(m, Math.max(p, Math.min(s / v, l / w)));
  return {
    zoom: E,
    panX: n.width / 2 - (i.x + v / 2) * E,
    panY: n.height / 2 - (i.y + w / 2) * E
  };
}
function tt(n, i, u) {
  return {
    zoom: i,
    panX: u.x - (u.x - n.panX) / n.zoom * i,
    panY: u.y - (u.y - n.panY) / n.zoom * i
  };
}
const nt = 500, ne = (n, i) => `<button type="button" aria-label="${n}" title="${n}">${i}</button>`, ot = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${ne("Zoom out", "−")}${ne("Zoom in", "+")}${ne("Fit canvas", "Fit")}
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
    <nav class="ply-breadcrumbs" aria-label="Semantic focus"></nav>
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
function rt(n, i, u = []) {
  n.innerHTML = ot;
  const f = n.querySelector(".ply-vis"), p = f.querySelector(".ply-canvas"), m = f.querySelector(".ply-stage"), s = f.querySelector(".ply-tooltip"), l = f.querySelector(".ply-context-menu"), v = f.querySelector(".ply-inspector"), w = f.querySelector(".ply-inspector-toggle"), E = f.querySelector(".ply-workspace"), A = f.querySelector(".ply-status"), F = f.querySelector(".ply-toolbar fieldset"), T = f.querySelector(".ply-breadcrumbs");
  let c = Ke(), g, X, S, ie = 0, I, H, _;
  const se = () => i.post({ channel: "ply-vis", version: Ue, type: "persist-state", state: c }), L = (e, t = !0) => {
    c = Ee(c, e), t && se();
  }, B = () => {
    m.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, Se = () => g ? Object.values(g.elements).filter((e) => !c.focusedId || e.id === c.focusedId || P(e, c.focusedId, g.elements)) : [];
  function N() {
    v.hidden = c.detailsHidden, E.classList.toggle("is-inspector-hidden", c.detailsHidden);
    const e = c.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!c.detailsHidden)), w.textContent = c.detailsHidden ? "‹" : "›";
  }
  function re(e, t = !0) {
    L({ detailsHidden: e }, t), N();
  }
  function P(e, t, o) {
    let r = e.parentId;
    for (; r; ) {
      if (r === t) return !0;
      r = o[r]?.parentId;
    }
    return !1;
  }
  function Ae(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== c.focusedId; )
      o = g?.elements[o.parentId], t += 1;
    return c.focusedId && o?.id !== c.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const de = () => c.foldDetail ? c.zoom < 0.8 ? 1 : c.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function Ce() {
    if (T.replaceChildren(), !g) return;
    const e = [];
    let t = c.focusedId ? g.elements[c.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = g.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", T.append(o);
    for (const r of e) {
      const d = document.createElement("button");
      d.type = "button", d.textContent = r.label, d.dataset.focusId = r.id, T.append(d);
    }
  }
  function Z(e) {
    v.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", v.append(t), !e || !g) {
      const a = document.createElement("p");
      a.textContent = "Select an item to inspect its declaration and evidence.", v.append(a);
      return;
    }
    const o = e.declaration?.split(`
`).filter(Boolean);
    v.append(D("Declaration", o?.length ? o : ["No declaration text supplied."])), v.append(D("Verdict", [e.evidence.verdict])), v.append(D("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const r = Object.entries(e.evidence).filter(([a]) => !["verdict", "statuses"].includes(a)).map(([a, h]) => `${a}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    v.append(D("Earned evidence", r.length ? r : ["No additional evidence details supplied."])), v.append(D("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const d = new Map(g.diagnostics.map((a) => [a.id, a])), y = e.diagnosticIds.map((a) => d.get(a)).filter((a) => a !== void 0).map((a) => `${a.code} — ${a.severity}: ${a.message}`);
    if (v.append(D("Diagnostics", y.length ? y : ["No diagnostics supplied."])), v.append(Le(g.run)), e.source) {
      const a = document.createElement("button");
      a.type = "button", a.className = "ply-source", a.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, a.addEventListener("click", () => i.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), v.append(a);
    }
  }
  function D(e, t) {
    const o = document.createElement("section"), r = document.createElement("h3");
    r.textContent = e, o.append(r);
    const d = document.createElement("ul");
    for (const y of t) {
      const a = document.createElement("li");
      a.textContent = y, d.append(a);
    }
    return o.append(d), o;
  }
  function Le(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), r = document.createElement("h3");
    r.textContent = "Run details";
    const d = document.createElement("dl"), y = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [a, h] of y) {
      const $ = document.createElement("dt");
      $.textContent = a;
      const q = document.createElement("dd");
      q.textContent = h, d.append($, q);
    }
    return o.append(r, d), o;
  }
  function Y(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function ke(e) {
    try {
      return e.matches(":focus-visible");
    } catch {
      return !0;
    }
  }
  function k(e) {
    const t = e.dataset.elementId ?? e.dataset.plyId;
    return t ? g?.elements[t] : void 0;
  }
  function Te(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(s.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function ae(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== s.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function Oe(e) {
    return s.scrollHeight <= s.clientHeight ? !1 : e > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight : e < 0 ? s.scrollTop > 0 : !1;
  }
  function z() {
    H !== void 0 && window.clearTimeout(H), H = void 0;
  }
  function x() {
    I && ae(I), z(), I = void 0, s.hidden = !0, s.replaceChildren();
  }
  function $e(e, t) {
    if (!g) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const r = Object.entries(e.evidence).filter(([a, h]) => !["verdict", "statuses"].includes(a) && h !== !1 && h !== void 0).map(([a, h]) => `${a}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    o.push(...r), o.push(...(e.limitations ?? []).map((a) => `Limitation: ${a}`));
    const d = new Map(g.diagnostics.map((a) => [a.id, a]));
    for (const a of e.diagnosticIds) {
      const h = d.get(a);
      h && o.push(`${h.code} — ${h.severity}: ${h.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const y = t.dataset.plyTitle?.trim();
    return y && y !== e.label && !o.includes(y) && o.push(y), o;
  }
  function ce(e, t) {
    const o = p.getBoundingClientRect(), r = 8;
    s.style.maxHeight = `${Math.max(0, o.height - r * 2)}px`;
    const d = 12, y = s.offsetWidth, a = s.offsetHeight, h = Math.max(r, o.width - y - r), $ = Math.max(r, o.height - a - r), q = e - o.left + d, R = t - o.top + d, ee = R + a <= o.height - r ? R : t - o.top - a - d;
    s.style.left = `${Math.min(h, Math.max(r, q))}px`, s.style.top = `${Math.min($, Math.max(r, ee))}px`;
  }
  function le(e, t, o) {
    const r = k(e), d = e.dataset.plyTitle?.trim();
    if (!r && !d || e.hasAttribute("hidden")) {
      x();
      return;
    }
    I && I !== e && ae(I), I = e;
    const y = document.createElement("span");
    if (r) {
      const h = document.createElement("strong");
      h.textContent = r.label, y.textContent = $e(r, e).join(`
`), s.replaceChildren(h, y);
    } else
      y.textContent = d, s.replaceChildren(y);
    s.hidden = !1, Te(e);
    const a = e.getBoundingClientRect();
    ce(t ?? a.left + a.width / 2, o ?? a.bottom);
  }
  function fe(e, t, o) {
    z(), I && I !== e && x(), H = window.setTimeout(() => {
      H = void 0, le(e, t, o);
    }, nt);
  }
  function ze(e, t, o) {
    const r = p.getBoundingClientRect(), d = 8, y = Math.max(d, r.width - e.offsetWidth - d), a = Math.max(d, r.height - e.offsetHeight - d);
    e.style.left = `${Math.min(y, Math.max(d, t - r.left))}px`, e.style.top = `${Math.min(a, Math.max(d, o - r.top))}px`;
  }
  function j() {
    if (l.hidden) return;
    const e = l.contains(document.activeElement), t = _;
    l.hidden = !0, l.replaceChildren(), _ = void 0, e && (t?.isConnected ? t : p).focus();
  }
  function ue() {
    return [...l.querySelectorAll('button[role="menuitem"]')];
  }
  function W(e) {
    const t = ue();
    if (!t.length) return;
    for (const r of t) r.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function je(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? k(t) : void 0, r = [];
    if (o && r.push({ label: `Zoom into ${o.label}`, run: () => M(o.id) }), c.focusedId && r.push({ label: "Back to Workspace", run: () => M(void 0) }), !r.length) return;
    e.preventDefault(), x();
    const d = document.activeElement;
    _ = d instanceof HTMLElement || d instanceof SVGElement ? d : void 0, l.replaceChildren();
    for (const y of r) {
      const a = document.createElement("li");
      a.setAttribute("role", "presentation");
      const h = document.createElement("button");
      h.type = "button", h.setAttribute("role", "menuitem"), h.textContent = y.label, h.tabIndex = -1, h.addEventListener("click", () => {
        j(), y.run();
      }), a.append(h), l.append(a);
    }
    l.hidden = !1, ze(l, e.clientX, e.clientY), W(0);
  }
  l.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), j();
      return;
    }
    const o = ue().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), W(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), W(o - 1));
  }), p.addEventListener("contextmenu", je);
  const pe = (e) => {
    !l.hidden && e.target instanceof Node && !l.contains(e.target) && j();
  };
  window.addEventListener("pointerdown", pe);
  function O() {
    if (!g) return;
    Me();
    const e = [...m.querySelectorAll("[data-element-id], [data-ply-id]")], t = c.focusedId ? g.elements[c.focusedId] : void 0;
    for (const d of e) {
      const y = d.dataset.elementId ?? d.dataset.plyId ?? "", a = g.elements[y];
      if (!a) {
        d.removeAttribute("hidden");
        continue;
      }
      const h = /* @__PURE__ */ new Set([a.evidence.verdict, ...a.evidence.statuses]), $ = a.evidence.state ?? (h.has("violation") ? "violation" : h.has("gap") ? "gap" : h.has("earned") ? "earned" : "declared"), q = $ === "declared" || c.overlays[$], R = t ? P(t, a.id, g.elements) : !1, ee = !c.focusedId || a.id === c.focusedId || P(a, c.focusedId, g.elements) || R, Ve = R || Ae(a) <= de();
      d.toggleAttribute("hidden", !ee || !Ve || !q && !R);
      const He = [a.evidence.verdict, ...a.evidence.statuses].filter(Boolean).join(", ") || "declared";
      d.setAttribute("role", "button"), d.setAttribute("aria-label", `${a.kind}: ${a.label}; ${He}`), d.dataset.state = $, d.classList.toggle("is-selected", a.id === c.selectedId), d === I && (d.hasAttribute("hidden") || !d.isConnected) && x();
    }
    const o = e.filter((d) => !d.hasAttribute("hidden") && k(d)), r = o.find((d) => k(d)?.id === c.selectedId) ?? o[0];
    for (const d of e) d.setAttribute("tabindex", d === r ? "0" : "-1");
    Ne(), Ce();
  }
  function Ne() {
    const e = m.querySelector("svg");
    if (!e) return;
    for (const d of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      d.removeAttribute("hidden"), d.removeAttribute("data-ply-focus-hidden");
    if (!c.focusedId) return;
    const t = [...m.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => k(d)?.id === c.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), r = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const d of [...e.children]) {
      if (!(d instanceof SVGElement) || d.matches("[data-element-id], [data-ply-id], defs, style, title") || d.contains(t)) continue;
      const y = d;
      if (typeof y.getBBox != "function") continue;
      let a;
      try {
        a = y.getBBox();
      } catch {
        continue;
      }
      Qe(r, a) || (d.setAttribute("hidden", ""), d.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function De(e) {
    g = e, L({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    F.hidden = !t, T.hidden = !t, w.hidden = !t, t || re(!0, !1), N(), x(), j(), X = void 0, me(e.svg), p.dataset.empty = "false";
    const o = p.querySelector(".ply-empty");
    o && o.remove(), O(), B(), Z(c.selectedId ? e.elements[c.selectedId] : void 0), A.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => K(!1));
  }
  function me(e) {
    m.innerHTML = e;
    for (const t of [...m.querySelectorAll("title")]) {
      const o = t.parentElement, r = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), d = t.textContent?.trim();
      r && d && (r.dataset.plyTitle = d, k(r) || (r.setAttribute("tabindex", "0"), r.setAttribute("role", "img"), r.setAttribute("aria-label", d))), t.remove();
    }
  }
  function Me() {
    if (!g) return;
    const e = c.focusedId ? void 0 : qe();
    if (e === X) return;
    const t = e === void 0 ? g.svg : g.folded.find((o) => o.depth === e)?.svg;
    if (!t) {
      X = e;
      return;
    }
    x(), j(), me(t), X = e;
  }
  function qe() {
    if (!g) return;
    const e = de();
    if (Number.isFinite(e))
      return g.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function U(e) {
    try {
      const t = Ye(e), o = Object.freeze({
        ...t,
        svg: xe(t.svg),
        folded: Object.freeze(t.folded.map((r) => Object.freeze({ depth: r.depth, svg: xe(r.svg) })))
      });
      return De(o), delete f.dataset.error, !0;
    } catch (t) {
      const o = t instanceof b || t instanceof Error ? t.message : "Unknown artifact error";
      return A.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, f.dataset.error = "true", i.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function G(e) {
    g?.elements[e] && (L({ selectedId: e, detailsHidden: !1 }), N(), O(), Z(g.elements[e]));
  }
  function he(e) {
    [...m.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => k(o)?.id === e)?.focus();
  }
  function M(e) {
    e && !g?.elements[e] || (e && !g.elements[e].parentId && (e = void 0), x(), j(), L({ focusedId: e, selectedId: e, detailsHidden: !e }), N(), O(), Z(e ? g?.elements[e] : void 0), K());
  }
  function Re() {
    const e = p.getBoundingClientRect(), o = (c.selectedId ? [...m.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => k(r)?.id === c.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function J(e, t = Re()) {
    x(), j(), L(tt(c, Math.min(4, Math.max(0.2, e)), t)), O(), B(), A.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function K(e = !0) {
    const t = m.querySelector("svg");
    if (!t) return;
    const o = m.getBoundingClientRect(), r = c.focusedId ? [...m.querySelectorAll("[data-element-id], [data-ply-id]")].find((h) => k(h)?.id === c.focusedId) : t;
    if (!r) return;
    const d = r.getBoundingClientRect(), y = c.zoom || 1, a = {
      x: (d.left - o.left) / y,
      y: (d.top - o.top) / y,
      width: d.width / y,
      height: d.height / y
    };
    L(et({ width: p.clientWidth, height: p.clientHeight }, a)), O(), B(), e && (A.textContent = c.focusedId ? "Focused element fitted" : "Canvas fitted");
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => J(c.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => J(c.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => K()), w.addEventListener("click", () => re(!c.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    L({ overlays: { ...c.overlays, [t]: e.checked } }), O();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    L({ foldDetail: e.target.checked }), O(), A.textContent = c.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    L({ hoverTooltips: t }), t || (z(), I && document.activeElement !== I && x()), A.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), T.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && M(t.dataset.focusId || void 0);
  }), m.addEventListener("click", (e) => {
    if (performance.now() < ie) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && G(o);
  }), m.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && M(o);
  }), m.addEventListener("pointerover", (e) => {
    if (!c.hoverTooltips) return;
    const t = Y(e.target);
    t && fe(t, e.clientX, e.clientY);
  }), m.addEventListener("pointermove", (e) => {
    if (!c.hoverTooltips) {
      z();
      return;
    }
    const t = Y(e.target);
    if (!t) {
      z();
      return;
    }
    t === I && !s.hidden ? ce(e.clientX, e.clientY) : fe(t, e.clientX, e.clientY);
  }), m.addEventListener("pointerout", (e) => {
    const t = Y(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || s.contains(e.relatedTarget)) || t.contains(document.activeElement) || x();
  }), m.addEventListener("focusin", (e) => {
    const t = Y(e.target);
    t && (!c.hoverTooltips && !ke(t) || (z(), le(t)));
  }), m.addEventListener("focusout", (e) => {
    const t = Y(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || x();
  }), s.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && I?.contains(e.relatedTarget) || x();
  }), s.addEventListener("wheel", (e) => {
    if (Oe(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    x();
  }, { passive: !0 }), s.addEventListener("pointerdown", (e) => e.stopPropagation()), p.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = p.getBoundingClientRect();
    J(c.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), p.addEventListener("pointerdown", (e) => {
    e.button === 0 && (S = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY, pointerId: e.pointerId, moved: !1 });
  }), p.addEventListener("pointermove", (e) => {
    if (!S) return;
    const t = e.clientX - S.x, o = e.clientY - S.y;
    if (!(!S.moved && Math.hypot(t, o) < 3)) {
      if (!S.moved) {
        S.moved = !0, p.classList.add("is-panning");
        try {
          p.setPointerCapture(S.pointerId);
        } catch {
        }
      }
      e.preventDefault(), L({ panX: S.panX + t, panY: S.panY + o }, !1), B();
    }
  });
  const Q = () => {
    S && (S.moved && (ie = performance.now() + 250, se()), S = void 0, p.classList.remove("is-panning"));
  };
  p.addEventListener("pointerup", Q), p.addEventListener("pointercancel", Q), p.addEventListener("lostpointercapture", Q), p.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !s.hidden) {
      e.preventDefault(), x();
      return;
    }
    const t = Se();
    if (!t.length) return;
    const o = Math.max(0, t.findIndex((r) => r.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const r = t[(o + 1) % t.length].id;
      G(r), he(r);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const r = t[(o - 1 + t.length) % t.length].id;
      G(r), he(r);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const r = t[o];
      M(r.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const r = c.focusedId ? g?.elements[c.focusedId]?.parentId : void 0;
      M(r);
    }
  });
  const ye = (e) => {
    Je(e.data) && (e.data.type === "artifact" ? U(e.data.envelope) : (c = Ee(c, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = c.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = c.foldDetail, f.querySelector("[data-hover-tooltips]").checked = c.hoverTooltips, g && (N(), O(), B(), Z(c.selectedId ? g.elements[c.selectedId] : void 0))));
  }, ge = (e) => {
    A.textContent = `Viewer error: ${e}`, i.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ve = (e) => ge(e.message || "Unknown runtime error"), be = (e) => ge(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", ye), window.addEventListener("error", ve), window.addEventListener("unhandledrejection", be), N();
  for (const e of u) U(e);
  return i.post({ channel: "ply-vis", version: 1, type: "ready" }), u.length || i.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: U, getState: () => c, destroy: () => {
    z(), window.removeEventListener("message", ye), window.removeEventListener("error", ve), window.removeEventListener("unhandledrejection", be), window.removeEventListener("pointerdown", pe), n.replaceChildren();
  } };
}
const dt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  dt as CONTENT_SECURITY_POLICY,
  b as EnvelopeError,
  Ue as HOST_PROTOCOL_VERSION,
  it as PROTOCOL_VERSION,
  Ke as initialViewState,
  Je as isHostResponse,
  rt as mountViewer,
  Ye as parseEnvelope,
  xe as sanitizeSvg,
  Ee as updateViewState,
  st as windowHostBridge
};
//# sourceMappingURL=index.js.map
