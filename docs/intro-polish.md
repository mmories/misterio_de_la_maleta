# Intro and collision polish

The Passat travels from the lower-right offscreen road to the upper-left stop,
using a rear three-quarter view. Julito exits the rear side passenger door,
walks around the nose, reaches the steps and waits for the CMD glass door to open.
All seven cutscene stages support skipping. Existing dialogue is unchanged.

Assets:

- `dist/assets/passat-arrival-v2.png`: two aligned 512 × 384 cells, closed and
  rear passenger door open. Transparent PNG. Fictional provincial plate LO-1994-N.
- `dist/assets/logrones-reference.mp3`: supplied 22.68-second recording, converted
  to mono MP3 with level normalization and edge fades. This is the recording,
  not a newly transcribed chiptune. Music mute and scene changes stop playback.

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
tests including all seven skip stages; 638 reachable floor destinations; forced
table-crossing routes blocked at 30/60/144 Hz and normal/fast walking speeds.
Browser playback and listening quality still require a human play-through.
