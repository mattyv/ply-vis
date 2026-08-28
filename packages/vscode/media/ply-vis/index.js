const ve = 1;
class g extends Error {
}
const w = (t) => typeof t == "object" && t !== null && !Array.isArray(t), A = (t, r, f = []) => {
  const u = /* @__PURE__ */ new Set([...r, ...f]);
  return r.every((m) => m in t) && Object.keys(t).every((m) => u.has(m));
}, Z = (t) => Array.isArray(t) && t.every((r) => typeof r == "string");
function B(t) {
  if (t === null || typeof t == "boolean" || typeof t == "string" || typeof t == "number" && Number.isFinite(t)) return t;
  if (Array.isArray(t)) return Object.freeze(t.map(B));
  if (w(t)) return Object.freeze(Object.fromEntries(Object.entries(t).map(([r, f]) => [r, B(f)])));
  throw new g("Evidence contains a non-JSON value");
}
function ne(t) {
  if (t !== void 0) {
    if (!w(t) || !A(t, ["file", "startLine", "startColumn", "endLine", "endColumn"])) throw new g("Invalid source location");
    if (typeof t.file != "string" || !t.file || t.file.startsWith("/") || t.file.startsWith("\\") || /^[A-Za-z]:[\\/]/.test(t.file) || t.file.split(/[\\/]/).some((r) => r === ".." || r === ".")) throw new g("Invalid source location");
    for (const r of ["startLine", "startColumn", "endLine", "endColumn"]) if (!Number.isInteger(t[r]) || t[r] < 0) throw new g("Invalid source location");
    if (t.endLine < t.startLine || t.endLine === t.startLine && t.endColumn < t.startColumn) throw new g("Invalid source range");
    return Object.freeze({ file: t.file, startLine: t.startLine, startColumn: t.startColumn, endLine: t.endLine, endColumn: t.endColumn });
  }
}
function le(t) {
  if (!w(t) || !A(t, ["protocolVersion", "run", "svg", "elements", "diagnostics"])) throw new g("Invalid visual envelope");
  if (t.protocolVersion !== 1) throw new g(`Unsupported visual protocol version: ${String(t.protocolVersion)}`);
  const r = /* @__PURE__ */ new Set(["clean", "violation", "timeout", "missing_evidence", "narrowed_evidence"]);
  if (!w(t.run) || !A(t.run, ["id", "completedAt", "root", "tool", "outcome"]) || typeof t.run.id != "string" || !/^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/.test(t.run.id) || typeof t.run.completedAt != "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(t.run.completedAt) || Number.isNaN(Date.parse(t.run.completedAt)) || !w(t.run.root) || !A(t.run.root, ["path"]) || typeof t.run.root.path != "string" || !t.run.root.path || !w(t.run.tool) || !A(t.run.tool, ["name", "version"]) || typeof t.run.tool.name != "string" || !t.run.tool.name || typeof t.run.tool.version != "string" || !t.run.tool.version || !r.has(t.run.outcome)) throw new g("Invalid run metadata");
  if (typeof t.svg != "string" || !t.svg.trim()) throw new g("Invalid SVG");
  if (!w(t.elements)) throw new g("Invalid element index");
  const f = {};
  for (const [s, a] of Object.entries(t.elements)) {
    if (!w(a) || !["id", "kind", "label", "evidence", "diagnosticIds"].every((E) => E in a) || !w(a.evidence)) throw new g(`Invalid element: ${s}`);
    if (a.id !== s || typeof a.id != "string" || !a.id || typeof a.kind != "string" || !a.kind || typeof a.label != "string" || !a.label || typeof a.evidence.verdict != "string" || !Z(a.evidence.statuses) || typeof a.evidence.reused != "boolean" || !Z(a.diagnosticIds) || a.parentId !== void 0 && typeof a.parentId != "string" || a.declaration !== void 0 && typeof a.declaration != "string" || a.limitations !== void 0 && !Z(a.limitations)) throw new g(`Invalid element: ${s}`);
    const b = B(a.evidence);
    f[s] = Object.freeze({ id: s, kind: a.kind, label: a.label, evidence: b, diagnosticIds: Object.freeze([...a.diagnosticIds]), ...a.parentId === void 0 ? {} : { parentId: a.parentId }, ...a.declaration === void 0 ? {} : { declaration: a.declaration }, ...a.limitations === void 0 ? {} : { limitations: Object.freeze([...a.limitations]) }, ...a.source === void 0 ? {} : { source: ne(a.source) } });
  }
  for (const s of Object.values(f)) if (s.parentId && !f[s.parentId]) throw new g(`Unknown parent: ${s.parentId}`);
  if (!Array.isArray(t.diagnostics)) throw new g("Invalid diagnostics");
  const u = [], m = /* @__PURE__ */ new Set();
  for (const s of t.diagnostics) {
    if (!w(s) || typeof s.id != "string" || !s.id || m.has(s.id) || typeof s.code != "string" || !s.code || typeof s.severity != "string" || !s.severity || typeof s.message != "string" || !s.message || s.elementId !== void 0 && typeof s.elementId != "string") throw new g("Invalid diagnostic");
    m.add(s.id), u.push(Object.freeze({ id: s.id, code: s.code, severity: s.severity, message: s.message, ...s.elementId === void 0 ? {} : { elementId: s.elementId }, ...s.source === void 0 ? {} : { source: ne(s.source) } }));
  }
  for (const s of Object.values(f)) for (const a of s.diagnosticIds ?? []) if (!m.has(a)) throw new g(`Unknown diagnostic: ${a}`);
  for (const s of u) if (s.elementId && !f[s.elementId]) throw new g(`Unknown diagnostic element: ${s.elementId}`);
  return Object.freeze({ protocolVersion: 1, run: Object.freeze({ id: t.run.id, completedAt: t.run.completedAt, root: Object.freeze({ path: t.run.root.path }), tool: Object.freeze({ name: t.run.tool.name, version: t.run.tool.version }), outcome: t.run.outcome }), svg: t.svg, elements: Object.freeze(f), diagnostics: Object.freeze(u) });
}
const pe = /* @__PURE__ */ new Set(["script", "style", "foreignobject", "iframe", "object", "embed", "audio", "video", "animate", "animatemotion", "animatetransform", "set"]), fe = /* @__PURE__ */ new Set(["href", "xlink:href", "src"]);
function ue(t) {
  if (/<!doctype|<\?xml-stylesheet/i.test(t)) throw new Error("The artifact contains forbidden XML directives");
  const r = new DOMParser().parseFromString(t, "image/svg+xml");
  if (r.querySelector("parsererror") || r.documentElement.localName !== "svg") throw new Error("The artifact contains invalid SVG");
  for (const f of [...r.querySelectorAll("*")]) {
    if (pe.has(f.localName.toLowerCase())) {
      f.remove();
      continue;
    }
    for (const u of [...f.attributes]) {
      const m = u.name.toLowerCase(), s = u.value.trim().toLowerCase(), a = /url\s*\(\s*['"]?(?:https?:|\/\/|data:|javascript:|file:)/i.test(s);
      (m.startsWith("on") || m === "style" || a || fe.has(m) && s !== "" && !s.startsWith("#")) && f.removeAttribute(u.name);
    }
  }
  return new XMLSerializer().serializeToString(r.documentElement);
}
const me = 1, we = () => ({ post: (t) => window.parent.postMessage(t, "*") });
function ye(t) {
  if (typeof t != "object" || t === null) return !1;
  const r = t, f = r.overlays;
  return typeof r.zoom == "number" && Number.isFinite(r.zoom) && typeof r.panX == "number" && Number.isFinite(r.panX) && typeof r.panY == "number" && Number.isFinite(r.panY) && typeof f == "object" && f !== null && typeof f.earned == "boolean" && typeof f.gap == "boolean" && typeof f.violation == "boolean" && (r.runId === void 0 || typeof r.runId == "string") && (r.selectedId === void 0 || typeof r.selectedId == "string") && (r.focusedId === void 0 || typeof r.focusedId == "string");
}
function ge(t) {
  if (typeof t != "object" || t === null) return !1;
  const r = t;
  return r.channel === "ply-vis" && r.version === 1 && (r.type === "artifact" && "envelope" in r || r.type === "restore-state" && ye(r.state));
}
const he = () => Object.freeze({ zoom: 1, panX: 0, panY: 0, overlays: Object.freeze({ earned: !0, gap: !0, violation: !0 }) }), oe = (t, r) => Object.freeze({ ...t, ...r, overlays: Object.freeze({ ...t.overlays, ...r.overlays }) }), _ = (t, r) => `<button type="button" aria-label="${t}" title="${t}">${r}</button>`, be = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <label>Run <select data-role="runs" aria-label="Run snapshot"></select></label>
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${_("Zoom out", "−")}${_("Zoom in", "+")}${_("Fit canvas", "Fit")}
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
function Ie(t, r, f = []) {
  t.innerHTML = be;
  const u = t.querySelector(".ply-vis"), m = u.querySelector(".ply-canvas"), s = u.querySelector(".ply-stage"), a = u.querySelector(".ply-tooltip"), b = u.querySelector(".ply-inspector"), E = u.querySelector(".ply-status"), O = u.querySelector('[data-role="runs"]'), k = u.querySelector(".ply-breadcrumbs"), V = /* @__PURE__ */ new Map();
  let c = he(), l, I, v;
  const q = () => r.post({ channel: "ply-vis", version: me, type: "persist-state", state: c }), L = (e, n = !0) => {
    c = oe(c, e), n && q();
  }, C = () => {
    s.style.transform = `translate(${c.panX}px, ${c.panY}px) scale(${c.zoom})`;
  }, ie = () => l ? Object.values(l.elements).filter((e) => !c.focusedId || e.id === c.focusedId || W(e, c.focusedId, l.elements)) : [];
  function W(e, n, o) {
    let i = e.parentId;
    for (; i; ) {
      if (i === n) return !0;
      i = o[i]?.parentId;
    }
    return !1;
  }
  function se() {
    if (k.replaceChildren(), !l) return;
    const e = [];
    let n = c.focusedId ? l.elements[c.focusedId] : void 0;
    for (; n; )
      e.unshift(n), n = n.parentId ? l.elements[n.parentId] : void 0;
    const o = document.createElement("button");
    o.type = "button", o.textContent = "Workspace", o.dataset.focusId = "", k.append(o);
    for (const i of e) {
      const y = document.createElement("button");
      y.type = "button", y.textContent = i.label, y.dataset.focusId = i.id, k.append(y);
    }
  }
  function z(e) {
    b.replaceChildren();
    const n = document.createElement("h2");
    if (n.textContent = e?.label ?? "Details", b.append(n), !e || !l) {
      const d = document.createElement("p");
      d.textContent = "Select an item to inspect its declaration and evidence.", b.append(d);
      return;
    }
    b.append(S("Declaration", e.declaration ? [e.declaration] : ["No declaration text supplied."])), b.append(S("Verdict", [e.evidence.verdict])), b.append(S("Statuses", e.evidence.statuses.length ? e.evidence.statuses : ["No statuses supplied."]));
    const o = Object.entries(e.evidence).filter(([d]) => !["verdict", "statuses"].includes(d)).map(([d, p]) => `${d}: ${typeof p == "string" ? p : JSON.stringify(p)}`);
    b.append(S("Earned evidence", o.length ? o : ["No additional evidence details supplied."])), b.append(S("Limitations", e.limitations?.length ? e.limitations : ["No limitations supplied."]));
    const i = new Map(l.diagnostics.map((d) => [d.id, d])), y = e.diagnosticIds.map((d) => i.get(d)).filter((d) => d !== void 0).map((d) => `${d.code} — ${d.severity}: ${d.message}`);
    if (b.append(S("Diagnostics", y.length ? y : ["No diagnostics supplied."])), b.append(S("Run", [`${l.run.id} — ${l.run.completedAt}`, `Root: ${l.run.root.path}`, `Tool: ${l.run.tool.name} ${l.run.tool.version}`, `Outcome: ${l.run.outcome}`])), e.source) {
      const d = document.createElement("button");
      d.type = "button", d.className = "ply-source", d.textContent = `Open ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`, d.addEventListener("click", () => r.post({ channel: "ply-vis", version: 1, type: "navigate", source: e.source })), b.append(d);
    }
  }
  function S(e, n) {
    const o = document.createElement("section"), i = document.createElement("h3");
    i.textContent = e, o.append(i);
    const y = document.createElement("ul");
    for (const d of n) {
      const p = document.createElement("li");
      p.textContent = d, y.append(p);
    }
    return o.append(y), o;
  }
  function x(e) {
    return e instanceof Element ? e.closest("[data-element-id], [data-ply-id]") ?? void 0 : void 0;
  }
  function N(e) {
    const n = e.dataset.elementId ?? e.dataset.plyId;
    return n ? l?.elements[n] : void 0;
  }
  function re(e) {
    const n = new Set((e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    n.add(a.id), e.setAttribute("aria-describedby", [...n].join(" "));
  }
  function P(e) {
    const n = (e.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((o) => o && o !== a.id);
    n.length ? e.setAttribute("aria-describedby", n.join(" ")) : e.removeAttribute("aria-describedby");
  }
  function $() {
    v && P(v), v = void 0, a.hidden = !0, a.replaceChildren();
  }
  function ae(e, n) {
    if (!l) return [];
    const o = [`${e.kind} · Verdict: ${e.evidence.verdict}`];
    e.evidence.statuses.length && o.push(`Statuses: ${e.evidence.statuses.join(", ")}`);
    const i = Object.entries(e.evidence).filter(([p, h]) => !["verdict", "statuses"].includes(p) && h !== !1 && h !== void 0).map(([p, h]) => `${p}: ${typeof h == "string" ? h : JSON.stringify(h)}`);
    o.push(...i), o.push(...(e.limitations ?? []).map((p) => `Limitation: ${p}`));
    const y = new Map(l.diagnostics.map((p) => [p.id, p]));
    for (const p of e.diagnosticIds) {
      const h = y.get(p);
      h && o.push(`${h.code} — ${h.severity}: ${h.message}`);
    }
    e.source && o.push(`Source: ${e.source.file}:${e.source.startLine + 1}:${e.source.startColumn + 1}`);
    const d = n.querySelector("title")?.textContent?.trim();
    return d && d !== e.label && !o.includes(d) && o.push(d), o;
  }
  function H(e, n) {
    const o = m.getBoundingClientRect(), i = 8, y = 12, d = a.offsetWidth, p = a.offsetHeight, h = Math.max(i, o.width - d - i), U = Math.max(i, o.height - p - i), F = e - o.left + y, R = n - o.top + y, ce = R + p <= o.height - i ? R : n - o.top - p - y;
    a.style.left = `${Math.min(h, Math.max(i, F))}px`, a.style.top = `${Math.min(U, Math.max(i, ce))}px`;
  }
  function J(e, n, o) {
    const i = N(e);
    if (!i || e.hasAttribute("hidden")) {
      $();
      return;
    }
    v && v !== e && P(v), v = e;
    const y = document.createElement("strong");
    y.textContent = i.label;
    const d = document.createElement("span");
    d.textContent = ae(i, e).join(`
`), a.replaceChildren(y, d), a.hidden = !1, re(e);
    const p = e.getBoundingClientRect();
    H(n ?? p.left + p.width / 2, o ?? p.bottom);
  }
  function j() {
    if (!l) return;
    const e = [...s.querySelectorAll("[data-element-id], [data-ply-id]")];
    for (const i of e) {
      const y = i.dataset.elementId ?? i.dataset.plyId ?? "", d = l.elements[y];
      if (!d) {
        i.setAttribute("hidden", "");
        continue;
      }
      const p = /* @__PURE__ */ new Set([d.evidence.verdict, ...d.evidence.statuses]), h = p.has("violation") ? "violation" : p.has("gap") ? "gap" : p.has("earned") ? "earned" : "declared", U = h === "declared" || c.overlays[h], F = !c.focusedId || d.id === c.focusedId || W(d, c.focusedId, l.elements);
      i.toggleAttribute("hidden", !U || !F);
      const R = [d.evidence.verdict, ...d.evidence.statuses].filter(Boolean).join(", ") || "declared";
      i.setAttribute("role", "button"), i.setAttribute("aria-label", `${d.kind}: ${d.label}; ${R}`), i.dataset.state = h, i.classList.toggle("is-selected", d.id === c.selectedId), i === v && (i.hasAttribute("hidden") || !i.isConnected) && $();
    }
    const n = e.filter((i) => !i.hasAttribute("hidden") && N(i)), o = n.find((i) => N(i)?.id === c.selectedId) ?? n[0];
    for (const i of e) i.setAttribute("tabindex", i === o ? "0" : "-1");
    se();
  }
  function M(e) {
    l = e, O.value = e.run.id, c.runId !== e.run.id && L({ runId: e.run.id, selectedId: void 0, focusedId: void 0 }, !1), $(), s.innerHTML = e.svg, m.dataset.empty = "false";
    const n = m.querySelector(".ply-empty");
    n && n.remove(), j(), C(), z(c.selectedId ? e.elements[c.selectedId] : void 0), E.textContent = `Showing run ${e.run.id}`;
  }
  function D(e) {
    try {
      const n = le(e), o = Object.freeze({ ...n, svg: ue(n.svg) });
      return V.set(o.run.id, o), [...O.options].some((i) => i.value === o.run.id) || O.add(new Option(`${o.run.id} — ${o.run.completedAt}`, o.run.id)), M(o), delete u.dataset.error, !0;
    } catch (n) {
      const o = n instanceof g || n instanceof Error ? n.message : "Unknown artifact error";
      return E.textContent = `Artifact rejected: ${o}. The previous snapshot is unchanged.`, u.dataset.error = "true", r.post({ channel: "ply-vis", version: 1, type: "error", message: o }), !1;
    }
  }
  function X(e) {
    l?.elements[e] && (L({ selectedId: e }), j(), z(l.elements[e]));
  }
  function G(e) {
    [...s.querySelectorAll("[data-element-id], [data-ply-id]")].find((o) => N(o)?.id === e)?.focus();
  }
  function T(e) {
    e && !l?.elements[e] || (L({ focusedId: e, selectedId: e }), j(), z(e ? l?.elements[e] : void 0));
  }
  function Y(e) {
    L({ zoom: Math.min(4, Math.max(0.2, e)) }), C(), E.textContent = `Zoom ${Math.round(c.zoom * 100)}%`;
  }
  function de() {
    L({ zoom: 1, panX: 0, panY: 0 }), C(), E.textContent = "Canvas fitted";
  }
  u.querySelector('[aria-label="Zoom in"]').addEventListener("click", () => Y(c.zoom * 1.2)), u.querySelector('[aria-label="Zoom out"]').addEventListener("click", () => Y(c.zoom / 1.2)), u.querySelector('[aria-label="Fit canvas"]').addEventListener("click", de), O.addEventListener("change", () => {
    const e = V.get(O.value);
    e && (M(e), q());
  }), u.querySelectorAll("[data-overlay]").forEach((e) => e.addEventListener("change", () => {
    const n = e.dataset.overlay;
    L({ overlays: { ...c.overlays, [n]: e.checked } }), j();
  })), k.addEventListener("click", (e) => {
    const n = e.target.closest("button[data-focus-id]");
    n && T(n.dataset.focusId || void 0);
  }), s.addEventListener("click", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && X(o);
  }), s.addEventListener("dblclick", (e) => {
    const n = e.target.closest("[data-element-id], [data-ply-id]"), o = n?.dataset.elementId ?? n?.dataset.plyId;
    o && T(o);
  }), s.addEventListener("pointerover", (e) => {
    const n = x(e.target);
    n && J(n, e.clientX, e.clientY);
  }), s.addEventListener("pointermove", (e) => {
    const n = x(e.target);
    n && n === v && !a.hidden && H(e.clientX, e.clientY);
  }), s.addEventListener("pointerout", (e) => {
    const n = x(e.target);
    !n || n !== v || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.contains(document.activeElement) || $();
  }), s.addEventListener("focusin", (e) => {
    const n = x(e.target);
    n && J(n);
  }), s.addEventListener("focusout", (e) => {
    const n = x(e.target);
    !n || n !== v || e.relatedTarget instanceof Node && n.contains(e.relatedTarget) || n.matches(":hover") || $();
  }), m.addEventListener("wheel", (e) => {
    e.preventDefault(), Y(c.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: !1 }), m.addEventListener("pointerdown", (e) => {
    if (!e.target.closest("[data-element-id], [data-ply-id]")) {
      I = { x: e.clientX, y: e.clientY, panX: c.panX, panY: c.panY };
      try {
        m.setPointerCapture(e.pointerId);
      } catch {
      }
    }
  }), m.addEventListener("pointermove", (e) => {
    I && (L({ panX: I.panX + e.clientX - I.x, panY: I.panY + e.clientY - I.y }, !1), C());
  }), m.addEventListener("pointerup", () => {
    I && (I = void 0, q());
  }), m.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !a.hidden) {
      e.preventDefault(), $();
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
      T(i.id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      const i = c.focusedId ? l?.elements[c.focusedId]?.parentId : void 0;
      T(i);
    }
  });
  const K = (e) => {
    if (ge(e.data))
      if (e.data.type === "artifact") D(e.data.envelope);
      else {
        c = oe(c, e.data.state), u.querySelectorAll("[data-overlay]").forEach((o) => {
          o.checked = c.overlays[o.dataset.overlay];
        });
        const n = c.runId ? V.get(c.runId) : void 0;
        n && n !== l ? M(n) : l && (j(), C(), z(c.selectedId ? l.elements[c.selectedId] : void 0));
      }
  }, Q = (e) => {
    E.textContent = `Viewer error: ${e}`, r.post({ channel: "ply-vis", version: 1, type: "error", message: e });
  }, ee = (e) => Q(e.message || "Unknown runtime error"), te = (e) => Q(e.reason instanceof Error ? e.reason.message : String(e.reason));
  window.addEventListener("message", K), window.addEventListener("error", ee), window.addEventListener("unhandledrejection", te);
  for (const e of f) D(e);
  return r.post({ channel: "ply-vis", version: 1, type: "ready" }), f.length || r.post({ channel: "ply-vis", version: 1, type: "request-artifact" }), { load: D, getState: () => c, destroy: () => {
    window.removeEventListener("message", K), window.removeEventListener("error", ee), window.removeEventListener("unhandledrejection", te), t.replaceChildren();
  } };
}
const Ee = "default-src 'none'; img-src 'none'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
export {
  Ee as CONTENT_SECURITY_POLICY,
  g as EnvelopeError,
  me as HOST_PROTOCOL_VERSION,
  ve as PROTOCOL_VERSION,
  he as initialViewState,
  ge as isHostResponse,
  Ie as mountViewer,
  le as parseEnvelope,
  ue as sanitizeSvg,
  oe as updateViewState,
  we as windowHostBridge
};
//# sourceMappingURL=index.js.map
