const Ee = 1;
class g extends Error {
}
const E = (t) => typeof t == "object" && t !== null && !Array.isArray(t), z = (t, r, f = []) => {
  const l = /* @__PURE__ */ new Set([...r, ...f]);
  return r.every((m) => m in t) && Object.keys(t).every((m) => l.has(m));
}, U = (t) => Array.isArray(t) && t.every((r) => typeof r == "string");
function B(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(B));
  if (E(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([r, f]) => [r, B(f)])));
  throw new g("Evidence contains a non-JSON value");
}
function ne(t) {
  if (t !== void 0) {
    if (!E(t) || !z(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new g("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new g("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[r]) || t[r] < 0) throw new g("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new g("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function le(t) {
  if (!E(t) || !z(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new g("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new g(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!E(t.run) || !z(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !E(t.run.root) || !z(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !E(t.run.tool) || !z(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !r.has(t.run.outcome)) throw new g("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new g("Invalid SVG");
  if (!E(t.elements)) throw new g("Invalid element index");
  const f = {};
  for (const [s, a] of Object.entries(t.elements)) {
    if (!E(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((w) => w in a) || !E(a.evidence)) throw new g(`Invalid element: ${s}`);
    if (a.id !== s || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !U(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !U(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !U(a.limitations)) throw new g(`Invalid element: ${s}`);
    const h = B(a.evidence);
    f[s] = Object.freeze({ id: s, kind: a.kind, label: a.label, evidence: h, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: ne(a.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new g(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new g("Invalid diagnostics");
  const l = [], m = /* @__PURE__ */ new Set();
  for (const s of t.diagnostics) {
    if (!E(s) || typeof s.id != "string" || !s.id || m.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new g("Invalid diagnostic");
    m.add(s.id), l.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: ne(s.source) } }));
  }
  for (const s of Object.values(f)) for (const a of s.diagnosticIds ?? []) if (!m.has(a)) throw new g(`Unknown diagnostic: ${a}`);
  for (const s of l) if (s.elementId && !f[s.elementId]) throw new g(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(f), diagnostics: Object.freeze(l) });
}
const pe = /* @__PURE__ */ new Set(["script", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), fe = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]), ue = /^(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*)(?:\s+(?:[.#][A-Za-z_][\w-]*|[A-Za-z][\w-]*))*$/, me = {
  fill: /^(?:none|#[0-9a-f]{3,8})$/i,
  stroke: /^(?:none|#[0-9a-f]{3,8})$/i,
  "stroke-width": /^\d+(?:\.\d+)?$/,
  "stroke-dasharray": /^\d+(?:\.\d+)?(?:[ ,]+\d+(?:\.\d+)?)*$/,
  "font-size": /^\d+(?:\.\d+)?px$/,
  "font-style": /^(?:normal|italic)$/,
  "font-weight": /^(?:normal|bold|[1-9]00)$/,
  "text-anchor": /^(?:start|middle|end)$/
};
function ye(t) {
  if (!t.trim() || t.length > 32768) return;
  const r = /\s*([^{}]+)\{([^{}]*)\}/gy, f = [];
  let l = 0;
  for (; l < t.length; ) {
    r.lastIndex = l;
    const m = r.exec(t);
    if (!m) return t.slice(l).trim() === "" ? f : void 0;
    l = r.lastIndex;
    const s = m[1], a = m[2];
    if (s === void 0 || a === void 0) return;
    const h = s.split(",").map((b) => b.trim());
    if (!h.every((b) => ue.test(b))) return;
    const w = a.split(";").filter((b) => b.trim() !== ""), $ = [];
    if (!w.length || !w.every((b) => {
      const L = b.indexOf(":");
      if (L < 1) return !1;
      const c = b.slice(0, L).trim().toLowerCase(), p = b.slice(L + 1).trim();
      return me[c]?.test(p) !== !0 ? !1 : ($.push([c, p]), !0);
    })) return;
    f.push({ selectors: h, declarations: $ });
  }
  return f;
}
function he(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const r = new DOMParser().parseFromString(t, "image/svg+xml");
  if (r.querySelector("parsererror") || r.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const f of [...r.querySelectorAll("*")]) {
    if (f.localName.toLowerCase() === "style") {
      const l = ye(f.textContent ?? "");
      if (l) for (const m of l) for (const s of m.selectors)
        for (const a of [...r.documentElement.querySelectorAll(s)])
          for (const [h, w] of m.declarations) a.setAttribute(h, w);
      f.remove();
      continue;
    }
    if (pe.has(f.localName.toLowerCase())) {
      f.remove();
      continue;
    }
    for (const l of [...f.attributes]) {
      const m = l.name.toLowerCase(), s = l.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(s);
      (m.startsWith("on") || m === "style" || a || fe.has(m) && s !== "" && !s.startsWith("#")) && f.removeAttribute(l.name);
    }
  }
  return new XMLSerializer().serializeToString(r.documentElement);
}
const ge = 1, $e = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function ve(t) {
  if (typeof t != "object" || t === null) return !1;
  const r = t, f = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof f == "object" && f !== null && typeof f.earned == "boolean" && typeof f.gap == "boolean" && typeof f.violation == "boolean" && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string");
}
function be(t) {
  if (typeof t != "object" || t === null) return !1;
  const r = t;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r || r.type === "restore-state" && ve(r.state));
}
const we = () => Object.freeze({ zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), oe = (t, r) => Object.freeze({ ...t, ...r, overlays: Object.freeze({ ...t.overlays, ...r.overlays }) }), F = (t, r) => `<button type="button" aria-label="${t}" title="${t}">${r}</button>`, Ie = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <label>Run <select data-role="runs" aria-label="Run snapshot"></select></label>
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${F("Zoom out", "−")}${F("Zoom in", "+")}${F("Fit canvas", "Fit")}
      </div>
      <fieldset><legend>Overlays</legend>
        <label><input type="checkbox" data-overlay="earned" checked> Earned</label>
        <label><input type="checkbox" data-overlay="gap" checked> Gap</label>
        <label><input type="checkbox" data-overlay="violation" checked> Violation</label>
      </fieldset>
    </header>
    <nav class="ply-breadcrumbs" aria-label="Semantic focus"></nav>
    <div class="ply-workspace">
      <main class="ply-canvas" tabindex="0" aria-label="Architecture canvas. Use arrow keys to move between items and Enter to inspect." data-empty="true">
        <div class="ply-stage"></div>
        <div class="ply-tooltip" id="ply-vis-tooltip" role="tooltip" hidden></div>
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <aside class="ply-inspector" aria-label="Element details" aria-live="polite"><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;
function Se(t, r, f = []) {
  t.innerHTML = Ie;
  const l = t.querySelector(".ply-vis"), m = l.querySelector(".ply-canvas"), s = l.querySelector(".ply-stage"), a = l.querySelector(".ply-tooltip"), h = l.querySelector(".ply-inspector"), w = l.querySelector(".ply-status"), $ = l.querySelector('[data-role="runs"]'), b = l.querySelector(".ply-breadcrumbs"), L = /* @__PURE__ */ new Map();
  let c = we(), p, S, I;
  const q = () => r.post({ channel: "ply-vis", version: ge, type: "persist-state", state: c }), x = (e, n = !0) => {
    c = oe(c, e), n && q();
  }, A = () => {
    s.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, ie = () => p ? Object.values(p.elements).filter((e) => !c.focusedId || e.id === c.focusedId || W(e, c.focusedId, p.elements)) : [];
  function W(e, n, o) {
    let i = e.parentId;
    for (; i; ) {
      if (i === n) return !0;
      i = o[i]?.parentId;
    }
    return !1;
  }
  function se() {
    if (b.replaceChildren(), !p) return;
    const e = [];
    let n = c.focusedId ? p.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? p.elements[n.parentId] : void 0;
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", b.append(o);
    for (const i of e) {
      const y = document.createElement("button");
      y.type = "button", y.textContent = i.label, y.dataset.focusId = i.id, b.append(y);
    }
  }
  function N(e) {
    h.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", h.append(n), !e || !p) {
      const d = document.createElement("p");
      d.textContent = "Select an item to inspect its declaration and evidence.", h.append(d);
      return;
    }
    h.append(C("Declaration", e.declaration ? [e.declaration] : ["No declaration text supplied."])), h.append(C("Verdict", [e.evidence.verdict])), h.append(C("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const o = Object.entries(e.evidence).filter(([d]) => !["verdict", "statuses"].includes(d)).map(([d, u]) => `${d}: ${typeof u == "string" ? u : JSON.stringify(u)}`);
    h.append(C("Earned evidence", o.length ? o : ["No additional evidence details supplied."])), h.append(C("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const i = new Map(p.diagnostics.map((d) => [d.id, d])), y = e.diagnosticIds.map((d) => i.get(d)).filter((d) => d !== void 0).map((d) => `${d.code} — ${d.severity}: ${d.message}`);
    if (h.append(C("Diagnostics", y.length ? y : ["No diagnostics supplied."])), h.append(C("Run", [`${p.run.id} — ${p.run.completedAt}`, `Root: ${p.run.root.path}`, `Tool: ${p.run.tool.name} ${p.run.tool.version}`, `Outcome: ${p.run.outcome}`])), e.source) {
      const d = document.createElement("button");
      d.type = "button", d.className = "ply-source", d.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, d.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), h.append(d);
    }
  }
  function C(e, n) {
    const o = document.createElement("section"), i = document.createElement("h3");
    i.textContent = e, o.append(i);
    const y = document.createElement("ul");
    for (const d of n) {
      const u = document.createElement("li");
      u.textContent = d, y.append(u);
    }
    return o.append(y), o;
  }
  function k(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id]") ?? void 0 : void 0;
  }
  function T(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? p?.elements[n] : void 0;
  }
  function re(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function P(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function O() {
    I && P(I), I = void 0, a.hidden = !0, a.replaceChildren();
  }
  function ae(e, n) {
    if (!p) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const i = Object.entries(e.evidence).filter(([u, v]) => !["verdict", "statuses"].includes(u) && v !== !1 && v !== void 0).map(([u, v]) => `${u}: ${typeof v == "string" ? v : JSON.stringify(v)}`);
    o.push(...i), o.push(...(e.limitations ?? []).map((u) => `Limitation: ${u}`));
    const y = new Map(p.diagnostics.map((u) => [u.id, u]));
    for (const u of e.diagnosticIds) {
      const v = y.get(u);
      v && o.push(`${v.code} — ${v.severity}: ${v.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const d = n.querySelector("title")?.textContent?.trim();
    return d && d !== e.label && !o.includes(d) && o.push(d), o;
  }
  function H(e, n) {
    const o = m.getBoundingClientRect(), i = 8, y = 12, d = a.offsetWidth, u = a.offsetHeight, v = Math.max(i, o.width - d - i), Z = Math.max(i, o.height - u - i), _ = e - o.left + y, V = n - o.top + y, ce = V + u <= o.height - i ? V : n - o.top - u - y;
    a.style.left = `${Math.min(v, Math.max(i, _))}px`, a.style.top = `${Math.min(Z, Math.max(i, ce))}px`;
  }
  function J(e, n, o) {
    const i = T(e);
    if (!i || e.hasAttribute("hidden")) {
      O();
      return;
    }
    I && I !== e && P(I), I = e;
    const y = document.createElement("strong");
    y.textContent = i.label;
    const d = document.createElement("span");
    d.textContent = ae(i, e).join(`
`), a.replaceChildren(y, d), a.hidden = !1, re(e);
    const u = e.getBoundingClientRect();
    H(n ?? u.left + u.width / 2, o ?? u.bottom);
  }
  function j() {
    if (!p) return;
    const e = [...s.querySelectorAll("[data-element-id], [data-ply-id]")];
    for (const i of e) {
      const y = i.dataset.elementId ?? i.dataset.plyId ?? "", d = p.elements[y];
      if (!d) {
        i.setAttribute("hidden", "");
        continue;
      }
      const u = /* @__PURE__ */ new Set([d.evidence.verdict, ...d.evidence.statuses]), v = u.has("violation") ? "violation" : u.has("gap") ? "gap" : u.has("earned") ? "earned" : "declared", Z = v === "declared" || c.overlays[v], _ = !c.focusedId || d.id === c.focusedId || W(d, c.focusedId, p.elements);
      i.toggleAttribute("hidden", !Z || !_);
      const V = [d.evidence.verdict, ...d.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${d.kind}: ${d.label}; ${V}`), i.dataset.state = v, i.classList.toggle("is-selected", d.id === c.selectedId), i === I && (i.hasAttribute("hidden") || !i.isConnected) && O();
    }
    const n = e.filter((i) => !i.hasAttribute("hidden") && T(i)), o = n.find((i) => T(i)?.id === c.selectedId) ?? n[0];
    for (const i of e) i.setAttribute("tabindex", i === o ? "0" : "-1");
    se();
  }
  function M(e) {
    p = e, $.value = e.run.id, c.runId !== e.run.id && x({ runId: e.run.id, selectedId: void 0, focusedId: void 0 }, !1), O(), s.innerHTML = e.svg, m.dataset.empty = "false";
    const n = m.querySelector(".ply-empty");
    n && n.remove(), j(), A(), N(c.selectedId ? e.elements[c.selectedId] : void 0), w.textContent = `Showing run ${e.run.id}`;
  }
  function D(e) {
    try {
      const n = le(e), o = Object.freeze({ ...n, svg: he(n.svg) });
      return L.set(o.run.id, o), [...$.options].some((i) => i.value === o.run.id) || $.add(new Option(`${o.run.id} — ${o.run.completedAt}`, o.run.id)), M(o), delete l.dataset.error, !0;
    } catch (n) {
      const o = n instanceof g || n instanceof Error ? n.message : "Unknown artifact error";
      return w.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, l.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function X(e) {
    p?.elements[e] && (x({ selectedId: e }), j(), N(p.elements[e]));
  }
  function G(e) {
    [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => T(o)?.id === e)?.focus();
  }
  function R(e) {
    e && !p?.elements[e] || (x({ focusedId: e, selectedId: e }), j(), N(e ? p?.elements[e] : void 0));
  }
  function Y(e) {
    x({ zoom: Math.min(4, Math.max(0.2, e)) }), A(), w.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function de() {
    x({ zoom: 1, panX: 0, panY: 0 }), A(), w.textContent = "Canvas fitted";
  }
  l.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => Y(c.zoom * 1.2)), l.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => Y(c.zoom / 1.2)), l.querySelector('[aria-label="Fit canvas"]').addEventListener("click", de), $.addEventListener("change", () => {
    const e = L.get($.value);
    e && (M(e), q());
  }), l.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    x({ overlays: { ...c.overlays, [n]: e.checked } }), j();
  })), b.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && R(n.dataset.focusId || void 0);
  }), s.addEventListener("click", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && X(o);
  }), s.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && R(o);
  }), s.addEventListener("pointerover", (e) => {
    const n = k(e.target);
    n && J(n, e.clientX, e.clientY);
  }), s.addEventListener("pointermove", (e) => {
    const n = k(e.target);
    n && n === I && !a.hidden && H(e.clientX, e.clientY);
  }), s.addEventListener("pointerout", (e) => {
    const n = k(e.target);
    !n || n !== I || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.contains(document.activeElement) || O();
  }), s.addEventListener("focusin", (e) => {
    const n = k(e.target);
    n && J(n);
  }), s.addEventListener("focusout", (e) => {
    const n = k(e.target);
    !n || n !== I || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || O();
  }), m.addEventListener("wheel", (e) => {
    e.preventDefault(), Y(c.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("[data-element-id], [data-ply-id]")) {
      S = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY };
      try {
        m.setPointerCapture(e.pointerId);
      } catch {
      }
    }
  }), m.addEventListener("pointermove", (e) => {
    S && (x({ panX: S.panX + e.clientX - S.x, panY: S.panY + e.clientY - S.y }, !1), A());
  }), m.addEventListener("pointerup", () => {
    S && (S = void 0, q());
  }), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), O();
      return;
    }
    const n = ie();
    if (!n.length) return;
    const o = Math.max(0, n.findIndex((i) => i.id === c.selectedId));
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const i = n[(o + 1) % n.length].id;
      X(i), G(i);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const i = n[(o - 1 + n.length) % n.length].id;
      X(i), G(i);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const i = n[o];
      R(i.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const i = c.focusedId ? p?.elements[c.focusedId]?.parentId : void 0;
      R(i);
    }
  });
  const K = (e) => {
    if (be(e.data))
      if (e.data.type === "artifact") D(e.data.envelope);
      else {
        c = oe(c, e.data.state), l.querySelectorAll("[data-overlay]").forEach((o) => {
          o.checked = c.overlays[o.dataset.overlay];
        });
        const n = c.runId ? L.get(c.runId) : void 0;
        n && n !== p ? M(n) : p && (j(), A(), N(c.selectedId ? p.elements[c.selectedId] : void 0));
      }
  }, Q = (e) => {
    w.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ee = (e) => Q(e.message || "Unknown runtime error"), te = (e) => Q(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", K), window.addEventListener("error", ee), window.addEventListener("unhandledrejection", te);
  for (const e of f) D(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), f.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: D, getState: () => c, destroy: () => {
    window.removeEventListener("message", K), window.removeEventListener("error", ee), window.removeEventListener("unhandledrejection", te), t.replaceChildren();
  } };
}
const Le = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Le as CONTENT_SECURITY_POLICY,
  g as EnvelopeError,
  ge as HOST_PROTOCOL_VERSION,
  Ee as PROTOCOL_VERSION,
  we as initialViewState,
  be as isHostResponse,
  Se as mountViewer,
  le as parseEnvelope,
  he as sanitizeSvg,
  oe as updateViewState,
  $e as windowHostBridge
};
//# sourceMappingURL=index.js.map
