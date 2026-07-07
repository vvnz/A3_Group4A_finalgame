// ============================================================
// A3 Final Game — Group 4A
// ============================================================
// [DETAILS]
// ============================================================

// Set to false once hitbox positions look right
const DEBUG_HITBOXES = false;

// pirate_sprite.png is a 4-column x 2-row sheet (5246x3481).
// Row 0 = facing left, Row 1 = facing right (4 walk frames each).
const SPRITE = {
  frameWidth: 5246 / 4,
  frameHeight: 3481 / 2,
  numFrames: 4,
  animSpeed: 8,
  scale: 0.044,
  rows: {
    down: 1,
    up: 1,
    left: 0,
    right: 1,
  },
  offsets: {
    down: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  },
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 640;

const PHYSICS = {
  gravity: 0.8,
  jumpStrength: 12,
  maxFallSpeed: 20,
};

// ── Gameplay camera (level view only — NOT used on the intro/splash screen) ──
// Zooms in on the player and follows the area they're in, rather than
// showing the whole level at once. Horizontal position eases toward the
// player continuously; vertical position only re-targets when the player
// is standing on solid ground, so jumping doesn't drag the screen up/down.
const CAMERA = {
  zoom: 1.9,
  smoothing: 0.08, // 0..1, higher = snappier follow
};

// Slower easing used only for the one-time splash -> tutorial pan, so it
// reads as a deliberate cinematic move rather than the snappier in-game
// follow speed used once the camera has caught up to the player.
const INTRO_PAN_SMOOTHING = 0.035;

// Faster than INTRO_PAN_SMOOTHING — only used for the zoom-out-to-full-view
// leg, so that leg is quicker while the pan into the tutorial stays slow.
const INTRO_ZOOM_OUT_SMOOTHING = 0.09;

// The Enter transition is two legs: first ease out to a full, centered
// view of the whole ship (zoomOut), then ease from there into the
// tutorial framing on the player (panIn). null = not transitioning.
let introPhase = null; // null | "zoomOut" | "panIn"

let camera = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  targetY: CANVAS_HEIGHT / 2,
};

function resetCamera() {
  camera.x = player.x;
  camera.y = player.y;
  camera.targetY = player.y;
}

// anchorX/anchorY is the screen point the tracked position renders at —
// defaults to dead center (used by levels and the splash screen). Passing
// an off-center anchor (e.g. for the intro tutorial) keeps the exact same
// follow/lerp behavior, just renders the player somewhere else on screen.
function updateCamera(
  smoothing = CAMERA.smoothing,
  anchorX = CANVAS_WIDTH / 2,
  anchorY = CANVAS_HEIGHT / 2,
  zoom = CAMERA.zoom,
) {
  // Only re-target vertically when grounded, so jumps/falls don't pan the camera.
  if (player.onGround) {
    camera.targetY = player.y;
  }

  camera.x = lerp(camera.x, player.x, smoothing);
  camera.y = lerp(camera.y, camera.targetY, smoothing);

  // World units visible on each side of camera.x/y given the anchor split —
  // symmetric halves when anchor is centered, matching the old behavior.
  let leftW = anchorX / zoom;
  let rightW = (CANVAS_WIDTH - anchorX) / zoom;
  let topH = anchorY / zoom;
  let bottomH = (CANVAS_HEIGHT - anchorY) / zoom;

  camera.x = constrain(camera.x, leftW, CANVAS_WIDTH - rightW);
  camera.y = constrain(camera.y, topH, CANVAS_HEIGHT - bottomH);
}

function beginCameraView(
  zoom = CAMERA.zoom,
  anchorX = CANVAS_WIDTH / 2,
  anchorY = CANVAS_HEIGHT / 2,
) {
  // Seasickness sway — a gentle wobble layered on top of the followed
  // position at render time only, so it doesn't feed back into the
  // camera's own follow/lerp state.
  let wobbleX = 0;
  let wobbleY = 0;
  let tier = getSeasickTier();
  if (tier) {
    wobbleX = sin(frameCount * tier.wobbleFreq) * tier.wobbleAmp;
    wobbleY = cos(frameCount * tier.wobbleFreq * 0.8) * tier.wobbleAmp * 0.6;
  }

  push();
  translate(anchorX, anchorY);
  scale(zoom);
  translate(-(camera.x + wobbleX), -(camera.y + wobbleY));
}

function endCameraView() {
  pop();
}

const STATE = {
  SPLASH: "splash",
  START: "start",
  PLAYING: "playing",
  FAINTING: "fainting",
  WIN: "win",
  LOSE: "lose",
};

// door display size (original is ~2000x3261)
const DOOR_W = 55;
const DOOR_H = 90;

// spike hazard dimensions
const SPIKE_W = 16;
const SPIKE_H = 16;

// rat enemy
const RAT_SPEED = 2.4; // patrol speed in pixels per frame — adjust to taste
const RAT_SIZE = 32; // display size on canvas

const SEASICK_MAX = 100;
const SEASICK_RATE = 0.23; // gain per frame while moving
const SEASICK_DECAY = 0.005; // loss per frame while still
const FAINT_FLASHES = 6; // total flash count before restart
const FAINT_FLASH_FRAMES = 12; // frames per flash

// Seasickness effects — past these thresholds the player moves sluggishly
// and the camera sways a little, growing worse as the meter fills further.
const SEASICK_LAG_TIER1 = SEASICK_MAX / 3;
const SEASICK_LAG_TIER2 = (SEASICK_MAX * 2) / 3;
const SEASICK_LAG_TIERS = [
  {
    threshold: SEASICK_LAG_TIER2,
    speedMultiplier: 0.7,
    wobbleAmp: 3,
    wobbleFreq: 0.22,
  }, // 2/3 full
  {
    threshold: SEASICK_LAG_TIER1,
    speedMultiplier: 0.9,
    wobbleAmp: 1.5,
    wobbleFreq: 0.16,
  }, // 1/3 full
];

// Returns the active tier config for the player's current seasickness, or null.
function getSeasickTier() {
  return (
    SEASICK_LAG_TIERS.find((t) => player.seasickness >= t.threshold) || null
  );
}

// ── Screen shake state ──────────────────────────────────────────────────────
let screenShakeIntensity = 0;
let screenShakeTimer = 0;

// ── Dialogue system state ───────────────────────────────────────────────────
let dialogueActive = false;
let dialogueCompleted = false;
let dialogueIndex = 0;
let dialogueCharIndex = 0;
let dialoguePageOffset = 0;
let dialogueLinesPerPage = 6;
let dialogueFrameCounter = 0;
const DIALOGUE_FRAMES_PER_CHAR = 2;

// ── Level tutorial barks ────────────────────────────────────────────────────
// Short tips that pop up during actual gameplay. Unlike the intro's
// dialogueActive, these don't pause the world (hazards/seasickness keep
// running underneath) — but the player does have to press Enter to advance
// or dismiss them, same as the intro dialogue, and a bark can optionally
// block movement input specifically (see blocksMovement below) so the
// player isn't forced to read while also dodging something.
//
// IMPORTANT: this box uses the exact same fixed geometry as the intro's
// drawDialogueBox() (LEVEL_BARK_BOX_H, same padding/font). Do NOT grow the
// box to fit longer text -- that stretches the border art unevenly. If a
// tip doesn't fit in LEVEL_BARK_LINES_PER_PAGE lines, it paginates across
// multiple Enter-advanced pages instead.
const LEVEL_BARK_BOX_H = 200 * 0.95;
const LEVEL_BARK_LINES_PER_PAGE = 2;

let levelBark = null; // { speaker, wrappedLines, blocksMovement } or null
let levelBarkPage = 0;

