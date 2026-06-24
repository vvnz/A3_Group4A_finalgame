// ============================================================
// Lantern Darkness Mechanic
// ============================================================

// Lanterns by level (x, y, w, h)
const LANTERNS = {
  0: [
    // Level 1
    { x: 915, y: 360, w: 20, h: 45 },
    { x: 55, y: 498 - 20, w: 20, h: 45 },
  ],
  1: [], // Level 2
  2: [], // Level 3
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
