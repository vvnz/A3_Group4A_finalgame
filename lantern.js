// ============================================================
// Lantern Darkness Mechanic
// ============================================================

// Simple lantern placeholder (replace with image later)
const LANTERN = {
  x: 890, // adjust per level
  y: 320,
  w: 30,
  h: 60,
};

// Whether the screen is currently dark
let darkMode = false;

// Draw the lantern placeholder
function drawLantern() {
  push();
  rectMode(CENTER);
  fill(255, 220, 120);
  stroke(180, 140, 60);
  strokeWeight(3);
  rect(LANTERN.x, LANTERN.y, LANTERN.w, LANTERN.h);
  pop();

  // Interaction label
  if (!darkMode) {
    if (abs(player.x - LANTERN.x) < 60 && abs(player.y - LANTERN.y) < 80) {
      push();
      textSize(12);
      textAlign(CENTER, BOTTOM);
      strokeWeight(3);
      stroke(0);
      fill(0);
      text("Hold E to rest", LANTERN.x, LANTERN.y - LANTERN.h / 2 - 10);
      noStroke();
      fill(255);
      text("Hold E to rest", LANTERN.x, LANTERN.y - LANTERN.h / 2 - 10);
      pop();
    }
  }
}

// Darkness is active only while E is held down near the lantern
function updateLantern() {
  let near =
    abs(player.x - LANTERN.x) < 60 && abs(player.y - LANTERN.y) < 80;
  darkMode = keyIsDown(69) && near;
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