function showLevelBark(speaker, text, blocksMovement = false) {
  let isChar = speaker === "PARROT" || speaker === "PLAYER";
  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let padLeft = isChar ? 220 : 75;
  let padRight = 45;
  let maxTextW = boxW - padLeft - padRight;
  levelBark = {
    speaker,
    wrappedLines: wrapTextForDialogue(text, maxTextW),
    blocksMovement,
  };
  levelBarkPage = 0;
}

// Handles Enter key while a level bark is showing: advance to the next
// page, or dismiss it entirely once the last page's been read.
function advanceLevelBark() {
  if (!levelBark) return;
  let pageCount = ceil(levelBark.wrappedLines.length / LEVEL_BARK_LINES_PER_PAGE);
  if (levelBarkPage + 1 < pageCount) {
    levelBarkPage++;
  } else {
    levelBark = null;
  }
}

// Level 1 specific: which one-shot tips have already fired.
let level1BarrelBarkShown = false;
let level1LanternBarkShown = false;
let level1HelmBarkShown = false;
let level1HasBeenSeasick = false; // gates the "get to the helm" bark so it can't fire at 0 seasickness before the player has ever actually gotten sick

function resetLevel1Tutorial() {
  level1BarrelBarkShown = false;
  level1LanternBarkShown = false;
  level1HelmBarkShown = false;
  level1HasBeenSeasick = false;
  levelBark = null;
  levelBarkPage = 0;
}

// Checks proximity/state triggers for the three Level 1 tips. Call once per
// frame while gameState === STATE.PLAYING.
function updateLevel1Tutorial() {
  if (currentLevel !== 0) return;

  if (player.seasickness >= 15) level1HasBeenSeasick = true;

  // Barrel-jumping tip — near the starter barrel stack just past spawn.
  if (!level1BarrelBarkShown) {
    let nearBarrels = abs(player.x - 268) < 120 && abs(player.y - 232) < 100;
    if (nearBarrels) {
      showLevelBark(
        "PARROT",
        "Use those feet of yours and jump over those barrels!",
      );
      level1BarrelBarkShown = true;
    }
  }

  // Lantern tip — near the first lantern the player actually reaches.
  // LANTERNS[0][0] is the correct one: the existing "barrel under second
  // lantern" comment on the LEVELS[0] platform list already establishes
  // LANTERNS[0][1] as the SECOND lantern, so [0] is the first. Blocks
  // movement since it's a longer read the player needs to actually stop for.
  if (!level1LanternBarkShown) {
    let firstLantern = LANTERNS[0][0];
    let nearLantern =
      abs(player.x - firstLantern.x) < 100 &&
      abs(player.y - firstLantern.y) < 120;
    if (nearLantern) {
      showLevelBark(
        "PARROT",
        "You're new to this shindig, so you're gonna keep getting more seasick. Get to the lanterns to take a break. The dark makes you feel less nauseous.",
        true,
      );
      level1LanternBarkShown = true;
    }
  }

  // "Get to the helm" tip — once seasickness has fully recovered at a lantern.
  if (
    level1LanternBarkShown &&
    !level1HelmBarkShown &&
    level1HasBeenSeasick &&
    darkMode &&
    player.seasickness <= 0.5
  ) {
    showLevelBark(
      "PARROT",
      "No point staying there too long though. Get to the helm!",
    );
    level1HelmBarkShown = true;
  }
}

// Draws the active level bark, if any — same box art as the intro dialogue,
// but sized to fit its (untruncated, un-paginated) text and floated a little
// above the very bottom edge so it doesn't sit flush against the screen.
function drawLevelBark() {
  if (!levelBark) return;

  let isChar = levelBark.speaker === "PARROT" || levelBark.speaker === "PLAYER";
  let img = currentDialogueImage(levelBark.speaker);

  // Same fixed box geometry as the intro's drawDialogueBox() — see the
  // comment above showLevelBark() for why this doesn't grow to fit text.
  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let boxH = LEVEL_BARK_BOX_H;
  let boxX = (CANVAS_WIDTH - boxW) / 2;
  let boxY = CANVAS_HEIGHT - 200;
  let padLeft = isChar ? 220 : 75;
  let padTop = 45;

  push();
  imageMode(CORNER);
  image(img, boxX, boxY, boxW, boxH);
  pop();

  // Explicitly set textAlign here rather than relying on whatever the
  // ambient state happens to be — drawHUD() (called right before this)
  // leaves it at (RIGHT, TOP) for its seasickness label and never resets
  // it, which previously made this text anchor from the wrong edge.
  push();
  textFont("Pixelify Sans");
  textSize(30);
  textLeading(40);
  textAlign(LEFT, TOP);
  fill(60, 40, 20);
  noStroke();
  let start = levelBarkPage * LEVEL_BARK_LINES_PER_PAGE;
  let end = min(
    start + LEVEL_BARK_LINES_PER_PAGE,
    levelBark.wrappedLines.length,
  );
  for (let i = start; i < end; i++) {
    text(
      levelBark.wrappedLines[i],
      boxX + padLeft,
      boxY + padTop + (i - start) * 40,
    );
  }
  pop();

  // Page counter instead of a "hit enter" prompt, since these auto-advance —
  // only shown when there's actually more than one page.
  let pageCount = ceil(
    levelBark.wrappedLines.length / LEVEL_BARK_LINES_PER_PAGE,
  );
  if (pageCount > 1) {
    push();
    textFont("Pixelify Sans");
    textSize(14);
    textAlign(RIGHT, BOTTOM);
    fill(60, 40, 20, 160);
    noStroke();
    text(
      `${levelBarkPage + 1}/${pageCount}`,
      boxX + boxW - 24,
      boxY + boxH - 14,
    );
    pop();
  }
}

// ── Intro / start-screen ship scene ────────────────────────────────────────
const INTRO = {
  // The deck platform the player stands on (tiled with platform_tile.png)
  // x: horizontal position, y: vertical position
  // tilesW: width in tiles, tilesH: height in tiles (each tile is 16px)
  platform: { x: 480, y: 500, tilesW: 16, tilesH: 1 },
  platform2: { x: 565, y: CANVAS_HEIGHT - 16, tilesW: 26, tilesH: 1 }, // right half, bottom

  // Outer-shell walls — stepped rectangles tracing the curved hull left edge.
  walls: [
    { x: 450, y: 312, w: 500, h: 52 }, // DECK
    { x: 460, y: 520, w: 100, h: 100 }, // VERTICAL WALL OML
    { x: 880, y: 330, w: 100, h: 140 }, //BOX ON THE RIGHT
    { x: 440, y: 300, w: 40, h: 300 },
  ],

  // Decorations — positioned on the deck inside the hull boundary
  hammock: { x: 500, y: 386, w: 200, h: 120 },

  // Door at the bottom-right; opens automatically once the player reaches it
  door: { x: CANVAS_WIDTH - DOOR_W - 8, y: CANVAS_HEIGHT - DOOR_H - 8 },

  // Player spawns just above the deck
  playerStart: { x: 490, y: 430 },
};

// ── Intro dialogue lines ────────────────────────────────────────────────────
const INTRO_DIALOGUE = [
  { speaker: "PARROT", text: "*SQUAWK* Quiet morning… Hm…" },
  {
    speaker: "PLAYER",
    text: "Good... morning... ugh... is that singing I hear?",
  },
  {
    speaker: "DIALOGUE",
    text: "♪ Harmonious singing echoes from the stern of the Swift Claudia. It feels like you're being drawn in... are those sirens?",
  },
  { speaker: "DIALOGUE", text: "*THUMP THUMP*" },
  { speaker: "DIALOGUE", text: "*BIG SPLASH*" },
  { speaker: "PLAYER", text: "What was that??" },
  {
    speaker: "PARROT",
    text: "*CAW CAW* Sirens spotted at starboard — crew gone overboard!",
  },
  { speaker: "PLAYER", text: "Wait... everyone?" },
  { speaker: "PLAYER", text: "Then who's at the helm??" },
  {
    speaker: "PARROT",
    text: "No one, you empty bucket! Time to steer this beauty home before we feed the fish!",
  },
  {
    speaker: "PARROT",
    text: "Use A and D to move, and Space to jump.",
  },
  { speaker: "PARROT", text: "Time to earn your sea legs, swashbuckler!" },
  { speaker: "PLAYER", text: "Argh, but I'm gonna get so seasick!" },
];

