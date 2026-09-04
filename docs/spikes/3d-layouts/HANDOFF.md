# Handoff: 3D visualization exploration

Who this is for: whoever picks this up next. It won't repeat what's in `README.md`
in this same directory — read that first, it has the actual findings. This doc is
the narrower thing a handoff needs: how we got here, what's decided, what's still
open, and where the loose threads are.

## How this started

The user asked whether making ply-vis 3D would be silly. Short answer at the time:
mostly yes, because the visual grammar (`The-Ply-Spec.md` §7.1) is a strict
one-construct-one-form mapping, and depth has no assigned meaning in it. The
research survey backed that up: every "software as a 3D city" tool from CodeCity
(2008) through ExplorViz's 2025 work uses only height-as-metric plus colour, which
is exactly the flat, dated look the user was reacting against — not because 3D
itself fails, but because nobody has tried richer material encoding (opacity,
roughness, emission) or an arrangement that isn't a city.

That led to building a standalone prototype (`index.html` in this directory) trying
four spatial arrangements of the same example model, to see whether any of them
say something a flat drawing can't. The user picked two: nested glass boxes
(containment as literal nesting) and stacked sheets (pipeline stage as depth).

## What's decided

**Don't build a 3D rendering mode in the real viewer, not yet.** This isn't a taste
call — an independent review (prompted specifically to find reasons the plan was
wrong, not to bless it) surfaced two blocking facts, verified directly against the
code rather than taken on the review's word:

1. `tools/render`'s SVG output has zero identity on any edge. Grep
   `vetting/003-trading-system.svg` for `data-element-id` on an edge element —
   there isn't one. Component boxes are self-contained groups with local
   coordinates and slice out cleanly; arrows, deny bars, and the entry line are
   root-level absolute paths with no reference back to which components they
   join. Confirmed directly: `grep -c 'data-element-id' vetting/003-trading-system.svg`
   on the edge classes returns 0.
2. `packages/ply-vis/src/protocol/envelope.ts` — the `VisualEnvelope` type — has
   no edge field at all. Only `elements` (components/fns, with `parentId`) and
   `diagnostics`. There is nothing in the protocol to lay edges out from once
   boxes move in 3D space.

Put together: you cannot reuse the existing drawing to build 3D panes (the boxes
slice, nothing else does), and you cannot recompute edges client-side either (the
data isn't sent). Either would need a protocol change before it's a rendering
question at all.

There's a third, smaller blocker worth knowing about: the JetBrains webview ships
`img-src 'none'` in its CSP (`packages/jetbrains/src/main/resources/viewer-shell.html`),
which rules out the "rasterize SVG to a canvas texture" approach outright on that
platform, independent of the edge-data problem.

## What's recommended instead

Both of these stand on their own merit, independent of whether 3D ever happens:

1. **Add edges to the visual protocol.** Give each call/flow/deny/entry line an id,
   endpoints, kind, and label, the same shape as elements already have. This alone
   fixes a real gap: today arrows can't be selected, tabbed to, or shown in the
   details pane, so the interactive viewer is less inspectable than the static SVG
   on this one point.
2. **Animate between the envelope's existing folded drawings.** `VisualEnvelope.folded`
   already carries the same document redrawn at each nesting depth, sharing element
   ids across levels. Interpolating a box's position/size between two folded levels
   gives the "descending into a component" feeling the 3D mocks were reaching for,
   without inventing any new visual channel, and it stays exactly as accessible as
   the current flat viewer (same DOM, same keyboard nav, same tooltips).

Neither of these is started. Both are sized to be a normal-scoped piece of work,
not a spike.

## What's still open / not done

- **The prototype's interaction is incomplete.** Click-to-focus only works in the
  cone layout (it rotates the cylinder). In stacked sheets, nested glass, and flat,
  clicking a box does nothing — every pane already faces the camera in those three,
  so "swing to front" has no work to do, and centring/zooming to the clicked pane
  was never implemented. If someone wants to keep exploring the prototype itself
  (as opposed to acting on the recommendation above), that's the next piece.
- **The camera framing took several iterations to get right** and is worth knowing
  about if you touch `fitView` in `index.html`: a naive bounding-sphere fit
  overshoots badly on wide/shallow scenes (was ~2.5x too far out on the cube
  layout), and a naive "fit to full canvas" fit ignores the caption panel and top
  bar, which on a narrow viewport cover a third or more of the frame. The current
  version projects the true bounding-box silhouette onto the camera's actual screen
  axes and solves iteratively for the tightest distance that clears the UI chrome.
  It's still imperfect: a 3D view that shows the whole model and one where the text
  is legible are in tension, because fitting everything on screen requires backing
  the camera off far enough that small type stops resolving. The prototype doesn't
  solve this; it just documents that a real implementation would need click-to-zoom
  as a first-class feature, not a nicety.
- **CSS 3D as a cheaper alternative was proposed but not tried.** The idea: wrap
  each top-level component's existing SVG group in a layer with `perspective` and
  `rotateX`, no library, no protocol change, no rasterizing. If someone wants to
  see whether the "tilt" reads as worthwhile at all before committing to the
  protocol change above, this is the fastest way to find out — on the order of half
  a day, fully disposable.
- **The translucency-vs-ceiling-fill conflict is flagged but not resolved.** If
  nested glass (or anything using opacity to show containment) is pursued later,
  the grey ceiling ramp (`ceiling-tested` through `ceiling-proved` in the render
  CSS) steps in increments small enough that stacking translucent panes could make
  a strong ceiling read as a weak one. No fix is proposed; this is a "don't, unless
  you solve this first" flag.

## Files

- `index.html` — the standalone prototype. No build step, open directly.
- `README.md` — the findings, written for someone deciding whether to act on this.
- This file — the session trail, for whoever picks it up.

The prototype also exists as a live artifact from the exploration session (not
checked into the repo, ask the user if they still have the link) — useful for
showing someone the four arrangements without them needing to clone and open a
file.
