# 5. Handwriting is recognized by shape matching in the browser

**Status:** Accepted

## Context

The lessons ask the learner to draw a kana from memory and want to say how close the drawing is
to the expected character. Handwriting services need a network call and an account, and trained
models add megabytes to an app that has to work offline.

## Decision

The drawing and each of the 46 basic kana of the script are scaled into the same 40×40 grid,
keeping their proportions. The kana are rendered from the fonts the page already ships, in a gothic
and a mincho face. The score is a symmetric chamfer distance: how far each inked cell of one image
is from the nearest ink of the other, turned into a similarity from 0 to 1. The drawing passes when
the expected kana is the best match, or within 0.05 of it, with at least 0.25. The scale reaches
zero at an average distance of 8 % of the grid, so a different kana usually scores under 50 % and
the percentage shown means something. On the page's own fonts with random rotation, shear and
stretching, the expected kana ranks first for all 92 basic kana at moderate distortion and for 91 % at
heavy distortion.

## Consequences

- Recognition runs offline in a few milliseconds and needs no training data.
- The pure parts (rasterizing, distance, ranking, judging) live in `packages/core` and are tested
  without a browser; only drawing the templates needs a canvas.
- A random scribble passes only when it happens to look most like the expected kana, about one
  time in 46; the low floor is there so clumsy but well-formed drawings are not rejected.
- It judges the shape, not the stroke order or direction, and it separates very similar pairs
  (シ/ツ, ソ/ン) less reliably. The lesson tells the learner so.
- Reporting the closest other characters turns a miss into feedback on what the drawing resembles.
