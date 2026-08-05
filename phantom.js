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
    // Level 2 — all y values are multiples of 16 so each tiles to a single
    // 16px-tall block.
    // Top-center: the gate across the top of the dividing wall.
    { x: 336, y: 224, tilesW: 7, tilesH: 1, phase: 0 },
    // Step of the LEFT climb — must be timed to ascend.
    { x: 64, y: 384, tilesW: 7, tilesH: 1, phase: 0.34 },
    // Right-low: bonus ledge in the right region.
    { x: 648, y: 464, tilesW: 7, tilesH: 1, phase: 0.67 },
  ],
  2: [
    // Level 3 — see the level layout in sketch.js (LEVELS[2]). Blue in the
    // sketch / colour map = phantom platforms.
    // Bridge blinking in ABOVE the long spike crossing (spikes at y:272,
    // x:288..704) — three staggered segments; miss the timing and you fall
    // onto the spikes below.
    // Phases stagger appearance left-to-right (1 -> 2 -> 3) so the player can
    // hop across them in order. (Higher phase = appears earlier, so 2 and 3
    // carry the larger phases.)
    { x: 304, y: 224, tilesW: 6, tilesH: 1, phase: 0 }, // 1 - appears first
    { x: 448, y: 224, tilesW: 8, tilesH: 1, phase: 0.66 }, // 2 - second
    { x: 624, y: 224, tilesW: 6, tilesH: 1, phase: 0.33 }, // 3 - last
    // Right-side stretch continuing off the safe landing toward the far edge.
    { x: 832, y: 272, tilesW: 8, tilesH: 1, phase: 0.15 },
    // Lower-mid phantom — aligned with the y:448 floor, its length fits
    // exactly between the extended spawn ledge (now ends at x:272, see
    // LEVELS[2] in sketch.js) and the elevated ledge (starts at x:368).
    { x: 288, y: 448, tilesW: 6, tilesH: 1, phase: 0.4 },
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

// Live x this frame for any platform that ping-pongs horizontally
// (moveMinX/moveMaxX/moveSpeed). Static platforms (no move fields) return their
// fixed x. Shared by phantom AND regular moving platforms. Pass a specific
// `frame` to sample another moment (used to derive the per-frame drift below).
function movingX(p, frame = frameCount) {
  if (p.moveMinX === undefined || p.moveMaxX === undefined) return p.x;
  let span = p.moveMaxX - p.moveMinX;
  if (span <= 0) return p.moveMinX;
  let speed = p.moveSpeed || 1;
  let period = span * 2;
  let t = (((frame * speed) % period) + period) % period; // 0..period
  let off = t <= span ? t : period - t; // triangle wave 0..span..0
  return p.moveMinX + off;
}

// How far a moving platform shifted horizontally since last frame — used by
// applyPhysics() to carry a standing player along with it.
function platformDX(p) {
  if (p.moveMinX === undefined) return 0;
  return movingX(p, frameCount) - movingX(p, frameCount - 1);
}

// Regular platforms plus any phantoms currently visible — used by every
// collision routine. Both regular movers and visible phantoms are returned as
// copies with their live x, so collision always uses the current position.
function getActivePlatforms() {
  let raw = LEVELS[currentLevel].platforms || [];
  let platforms = raw.map((p) =>
    p.moveMinX !== undefined ? { ...p, x: movingX(p) } : p,
  );
  let phantoms = PHANTOMS[currentLevel] || [];
  let visible = phantoms
    .filter(isPhantomVisible)
    .map((ph) => ({ ...ph, x: movingX(ph) }));
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
    let px = movingX(ph); // live x (moving phantoms slide horizontally)
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
