import fixtureText from '../fixtures/canonical-v1.json?raw';
import realPlyRenderText from '../fixtures/real-ply-render.json?raw';
import plySelfRenderText from '../fixtures/ply-self-render.json?raw';
import { mountViewer, type HostRequest, type VisualEnvelope } from '../../src';

const fixture = JSON.parse(fixtureText) as VisualEnvelope;
const messages: HostRequest[] = [];
const viewer = mountViewer(document.querySelector('#app')!, { post: (message) => messages.push(message) }, [fixture]);

function makeLargeFixture(componentCount = 500, functionsPerComponent = 10): VisualEnvelope {
  const elements: Record<string, VisualEnvelope['elements'][string]> = { workspace: { id: 'workspace', kind: 'workspace', label: 'Large workspace', evidence: { verdict: 'earned', statuses: [], reused: false }, diagnosticIds: [] } };
  const parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="12000">', '<g id="workspace" data-element-id="workspace"><rect width="3000" height="12000" fill="#fff"/></g>'];
  for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
    const componentId = `c${componentIndex}`; elements[componentId] = { id: componentId, kind: 'component', label: `Component ${componentIndex}`, parentId: 'workspace', evidence: { verdict: componentIndex % 3 === 0 ? 'gap' : 'earned', statuses: [], reused: false }, diagnosticIds: [] };
    parts.push(`<g id="${componentId}" data-element-id="${componentId}"><rect x="${(componentIndex % 10) * 290}" y="${Math.floor(componentIndex / 10) * 230}" width="270" height="210" fill="#eee"/></g>`);
    for (let functionIndex = 0; functionIndex < functionsPerComponent; functionIndex++) {
      const id = `${componentId}-f${functionIndex}`; elements[id] = { id, kind: 'function', label: `Function ${componentIndex}.${functionIndex}`, parentId: componentId, evidence: { verdict: functionIndex === 9 ? 'violation' : 'earned', statuses: [], reused: false }, diagnosticIds: [] };
      parts.push(`<g id="${id}" data-element-id="${id}"><rect x="${(componentIndex % 10) * 290 + 8}" y="${Math.floor(componentIndex / 10) * 230 + 8 + functionIndex * 19}" width="250" height="15" fill="#fff"/></g>`);
    }
  }
  parts.push('</svg>');
  return { protocolVersion: 1, run: { id: 'large', completedAt: '2026-08-28T05:00:00Z', root: { path: '/large' }, tool: { name: 'ply', version: 'test' }, outcome: 'violation' }, svg: parts.join(''), elements, diagnostics: [] };
}

const realPlyRender = JSON.parse(realPlyRenderText) as VisualEnvelope;
// Ply's own architecture, two levels deep: six crates, seven modules inside
// two of them. Regenerate with `cargo ply render ply.yaml --json` from the
// ply repository root.
const plySelfRender = JSON.parse(plySelfRenderText) as VisualEnvelope;

Object.assign(window, { viewer, messages, fixture, makeLargeFixture, realPlyRender, plySelfRender });
