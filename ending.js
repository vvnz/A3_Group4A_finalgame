// ============================================================
// Ending Scene — ending.js
// ============================================================
// Mirrors the intro's dialogue-driven ship-deck scene (see the INTRO /
// INTRO_DIALOGUE / dialogue-system section of sketch.js), but plays out as
// a fixed-camera cutscene: no player movement, just a background, dialogue
// boxes, and one interactive beat — pressing E to grab the helm.
//
// Reuses the GENERIC helpers already in sketch.js (these aren't
// intro-specific, so there's no need to duplicate them):
//   getWrappedDialogueLines(line), currentDialogueImage(speaker),
//   wrapTextForDialogue(), parseStyledSegments(), drawStyledLine(),
//   drawInteractionPrompt(x, y), screenShakeIntensity / screenShakeTimer,
//   DIALOGUE_FRAMES_PER_CHAR, STATE, gameState, goToSplash()
//
// See the "HOOKING THIS INTO sketch.js" block at the bottom of this file
// for the exact edits needed in sketch.js + index.html.
// ============================================================

// New state, added onto the shared STATE object sketch.js already defines.
// sketch.js's draw()/keyPressed() switches just need one more case for it.
STATE.ENDING = "ending";

// ── Assets ───────────────────────────────────────────────────────────────
// No dedicated ending background — reuses imgIntroBg (loaded in sketch.js's
// preload()) so the ending scene is visually the same ship deck the intro
// opened on. Swap drawEndingScreen()'s image() call below if/when you want
// a distinct piece of art for this scene instead.
// ── Assets ───────────────────────────────────────────────────────────────
// Dedicated ending background — the ship-front art, distinct from imgIntroBg.
let imgEndingBg;

function preloadEndingAssets() {
  imgEndingBg = loadImage("assets/images/background_ending.png");
}

// ── Ending dialogue lines ───────────────────────────────────────────────
// Same { speaker, text } shape as INTRO_DIALOGUE ("PARROT" / "PLAYER" /
// "DIALOGUE"), so it reuses currentDialogueImage()/getWrappedDialogueLines()
// as-is. `shake: true` triggers the same screen-shake used for the intro's
// "*BIG SPLASH*" line.
const ENDING_DIALOGUE = [
  {
    speaker: "DIALOGUE",
    text: "The player emerges into the sun, hastily scanning their surroundings.",
  },
  {
    speaker: "DIALOGUE",
    text: "The ship groans as it scrapes past the rocks, close enough to touch.",
    shake: true,
  },
  { speaker: "PLAYER", text: "C'mon, c'mon—" },
  { speaker: "DIALOGUE", text: "You pull with all your might." },
  { speaker: "DIALOGUE", text: "*CREAK* The ship swings back on course." },
  { speaker: "PARROT", text: "*CAW* ...huh. Look at that." },
  { speaker: "PLAYER", text: "We're not dead! I did it!" },
  { speaker: "PLAYER", text: "But..." },
  { speaker: "PLAYER", text: "Where's the rest of my crew?" },
  { speaker: "PARROT", text: "..." },
  { speaker: "PLAYER", text: "What am I supposed to do now? It's just... me." },
  {
    speaker: "PARROT",
    text: "Same thing you've been doing, bucket. Keep on moving, little by little.",
  },
  {
    speaker: "PARROT",
    text: "Doesn't mean the floor stops moving. Just means you stop falling over when it does.",
  },
  {
    speaker: "DIALOGUE",
    text: "The player settles at the helm. The horizon still sways — gentler now.",
  },
  {
    speaker: "PARROT",
    text: "*ruffles feathers* ...not gonna lie though. Feeling a little off myself.",
  },
  { speaker: "PLAYER", text: "Welcome to the club." },
];

// The sequence pauses right after this line (index into ENDING_DIALOGUE,
// 0-based) and waits for an E press instead of Enter — this is the
// "-> Player grabs the helm with the E action" beat from your script.
const HELM_GRAB_AFTER_INDEX = 1; // after "...close enough to touch."

