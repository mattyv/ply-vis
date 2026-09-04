# Spike: drawing the model in space

`index.html` is a standalone prototype. Open it in a browser; it needs no build and
no server. It draws Ply's trading-system example in four arrangements and lets you
orbit, zoom, and switch between them.

The model is transcribed by hand from `ply/vetting/003-trading-system.ply.yaml`. The
boxes are redrawn from scratch on canvas rather than read from the published drawing,
so this proves nothing about whether the real drawing can be reused. That question is
answered below, and the answer is no.

## Why it exists

The published research on drawing software in 3D is twenty years of one idea: the
city. Buildings are classes, height is a number, colour is a second number. Nothing
in that line uses the material properties a modern renderer offers, and nothing in it
has an idiom for "declared but not yet verified", which is the thing Ply most needs
to say. This spike asked whether a different spatial arrangement earns its place.

## The four arrangements

| Name | What depth means | Verdict |
|---|---|---|
| Cone tree | containment; boxes ring a cylinder, children on a smaller ring below | weakest. Boxes tangent to a cylinder turn edge-on, so two or three are readable at a time and the rest need rotating |
| Stacked sheets | how deep a component sits in the call chain; one glass sheet per top-level box | redundant. The flat drawing already orders boxes by that same rank down the page, so this moves an existing channel to a worse axis |
| Nested glass | containment, drawn literally as boxes inside boxes | strongest of the four. Nothing can hide, and nesting reads without needing a legend |
| Flat | nothing; the control | the most legible of the four, by a wide margin |

## What the spike established

**A 3D view can be framed or legible, not both.** Fitting the whole model on screen
pushes the camera far enough back that the small type inside a box stops resolving.
The prototype ends up relying on click-to-focus and zoom, which means the overview
and the readable view are two different views. That is the same conclusion the folded
drawings in the visual protocol already reached, arrived at from the other direction.

**Reusing the published drawing does not work.** Component boxes slice cleanly: each
one is a self-contained group with its own local coordinates. Everything else does
not. In the trading-system render, all 8 call arrows, 11 data flows, 3 forbidden-call
rules and the entry edge sit at the top level in absolute coordinates carrying no
identity at all. Arrows between two children of the same component are drawn at the
top level too, so a sliced box does not even contain its own internal wiring. The
moment a box moves, every routed line is meaningless, and there is nothing to redraw
them from: the visual envelope carries boxes and functions, and no edges.

**Turning the drawing into a texture is blocked on JetBrains.** That shell ships
`img-src 'none'`, and converting SVG to a canvas texture requires an image load.

**Translucency collides with the fill that carries meaning.** The grey ramp showing
how strong a component's promises are moves in steps of roughly a tenth of a shade. A
translucent pane in front of a box shifts its apparent shade by about one step. Glass
would put "how deep in the tree" onto the channel that already answers "where is this
system weak".

## What follows from it

1. **Edges belong in the visual protocol**, with their endpoints, kind and label. This
   is worth doing whether or not anything 3D is ever built: today arrows cannot be
   selected, tabbed to, or inspected, so the interactive viewer is poorer than the
   static picture on that point.
2. **Animating between fold levels** gives the sensation of descending into a box that
   the 3D mocks were reaching for, with every layout guarantee intact at both ends.
   The folded drawings already share element ids, so the boxes can be interpolated.
3. **If the tilt is still wanted after that**, a CSS 3D transform on the existing
   groups costs half a day, needs no library and no policy change, and keeps hover,
   keyboard navigation and the details pane working because the drawing stays the
   drawing. Reach for a real 3D renderer only if that is not enough, and write down
   what depth means before doing so.

## Known rough edges in the prototype

- Click-to-focus works only in the cone arrangement, where it swings the cylinder.
  In the other three, clicking a box does nothing.
- The dimming and Escape-to-zoom-out behaviour described above is not implemented.
- Boxes are redrawn from a hand-transcribed model, so they will drift from the real
  grammar as it changes.
