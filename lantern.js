// ============================================================
// Lantern Darkness Mechanic
// ============================================================

// Lanterns by level (x, y = CENTER of the sprite; w, h = draw size).
// These are wall-mounted HANGING lanterns (hanging_lantern.png), so they sit
// raised off the ground rather than resting on it — same x as before, but the
// y is lifted ~40px so it reads as hanging. It stays well within the E-to-use
// reach zone (updateLantern() checks |player.y - lantern.y| < 80), so a player
// standing on the ledge/barrel below can still light it. w/h match the new
// image's ~0.63 aspect ratio so it isn't stretched.
const LANTERNS = {
  0: [
    // Level 1
    { x: 915, y: 320, w: 40, h: 64 },
    { x: 55, y: 498 - 60, w: 40, h: 64 },
  ],
  1: [
    // Level 2 — wall lanterns above the top-left platform and the right ledge.
    { x: 264, y: 248, w: 40, h: 64 }, // over the top-left platform (y304)
    { x: 872, y: 256, w: 40, h: 64 }, // hangs above the safe far-right ledge (y304)
  ],
  2: [
    // Level 3 — one partway up the staircase, one closer to the top (see
    // LEVELS[2] in sketch.js).
    { x: 240, y: 460, w: 40, h: 64 },
    { x: 360, y: 390, w: 40, h: 64 },
  ], // Level 3
};

// Whether the screen is currently dark
let darkMode = false;

// Draw all lanterns for current level
function drawLantern() {
  let lanterns = LANTERNS[currentLevel] || [];

  push();
  for (let lantern of lanterns) {
    image(imgLantern, lantern.x, lantern.y, lantern.w, lantern.h);
  }
  pop();

  // Interaction prompts
  if (!darkMode) {
    for (let lantern of lanterns) {
      if (abs(player.x - lantern.x) < 60 && abs(player.y - lantern.y) < 80) {
        drawInteractionPrompt(lantern.x, lantern.y - lantern.h / 2 - 20);
      }
    }
  }
}

// Darkness is active only while E is held down near any lantern
function updateLantern() {
  let lanterns = LANTERNS[currentLevel] || [];
  let nearAnyLantern = false;

  for (let lantern of lanterns) {
    if (abs(player.x - lantern.x) < 60 && abs(player.y - lantern.y) < 80) {
      nearAnyLantern = true;
      break;
    }
  }

  darkMode = keyIsDown(69) && nearAnyLantern;
}

// Draw full‑screen darkness overlay
function drawDarknessOverlay() {
  if (!darkMode) return;

  push();
  noStroke();
  fill(0, 200); // semi‑opaque black
  rectMode(CORNER);
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pop();
}

// Prevent movement when dark
function blockMovementIfDark() {
  if (darkMode) {
    player.isMoving = false;
    return true; // signal to sketch that movement is blocked
  }
  return false;
}
