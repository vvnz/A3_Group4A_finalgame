// ============================================================
// Phantom Platform Mechanic
// ============================================================
// Platforms that blink in and out on a fixed cycle. Each phantom is solid
// (collidable) only during its visible window; while hidden it's fully gone
// — no draw, no hitbox — so the player can only land on it during the brief
// window it's flickering into existence. The fade frames give it a short
// flicker-in / flicker-out; the hitbox is active for the entire visible
// window (including the fades), so what looks "there" is always landable.

// Phantom platforms by level. Format per entry:
//   { x, y, tilesW, tilesH, phase }
// x/y in pixels, tilesW/tilesH in 16px tiles, phase (0..1) offsets each one in
// its flicker cycle so staggered phantoms don't all appear at once.
//
// A phantom can also MOVE horizontally by adding { moveMinX, moveMaxX, moveSpeed }
// (px, px, px/frame). It ping-pongs between the two bounds; `x` is used as the
// resting/fallback position. Movement is independent of the flicker, so a
// moving phantom both slides back and forth AND blinks in and out.
const PHANTOMS = {
  0: [], // Level 1
  1: [
    // Level 2 — see the level layout in sketch.js (LEVELS[1]).
    // E: top-center gate — the way across the top of the dividing wall.
    { x: 336, y: 264, tilesW: 7, tilesH: 1, phase: 0 },
    // F: moving ferry over the right-side spike pit. Fast enough to cross
    // within a single visible window if boarded as it appears on the left.
    {
      x: 690,
      y: 230,
      tilesW: 7,
      tilesH: 1,
      phase: 0.34,
      moveMinX: 690,
      moveMaxX: 840,
      moveSpeed: 2,
    },
    // K: low-left bonus ledge.
    { x: 24, y: 456, tilesW: 9, tilesH: 1, phase: 0.67 },
    // N: center-lower ledge in the right region.
    { x: 648, y: 466, tilesW: 7, tilesH: 1, phase: 0.5 },
  ],
  2: [
    // Level 3 — see the level layout in sketch.js (LEVELS[2]).
    // Fills the gap in the cannon tunnel's floor, right past the spawn.
    { x: 160, y: 528, tilesW: 12, tilesH: 1, phase: 0 },
    // Bridge across the spike crossing up top — the platform at y:344
    // spanning x:640-816 is the spike-topped floor beneath; miss the
    // timing here and you fall onto it. Lands flush with the safe
    // platform at x:816 in LEVELS[2].
    { x: 640, y: 264, tilesW: 3, tilesH: 1, phase: 0.2 },
    { x: 704, y: 264, tilesW: 3, tilesH: 1, phase: 0.45 },
    { x: 768, y: 264, tilesW: 3, tilesH: 1, phase: 0.7 },
  ], // Level 3
};

const PHANTOM_CYCLE_FRAMES = 210; // full period (~3.5s at 60fps)
const PHANTOM_VISIBLE_FRAMES = 90; // how long it stays solid (~1.5s)
const PHANTOM_FADE_FRAMES = 12; // flicker in/out ramp at each edge

// Where a phantom sits in its cycle this frame, offset by its per-platform
// phase so staggered phantoms don't all appear at the same moment.
function phantomCycleFrame(ph) {
  let offset = Math.floor((ph.phase || 0) * PHANTOM_CYCLE_FRAMES);
  return (frameCount + offset) % PHANTOM_CYCLE_FRAMES;
}

// True while the phantom is present — this drives BOTH rendering and
// collision, so the hitbox can never be out of sync with what's drawn.
function isPhantomVisible(ph) {
  return phantomCycleFrame(ph) < PHANTOM_VISIBLE_FRAMES;
}

// Render opacity (0..255) for the flicker-in / hold / flicker-out shape.
function phantomAlpha(ph) {
  let f = phantomCycleFrame(ph);
  if (f >= PHANTOM_VISIBLE_FRAMES) return 0;
  if (f < PHANTOM_FADE_FRAMES) return map(f, 0, PHANTOM_FADE_FRAMES, 0, 255);
  if (f > PHANTOM_VISIBLE_FRAMES - PHANTOM_FADE_FRAMES) {
    return map(
      f,
      PHANTOM_VISIBLE_FRAMES - PHANTOM_FADE_FRAMES,
      PHANTOM_VISIBLE_FRAMES,
      255,
      0,
    );
  }
  return 255;
}

// Current x of a phantom this frame. Static phantoms return their fixed x;
// moving ones ping-pong horizontally between moveMinX and moveMaxX at
// moveSpeed px/frame (default 1).
function phantomX(ph) {
  if (ph.moveMinX === undefined || ph.moveMaxX === undefined) return ph.x;
  let span = ph.moveMaxX - ph.moveMinX;
  if (span <= 0) return ph.moveMinX;
  let speed = ph.moveSpeed || 1;
  let t = (frameCount * speed) % (span * 2);
  let off = t <= span ? t : span * 2 - t; // triangle wave 0..span..0
  return ph.moveMinX + off;
}

// Regular platforms plus any phantoms currently visible — used by every
// collision routine so phantoms are solid exactly while they're on screen.
// Visible phantoms are returned as copies with their live (possibly moving)
// x, so collision always uses the platform's current position.
function getActivePlatforms() {
  let platforms = LEVELS[currentLevel].platforms || [];
  let phantoms = PHANTOMS[currentLevel] || [];
  let visible = phantoms
    .filter(isPhantomVisible)
    .map((ph) => ({ ...ph, x: phantomX(ph) }));
  return platforms.concat(visible);
}

// Draws the phantom platforms for the current level with their flicker alpha.
// Uses the same platform tile as regular platforms so they look identical.
function drawPhantoms() {
  const TILE_SIZE = 16;
  let phantoms = PHANTOMS[currentLevel] || [];
  push();
  rectMode(CORNER);
  imageMode(CORNER);
  for (let ph of phantoms) {
    let a = phantomAlpha(ph);
    if (a <= 0) continue;
    tint(255, a);
    let px = phantomX(ph); // live x (moving phantoms slide horizontally)
    let w = ph.tilesW * TILE_SIZE;
    let h = ph.tilesH * TILE_SIZE;
    let startX = Math.floor(px / TILE_SIZE) * TILE_SIZE;
    let startY = Math.floor(ph.y / TILE_SIZE) * TILE_SIZE;
    for (let tileY = startY; tileY < ph.y + h; tileY += TILE_SIZE) {
      for (let tileX = startX; tileX < px + w; tileX += TILE_SIZE) {
        image(imgPlatformTile, tileX, tileY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  pop();
}
