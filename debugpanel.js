// ============================================================
// Debug Panel (Tab to toggle)
// ============================================================
// Kept entirely separate from sketch.js/lantern.js/phantom.js so it never
// conflicts with teammates editing the actual game files. This file must be
// loaded LAST (after sketch.js) — everything here either reads globals that
// sketch.js already declared (STATE, CANVAS_WIDTH, camera, player, ...) or
// wraps sketch.js's functions (draw, keyPressed, triggerFaint, ...) by
// reassigning the global identifier to a new function that calls the
// original. No existing file is edited to wire this up.

let imgDebugPanel;

let debugPanelOpen = false;
let devModeOn = false; // M — player can't die, seasickness frozen at 0
let debugZoomOut = false; // V — full-level camera view, no player following

// States the panel can be opened/used in: the splash/title screen, the
// interactive intro tutorial (ship deck + dialogue), and actual gameplay.
function debugPanelAllowed() {
  return (
    gameState === STATE.PLAYING ||
    gameState === STATE.SPLASH ||
    gameState === STATE.START
  );
}

// Loads the given level and — if the debug panel triggered this from the
// splash screen rather than from actual gameplay — also drops straight into
// STATE.PLAYING with the right music, instead of silently loading a level
// nobody can see behind the splash screen.
function debugEnterLevel(index) {
  loadLevel(index);
  if (gameState !== STATE.PLAYING) {
    gameState = STATE.PLAYING;
    updateSounds();
  }
}

// Debug overlay — panel art with a title, the control list, and a close
// hint drawn on top, in the same outlined-text style as the rest of the
// game's UI text (black stroke behind a white fill, no stroke on the fill).
function drawDebugPanel() {
  if (!imgDebugPanel || imgDebugPanel.width === 0) return; // still loading

  let panelW = 580;
  let panelH = panelW * (imgDebugPanel.height / imgDebugPanel.width);
  let panelX = (CANVAS_WIDTH - panelW) / 2;
  let panelY = (CANVAS_HEIGHT - panelH) / 2;
  let centerX = panelX + panelW / 2;

  push();
  imageMode(CORNER);
  image(imgDebugPanel, panelX, panelY, panelW, panelH);
  pop();

  // Title
  push();
  textFont("Pixelify Sans");
  textStyle(BOLD);
  textSize(34);
  textAlign(CENTER, TOP);
  strokeWeight(4);
  stroke(0);
  fill(0);
  text("DEBUG PANEL", centerX, panelY + 22);
  noStroke();
  fill(255);
  text("DEBUG PANEL", centerX, panelY + 22);
  pop();

  // Controls, two columns
  let padLeft = 40;
  let padTop = 92;
  let colGap = 290;
  let textX = panelX + padLeft;
  let textY = panelY + padTop;

  let leftLines = [
    "R  — Restart level",
    "1  — Level 1",
    "3  — Level 3",
    "Q  — Skip dialogue",
  ].join("\n");
  let rightLines = [
    "M  — Dev mode",
    "2  — Level 2",
    "V  — View full level",
  ].join("\n");

  push();
  textFont("Pixelify Sans");
  textStyle(BOLD);
  textSize(22);
  textLeading(30);
  textAlign(LEFT, TOP);

  strokeWeight(4);
  stroke(0);
  fill(0);
  text(leftLines, textX, textY);
  text(rightLines, textX + colGap, textY);

  noStroke();
  fill(255);
  text(leftLines, textX, textY);
  text(rightLines, textX + colGap, textY);
  pop();

  // Close hint
  push();
  textFont("Pixelify Sans");
  textStyle(BOLD);
  textSize(20);
  textAlign(CENTER, BOTTOM);
  strokeWeight(4);
  stroke(0);
  fill(0);
  text("Press [TAB] to close the debug panel", centerX, panelY + panelH - 22);
  noStroke();
  fill(255);
  text("Press [TAB] to close the debug panel", centerX, panelY + panelH - 22);
  pop();
}

// ── Wrapping sketch.js's functions instead of editing sketch.js ────────────

// loadImage() only works once p5 has actually bootstrapped, which happens
// after every <script> tag (including this one) has already run — so it
// can't be called at this file's top level. Wrapping preload() runs it at
// the right time without touching sketch.js's own preload().
const __originalPreload = preload;
preload = function () {
  __originalPreload();
  imgDebugPanel = loadImage("assets/images/debug_panel.png");
};

