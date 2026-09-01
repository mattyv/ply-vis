const Ve = 1;
class v extends Error {
}
const E = (t) => typeof t == "object" && t !== null && !Array.isArray(t), V = (t, o, l = []) => {
  const m = /* @__PURE__ */ new Set([...o, ...l]);
  return o.every((f) => f in t) && Object.keys(t).every((f) => m.has(f));
}, U = (t) => Array.isArray(t) && t.every((o) => typeof o == "string");
function G(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(G));
  if (E(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([o, l]) => [o, G(l)])));
  throw new v("Evidence contains a non-JSON value");
}
function le(t) {
  if (t !== void 0) {
    if (!E(t) || !V(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new v("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((o) => o === ".." || o === ".")) throw new v("Invalid source location");
    for (const o of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[o]) || t[o] < 0) throw new v("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new v("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function xe(t) {
  if (!E(t) || !V(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new v("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new v(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const o = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!E(t.run) || !V(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !E(t.run.root) || !V(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !E(t.run.tool) || !V(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !o.has(t.run.outcome)) throw new v("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new v("Invalid SVG");
  if (!E(t.elements)) throw new v("Invalid element index");
  const l = {};
  for (const [r, a] of Object.entries(t.elements)) {
    if (!E(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in a) || !E(a.evidence)) throw new v(`Invalid element: ${r}`);
    if (a.id !== r || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !U(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !U(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !U(a.limitations)) throw new v(`Invalid element: ${r}`);
    const g = G(a.evidence);
    l[r] = Object.freeze({ id: r, kind: a.kind, label: a.label, evidence: g, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: le(a.source) } });
  }
  for (const r of Object.values(l)) if (r.parentId && !l[r.parentId]) throw new v(`Unknown parent: ${r.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new v("Invalid diagnostics");
  const m = [], f = /* @__PURE__ */ new Set();
  for (const r of t.diagnostics) {
    if (!E(r) || typeof r.id != "string" || !r.id || f.has(r.id) || typeof r.code != "string" || !r.code || typeof r.severity != "string" || !r.severity || typeof r.message != "string" || !r.message || r.elementId !== void 0 && typeof r.elementId != "string") throw new v("Invalid diagnostic");
    f.add(r.id), m.push(Object.freeze({ id: r.id, code: r.code, severity: r.severity, message: r.message, ...r.elementId === void 0 ? {} : { elementId: r.elementId }, ...r.source === void 0 ? {} : { source: le(r.source) } }));
  }
  for (const r of Object.values(l)) for (const a of r.diagnosticIds ?? []) if (!f.has(a)) throw new v(`Unknown diagnostic: ${a}`);
  for (const r of m) if (r.elementId && !l[r.elementId]) throw new v(`Unknown diagnostic element: ${r.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(l), diagnostics: Object.freeze(m) });
}
const Ee = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), Se = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), Ae = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, pe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, Le = {
  fill: pe,
  stroke: pe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function Ce(t) {
  let o = t;
  for (; ; ) {
    const l = o.search(/@media\b/i);
    if (l < 0) return o;
    const m = o.indexOf("{", l);
    if (m < 0) return o.slice(0, l);
    let f = 0, r = m;
    for (; r < o.length; r += 1)
      if (o[r] === "{") f += 1;
      else if (o[r] === "}" && --f === 0) break;
    o = o.slice(0, l) + o.slice(Math.min(r + 1, o.length));
  }
}
function ke(t) {
  if (!t.trim() || t.length > 32768) return;
  const o = Ce(t), l = /\s*([^{}]+)\{([^{}]*)\}/gy, m = [];
  let f = 0;
  for (; f < o.length; ) {
    l.lastIndex = f;
    const r = l.exec(o);
    if (!r) return o.slice(f).trim() === "" ? m : void 0;
    f = l.lastIndex;
    const a = r[1], g = r[2];
    if (a === void 0 || g === void 0) return;
    const w = a.split(",").map((b) => b.trim());
    if (!w.every((b) => Ae.test(b))) return;
    const S = [];
    for (const b of g.split(";")) {
      const T = b.indexOf(":");
      if (T < 1) continue;
      const A = b.slice(0, T).trim().toLowerCase(), c = b.slice(T + 1).trim();
      Le[A]?.test(c) === !0 && S.push([A, c]);
    }
    S.length && m.push({ selectors: w, declarations: S });
  }
  return m;
}
function $e(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const o = new DOMParser().parseFromString(t, "image/svg+xml");
  if (o.querySelector("parsererror") || o.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const l of [...o.querySelectorAll("*")]) {
    if (l.localName.toLowerCase() === "style") {
      const m = ke(l.textContent ?? "");
      if (m) for (const f of m) for (const r of f.selectors)
        for (const a of [...o.documentElement.querySelectorAll(r)])
          for (const [g, w] of f.declarations) a.setAttribute(g, w);
      l.remove();
      continue;
    }
    if (Ee.has(l.localName.toLowerCase())) {
      l.remove();
      continue;
    }
    for (const m of [...l.attributes]) {
      const f = m.name.toLowerCase(), r = m.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(r);
      (f.startsWith("on") || f === "style" || a || Se.has(f) && r !== "" && !r.startsWith("#")) && l.removeAttribute(m.name);
    }
  }
  return new XMLSerializer().serializeToString(o.documentElement);
}
const Oe = 1, De = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function je(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t, l = o.overlays;
  return typeof o.zoom == "number" && Number.isFinite(o.zoom) && typeof o.panX == "number" && Number.isFinite(o.panX) && typeof o.panY == "number" && Number.isFinite(o.panY) && typeof l == "object" && l !== null && typeof l.earned == "boolean" && typeof l.gap == "boolean" && typeof l.violation == "boolean" && (o.detailsHidden === void 0 || typeof o.detailsHidden == "boolean") && (o.runId === void 0 || typeof o.runId == "string") && (o.selectedId === void 0 || typeof o.selectedId == "string") && (o.focusedId === void 0 || typeof o.focusedId == "string");
}
function ze(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t;
  return o.channel === "ply-vis" && o.version === 1 && (o.type === "artifact" && "envelope" in o || o.type === "restore-state" && je(o.state));
}
const Te = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), fe = (t, o) => Object.freeze({ ...t, ...o, overlays: Object.freeze({ ...t.overlays, ...o.overlays }) });
function Ne(t, o, l = 0.5) {
  return o.x >= t.x - l && o.y >= t.y - l && o.x + o.width <= t.x + t.width + l && o.y + o.height <= t.y + t.height + l;
}
function Me(t, o, l = {}) {
  const m = l.margin ?? 24, f = l.minZoom ?? 0.2, r = l.maxZoom ?? 4, a = Math.max(1, t.width - m * 2), g = Math.max(1, t.height - m * 2), w = Math.max(1, o.width), S = Math.max(1, o.height), b = Math.min(r, Math.max(f, Math.min(a / w, g / S)));
  return {
    zoom: b,
    panX: t.width / 2 - (o.x + w / 2) * b,
    panY: t.height / 2 - (o.y + S / 2) * b
  };
}
function qe(t, o, l) {
  return {
    zoom: o,
    panX: l.x - (l.x - t.panX) / t.zoom * o,
    panY: l.y - (l.y - t.panY) / t.zoom * o
  };
}
const Re = 500, W = (t, o) => `<button type="button" aria-label="${t}" title="${t}">${o}</button>`, Be = `
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
function He(t, o, l = []) {
  t.innerHTML = Be;
  const m = t.querySelector(".ply-vis"), f = m.querySelector(".ply-canvas"), r = m.querySelector(".ply-stage"), a = m.querySelector(".ply-tooltip"), g = m.querySelector(".ply-inspector"), w = m.querySelector(".ply-inspector-toggle"), S = m.querySelector(".ply-workspace"), b = m.querySelector(".ply-status"), T = m.querySelector(".ply-toolbar fieldset"), A = m.querySelector(".ply-breadcrumbs");
  let c = Te(), y, I, J = 0, x, N;
  const K = () => o.post({ channel: "ply-vis", version: Oe, type: "persist-state", state: c }), L = (e, n = !0) => {
    c = fe(c, e), n && K();
  }, M = () => {
    r.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, ue = () => y ? Object.values(y.elements).filter((e) => !c.focusedId || e.id === c.focusedId || ee(e, c.focusedId, y.elements)) : [];
  function $() {
    g.hidden = c.detailsHidden, S.classList.toggle("is-inspector-hidden", c.detailsHidden);
    const e = c.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!c.detailsHidden)), w.textContent = c.detailsHidden ? "‹" : "›";
  }
  function Q(e, n = !0) {
    L({ detailsHidden: e }, n), $();
  }
  function ee(e, n, i) {
    let s = e.parentId;
    for (; s; ) {
      if (s === n) return !0;
      s = i[s]?.parentId;
    }
    return !1;
  }
  function me() {
    if (A.replaceChildren(), !y) return;
    const e = [];
    let n = c.focusedId ? y.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? y.elements[n.parentId] : void 0;
    const i = document.createElement("button");
    i.type = "button", i.textContent = "Workspace", i.dataset.focusId = "", A.append(i);
    for (const s of e) {
      const p = document.createElement("button");
      p.type = "button", p.textContent = s.label, p.dataset.focusId = s.id, A.append(p);
    }
  }
  function D(e) {
    g.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", g.append(n), !e || !y) {
      const d = document.createElement("p");
      d.textContent = "Select an item to inspect its declaration and evidence.", g.append(d);
      return;
    }
    const i = e.declaration?.split(`
`).filter(Boolean);
    g.append(O("Declaration", i?.length ? i : ["No declaration text supplied."])), g.append(O("Verdict", [e.evidence.verdict])), g.append(O("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const s = Object.entries(e.evidence).filter(([d]) => !["verdict", "statuses"].includes(d)).map(([d, h]) => `${d}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    g.append(O("Earned evidence", s.length ? s : ["No additional evidence details supplied."])), g.append(O("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const p = new Map(y.diagnostics.map((d) => [d.id, d])), u = e.diagnosticIds.map((d) => p.get(d)).filter((d) => d !== void 0).map((d) => `${d.code} — ${d.severity}: ${d.message}`);
    if (g.append(O("Diagnostics", u.length ? u : ["No diagnostics supplied."])), g.append(he(y.run)), e.source) {
      const d = document.createElement("button");
      d.type = "button", d.className = "ply-source", d.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, d.addEventListener("click", () => o.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), g.append(d);
    }
  }
  function O(e, n) {
    const i = document.createElement("section"), s = document.createElement("h3");
    s.textContent = e, i.append(s);
    const p = document.createElement("ul");
    for (const u of n) {
      const d = document.createElement("li");
      d.textContent = u, p.append(d);
    }
    return i.append(p), i;
  }
  function he(e) {
    const n = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, i = document.createElement("section"), s = document.createElement("h3");
    s.textContent = "Run details";
    const p = document.createElement("dl"), u = [
      ["Result", n[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [d, h] of u) {
      const j = document.createElement("dt");
      j.textContent = d;
      const z = document.createElement("dd");
      z.textContent = h, p.append(j, z);
    }
    return i.append(s, p), i;
  }
  function q(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function C(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? y?.elements[n] : void 0;
  }
  function ye(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function te(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((i) => i && i !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function R() {
    N !== void 0 && window.clearTimeout(N), N = void 0;
  }
  function k() {
    x && te(x), R(), x = void 0, a.hidden = !0, a.replaceChildren();
  }
  function ge(e, n) {
    if (!y) return [];
    const i = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && i.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const s = Object.entries(e.evidence).filter(([d, h]) => !["verdict", "statuses"].includes(d) && h !== !1 && h !== void 0).map(([d, h]) => `${d}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    i.push(...s), i.push(...(e.limitations ?? []).map((d) => `Limitation: ${d}`));
    const p = new Map(y.diagnostics.map((d) => [d.id, d]));
    for (const d of e.diagnosticIds) {
      const h = p.get(d);
      h && i.push(`${h.code} — ${h.severity}: ${h.message}`);
    }
    e.source && i.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const u = n.dataset.plyTitle?.trim();
    return u && u !== e.label && !i.includes(u) && i.push(u), i;
  }
  function ne(e, n) {
    const i = f.getBoundingClientRect(), s = 8;
    a.style.maxHeight = `${Math.max(0, i.height - s * 2)}px`;
    const p = 12, u = a.offsetWidth, d = a.offsetHeight, h = Math.max(s, i.width - u - s), j = Math.max(s, i.height - d - s), z = e - i.left + p, Y = n - i.top + p, Ie = Y + d <= i.height - s ? Y : n - i.top - d - p;
    a.style.left = `${Math.min(h, Math.max(s, z))}px`, a.style.top = `${Math.min(j, Math.max(s, Ie))}px`;
  }
  function oe(e, n, i) {
    const s = C(e), p = e.dataset.plyTitle?.trim();
    if (!s && !p || e.hasAttribute("hidden")) {
      k();
      return;
    }
    x && x !== e && te(x), x = e;
    const u = document.createElement("span");
    if (s) {
      const h = document.createElement("strong");
      h.textContent = s.label, u.textContent = ge(s, e).join(`
`), a.replaceChildren(h, u);
    } else
      u.textContent = p, a.replaceChildren(u);
    a.hidden = !1, ye(e);
    const d = e.getBoundingClientRect();
    ne(n ?? d.left + d.width / 2, i ?? d.bottom);
  }
  function ie(e, n, i) {
    R(), x && x !== e && k(), N = window.setTimeout(() => {
      N = void 0, oe(e, n, i);
    }, Re);
  }
  function B() {
    if (!y) return;
    const e = [...r.querySelectorAll("[data-element-id], [data-ply-id]")];
    for (const s of e) {
      const p = s.dataset.elementId ?? s.dataset.plyId ?? "", u = y.elements[p];
      if (!u) {
        s.removeAttribute("hidden");
        continue;
      }
      const d = /* @__PURE__ */ new Set([u.evidence.verdict, ...u.evidence.statuses]), h = d.has("violation") ? "violation" : d.has("gap") ? "gap" : d.has("earned") ? "earned" : "declared", j = h === "declared" || c.overlays[h], z = !c.focusedId || u.id === c.focusedId || ee(u, c.focusedId, y.elements);
      s.toggleAttribute("hidden", !j || !z);
      const Y = [u.evidence.verdict, ...u.evidence.statuses].filter(Boolean).join(", ") || "declared";
      s.setAttribute("role", "button"), s.setAttribute("aria-label", `${u.kind}: ${u.label}; ${Y}`), s.dataset.state = h, s.classList.toggle("is-selected", u.id === c.selectedId), s === x && (s.hasAttribute("hidden") || !s.isConnected) && k();
    }
    const n = e.filter((s) => !s.hasAttribute("hidden") && C(s)), i = n.find((s) => C(s)?.id === c.selectedId) ?? n[0];
    for (const s of e) s.setAttribute("tabindex", s === i ? "0" : "-1");
    ve(), me();
  }
  function ve() {
    const e = r.querySelector("svg");
    if (!e) return;
    for (const p of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      p.removeAttribute("hidden"), p.removeAttribute("data-ply-focus-hidden");
    if (!c.focusedId) return;
    const n = [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((p) => C(p)?.id === c.focusedId);
    if (!n || typeof n.getBBox != "function") return;
    const i = n.getBBox(), s = { x: i.x, y: i.y, width: i.width, height: i.height };
    for (const p of [...e.children]) {
      if (!(p instanceof SVGElement) || p.matches("[data-element-id], [data-ply-id], defs, style, title")) continue;
      const u = p;
      if (typeof u.getBBox != "function") continue;
      let d;
      try {
        d = u.getBBox();
      } catch {
        continue;
      }
      Ne(s, d) || (p.setAttribute("hidden", ""), p.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function be(e) {
    y = e, L({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const n = Object.keys(e.elements).length > 0;
    T.hidden = !n, A.hidden = !n, w.hidden = !n, n || Q(!0, !1), $(), k(), r.innerHTML = e.svg;
    for (const s of [...r.querySelectorAll("title")]) {
      const p = s.parentElement, u = p?.closest("[data-element-id], [data-ply-id]") ?? (p instanceof SVGElement ? p : void 0), d = s.textContent?.trim();
      u && d && (u.dataset.plyTitle = d, C(u) || (u.setAttribute("tabindex", "0"), u.setAttribute("role", "img"), u.setAttribute("aria-label", d))), s.remove();
    }
    f.dataset.empty = "false";
    const i = f.querySelector(".ply-empty");
    i && i.remove(), B(), M(), D(c.selectedId ? e.elements[c.selectedId] : void 0), b.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(F);
  }
  function X(e) {
    try {
      const n = xe(e), i = Object.freeze({ ...n, svg: $e(n.svg) });
      return be(i), delete m.dataset.error, !0;
    } catch (n) {
      const i = n instanceof v || n instanceof Error ? n.message : "Unknown artifact error";
      return b.textContent = `Artifact rejected: ${i}. The previous snapshot is unchanged.`, m.dataset.error = "true", o.post({ channel: "ply-vis", version: 1, type: "error", message: i }), !1;
    }
  }
  function Z(e) {
    y?.elements[e] && (L({ selectedId: e, detailsHidden: !1 }), $(), B(), D(y.elements[e]));
  }
  function se(e) {
    [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => C(i)?.id === e)?.focus();
  }
  function H(e) {
    e && !y?.elements[e] || (e && !y.elements[e].parentId && (e = void 0), L({ focusedId: e, selectedId: e, detailsHidden: !e }), $(), B(), D(e ? y?.elements[e] : void 0), F());
  }
  function we() {
    const e = f.getBoundingClientRect(), i = (c.selectedId ? [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((s) => C(s)?.id === c.selectedId) : void 0)?.getBoundingClientRect();
    return i ? { x: i.left - e.left + i.width / 2, y: i.top - e.top + i.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function _(e, n = we()) {
    L(qe(c, Math.min(4, Math.max(0.2, e)), n)), M(), b.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function F() {
    const e = r.querySelector("svg");
    if (!e) return;
    const n = r.getBoundingClientRect(), i = c.focusedId ? [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => C(d)?.id === c.focusedId) : e;
    if (!i) return;
    const s = i.getBoundingClientRect(), p = c.zoom || 1, u = {
      x: (s.left - n.left) / p,
      y: (s.top - n.top) / p,
      width: s.width / p,
      height: s.height / p
    };
    L(Me({ width: f.clientWidth, height: f.clientHeight }, u)), M(), b.textContent = c.focusedId ? "Focused element fitted" : "Canvas fitted";
  }
  m.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => _(c.zoom * 1.2)), m.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => _(c.zoom / 1.2)), m.querySelector('[aria-label="Fit canvas"]').addEventListener("click", F), w.addEventListener("click", () => Q(!c.detailsHidden)), m.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    L({ overlays: { ...c.overlays, [n]: e.checked } }), B();
  })), A.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && H(n.dataset.focusId || void 0);
  }), r.addEventListener("click", (e) => {
    if (performance.now() < J) return;
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && Z(i);
  }), r.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && H(i);
  }), r.addEventListener("pointerover", (e) => {
    const n = q(e.target);
    n && ie(n, e.clientX, e.clientY);
  }), r.addEventListener("pointermove", (e) => {
    const n = q(e.target);
    if (!n) {
      R();
      return;
    }
    n === x && !a.hidden ? ne(e.clientX, e.clientY) : ie(n, e.clientX, e.clientY);
  }), r.addEventListener("pointerout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && (n.contains(e.relatedTarget) || a.contains(e.relatedTarget)) || n.contains(document.activeElement) || k();
  }), r.addEventListener("focusin", (e) => {
    const n = q(e.target);
    n && (R(), oe(n));
  }), r.addEventListener("focusout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || k();
  }), a.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && x?.contains(e.relatedTarget) || k();
  }), a.addEventListener("wheel", (e) => e.stopPropagation()), a.addEventListener("pointerdown", (e) => e.stopPropagation()), f.addEventListener("wheel", (e) => {
    e.preventDefault();
    const n = f.getBoundingClientRect();
    _(c.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - n.left, y: e.clientY - n.top });
  }, { passive: !1 }), f.addEventListener("pointerdown", (e) => {
    e.button === 0 && (I = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY, pointerId: e.pointerId, moved: !1 });
  }), f.addEventListener("pointermove", (e) => {
    if (!I) return;
    const n = e.clientX - I.x, i = e.clientY - I.y;
    if (!(!I.moved && Math.hypot(n, i) < 3)) {
      if (!I.moved) {
        I.moved = !0, f.classList.add("is-panning");
        try {
          f.setPointerCapture(I.pointerId);
        } catch {
        }
      }
      e.preventDefault(), L({ panX: I.panX + n, panY: I.panY + i }, !1), M();
    }
  });
  const P = () => {
    I && (I.moved && (J = performance.now() + 250, K()), I = void 0, f.classList.remove("is-panning"));
  };
  f.addEventListener("pointerup", P), f.addEventListener("pointercancel", P), f.addEventListener("lostpointercapture", P), f.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), k();
      return;
    }
    const n = ue();
    if (!n.length) return;
    const i = Math.max(0, n.findIndex((s) => s.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const s = n[(i + 1) % n.length].id;
      Z(s), se(s);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const s = n[(i - 1 + n.length) % n.length].id;
      Z(s), se(s);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const s = n[i];
      H(s.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const s = c.focusedId ? y?.elements[c.focusedId]?.parentId : void 0;
      H(s);
    }
  });
  const re = (e) => {
    ze(e.data) && (e.data.type === "artifact" ? X(e.data.envelope) : (c = fe(c, e.data.state), m.querySelectorAll("[data-overlay]").forEach((n) => {
      n.checked = c.overlays[n.dataset.overlay];
    }), y && ($(), B(), M(), D(c.selectedId ? y.elements[c.selectedId] : void 0))));
  }, ae = (e) => {
    b.textContent = `Viewer error: ${e}`, o.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, de = (e) => ae(e.message || "Unknown runtime error"), ce = (e) => ae(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", re), window.addEventListener("error", de), window.addEventListener("unhandledrejection", ce), $();
  for (const e of l) X(e);
  return o.post({ channel: "ply-vis", version: 1, type: "ready" }), l.length || o.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: X, getState: () => c, destroy: () => {
    R(), window.removeEventListener("message", re), window.removeEventListener("error", de), window.removeEventListener("unhandledrejection", ce), t.replaceChildren();
  } };
}
const Ye = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Ye as CONTENT_SECURITY_POLICY,
  v as EnvelopeError,
  Oe as HOST_PROTOCOL_VERSION,
  Ve as PROTOCOL_VERSION,
  Te as initialViewState,
  ze as isHostResponse,
  He as mountViewer,
  xe as parseEnvelope,
  $e as sanitizeSvg,
  fe as updateViewState,
  De as windowHostBridge
};
//# sourceMappingURL=index.js.map
