const De = 1;
class v extends Error {
}
const E = (t) => typeof t == "object" && t !== null && !Array.isArray(t), D = (t, o, f = []) => {
  const u = /* @__PURE__ */ new Set([...o, ...f]);
  return o.every((p) => p in t) && Object.keys(t).every((p) => u.has(p));
}, G = (t) => Array.isArray(t) && t.every((o) => typeof o == "string");
function K(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(K));
  if (E(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([o, f]) => [o, K(f)])));
  throw new v("Evidence contains a non-JSON value");
}
function fe(t) {
  if (t !== void 0) {
    if (!E(t) || !D(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new v("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((o) => o === ".." || o === ".")) throw new v("Invalid source location");
    for (const o of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[o]) || t[o] < 0) throw new v("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new v("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function Ee(t) {
  if (!E(t) || !D(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new v("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new v(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const o = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!E(t.run) || !D(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !E(t.run.root) || !D(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !E(t.run.tool) || !D(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !o.has(t.run.outcome)) throw new v("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new v("Invalid SVG");
  if (!E(t.elements)) throw new v("Invalid element index");
  const f = {};
  for (const [s, a] of Object.entries(t.elements)) {
    if (!E(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in a) || !E(a.evidence)) throw new v(`Invalid element: ${s}`);
    if (a.id !== s || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !G(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !G(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !G(a.limitations)) throw new v(`Invalid element: ${s}`);
    const g = K(a.evidence);
    f[s] = Object.freeze({ id: s, kind: a.kind, label: a.label, evidence: g, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: fe(a.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new v(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new v("Invalid diagnostics");
  const u = [], p = /* @__PURE__ */ new Set();
  for (const s of t.diagnostics) {
    if (!E(s) || typeof s.id != "string" || !s.id || p.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new v("Invalid diagnostic");
    p.add(s.id), u.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: fe(s.source) } }));
  }
  for (const s of Object.values(f)) for (const a of s.diagnosticIds ?? []) if (!p.has(a)) throw new v(`Unknown diagnostic: ${a}`);
  for (const s of u) if (s.elementId && !f[s.elementId]) throw new v(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(f), diagnostics: Object.freeze(u) });
}
const Se = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), Ae = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), Le = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, pe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, Ce = {
  fill: pe,
  stroke: pe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function ke(t) {
  let o = t;
  for (; ; ) {
    const f = o.search(/@media\b/i);
    if (f < 0) return o;
    const u = o.indexOf("{", f);
    if (u < 0) return o.slice(0, f);
    let p = 0, s = u;
    for (; s < o.length; s += 1)
      if (o[s] === "{") p += 1;
      else if (o[s] === "}" && --p === 0) break;
    o = o.slice(0, f) + o.slice(Math.min(s + 1, o.length));
  }
}
function $e(t) {
  if (!t.trim() || t.length > 32768) return;
  const o = ke(t), f = /\s*([^{}]+)\{([^{}]*)\}/gy, u = [];
  let p = 0;
  for (; p < o.length; ) {
    f.lastIndex = p;
    const s = f.exec(o);
    if (!s) return o.slice(p).trim() === "" ? u : void 0;
    p = f.lastIndex;
    const a = s[1], g = s[2];
    if (a === void 0 || g === void 0) return;
    const w = a.split(",").map((b) => b.trim());
    if (!w.every((b) => Le.test(b))) return;
    const S = [];
    for (const b of g.split(";")) {
      const T = b.indexOf(":");
      if (T < 1) continue;
      const A = b.slice(0, T).trim().toLowerCase(), l = b.slice(T + 1).trim();
      Ce[A]?.test(l) === !0 && S.push([A, l]);
    }
    S.length && u.push({ selectors: w, declarations: S });
  }
  return u;
}
function Oe(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const o = new DOMParser().parseFromString(t, "image/svg+xml");
  if (o.querySelector("parsererror") || o.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const f of [...o.querySelectorAll("*")]) {
    if (f.localName.toLowerCase() === "style") {
      const u = $e(f.textContent ?? "");
      if (u) for (const p of u) for (const s of p.selectors)
        for (const a of [...o.documentElement.querySelectorAll(s)])
          for (const [g, w] of p.declarations) a.setAttribute(g, w);
      f.remove();
      continue;
    }
    if (Se.has(f.localName.toLowerCase())) {
      f.remove();
      continue;
    }
    for (const u of [...f.attributes]) {
      const p = u.name.toLowerCase(), s = u.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(s);
      (p.startsWith("on") || p === "style" || a || Ae.has(p) && s !== "" && !s.startsWith("#")) && f.removeAttribute(u.name);
    }
  }
  return new XMLSerializer().serializeToString(o.documentElement);
}
const je = 1, He = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function ze(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t, f = o.overlays;
  return typeof o.zoom == "number" && Number.isFinite(o.zoom) && typeof o.panX == "number" && Number.isFinite(o.panX) && typeof o.panY == "number" && Number.isFinite(o.panY) && typeof f == "object" && f !== null && typeof f.earned == "boolean" && typeof f.gap == "boolean" && typeof f.violation == "boolean" && (o.detailsHidden === void 0 || typeof o.detailsHidden == "boolean") && (o.runId === void 0 || typeof o.runId == "string") && (o.selectedId === void 0 || typeof o.selectedId == "string") && (o.focusedId === void 0 || typeof o.focusedId == "string");
}
function Te(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t;
  return o.channel === "ply-vis" && o.version === 1 && (o.type === "artifact" && "envelope" in o || o.type === "restore-state" && ze(o.state));
}
const Ne = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), ue = (t, o) => Object.freeze({ ...t, ...o, overlays: Object.freeze({ ...t.overlays, ...o.overlays }) });
function Me(t, o, f = 0.5) {
  return o.x >= t.x - f && o.y >= t.y - f && o.x + o.width <= t.x + t.width + f && o.y + o.height <= t.y + t.height + f;
}
function qe(t, o, f = {}) {
  const u = f.margin ?? 24, p = f.minZoom ?? 0.2, s = f.maxZoom ?? 4, a = Math.max(1, t.width - u * 2), g = Math.max(1, t.height - u * 2), w = Math.max(1, o.width), S = Math.max(1, o.height), b = Math.min(s, Math.max(p, Math.min(a / w, g / S)));
  return {
    zoom: b,
    panX: t.width / 2 - (o.x + w / 2) * b,
    panY: t.height / 2 - (o.y + S / 2) * b
  };
}
function Re(t, o, f) {
  return {
    zoom: o,
    panX: f.x - (f.x - t.panX) / t.zoom * o,
    panY: f.y - (f.y - t.panY) / t.zoom * o
  };
}
const Be = 500, J = (t, o) => `<button type="button" aria-label="${t}" title="${t}">${o}</button>`, Ve = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${J("Zoom out", "−")}${J("Zoom in", "+")}${J("Fit canvas", "Fit")}
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
function Ye(t, o, f = []) {
  t.innerHTML = Ve;
  const u = t.querySelector(".ply-vis"), p = u.querySelector(".ply-canvas"), s = u.querySelector(".ply-stage"), a = u.querySelector(".ply-tooltip"), g = u.querySelector(".ply-inspector"), w = u.querySelector(".ply-inspector-toggle"), S = u.querySelector(".ply-workspace"), b = u.querySelector(".ply-status"), T = u.querySelector(".ply-toolbar fieldset"), A = u.querySelector(".ply-breadcrumbs");
  let l = Ne(), h, I, Q = 0, x, N;
  const ee = () => o.post({ channel: "ply-vis", version: je, type: "persist-state", state: l }), L = (e, n = !0) => {
    l = ue(l, e), n && ee();
  }, M = () => {
    s.style.transform = `translate(${l.panX}px, ${l.panY}px) scale(${l.zoom})`;
  }, me = () => h ? Object.values(h.elements).filter((e) => !l.focusedId || e.id === l.focusedId || X(e, l.focusedId, h.elements)) : [];
  function O() {
    g.hidden = l.detailsHidden, S.classList.toggle("is-inspector-hidden", l.detailsHidden);
    const e = l.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!l.detailsHidden)), w.textContent = l.detailsHidden ? "‹" : "›";
  }
  function te(e, n = !0) {
    L({ detailsHidden: e }, n), O();
  }
  function X(e, n, i) {
    let c = e.parentId;
    for (; c; ) {
      if (c === n) return !0;
      c = i[c]?.parentId;
    }
    return !1;
  }
  function he() {
    if (A.replaceChildren(), !h) return;
    const e = [];
    let n = l.focusedId ? h.elements[l.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? h.elements[n.parentId] : void 0;
    const i = document.createElement("button");
    i.type = "button", i.textContent = "Workspace", i.dataset.focusId = "", A.append(i);
    for (const c of e) {
      const d = document.createElement("button");
      d.type = "button", d.textContent = c.label, d.dataset.focusId = c.id, A.append(d);
    }
  }
  function H(e) {
    g.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", g.append(n), !e || !h) {
      const r = document.createElement("p");
      r.textContent = "Select an item to inspect its declaration and evidence.", g.append(r);
      return;
    }
    const i = e.declaration?.split(`
`).filter(Boolean);
    g.append(j("Declaration", i?.length ? i : ["No declaration text supplied."])), g.append(j("Verdict", [e.evidence.verdict])), g.append(j("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const c = Object.entries(e.evidence).filter(([r]) => !["verdict", "statuses"].includes(r)).map(([r, y]) => `${r}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    g.append(j("Earned evidence", c.length ? c : ["No additional evidence details supplied."])), g.append(j("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const d = new Map(h.diagnostics.map((r) => [r.id, r])), m = e.diagnosticIds.map((r) => d.get(r)).filter((r) => r !== void 0).map((r) => `${r.code} — ${r.severity}: ${r.message}`);
    if (g.append(j("Diagnostics", m.length ? m : ["No diagnostics supplied."])), g.append(ye(h.run)), e.source) {
      const r = document.createElement("button");
      r.type = "button", r.className = "ply-source", r.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, r.addEventListener("click", () => o.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), g.append(r);
    }
  }
  function j(e, n) {
    const i = document.createElement("section"), c = document.createElement("h3");
    c.textContent = e, i.append(c);
    const d = document.createElement("ul");
    for (const m of n) {
      const r = document.createElement("li");
      r.textContent = m, d.append(r);
    }
    return i.append(d), i;
  }
  function ye(e) {
    const n = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, i = document.createElement("section"), c = document.createElement("h3");
    c.textContent = "Run details";
    const d = document.createElement("dl"), m = [
      ["Result", n[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [r, y] of m) {
      const $ = document.createElement("dt");
      $.textContent = r;
      const z = document.createElement("dd");
      z.textContent = y, d.append($, z);
    }
    return i.append(c, d), i;
  }
  function q(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function C(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? h?.elements[n] : void 0;
  }
  function ge(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function ne(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((i) => i && i !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function R() {
    N !== void 0 && window.clearTimeout(N), N = void 0;
  }
  function k() {
    x && ne(x), R(), x = void 0, a.hidden = !0, a.replaceChildren();
  }
  function ve(e, n) {
    if (!h) return [];
    const i = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && i.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const c = Object.entries(e.evidence).filter(([r, y]) => !["verdict", "statuses"].includes(r) && y !== !1 && y !== void 0).map(([r, y]) => `${r}: ${typeof y == "string" ? y : JSON.stringify(y)}`);
    i.push(...c), i.push(...(e.limitations ?? []).map((r) => `Limitation: ${r}`));
    const d = new Map(h.diagnostics.map((r) => [r.id, r]));
    for (const r of e.diagnosticIds) {
      const y = d.get(r);
      y && i.push(`${y.code} — ${y.severity}: ${y.message}`);
    }
    e.source && i.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const m = n.dataset.plyTitle?.trim();
    return m && m !== e.label && !i.includes(m) && i.push(m), i;
  }
  function oe(e, n) {
    const i = p.getBoundingClientRect(), c = 8;
    a.style.maxHeight = `${Math.max(0, i.height - c * 2)}px`;
    const d = 12, m = a.offsetWidth, r = a.offsetHeight, y = Math.max(c, i.width - m - c), $ = Math.max(c, i.height - r - c), z = e - i.left + d, V = n - i.top + d, W = V + r <= i.height - c ? V : n - i.top - r - d;
    a.style.left = `${Math.min(y, Math.max(c, z))}px`, a.style.top = `${Math.min($, Math.max(c, W))}px`;
  }
  function ie(e, n, i) {
    const c = C(e), d = e.dataset.plyTitle?.trim();
    if (!c && !d || e.hasAttribute("hidden")) {
      k();
      return;
    }
    x && x !== e && ne(x), x = e;
    const m = document.createElement("span");
    if (c) {
      const y = document.createElement("strong");
      y.textContent = c.label, m.textContent = ve(c, e).join(`
`), a.replaceChildren(y, m);
    } else
      m.textContent = d, a.replaceChildren(m);
    a.hidden = !1, ge(e);
    const r = e.getBoundingClientRect();
    oe(n ?? r.left + r.width / 2, i ?? r.bottom);
  }
  function se(e, n, i) {
    R(), x && x !== e && k(), N = window.setTimeout(() => {
      N = void 0, ie(e, n, i);
    }, Be);
  }
  function B() {
    if (!h) return;
    const e = [...s.querySelectorAll("[data-element-id], [data-ply-id]")], n = l.focusedId ? h.elements[l.focusedId] : void 0;
    for (const d of e) {
      const m = d.dataset.elementId ?? d.dataset.plyId ?? "", r = h.elements[m];
      if (!r) {
        d.removeAttribute("hidden");
        continue;
      }
      const y = /* @__PURE__ */ new Set([r.evidence.verdict, ...r.evidence.statuses]), $ = y.has("violation") ? "violation" : y.has("gap") ? "gap" : y.has("earned") ? "earned" : "declared", z = $ === "declared" || l.overlays[$], V = n ? X(n, r.id, h.elements) : !1, W = !l.focusedId || r.id === l.focusedId || X(r, l.focusedId, h.elements) || V;
      d.toggleAttribute("hidden", !W || !z && !V);
      const xe = [r.evidence.verdict, ...r.evidence.statuses].filter(Boolean).join(", ") || "declared";
      d.setAttribute("role", "button"), d.setAttribute("aria-label", `${r.kind}: ${r.label}; ${xe}`), d.dataset.state = $, d.classList.toggle("is-selected", r.id === l.selectedId), d === x && (d.hasAttribute("hidden") || !d.isConnected) && k();
    }
    const i = e.filter((d) => !d.hasAttribute("hidden") && C(d)), c = i.find((d) => C(d)?.id === l.selectedId) ?? i[0];
    for (const d of e) d.setAttribute("tabindex", d === c ? "0" : "-1");
    be(), he();
  }
  function be() {
    const e = s.querySelector("svg");
    if (!e) return;
    for (const d of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      d.removeAttribute("hidden"), d.removeAttribute("data-ply-focus-hidden");
    if (!l.focusedId) return;
    const n = [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => C(d)?.id === l.focusedId);
    if (!n || typeof n.getBBox != "function") return;
    const i = n.getBBox(), c = { x: i.x, y: i.y, width: i.width, height: i.height };
    for (const d of [...e.children]) {
      if (!(d instanceof SVGElement) || d.matches("[data-element-id], [data-ply-id], defs, style, title")) continue;
      const m = d;
      if (typeof m.getBBox != "function") continue;
      let r;
      try {
        r = m.getBBox();
      } catch {
        continue;
      }
      Me(c, r) || (d.setAttribute("hidden", ""), d.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function we(e) {
    h = e, L({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const n = Object.keys(e.elements).length > 0;
    T.hidden = !n, A.hidden = !n, w.hidden = !n, n || te(!0, !1), O(), k(), s.innerHTML = e.svg;
    for (const c of [...s.querySelectorAll("title")]) {
      const d = c.parentElement, m = d?.closest("[data-element-id], [data-ply-id]") ?? (d instanceof SVGElement ? d : void 0), r = c.textContent?.trim();
      m && r && (m.dataset.plyTitle = r, C(m) || (m.setAttribute("tabindex", "0"), m.setAttribute("role", "img"), m.setAttribute("aria-label", r))), c.remove();
    }
    p.dataset.empty = "false";
    const i = p.querySelector(".ply-empty");
    i && i.remove(), B(), M(), H(l.selectedId ? e.elements[l.selectedId] : void 0), b.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(P);
  }
  function Z(e) {
    try {
      const n = Ee(e), i = Object.freeze({ ...n, svg: Oe(n.svg) });
      return we(i), delete u.dataset.error, !0;
    } catch (n) {
      const i = n instanceof v || n instanceof Error ? n.message : "Unknown artifact error";
      return b.textContent = `Artifact rejected: ${i}. The previous snapshot is unchanged.`, u.dataset.error = "true", o.post({ channel: "ply-vis", version: 1, type: "error", message: i }), !1;
    }
  }
  function _(e) {
    h?.elements[e] && (L({ selectedId: e, detailsHidden: !1 }), O(), B(), H(h.elements[e]));
  }
  function re(e) {
    [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => C(i)?.id === e)?.focus();
  }
  function Y(e) {
    e && !h?.elements[e] || (e && !h.elements[e].parentId && (e = void 0), L({ focusedId: e, selectedId: e, detailsHidden: !e }), O(), B(), H(e ? h?.elements[e] : void 0), P());
  }
  function Ie() {
    const e = p.getBoundingClientRect(), i = (l.selectedId ? [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((c) => C(c)?.id === l.selectedId) : void 0)?.getBoundingClientRect();
    return i ? { x: i.left - e.left + i.width / 2, y: i.top - e.top + i.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function F(e, n = Ie()) {
    L(Re(l, Math.min(4, Math.max(0.2, e)), n)), M(), b.textContent = `Zoom ${Math.round(l.zoom * 100)}%`;
  }
  function P() {
    const e = s.querySelector("svg");
    if (!e) return;
    const n = s.getBoundingClientRect(), i = l.focusedId ? [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((r) => C(r)?.id === l.focusedId) : e;
    if (!i) return;
    const c = i.getBoundingClientRect(), d = l.zoom || 1, m = {
      x: (c.left - n.left) / d,
      y: (c.top - n.top) / d,
      width: c.width / d,
      height: c.height / d
    };
    L(qe({ width: p.clientWidth, height: p.clientHeight }, m)), M(), b.textContent = l.focusedId ? "Focused element fitted" : "Canvas fitted";
  }
  u.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => F(l.zoom * 1.2)), u.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => F(l.zoom / 1.2)), u.querySelector('[aria-label="Fit canvas"]').addEventListener("click", P), w.addEventListener("click", () => te(!l.detailsHidden)), u.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    L({ overlays: { ...l.overlays, [n]: e.checked } }), B();
  })), A.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && Y(n.dataset.focusId || void 0);
  }), s.addEventListener("click", (e) => {
    if (performance.now() < Q) return;
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && _(i);
  }), s.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && Y(i);
  }), s.addEventListener("pointerover", (e) => {
    const n = q(e.target);
    n && se(n, e.clientX, e.clientY);
  }), s.addEventListener("pointermove", (e) => {
    const n = q(e.target);
    if (!n) {
      R();
      return;
    }
    n === x && !a.hidden ? oe(e.clientX, e.clientY) : se(n, e.clientX, e.clientY);
  }), s.addEventListener("pointerout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && (n.contains(e.relatedTarget) || a.contains(e.relatedTarget)) || n.contains(document.activeElement) || k();
  }), s.addEventListener("focusin", (e) => {
    const n = q(e.target);
    n && (R(), ie(n));
  }), s.addEventListener("focusout", (e) => {
    const n = q(e.target);
    !n || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || k();
  }), a.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && x?.contains(e.relatedTarget) || k();
  }), a.addEventListener("wheel", (e) => e.stopPropagation()), a.addEventListener("pointerdown", (e) => e.stopPropagation()), p.addEventListener("wheel", (e) => {
    e.preventDefault();
    const n = p.getBoundingClientRect();
    F(l.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - n.left, y: e.clientY - n.top });
  }, { passive: !1 }), p.addEventListener("pointerdown", (e) => {
    e.button === 0 && (I = { x: e.clientX, y: e.clientY, panX: l.panX, panY: l.panY, pointerId: e.pointerId, moved: !1 });
  }), p.addEventListener("pointermove", (e) => {
    if (!I) return;
    const n = e.clientX - I.x, i = e.clientY - I.y;
    if (!(!I.moved && Math.hypot(n, i) < 3)) {
      if (!I.moved) {
        I.moved = !0, p.classList.add("is-panning");
        try {
          p.setPointerCapture(I.pointerId);
        } catch {
        }
      }
      e.preventDefault(), L({ panX: I.panX + n, panY: I.panY + i }, !1), M();
    }
  });
  const U = () => {
    I && (I.moved && (Q = performance.now() + 250, ee()), I = void 0, p.classList.remove("is-panning"));
  };
  p.addEventListener("pointerup", U), p.addEventListener("pointercancel", U), p.addEventListener("lostpointercapture", U), p.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), k();
      return;
    }
    const n = me();
    if (!n.length) return;
    const i = Math.max(0, n.findIndex((c) => c.id === l.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const c = n[(i + 1) % n.length].id;
      _(c), re(c);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const c = n[(i - 1 + n.length) % n.length].id;
      _(c), re(c);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const c = n[i];
      Y(c.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const c = l.focusedId ? h?.elements[l.focusedId]?.parentId : void 0;
      Y(c);
    }
  });
  const ae = (e) => {
    Te(e.data) && (e.data.type === "artifact" ? Z(e.data.envelope) : (l = ue(l, e.data.state), u.querySelectorAll("[data-overlay]").forEach((n) => {
      n.checked = l.overlays[n.dataset.overlay];
    }), h && (O(), B(), M(), H(l.selectedId ? h.elements[l.selectedId] : void 0))));
  }, de = (e) => {
    b.textContent = `Viewer error: ${e}`, o.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ce = (e) => de(e.message || "Unknown runtime error"), le = (e) => de(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", ae), window.addEventListener("error", ce), window.addEventListener("unhandledrejection", le), O();
  for (const e of f) Z(e);
  return o.post({ channel: "ply-vis", version: 1, type: "ready" }), f.length || o.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: Z, getState: () => l, destroy: () => {
    R(), window.removeEventListener("message", ae), window.removeEventListener("error", ce), window.removeEventListener("unhandledrejection", le), t.replaceChildren();
  } };
}
const Xe = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Xe as CONTENT_SECURITY_POLICY,
  v as EnvelopeError,
  je as HOST_PROTOCOL_VERSION,
  De as PROTOCOL_VERSION,
  Ne as initialViewState,
  Te as isHostResponse,
  Ye as mountViewer,
  Ee as parseEnvelope,
  Oe as sanitizeSvg,
  ue as updateViewState,
  He as windowHostBridge
};
//# sourceMappingURL=index.js.map
