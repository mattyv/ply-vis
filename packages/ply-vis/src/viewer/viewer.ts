import { EnvelopeError, parseEnvelope, type VisualElement, type VisualEnvelope } from '../protocol/envelope';
import { sanitizeSvg } from '../protocol/sanitize';
import { HOST_PROTOCOL_VERSION, isHostResponse, type HostBridge } from '../host/messages';
import { initialViewState, updateViewState, type ViewState } from '../state/view-state';
import { containsRect, fitRect, zoomAt, type Rect } from './viewport';

export interface Viewer { load(value: unknown): boolean; destroy(): void; getState(): ViewState }

const TOOLTIP_DELAY_MS = 500;
const iconButton = (label: string, text: string) => `<button type="button" aria-label="${label}" title="${label}">${text}</button>`;
const html = `
  <section class="ply-vis" aria-label="Ply visual evidence viewer">
    <header class="ply-toolbar">
      <div class="ply-tools" role="group" aria-label="Canvas controls">
        ${iconButton('Zoom out', '−')}${iconButton('Zoom in', '+')}${iconButton('Fit canvas', 'Fit')}
      </div>
      <fieldset><legend>Detail</legend>
        <label><input type="checkbox" data-fold-detail checked> Fold detail when zoomed out</label>
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
        <p class="ply-empty">Waiting for a visual artifact…</p>
      </main>
      <button type="button" class="ply-inspector-toggle" aria-label="Show details" title="Show details" aria-controls="ply-inspector" aria-expanded="false">‹</button>
      <aside class="ply-inspector" id="ply-inspector" aria-label="Element details" aria-live="polite" hidden><h2>Details</h2><p>Select an item to inspect its declaration and evidence.</p></aside>
    </div>
    <p class="ply-status" role="status" aria-live="polite"></p>
  </section>`;