// Fixed camera framing for the splash/title screen — the upper part of the
// ship (trees + railing). The tutorial framing isn't a separate constant:
// it's just wherever the player spawns, since updateCamera() eases toward
// the player once STATE.START begins, producing the pan.
const INTRO_SPLASH_VIEW = { x: 270, y: 180 };
const SPLASH_ZOOM = 1.6; // independent of CAMERA.zoom, used for levels/tutorial

// Screen anchor for the tutorial phase — the player renders toward the
// upper-left instead of dead center, while still being followed exactly
// the same way (see updateCamera()'s anchorX/anchorY params).
const INTRO_CAMERA_ANCHOR = { x: CANVAS_WIDTH * 0.32, y: CANVAS_HEIGHT * 0.32 };

// Independent of CAMERA.zoom (used for actual levels). The deck sits close
// to the world's bottom edge, so at CAMERA.zoom the camera has to stay
// pinned there to keep the player below the anchor point, which caps the
// view well short of the railing above. A lower zoom here shows more of
// the world vertically, revealing the railing/sky above the deck.
const INTRO_TUTORIAL_ZOOM = 1.4;

// The intro world is drawn at exactly the canvas's own dimensions, so a
// zoom of 1 with a centered camera/anchor shows the entire background.
const INTRO_FULL_VIEW_ZOOM = 1;
const INTRO_FULL_VIEW = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

// The anchor/zoom actually used to render the intro each frame. During the
// pan these ease from the splash's composition (centered, SPLASH_ZOOM)
// toward the tutorial's (INTRO_CAMERA_ANCHOR, CAMERA.zoom) at the same rate
// as the position lerp, so nothing about the framing snaps instantly.
let introView = {
  anchorX: CANVAS_WIDTH / 2,
  anchorY: CANVAS_HEIGHT / 2,
  zoom: SPLASH_ZOOM,
};

// Logo position — shared between the splash screen and its fade-out once
// the tutorial begins, so both draw it in exactly the same spot.
const INTRO_LOGO = {
  x: CANVAS_WIDTH / 2 - 400,
  y: CANVAS_HEIGHT / 2 - 260,
  w: 600,
};
let logoAlpha = 255;

const LEVELS = [
  {
    name: "LEVEL 1 — LEARNING THE ROPES",
    background: "assets/images/lvl1background.png",
    backgroundColor: [150, 75, 0],
    start: { x: 40, y: 200 },
    platforms: [
      // Format: { x, y, tilesW, tilesH } - each tile is 16x16 pixels
      { x: 0, y: 304, tilesW: 27, tilesH: 1 },
      { x: 416, y: 304, tilesW: 1, tilesH: 4 }, //vertical wall 1.1
      { x: 480, y: 240, tilesW: 12, tilesH: 1 }, //floating platform (jump platform centered above dip)
      { x: 432, y: 352, tilesW: 18, tilesH: 1 }, //spike platform (dip floor)
      { x: 704, y: 304, tilesW: 1, tilesH: 4 }, //vertical wall 1.2
      { x: 704, y: 304, tilesW: 8, tilesH: 1 }, //after spike platform
      { x: 320, y: 432, tilesW: 7, tilesH: 1 }, //floating staircase 2
      { x: 464, y: 496, tilesW: 6, tilesH: 1 }, //floating staircase 1
      { x: 848, y: 400, tilesW: 1, tilesH: 9 }, //vertical wall 3
      { x: 848, y: 384, tilesW: 7, tilesH: 1 }, //top of vertical wall 3
      { x: 0, y: 544, tilesW: 17, tilesH: 50 }, // big block on the left
      { x: 576, y: 528, tilesW: 18, tilesH: 1 }, //floating staircase 1
      { x: 0, y: CANVAS_HEIGHT - 16, tilesW: 60, tilesH: 1 },
      {
        x: 480,
        y: CANVAS_HEIGHT - 16 - 48,
        tilesW: 3,
        tilesH: 3,
        barrel: true,
      }, //barrel (uses barrel.png image)
      {
        x: 30,
        y: 498,
        tilesW: 3,
        tilesH: 3,
        barrel: true,
      }, //barrel under second lantern
      { x: 244, y: 256, tilesW: 3, tilesH: 3, barrel: true }, //starter barrels: bottom-left
      { x: 292, y: 256, tilesW: 3, tilesH: 3, barrel: true }, //starter barrels: bottom-right
      { x: 268, y: 208, tilesW: 3, tilesH: 3, barrel: true }, //starter barrels: stacked middle
    ],
    spikes: [{ x: 432, y: 352, tilesW: 17 }],
    rat: { minX: 300, maxX: 455 },
    spawnDoor: { x: 13, y: 227 },
    exitDoor: { x: CANVAS_WIDTH - DOOR_W - 20, y: CANVAS_HEIGHT - DOOR_H - 3 },
  },
  {
    name: "Level 2 — Pressure",
    background: null,
    backgroundColor: [40, 55, 80],
    start: { x: 100, y: 320 },
    platforms: [],
  },
  {
    name: "Level 3 — Mastery",
    background: null,
    backgroundColor: [25, 30, 45],
    start: { x: 100, y: 320 },
    platforms: [],
  },
];

let gameState = STATE.START;
let currentLevel = 0;

let player = {
  x: 0,
  y: 0,
  vy: 0,
  speed: 3,
  onGround: false,
  currentFrame: 0,
  frameTimer: 0,
  direction: "right",
  isMoving: false,
  hw: 18,
  hh: 28,
  seasickness: 0,
  faintTimer: 0,
  faintFlash: 0,
  visible: true,
};

let rat = { x: 0, dir: 1, active: false };

let characterSheet;
let levelImages = [];
let imgIntroBg;
let imgLogo;
let imgRat;
let imgBarrel;
let imgDoorClosed;
let imgDoorOpen;
let imgHammock;
let imgLantern;
let imgPlatformTile;
let imgDialogueGeneric;
let imgDialogueParrot;
let imgDialoguePirate;
let imgSign;
let soundBGM;
let soundSeagulls;
let exitDoorOpen = false;
let introDoorOpen = false;
let winDelayTimer = 0;
let introDelayTimer = 0;
const WIN_DELAY_FRAMES = 90; // 2 seconds at 60fps
const EXIT_DELAY_FRAMES = 4; // near-instant: show the open door for a blink, then progress

function preload() {
  characterSheet = loadImage("assets/images/pirate_sprite.png");
  imgIntroBg = loadImage("assets/images/backround_intro.PNG");
  imgLogo = loadImage("assets/images/title.png");
  imgRat = loadImage("assets/images/rat.png");
  imgBarrel = loadImage("assets/images/barrel.png");
  imgDoorClosed = loadImage("assets/images/doorclose.png");
  imgDoorOpen = loadImage("assets/images/dooropen.png");
  imgHammock = loadImage("assets/images/hammock.png");
  imgLantern = loadImage("assets/images/lantern.png");
  imgPlatformTile = loadImage("assets/images/platform_tile.png");
  imgDialogueGeneric = loadImage("assets/images/dialogue.png");
  imgDialogueParrot = loadImage("assets/images/parrot_dialogue.png");
  imgDialoguePirate = loadImage("assets/images/pirate_dialogue.png");
  imgSign = loadImage("assets/images/sign.png");
  soundBGM = loadSound("assets/sounds/bgm.mp3");
  soundSeagulls = loadSound("assets/sounds/seagulls.mp3");

  for (let i = 0; i < LEVELS.length; i++) {
    if (LEVELS[i].background) {
      levelImages[i] = loadImage(LEVELS[i].background);
    } else {
      levelImages[i] = null;
    }
  }
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  imageMode(CENTER);
  textFont("Pixelify Sans");
  goToSplash();
}

