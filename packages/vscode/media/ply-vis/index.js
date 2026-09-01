const Xe = 1;
class v extends Error {
}
const E = (t) => typeof t == "object" && t !== null && !Array.isArray(t), B = (t, o, f = []) => {
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
    if (!E(t) || !B(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new v("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((o) => o === ".." || o === ".")) throw new v("Invalid source location");
    for (const o of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[o]) || t[o] < 0) throw new v("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new v("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function Le(t) {
  if (!E(t) || !B(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new v("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new v(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const o = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!E(t.run) || !B(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !E(t.run.root) || !B(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !E(t.run.tool) || !B(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !o.has(t.run.outcome)) throw new v("Invalid run metadata");
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
const Ce = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), ke = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), $e = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, pe = /^(?:none|#[0-9a-f]{3,8}|url\(#[A-Za-z_][\w:.-]*\))$/i, Oe = {
  fill: pe,
  stroke: pe,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function Te(t) {
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
function je(t) {
  if (!t.trim() || t.length > 32768) return;
  const o = Te(t), f = /\s*([^{}]+)\{([^{}]*)\}/gy, u = [];
  let p = 0;
  for (; p < o.length; ) {
    f.lastIndex = p;
    const s = f.exec(o);
    if (!s) return o.slice(p).trim() === "" ? u : void 0;
    p = f.lastIndex;
    const a = s[1], g = s[2];
    if (a === void 0 || g === void 0) return;
    const w = a.split(",").map((b) => b.trim());
    if (!w.every((b) => $e.test(b))) return;
    const S = [];
    for (const b of g.split(";")) {
      const M = b.indexOf(":");
      if (M < 1) continue;
      const A = b.slice(0, M).trim().toLowerCase(), c = b.slice(M + 1).trim();
      Oe[A]?.test(c) === !0 && S.push([A, c]);
    }
    S.length && u.push({ selectors: w, declarations: S });
  }
  return u;
}
function ze(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const o = new DOMParser().parseFromString(t, "image/svg+xml");
  if (o.querySelector("parsererror") || o.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const f of [...o.querySelectorAll("*")]) {
    if (f.localName.toLowerCase() === "style") {
      const u = je(f.textContent ?? "");
      if (u) for (const p of u) for (const s of p.selectors)
        for (const a of [...o.documentElement.querySelectorAll(s)])
          for (const [g, w] of p.declarations) a.setAttribute(g, w);
      f.remove();
      continue;
    }
    if (Ce.has(f.localName.toLowerCase())) {
      f.remove();
      continue;
    }
    for (const u of [...f.attributes]) {
      const p = u.name.toLowerCase(), s = u.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(s);
      (p.startsWith("on") || p === "style" || a || ke.has(p) && s !== "" && !s.startsWith("#")) && f.removeAttribute(u.name);
    }
  }
  return new XMLSerializer().serializeToString(o.documentElement);
}
const Ne = 1, Ze = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function Me(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t, f = o.overlays;
  return typeof o.zoom == "number" && Number.isFinite(o.zoom) && typeof o.panX == "number" && Number.isFinite(o.panX) && typeof o.panY == "number" && Number.isFinite(o.panY) && typeof f == "object" && f !== null && typeof f.earned == "boolean" && typeof f.gap == "boolean" && typeof f.violation == "boolean" && (o.detailsHidden === void 0 || typeof o.detailsHidden == "boolean") && (o.runId === void 0 || typeof o.runId == "string") && (o.selectedId === void 0 || typeof o.selectedId == "string") && (o.focusedId === void 0 || typeof o.focusedId == "string");
}
function qe(t) {
  if (typeof t != "object" || t === null) return !1;
  const o = t;
  return o.channel === "ply-vis" && o.version === 1 && (o.type === "artifact" && "envelope" in o || o.type === "restore-state" && Me(o.state));
}
const Re = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), ue = (t, o) => Object.freeze({ ...t, ...o, overlays: Object.freeze({ ...t.overlays, ...o.overlays }) });
function Ve(t, o, f = 0.5) {
  return o.x >= t.x - f && o.y >= t.y - f && o.x + o.width <= t.x + t.width + f && o.y + o.height <= t.y + t.height + f;
}
function De(t, o, f = {}) {
  const u = f.margin ?? 24, p = f.minZoom ?? 0.2, s = f.maxZoom ?? 4, a = Math.max(1, t.width - u * 2), g = Math.max(1, t.height - u * 2), w = Math.max(1, o.width), S = Math.max(1, o.height), b = Math.min(s, Math.max(p, Math.min(a / w, g / S)));
  return {
    zoom: b,
    panX: t.width / 2 - (o.x + w / 2) * b,
    panY: t.height / 2 - (o.y + S / 2) * b
  };
}
function Be(t, o, f) {
  return {
    zoom: o,
    panX: f.x - (f.x - t.panX) / t.zoom * o,
    panY: f.y - (f.y - t.panY) / t.zoom * o
  };
}
const Ye = 500, J = (t, o) => `<button type="button" aria-label="${t}" title="${t}">${o}</button>`, He = `
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
function _e(t, o, f = []) {
  t.innerHTML = He;
  const u = t.querySelector(".ply-vis"), p = u.querySelector(".ply-canvas"), s = u.querySelector(".ply-stage"), a = u.querySelector(".ply-tooltip"), g = u.querySelector(".ply-inspector"), w = u.querySelector(".ply-inspector-toggle"), S = u.querySelector(".ply-workspace"), b = u.querySelector(".ply-status"), M = u.querySelector(".ply-toolbar fieldset"), A = u.querySelector(".ply-breadcrumbs");
  let c = Re(), y, I, Q = 0, x, q;
  const ee = () => o.post({ channel: "ply-vis", version: Ne, type: "persist-state", state: c }), L = (e, n = !0) => {
    c = ue(c, e), n && ee();
  }, R = () => {
    s.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, me = () => y ? Object.values(y.elements).filter((e) => !c.focusedId || e.id === c.focusedId || X(e, c.focusedId, y.elements)) : [];
  function T() {
    g.hidden = c.detailsHidden, S.classList.toggle("is-inspector-hidden", c.detailsHidden);
    const e = c.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!c.detailsHidden)), w.textContent = c.detailsHidden ? "‹" : "›";
  }
  function te(e, n = !0) {
    L({ detailsHidden: e }, n), T();
  }
  function X(e, n, i) {
    let l = e.parentId;
    for (; l; ) {
      if (l === n) return !0;
      l = i[l]?.parentId;
    }
    return !1;
  }
  function he(e) {
    let n = 0, i = e;
    for (; i?.parentId && i.id !== c.focusedId; )
      i = y?.elements[i.parentId], n += 1;
    return c.focusedId && i?.id !== c.focusedId ? Number.POSITIVE_INFINITY : n;
  }
  const ye = () => c.zoom < 0.8 ? 1 : c.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY;
  function ge() {
    if (A.replaceChildren(), !y) return;
    const e = [];
    let n = c.focusedId ? y.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? y.elements[n.parentId] : void 0;
    const i = document.createElement("button");
    i.type = "button", i.textContent = "Workspace", i.dataset.focusId = "", A.append(i);
    for (const l of e) {
      const d = document.createElement("button");
      d.type = "button", d.textContent = l.label, d.dataset.focusId = l.id, A.append(d);
    }
  }
  function Y(e) {
    g.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", g.append(n), !e || !y) {
      const r = document.createElement("p");
      r.textContent = "Select an item to inspect its declaration and evidence.", g.append(r);
      return;
    }
    const i = e.declaration?.split(`
`).filter(Boolean);
    g.append(j("Declaration", i?.length ? i : ["No declaration text supplied."])), g.append(j("Verdict", [e.evidence.verdict])), g.append(j("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const l = Object.entries(e.evidence).filter(([r]) => !["verdict", "statuses"].includes(r)).map(([r, h]) => `${r}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    g.append(j("Earned evidence", l.length ? l : ["No additional evidence details supplied."])), g.append(j("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const d = new Map(y.diagnostics.map((r) => [r.id, r])), m = e.diagnosticIds.map((r) => d.get(r)).filter((r) => r !== void 0).map((r) => `${r.code} — ${r.severity}: ${r.message}`);
    if (g.append(j("Diagnostics", m.length ? m : ["No diagnostics supplied."])), g.append(ve(y.run)), e.source) {
      const r = document.createElement("button");
      r.type = "button", r.className = "ply-source", r.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, r.addEventListener("click", () => o.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), g.append(r);
    }
  }
  function j(e, n) {
    const i = document.createElement("section"), l = document.createElement("h3");
    l.textContent = e, i.append(l);
    const d = document.createElement("ul");
    for (const m of n) {
      const r = document.createElement("li");
      r.textContent = m, d.append(r);
    }
    return i.append(d), i;
  }
  function ve(e) {
    const n = {
      clean: "Checks completed",
      violation: "A declared rule was broken",
      timeout: "Stopped before checks finished",
      missing_evidence: "Some promised evidence is missing",
      narrowed_evidence: "Checks covered less than promised"
    }, i = document.createElement("section"), l = document.createElement("h3");
    l.textContent = "Run details";
    const d = document.createElement("dl"), m = [
      ["Result", n[e.outcome]],
      ["Finished", new Date(e.completedAt).toLocaleString()],
      ["Checked folder", e.root.path === "." ? "Workspace root" : e.root.path]
    ];
    for (const [r, h] of m) {
      const $ = document.createElement("dt");
      $.textContent = r;
      const z = document.createElement("dd");
      z.textContent = h, d.append($, z);
    }
    return i.append(l, d), i;
  }
  function V(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function C(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? y?.elements[n] : void 0;
  }
  function be(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function ne(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((i) => i && i !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function D() {
    q !== void 0 && window.clearTimeout(q), q = void 0;
  }
  function k() {
    x && ne(x), D(), x = void 0, a.hidden = !0, a.replaceChildren();
  }
  function we(e, n) {
    if (!y) return [];
    const i = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && i.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const l = Object.entries(e.evidence).filter(([r, h]) => !["verdict", "statuses"].includes(r) && h !== !1 && h !== void 0).map(([r, h]) => `${r}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    i.push(...l), i.push(...(e.limitations ?? []).map((r) => `Limitation: ${r}`));
    const d = new Map(y.diagnostics.map((r) => [r.id, r]));
    for (const r of e.diagnosticIds) {
      const h = d.get(r);
      h && i.push(`${h.code} — ${h.severity}: ${h.message}`);
    }
    e.source && i.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const m = n.dataset.plyTitle?.trim();
    return m && m !== e.label && !i.includes(m) && i.push(m), i;
  }
  function oe(e, n) {
    const i = p.getBoundingClientRect(), l = 8;
    a.style.maxHeight = `${Math.max(0, i.height - l * 2)}px`;
    const d = 12, m = a.offsetWidth, r = a.offsetHeight, h = Math.max(l, i.width - m - l), $ = Math.max(l, i.height - r - l), z = e - i.left + d, N = n - i.top + d, W = N + r <= i.height - l ? N : n - i.top - r - d;
    a.style.left = `${Math.min(h, Math.max(l, z))}px`, a.style.top = `${Math.min($, Math.max(l, W))}px`;
  }
  function ie(e, n, i) {
    const l = C(e), d = e.dataset.plyTitle?.trim();
    if (!l && !d || e.hasAttribute("hidden")) {
      k();
      return;
    }
    x && x !== e && ne(x), x = e;
    const m = document.createElement("span");
    if (l) {
      const h = document.createElement("strong");
      h.textContent = l.label, m.textContent = we(l, e).join(`
`), a.replaceChildren(h, m);
    } else
      m.textContent = d, a.replaceChildren(m);
    a.hidden = !1, be(e);
    const r = e.getBoundingClientRect();
    oe(n ?? r.left + r.width / 2, i ?? r.bottom);
  }
  function se(e, n, i) {
    D(), x && x !== e && k(), q = window.setTimeout(() => {
      q = void 0, ie(e, n, i);
    }, Ye);
  }
  function O() {
    if (!y) return;
    const e = [...s.querySelectorAll("[data-element-id], [data-ply-id]")], n = c.focusedId ? y.elements[c.focusedId] : void 0;
    for (const d of e) {
      const m = d.dataset.elementId ?? d.dataset.plyId ?? "", r = y.elements[m];
      if (!r) {
        d.removeAttribute("hidden");
        continue;
      }
      const h = /* @__PURE__ */ new Set([r.evidence.verdict, ...r.evidence.statuses]), $ = h.has("violation") ? "violation" : h.has("gap") ? "gap" : h.has("earned") ? "earned" : "declared", z = $ === "declared" || c.overlays[$], N = n ? X(n, r.id, y.elements) : !1, W = !c.focusedId || r.id === c.focusedId || X(r, c.focusedId, y.elements) || N, Se = N || he(r) <= ye();
      d.toggleAttribute("hidden", !W || !Se || !z && !N);
      const Ae = [r.evidence.verdict, ...r.evidence.statuses].filter(Boolean).join(", ") || "declared";
      d.setAttribute("role", "button"), d.setAttribute("aria-label", `${r.kind}: ${r.label}; ${Ae}`), d.dataset.state = $, d.classList.toggle("is-selected", r.id === c.selectedId), d === x && (d.hasAttribute("hidden") || !d.isConnected) && k();
    }
    const i = e.filter((d) => !d.hasAttribute("hidden") && C(d)), l = i.find((d) => C(d)?.id === c.selectedId) ?? i[0];
    for (const d of e) d.setAttribute("tabindex", d === l ? "0" : "-1");
    Ie(), ge();
  }
  function Ie() {
    const e = s.querySelector("svg");
    if (!e) return;
    for (const d of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      d.removeAttribute("hidden"), d.removeAttribute("data-ply-focus-hidden");
    if (!c.focusedId) return;
    const n = [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((d) => C(d)?.id === c.focusedId);
    if (!n || typeof n.getBBox != "function") return;
    const i = n.getBBox(), l = { x: i.x, y: i.y, width: i.width, height: i.height };
    for (const d of [...e.children]) {
      if (!(d instanceof SVGElement) || d.matches("[data-element-id], [data-ply-id], defs, style, title") || d.contains(n)) continue;
      const m = d;
      if (typeof m.getBBox != "function") continue;
      let r;
      try {
        r = m.getBBox();
      } catch {
        continue;
      }
      Ve(l, r) || (d.setAttribute("hidden", ""), d.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function xe(e) {
    y = e, L({ runId: e.run.id, selectedId: void 0, focusedId: void 0, detailsHidden: !0, zoom: 1, panX: 0, panY: 0 }, !1);
    const n = Object.keys(e.elements).length > 0;
    M.hidden = !n, A.hidden = !n, w.hidden = !n, n || te(!0, !1), T(), k(), s.innerHTML = e.svg;
    for (const l of [...s.querySelectorAll("title")]) {
      const d = l.parentElement, m = d?.closest("[data-element-id], [data-ply-id]") ?? (d instanceof SVGElement ? d : void 0), r = l.textContent?.trim();
      m && r && (m.dataset.plyTitle = r, C(m) || (m.setAttribute("tabindex", "0"), m.setAttribute("role", "img"), m.setAttribute("aria-label", r))), l.remove();
    }
    p.dataset.empty = "false";
    const i = p.querySelector(".ply-empty");
    i && i.remove(), O(), R(), Y(c.selectedId ? e.elements[c.selectedId] : void 0), b.textContent = e.run.tool.version === "render" ? "Rendered Ply spec" : `Showing run ${e.run.id}`, typeof window.requestAnimationFrame == "function" && window.requestAnimationFrame(() => P(!1));
  }
  function Z(e) {
    try {
      const n = Le(e), i = Object.freeze({ ...n, svg: ze(n.svg) });
      return xe(i), delete u.dataset.error, !0;
    } catch (n) {
      const i = n instanceof v || n instanceof Error ? n.message : "Unknown artifact error";
      return b.textContent = `Artifact rejected: ${i}. The previous snapshot is unchanged.`, u.dataset.error = "true", o.post({ channel: "ply-vis", version: 1, type: "error", message: i }), !1;
    }
  }
  function _(e) {
    y?.elements[e] && (L({ selectedId: e, detailsHidden: !1 }), T(), O(), Y(y.elements[e]));
  }
  function re(e) {
    [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((i) => C(i)?.id === e)?.focus();
  }
  function H(e) {
    e && !y?.elements[e] || (e && !y.elements[e].parentId && (e = void 0), L({ focusedId: e, selectedId: e, detailsHidden: !e }), T(), O(), Y(e ? y?.elements[e] : void 0), P());
  }
  function Ee() {
    const e = p.getBoundingClientRect(), i = (c.selectedId ? [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((l) => C(l)?.id === c.selectedId) : void 0)?.getBoundingClientRect();
    return i ? { x: i.left - e.left + i.width / 2, y: i.top - e.top + i.height / 2 } : { x: e.width / 2, y: e.height / 2 };
  }
  function F(e, n = Ee()) {
    L(Be(c, Math.min(4, Math.max(0.2, e)), n)), O(), R(), b.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function P(e = !0) {
    const n = s.querySelector("svg");
    if (!n) return;
    const i = s.getBoundingClientRect(), l = c.focusedId ? [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((h) => C(h)?.id === c.focusedId) : n;
    if (!l) return;
    const d = l.getBoundingClientRect(), m = c.zoom || 1, r = {
      x: (d.left - i.left) / m,
      y: (d.top - i.top) / m,
      width: d.width / m,
      height: d.height / m
    };
    L(De({ width: p.clientWidth, height: p.clientHeight }, r)), O(), R(), e && (b.textContent = c.focusedId ? "Focused element fitted" : "Canvas fitted");
  }
  u.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => F(c.zoom * 1.2)), u.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => F(c.zoom / 1.2)), u.querySelector('[aria-label="Fit canvas"]').addEventListener("click", () => P()), w.addEventListener("click", () => te(!c.detailsHidden)), u.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    L({ overlays: { ...c.overlays, [n]: e.checked } }), O();
  })), A.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && H(n.dataset.focusId || void 0);
  }), s.addEventListener("click", (e) => {
    if (performance.now() < Q) return;
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && _(i);
  }), s.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), i = n?.dataset.elementId ?? n?.dataset.plyId;
    i && H(i);
  }), s.addEventListener("pointerover", (e) => {
    const n = V(e.target);
    n && se(n, e.clientX, e.clientY);
  }), s.addEventListener("pointermove", (e) => {
    const n = V(e.target);
    if (!n) {
      D();
      return;
    }
    n === x && !a.hidden ? oe(e.clientX, e.clientY) : se(n, e.clientX, e.clientY);
  }), s.addEventListener("pointerout", (e) => {
    const n = V(e.target);
    !n || e.relatedTarget instanceof Node && (n.contains(e.relatedTarget) || a.contains(e.relatedTarget)) || n.contains(document.activeElement) || k();
  }), s.addEventListener("focusin", (e) => {
    const n = V(e.target);
    n && (D(), ie(n));
  }), s.addEventListener("focusout", (e) => {
    const n = V(e.target);
    !n || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || k();
  }), a.addEventListener("pointerleave", (e) => {
    e.relatedTarget instanceof Node && x?.contains(e.relatedTarget) || k();
  }), a.addEventListener("wheel", (e) => e.stopPropagation()), a.addEventListener("pointerdown", (e) => e.stopPropagation()), p.addEventListener("wheel", (e) => {
    e.preventDefault();
    const n = p.getBoundingClientRect();
    F(c.zoom * Math.exp(-e.deltaY * 2e-3), { x: e.clientX - n.left, y: e.clientY - n.top });
  }, { passive: !1 }), p.addEventListener("pointerdown", (e) => {
    e.button === 0 && (I = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY, pointerId: e.pointerId, moved: !1 });
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
      e.preventDefault(), L({ panX: I.panX + n, panY: I.panY + i }, !1), R();
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
    const i = Math.max(0, n.findIndex((l) => l.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const l = n[(i + 1) % n.length].id;
      _(l), re(l);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const l = n[(i - 1 + n.length) % n.length].id;
      _(l), re(l);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const l = n[i];
      H(l.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const l = c.focusedId ? y?.elements[c.focusedId]?.parentId : void 0;
      H(l);
    }
  });
  const ae = (e) => {
    qe(e.data) && (e.data.type === "artifact" ? Z(e.data.envelope) : (c = ue(c, e.data.state), u.querySelectorAll("[data-overlay]").forEach((n) => {
      n.checked = c.overlays[n.dataset.overlay];
    }), y && (T(), O(), R(), Y(c.selectedId ? y.elements[c.selectedId] : void 0))));
  }, de = (e) => {
    b.textContent = `Viewer error: ${e}`, o.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ce = (e) => de(e.message || "Unknown runtime error"), le = (e) => de(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", ae), window.addEventListener("error", ce), window.addEventListener("unhandledrejection", le), T();
  for (const e of f) Z(e);
  return o.post({ channel: "ply-vis", version: 1, type: "ready" }), f.length || o.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: Z, getState: () => c, destroy: () => {
    D(), window.removeEventListener("message", ae), window.removeEventListener("error", ce), window.removeEventListener("unhandledrejection", le), t.replaceChildren();
  } };
}
const Fe = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Fe as CONTENT_SECURITY_POLICY,
  v as EnvelopeError,
  Ne as HOST_PROTOCOL_VERSION,
  Xe as PROTOCOL_VERSION,
  Re as initialViewState,
  qe as isHostResponse,
  _e as mountViewer,
  Le as parseEnvelope,
  ze as sanitizeSvg,
  ue as updateViewState,
  Ze as windowHostBridge
};
//# sourceMappingURL=index.js.map
