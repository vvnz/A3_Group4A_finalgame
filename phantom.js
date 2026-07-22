// ============================================================
// Phantom Platform Mechanic
// ============================================================
// Platforms that blink in and out on a fixed cycle. Each phantom is solid
// (collidable) only during its visible window; while hidden it's fully gone
// — no draw, no hitbox — so the player can only land on it during the brief
// window it's flickering into existence. The fade frames give it a short
// flicker-in / flicker-out; the hitbox is active for the entire visible
// window (including the fades), so what looks "there" is always landable.

// Phantom platforms by level. Format per entry: { x, y, tilesW, tilesH, phase }
// — x/y in pixels, tilesW/tilesH in 16px tiles, phase (0..1) offsets each one
// in its cycle so staggered phantoms don't all appear at the same moment.
const PHANTOMS = {
  0: [], // Level 1
  1: [
    // Level 2
    { x: 240, y: 420, tilesW: 5, tilesH: 1, phase: 0 },
    { x: 430, y: 372, tilesW: 5, tilesH: 1, phase: 0.34 },
    { x: 610, y: 430, tilesW: 5, tilesH: 1, phase: 0.67 },
  ],
  2: [], // Level 3
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

// Regular platforms plus any phantoms currently visible — used by every
// collision routine so phantoms are solid exactly while they're on screen.
function getActivePlatforms() {
  let platforms = LEVELS[currentLevel].platforms || [];
  let phantoms = PHANTOMS[currentLevel] || [];
  return platforms.concat(phantoms.filter(isPhantomVisible));
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
    let w = ph.tilesW * TILE_SIZE;
    let h = ph.tilesH * TILE_SIZE;
    let startX = Math.floor(ph.x / TILE_SIZE) * TILE_SIZE;
    let startY = Math.floor(ph.y / TILE_SIZE) * TILE_SIZE;
    for (let tileY = startY; tileY < ph.y + h; tileY += TILE_SIZE) {
      for (let tileX = startX; tileX < ph.x + w; tileX += TILE_SIZE) {
        image(imgPlatformTile, tileX, tileY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  pop();
}