// Fixed SCREEN-space point (not world-space — this scene never moves a
// camera) where the "Press E" prompt floats. Eyeball this once the real
// background is in and move it to sit over the helm art.
const ENDING_HELM_PROMPT = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 40 };

// Persistent gentle sway that kicks in once the helm's been grabbed —
// smaller/calmer than the seasickness wobble tiers in sketch.js, so it
// reads as "still swaying, but steady on your feet" rather than lurching.
const ENDING_SWAY = { amp: 2, freq: 0.05 };

// ── Scene state ─────────────────────────────────────────────────────────
let endingDialogueActive = false;
let endingDialogueCompleted = false;
let endingDialogueIndex = 0;
let endingDialogueCharIndex = 0;
let endingDialoguePageOffset = 0;
let endingDialogueLinesPerPage = 6;
let endingDialogueFrameCounter = 0;
let waitingForHelmGrab = false;
let helmGrabbed = false;
let endingOutroAlpha = 0;

function initEndingScene() {
  endingDialogueActive = false;
  endingDialogueCompleted = false;
  endingDialogueIndex = 0;
  endingDialogueCharIndex = 0;
  endingDialoguePageOffset = 0;
  endingDialogueFrameCounter = 0;
  waitingForHelmGrab = false;
  helmGrabbed = false;
  endingOutroAlpha = 0;
  screenShakeIntensity = 0;
  screenShakeTimer = 0;
}

// Call this wherever the game currently does `gameState = STATE.WIN;`
// after the final level, to route into the ending scene instead.
function goToEnding() {
  initEndingScene();
  gameState = STATE.ENDING;
  updateSounds(); // falls into the generic BGM branch, same as PLAYING/WIN/etc.
}

function triggerEndingShake() {
  screenShakeIntensity = 8;
  screenShakeTimer = 30;
}

// ── Dialogue playback ───────────────────────────────────────────────────

function startEndingDialogue() {
  endingDialogueActive = true;
  endingDialogueIndex = 0;
  endingDialogueCharIndex = 0;
  endingDialoguePageOffset = 0;
  endingDialogueFrameCounter = 0;

  let padTop = 45;
  let padBottom = 45;
  let textAreaH = 200 * 0.95 - padTop - padBottom;
  endingDialogueLinesPerPage = floor(textAreaH / 40);

  if (ENDING_DIALOGUE[0].shake) triggerEndingShake();
}

function advanceToNextEndingLine() {
  endingDialogueIndex++;
  if (endingDialogueIndex >= ENDING_DIALOGUE.length) {
    endingDialogueActive = false;
    endingDialogueCompleted = true;
    return;
  }
  endingDialogueCharIndex = 0;
  endingDialoguePageOffset = 0;
  endingDialogueFrameCounter = 0;

  let nextLine = ENDING_DIALOGUE[endingDialogueIndex];
  if (nextLine.shake) triggerEndingShake();
}

// Handles Enter while ending dialogue is up: finish typing, page, or
// advance — except right after HELM_GRAB_AFTER_INDEX, where it stops and
// hands off to the E-press gate instead of continuing on Enter.
function advanceEndingDialogue() {
  if (!endingDialogueActive || endingDialogueIndex >= ENDING_DIALOGUE.length)
    return;

  let line = ENDING_DIALOGUE[endingDialogueIndex];
  let wrappedLines = getWrappedDialogueLines(line);

  if (endingDialogueCharIndex < line.text.length) {
    endingDialogueCharIndex = line.text.length;
    endingDialoguePageOffset = 0;
    return;
  }

  if (
    endingDialoguePageOffset + endingDialogueLinesPerPage <
    wrappedLines.length
  ) {
    endingDialoguePageOffset += endingDialogueLinesPerPage;
    return;
  }

  if (endingDialogueIndex === HELM_GRAB_AFTER_INDEX && !helmGrabbed) {
    endingDialogueActive = false;
    waitingForHelmGrab = true;
    return;
  }

  advanceToNextEndingLine();
}

