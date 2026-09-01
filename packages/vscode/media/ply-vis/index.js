const Re = 1;
class v extends Error {
}
const x = (t) => typeof t == "object" && t !== null && !Array.isArray(t), D = (t, o, l = []) => {
  const m = /* @__PURE__ */ new Set([...o, ...l]);
  return o.every((u) => u in t) && Object.keys(t).every((u) => m.has(u));
}, U = (t) => Array.isArray(t) && t.every((o) => typeof o == "string");
function G(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(G));
  if (x(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([o, l]) => [o, G(l)])));
  throw new v("Evidence contains a non-JSON value");
}
function le(t) {
  if (t !== void 0) {
    if (!x(t) || !D(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new v("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((o) => o === ".." || o === ".")) throw new v("Invalid source location");
    for (const o of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[o]) || t[o] < 0) throw new v("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new v("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function Ie(t) {
  if (!x(t) || !D(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new v("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new v(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const o = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!x(t.run) || !D(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !x(t.run.root) || !D(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !x(t.run.tool) || !D(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !o.has(t.run.outcome)) throw new v("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new v("Invalid SVG");
  if (!x(t.elements)) throw new v("Invalid element index");
  const l = {};
  for (const [s, a] of Object.entries(t.elements)) {
    if (!x(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in a) || !x(a.evidence)) throw new v(`Invalid element: ${s}`);
    if (a.id !== s || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !U(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !U(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !U(a.limitations)) throw new v(`Invalid element: ${s}`);
    const g = G(a.evidence);
    l[s] = Object.freeze({ id: s, kind: a.kind, label: a.label, evidence: g, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: le(a.source) } });
  }
  for (const s of Object.values(l)) if (s.parentId && !l[s.parentId]) throw new v(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new v("Invalid diagnostics");
  const m = [], u = /* @__PURE__ */ new Set();
  for (const s of t.diagnostics) {
    if (!x(s) || typeof s.id != "string" || !s.id || u.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new v("Invalid diagnostic");
    u.add(s.id), m.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: le(s.source) } }));
  }
  for (const s of Object.values(l)) for (const a of s.diagnosticIds ?? []) if (!u.has(a)) throw new v(`Unknown diagnostic: ${a}`);
  for (const s of m) if (s.elementId && !l[s.elementId]) throw new v(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(l), diagnostics: Object.freeze(m) });
}
const Ee = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), xe = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), Se = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, fe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, Le = {
  fill: fe,
  stroke: fe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function Ae(t) {
  let o = t;
  for (; ; ) {
    const l = o.search(/@media\b/i);
    if (l < 0) return o;
    const m = o.indexOf("{", l);
    if (m < 0) return o.slice(0, l);
    let u = 0, s = m;
    for (; s < o.length; s += 1)
      if (o[s] === "{") u += 1;
      else if (o[s] === "}" && --u === 0) break;
    o = o.slice(0, l) + o.slice(Math.min(s + 1, o.length));
  }
}
function Ce(t) {
  if (!t.trim() || t.length > 32768) return;
  const o = Ae(t), l = /\s*([^{}]+)\{([^{}]*)\}/gy, m = [];
  let u = 0;
  for (; u < o.length; ) {
    l.lastIndex = u;
    const s = l.exec(o);
    if (!s) return o.slice(u).trim() === "" ? m : void 0;
    u = l.lastIndex;
    const a = s[1], g = s[2];
    if (a === void 0 || g === void 0) return;
    const w = a.split(",").map((b) => b.trim());
    if (!w.every((b) => Se.test(b))) return;
    const S = [];
    for (const b of g.split(";")) {
      const z = b.indexOf(":");
      if (z < 1) continue;
      const L = b.slice(0, z).trim().toLowerCase(), c = b.slice(z + 1).trim();
      Le[L]?.test(c) === !0 && S.push([L, c]);
    }
    S.length && m.push({ selectors: w, declarations: S });
  }
  return m;
}
function ke(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const o = new DOMParser().parseFromString(t, "image/svg+xml");
  if (o.querySelector("parsererror") || o.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const l of [...o.querySelectorAll("*")]) {
    if (l.localName.toLowerCase() === "style") {
      const m = Ce(l.textContent ?? "");
      if (m) for (const u of m) for (const s of u.selectors)
        for (const a of [...o.documentElement.querySelectorAll(s)])
          for (const [g, w] of u.declarations) a.setAttribute(g, w);
      l.remove();
      continue;
    }
    if (Ee.has(l.localName.toLowerCase())) {
      l.remove();
      continue;
    }
    for (const m of [...l.attributes]) {
      const u = m.name.toLowerCase(), s = m.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(s);
      (u.startsWith("on") || u === "style" || a || xe.has(u) && s !== "" && !s.startsWith("#")) && l.removeAttribute(m.name);
    }
  }
  return new XMLSerializer().serializeToString(o.documentElement);
}
const $e = 1, Ve = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function Oe(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t, l = o.overlays;
  return typeof o.zoom == "number" && Number.isFinite(o.zoom) && typeof o.panX == "number" && Number.isFinite(o.panX) && typeof o.panY == "number" && Number.isFinite(o.panY) && typeof l == "object" && l !== null && typeof l.earned == "boolean" && typeof l.gap == "boolean" && typeof l.violation == "boolean" && (o.detailsHidden === void 0 || typeof o.detailsHidden == "boolean") && (o.runId === void 0 || typeof o.runId == "string") && (o.selectedId === void 0 || typeof o.selectedId == "string") && (o.focusedId === void 0 || typeof o.focusedId == "string");
}
function je(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t;
  return o.channel === "ply-vis" && o.version === 1 && (o.type === "artifact" && "envelope" in o || o.type === "restore-state" && Oe(o.state));
}
const Te = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), pe = (t, o) => Object.freeze({ ...t, ...o, overlays: Object.freeze({ ...t.overlays, ...o.overlays }) });
function ze(t, o, l = 0.5) {
  return o.x >= t.x - l && o.y >= t.y - l && o.x + o.width <= t.x + t.width + l && o.y + o.height <= t.y + t.height + l;
}
function Ne(t, o, l = {}) {
  const m = l.margin ?? 24, u = l.minZoom ?? 0.2, s = l.maxZoom ?? 4, a = Math.max(1, t.width - m * 2), g = Math.max(1, t.height - m * 2), w = Math.max(1, o.width), S = Math.max(1, o.height), b = Math.min(s, Math.max(u, Math.min(a / w, g / S)));
  return {
    zoom: b,
    panX: t.width / 2 - (o.x + w / 2) * b,
    panY: t.height / 2 - (o.y + S / 2) * b
  };
}
const Me = 500, W = (t, o) => `<button type="button" aria-label="${t}" title="${t}">${o}</button>`, qe = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${W("Zoom out", "−")}${W("Zoom in", "+")}${W("Fit canvas", "Fit")}
      </div>
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
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <button type="button" class="ply-inspector-toggle" aria-label="Show details" title="Show details" aria-controls="ply-inspector" aria-expanded="false">‹</button>
      <aside class="ply-inspector" id="ply-inspector" aria-label="Element details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function De(t, o, l = []) {
  t.innerHTML = qe;
  const m = t.querySelector(".ply-vis"), u = m.querySelector(".ply-canvas"), s = m.querySelector(".ply-stage"), a = m.querySelector(".ply-tooltip"), g = m.querySelector(".ply-inspector"), w = m.querySelector(".ply-inspector-toggle"), S = m.querySelector(".ply-workspace"), b = m.querySelector(".ply-status"), z = m.querySelector(".ply-toolbar fieldset"), L = m.querySelector(".ply-breadcrumbs");
  let c = Te(), y, I, J = 0, E, N;
  const K = () => o.post({ channel: "ply-vis", version: $e, type: "persist-state", state: c }), A = (e, n = !0) => {
    c = pe(c, e), n && K();
  }, M = () => {
    s.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, ue = () => y ? Object.values(y.elements).filter((e) => !c.focusedId || e.id === c.focusedId || ee(e, c.focusedId, y.elements)) : [];
  function $() {
    g.hidden = c.detailsHidden, S.classList.toggle("is-inspector-hidden", c.detailsHidden);
    const e = c.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!c.detailsHidden)), w.textContent = c.detailsHidden ? "‹" : "›";
  }
  function Q(e, n = !0) {
    A({ detailsHidden: e }, n), $();
  }
  function ee(e, n, r) {
    let i = e.parentId;
    for (; i; ) {
      if (i === n) return !0;
      i = r[i]?.parentId;
    }
    return !1;
  }
  function me() {
    if (L.replaceChildren(), !y) return;
    const e = [];
    let n = c.focusedId ? y.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? y.elements[n.parentId] : void 0;
    const r = document.createElement("button");
    r.type = "button", r.textContent = "Workspace", r.dataset.focusId = "", L.append(r);
    for (const i of e) {
      const f = document.createElement("button");
      f.type = "button", f.textContent = i.label, f.dataset.focusId = i.id, L.append(f);
    }
  }
  function H(e) {
    g.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", g.append(n), !e || !y) {
      const d = document.createElement("p");
      d.textContent = "Select an item to inspect its declaration and evidence.", g.append(d);
      return;
    }
    const r = e.declaration?.split(`
`).filter(Boolean);
    g.append(O("Declaration", r?.length ? r : ["No declaration text supplied."])), g.append(O("Verdict", [e.evidence.verdict])), g.append(O("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const i = Object.entries(e.evidence).filter(([d]) => !["verdict", "statuses"].includes(d)).map(([d, h]) => `${d}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    g.append(O("Earned evidence", i.length ? i : ["No additional evidence details supplied."])), g.append(O("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const f = new Map(y.diagnostics.map((d) => [d.id, d])), p = e.diagnosticIds.map((d) => f.get(d)).filter((d) => d !== void 0).map((d) => `${d.code} — ${d.severity}: ${d.message}`);
    if (g.append(O("Diagnostics", p.length ? p : ["No diagnostics supplied."])), g.append(he(y.run)), e.source) {
      const d = document.createElement("button");
      d.type = "button", d.className = "ply-source", d.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, d.addEventListener("click", () => o.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), g.append(d);
    }
  }
  function O(e, n) {
    const r = document.createElement("section"), i = document.createElement("h3");
    i.textContent = e, r.append(i);
    const f = document.createElement("ul");
    for (const p of n) {
      const d = document.createElement("li");
      d.textContent = p, f.append(d);
    }
    return r.append(f), r;
  }
  function he(e) {
    const n = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, r = document.createElement("section"), i = document.createElement("h3");
    i.textContent = "Run details";
    const f = document.createElement("dl"), p = [
      ["Result", n[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [d, h] of p) {
      const j = document.createElement("dt");
      j.textContent = d;
      const T = document.createElement("dd");
      T.textContent = h, f.append(j, T);
    }
    return r.append(i, f), r;
  }
  function q(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function k(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? y?.elements[n] : void 0;
  }
  function ye(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function te(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((r) => r && r !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function R() {
    N !== void 0 && window.clearTimeout(N), N = void 0;
  }
  function C() {
    E && te(E), R(), E = void 0, a.hidden = !0, a.replaceChildren();
  }
  function ge(e, n) {
    if (!y) return [];
    const r = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && r.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const i = Object.entries(e.evidence).filter(([d, h]) => !["verdict", "statuses"].includes(d) && h !== !1 && h !== void 0).map(([d, h]) => `${d}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    r.push(...i), r.push(...(e.limitations ?? []).map((d) => `Limitation: ${d}`));
    const f = new Map(y.diagnostics.map((d) => [d.id, d]));
    for (const d of e.diagnosticIds) {
      const h = f.get(d);
      h && r.push(`${h.code} — ${h.severity}: ${h.message}`);
    }
    e.source && r.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const p = n.dataset.plyTitle?.trim();
    return p && p !== e.label && !r.includes(p) && r.push(p), r;
  }
  function ne(e, n) {
    const r = u.getBoundingClientRect(), i = 8;
    a.style.maxHeight = `${Math.max(0, r.height - i * 2)}px`;
    const f = 12, p = a.offsetWidth, d = a.offsetHeight, h = Math.max(i, r.width - p - i), j = Math.max(i, r.height - d - i), T = e - r.left + f, Y = n - r.top + f, we = Y + d <= r.height - i ? Y : n - r.top - d - f;
    a.style.left = `${Math.min(h, Math.max(i, T))}px`, a.style.top = `${Math.min(j, Math.max(i, we))}px`;
  }
  function oe(e, n, r) {
    const i = k(e), f = e.dataset.plyTitle?.trim();
    if (!i && !f || e.hasAttribute("hidden")) {
      C();
      return;
    }
    E && E !== e && te(E), E = e;
    const p = document.createElement("span");
    if (i) {
      const h = document.createElement("strong");
      h.textContent = i.label, p.textContent = ge(i, e).join(`
`), a.replaceChildren(h, p);
    } else
      p.textContent = f, a.replaceChildren(p);
    a.hidden = !1, ye(e);
    const d = e.getBoundingClientRect();
    ne(n ?? d.left + d.width / 2, r ?? d.bottom);
  }
  function ie(e, n, r) {
    R(), E && E !== e && C(), N = window.setTimeout(() => {
      N = void 0, oe(e, n, r);
    }, Me);
  }
  function V() {
    if (!y) return;
    const e = [...s.querySelectorAll("[data-element-id], [data-ply-id]")];
    for (const i of e) {
      const f = i.dataset.elementId ?? i.dataset.plyId ?? "", p = y.elements[f];
      if (!p) {
        i.removeAttribute("hidden");
        continue;
      }
      const d = /* @__PURE__ */ new Set([p.evidence.verdict, ...p.evidence.statuses]), h = d.has("violation") ? "violation" : d.has("gap") ? "gap" : d.has("earned") ? "earned" : "declared", j = h === "declared" || c.overlays[h], T = !c.focusedId || p.id === c.focusedId || ee(p, c.focusedId, y.elements);
      i.toggleAttribute("hidden", !j || !T);
      const Y = [p.evidence.verdict, ...p.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${p.kind}: ${p.label}; ${Y}`), i.dataset.state = h, i.classList.toggle("is-selected", p.id === c.selectedId), i === E && (i.hasAttribute("hidden") || !i.isConnected) && C();
    }
    const n = e.filter((i) => !i.hasAttribute("hidden") && k(i)), r = n.find((i) => k(i)?.id === c.selectedId) ?? n[0];
    for (const i of e) i.setAttribute("tabindex", i === r ? "0" : "-1");
    ve(), me();
  }
  function ve() {
    const e = s.querySelector("svg");
    if (!e) return;
    for (const f of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      f.removeAttribute("hidden"), f.removeAttribute("data-ply-focus-hidden");
    if (!c.focusedId) return;
    const n = [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((f) => k(f)?.id === c.focusedId);
    if (!n || typeof n.getBBox != "function") return;
    const r = n.getBBox(), i = { x: r.x, y: r.y, width: r.width, height: r.height };
    for (const f of [...e.children]) {
      if (!(f instanceof SVGElement) || f.matches("[data-element-id], [data-ply-id], defs, style, title")) continue;
      const p = f;
      if (typeof p.getBBox != "function") continue;
      let d;
      try {
        d = p.getBBox();
      } catch {
        continue;
      }
      ze(i, d) || (f.setAttribute("hidden", ""), f.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function be(e) {
    y = e, A({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const n = Object.keys(e.elements).length > 0;
    z.hidden = !n, L.hidden = !n, w.hidden = !n, n || Q(!0, !1), $(), C(), s.innerHTML = e.svg;
    for (const i of [...s.querySelectorAll("title")]) {
      const f = i.parentElement, p = f?.closest("[data-element-id], [data-ply-id]") ?? (f instanceof SVGElement ? f : void 0), d = i.textContent?.trim();
      p && d && (p.dataset.plyTitle = d, k(p) || (p.setAttribute("tabindex", "0"), p.setAttribute("role", "img"), p.setAttribute("aria-label", d))), i.remove();
    }
    u.dataset.empty = "false";
    const r = u.querySelector(".ply-empty");
    r && r.remove(), V(), M(), H(c.selectedId ? e.elements[c.selectedId] : void 0), b.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(F);
  }
  function Z(e) {
    try {
      const n = Ie(e), r = Object.freeze({ ...n, svg: ke(n.svg) });
      return be(r), delete m.dataset.error, !0;
    } catch (n) {
      const r = n instanceof v || n instanceof Error ? n.message : "Unknown artifact error";
      return b.textContent = `Artifact rejected: ${r}. The previous snapshot is unchanged.`, m.dataset.error = "true", o.post({ channel: "ply-vis", version: 1, type: "error", message: r }), !1;
    }
  }
  function X(e) {
    y?.elements[e] && (A({ selectedId: e, detailsHidden: !1 }), $(), V(), H(y.elements[e]));
  }
  function se(e) {
    [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => k(r)?.id === e)?.focus();
  }
  function B(e) {
    e && !y?.elements[e] || (e && !y.elements[e].parentId && (e = void 0), A({ focusedId: e, selectedId: e, detailsHidden: !e }), $(), V(), H(e ? y?.elements[e] : void 0), F());
  }
  function _(e) {
    A({ zoom: Math.min(4, Math.max(0.2, e)) }), M(), b.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function F() {
    const e = s.querySelector("svg");
    if (!e) return;
    const n = s.getBoundingClientRect(), r = c.focusedId ? [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => k(d)?.id === c.focusedId) : e;
    if (!r) return;
    const i = r.getBoundingClientRect(), f = c.zoom || 1, p = {
      x: (i.left - n.left) / f,
      y: (i.top - n.top) / f,
      width: i.width / f,
      height: i.height / f
    };
    A(Ne({ width: u.clientWidth, height: u.clientHeight }, p)), M(), b.textContent = c.focusedId ? "Focused element fitted" : "Canvas fitted";
  }
  m.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => _(c.zoom * 1.2)), m.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => _(c.zoom / 1.2)), m.querySelector('[aria-label="Fit canvas"]').addEventListener("click", F), w.addEventListener("click", () => Q(!c.detailsHidden)), m.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    A({ overlays: { ...c.overlays, [n]: e.checked } }), V();
  })), L.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && B(n.dataset.focusId || void 0);
  }), s.addEventListener("click", (e) => {
    if (performance.now() < J) return;
    const n = e.target.closest("[data-element-id], [data-ply-id]"), r = n?.dataset.elementId ?? n?.dataset.plyId;
    r && X(r);
  }), s.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), r = n?.dataset.elementId ?? n?.dataset.plyId;
    r && B(r);
  }), s.addEventListener("pointerover", (e) => {
    const n = q(e.target);
    n && ie(n, e.clientX, e.clientY);
  }), s.addEventListener("pointermove", (e) => {
    const n = q(e.target);
    if (!n) {
      R();
      return;
    }
    n === E && !a.hidden ? ne(e.clientX, e.clientY) : ie(n, e.clientX, e.clientY);
  }), s.addEventListener("pointerout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && (n.contains(e.relatedTarget) || a.contains(e.relatedTarget)) || n.contains(document.activeElement) || C();
  }), s.addEventListener("focusin", (e) => {
    const n = q(e.target);
    n && (R(), oe(n));
  }), s.addEventListener("focusout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || C();
  }), a.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && E?.contains(e.relatedTarget) || C();
  }), a.addEventListener("wheel", (e) => e.stopPropagation()), a.addEventListener("pointerdown", (e) => e.stopPropagation()), u.addEventListener("wheel", (e) => {
    e.preventDefault(), _(c.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: !1 }), u.addEventListener("pointerdown", (e) => {
    e.button === 0 && (I = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY, pointerId: e.pointerId, moved: !1 });
  }), u.addEventListener("pointermove", (e) => {
    if (!I) return;
    const n = e.clientX - I.x, r = e.clientY - I.y;
    if (!(!I.moved && Math.hypot(n, r) < 3)) {
      if (!I.moved) {
        I.moved = !0, u.classList.add("is-panning");
        try {
          u.setPointerCapture(I.pointerId);
        } catch {
        }
      }
      e.preventDefault(), A({ panX: I.panX + n, panY: I.panY + r }, !1), M();
    }
  });
  const P = () => {
    I && (I.moved && (J = performance.now() + 250, K()), I = void 0, u.classList.remove("is-panning"));
  };
  u.addEventListener("pointerup", P), u.addEventListener("pointercancel", P), u.addEventListener("lostpointercapture", P), u.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), C();
      return;
    }
    const n = ue();
    if (!n.length) return;
    const r = Math.max(0, n.findIndex((i) => i.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const i = n[(r + 1) % n.length].id;
      X(i), se(i);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = n[(r - 1 + n.length) % n.length].id;
      X(i), se(i);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const i = n[r];
      B(i.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const i = c.focusedId ? y?.elements[c.focusedId]?.parentId : void 0;
      B(i);
    }
  });
  const re = (e) => {
    je(e.data) && (e.data.type === "artifact" ? Z(e.data.envelope) : (c = pe(c, e.data.state), m.querySelectorAll("[data-overlay]").forEach((n) => {
      n.checked = c.overlays[n.dataset.overlay];
    }), y && ($(), V(), M(), H(c.selectedId ? y.elements[c.selectedId] : void 0))));
  }, ae = (e) => {
    b.textContent = `Viewer error: ${e}`, o.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, de = (e) => ae(e.message || "Unknown runtime error"), ce = (e) => ae(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", re), window.addEventListener("error", de), window.addEventListener("unhandledrejection", ce), $();
  for (const e of l) Z(e);
  return o.post({ channel: "ply-vis", version: 1, type: "ready" }), l.length || o.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: Z, getState: () => c, destroy: () => {
    R(), window.removeEventListener("message", re), window.removeEventListener("error", de), window.removeEventListener("unhandledrejection", ce), t.replaceChildren();
  } };
}
const He = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  He as CONTENT_SECURITY_POLICY,
  v as EnvelopeError,
  $e as HOST_PROTOCOL_VERSION,
  Re as PROTOCOL_VERSION,
  Te as initialViewState,
  je as isHostResponse,
  De as mountViewer,
  Ie as parseEnvelope,
  ke as sanitizeSvg,
  pe as updateViewState,
  Ve as windowHostBridge
};
//# sourceMappingURL=index.js.map