export function mountViewer(container: HTMLElement, bridge: HostBridge, initialEnvelopes: readonly unknown[] = []): Viewer {
  container.innerHTML = html;
  const root = container.querySelector<HTMLElement>('.ply-vis')!;
  const canvas = root.querySelector<HTMLElement>('.ply-canvas')!;
  const stage = root.querySelector<HTMLElement>('.ply-stage')!;
  const tooltip = root.querySelector<HTMLElement>('.ply-tooltip')!;
  const inspector = root.querySelector<HTMLElement>('.ply-inspector')!;
  const inspectorToggle = root.querySelector<HTMLButtonElement>('.ply-inspector-toggle')!;
  const workspace = root.querySelector<HTMLElement>('.ply-workspace')!;
  const status = root.querySelector<HTMLElement>('.ply-status')!;
  const overlays = root.querySelector<HTMLFieldSetElement>('.ply-toolbar fieldset')!;
  const breadcrumbs = root.querySelector<HTMLElement>('.ply-breadcrumbs')!;
  let state = initialViewState();
  let active: VisualEnvelope | undefined;
  let drag: { x: number; y: number; panX: number; panY: number; pointerId: number; moved: boolean } | undefined;
  let suppressClickUntil = 0;
  let tooltipTarget: SVGElement | undefined;
  let tooltipTimer: number | undefined;

  const postState = () => bridge.post({ channel: 'ply-vis', version: HOST_PROTOCOL_VERSION, type: 'persist-state', state });
  const setState = (patch: Partial<ViewState>, persist = true) => { state = updateViewState(state, patch); if (persist) postState(); };
  const transform = () => { stage.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`; };
  const visibleElements = () => active ? Object.values(active.elements).filter((element) => !state.focusedId || element.id === state.focusedId || isDescendant(element, state.focusedId!, active!.elements)) : [];

  function renderDetailsVisibility() {
    inspector.hidden = state.detailsHidden;
    workspace.classList.toggle('is-inspector-hidden', state.detailsHidden);
    const label = state.detailsHidden ? 'Show details' : 'Hide details';
    inspectorToggle.setAttribute('aria-label', label);
    inspectorToggle.title = label;
    inspectorToggle.setAttribute('aria-expanded', String(!state.detailsHidden));
    inspectorToggle.textContent = state.detailsHidden ? '‹' : '›';
  }

  function setDetailsHidden(detailsHidden: boolean, persist = true) {
    setState({ detailsHidden }, persist);
    renderDetailsVisibility();
  }

  function isDescendant(element: VisualElement, ancestorId: string, elements: VisualEnvelope['elements']): boolean {
    let parent = element.parentId;
    while (parent) { if (parent === ancestorId) return true; parent = elements[parent]?.parentId; }
    return false;
  }

  function detailDepth(element: VisualElement): number {
    let depth = 0; let current: VisualElement | undefined = element;
    while (current?.parentId && current.id !== state.focusedId) { current = active?.elements[current.parentId]; depth += 1; }
    return state.focusedId && current?.id !== state.focusedId ? Number.POSITIVE_INFINITY : depth;
  }

  // Judged by apparent size, which is what legibility actually depends on:
  // below about 80% the smallest text in a Ply drawing stops being readable,
  // so continuing to draw it is noise rather than information. Briefly
  // (2026-09-02) this was made relative to the fitted zoom instead, to stop
  // a large document opening as empty boxes -- that traded one problem for a
  // worse one, showing every reader unreadable text by default. The empty
  // boxes are a separate defect with its own fix: a folded drawing should be
  // re-rendered at that depth, which Ply already does (`render --depth`),
  // rather than being the full drawing with holes in it.
  const visibleDetailDepth = () =>
    !state.foldDetail ? Number.POSITIVE_INFINITY
      : state.zoom < 0.8 ? 1 : state.zoom < 1.5 ? 2 : Number.POSITIVE_INFINITY;

  function renderBreadcrumbs() {
    breadcrumbs.replaceChildren();
    if (!active) return;
    const trail: VisualElement[] = [];
    let current = state.focusedId ? active.elements[state.focusedId] : undefined;
    while (current) { trail.unshift(current); current = current.parentId ? active.elements[current.parentId] : undefined; }
    const all = document.createElement('button'); all.type = 'button'; all.textContent = 'Workspace'; all.dataset.focusId = ''; breadcrumbs.append(all);
    for (const element of trail) { const button = document.createElement('button'); button.type = 'button'; button.textContent = element.label; button.dataset.focusId = element.id; breadcrumbs.append(button); }
  }

  function renderInspector(element?: VisualElement) {
    inspector.replaceChildren();
    const title = document.createElement('h2'); title.textContent = element?.label ?? 'Details'; inspector.append(title);
    if (!element || !active) { const p = document.createElement('p'); p.textContent = 'Select an item to inspect its declaration and evidence.'; inspector.append(p); return; }
    const declaration = element.declaration?.split('\n').filter(Boolean);
    inspector.append(section('Declaration', declaration?.length ? declaration : ['No declaration text supplied.']));
    inspector.append(section('Verdict', [element.evidence.verdict]));
    inspector.append(section('Statuses', element.evidence.statuses.length ? element.evidence.statuses : ['No statuses supplied.']));
    const evidenceDetails = Object.entries(element.evidence).filter(([key]) => !['verdict', 'statuses'].includes(key)).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    inspector.append(section('Earned evidence', evidenceDetails.length ? evidenceDetails : ['No additional evidence details supplied.']));
    inspector.append(section('Limitations', element.limitations?.length ? element.limitations : ['No limitations supplied.']));
    const diagnosticsById = new Map(active.diagnostics.map((item) => [item.id, item]));
    const diagnostics = element.diagnosticIds.map((id) => diagnosticsById.get(id)).filter((item) => item !== undefined).map((item) => `${item.code} — ${item.severity}: ${item.message}`);
    inspector.append(section('Diagnostics', diagnostics.length ? diagnostics : ['No diagnostics supplied.']));
    inspector.append(runDetails(active.run));
    if (element.source) { const button = document.createElement('button'); button.type = 'button'; button.className = 'ply-source'; button.textContent = `Open ${element.source.file}:${element.source.startLine + 1}:${element.source.startColumn + 1}`; button.addEventListener('click', () => bridge.post({ channel: 'ply-vis', version: 1, type: 'navigate', source: element.source! })); inspector.append(button); }
  }

  function section(titleText: string, values: readonly string[]): HTMLElement {
    const sectionElement = document.createElement('section'); const heading = document.createElement('h3'); heading.textContent = titleText; sectionElement.append(heading);
    const list = document.createElement('ul'); for (const value of values) { const item = document.createElement('li'); item.textContent = value; list.append(item); } sectionElement.append(list); return sectionElement;
  }
  function runDetails(run: VisualEnvelope['run']): HTMLElement {
    const labels: Record<VisualEnvelope['run']['outcome'], string> = {
      clean: 'Checks completed',
      violation: 'A declared rule was broken',
      timeout: 'Stopped before checks finished',
      missing_evidence: 'Some promised evidence is missing',
      narrowed_evidence: 'Checks covered less than promised',
    };
    const sectionElement = document.createElement('section');
    const heading = document.createElement('h3'); heading.textContent = 'Run details';
    const list = document.createElement('dl');
    const rows: ReadonlyArray<readonly [string, string]> = [
      ['Result', labels[run.outcome]],
      ['Finished', new Date(run.completedAt).toLocaleString()],
      ['Checked folder', run.root.path === '.' ? 'Workspace root' : run.root.path],
    ];
    for (const [term, value] of rows) {
      const dt = document.createElement('dt'); dt.textContent = term;
      const dd = document.createElement('dd'); dd.textContent = value;
      list.append(dt, dd);
    }
    sectionElement.append(heading, list);
    return sectionElement;
  }

  function tooltipNode(target: EventTarget | null): SVGElement | undefined {
    return target instanceof Element ? target.closest<SVGElement>('[data-element-id], [data-ply-id], [data-ply-title]') ?? undefined : undefined;
  }

  function elementForNode(node: SVGElement): VisualElement | undefined {
    const id = node.dataset.elementId ?? node.dataset.plyId;
    return id ? active?.elements[id] : undefined;
  }

  function describeWithTooltip(node: SVGElement) {
    const ids = new Set((node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
    ids.add(tooltip.id);
    node.setAttribute('aria-describedby', [...ids].join(' '));
  }

  function removeTooltipDescription(node: SVGElement) {
    const ids = (node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id && id !== tooltip.id);
    if (ids.length) node.setAttribute('aria-describedby', ids.join(' '));
    else node.removeAttribute('aria-describedby');
  }

  function cancelTooltipTimer() {
    if (tooltipTimer !== undefined) window.clearTimeout(tooltipTimer);
    tooltipTimer = undefined;
  }

  function hideTooltip() {
    if (tooltipTarget) removeTooltipDescription(tooltipTarget);
    cancelTooltipTimer();
    tooltipTarget = undefined;
    tooltip.hidden = true;
    tooltip.replaceChildren();
  }

  function tooltipLines(element: VisualElement, node: SVGElement): string[] {
    if (!active) return [];
    const lines = [`${element.kind} · Verdict: ${element.evidence.verdict}`];
    if (element.evidence.statuses.length) lines.push(`Statuses: ${element.evidence.statuses.join(', ')}`);
    const evidence = Object.entries(element.evidence)
      .filter(([key, value]) => !['verdict', 'statuses'].includes(key) && value !== false && value !== undefined)
      .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    lines.push(...evidence);
    lines.push(...(element.limitations ?? []).map((limitation) => `Limitation: ${limitation}`));
    const diagnostics = new Map(active.diagnostics.map((diagnostic) => [diagnostic.id, diagnostic]));
    for (const id of element.diagnosticIds) {
      const diagnostic = diagnostics.get(id);
      if (diagnostic) lines.push(`${diagnostic.code} — ${diagnostic.severity}: ${diagnostic.message}`);
    }
    if (element.source) lines.push(`Source: ${element.source.file}:${element.source.startLine + 1}:${element.source.startColumn + 1}`);
    const embedded = node.dataset.plyTitle?.trim();
    if (embedded && embedded !== element.label && !lines.includes(embedded)) lines.push(embedded);
    return lines;
  }

  function positionTooltip(clientX: number, clientY: number) {
    const canvasRect = canvas.getBoundingClientRect();
    const margin = 8;
    tooltip.style.maxHeight = `${Math.max(0, canvasRect.height - margin * 2)}px`;
    const gap = 12;
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const maxLeft = Math.max(margin, canvasRect.width - width - margin);
    const maxTop = Math.max(margin, canvasRect.height - height - margin);
    const desiredLeft = clientX - canvasRect.left + gap;
    const below = clientY - canvasRect.top + gap;
    const desiredTop = below + height <= canvasRect.height - margin ? below : clientY - canvasRect.top - height - gap;
    tooltip.style.left = `${Math.min(maxLeft, Math.max(margin, desiredLeft))}px`;
    tooltip.style.top = `${Math.min(maxTop, Math.max(margin, desiredTop))}px`;
  }

  function showTooltip(node: SVGElement, clientX?: number, clientY?: number) {
    const element = elementForNode(node);
    const embedded = node.dataset.plyTitle?.trim();
    if ((!element && !embedded) || node.hasAttribute('hidden')) { hideTooltip(); return; }
    if (tooltipTarget && tooltipTarget !== node) removeTooltipDescription(tooltipTarget);
    tooltipTarget = node;
    const details = document.createElement('span');
    if (element) {
      const heading = document.createElement('strong'); heading.textContent = element.label;
      details.textContent = tooltipLines(element, node).join('\n');
      tooltip.replaceChildren(heading, details);
    } else {
      details.textContent = embedded!;
      tooltip.replaceChildren(details);
    }
    tooltip.hidden = false;
    describeWithTooltip(node);
    const nodeRect = node.getBoundingClientRect();
    positionTooltip(clientX ?? nodeRect.left + nodeRect.width / 2, clientY ?? nodeRect.bottom);
  }

  function scheduleTooltip(node: SVGElement, clientX: number, clientY: number) {
    cancelTooltipTimer();
    if (tooltipTarget && tooltipTarget !== node) hideTooltip();
    tooltipTimer = window.setTimeout(() => {
      tooltipTimer = undefined;
      showTooltip(node, clientX, clientY);
    }, TOOLTIP_DELAY_MS);
  }

  function applyVisibility() {
    if (!active) return;
    const nodes = [...stage.querySelectorAll<SVGElement>('[data-element-id], [data-ply-id]')];
    const focused = state.focusedId ? active.elements[state.focusedId] : undefined;
    for (const node of nodes) {
      const nodeId = node.dataset.elementId ?? node.dataset.plyId ?? '';
      const element = active.elements[nodeId];
      if (!element) { node.removeAttribute('hidden'); continue; }
      const suppliedStates = new Set([element.evidence.verdict, ...element.evidence.statuses]);
      const stateClass = suppliedStates.has('violation') ? 'violation' : suppliedStates.has('gap') ? 'gap' : suppliedStates.has('earned') ? 'earned' : 'declared';
      const overlayVisible = stateClass === 'declared' || state.overlays[stateClass];
      const focusAncestor = focused ? isDescendant(focused, element.id, active.elements) : false;
      const focusVisible = !state.focusedId || element.id === state.focusedId || isDescendant(element, state.focusedId, active.elements) || focusAncestor;
      const detailVisible = focusAncestor || detailDepth(element) <= visibleDetailDepth();
      node.toggleAttribute('hidden', !focusVisible || !detailVisible || (!overlayVisible && !focusAncestor));
      const classifications = [element.evidence.verdict, ...element.evidence.statuses].filter(Boolean).join(', ') || 'declared';
      node.setAttribute('role', 'button'); node.setAttribute('aria-label', `${element.kind}: ${element.label}; ${classifications}`); node.dataset.state = stateClass;
      node.classList.toggle('is-selected', element.id === state.selectedId);
      if (node === tooltipTarget && (node.hasAttribute('hidden') || !node.isConnected)) hideTooltip();
    }
    const visibleNodes = nodes.filter((node) => !node.hasAttribute('hidden') && elementForNode(node));
    const rovingTarget = visibleNodes.find((node) => elementForNode(node)?.id === state.selectedId) ?? visibleNodes[0];
    for (const node of nodes) node.setAttribute('tabindex', node === rovingTarget ? '0' : '-1');
    applyFocusGeometry();
    renderBreadcrumbs();
  }

  function applyFocusGeometry() {
    const svg = stage.querySelector<SVGSVGElement>('svg');
    if (!svg) return;
    for (const child of [...svg.querySelectorAll<SVGElement>('[data-ply-focus-hidden]')]) {
      child.removeAttribute('hidden');
      child.removeAttribute('data-ply-focus-hidden');
    }
    if (!state.focusedId) return;
    const focusNode = [...stage.querySelectorAll<SVGGraphicsElement>('[data-element-id], [data-ply-id]')]
      .find((candidate) => elementForNode(candidate)?.id === state.focusedId);
    if (!focusNode || typeof focusNode.getBBox !== 'function') return;
    const focusBounds = focusNode.getBBox();
    const bounds: Rect = { x: focusBounds.x, y: focusBounds.y, width: focusBounds.width, height: focusBounds.height };
    for (const child of [...svg.children]) {
      if (!(child instanceof SVGElement) || child.matches('[data-element-id], [data-ply-id], defs, style, title')) continue;
      // Ply wraps each top-level box in a plain positioning group that carries
      // no identity of its own, so the thing being focused is usually inside
      // one of these rather than beside it. Switching off a group that holds
      // the focus switches off the focus: the viewer would report the item as
      // focused while the canvas went blank.
      if (child.contains(focusNode)) continue;
      const graphics = child as SVGGraphicsElement;
      if (typeof graphics.getBBox !== 'function') continue;
      let childBounds: DOMRect;
      try { childBounds = graphics.getBBox(); } catch { continue; }
      if (!containsRect(bounds, childBounds)) {
        child.setAttribute('hidden', '');
        child.setAttribute('data-ply-focus-hidden', '');
      }
    }
  }

  function show(envelope: VisualEnvelope) {
    active = envelope;
    setState({ runId: envelope.run.id, selectedId: undefined, focusedId: undefined, detailsHidden: true, zoom: 1, panX: 0, panY: 0 }, false);
    const hasEvidence = Object.keys(envelope.elements).length > 0;
    overlays.hidden = !hasEvidence;
    breadcrumbs.hidden = !hasEvidence;
    inspectorToggle.hidden = !hasEvidence;
    if (!hasEvidence) setDetailsHidden(true, false);
    renderDetailsVisibility();
    hideTooltip();
    stage.innerHTML = envelope.svg;
    for (const title of [...stage.querySelectorAll('title')]) {
      const parent = title.parentElement;
      const target = parent?.closest<SVGElement>('[data-element-id], [data-ply-id]')
        ?? (parent instanceof SVGElement ? parent : undefined);
      const text = title.textContent?.trim();
      if (target && text) {
        target.dataset.plyTitle = text;
        if (!elementForNode(target)) {
          target.setAttribute('tabindex', '0');
          target.setAttribute('role', 'img');
          target.setAttribute('aria-label', text);
        }
      }
      title.remove();
    }
    canvas.dataset.empty = 'false';
    const empty = canvas.querySelector('.ply-empty'); if (empty) empty.remove();
    applyVisibility(); transform(); renderInspector(state.selectedId ? envelope.elements[state.selectedId] : undefined);
    status.textContent = envelope.run.tool.version === 'render' ? 'Rendered Ply spec' : `Showing run ${envelope.run.id}`;
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(() => fit(false));
  }

  function load(value: unknown): boolean {
    try {
      const parsed = parseEnvelope(value);
      const envelope = Object.freeze({ ...parsed, svg: sanitizeSvg(parsed.svg) });
      show(envelope);
      delete root.dataset.error;
      return true;
    } catch (error) {
      const message = error instanceof EnvelopeError || error instanceof Error ? error.message : 'Unknown artifact error';
      status.textContent = `Artifact rejected: ${message}. The previous snapshot is unchanged.`;
      root.dataset.error = 'true';
      bridge.post({ channel: 'ply-vis', version: 1, type: 'error', message });
      return false;
    }
  }

  function select(id: string) { if (!active?.elements[id]) return; setState({ selectedId: id, detailsHidden: false }); renderDetailsVisibility(); applyVisibility(); renderInspector(active.elements[id]); }
  function focusNode(id: string) {
    const node = [...stage.querySelectorAll<SVGElement>('[data-element-id], [data-ply-id]')].find((candidate) => elementForNode(candidate)?.id === id);
    node?.focus();
  }
  function focus(id?: string) {
    if (id && !active?.elements[id]) return;
    if (id && !active!.elements[id]!.parentId) id = undefined;
    setState({ focusedId: id, selectedId: id, detailsHidden: !id });
    renderDetailsVisibility(); applyVisibility(); renderInspector(id ? active?.elements[id] : undefined); fit();
  }
  function zoomAnchor(): { x: number; y: number } {
    const canvasRect = canvas.getBoundingClientRect();
    const selected = state.selectedId
      ? [...stage.querySelectorAll<SVGElement>('[data-element-id], [data-ply-id]')].find((node) => elementForNode(node)?.id === state.selectedId)
      : undefined;
    const rect = selected?.getBoundingClientRect();
    return rect
      ? { x: rect.left - canvasRect.left + rect.width / 2, y: rect.top - canvasRect.top + rect.height / 2 }
      : { x: canvasRect.width / 2, y: canvasRect.height / 2 };
  }
  function setZoom(zoom: number, anchor = zoomAnchor()) {
    setState(zoomAt(state, Math.min(4, Math.max(0.2, zoom)), anchor)); applyVisibility(); transform(); status.textContent = `Zoom ${Math.round(state.zoom * 100)}%`;
  }
  function fit(announce = true) {
    const svg = stage.querySelector<SVGSVGElement>('svg');
    if (!svg) return;
    const stageRect = stage.getBoundingClientRect();
    const target = state.focusedId
      ? [...stage.querySelectorAll<SVGGraphicsElement>('[data-element-id], [data-ply-id]')].find((candidate) => elementForNode(candidate)?.id === state.focusedId)
      : svg;
    if (!target) return;
    const targetRect = target.getBoundingClientRect();
    const currentZoom = state.zoom || 1;
    const content = {
      x: (targetRect.left - stageRect.left) / currentZoom,
      y: (targetRect.top - stageRect.top) / currentZoom,
      width: targetRect.width / currentZoom,
      height: targetRect.height / currentZoom,
    };
    setState(fitRect({ width: canvas.clientWidth, height: canvas.clientHeight }, content));
    // Record what "the whole thing fits" means for THIS drawing, before
    // visibility is recomputed against it.
    applyVisibility();
    transform();
    if (announce) status.textContent = state.focusedId ? 'Focused element fitted' : 'Canvas fitted';
  }

  root.querySelector('[aria-label="Zoom in"]')!.addEventListener('click', () => setZoom(state.zoom * 1.2));
  root.querySelector('[aria-label="Zoom out"]')!.addEventListener('click', () => setZoom(state.zoom / 1.2));
  root.querySelector('[aria-label="Fit canvas"]')!.addEventListener('click', () => fit());
  inspectorToggle.addEventListener('click', () => setDetailsHidden(!state.detailsHidden));
  root.querySelectorAll<HTMLInputElement>('[data-overlay]').forEach((input) => input.addEventListener('change', () => { const key = input.dataset.overlay as 'earned' | 'gap' | 'violation'; setState({ overlays: { ...state.overlays, [key]: input.checked } }); applyVisibility(); }));
  root.querySelector<HTMLInputElement>('[data-fold-detail]')!.addEventListener('change', (event) => {
    setState({ foldDetail: (event.target as HTMLInputElement).checked });
    applyVisibility();
    status.textContent = state.foldDetail
      ? 'Detail folds away as you zoom out'
      : 'Detail stays on screen at every zoom';
  });
  breadcrumbs.addEventListener('click', (event) => { const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-focus-id]'); if (target) focus(target.dataset.focusId || undefined); });
  stage.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) return;
    const node = (event.target as Element).closest<SVGElement>('[data-element-id], [data-ply-id]'); const id = node?.dataset.elementId ?? node?.dataset.plyId; if (id) select(id);
  });
  stage.addEventListener('dblclick', (event) => { const node = (event.target as Element).closest<SVGElement>('[data-element-id], [data-ply-id]'); const id = node?.dataset.elementId ?? node?.dataset.plyId; if (id) focus(id); });
  stage.addEventListener('pointerover', (event) => { const node = tooltipNode(event.target); if (node) scheduleTooltip(node, event.clientX, event.clientY); });
  stage.addEventListener('pointermove', (event) => {
    const node = tooltipNode(event.target);
    if (!node) { cancelTooltipTimer(); return; }
    if (node === tooltipTarget && !tooltip.hidden) positionTooltip(event.clientX, event.clientY);
    else scheduleTooltip(node, event.clientX, event.clientY);
  });
  stage.addEventListener('pointerout', (event) => {
    const node = tooltipNode(event.target);
    if (!node || (event.relatedTarget instanceof Node && (node.contains(event.relatedTarget) || tooltip.contains(event.relatedTarget)))) return;
    if (!node.contains(document.activeElement)) hideTooltip();
  });
  stage.addEventListener('focusin', (event) => { const node = tooltipNode(event.target); if (node) { cancelTooltipTimer(); showTooltip(node); } });
  stage.addEventListener('focusout', (event) => {
    const node = tooltipNode(event.target);
    if (!node || (event.relatedTarget instanceof Node && node.contains(event.relatedTarget))) return;
    if (!node.matches(':hover')) hideTooltip();
  });
  tooltip.addEventListener('pointerleave', (event) => {
    if (!(event.relatedTarget instanceof Node && tooltipTarget?.contains(event.relatedTarget))) hideTooltip();
  });
  tooltip.addEventListener('wheel', (event) => event.stopPropagation());
  tooltip.addEventListener('pointerdown', (event) => event.stopPropagation());
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect(); setZoom(state.zoom * Math.exp(-event.deltaY * 0.002), { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }, { passive: false });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, panX: state.panX, panY: state.panY, pointerId: event.pointerId, moved: false };
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 3) return;
    if (!drag.moved) {
      drag.moved = true;
      canvas.classList.add('is-panning');
      try { canvas.setPointerCapture(drag.pointerId); } catch { /* Assistive input can pan without capture. */ }
    }
    event.preventDefault();
    setState({ panX: drag.panX + deltaX, panY: drag.panY + deltaY }, false);
    transform();
  });
  const finishDrag = () => {
    if (!drag) return;
    if (drag.moved) { suppressClickUntil = performance.now() + 250; postState(); }
    drag = undefined;
    canvas.classList.remove('is-panning');
  };
  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);
  canvas.addEventListener('lostpointercapture', finishDrag);
  canvas.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !tooltip.hidden) { event.preventDefault(); hideTooltip(); return; }
    const elements = visibleElements(); if (!elements.length) return;
    const current = Math.max(0, elements.findIndex((element) => element.id === state.selectedId));
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); const id = elements[(current + 1) % elements.length]!.id; select(id); focusNode(id); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); const id = elements[(current - 1 + elements.length) % elements.length]!.id; select(id); focusNode(id); }
    if (event.key === 'Enter') { event.preventDefault(); const element = elements[current]!; focus(element.id); }
    if (event.key === 'Escape') { event.preventDefault(); const parent = state.focusedId ? active?.elements[state.focusedId]?.parentId : undefined; focus(parent); }
  });

  const receive = (event: MessageEvent) => {
    if (!isHostResponse(event.data)) return;
    if (event.data.type === 'artifact') load(event.data.envelope);
    else {
      state = updateViewState(state, event.data.state);
      root.querySelectorAll<HTMLInputElement>('[data-overlay]').forEach((input) => { input.checked = state.overlays[input.dataset.overlay as keyof ViewState['overlays']]; });
      root.querySelector<HTMLInputElement>('[data-fold-detail]')!.checked = state.foldDetail;
      if (active) { renderDetailsVisibility(); applyVisibility(); transform(); renderInspector(state.selectedId ? active.elements[state.selectedId] : undefined); }
    }
  };
  const reportRuntimeError = (message: string) => {
    status.textContent = `Viewer error: ${message}`;
    bridge.post({ channel: 'ply-vis', version: 1, type: 'error', message });
  };
  const receiveError = (event: ErrorEvent) => reportRuntimeError(event.message || 'Unknown runtime error');
  const receiveRejection = (event: PromiseRejectionEvent) => reportRuntimeError(event.reason instanceof Error ? event.reason.message : String(event.reason));
  window.addEventListener('message', receive);
  window.addEventListener('error', receiveError);
  window.addEventListener('unhandledrejection', receiveRejection);
  renderDetailsVisibility();
  for (const envelope of initialEnvelopes) load(envelope);
  bridge.post({ channel: 'ply-vis', version: 1, type: 'ready' });
  if (!initialEnvelopes.length) bridge.post({ channel: 'ply-vis', version: 1, type: 'request-artifact' });

  return { load, getState: () => state, destroy: () => { cancelTooltipTimer(); window.removeEventListener('message', receive); window.removeEventListener('error', receiveError); window.removeEventListener('unhandledrejection', receiveRejection); container.replaceChildren(); } };
}