// Called from keyPressed() when E comes down while waitingForHelmGrab.
function grabHelm() {
  if (!waitingForHelmGrab) return;
  waitingForHelmGrab = false;
  helmGrabbed = true;
  triggerEndingShake();
  endingDialogueActive = true;
  advanceToNextEndingLine();
}

// ── Drawing ─────────────────────────────────────────────────────────────

// Same box art / typewriter / pagination as sketch.js's drawDialogueBox(),
// just pointed at the ending's own state variables and ENDING_DIALOGUE.
function drawEndingDialogueBox() {
  if (!endingDialogueActive || endingDialogueIndex >= ENDING_DIALOGUE.length)
    return;

  let line = ENDING_DIALOGUE[endingDialogueIndex];
  let img = currentDialogueImage(line.speaker);
  let isCharacter = line.speaker === "PARROT" || line.speaker === "PLAYER";

  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let boxH = 200 * 0.95;
  let boxX = (CANVAS_WIDTH - boxW) / 2;
  let boxY = CANVAS_HEIGHT - 200;

  push();
  imageMode(CORNER);
  image(img, boxX, boxY, boxW, boxH);
  pop();

  let padLeft = isCharacter ? 220 : 75;
  let padTop = 45;
  let padBottom = 45;

  let textX = boxX + padLeft;
  let textY = boxY + padTop;

  let wrappedLines = getWrappedDialogueLines(line);

  let textAreaH = boxH - padTop - padBottom;
  let pageLineCount = min(
    wrappedLines.length - endingDialoguePageOffset,
    endingDialogueLinesPerPage,
  );
  let actualTextHeight = pageLineCount * 40;
  let vertOffset = max(0, (textAreaH - actualTextHeight) / 2);
  textY += vertOffset;

  endingDialogueFrameCounter++;
  if (endingDialogueFrameCounter >= DIALOGUE_FRAMES_PER_CHAR) {
    endingDialogueFrameCounter = 0;
    if (endingDialogueCharIndex < line.text.length) {
      endingDialogueCharIndex++;
    }
  }

  let cumChars = [];
  let cum = 0;
  for (let i = 0; i < wrappedLines.length; i++) {
    cum += wrappedLines[i].length;
    cumChars.push(cum);
  }

  let charsConsumed =
    endingDialoguePageOffset > 0 ? cumChars[endingDialoguePageOffset - 1] : 0;
  let visibleLines = [];
  for (
    let i = endingDialoguePageOffset;
    i <
    min(
      endingDialoguePageOffset + endingDialogueLinesPerPage,
      wrappedLines.length,
    );
    i++
  ) {
    let lineLen = wrappedLines[i].length;
    if (endingDialogueCharIndex <= charsConsumed) break;
    let showChars = min(endingDialogueCharIndex - charsConsumed, lineLen);
    visibleLines.push(wrappedLines[i].substring(0, showChars));
    charsConsumed += lineLen;
  }

  push();
  textFont("Pixelify Sans");
  textSize(30);
  textLeading(40);
  textAlign(LEFT, TOP);
  fill(60, 40, 20);
  noStroke();
  for (let i = 0; i < visibleLines.length; i++) {
    let segments = parseStyledSegments(visibleLines[i]);
    drawStyledLine(segments, textX, textY + i * 40);
  }
  pop();

  let fullyTyped = endingDialogueCharIndex >= line.text.length;
  let lastPage =
    endingDialoguePageOffset + endingDialogueLinesPerPage >=
    wrappedLines.length;
  if (fullyTyped && lastPage) {
    let arrowAlpha = 160 + sin(frameCount * 0.1) * 60;
    push();
    textFont("Pixelify Sans");
    textSize(14);
    fill(60, 40, 20, arrowAlpha);
    textAlign(RIGHT, BOTTOM);
    text("▼", boxX + boxW - 24, boxY + boxH - 14);
    pop();
  }
}