// ── Sound management ───────────────────────────────────────────────────────
// Call this whenever the game state changes. Stops the previous track and
// starts the right one for the new state. Only plays the seagulls during
// the splash / title screen; everywhere else (START, PLAYING, FAINTING,
// WIN, LOSE) the BGM loop runs uninterrupted.
function updateSounds() {
  if (soundSeagulls?.isPlaying()) soundSeagulls.stop();
  if (soundBGM?.isPlaying()) soundBGM.stop();

  if (gameState === STATE.START) {
    // Seagulls play during the intro / tutorial while the player is
    // walking around on the ship deck.
    soundSeagulls.loop();
  } else if (gameState !== STATE.SPLASH) {
    // Everything non-splash / non-start gets BGM: PLAYING, FAINTING,
    // WIN, LOSE all keep the same music looping.
    soundBGM.loop();
  }
  // SPLASH — silence, no conflict with browser autoplay.
}

// ── Intro scene helpers ─────────────────────────────────────────────────────

function initIntroPlayer() {
  player.x = INTRO.playerStart.x;
  player.y = INTRO.playerStart.y;
  player.vy = 0;
  player.onGround = false;
  player.direction = "right";
  player.currentFrame = 0;
  player.frameTimer = 0;
  player.isMoving = false;
  player.seasickness = 0;
  player.faintTimer = 0;
  player.faintFlash = 0;
  player.visible = true;
  introDoorOpen = false;
  introDelayTimer = 0;
}

// Resets to the very beginning: the fixed splash/title framing.
function goToSplash() {
  initIntroPlayer();
  gameState = STATE.SPLASH;
  updateSounds();
  camera.x = INTRO_SPLASH_VIEW.x;
  camera.y = INTRO_SPLASH_VIEW.y;
  introPhase = null;
  introView.anchorX = CANVAS_WIDTH / 2;
  introView.anchorY = CANVAS_HEIGHT / 2;
  introView.zoom = SPLASH_ZOOM;
  logoAlpha = 255;
  // Reset dialogue state so it replays on a fresh start
  dialogueActive = false;
  dialogueCompleted = false;
  dialogueIndex = 0;
  dialogueCharIndex = 0;
  dialoguePageOffset = 0;
  dialogueFrameCounter = 0;
  screenShakeIntensity = 0;
  screenShakeTimer = 0;
}

function getIntroColliders() {
  return [INTRO.platform, INTRO.platform2, ...INTRO.walls];
}

function resolveIntroCollisions() {
  const TILE_SIZE = 16;
  let colliders = getIntroColliders();
  for (let p of colliders) {
    let h = p.tilesH ? p.tilesH * TILE_SIZE : p.h;
    let w = p.tilesW ? p.tilesW * TILE_SIZE : p.w;

    let withinY = player.y + player.hh > p.y && player.y - player.hh < p.y + h;
    if (!withinY) continue;

    let pl = player.x - player.hw;
    let pr = player.x + player.hw;
    let bl = p.x;
    let br = p.x + w;

    if (pr > bl && pl < br) {
      let pushLeft = pr - bl;
      let pushRight = br - pl;
      if (pushLeft < pushRight) {
        player.x -= pushLeft;
      } else {
        player.x += pushRight;
      }
    }
  }
}

function applyIntroPhysics() {
  const TILE_SIZE = 16;
  player.vy += PHYSICS.gravity;
  player.vy = constrain(player.vy, -PHYSICS.jumpStrength, PHYSICS.maxFallSpeed);

  let prevBottom = player.y + player.hh;
  let prevTop = player.y - player.hh;
  player.y += player.vy;
  player.onGround = false;

  let colliders = getIntroColliders();
  for (let p of colliders) {
    let h = p.tilesH ? p.tilesH * TILE_SIZE : p.h;
    let w = p.tilesW ? p.tilesW * TILE_SIZE : p.w;

    let withinX = player.x + player.hw > p.x && player.x - player.hw < p.x + w;
    if (!withinX) continue;

    let top = p.y;
    let bottom = p.y + h;

    if (player.vy >= 0 && prevBottom <= top && player.y + player.hh >= top) {
      player.y = top - player.hh;
      player.vy = 0;
      player.onGround = true;
    } else if (
      player.vy < 0 &&
      prevTop >= bottom &&
      player.y - player.hh <= bottom
    ) {
      player.y = bottom + player.hh;
      player.vy = 0;
    }
  }

  // Canvas floor
  let groundY = CANVAS_HEIGHT - player.hh;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }
}

