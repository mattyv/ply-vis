const ht = 1;
class b extends Error {
}
const k = (n) => typeof n == "object" && n !== null && !Array.isArray(n), Y = (n, i, p = []) => {
  const f = /* @__PURE__ */ new Set([...i, ...p]);
  return i.every((u) => u in n) && Object.keys(n).every((u) => f.has(u));
}, ie = (n) => Array.isArray(n) && n.every((i) => typeof i == "string"), Ge = /* @__PURE__ */ new Set(["declared", "earned", "gap", "violation"]);
function de(n) {
  if (n === null || typeof n == "boolean" || typeof n == "string" || typeof n == "number" && Number.isFinite(n)) return n;
  if (Array.isArray(n)) return Object.freeze(n.map(de));
  if (k(n)) return Object.freeze(Object.fromEntries(Object.entries(n).map(([i, p]) => [i, de(p)])));
  throw new b("Evidence contains a non-JSON value");
}
function Ae(n) {
  if (n !== void 0) {
    if (!k(n) || !Y(n, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new b("Invalid source location");
    if (typeof n.file != "string" || !n.file || n.file.startsWith("/") || n.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(n.file) || n.file.split(/[\\/]/).some((i) => i === ".." || i === ".")) throw new b("Invalid source location");
    for (const i of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(n[i]) || n[i] < 0) throw new b("Invalid source location");
    if (n.endLine < n.startLine || n.endLine === n.startLine && n.endColumn < n.startColumn) throw new b("Invalid source range");
    return Object.freeze({ file: n.file, startLine: n.startLine, startColumn: n.startColumn, endLine: n.endLine, endColumn: n.endColumn });
  }
}
function Ke(n) {
  if (!k(n) || !Y(n, ["protocolVersion", "run", "svg", "elements", "diagnostics"], ["folded"])) throw new b("Invalid visual envelope");
  if (n.protocolVersion !== 1) throw new b(`Unsupported visual protocol version: ${String(n.protocolVersion)}`);
  const i = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!k(n.run) || !Y(n.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof n.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(n.run.id) || typeof n.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(n.run.completedAt) || Number.isNaN(Date.parse(n.run.completedAt)) || !k(n.run.root) || !Y(n.run.root, ["path"]) || typeof n.run.root.path != "string" || !n.run.root.path || !k(n.run.tool) || !Y(n.run.tool, ["name", "version"]) || typeof n.run.tool.name != "string" || !n.run.tool.name || typeof n.run.tool.version != "string" || !n.run.tool.version || !i.has(n.run.outcome)) throw new b("Invalid run metadata");
  if (typeof n.svg != "string" || !n.svg.trim()) throw new b("Invalid SVG");
  const p = [];
  if (n.folded !== void 0) {
    if (!Array.isArray(n.folded)) throw new b("Invalid folded drawings");
    for (const s of n.folded) {
      if (!k(s) || !Y(s, ["depth", "svg"]) || !Number.isInteger(s.depth) || s.depth < 1 || typeof s.svg != "string" || !s.svg.trim()) throw new b("Invalid folded drawing");
      p.push(Object.freeze({ depth: s.depth, svg: s.svg }));
    }
  }
  if (!k(n.elements)) throw new b("Invalid element index");
  const f = {};
  for (const [s, l] of Object.entries(n.elements)) {
    if (!k(l) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in l) || !k(l.evidence)) throw new b(`Invalid element: ${s}`);
    if (l.id !== s || typeof l.id != "string" || !l.id || typeof l.kind != "string" || !l.kind || typeof l.label != "string" || !l.label || typeof l.evidence.verdict != "string" || !ie(l.evidence.statuses) || typeof l.evidence.reused != "boolean" || l.evidence.state !== void 0 && !Ge.has(l.evidence.state) || !ie(l.diagnosticIds) || l.parentId !== void 0 && typeof l.parentId != "string" || l.declaration !== void 0 && typeof l.declaration != "string" || l.limitations !== void 0 && !ie(l.limitations)) throw new b(`Invalid element: ${s}`);
    const v = de(l.evidence);
    f[s] = Object.freeze({ id: s, kind: l.kind, label: l.label, evidence: v, diagnosticIds: Object.freeze([...l.diagnosticIds]), ...l.parentId === void 0 ? {} : { parentId: l.parentId }, ...l.declaration === void 0 ? {} : { declaration: l.declaration }, ...l.limitations === void 0 ? {} : { limitations: Object.freeze([...l.limitations]) }, ...l.source === void 0 ? {} : { source: Ae(l.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new b(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(n.diagnostics)) throw new b("Invalid diagnostics");
  const u = [], h = /* @__PURE__ */ new Set();
  for (const s of n.diagnostics) {
    if (!k(s) || typeof s.id != "string" || !s.id || h.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new b("Invalid diagnostic");
    h.add(s.id), u.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: Ae(s.source) } }));
  }
  for (const s of Object.values(f)) for (const l of s.diagnosticIds ?? []) if (!h.has(l)) throw new b(`Unknown diagnostic: ${l}`);
  for (const s of u) if (s.elementId && !f[s.elementId]) throw new b(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: n.run.id, completedAt: n.run.completedAt, root: Object.freeze({ path: n.run.root.path }), tool: Object.freeze({ name: n.run.tool.name, version: n.run.tool.version }), outcome: n.run.outcome }), svg: n.svg, elements: Object.freeze(f), diagnostics: Object.freeze(u), folded: Object.freeze(p) });
}
const Je = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), Qe = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), et = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Oe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, tt = {
  fill: Oe,
  stroke: Oe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
}, nt = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*$/i;
function ot(n) {
  let i = n, p = "";
  for (; ; ) {
    const f = i.search(/@media\b/i);
    if (f < 0) return { base: i, darkBody: p };
    const u = i.indexOf("{", f);
    if (u < 0) return { base: i.slice(0, f), darkBody: p };
    const h = i.slice(f, u).trim();
    let s = 0, l = u;
    for (; l < i.length; l += 1)
      if (i[l] === "{") s += 1;
      else if (i[l] === "}" && --s === 0) break;
    nt.test(h) && (p += `${i.slice(u + 1, l)}
`), i = i.slice(0, f) + i.slice(Math.min(l + 1, i.length));
  }
}
function it(n, i) {
  if (!n.trim() || n.length > 32768) return;
  const { base: p, darkBody: f } = ot(n), u = i ? `${p}
${f}` : p, h = /\s*([^{}]+)\{([^{}]*)\}/gy, s = [];
  let l = 0;
  for (; l < u.length; ) {
    h.lastIndex = l;
    const v = h.exec(u);
    if (!v) return u.slice(l).trim() === "" ? s : void 0;
    l = h.lastIndex;
    const w = v[1], L = v[2];
    if (w === void 0 || L === void 0) return;
    const C = w.split(",").map((x) => x.trim());
    if (!C.every((x) => et.test(x))) return;
    const _ = [];
    for (const x of L.split(";")) {
      const d = x.indexOf(":");
      if (d < 1) continue;
      const m = x.slice(0, d).trim().toLowerCase(), D = x.slice(d + 1).trim();
      tt[m]?.test(D) === !0 && _.push([m, D]);
    }
    _.length && s.push({ selectors: C, declarations: _ });
  }
  return s;
}
function Te(n, i = {}) {
  const p = i.prefersDark === !0;
  if (/<!doctype|<\?xml-stylesheet/i.test(n)) throw new Error("The artifact contains forbidden XML directives");
  const f = new DOMParser().parseFromString(n, "image/svg+xml");
  if (f.querySelector("parsererror") || f.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const u of [...f.querySelectorAll("*")]) {
    if (u.localName.toLowerCase() === "style") {
      const h = it(u.textContent ?? "", p);
      if (h) for (const s of h) for (const l of s.selectors)
        for (const v of [...f.documentElement.querySelectorAll(l)])
          for (const [w, L] of s.declarations) v.setAttribute(w, L);
      u.remove();
      continue;
    }
    if (Je.has(u.localName.toLowerCase())) {
      u.remove();
      continue;
    }
    for (const h of [...u.attributes]) {
      const s = h.name.toLowerCase(), l = h.value.trim().toLowerCase(), v = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(l);
      (s.startsWith("on") || s === "style" || v || Qe.has(s) && l !== "" && !l.startsWith("#")) && u.removeAttribute(h.name);
    }
  }
  return new XMLSerializer().serializeToString(f.documentElement);
}
const st = 1, yt = () => ({ post: (n) => window.parent.postMessage(n, "*") });
function rt(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n, p = i.overlays;
  return typeof i.zoom == "number" && Number.isFinite(i.zoom) && typeof i.panX == "number" && Number.isFinite(i.panX) && typeof i.panY == "number" && Number.isFinite(i.panY) && typeof p == "object" && p !== null && typeof p.earned == "boolean" && typeof p.gap == "boolean" && typeof p.violation == "boolean" && (i.detailsHidden === void 0 || typeof i.detailsHidden == "boolean") && (i.runId === void 0 || typeof i.runId == "string") && (i.selectedId === void 0 || typeof i.selectedId == "string") && (i.focusedId === void 0 || typeof i.focusedId == "string") && (i.hoverTooltips === void 0 || typeof i.hoverTooltips == "boolean");
}
function dt(n) {
  if (typeof n != "object" || n === null) return !1;
  const i = n;
  return i.channel === "ply-vis" && i.version === 1 && (i.type === "artifact" && "envelope" in i || i.type === "restore-state" && rt(i.state));
}
const at = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, foldDetail: !0, hoverTooltips: !0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), $e = (n, i) => Object.freeze({ ...n, ...i, overlays: Object.freeze({ ...n.overlays, ...i.overlays }) });
function ct(n, i, p = 0.5) {
  return i.x >= n.x - p && i.y >= n.y - p && i.x + i.width <= n.x + n.width + p && i.y + i.height <= n.y + n.height + p;
}
function lt(n, i, p = {}) {
  const f = p.margin ?? 24, u = p.minZoom ?? 0.2, h = p.maxZoom ?? 4, s = Math.max(1, n.width - f * 2), l = Math.max(1, n.height - f * 2), v = Math.max(1, i.width), w = Math.max(1, i.height), L = Math.min(h, Math.max(u, Math.min(s / v, l / w)));
  return {
    zoom: L,
    panX: n.width / 2 - (i.x + v / 2) * L,
    panY: n.height / 2 - (i.y + w / 2) * L
  };
}
function ft(n, i, p) {
  return {
    zoom: i,
    panX: p.x - (p.x - n.panX) / n.zoom * i,
    panY: p.y - (p.y - n.panY) / n.zoom * i
  };
}
const ut = 500, Me = /* @__PURE__ */ new Set(["vscode-dark", "vscode-high-contrast"]), pt = /* @__PURE__ */ new Set(["vscode-light", "vscode-high-contrast-light"]);
function se() {
  const n = typeof document < "u" ? document.body : void 0, i = n?.dataset.vscodeThemeKind;
  if (i !== void 0) return Me.has(i);
  if (n) {
    for (const p of Me) if (n.classList.contains(p)) return !0;
    for (const p of pt) if (n.classList.contains(p)) return !1;
  }
  return typeof window < "u" && typeof window.matchMedia == "function" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
const re = (n, i) => `<button type="button" aria-label="${n}" title="${n}">${i}</button>`, mt = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${re("Zoom out", "−")}${re("Zoom in", "+")}${re("Fit canvas", "Fit")}
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
function gt(n, i, p = []) {
  n.innerHTML = mt;
  const f = n.querySelector(".ply-vis"), u = f.querySelector(".ply-canvas"), h = f.querySelector(".ply-stage"), s = f.querySelector(".ply-tooltip"), l = f.querySelector(".ply-context-menu"), v = f.querySelector(".ply-inspector"), w = f.querySelector(".ply-inspector-toggle"), L = f.querySelector(".ply-workspace"), C = f.querySelector(".ply-status"), _ = f.querySelector(".ply-toolbar fieldset"), x = f.querySelector(".ply-breadcrumbs");
  let d = at(), m, D, F = se(), j, S, ae = 0, E, X, P;
  const ce = () => i.post({ channel: "ply-vis", version: st, type: "persist-state", state: d }), A = (e, t = !0) => {
    d = $e(d, e), t && ce();
  }, N = () => {
    h.style.transform = `translate(${d.panX}px, ${d.panY}px) scale(${d.zoom})`;
  }, ze = () => m ? Object.values(m.elements).filter((e) => !d.focusedId || e.id === d.focusedId || U(e, d.focusedId, m.elements)) : [];
  function q() {
    v.hidden = d.detailsHidden, L.classList.toggle("is-inspector-hidden", d.detailsHidden);
    const e = d.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!d.detailsHidden)), w.textContent = d.detailsHidden ? "‹" : "›";
  }
  function le(e, t = !0) {
    A({ detailsHidden: e }, t), q();
  }
  function U(e, t, o) {
    let a = e.parentId;
    for (; a; ) {
      if (a === t) return !0;
      a = o[a]?.parentId;
    }
    return !1;
  }
  function De(e) {
    let t = 0, o = e;
    for (; o?.parentId && o.id !== d.focusedId; )
      o = m?.elements[o.parentId], t += 1;
    return d.focusedId && o?.id !== d.focusedId ? Number.POSITIVE_INFINITY : t;
  }
  const fe = () => d.foldDetail ? d.zoom < 0.8 ? 1 : d.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY : Number.POSITIVE_INFINITY;
  function je() {
    if (x.replaceChildren(), !m) return;
    const e = [];
    let t = d.focusedId ? m.elements[d.focusedId] : void 0;
    for (; t?.parentId; )
      e.unshift(t), t = m.elements[t.parentId];
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", x.append(o);
    for (const a of e) {
      const r = document.createElement("button");
      r.type = "button", r.textContent = a.label, r.dataset.focusId = a.id, x.append(r);
    }
  }
  function Z(e) {
    v.replaceChildren();
    const t = document.createElement("h2");
    if (t.textContent = e?.label ?? "Details", v.append(t), !e || !m) {
      const c = document.createElement("p");
      c.textContent = "Select an item to inspect its declaration and evidence.", v.append(c);
      return;
    }
    const o = e.declaration?.split(`
`).filter(Boolean);
    v.append(R("Declaration", o?.length ? o : ["No declaration text supplied."])), v.append(R("Verdict", [e.evidence.verdict])), v.append(R("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const a = Object.entries(e.evidence).filter(([c]) => !["verdict", "statuses"].includes(c)).map(([c, y]) => `${c}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    v.append(R("Earned evidence", a.length ? a : ["No additional evidence details supplied."])), v.append(R("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const r = new Map(m.diagnostics.map((c) => [c.id, c])), g = e.diagnosticIds.map((c) => r.get(c)).filter((c) => c !== void 0).map((c) => `${c.code} — ${c.severity}: ${c.message}`);
    if (v.append(R("Diagnostics", g.length ? g : ["No diagnostics supplied."])), v.append(Ne(m.run)), e.source) {
      const c = document.createElement("button");
      c.type = "button", c.className = "ply-source", c.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, c.addEventListener("click", () => i.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), v.append(c);
    }
  }
  function R(e, t) {
    const o = document.createElement("section"), a = document.createElement("h3");
    a.textContent = e, o.append(a);
    const r = document.createElement("ul");
    for (const g of t) {
      const c = document.createElement("li");
      c.textContent = g, r.append(c);
    }
    return o.append(r), o;
  }
  function Ne(e) {
    const t = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, o = document.createElement("section"), a = document.createElement("h3");
    a.textContent = "Run details";
    const r = document.createElement("dl"), g = [
      ["Result", t[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [c, y] of g) {
      const M = document.createElement("dt");
      M.textContent = c;
      const H = document.createElement("dd");
      H.textContent = y, r.append(M, H);
    }
    return o.append(a, r), o;
  }
  function W(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function qe(e) {
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
  function Re(e) {
    const t = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    t.add(s.id), e.setAttribute("aria-describedby", [...t].join(" "));
  }
  function ue(e) {
    const t = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== s.id);
    t.length ? e.setAttribute("aria-describedby", t.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function Ve(e) {
    return s.scrollHeight <= s.clientHeight ? !1 : e > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight : e < 0 ? s.scrollTop > 0 : !1;
  }
  function z() {
    X !== void 0 && window.clearTimeout(X), X = void 0;
  }
  function I() {
    E && ue(E), z(), E = void 0, s.hidden = !0, s.replaceChildren();
  }
  function He(e, t) {
    if (!m) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const a = Object.entries(e.evidence).filter(([c, y]) => !["verdict", "statuses"].includes(c) && y !== !1 && y !== void 0).map(([c, y]) => `${c}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    o.push(...a), o.push(...(e.limitations ?? []).map((c) => `Limitation: ${c}`));
    const r = new Map(m.diagnostics.map((c) => [c.id, c]));
    for (const c of e.diagnosticIds) {
      const y = r.get(c);
      y && o.push(`${y.code} — ${y.severity}: ${y.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const g = t.dataset.plyTitle?.trim();
    return g && g !== e.label && !o.includes(g) && o.push(g), o;
  }
  function pe(e, t) {
    const o = u.getBoundingClientRect(), a = 8;
    s.style.maxHeight = `${Math.max(0, o.height - a * 2)}px`;
    const r = 12, g = s.offsetWidth, c = s.offsetHeight, y = Math.max(a, o.width - g - a), M = Math.max(a, o.height - c - a), H = e - o.left + r, B = t - o.top + r, oe = B + c <= o.height - a ? B : t - o.top - c - r;
    s.style.left = `${Math.min(y, Math.max(a, H))}px`, s.style.top = `${Math.min(M, Math.max(a, oe))}px`;
  }
  function me(e, t, o) {
    const a = O(e), r = e.dataset.plyTitle?.trim();
    if (!a && !r || e.hasAttribute("hidden")) {
      I();
      return;
    }
    E && E !== e && ue(E), E = e;
    const g = document.createElement("span");
    if (a) {
      const y = document.createElement("strong");
      y.textContent = a.label, g.textContent = He(a, e).join(`
`), s.replaceChildren(y, g);
    } else
      g.textContent = r, s.replaceChildren(g);
    s.hidden = !1, Re(e);
    const c = e.getBoundingClientRect();
    pe(t ?? c.left + c.width / 2, o ?? c.bottom);
  }
  function he(e, t, o) {
    z(), E && E !== e && I(), X = window.setTimeout(() => {
      X = void 0, me(e, t, o);
    }, ut);
  }
  function Be(e, t, o) {
    const a = u.getBoundingClientRect(), r = 8, g = Math.max(r, a.width - e.offsetWidth - r), c = Math.max(r, a.height - e.offsetHeight - r);
    e.style.left = `${Math.min(g, Math.max(r, t - a.left))}px`, e.style.top = `${Math.min(c, Math.max(r, o - a.top))}px`;
  }
  function $() {
    if (l.hidden) return;
    const e = l.contains(document.activeElement), t = P;
    l.hidden = !0, l.replaceChildren(), P = void 0, e && (t?.isConnected ? t : u).focus();
  }
  function ye() {
    return [...l.querySelectorAll('button[role="menuitem"]')];
  }
  function G(e) {
    const t = ye();
    if (!t.length) return;
    for (const a of t) a.tabIndex = -1;
    const o = t[(e + t.length) % t.length];
    o.tabIndex = 0, o.focus();
  }
  function Ye(e) {
    const t = e.target instanceof Element ? e.target.closest("[data-element-id], [data-ply-id]") : null, o = t ? O(t) : void 0, a = [];
    if (o && a.push({ label: `Zoom into ${o.label}`, run: () => V(o.id) }), d.focusedId && a.push({ label: "Back to Workspace", run: () => V(void 0) }), !a.length) return;
    e.preventDefault(), I();
    const r = document.activeElement;
    P = r instanceof HTMLElement || r instanceof SVGElement ? r : void 0, l.replaceChildren();
    for (const g of a) {
      const c = document.createElement("li");
      c.setAttribute("role", "presentation");
      const y = document.createElement("button");
      y.type = "button", y.setAttribute("role", "menuitem"), y.textContent = g.label, y.tabIndex = -1, y.addEventListener("click", () => {
        $(), g.run();
      }), c.append(y), l.append(c);
    }
    l.hidden = !1, Be(l, e.clientX, e.clientY), G(0);
  }
  l.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault(), $();
      return;
    }
    const o = ye().indexOf(document.activeElement);
    e.key === "ArrowDown" ? (e.preventDefault(), G(o + 1)) : e.key === "ArrowUp" && (e.preventDefault(), G(o - 1));
  }), u.addEventListener("contextmenu", Ye);
  const ge = (e) => {
    !l.hidden && e.target instanceof Node && !l.contains(e.target) && $();
  };
  window.addEventListener("pointerdown", ge);
  function T() {
    if (!m) return;
    Xe();
    const e = [...h.querySelectorAll("[data-element-id], [data-ply-id]")], t = d.focusedId ? m.elements[d.focusedId] : void 0;
    for (const r of e) {
      const g = r.dataset.elementId ?? r.dataset.plyId ?? "", c = m.elements[g];
      if (!c) {
        r.removeAttribute("hidden");
        continue;
      }
      const y = /* @__PURE__ */ new Set([c.evidence.verdict, ...c.evidence.statuses]), M = c.evidence.state ?? (y.has("violation") ? "violation" : y.has("gap") ? "gap" : y.has("earned") ? "earned" : "declared"), H = M === "declared" || d.overlays[M], B = t ? U(t, c.id, m.elements) : !1, oe = !d.focusedId || c.id === d.focusedId || U(c, d.focusedId, m.elements) || B, Pe = B || De(c) <= fe();
      r.toggleAttribute("hidden", !oe || !Pe || !H && !B);
      const Ue = [c.evidence.verdict, ...c.evidence.statuses].filter(Boolean).join(", ") || "declared";
      r.setAttribute("role", "button"), r.setAttribute("aria-label", `${c.kind}: ${c.label}; ${Ue}`), r.dataset.state = M, r.classList.toggle("is-selected", c.id === d.selectedId), r === E && (r.hasAttribute("hidden") || !r.isConnected) && I();
    }
    const o = e.filter((r) => !r.hasAttribute("hidden") && O(r)), a = o.find((r) => O(r)?.id === d.selectedId) ?? o[0];
    for (const r of e) r.setAttribute("tabindex", r === a ? "0" : "-1");
    _e(), je();
  }
  function _e() {
    const e = h.querySelector("svg");
    if (!e) return;
    for (const r of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      r.removeAttribute("hidden"), r.removeAttribute("data-ply-focus-hidden");
    if (!d.focusedId) return;
    const t = [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => O(r)?.id === d.focusedId);
    if (!t || typeof t.getBBox != "function") return;
    const o = t.getBBox(), a = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const r of [...e.children]) {
      if (!(r instanceof SVGElement) || r.matches("[data-element-id], [data-ply-id], defs, style, title") || r.contains(t)) continue;
      const g = r;
      if (typeof g.getBBox != "function") continue;
      let c;
      try {
        c = g.getBBox();
      } catch {
        continue;
      }
      ct(a, c) || (r.setAttribute("hidden", ""), r.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function Fe(e) {
    m = e, A({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const t = Object.keys(e.elements).length > 0;
    _.hidden = !t, x.hidden = !t, w.hidden = !t, t || le(!0, !1), q(), I(), $(), j = void 0, K(e.svg), u.dataset.empty = "false";
    const o = u.querySelector(".ply-empty");
    o && o.remove(), T(), N(), Z(d.selectedId ? e.elements[d.selectedId] : void 0), C.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => te(!1));
  }
  function K(e) {
    h.innerHTML = e;
    for (const t of [...h.querySelectorAll("title")]) {
      const o = t.parentElement, a = o?.closest("[data-element-id], [data-ply-id]") ?? (o instanceof SVGElement ? o : void 0), r = t.textContent?.trim();
      a && r && (a.dataset.plyTitle = r, O(a) || (a.setAttribute("tabindex", "0"), a.setAttribute("role", "img"), a.setAttribute("aria-label", r))), t.remove();
    }
  }
  function Xe() {
    if (!m) return;
    const e = d.focusedId ? void 0 : Ze();
    if (e === j) return;
    const t = e === void 0 ? m.svg : m.folded.find((o) => o.depth === e)?.svg;
    if (!t) {
      j = e;
      return;
    }
    I(), $(), K(t), j = e;
  }
  function Ze() {
    if (!m) return;
    const e = fe();
    if (Number.isFinite(e))
      return m.folded.some((t) => t.depth === e) ? e : void 0;
  }
  function ve(e) {
    return Object.freeze({
      ...e,
      svg: Te(e.svg, { prefersDark: F }),
      folded: Object.freeze(e.folded.map((t) => Object.freeze({ depth: t.depth, svg: Te(t.svg, { prefersDark: F }) })))
    });
  }
  function J(e) {
    try {
      const t = Ke(e);
      return D = t, Fe(ve(t)), delete f.dataset.error, !0;
    } catch (t) {
      const o = t instanceof b || t instanceof Error ? t.message : "Unknown artifact error";
      return C.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, f.dataset.error = "true", i.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function be(e) {
    if (e === F || !D) {
      F = e;
      return;
    }
    F = e, m = ve(D), I(), $();
    const t = j === void 0 ? m.svg : m.folded.find((o) => o.depth === j)?.svg ?? m.svg;
    K(t), T(), N(), Z(d.selectedId ? m.elements[d.selectedId] : void 0);
  }
  function Q(e) {
    m?.elements[e] && (A({ selectedId: e, detailsHidden: !1 }), q(), T(), Z(m.elements[e]));
  }
  function we(e) {
    [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => O(o)?.id === e)?.focus();
  }
  function V(e) {
    e && !m?.elements[e] || (e && !m.elements[e].parentId && (e = void 0), I(), $(), A({ focusedId: e, selectedId: e, detailsHidden: !e }), q(), T(), Z(e ? m?.elements[e] : void 0), te());
  }
  function We() {
    const e = u.getBoundingClientRect(), o = (d.selectedId ? [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((a) => O(a)?.id === d.selectedId) : void 0)?.getBoundingClientRect();
    return o ? { x: o.left - e.left + o.width / 2, y: o.top - e.top + o.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function ee(e, t = We()) {
    I(), $(), A(ft(d, Math.min(4, Math.max(0.2, e)), t)), T(), N(), C.textContent = `Zoom ${Math.round(d.zoom * 100)}%`;
  }
  function te(e = !0) {
    const t = h.querySelector("svg");
    if (!t) return;
    const o = h.getBoundingClientRect(), a = d.focusedId ? [...h.querySelectorAll("[data-element-id], [data-ply-id]")].find((y) => O(y)?.id === d.focusedId) : t;
    if (!a) return;
    const r = a.getBoundingClientRect(), g = d.zoom || 1, c = {
      x: (r.left - o.left) / g,
      y: (r.top - o.top) / g,
      width: r.width / g,
      height: r.height / g
    };
    A(lt({ width: u.clientWidth, height: u.clientHeight }, c)), T(), N(), e && (C.textContent = d.focusedId ? "Focused element fitted" : "Canvas fitted");
  }
  f.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => ee(d.zoom * 1.2)), f.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => ee(d.zoom / 1.2)), f.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => te()), w.addEventListener("click", () => le(!d.detailsHidden)), f.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const t = e.dataset.overlay;
    A({ overlays: { ...d.overlays, [t]: e.checked } }), T();
  })), f.querySelector("[data-fold-detail]").addEventListener("change", (e) => {
    A({ foldDetail: e.target.checked }), T(), C.textContent = d.foldDetail ? "Detail folds away as you zoom out" : "Detail stays on screen at every zoom";
  }), f.querySelector("[data-hover-tooltips]").addEventListener("change", (e) => {
    const t = e.target.checked;
    A({ hoverTooltips: t }), t || (z(), E && document.activeElement !== E && I()), C.textContent = t ? "Tooltips appear on hover" : "Tooltips stay hidden on hover; tabbing to an item still shows one";
  }), x.addEventListener("click", (e) => {
    const t = e.target.closest("button[data-focus-id]");
    t && V(t.dataset.focusId || void 0);
  }), h.addEventListener("click", (e) => {
    if (performance.now() < ae) return;
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && Q(o);
  }), h.addEventListener("dblclick", (e) => {
    const t = e.target.closest("[data-element-id], [data-ply-id]"), o = t?.dataset.elementId ?? t?.dataset.plyId;
    o && V(o);
  }), h.addEventListener("pointerover", (e) => {
    if (!d.hoverTooltips) return;
    const t = W(e.target);
    t && he(t, e.clientX, e.clientY);
  }), h.addEventListener("pointermove", (e) => {
    if (!d.hoverTooltips) {
      z();
      return;
    }
    const t = W(e.target);
    if (!t) {
      z();
      return;
    }
    t === E && !s.hidden ? pe(e.clientX, e.clientY) : he(t, e.clientX, e.clientY);
  }), h.addEventListener("pointerout", (e) => {
    const t = W(e.target);
    !t || e.relatedTarget instanceof Node && (t.contains(e.relatedTarget) || s.contains(e.relatedTarget)) || t.contains(document.activeElement) || I();
  }), h.addEventListener("focusin", (e) => {
    const t = W(e.target);
    t && (!d.hoverTooltips && !qe(t) || (z(), me(t)));
  }), h.addEventListener("focusout", (e) => {
    const t = W(e.target);
    !t || e.relatedTarget instanceof Node && t.contains(e.relatedTarget) || t.matches(":hover") || I();
  }), s.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && E?.contains(e.relatedTarget) || I();
  }), s.addEventListener("wheel", (e) => {
    if (Ve(e.deltaY)) {
      e.stopPropagation();
      return;
    }
    I();
  }, { passive: !0 }), s.addEventListener("pointerdown", (e) => e.stopPropagation()), u.addEventListener("wheel", (e) => {
    e.preventDefault();
    const t = u.getBoundingClientRect();
    ee(d.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - t.left, y: e.clientY - t.top });
  }, { passive: !1 }), u.addEventListener("pointerdown", (e) => {
    e.button === 0 && (S = { x: e.clientX, y: e.clientY, panX: d.panX, panY: d.panY, pointerId: e.pointerId, moved: !1 });
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
  const ne = () => {
    S && (S.moved && (ae = performance.now() + 250, ce()), S = void 0, u.classList.remove("is-panning"));
  };
  u.addEventListener("pointerup", ne), u.addEventListener("pointercancel", ne), u.addEventListener("lostpointercapture", ne), u.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !s.hidden) {
      e.preventDefault(), I();
      return;
    }
    const t = ze();
    if (!t.length) return;
    const o = Math.max(0, t.findIndex((a) => a.id === d.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const a = t[(o + 1) % t.length].id;
      Q(a), we(a);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const a = t[(o - 1 + t.length) % t.length].id;
      Q(a), we(a);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const a = t[o];
      V(a.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const a = d.focusedId ? m?.elements[d.focusedId]?.parentId : void 0;
      V(a);
    }
  });
  const Ie = (e) => {
    dt(e.data) && (e.data.type === "artifact" ? J(e.data.envelope) : (d = $e(d, e.data.state), f.querySelectorAll("[data-overlay]").forEach((t) => {
      t.checked = d.overlays[t.dataset.overlay];
    }), f.querySelector("[data-fold-detail]").checked = d.foldDetail, f.querySelector("[data-hover-tooltips]").checked = d.hoverTooltips, m && (q(), T(), N(), Z(d.selectedId ? m.elements[d.selectedId] : void 0))));
  }, Ee = (e) => {
    C.textContent = `Viewer error: ${e}`, i.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, xe = (e) => Ee(e.message || "Unknown runtime error"), Se = (e) => Ee(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", Ie), window.addEventListener("error", xe), window.addEventListener("unhandledrejection", Se);
  const ke = typeof MutationObserver == "function" ? new MutationObserver(() => be(se())) : void 0;
  ke?.observe(document.body, { attributes: !0, attributeFilter: ["class", "data-vscode-theme-kind"] });
  const Le = typeof window.matchMedia == "function" ? window.matchMedia("(prefers-color-scheme: dark)") : void 0, Ce = () => be(se());
  Le?.addEventListener("change", Ce), q();
  for (const e of p) J(e);
  return i.post({ channel: "ply-vis", version: 1, type: "ready" }), p.length || i.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: J, getState: () => d, destroy: () => {
    z(), window.removeEventListener("message", Ie), window.removeEventListener("error", xe), window.removeEventListener("unhandledrejection", Se), window.removeEventListener("pointerdown", ge), ke?.disconnect(), Le?.removeEventListener("change", Ce), n.replaceChildren();
  } };
}
const vt = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  vt as CONTENT_SECURITY_POLICY,
  b as EnvelopeError,
  st as HOST_PROTOCOL_VERSION,
  ht as PROTOCOL_VERSION,
  at as initialViewState,
  dt as isHostResponse,
  gt as mountViewer,
  Ke as parseEnvelope,
  Te as sanitizeSvg,
  $e as updateViewState,
  yt as windowHostBridge
};
//# sourceMappingURL=index.js.map