// "THE END" card that fades in once the last line's been read, with a
// prompt back to the title screen.
function drawEndingOutro() {
  endingOutroAlpha = min(endingOutroAlpha + 3, 220);

  push();
  noStroke();
  fill(0, endingOutroAlpha);
  rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (endingOutroAlpha > 120) {
    textAlign(CENTER, CENTER);
    textFont("Pixelify Sans");
    textSize(48);
    fill(255, endingOutroAlpha);
    text("THE END", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    textSize(18);
    text(
      "Press ENTER to return to the title screen",
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 40,
    );
  }
  pop();
}

// Main entry point — call this from draw()'s state switch, same as
// drawSplashScreen()/drawIntroScreen() are called for their states.
function drawEndingScreen() {
  // Screen shake (identical pattern to drawIntroScreen()).
  let shakeX = 0;
  let shakeY = 0;
  if (screenShakeTimer > 0) {
    shakeX = random(-screenShakeIntensity, screenShakeIntensity);
    shakeY = random(-screenShakeIntensity, screenShakeIntensity);
    screenShakeTimer--;
    if (screenShakeTimer <= 0) screenShakeIntensity = 0;
  }

  // Once the helm's grabbed, layer a small persistent sway on top of any
  // shake still playing — "still sways, gentler now" instead of snapping
  // straight to dead calm.
  let swayX = 0;
  let swayY = 0;
  if (helmGrabbed) {
    swayX = sin(frameCount * ENDING_SWAY.freq) * ENDING_SWAY.amp;
    swayY = cos(frameCount * ENDING_SWAY.freq * 0.8) * ENDING_SWAY.amp * 0.6;
  }

  push();
  translate(shakeX + swayX, shakeY + swayY);
  imageMode(CORNER);
  image(imgIntroBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pop();

  // Kick off dialogue on the first frame of this state.
  if (
    !endingDialogueActive &&
    !endingDialogueCompleted &&
    !waitingForHelmGrab
  ) {
    startEndingDialogue();
  }

  if (waitingForHelmGrab) {
    drawInteractionPrompt(ENDING_HELM_PROMPT.x, ENDING_HELM_PROMPT.y);
  }

  if (endingDialogueActive) {
    drawEndingDialogueBox();
  }

  if (endingDialogueCompleted) {
    drawEndingOutro();
  }
}

// ── Input ───────────────────────────────────────────────────────────────
// Call from keyPressed() while gameState === STATE.ENDING, before any
// other handling — returns true if it consumed the key.
function handleEndingInput(keyCode) {
  if (keyCode === 69 /* E */ && waitingForHelmGrab) {
    grabHelm();
    return true;
  }
  if (keyCode === ENTER) {
    if (endingDialogueActive) {
      advanceEndingDialogue();
      return true;
    }
    if (endingDialogueCompleted) {
      goToSplash();
      return true;
    }
  }
  return false;
}

// ============================================================
// HOOKING THIS INTO sketch.js
// ============================================================
// 1) index.html — load this file AFTER sketch.js, since ENDING_HELM_PROMPT
//    reads CANVAS_WIDTH/CANVAS_HEIGHT at parse time:
//      <script src="sketch.js"></script>
//      <script src="ending.js"></script>
//
// 2) preload() in sketch.js — add:
//      preloadEndingAssets();
//    (this is currently a no-op since the scene reuses imgIntroBg, but
//    calling it costs nothing and future-proofs against adding real
//    ending-specific assets later)
//
// 3) draw() in sketch.js — add a case alongside SPLASH/START/PLAYING/etc:
//      } else if (gameState === STATE.ENDING) {
//        drawEndingScreen();
//
// 4) keyPressed() in sketch.js — near the top, before the dialogue/level
//    bark intercepts (same spot the Y-to-skip check lives):
//      if (gameState === STATE.ENDING) {
//        if (handleEndingInput(keyCode)) return;
//      }
//
// 5) Trigger it — in draw()'s STATE.PLAYING branch, the winDelayTimer
//    block currently falls back to `gameState = STATE.WIN;` once there's
//    no next level with real platforms. Swap that line for `goToEnding();`
//    so finishing Level 3 leads into this scene instead of the placeholder
//    win screen.
// ============================================================