// Everything about the ship-deck world that's shared between the fixed
// splash framing and the interactive tutorial framing — both are just the
// same background/decorations/door viewed through a different camera shot.
function drawIntroWorld() {
  push();
  imageMode(CORNER);
  image(imgIntroBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pop();

  push();
  imageMode(CORNER);
  image(
    imgHammock,
    INTRO.hammock.x,
    INTRO.hammock.y,
    INTRO.hammock.w,
    INTRO.hammock.h,
  );
  pop();

  // Platforms (always visible)
  push();
  rectMode(CORNER);
  imageMode(CORNER);
  const TILE_SIZE = 16;

  // Draw both platforms
  for (let platform of [INTRO.platform, INTRO.platform2]) {
    let dpW = platform.tilesW * TILE_SIZE;
    let dpH = platform.tilesH * TILE_SIZE;
    let startX = Math.floor(platform.x / TILE_SIZE) * TILE_SIZE;
    let startY = Math.floor(platform.y / TILE_SIZE) * TILE_SIZE;
    for (let tileY = startY; tileY < platform.y + dpH; tileY += TILE_SIZE) {
      for (let tileX = startX; tileX < platform.x + dpW; tileX += TILE_SIZE) {
        image(imgPlatformTile, tileX, tileY, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  pop();

  // Debug: hull outer-shell wall outlines only (no player box)
  if (DEBUG_HITBOXES) {
    push();
    rectMode(CORNER);
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    // platform outlines
    let dp1 = INTRO.platform;
    let dp1W = dp1.tilesW * TILE_SIZE;
    let dp1H = dp1.tilesH * TILE_SIZE;
    rect(dp1.x, dp1.y, dp1W, dp1H);

    let dp2 = INTRO.platform2;
    let dp2W = dp2.tilesW * TILE_SIZE;
    let dp2H = dp2.tilesH * TILE_SIZE;
    rect(dp2.x, dp2.y, dp2W, dp2H);
    // hull walls
    for (let w of INTRO.walls) {
      rect(w.x, w.y, w.w, w.h);
    }
    pop();
  }

  // Door — opens automatically once the player overlaps it
  push();
  imageMode(CORNER);
  image(
    introDoorOpen ? imgDoorOpen : imgDoorClosed,
    INTRO.door.x,
    INTRO.door.y,
    DOOR_W,
    DOOR_H,
  );
  pop();
}

// Title card — a fixed zoomed-in shot of the upper part of the ship (same
// zoom the levels use), with the logo and prompt overlaid on top, unzoomed.
function drawSplashScreen() {
  // Clamped the same way updateCamera() clamps the level camera, so this
  // fixed framing stays within the world bounds regardless of zoom.
  let halfW = CANVAS_WIDTH / SPLASH_ZOOM / 2;
  let halfH = CANVAS_HEIGHT / SPLASH_ZOOM / 2;
  camera.x = constrain(INTRO_SPLASH_VIEW.x, halfW, CANVAS_WIDTH - halfW);
  camera.y = constrain(INTRO_SPLASH_VIEW.y, halfH, CANVAS_HEIGHT - halfH);

  beginCameraView(SPLASH_ZOOM);
  drawIntroWorld();

  // Let the player fall and settle onto the deck during the splash screen
  // (no input yet) so it's already standing there once the pan starts,
  // instead of popping in or still visibly falling mid-pan.
  resolveIntroCollisions();
  applyIntroPhysics();
  clampToBounds();
  animateSprite();
  drawCharacter();

  endCameraView();

  push();
  imageMode(CORNER);
  let logoH = INTRO_LOGO.w * (imgLogo.height / imgLogo.width);
  image(imgLogo, INTRO_LOGO.x, INTRO_LOGO.y, INTRO_LOGO.w, logoH);
  pop();

  // Wooden sign behind the prompt, centered on the same point as the text.
  push();
  imageMode(CENTER);
  let signW = 600;
  let signH = signW * (imgSign.height / imgSign.width);
  image(imgSign, CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 300, signW, signH);
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(34);
  strokeWeight(6);
  stroke(0);
  fill(255);
  text("PRESS 'ENTER' TO START", CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 300);
  pop();
}

// ── Dialogue system ─────────────────────────────────────────────────────────

// Returns the correct dialogue box image for a given speaker.
function currentDialogueImage(speaker) {
  if (speaker === "PARROT") return imgDialogueParrot;
  if (speaker === "PLAYER") return imgDialoguePirate;
  return imgDialogueGeneric;
}

// Wraps text into lines that fit within maxWidth using the dialogue font.
function wrapTextForDialogue(txt, maxWidth) {
  push();
  textFont("Pixelify Sans");
  textSize(30);
  let words = txt.split(" ");
  let lines = [];
  let currentLine = "";

  for (let word of words) {
    let testLine = currentLine ? currentLine + " " + word : word;
    if (textWidth(testLine) > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.length > 0) lines.push(currentLine);
  pop();
  return lines;
}

// Starts a new dialogue sequence with the given lines.
function startDialogue(lines) {
  dialogueActive = true;
  dialogueIndex = 0;
  dialogueCharIndex = 0;
  dialoguePageOffset = 0;
  dialogueFrameCounter = 0;

  let line = lines[0];
  let padTop = 45;
  let padBottom = 45;
  let textAreaH = 200 * 0.95 - padTop - padBottom;
  dialogueLinesPerPage = floor(textAreaH / 40);

  // Trigger screen shake for the BIG SPLASH line if it's the first line
  if (line.text === "*BIG SPLASH*") {
    screenShakeIntensity = 8;
    screenShakeTimer = 30;
  }
}

// Word-wraps a dialogue line the same way it's rendered, so callers that
// need to know the line count (paging in advanceDialogue(), centering in
// drawDialogueBox()) can never disagree with what's actually drawn.
function getWrappedDialogueLines(line) {
  let isChar = line.speaker === "PARROT" || line.speaker === "PLAYER";
  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let padLeft = isChar ? 220 : 75;
  let padRight = 45;
  let maxTextW = boxW - padLeft - padRight;
  return wrapTextForDialogue(line.text, maxTextW);
}

// Handles Enter key during dialogue: finish typing or advance to next line.
function advanceDialogue() {
  if (!dialogueActive || dialogueIndex >= INTRO_DIALOGUE.length) return;

  let line = INTRO_DIALOGUE[dialogueIndex];
  let wrappedLines = getWrappedDialogueLines(line);

  if (dialogueCharIndex < line.text.length) {
    // Still typing — finish instantly
    dialogueCharIndex = line.text.length;
    dialoguePageOffset = 0;
  } else {
    // Fully typed — check for more pages
    if (dialoguePageOffset + dialogueLinesPerPage < wrappedLines.length) {
      dialoguePageOffset += dialogueLinesPerPage;
    } else {
      // Move to next dialogue line
      dialogueIndex++;
      if (dialogueIndex >= INTRO_DIALOGUE.length) {
        // Dialogue finished
        dialogueActive = false;
        dialogueCompleted = true;
        return;
      }
      dialogueCharIndex = 0;
      dialoguePageOffset = 0;
      dialogueFrameCounter = 0;

      // Check for special effects on the new line
      let nextLine = INTRO_DIALOGUE[dialogueIndex];
      if (nextLine.text === "*BIG SPLASH*") {
        screenShakeIntensity = 8;
        screenShakeTimer = 30;
      }
    }
  }
}

// Draws the dialogue box in screen-space at the bottom of the screen.
function drawDialogueBox() {
  if (!dialogueActive || dialogueIndex >= INTRO_DIALOGUE.length) return;

  let line = INTRO_DIALOGUE[dialogueIndex];
  let img = currentDialogueImage(line.speaker);
  let isCharacter = line.speaker === "PARROT" || line.speaker === "PLAYER";

  // Box dimensions (scaled to 0.95, top edge pinned)
  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let boxH = 200 * 0.95;
  let boxX = (CANVAS_WIDTH - boxW) / 2;
  let boxY = CANVAS_HEIGHT - 200; // keep original top Y

  // Draw background image
  push();
  imageMode(CORNER);
  image(img, boxX, boxY, boxW, boxH);
  pop();

  // Text area padding — leave breathing room for centering
  let padLeft = isCharacter ? 220 : 75;
  let padTop = 45;
  let padBottom = 45;

  // Horizontally center: draw at the midpoint of the text area
  let textX = boxX + padLeft;
  let textY = boxY + padTop; // vertOffset added after wrapping below

  // Wrap text into visual lines — same calculation advanceDialogue() uses
  // for paging, so the two can never disagree about the line count.
  let wrappedLines = getWrappedDialogueLines(line);

  // Vertically center based on how many lines fit on this page
  let textAreaH = boxH - padTop - padBottom;
  let pageLineCount = min(
    wrappedLines.length - dialoguePageOffset,
    dialogueLinesPerPage,
  );
  let actualTextHeight = pageLineCount * 40;
  let vertOffset = max(0, (textAreaH - actualTextHeight) / 2);
  textY += vertOffset;

  // Typewriter effect — advance one character every ~2 frames
  dialogueFrameCounter++;
  if (dialogueFrameCounter >= DIALOGUE_FRAMES_PER_CHAR) {
    dialogueFrameCounter = 0;
    if (dialogueCharIndex < line.text.length) {
      dialogueCharIndex++;
    }
  }

  // Build cumulative character counts per wrapped line
  let cumChars = [];
  let cum = 0;
  for (let i = 0; i < wrappedLines.length; i++) {
    cum += wrappedLines[i].length;
    cumChars.push(cum);
  }

  // Determine which lines to show on the current page,
  // clipped by the typewriter character count.
  let charsConsumed =
    dialoguePageOffset > 0 ? cumChars[dialoguePageOffset - 1] : 0;
  let visibleLines = [];
  for (
    let i = dialoguePageOffset;
    i < min(dialoguePageOffset + dialogueLinesPerPage, wrappedLines.length);
    i++
  ) {
    let lineLen = wrappedLines[i].length;
    if (dialogueCharIndex <= charsConsumed) break;
    let showChars = min(dialogueCharIndex - charsConsumed, lineLen);
    visibleLines.push(wrappedLines[i].substring(0, showChars));
    charsConsumed += lineLen;
  }

  // Text shake for "Then who's at the helm??"
  let shakeX = 0;
  let shakeY = 0;
  if (
    line.text === "Then who's at the helm??" &&
    dialogueCharIndex >= line.text.length
  ) {
    shakeX = random(-1.5, 1.5);
    shakeY = random(-1.5, 1.5);
  }

  // Draw text — left-aligned, block is vertically/horizontally centered.
  // textAlign is set explicitly (not left to ambient state) — see the
  // comment in drawLevelBark() for why that matters.
  push();
  textFont("Pixelify Sans");
  textSize(30);
  textLeading(40);
  textAlign(LEFT, TOP);
  fill(60, 40, 20);
  noStroke();
  for (let i = 0; i < visibleLines.length; i++) {
    text(visibleLines[i], textX + shakeX, textY + i * 40 + shakeY);
  }
  pop();

  // Advance indicator when fully typed and on the last page
  let fullyTyped = dialogueCharIndex >= line.text.length;
  let lastPage =
    dialoguePageOffset + dialogueLinesPerPage >= wrappedLines.length;
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

// Interactive ship-deck tutorial — camera starts wherever the splash shot
// left it and eases toward the player via the normal updateCamera() lerp,
// which reads as a pan into this area and then tracks the player exactly
// like a level would.
function drawIntroScreen() {
  if (introPhase === "zoomOut") {
    // Leg 1: ease out to a full, centered view of the whole ship. Camera
    // position, anchor, and zoom all ease toward the same fixed target so
    // the framing slides as one, not player-tracking yet.
    camera.x = lerp(camera.x, INTRO_FULL_VIEW.x, INTRO_ZOOM_OUT_SMOOTHING);
    camera.y = lerp(camera.y, INTRO_FULL_VIEW.y, INTRO_ZOOM_OUT_SMOOTHING);
    introView.anchorX = lerp(
      introView.anchorX,
      INTRO_FULL_VIEW.x,
      INTRO_ZOOM_OUT_SMOOTHING,
    );
    introView.anchorY = lerp(
      introView.anchorY,
      INTRO_FULL_VIEW.y,
      INTRO_ZOOM_OUT_SMOOTHING,
    );
    introView.zoom = lerp(
      introView.zoom,
      INTRO_FULL_VIEW_ZOOM,
      INTRO_ZOOM_OUT_SMOOTHING,
    );
    logoAlpha = lerp(logoAlpha, 0, INTRO_ZOOM_OUT_SMOOTHING);
    if (logoAlpha < 1) logoAlpha = 0;

    if (
      abs(camera.x - INTRO_FULL_VIEW.x) < 1 &&
      abs(camera.y - INTRO_FULL_VIEW.y) < 1
    ) {
      // Leg 2 begins next frame: ease from the full view into the tutorial.
      introPhase = "panIn";
      camera.targetY = player.y;
      logoAlpha = 0;
    }
  } else if (introPhase === "panIn") {
    // Ease the anchor/zoom toward the tutorial's composition at the same
    // rate as the position lerp, so the framing itself slides instead of
    // snapping the instant the pan starts.
    introView.anchorX = lerp(
      introView.anchorX,
      INTRO_CAMERA_ANCHOR.x,
      INTRO_PAN_SMOOTHING,
    );
    introView.anchorY = lerp(
      introView.anchorY,
      INTRO_CAMERA_ANCHOR.y,
      INTRO_PAN_SMOOTHING,
    );
    introView.zoom = lerp(
      introView.zoom,
      INTRO_TUTORIAL_ZOOM,
      INTRO_PAN_SMOOTHING,
    );

    let prevCamX = camera.x;
    let prevCamY = camera.y;
    updateCamera(
      INTRO_PAN_SMOOTHING,
      introView.anchorX,
      introView.anchorY,
      introView.zoom,
    );
    // Once the camera has essentially stopped moving, hand off to the
    // normal (snappier) follow speed for regular tutorial-area movement.
    // Checking convergence (not distance to the raw target) matters here:
    // the vertical target can sit past what the anchor/zoom clamp allows
    // (the deck is close to the world's bottom edge), so camera.y settles
    // at the clamp boundary rather than literally reaching camera.targetY.
    if (abs(camera.x - prevCamX) < 0.05 && abs(camera.y - prevCamY) < 0.05) {
      introPhase = null;
      introView.anchorX = INTRO_CAMERA_ANCHOR.x;
      introView.anchorY = INTRO_CAMERA_ANCHOR.y;
      introView.zoom = INTRO_TUTORIAL_ZOOM;
    }
  } else {
    updateCamera(
      CAMERA.smoothing,
      introView.anchorX,
      introView.anchorY,
      introView.zoom,
    );

    // Start dialogue once the camera has settled
    if (!dialogueActive && !dialogueCompleted) {
      startDialogue(INTRO_DIALOGUE);
    }
  }

  // Apply screen shake offset to camera before rendering
  let shakeX = 0;
  let shakeY = 0;
  if (screenShakeTimer > 0) {
    shakeX = random(-screenShakeIntensity, screenShakeIntensity);
    shakeY = random(-screenShakeIntensity, screenShakeIntensity);
    screenShakeTimer--;
    if (screenShakeTimer <= 0) {
      screenShakeIntensity = 0;
    }
  }
  camera.x += shakeX;
  camera.y += shakeY;

  beginCameraView(introView.zoom, introView.anchorX, introView.anchorY);

  // Restore camera after applying shake
  camera.x -= shakeX;
  camera.y -= shakeY;

  drawIntroWorld();
  checkIntroDoor();

  // Handle intro door delay timer
  if (introDelayTimer > 0) {
    introDelayTimer--;
    if (introDelayTimer === 0) {
      dialogueActive = false;
      dialogueCompleted = true;
      loadLevel(0);
      gameState = STATE.PLAYING;
      updateSounds(); // switch from seagulls to BGM
    }
  }

  // Player physics — skip input when dialogue is active
  if (!dialogueActive) {
    handleInput();
  }
  resolveIntroCollisions();
  applyIntroPhysics();
  clampToBounds();
  animateSprite();
  drawCharacter();
  endCameraView();

  // Draw dialogue box in screen-space (after camera view ends)
  if (dialogueActive) {
    drawDialogueBox();
  }

  // Logo fades out during the zoom-out leg instead of vanishing the
  // instant the splash screen ends.
  if (logoAlpha > 0) {
    push();
    imageMode(CORNER);
    tint(255, logoAlpha);
    let logoH = INTRO_LOGO.w * (imgLogo.height / imgLogo.width);
    image(imgLogo, INTRO_LOGO.x, INTRO_LOGO.y, INTRO_LOGO.w, logoH);
    pop();
  }
}

function checkIntroDoor() {
  if (introDelayTimer > 0 || introDoorOpen) return;
  if (playerOverlapsRect(INTRO.door.x, INTRO.door.y, DOOR_W, DOOR_H)) {
    introDoorOpen = true;
    introDelayTimer = WIN_DELAY_FRAMES;
  }
}

function draw() {
  background(0);

  if (gameState === STATE.SPLASH) {
    drawSplashScreen();
  } else if (gameState === STATE.START) {
    drawIntroScreen();
  } else if (gameState === STATE.PLAYING) {
    updateCamera();
    beginCameraView();
    drawLevel();
    drawPlatforms();
    drawSpikes();
    drawLantern();
    drawDoors();
    updateLantern();
    updateLevel1Tutorial();
    if (darkMode || (levelBark && levelBark.blocksMovement)) {
      player.isMoving = false;
    } else {
      handleInput();
    }
    drawDarknessOverlay();
    if (winDelayTimer > 0) {
      winDelayTimer--;
      if (winDelayTimer === 0) {
        if (currentLevel < LEVELS.length - 1) {
          loadLevel(currentLevel + 1);
        } else {
          gameState = STATE.WIN;
        }
      }
    }
    updateSeasickness();
    resolveHorizontalCollisions();
    applyPhysics();
    clampToBounds();
    checkExitDoor();
    checkSpikeCollision();
    updateRat();
    checkRatCollision();
    drawRat();
    animateSprite();
    drawCharacter();
    endCameraView();
    drawHUD();
    drawLevelBark();
  } else if (gameState === STATE.FAINTING) {
    updateCamera();
    beginCameraView();
    drawLevel();
    drawPlatforms();
    drawSpikes();
    drawDoors();
    drawRat();
    updateFainting();
    drawCharacter();
    endCameraView();
    drawHUD();
  } else if (gameState === STATE.WIN) {
    drawWinScreen();
  } else if (gameState === STATE.LOSE) {
    drawLoseScreen();
  }
}

function loadLevel(index) {
  currentLevel = index;
  player.x = LEVELS[index].start.x;
  player.y = LEVELS[index].start.y;
  player.vy = 0;
  player.onGround = false;
  player.direction = "right";
  player.currentFrame = 0;
  player.frameTimer = 0;
  player.isMoving = false;
  player.seasickness = 0;
  player.faintTimer = 0;
  player.faintFlash = 0;
  player.visible = true;

  let ratData = LEVELS[index].rat;
  if (ratData) {
    rat.active = true;
    rat.x = ratData.minX;
    rat.dir = 1;
  } else {
    rat.active = false;
  }

  exitDoorOpen = false;
  winDelayTimer = 0;

  if (index === 0) {
    resetLevel1Tutorial();
  }

  resetCamera();
}

function blockMovementIfDark() {
  if (darkMode) {
    player.isMoving = false;
    return; // just stop movement, not the whole draw loop
  }
}

function drawLevel() {
  let level = LEVELS[currentLevel];
  let c = level.backgroundColor;
  background(c[0], c[1], c[2]);

  if (levelImages[currentLevel]) {
    push();
    imageMode(CORNER);
    image(levelImages[currentLevel], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pop();
  }
}

function handleInput() {
  player.isMoving = false;

  let tier = getSeasickTier();
  let speed = player.speed * (tier ? tier.speedMultiplier : 1);

  if (keyIsDown(65)) {
    player.x -= speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    player.x += speed;
    player.direction = "right";
    player.isMoving = true;
  }
  if ((keyIsDown(87) || keyIsDown(32)) && player.onGround) {
    player.vy = -PHYSICS.jumpStrength;
    player.onGround = false;
  }
}

function updateSeasickness() {
  if (darkMode) {
    player.seasickness = max(player.seasickness - SEASICK_RATE, 0);
  } else if (player.isMoving) {
    player.seasickness = min(player.seasickness + SEASICK_RATE, SEASICK_MAX);
  } else {
    player.seasickness = max(player.seasickness - SEASICK_DECAY, 0);
  }

  if (player.seasickness >= SEASICK_MAX) {
    player.seasickness = SEASICK_MAX;
    triggerFaint();
  }
}

function triggerFaint() {
  player.faintTimer = 0;
  player.faintFlash = 0;
  player.isMoving = false;
  gameState = STATE.FAINTING;
}

function updateRat() {
  if (!rat.active) return;
  let ratData = LEVELS[currentLevel].rat;

  rat.x += RAT_SPEED * rat.dir;

  if (rat.x >= ratData.maxX) {
    rat.x = ratData.maxX;
    rat.dir = -1;
  } else if (rat.x <= ratData.minX) {
    rat.x = ratData.minX;
    rat.dir = 1;
  }
}

function drawRat() {
  if (!rat.active) return;

  let ratY = CANVAS_HEIGHT - 16 - RAT_SIZE / 2;
  let ratWidth = RAT_SIZE * (imgRat.width / imgRat.height);
  push();
  imageMode(CENTER);
  translate(rat.x, ratY);
  // image faces left by default — flip horizontally when moving right
  if (rat.dir === 1) scale(-1, 1);
  image(imgRat, 0, 0, ratWidth, RAT_SIZE);
  pop();
}

function checkRatCollision() {
  if (!rat.active) return;

  let ratHalf = RAT_SIZE / 2;
  let ratCx = rat.x;
  let ratCy = CANVAS_HEIGHT - 16 - ratHalf;

  if (
    player.x + player.hw > ratCx - ratHalf &&
    player.x - player.hw < ratCx + ratHalf &&
    player.y + player.hh > ratCy - ratHalf &&
    player.y - player.hh < ratCy + ratHalf
  ) {
    triggerFaint();
  }
}

function checkSpikeCollision() {
  const TILE_SIZE = 16;
  let spikes = LEVELS[currentLevel].spikes || [];
  for (let i = 0; i < spikes.length; i++) {
    let s = spikes[i];
    let w = s.tilesW ? s.tilesW * TILE_SIZE : s.w;
    let left = s.x;
    let right = s.x + w;
    let top = s.y - SPIKE_H;
    let bottom = s.y;
    if (
      player.x + player.hw > left &&
      player.x - player.hw < right &&
      player.y + player.hh > top &&
      player.y - player.hh < bottom
    ) {
      triggerFaint();
      return;
    }
  }
}

function updateFainting() {
  player.faintTimer++;

  // toggle visibility every FAINT_FLASH_FRAMES frames
  if (player.faintTimer % FAINT_FLASH_FRAMES === 0) {
    player.visible = !player.visible;
    player.faintFlash++;
  }

  if (player.faintFlash >= FAINT_FLASHES) {
    player.visible = true;
    loadLevel(currentLevel);
    gameState = STATE.PLAYING;
  }
}

function resolveHorizontalCollisions() {
  const TILE_SIZE = 16;
  let platforms = LEVELS[currentLevel].platforms || [];
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    let w = p.tilesW * TILE_SIZE;
    let h = p.tilesH * TILE_SIZE;

    let withinY = player.y + player.hh > p.y && player.y - player.hh < p.y + h;
    if (!withinY) continue;

    let pl = player.x - player.hw;
    let pr = player.x + player.hw;
    let bl = p.x;
    let br = p.x + w;

    if (pr > bl && pl < br) {
      let pushLeft = pr - bl;
      let pushRight = br - pl;
      if (pushLeft < pushRight) {
        player.x -= pushLeft;
      } else {
        player.x += pushRight;
      }
    }
  }
}

function applyPhysics() {
  const TILE_SIZE = 16;
  player.vy += PHYSICS.gravity;
  player.vy = constrain(player.vy, -PHYSICS.jumpStrength, PHYSICS.maxFallSpeed);

  let prevTop = player.y - player.hh;
  let prevBottom = player.y + player.hh;
  player.y += player.vy;
  player.onGround = false;

  let platforms = LEVELS[currentLevel].platforms || [];
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    let w = p.tilesW * TILE_SIZE;
    let h = p.tilesH * TILE_SIZE;

    let withinX = player.x + player.hw > p.x && player.x - player.hw < p.x + w;
    if (!withinX) continue;

    let top = p.y;
    let bottom = p.y + h;

    if (player.vy >= 0 && prevBottom <= top && player.y + player.hh >= top) {
      player.y = top - player.hh;
      player.vy = 0;
      player.onGround = true;
    } else if (
      player.vy < 0 &&
      prevTop >= bottom &&
      player.y - player.hh <= bottom
    ) {
      player.y = bottom + player.hh;
      player.vy = 0;
    }
  }

  let groundY = CANVAS_HEIGHT - player.hh;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }
}

function drawPlatforms() {
  const TILE_SIZE = 16;
  let platforms = LEVELS[currentLevel].platforms || [];
  push();
  rectMode(CORNER);
  imageMode(CORNER);
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    let w = p.tilesW * TILE_SIZE;
    let h = p.tilesH * TILE_SIZE;

    if (p.barrel) {
      image(imgBarrel, p.x, p.y, w, h);
    } else {
      // Tile from global origin for alignment across platforms
      let startX = Math.floor(p.x / TILE_SIZE) * TILE_SIZE;
      let startY = Math.floor(p.y / TILE_SIZE) * TILE_SIZE;

      for (let tileY = startY; tileY < p.y + h; tileY += TILE_SIZE) {
        for (let tileX = startX; tileX < p.x + w; tileX += TILE_SIZE) {
          image(imgPlatformTile, tileX, tileY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
  pop();
}

function drawSpikes() {
  const TILE_SIZE = 16;
  let spikes = LEVELS[currentLevel].spikes || [];
  push();
  rectMode(CORNER);
  fill(150);
  stroke(90);
  strokeWeight(1);
  for (let i = 0; i < spikes.length; i++) {
    let s = spikes[i];
    let w = s.tilesW ? s.tilesW * TILE_SIZE : s.w;
    let count = floor(w / SPIKE_W);
    for (let j = 0; j < count; j++) {
      let lx = s.x + j * SPIKE_W;
      triangle(lx, s.y, lx + SPIKE_W, s.y, lx + SPIKE_W / 2, s.y - SPIKE_H);
    }
  }
  pop();
}

// True once the player's hitbox overlaps a rect of the given dimensions
// (used for door auto-open triggers).
function playerOverlapsRect(rx, ry, rw, rh) {
  return (
    player.x + player.hw > rx &&
    player.x - player.hw < rx + rw &&
    player.y + player.hh > ry &&
    player.y - player.hh < ry + rh
  );
}

function checkExitDoor() {
  if (winDelayTimer > 0 || exitDoorOpen) return;
  let level = LEVELS[currentLevel];
  if (!level.exitDoor) return;
  if (playerOverlapsRect(level.exitDoor.x, level.exitDoor.y, DOOR_W, DOOR_H)) {
    exitDoorOpen = true;
    winDelayTimer = EXIT_DELAY_FRAMES;
  }
}

function drawDoors() {
  let level = LEVELS[currentLevel];
  if (!level.spawnDoor || !level.exitDoor) return;

  push();
  imageMode(CORNER);

  // spawn door — always closed, decorative
  image(imgDoorClosed, level.spawnDoor.x, level.spawnDoor.y, DOOR_W, DOOR_H);

  // exit door — open or closed
  let ex = level.exitDoor.x;
  let ey = level.exitDoor.y;
  image(exitDoorOpen ? imgDoorOpen : imgDoorClosed, ex, ey, DOOR_W, DOOR_H);

  pop();
}

function drawInteractionPrompt(x, y) {
  const radius = 12;
  push();
  // White circle
  fill(255, 255, 255, 80);
  noStroke();
  circle(x, y, radius * 2);

  // Black E
  fill(0);
  textSize(16);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  text("E", x, y - 7);
  pop();
}

function clampToBounds() {
  player.x = constrain(player.x, player.hw, CANVAS_WIDTH - player.hw);
  if (player.y < player.hh) {
    player.y = player.hh;
    player.vy = 0;
  }
}

function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;
    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer = 0;
  }
}

function drawCharacter() {
  if (!player.visible) return;

  let row = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];

  let sx = player.currentFrame * SPRITE.frameWidth + offset.x;
  let sy = row * SPRITE.frameHeight + offset.y;

  let dw = SPRITE.frameWidth * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  image(
    characterSheet,
    player.x,
    player.y,
    dw,
    dh,
    sx,
    sy,
    SPRITE.frameWidth,
    SPRITE.frameHeight,
  );
}

function drawHUD() {
  // Wrap the whole function so its fill/stroke/textAlign/textSize changes
  // (notably textAlign(RIGHT, TOP) for the seasickness label) can't leak
  // into whatever draws next in the same frame — this previously broke
  // drawLevelBark()'s text alignment since nothing here reset it.
  push();

  // level name
  textSize(16);
  textAlign(LEFT, TOP);
  strokeWeight(3);
  stroke(0);
  fill(0);
  text(LEVELS[currentLevel].name, 16, 16);
  noStroke();
  fill(255);
  text(LEVELS[currentLevel].name, 16, 16);

  // seasickness meter
  let meterX = CANVAS_WIDTH - 320;
  let meterY = 16;
  let meterW = 300;
  let meterH = 18;
  let fill_pct = player.seasickness / SEASICK_MAX;

  // label — black outline, white fill
  textSize(12);
  textAlign(RIGHT, TOP);
  strokeWeight(3);
  stroke(0);
  fill(0);
  text("SEASICKNESS", meterX - 4, meterY + 2);
  noStroke();
  fill(255);
  text("SEASICKNESS", meterX - 4, meterY + 2);

  // background bar
  noFill();
  stroke(0);
  strokeWeight(3);
  rect(meterX, meterY, meterW, meterH, 4);

  // filled portion — green → yellow → red
  let r = map(fill_pct, 0, 1, 60, 230);
  let g = map(fill_pct, 0, 1, 200, 60);
  noStroke();
  fill(r, g, 80);
  rect(meterX + 1, meterY + 1, (meterW - 2) * fill_pct, meterH - 2, 3);

  // tier markers — where the sprite starts jolting (1/3 and 2/3 full)
  let m1x = meterX + meterW * (SEASICK_LAG_TIER1 / SEASICK_MAX);
  let m2x = meterX + meterW * (SEASICK_LAG_TIER2 / SEASICK_MAX);
  for (let mx of [m1x, m2x]) {
    stroke(0, 160);
    strokeWeight(2);
    line(mx, meterY + 1, mx, meterY + meterH - 1);
    stroke(255, 220);
    strokeWeight(1);
    line(mx, meterY + 1, mx, meterY + meterH - 1);
  }
  noStroke();

  pop();
}

function drawStartScreen() {
  push();
  imageMode(CORNER);
  image(imgIntroBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let logoX = 20;
  let logoY = 20;
  let logoW = 235;
  let logoH = logoW * (imgLogo.height / imgLogo.width);
  image(imgLogo, logoX, logoY, logoW, logoH);

  let label = "A / D to move, W to jump.\nPress ENTER to start.";
  let labelY = logoY + logoH + 14;
  textFont("Pixelify Sans");
  textStyle(BOLD);
  textSize(18);
  textLeading(24);
  textAlign(LEFT, TOP);
  strokeWeight(4);
  stroke(0);
  fill(0);
  text(label, logoX, labelY);
  noStroke();
  fill(255);
  text(label, logoX, labelY);
  pop();
}

function drawWinScreen() {
  background(20, 40, 30);

  fill(120, 230, 150);
  textAlign(CENTER, CENTER);
  textSize(56);
  text("YOU WIN!", width / 2, height / 2 - 40);

  fill(220);
  textSize(18);
  text("You've earned your sealegs.", width / 2, height / 2 + 20);
  text("Press ENTER to play again", width / 2, height / 2 + 60);
}

function drawLoseScreen() {
  background(45, 20, 25);

  fill(235, 120, 120);
  textAlign(CENTER, CENTER);
  textSize(56);
  text("YOU LOST", width / 2, height / 2 - 40);

  fill(220);
  textSize(18);
  text("Press R to retry this level", width / 2, height / 2 + 20);
  text("Press ENTER for the title screen", width / 2, height / 2 + 60);
}

function keyPressed() {
  // Dialogue intercept — must come before any other state handler
  if (dialogueActive) {
    advanceDialogue();
    return;
  }

  // Level barks only intercept Enter specifically — unlike the intro
  // dialogue, other keys (movement, debug level-skip) still pass through,
  // since barks that don't set blocksMovement shouldn't stall gameplay.
  if (levelBark && keyCode === ENTER) {
    advanceLevelBark();
    return;
  }

  if (gameState === STATE.SPLASH) {
    if (keyCode === ENTER) {
      // Camera stays right where the splash shot left it — drawIntroScreen()
      // eases it out to a full view of the ship first, then into the
      // tutorial framing on the player.
      introPhase = "zoomOut";
      gameState = STATE.START;
      updateSounds();
    }
  } else if (gameState === STATE.PLAYING) {
    if (keyCode === 78) {
      if (currentLevel < LEVELS.length - 1) {
        loadLevel(currentLevel + 1);
      } else {
        gameState = STATE.WIN;
      }
    }
    if (keyCode === 76) {
      gameState = STATE.LOSE;
    }
  } else if (gameState === STATE.WIN) {
    if (keyCode === ENTER) {
      goToSplash();
    }
  } else if (gameState === STATE.LOSE) {
    if (keyCode === 82) {
      loadLevel(currentLevel);
      gameState = STATE.PLAYING;
    }
    if (keyCode === ENTER) {
      goToSplash();
    }
  }
}
