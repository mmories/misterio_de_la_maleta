# Intro and collision polish

The Passat travels from the lower-right offscreen road to the upper-left stop,
using a rear three-quarter view. Julito exits the rear side passenger door,
walks around the nose, reaches the steps and waits for the CMD glass door to open.
All eleven cutscene stages support skipping. Existing dialogue is unchanged.
The road approach now has a sustained cruise and a short final braking phase.
A restrained close-up makes the rear door readable; its textured leaf rotates
about a fixed hinge, instead of blending two whole-car images. Dialogue begins
only after Julito is fully outside, standing with his suitcase and the door closed.

Assets:

- `dist/assets/passat-arrival-v2.png`: two aligned 512 × 384 cells, closed and
  rear passenger door open. Transparent PNG. Fictional provincial plate LO-1994-N.
- `dist/anthem.js`: a first instrumental adaptation based on the estimated melodic
  contour of the supplied audio, rhythmically quantized and arranged for retro
  pulse/triangle voices. Not claimed to be a note-perfect transcription.
- `dist/assets/logrones-16bit-preview.mp3`: an offline audition of the same engine
  note events. No vocals or recorded samples. Reproduce with
  `node scripts/render-anthem.mjs /tmp/logrones-16bit.wav` and MP3 encoding.
- The original recording is no longer shipped or fetched by the game. Music mute
  and scene changes stop all instrumental voices, without silencing sound effects.

The car sheet was made with the built-in image-generation tool, then sized and
matte-extracted for the game. Final design prompt:

> Preserve the grey Passat, rear three-quarter view, nose upper left, two aligned
> cells. Left cell all doors closed. Right cell front door closed and rear left
> passenger door open, hinged at the B pillar, dark back-seat aperture. Keep the
> tailgate closed. White provincial plate LO-1994-N, black letters, no EU band.
> Transparent background, pixel-art adventure style, no scenery or labels.

An additional background-extraction pass requested genuine alpha without altering
the design. Residual preview matte was removed by the game's flood-fill preparation.

Verification: real canvas snapshots of car exit and CMD opening; complete game-flow
tests including all eleven skip stages and dialogue ordering; 638 reachable floor destinations; forced
table-crossing routes blocked at 30/60/144 Hz and normal/fast walking speeds.
Browser playback and listening quality still require a human play-through.