// Draw the panel on top once the real frame is fully drawn — by the time
// the original draw() returns, every branch (SPLASH/START/PLAYING/FAINTING/
// WIN/LOSE) has already popped back to plain screen-space, so this never
// has to know which branch ran or fight an active camera transform.
const __originalDraw = draw;
draw = function () {
  __originalDraw();
  if (debugPanelOpen && debugPanelAllowed()) {
    drawDebugPanel();
  }
};

// V debug toggle — fixed full-level view, no player following. Wrapping
// these two (instead of editing draw()'s camera setup in sketch.js) means
// the zoom-out only ever applies while actually in STATE.PLAYING, matching
// the original behavior.
const __originalUpdateCamera = updateCamera;
updateCamera = function (...args) {
  if (debugZoomOut && gameState === STATE.PLAYING) {
    camera.x = CANVAS_WIDTH / 2;
    camera.y = CANVAS_HEIGHT / 2;
    return;
  }
  return __originalUpdateCamera.apply(this, args);
};

const __originalBeginCameraView = beginCameraView;
beginCameraView = function (zoom, anchorX, anchorY) {
  if (debugZoomOut && gameState === STATE.PLAYING) {
    return __originalBeginCameraView.call(this, 1.0, anchorX, anchorY);
  }
  return __originalBeginCameraView.apply(this, arguments);
};

// M — dev mode: player can't die, seasickness frozen at 0.
const __originalUpdateSeasickness = updateSeasickness;
updateSeasickness = function () {
  if (devModeOn) {
    player.seasickness = 0;
    return;
  }
  return __originalUpdateSeasickness.apply(this, arguments);
};

const __originalTriggerFaint = triggerFaint;
triggerFaint = function () {
  if (devModeOn) return;
  return __originalTriggerFaint.apply(this, arguments);
};

// Debug panel key handling — checked before sketch.js's own keyPressed so
// these keys can't also trigger movement or any of that function's own
// key handling underneath.
const __originalKeyPressed = keyPressed;
keyPressed = function () {
  // Tab — toggle the panel during gameplay, the splash screen, or the
  // intro tutorial, regardless of dialogue/bark state.
  if (keyCode === 9 && debugPanelAllowed()) {
    debugPanelOpen = !debugPanelOpen;
    return false; // prevent the browser's default tab-focus-change behavior
  }

  if (debugPanelOpen && debugPanelAllowed()) {
    if (keyCode === 82) {
      // R — restart the current level fresh
      debugEnterLevel(currentLevel);
      return false;
    }
    if (keyCode === 49) {
      // 1 — jump to Level 1
      debugEnterLevel(0);
      return false;
    }
    if (keyCode === 50) {
      // 2 — jump to Level 2
      debugEnterLevel(1);
      return false;
    }
    if (keyCode === 51) {
      // 3 — jump to Level 3
      debugEnterLevel(2);
      return false;
    }
    if (keyCode === 77) {
      // M — toggle dev mode (can't die, seasickness frozen at 0)
      devModeOn = !devModeOn;
      return false;
    }
    if (keyCode === 86) {
      // V — toggle full-level zoom-out view; snap the camera back to
      // normal player-follow framing the instant it's turned off.
      debugZoomOut = !debugZoomOut;
      if (!debugZoomOut) resetCamera();
      return false;
    }
    if (keyCode === 81) {
      // Q — fully skip the intro dialogue. dialogueCompleted is set
      // unconditionally (not just when dialogueActive is already true) —
      // pressing Q during the intro's zoom/pan cinematic, before dialogue
      // has actually started, used to no-op and let it start anyway once
      // the pan settled. introPhase/introView are also snapped straight to
      // the tutorial framing so an in-flight pan can't keep running either.
      dialogueActive = false;
      dialogueCompleted = true;
      dialogueIndex = INTRO_DIALOGUE.length;
      dialogueCharIndex = 0;
      if (gameState === STATE.START) {
        introPhase = null;
        introView.anchorX = INTRO_CAMERA_ANCHOR.x;
        introView.anchorY = INTRO_CAMERA_ANCHOR.y;
        introView.zoom = INTRO_TUTORIAL_ZOOM;
        logoAlpha = 0;
        resetCamera();
      }
      return false;
    }
  }

  return __originalKeyPressed.apply(this, arguments);
};
