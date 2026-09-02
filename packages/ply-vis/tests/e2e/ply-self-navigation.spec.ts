import { expect, test } from '@playwright/test';

// Reading Ply's own architecture in the viewer, the way a person new to the
// project would: open it, pull back to see the whole shape, then go into the
// one big box to find out what is inside it.
//
// This is the first drawing here that came out of the real tool describing the
// real repository -- six crates with seven modules nested two levels down --
// rather than a fixture written to suit the viewer. Documents built by hand
// agree with the code that renders them by construction; this one does not,
// which is the only reason it is worth testing against.
//
// Everything below measures what is actually painted rather than what the DOM
// records, because an element can keep every attribute the viewer sets and
// still be invisible from something switched off above it.
//
// Regenerate the drawing with, from the ply repository root:
//   cargo ply render ply.yaml --json \
//     > packages/ply-vis/tests/fixtures/ply-self-render.json

type Page = import('@playwright/test').Page;

/** Every crate at the top level of Ply's own document. */
const CRATES = ['e2e', 'attrs', 'core', 'cli', 'render', 'check'];
/** The modules drawn inside `core`, one level further in. */
const CORE_MODULES = ['kernel', 'engines', 'harness', 'visual', 'record'];

async function open(page: Page) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('/tests/harness/');
  await page.evaluate(() => (window as any).viewer.load((window as any).plySelfRender));
  await page.waitForTimeout(200);
}

/**
 * What a reader can actually see: the labels of every box that is painted and
 * occupies real space, and the current zoom.
 */
async function onScreen(page: Page): Promise<{ labels: string[]; zoom: number }> {
  return page.evaluate(() => {
    const w = window as any;
    const elements = w.plySelfRender.elements as Record<string, any>;
    const painted = (node: Element | null) => {
      let current: Element | null = node;
      while (current) {
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        current = current.parentElement;
      }
      return true;
    };
    const labels: string[] = [];
    for (const element of Object.values(elements) as any[]) {
      if (element.kind === 'workspace') continue;
      const node = document.querySelector(`[data-element-id="${element.id}"]`);
      if (!node || node.hasAttribute('hidden') || !painted(node)) continue;
      if (node.getBoundingClientRect().width <= 0) continue;
      labels.push(element.label);
    }
    return { labels, zoom: w.viewer.getState().zoom };
  });
}

async function zoomOutTo(page: Page, target: number) {
  await page.evaluate((limit) => {
    const w = window as any;
    for (let step = 0; step < 20; step += 1) {
      if (w.viewer.getState().zoom <= limit) break;
      (document.querySelector('button[aria-label="Zoom out"]') as HTMLButtonElement)?.click();
    }
  }, target);
  await page.waitForTimeout(200);
}

/**
 * Goes into a box the way a reader does: a real double-click, near the box's
 * own name rather than its middle. The middle of `core` is another box, and
 * the viewer quite correctly takes the innermost thing under the pointer --
 * so a test that clicked the centre would go somewhere else and still pass
 * its own assertions. A real click also moves keyboard focus, which a
 * dispatched event does not, and Escape depends on it.
 */
async function goInto(page: Page, label: string) {
  const id = await page.evaluate((wanted) => {
    const elements = (window as any).plySelfRender.elements as Record<string, any>;
    const target = (Object.values(elements) as any[]).find((element) => element.label === wanted);
    if (!target) throw new Error(`no box labelled ${wanted} in this drawing`);
    return target.id as string;
  }, label);
  await page.locator(`[data-element-id="${id}"]`).dblclick({ position: { x: 20, y: 14 } });
  await page.waitForTimeout(200);
}

/** Which box the viewer thinks you went into, by label. */
async function wentInto(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const w = window as any;
    const id = w.viewer.getState().focusedId;
    return id ? (w.plySelfRender.elements[id]?.label as string) : undefined;
  });
}

async function trail(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('button[data-focus-id]')].map((button) => button.textContent ?? ''),
  );
}

test('opening Ply’s own architecture shows every crate and every module', async ({ page }) => {
  await open(page);
  const { labels } = await onScreen(page);
  for (const crate of CRATES) {
    expect(labels, `\`${crate}\` is a crate in this document and should be on screen when it opens`).toContain(crate);
  }
  for (const module of CORE_MODULES) {
    expect(labels, `\`${module}\` sits inside \`core\` and should be on screen when the document opens`).toContain(module);
  }
});

test('pulling back folds the modules away and keeps the crates', async ({ page }) => {
  await open(page);
  await zoomOutTo(page, 0.7);
  const { labels, zoom } = await onScreen(page);
  const percent = Math.round(zoom * 100);
  for (const module of CORE_MODULES) {
    expect(
      labels,
      `at ${percent}% the module names are too small to read, so \`${module}\` should have been folded away`,
    ).not.toContain(module);
  }
  for (const crate of CRATES) {
    expect(
      labels,
      `folding is meant to drop the fine detail, not the shape: \`${crate}\` should still be on screen at ${percent}%`,
    ).toContain(crate);
  }
});

test('going into core keeps its modules and puts the other crates away', async ({ page }) => {
  await open(page);
  await goInto(page, 'core');
  expect(await wentInto(page), 'the double-click should have gone into `core` itself').toBe('core');
  const { labels } = await onScreen(page);
  for (const module of CORE_MODULES) {
    expect(labels, `after going into \`core\`, its module \`${module}\` should be on screen`).toContain(module);
  }
  for (const crate of CRATES.filter((name) => name !== 'core')) {
    expect(labels, `after going into \`core\`, the unrelated crate \`${crate}\` should be put away`).not.toContain(crate);
  }
});

test('going into a module two levels down leaves it on screen', async ({ page }) => {
  await open(page);
  await goInto(page, 'kernel');
  const seen = await page.evaluate(() => {
    const w = window as any;
    const elements = w.plySelfRender.elements as Record<string, any>;
    const target = (Object.values(elements) as any[]).find((element) => element.label === 'kernel');
    const node = document.querySelector(`[data-element-id="${target.id}"]`)!;
    const box = node.getBoundingClientRect();
    let switchedOffBy: string | undefined;
    let current: Element | null = node;
    while (current && !switchedOffBy) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden') {
        switchedOffBy = `<${current.tagName.toLowerCase()}${current.getAttribute('transform') ? ` transform="${current.getAttribute('transform')}"` : ''}>`;
      }
      current = current.parentElement;
    }
    return { width: box.width, height: box.height, switchedOffBy };
  });
  expect(
    seen.switchedOffBy,
    `going into \`kernel\` should leave it on screen, but it was switched off by ${seen.switchedOffBy}`,
  ).toBeUndefined();
  expect(seen.width, 'the box you went into should occupy real space on screen').toBeGreaterThan(0);
  expect(seen.height, 'the box you went into should occupy real space on screen').toBeGreaterThan(0);
});

test('the trail says where you are, and Escape comes back out one level', async ({ page }) => {
  await open(page);
  await goInto(page, 'kernel');
  expect(await trail(page), 'the trail should say which boxes you went through to get here').toEqual([
    'Workspace',
    'core',
    'kernel',
  ]);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(await trail(page), 'Escape should come back out to the box that holds this one').toEqual([
    'Workspace',
    'core',
  ]);
  const { labels } = await onScreen(page);
  expect(labels, 'back out in `core`, the sibling module `engines` should be on screen again').toContain('engines');
});
