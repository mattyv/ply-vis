const je = 1;
class b extends Error {
}
const S = (t) => typeof t == "object" && t !== null && !Array.isArray(t), M = (t, s, f = []) => {
  const p = /* @__PURE__ */ new Set([...s, ...f]);
  return s.every((u) => u in t) && Object.keys(t).every((u) => p.has(u));
}, W = (t) => Array.isArray(t) && t.every((s) => typeof s == "string");
function G(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(G));
  if (S(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([s, f]) => [s, G(f)])));
  throw new b("Evidence contains a non-JSON value");
}
function de(t) {
  if (t !== void 0) {
    if (!S(t) || !M(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new b("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((s) => s === ".." || s === ".")) throw new b("Invalid source location");
    for (const s of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[s]) || t[s] < 0) throw new b("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new b("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function ge(t) {
  if (!S(t) || !M(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new b("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new b(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const s = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!S(t.run) || !M(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !S(t.run.root) || !M(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !S(t.run.tool) || !M(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !s.has(t.run.outcome)) throw new b("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new b("Invalid SVG");
  if (!S(t.elements)) throw new b("Invalid element index");
  const f = {};
  for (const [r, a] of Object.entries(t.elements)) {
    if (!S(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in a) || !S(a.evidence)) throw new b(`Invalid element: ${r}`);
    if (a.id !== r || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !W(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !W(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !W(a.limitations)) throw new b(`Invalid element: ${r}`);
    const h = G(a.evidence);
    f[r] = Object.freeze({ id: r, kind: a.kind, label: a.label, evidence: h, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: de(a.source) } });
  }
  for (const r of Object.values(f)) if (r.parentId && !f[r.parentId]) throw new b(`Unknown parent: ${r.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new b("Invalid diagnostics");
  const p = [], u = /* @__PURE__ */ new Set();
  for (const r of t.diagnostics) {
    if (!S(r) || typeof r.id != "string" || !r.id || u.has(r.id) || typeof r.code != "string" || !r.code || typeof r.severity != "string" || !r.severity || typeof r.message != "string" || !r.message || r.elementId !== void 0 && typeof r.elementId != "string") throw new b("Invalid diagnostic");
    u.add(r.id), p.push(Object.freeze({ id: r.id, code: r.code, severity: r.severity, message: r.message, ...r.elementId === void 0 ? {} : { elementId: r.elementId }, ...r.source === void 0 ? {} : { source: de(r.source) } }));
  }
  for (const r of Object.values(f)) for (const a of r.diagnosticIds ?? []) if (!u.has(a)) throw new b(`Unknown diagnostic: ${a}`);
  for (const r of p) if (r.elementId && !f[r.elementId]) throw new b(`Unknown diagnostic element: ${r.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(f), diagnostics: Object.freeze(p) });
}
const ve = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), be = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), we = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, Ie = {
  fill: /^(?:none|#[0-9a-f]{3,8})$/i,
  stroke: /^(?:none|#[0-9a-f]{3,8})$/i,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function xe(t) {
  if (!t.trim() || t.length > 32768) return;
  const s = /\s*([^{}]+)\{([^{}]*)\}/gy, f = [];
  let p = 0;
  for (; p < t.length; ) {
    s.lastIndex = p;
    const u = s.exec(t);
    if (!u) return t.slice(p).trim() === "" ? f : void 0;
    p = s.lastIndex;
    const r = u[1], a = u[2];
    if (r === void 0 || a === void 0) return;
    const h = r.split(",").map((v) => v.trim());
    if (!h.every((v) => we.test(v))) return;
    const w = a.split(";").filter((v) => v.trim() !== ""), $ = [];
    if (!w.length || !w.every((v) => {
      const E = v.indexOf(":");
      if (E < 1) return !1;
      const A = v.slice(0, E).trim().toLowerCase(), k = v.slice(E + 1).trim();
      return Ie[A]?.test(k) !== !0 ? !1 : ($.push([A, k]), !0);
    })) return;
    f.push({ selectors: h, declarations: $ });
  }
  return f;
}
function Se(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const s = new DOMParser().parseFromString(t, "image/svg+xml");
  if (s.querySelector("parsererror") || s.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const f of [...s.querySelectorAll("*")]) {
    if (f.localName.toLowerCase() === "style") {
      const p = xe(f.textContent ?? "");
      if (p) for (const u of p) for (const r of u.selectors)
        for (const a of [...s.documentElement.querySelectorAll(r)])
          for (const [h, w] of u.declarations) a.setAttribute(h, w);
      f.remove();
      continue;
    }
    if (ve.has(f.localName.toLowerCase())) {
      f.remove();
      continue;
    }
    for (const p of [...f.attributes]) {
      const u = p.name.toLowerCase(), r = p.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(r);
      (u.startsWith("on") || u === "style" || a || be.has(u) && r !== "" && !r.startsWith("#")) && f.removeAttribute(p.name);
    }
  }
  return new XMLSerializer().serializeToString(s.documentElement);
}
const Ee = 1, ze = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function Le(t) {
  if (typeof t != "object" || t === null) return !1;
  const s = t, f = s.overlays;
  return typeof s.zoom == "number" && Number.isFinite(s.zoom) && typeof s.panX == "number" && Number.isFinite(s.panX) && typeof s.panY == "number" && Number.isFinite(s.panY) && typeof f == "object" && f !== null && typeof f.earned == "boolean" && typeof f.gap == "boolean" && typeof f.violation == "boolean" && (s.detailsHidden === void 0 || typeof s.detailsHidden == "boolean") && (s.runId === void 0 || typeof s.runId == "string") && (s.selectedId === void 0 || typeof s.selectedId == "string") && (s.focusedId === void 0 || typeof s.focusedId == "string");
}
function $e(t) {
  if (typeof t != "object" || t === null) return !1;
  const s = t;
  return s.channel === "ply-vis" && s.version === 1 && (s.type === "artifact" && "envelope" in s || s.type === "restore-state" && Le(s.state));
}
const Ae = () => Object.freeze({ detailsHidden: !0, zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), ce = (t, s) => Object.freeze({ ...t, ...s, overlays: Object.freeze({ ...t.overlays, ...s.overlays }) });
function Ce(t, s, f = 0.5) {
  return s.x >= t.x - f && s.y >= t.y - f && s.x + s.width <= t.x + t.width + f && s.y + s.height <= t.y + t.height + f;
}
function Oe(t, s, f = {}) {
  const p = f.margin ?? 24, u = f.minZoom ?? 0.2, r = f.maxZoom ?? 4, a = Math.max(1, t.width - p * 2), h = Math.max(1, t.height - p * 2), w = Math.max(1, s.width), $ = Math.max(1, s.height), v = Math.min(r, Math.max(u, Math.min(a / w, h / $)));
  return {
    zoom: v,
    panX: t.width / 2 - (s.x + w / 2) * v,
    panY: t.height / 2 - (s.y + $ / 2) * v
  };
}
const P = (t, s) => `<button type="button" aria-label="${t}" title="${t}">${s}</button>`, ke = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <label>Run <select data-role="runs" aria-label="Run snapshot"></select></label>
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${P("Zoom out", "−")}${P("Zoom in", "+")}${P("Fit canvas", "Fit")}
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
function Ne(t, s, f = []) {
  t.innerHTML = ke;
  const p = t.querySelector(".ply-vis"), u = p.querySelector(".ply-canvas"), r = p.querySelector(".ply-stage"), a = p.querySelector(".ply-tooltip"), h = p.querySelector(".ply-inspector"), w = p.querySelector(".ply-inspector-toggle"), $ = p.querySelector(".ply-workspace"), v = p.querySelector(".ply-status"), E = p.querySelector('[data-role="runs"]'), A = p.querySelector(".ply-breadcrumbs"), k = /* @__PURE__ */ new Map();
  let c = Ae(), y, I, J = 0, x;
  const H = () => s.post({ channel: "ply-vis", version: Ee, type: "persist-state", state: c }), L = (e, n = !0) => {
    c = ce(c, e), n && H();
  }, N = () => {
    r.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, le = () => y ? Object.values(y.elements).filter((e) => !c.focusedId || e.id === c.focusedId || K(e, c.focusedId, y.elements)) : [];
  function j() {
    h.hidden = c.detailsHidden, $.classList.toggle("is-inspector-hidden", c.detailsHidden);
    const e = c.detailsHidden ? "Show details" : "Hide details";
    w.setAttribute("aria-label", e), w.title = e, w.setAttribute("aria-expanded", String(!c.detailsHidden)), w.textContent = c.detailsHidden ? "‹" : "›";
  }
  function fe(e, n = !0) {
    L({ detailsHidden: e }, n), j();
  }
  function K(e, n, o) {
    let i = e.parentId;
    for (; i; ) {
      if (i === n) return !0;
      i = o[i]?.parentId;
    }
    return !1;
  }
  function pe() {
    if (A.replaceChildren(), !y) return;
    const e = [];
    let n = c.focusedId ? y.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? y.elements[n.parentId] : void 0;
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", A.append(o);
    for (const i of e) {
      const l = document.createElement("button");
      l.type = "button", l.textContent = i.label, l.dataset.focusId = i.id, A.append(l);
    }
  }
  function R(e) {
    h.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", h.append(n), !e || !y) {
      const d = document.createElement("p");
      d.textContent = "Select an item to inspect its declaration and evidence.", h.append(d);
      return;
    }
    h.append(C("Declaration", e.declaration ? [e.declaration] : ["No declaration text supplied."])), h.append(C("Verdict", [e.evidence.verdict])), h.append(C("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const o = Object.entries(e.evidence).filter(([d]) => !["verdict", "statuses"].includes(d)).map(([d, m]) => `${d}: ${typeof m == "string" ? m : JSON.stringify(m)}`);
    h.append(C("Earned evidence", o.length ? o : ["No additional evidence details supplied."])), h.append(C("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const i = new Map(y.diagnostics.map((d) => [d.id, d])), l = e.diagnosticIds.map((d) => i.get(d)).filter((d) => d !== void 0).map((d) => `${d.code} — ${d.severity}: ${d.message}`);
    if (h.append(C("Diagnostics", l.length ? l : ["No diagnostics supplied."])), h.append(C("Run", [`${y.run.id} — ${y.run.completedAt}`, `Root: ${y.run.root.path}`, `Tool: ${y.run.tool.name} ${y.run.tool.version}`, `Outcome: ${y.run.outcome}`])), e.source) {
      const d = document.createElement("button");
      d.type = "button", d.className = "ply-source", d.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, d.addEventListener("click", () => s.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), h.append(d);
    }
  }
  function C(e, n) {
    const o = document.createElement("section"), i = document.createElement("h3");
    i.textContent = e, o.append(i);
    const l = document.createElement("ul");
    for (const d of n) {
      const m = document.createElement("li");
      m.textContent = d, l.append(m);
    }
    return o.append(l), o;
  }
  function T(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id], [data-ply-title]") ?? void 0 : void 0;
  }
  function O(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? y?.elements[n] : void 0;
  }
  function ue(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function Q(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function z() {
    x && Q(x), x = void 0, a.hidden = !0, a.replaceChildren();
  }
  function me(e, n) {
    if (!y) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const i = Object.entries(e.evidence).filter(([m, g]) => !["verdict", "statuses"].includes(m) && g !== !1 && g !== void 0).map(([m, g]) => `${m}: ${typeof g == "string" ? g : JSON.stringify(g)}`);
    o.push(...i), o.push(...(e.limitations ?? []).map((m) => `Limitation: ${m}`));
    const l = new Map(y.diagnostics.map((m) => [m.id, m]));
    for (const m of e.diagnosticIds) {
      const g = l.get(m);
      g && o.push(`${g.code} — ${g.severity}: ${g.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const d = n.dataset.plyTitle?.trim();
    return d && d !== e.label && !o.includes(d) && o.push(d), o;
  }
  function ee(e, n) {
    const o = u.getBoundingClientRect(), i = 8, l = 12, d = a.offsetWidth, m = a.offsetHeight, g = Math.max(i, o.width - d - i), U = Math.max(i, o.height - m - i), _ = e - o.left + l, D = n - o.top + l, he = D + m <= o.height - i ? D : n - o.top - m - l;
    a.style.left = `${Math.min(g, Math.max(i, _))}px`, a.style.top = `${Math.min(U, Math.max(i, he))}px`;
  }
  function te(e, n, o) {
    const i = O(e), l = e.dataset.plyTitle?.trim();
    if (!i && !l || e.hasAttribute("hidden")) {
      z();
      return;
    }
    x && x !== e && Q(x), x = e;
    const d = document.createElement("span");
    if (i) {
      const g = document.createElement("strong");
      g.textContent = i.label, d.textContent = me(i, e).join(`
`), a.replaceChildren(g, d);
    } else
      d.textContent = l, a.replaceChildren(d);
    a.hidden = !1, ue(e);
    const m = e.getBoundingClientRect();
    ee(n ?? m.left + m.width / 2, o ?? m.bottom);
  }
  function q() {
    if (!y) return;
    const e = [...r.querySelectorAll("[data-element-id], [data-ply-id]")];
    for (const i of e) {
      const l = i.dataset.elementId ?? i.dataset.plyId ?? "", d = y.elements[l];
      if (!d) {
        i.setAttribute("hidden", "");
        continue;
      }
      const m = /* @__PURE__ */ new Set([d.evidence.verdict, ...d.evidence.statuses]), g = m.has("violation") ? "violation" : m.has("gap") ? "gap" : m.has("earned") ? "earned" : "declared", U = g === "declared" || c.overlays[g], _ = !c.focusedId || d.id === c.focusedId || K(d, c.focusedId, y.elements);
      i.toggleAttribute("hidden", !U || !_);
      const D = [d.evidence.verdict, ...d.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${d.kind}: ${d.label}; ${D}`), i.dataset.state = g, i.classList.toggle("is-selected", d.id === c.selectedId), i === x && (i.hasAttribute("hidden") || !i.isConnected) && z();
    }
    const n = e.filter((i) => !i.hasAttribute("hidden") && O(i)), o = n.find((i) => O(i)?.id === c.selectedId) ?? n[0];
    for (const i of e) i.setAttribute("tabindex", i === o ? "0" : "-1");
    ye(), pe();
  }
  function ye() {
    const e = r.querySelector("svg");
    if (!e) return;
    for (const l of [...e.querySelectorAll("[data-ply-focus-hidden]")])
      l.removeAttribute("hidden"), l.removeAttribute("data-ply-focus-hidden");
    if (!c.focusedId) return;
    const n = [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((l) => O(l)?.id === c.focusedId);
    if (!n || typeof n.getBBox != "function") return;
    const o = n.getBBox(), i = { x: o.x, y: o.y, width: o.width, height: o.height };
    for (const l of [...e.children]) {
      if (!(l instanceof SVGElement) || l.matches("[data-element-id], [data-ply-id], defs, style, title")) continue;
      const d = l;
      if (typeof d.getBBox != "function") continue;
      let m;
      try {
        m = d.getBBox();
      } catch {
        continue;
      }
      Ce(i, m) || (l.setAttribute("hidden", ""), l.setAttribute("data-ply-focus-hidden", ""));
    }
  }
  function B(e) {
    y = e, E.value = e.run.id, c.runId !== e.run.id && L({ runId: e.run.id, selectedId: void 0, focusedId: void 0 }, !1), j(), z(), r.innerHTML = e.svg;
    for (const o of [...r.querySelectorAll("title")]) {
      const i = o.parentElement, l = i?.closest("[data-element-id], [data-ply-id]") ?? (i instanceof SVGElement ? i : void 0), d = o.textContent?.trim();
      l && d && (l.dataset.plyTitle = d, O(l) || (l.setAttribute("tabindex", "0"), l.setAttribute("role", "img"), l.setAttribute("aria-label", d))), o.remove();
    }
    u.dataset.empty = "false";
    const n = u.querySelector(".ply-empty");
    n && n.remove(), q(), N(), R(c.selectedId ? e.elements[c.selectedId] : void 0), v.textContent = `Showing run ${e.run.id}`;
  }
  function Z(e) {
    try {
      const n = ge(e), o = Object.freeze({ ...n, svg: Se(n.svg) });
      return k.set(o.run.id, o), [...E.options].some((i) => i.value === o.run.id) || E.add(new Option(`${o.run.id} — ${o.run.completedAt}`, o.run.id)), B(o), delete p.dataset.error, !0;
    } catch (n) {
      const o = n instanceof b || n instanceof Error ? n.message : "Unknown artifact error";
      return v.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, p.dataset.error = "true", s.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function X(e) {
    y?.elements[e] && (L({ selectedId: e, detailsHidden: !1 }), j(), q(), R(y.elements[e]));
  }
  function ne(e) {
    [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => O(o)?.id === e)?.focus();
  }
  function V(e) {
    e && !y?.elements[e] || (L({ focusedId: e, selectedId: e, ...e ? { detailsHidden: !1 } : {} }), j(), q(), R(e ? y?.elements[e] : void 0), oe());
  }
  function Y(e) {
    L({ zoom: Math.min(4, Math.max(0.2, e)) }), N(), v.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function oe() {
    const e = r.querySelector("svg");
    if (!e) return;
    const n = r.getBoundingClientRect(), o = c.focusedId ? [...r.querySelectorAll("[data-element-id], [data-ply-id]")].find((m) => O(m)?.id === c.focusedId) : e;
    if (!o) return;
    const i = o.getBoundingClientRect(), l = c.zoom || 1, d = {
      x: (i.left - n.left) / l,
      y: (i.top - n.top) / l,
      width: i.width / l,
      height: i.height / l
    };
    L(Oe({ width: u.clientWidth, height: u.clientHeight }, d)), N(), v.textContent = c.focusedId ? "Focused element fitted" : "Canvas fitted";
  }
  p.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => Y(c.zoom * 1.2)), p.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => Y(c.zoom / 1.2)), p.querySelector('[aria-label="Fit canvas"]').addEventListener("click", oe), w.addEventListener("click", () => fe(!c.detailsHidden)), E.addEventListener("change", () => {
    const e = k.get(E.value);
    e && (B(e), H());
  }), p.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    L({ overlays: { ...c.overlays, [n]: e.checked } }), q();
  })), A.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && V(n.dataset.focusId || void 0);
  }), r.addEventListener("click", (e) => {
    if (performance.now() < J) return;
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && X(o);
  }), r.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && V(o);
  }), r.addEventListener("pointerover", (e) => {
    const n = T(e.target);
    n && te(n, e.clientX, e.clientY);
  }), r.addEventListener("pointermove", (e) => {
    const n = T(e.target);
    n && n === x && !a.hidden && ee(e.clientX, e.clientY);
  }), r.addEventListener("pointerout", (e) => {
    const n = T(e.target);
    !n || n !== x || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.contains(document.activeElement) || z();
  }), r.addEventListener("focusin", (e) => {
    const n = T(e.target);
    n && te(n);
  }), r.addEventListener("focusout", (e) => {
    const n = T(e.target);
    !n || n !== x || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || z();
  }), u.addEventListener("wheel", (e) => {
    e.preventDefault(), Y(c.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: !1 }), u.addEventListener("pointerdown", (e) => {
    e.button === 0 && (I = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY, pointerId: e.pointerId, moved: !1 });
  }), u.addEventListener("pointermove", (e) => {
    if (!I) return;
    const n = e.clientX - I.x, o = e.clientY - I.y;
    if (!(!I.moved && Math.hypot(n, o) < 3)) {
      if (!I.moved) {
        I.moved = !0, u.classList.add("is-panning");
        try {
          u.setPointerCapture(I.pointerId);
        } catch {
        }
      }
      e.preventDefault(), L({ panX: I.panX + n, panY: I.panY + o }, !1), N();
    }
  });
  const F = () => {
    I && (I.moved && (J = performance.now() + 250, H()), I = void 0, u.classList.remove("is-panning"));
  };
  u.addEventListener("pointerup", F), u.addEventListener("pointercancel", F), u.addEventListener("lostpointercapture", F), u.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), z();
      return;
    }
    const n = le();
    if (!n.length) return;
    const o = Math.max(0, n.findIndex((i) => i.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const i = n[(o + 1) % n.length].id;
      X(i), ne(i);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = n[(o - 1 + n.length) % n.length].id;
      X(i), ne(i);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const i = n[o];
      V(i.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const i = c.focusedId ? y?.elements[c.focusedId]?.parentId : void 0;
      V(i);
    }
  });
  const ie = (e) => {
    if ($e(e.data))
      if (e.data.type === "artifact") Z(e.data.envelope);
      else {
        c = ce(c, e.data.state), p.querySelectorAll("[data-overlay]").forEach((o) => {
          o.checked = c.overlays[o.dataset.overlay];
        });
        const n = c.runId ? k.get(c.runId) : void 0;
        n && n !== y ? B(n) : y && (j(), q(), N(), R(c.selectedId ? y.elements[c.selectedId] : void 0));
      }
  }, se = (e) => {
    v.textContent = `Viewer error: ${e}`, s.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, re = (e) => se(e.message || "Unknown runtime error"), ae = (e) => se(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", ie), window.addEventListener("error", re), window.addEventListener("unhandledrejection", ae), j();
  for (const e of f) Z(e);
  return s.post({ channel: "ply-vis", version: 1, type: "ready" }), f.length || s.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: Z, getState: () => c, destroy: () => {
    window.removeEventListener("message", ie), window.removeEventListener("error", re), window.removeEventListener("unhandledrejection", ae), t.replaceChildren();
  } };
}
const Te = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Te as CONTENT_SECURITY_POLICY,
  b as EnvelopeError,
  Ee as HOST_PROTOCOL_VERSION,
  je as PROTOCOL_VERSION,
  Ae as initialViewState,
  $e as isHostResponse,
  Ne as mountViewer,
  ge as parseEnvelope,
  Se as sanitizeSvg,
  ce as updateViewState,
  ze as windowHostBridge
};
//# sourceMappingURL=index.js.map
