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
const CAMERA = {
  zoom: 1.9,
  smoothing: 0.08, // 0..1, higher = snappier follow
};

const INTRO_PAN_SMOOTHING = 0.035;
const INTRO_ZOOM_OUT_SMOOTHING = 0.09;

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

function updateCamera(
  smoothing = CAMERA.smoothing,
  anchorX = CANVAS_WIDTH / 2,
  anchorY = CANVAS_HEIGHT / 2,
  zoom = CAMERA.zoom,
) {
  if (player.onGround) {
    camera.targetY = player.y;
  }

  camera.x = lerp(camera.x, player.x, smoothing);
  camera.y = lerp(camera.y, camera.targetY, smoothing);

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

const DOOR_W = 55;
const DOOR_H = 90;

const SPIKE_W = 16;
const SPIKE_H = 16;

const RAT_SPEED = 2.4;
const RAT_SIZE = 32;

const SEASICK_MAX = 100;
const SEASICK_RATE = 0.23;
const SEASICK_DECAY = 0.005;
const FAINT_FLASHES = 6;
const FAINT_FLASH_FRAMES = 12;

const SEASICK_LAG_TIER1 = SEASICK_MAX / 3;
const SEASICK_LAG_TIER2 = (SEASICK_MAX * 2) / 3;
const SEASICK_LAG_TIERS = [
  {
    threshold: SEASICK_LAG_TIER2,
    speedMultiplier: 0.7,
    wobbleAmp: 3,
    wobbleFreq: 0.22,
  },
  {
    threshold: SEASICK_LAG_TIER1,
    speedMultiplier: 0.9,
    wobbleAmp: 1.5,
    wobbleFreq: 0.16,
  },
];

function getSeasickTier() {
  return (
    SEASICK_LAG_TIERS.find((t) => player.seasickness >= t.threshold) || null
  );
}

let screenShakeIntensity = 0;
let screenShakeTimer = 0;

let dialogueActive = false;
let dialogueCompleted = false;
let dialogueIndex = 0;
let dialogueCharIndex = 0;
let dialoguePageOffset = 0;
let dialogueLinesPerPage = 6;
let dialogueFrameCounter = 0;
const DIALOGUE_FRAMES_PER_CHAR = 2;

const LEVEL_BARK_BOX_H = 200 * 0.95;
const LEVEL_BARK_LINES_PER_PAGE = 2;

let levelBark = null;
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

function advanceLevelBark() {
  if (!levelBark) return;
  let pageCount = ceil(
    levelBark.wrappedLines.length / LEVEL_BARK_LINES_PER_PAGE,
  );
  if (levelBarkPage + 1 < pageCount) {
    levelBarkPage++;
  } else {
    levelBark = null;
  }
}

let level1BarrelBarkShown = false;
let level1LanternBarkShown = false;
let level1HelmBarkShown = false;
let level1HasBeenSeasick = false;

function clearLevelBark() {
  levelBark = null;
  levelBarkPage = 0;
}

function resetLevel1Tutorial() {
  level1BarrelBarkShown = false;
  level1LanternBarkShown = false;
  level1HelmBarkShown = false;
  level1HasBeenSeasick = false;
  clearLevelBark();
}

function updateLevel1Tutorial() {
  if (currentLevel !== 0) return;

  if (player.seasickness >= 15) level1HasBeenSeasick = true;

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

  if (!level1LanternBarkShown) {
    let firstLantern = LANTERNS[0][0];
    let nearLantern =
      abs(player.x - firstLantern.x) < 50 &&
      abs(player.y - firstLantern.y) < 50;
    if (nearLantern) {
      showLevelBark(
        "PARROT",
        "You're new to this shindig, so you're gonna keep getting more seasick. Get to the lanterns to take a break. The dark makes you feel less nauseous.",
        true,
      );

      level1LanternBarkShown = true;
    }
  }

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

function drawLevelBark() {
  if (!levelBark) return;

  let isChar = levelBark.speaker === "PARROT" || levelBark.speaker === "PLAYER";
  let img = currentDialogueImage(levelBark.speaker);

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
    let segments = parseStyledSegments(levelBark.wrappedLines[i]);
    drawStyledLine(segments, boxX + padLeft, boxY + padTop + (i - start) * 40);
  }
  pop();

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

const INTRO = {
  platform: { x: 480, y: 500, tilesW: 16, tilesH: 1 },
  platform2: { x: 565, y: CANVAS_HEIGHT - 16, tilesW: 26, tilesH: 1 },

  walls: [
    { x: 450, y: 312, w: 500, h: 52 },
    { x: 460, y: 520, w: 100, h: 100 },
    { x: 880, y: 330, w: 100, h: 140 },
    { x: 440, y: 300, w: 40, h: 300 },
  ],

  hammock: { x: 500, y: 386, w: 200, h: 120 },

  door: { x: CANVAS_WIDTH - DOOR_W - 8, y: CANVAS_HEIGHT - DOOR_H - 8 },

  playerStart: { x: 490, y: 430 },
};

const INTRO_DIALOGUE = [
  { speaker: "PARROT", text: "*SQUAWK* Quiet morning… Hm…" },
  {
    speaker: "PLAYER",
    text: "Good... morning... eurgh... is that singing I hear?",
  },
  {
    speaker: "DIALOGUE",
    text: "♪ Harmonious singing echoes from the stern of the _Swift Claudia_.",
  },
  {
    speaker: "DIALOGUE",
    text: "It feels like you're being drawn in... are those sirens?",
  },
  { speaker: "DIALOGUE", text: "*THUMP THUMP*" },
  { speaker: "DIALOGUE", text: "*BIG SPLASH*" },
  { speaker: "PLAYER", text: "What was that??" },
  {
    speaker: "PARROT",
    text: "*CAW CAW* Sirens spotted at starboard. Crew gone overboard!",
  },
  { speaker: "PLAYER", text: "Wait... everyone?" },
  { speaker: "PLAYER", text: "_Then who's at the helm??_" },
  {
    speaker: "PARROT",
    text: "No one, you empty bucket!",
  },
  {
    speaker: "PARROT",
    text: "Time to steer this beauty home before we feed the fish!",
  },
  {
    speaker: "PARROT",
    text: "Use **A and D** to move, and **SPACE** to jump.",
  },
  { speaker: "PARROT", text: "Time to earn your sea legs, swashbuckler!" },
  { speaker: "PLAYER", text: "Argh, but I'm gonna get so seasick!" },
];

const INTRO_SPLASH_VIEW = { x: 270, y: 180 };
const SPLASH_ZOOM = 1.6;

const INTRO_CAMERA_ANCHOR = { x: CANVAS_WIDTH * 0.32, y: CANVAS_HEIGHT * 0.32 };

const INTRO_TUTORIAL_ZOOM = 1.4;

const INTRO_FULL_VIEW_ZOOM = 1;
const INTRO_FULL_VIEW = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };

let introView = {
  anchorX: CANVAS_WIDTH / 2,
  anchorY: CANVAS_HEIGHT / 2,
  zoom: SPLASH_ZOOM,
};

const INTRO_LOGO = {
  x: CANVAS_WIDTH / 2 - 400,
  y: CANVAS_HEIGHT / 2 - 260,
  w: 600,
};
let logoAlpha = 255;

// ============================================================
// LEVEL 1 — repositioned per layout sketch
//
// Ground is now three thick chunks with two gaps:
//   Block A (0–176)  |  gap 1 (176–352)  |  Block B (352–608)
//   |  gap 2 (608–784)  |  Block C (784–960, exit door sits here)
//
// Gap 1 has a shallow floor ~64px down so it's a jumpable pit.
// Gap 2 has spikes flush with ground level — falling in is fatal.
// Rat removed from this level.
// ============================================================
const LEVELS = [
  {
    name: "Level 1",
    background: "assets/images/lvl1background.png",
    backgroundColor: [150, 75, 0],
    start: { x: 40, y: 200 },

    platforms: [
      { x: 0, y: 304, tilesW: 49, tilesH: 1 },

      { x: 288, y: 464, tilesW: 36, tilesH: 1 }, //second layer platform

      { x: 848, y: 400, tilesW: 1, tilesH: 4 }, //vertical wall 3
      { x: 848, y: 384, tilesW: 9, tilesH: 1 }, //top of vertical wall 3

      { x: 0, y: 544, tilesW: 17, tilesH: 50 }, // big block on the left

      // ground floor split into 3 segments
      { x: 0, y: CANVAS_HEIGHT - 16, tilesW: 40, tilesH: 1 }, // floor A
      { x: 640, y: CANVAS_HEIGHT - 16, tilesW: 5, tilesH: 1 }, // filled gap
      { x: 720, y: CANVAS_HEIGHT - 16, tilesW: 7, tilesH: 1 }, // floor B
      { x: 832, y: CANVAS_HEIGHT - 16, tilesW: 8, tilesH: 1 }, // floor C

      // barrels
      {
        x: 432,
        y: 464 - 48, // 3 tiles tall, shifted up to keep it grounded on y:464
        tilesW: 3,
        tilesH: 3,
        barrel: true,
      },
      {
        x: 30,
        y: 498,
        tilesW: 3,
        tilesH: 3,
        barrel: true,
      },
      { x: 160, y: 256, tilesW: 3, tilesH: 3, barrel: true },
      { x: 320, y: 256, tilesW: 3, tilesH: 3, barrel: true },
      { x: 368, y: 256, tilesW: 3, tilesH: 3, barrel: true },
      { x: 344, y: 208, tilesW: 3, tilesH: 3, barrel: true },
      { x: 512, y: 256, tilesW: 3, tilesH: 3, barrel: true },
      { x: 560, y: 256, tilesW: 3, tilesH: 3, barrel: true },
    ],

    // spikes now guard gap 2, flush with ground level

    spikes: [
      { x: 368, y: 464, tilesW: 1 },
      { x: 528, y: 464, tilesW: 1 },
      { x: 544, y: 464, tilesW: 1 }, // new spike, right next to the middle one
      { x: 688, y: 464, tilesW: 1 },
    ],

    rat: {
      x: 280, // starts just right of the big ground block
      y: CANVAS_HEIGHT - 32, // stands on the floor
      speed: 1.2, // smooth walk
      minX: 280 + 16,
      maxX: CANVAS_WIDTH - DOOR_W - 20 - 40, // right boundary (before door)
    },
    spawnDoor: { x: 13, y: 227 },
    exitDoor: { x: CANVAS_WIDTH - DOOR_W - 20, y: CANVAS_HEIGHT - DOOR_H - 3 },
  },
  {
    name: "Level 2",
    background: "assets/images/lvl1background.png",
    backgroundColor: [150, 75, 0],
    start: { x: 56, y: 560 },
    platforms: [
      { x: 0, y: CANVAS_HEIGHT - 16, tilesW: 60, tilesH: 1 },
      { x: 0, y: 56, tilesW: 60, tilesH: 1 },
      { x: 600, y: 112, tilesW: 22, tilesH: 1 },

      { x: 456, y: 288, tilesW: 2, tilesH: 21 },
      { x: 488, y: 304, tilesW: 22, tilesH: 1 },
      { x: 848, y: 304, tilesW: 7, tilesH: 1 },

      { x: 80, y: 552, tilesW: 6, tilesH: 1 },
      { x: 210, y: 480, tilesW: 6, tilesH: 1 },
      { x: 70, y: 408, tilesW: 8, tilesH: 1 },
      { x: 200, y: 336, tilesW: 9, tilesH: 1 },
      { x: 300, y: 496, tilesW: 8, tilesH: 1 },

      { x: 500, y: 236, tilesW: 9, tilesH: 1 },
      { x: 800, y: 440, tilesW: 8, tilesH: 1 },
      { x: 520, y: 520, tilesW: 7, tilesH: 1 },
    ],
    spikes: [
      { x: 456, y: 288, tilesW: 2 },
      { x: 488, y: 304, tilesW: 22 },
    ],

    spawnDoor: { x: 20, y: CANVAS_HEIGHT - 16 - DOOR_H },
    exitDoor: { x: CANVAS_WIDTH - DOOR_W - 20, y: CANVAS_HEIGHT - 16 - DOOR_H },
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
let soundSplash;
let exitDoorOpen = false;
let introDoorOpen = false;
let winDelayTimer = 0;
let introDelayTimer = 0;
const WIN_DELAY_FRAMES = 90;
const EXIT_DELAY_FRAMES = 4;

function preload() {
  characterSheet = loadImage("assets/images/pirate_sprite.png");
  imgIntroBg = loadImage("assets/images/backround_intro.PNG");
  imgLogo = loadImage("assets/images/title.png");
  imgRat = loadImage("assets/images/rat.png");
  imgBarrel = loadImage("assets/images/barrel.png");
  imgDoorClosed = loadImage("assets/images/doorclose.png");
  imgDoorOpen = loadImage("assets/images/dooropen.png");
  imgHammock = loadImage("assets/images/hammock.png");
  imgLantern = loadImage("assets/images/hanging_lantern.png");
  imgPlatformTile = loadImage("assets/images/platform_tile.png");
  imgDialogueGeneric = loadImage("assets/images/dialogue.png");
  imgDialogueParrot = loadImage("assets/images/parrot_dialogue.png");
  imgDialoguePirate = loadImage("assets/images/pirate_dialogue.png");
  imgSign = loadImage("assets/images/sign.png");
  soundBGM = loadSound("assets/sounds/bgm.mp3");
  soundSeagulls = loadSound("assets/sounds/seagulls.mp3");
  soundSplash = loadSound("assets/sounds/splash.mp3");

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

function updateSounds() {
  if (soundSeagulls?.isPlaying()) soundSeagulls.stop();
  if (soundBGM?.isPlaying()) soundBGM.stop();

  if (gameState === STATE.START) {
    soundSeagulls.loop();
  } else if (gameState !== STATE.SPLASH) {
    soundBGM.setVolume(0.455);
    soundBGM.loop();
  }
}

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
  dialogueActive = false;
  dialogueCompleted = false;
  dialogueIndex = 0;
  dialogueCharIndex = 0;
  dialoguePageOffset = 0;
  dialogueFrameCounter = 0;
  resetLevel1Tutorial();
  screenShakeIntensity = 0;
  screenShakeTimer = 0;
}

function skipIntroToFreeRoam() {
  dialogueActive = false;
  dialogueCompleted = true;
  introPhase = null;
  introView.anchorX = INTRO_CAMERA_ANCHOR.x;
  introView.anchorY = INTRO_CAMERA_ANCHOR.y;
  introView.zoom = INTRO_TUTORIAL_ZOOM;
  logoAlpha = 0;
  gameState = STATE.START;
  resetCamera();
  updateSounds();
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

  let groundY = CANVAS_HEIGHT - player.hh;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }
}

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

  push();
  rectMode(CORNER);
  imageMode(CORNER);
  const TILE_SIZE = 16;

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

  if (DEBUG_HITBOXES) {
    push();
    rectMode(CORNER);
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    let dp1 = INTRO.platform;
    let dp1W = dp1.tilesW * TILE_SIZE;
    let dp1H = dp1.tilesH * TILE_SIZE;
    rect(dp1.x, dp1.y, dp1W, dp1H);

    let dp2 = INTRO.platform2;
    let dp2W = dp2.tilesW * TILE_SIZE;
    let dp2H = dp2.tilesH * TILE_SIZE;
    rect(dp2.x, dp2.y, dp2W, dp2H);
    for (let w of INTRO.walls) {
      rect(w.x, w.y, w.w, w.h);
    }
    pop();
  }

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

function drawSplashScreen() {
  let halfW = CANVAS_WIDTH / SPLASH_ZOOM / 2;
  let halfH = CANVAS_HEIGHT / SPLASH_ZOOM / 2;
  camera.x = constrain(INTRO_SPLASH_VIEW.x, halfW, CANVAS_WIDTH - halfW);
  camera.y = constrain(INTRO_SPLASH_VIEW.y, halfH, CANVAS_HEIGHT - halfH);

  beginCameraView(SPLASH_ZOOM);
  drawIntroWorld();

  resolveIntroCollisions();
  applyIntroPhysics();
  clampToBounds();
  animateSprite();
  drawCharacter();

  endCameraView();

  push();
  imageMode(CORNER);
  let logoH = INTRO_LOGO.w * (imgLogo.height / imgLogo.width);
  image(imgLogo, INTRO_LOGO.x - 30, INTRO_LOGO.y, INTRO_LOGO.w, logoH);
  pop();

  push();
  imageMode(CENTER);
  let signW = 380;
  let signH = signW * (imgSign.height / imgSign.width);
  image(imgSign, CANVAS_WIDTH / 2 - 240, CANVAS_HEIGHT - 250, signW, signH);
  pop();

  push();
  textAlign(CENTER, CENTER);
  textSize(26);
  strokeWeight(6);
  stroke(62, 39, 49);
  fill(255);
  text("PRESS 'ENTER' TO START", CANVAS_WIDTH / 2 - 240, CANVAS_HEIGHT - 250);
  pop();
}

function currentDialogueImage(speaker) {
  if (speaker === "PARROT") return imgDialogueParrot;
  if (speaker === "PLAYER") return imgDialoguePirate;
  return imgDialogueGeneric;
}

function stripMarkup(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/_(.+?)_/g, "$1");
}

function parseStyledSegments(text) {
  const re = /\*\*(.+?)\*\*|_(.+?)_/g;
  let segments = [];
  let last = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ text: text.slice(last, match.index), style: NORMAL });
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], style: BOLD });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], style: ITALIC });
    }
    last = re.lastIndex;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), style: NORMAL });
  }
  return segments.length > 0 ? segments : [{ text, style: NORMAL }];
}

function drawStyledLine(segments, x, y) {
  let cx = x;
  for (let seg of segments) {
    if (seg.style === BOLD) {
      text(seg.text, cx, y);
      text(seg.text, cx + 1, y);
    } else if (seg.style === ITALIC) {
      push();
      translate(cx, y);
      shearX(-0.22);
      text(seg.text, 0, 0);
      pop();
    } else {
      text(seg.text, cx, y);
    }
    cx += textWidth(seg.text);
  }
}

function wrapTextForDialogue(txt, maxWidth) {
  push();
  textFont("Pixelify Sans");
  textSize(30);
  let words = txt.split(" ");
  let lines = [];
  let currentLine = "";

  for (let word of words) {
    let testLine = currentLine ? currentLine + " " + word : word;
    if (textWidth(stripMarkup(testLine)) > maxWidth && currentLine.length > 0) {
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

  if (line.text === "*BIG SPLASH*") {
    screenShakeIntensity = 8;
    screenShakeTimer = 30;
    soundSplash.play();
  }
}

function getWrappedDialogueLines(line) {
  let isChar = line.speaker === "PARROT" || line.speaker === "PLAYER";
  let boxW = (CANVAS_WIDTH - 80) * 0.95;
  let padLeft = isChar ? 220 : 75;
  let padRight = 45;
  let maxTextW = boxW - padLeft - padRight;
  return wrapTextForDialogue(line.text, maxTextW);
}

function advanceDialogue() {
  if (!dialogueActive || dialogueIndex >= INTRO_DIALOGUE.length) return;

  let line = INTRO_DIALOGUE[dialogueIndex];
  let wrappedLines = getWrappedDialogueLines(line);

  if (dialogueCharIndex < line.text.length) {
    dialogueCharIndex = line.text.length;
    dialoguePageOffset = 0;
  } else {
    if (dialoguePageOffset + dialogueLinesPerPage < wrappedLines.length) {
      dialoguePageOffset += dialogueLinesPerPage;
    } else {
      dialogueIndex++;
      if (dialogueIndex >= INTRO_DIALOGUE.length) {
        dialogueActive = false;
        dialogueCompleted = true;
        return;
      }
      dialogueCharIndex = 0;
      dialoguePageOffset = 0;
      dialogueFrameCounter = 0;

      let nextLine = INTRO_DIALOGUE[dialogueIndex];
      if (nextLine.text === "*BIG SPLASH*") {
        screenShakeIntensity = 8;
        screenShakeTimer = 30;
        soundSplash.play();
      }
    }
  }
}

function drawDialogueBox() {
  if (!dialogueActive || dialogueIndex >= INTRO_DIALOGUE.length) return;

  let line = INTRO_DIALOGUE[dialogueIndex];
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
    wrappedLines.length - dialoguePageOffset,
    dialogueLinesPerPage,
  );
  let actualTextHeight = pageLineCount * 40;
  let vertOffset = max(0, (textAreaH - actualTextHeight) / 2);
  textY += vertOffset;

  dialogueFrameCounter++;
  if (dialogueFrameCounter >= DIALOGUE_FRAMES_PER_CHAR) {
    dialogueFrameCounter = 0;
    if (dialogueCharIndex < line.text.length) {
      dialogueCharIndex++;
    }
  }

  let cumChars = [];
  let cum = 0;
  for (let i = 0; i < wrappedLines.length; i++) {
    cum += wrappedLines[i].length;
    cumChars.push(cum);
  }

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

  let shakeX = 0;
  let shakeY = 0;
  if (
    line.text === "Then who's at the helm??" &&
    dialogueCharIndex >= line.text.length
  ) {
    shakeX = random(-1.5, 1.5);
    shakeY = random(-1.5, 1.5);
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
    drawStyledLine(segments, textX + shakeX, textY + i * 40 + shakeY);
  }
  pop();

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

function drawIntroScreen() {
  if (introPhase === "zoomOut") {
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
      introPhase = "panIn";
      camera.targetY = player.y;
      logoAlpha = 0;
    }
  } else if (introPhase === "panIn") {
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

    if (!dialogueActive && !dialogueCompleted) {
      startDialogue(INTRO_DIALOGUE);
    }
  }

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

  camera.x -= shakeX;
  camera.y -= shakeY;

  drawIntroWorld();
  checkIntroDoor();

  if (introDelayTimer > 0) {
    introDelayTimer--;
    if (introDelayTimer === 0) {
      dialogueActive = false;
      dialogueCompleted = true;
      loadLevel(0);
      gameState = STATE.PLAYING;
      updateSounds();
    }
  }

  if (!dialogueActive) {
    handleInput();
  }
  resolveIntroCollisions();
  applyIntroPhysics();
  clampToBounds();
  animateSprite();
  drawCharacter();
  endCameraView();

  if (dialogueActive) {
    drawDialogueBox();
  }

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
    drawPhantoms();
    drawSpikes();
    drawLantern();
    drawDoors();
    updateLantern();
    updateLevel1Tutorial();
    if (darkMode || levelBark) {
      player.isMoving = false;
    } else {
      handleInput();
    }
    drawDarknessOverlay();
    if (winDelayTimer > 0) {
      winDelayTimer--;
      if (winDelayTimer === 0) {
        let next = LEVELS[currentLevel + 1];
        if (next && next.platforms && next.platforms.length > 0) {
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
    drawPhantoms();
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

  // Support either a single `rat` or a list of `rats` per level.
  let ratDefs =
    LEVELS[index].rats || (LEVELS[index].rat ? [LEVELS[index].rat] : []);
  rats = ratDefs.map((d) => ({
    minX: d.minX,
    maxX: d.maxX,
    x: d.minX,
    dir: 1,
  }));

  exitDoorOpen = false;
  winDelayTimer = 0;

  clearLevelBark();

  resetCamera();
}

function blockMovementIfDark() {
  if (darkMode) {
    player.isMoving = false;
    return;
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
  for (let rat of rats) {
    rat.x += RAT_SPEED * rat.dir;
    if (rat.x >= rat.maxX) {
      rat.x = rat.maxX;
      rat.dir = -1;
    } else if (rat.x <= rat.minX) {
      rat.x = rat.minX;
      rat.dir = 1;
    }
  }
}

function drawRat() {
  let ratY = CANVAS_HEIGHT - 16 - RAT_SIZE / 2;
  let ratWidth = RAT_SIZE * (imgRat.width / imgRat.height);
  for (let rat of rats) {
    push();
    imageMode(CENTER);
    translate(rat.x, ratY);
    if (rat.dir === 1) scale(-1, 1);
    image(imgRat, 0, 0, ratWidth, RAT_SIZE);
    pop();
  }
}

function checkRatCollision() {
  let ratHalf = RAT_SIZE / 2;
  let ratCy = CANVAS_HEIGHT - 16 - ratHalf;
  for (let rat of rats) {
    if (
      player.x + player.hw > rat.x - ratHalf &&
      player.x - player.hw < rat.x + ratHalf &&
      player.y + player.hh > ratCy - ratHalf &&
      player.y - player.hh < ratCy + ratHalf
    ) {
      triggerFaint();
      return;
    }
  }
}
function checkSpikeCollision() {
  const TILE_SIZE = 16;
  const SPIKE_HITBOX_MARGIN = 10; // how much more forgiving the spike collision is vs the visual sprite
  let spikes = LEVELS[currentLevel].spikes || [];
  let phw = player.hw - SPIKE_HITBOX_MARGIN;
  let phh = player.hh - SPIKE_HITBOX_MARGIN;

  for (let i = 0; i < spikes.length; i++) {
    let s = spikes[i];
    let w = s.tilesW ? s.tilesW * TILE_SIZE : s.w;
    let left = s.x;
    let right = s.x + w;
    let top = s.y - SPIKE_H;
    let bottom = s.y;
    if (
      player.x + phw > left &&
      player.x - phw < right &&
      player.y + phh > top &&
      player.y - phh < bottom
    ) {
      triggerFaint();
      return;
    }
  }
}

function updateFainting() {
  player.faintTimer++;

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
  let platforms = getActivePlatforms();
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

  let platforms = getActivePlatforms();
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

  image(imgDoorClosed, level.spawnDoor.x, level.spawnDoor.y, DOOR_W, DOOR_H);

  let ex = level.exitDoor.x;
  let ey = level.exitDoor.y;
  image(exitDoorOpen ? imgDoorOpen : imgDoorClosed, ex, ey, DOOR_W, DOOR_H);

  pop();
}

function drawInteractionPrompt(x, y) {
  const radius = 12;
  push();
  fill(255, 255, 255, 80);
  noStroke();
  circle(x, y, radius * 2);

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
  push();

  textSize(20);
  textAlign(LEFT, TOP);
  strokeWeight(5);
  stroke(62, 39, 49);
  fill(255);
  text(LEVELS[currentLevel].name, 16, 16);
  noStroke();
  fill(255);
  text(LEVELS[currentLevel].name, 16, 16);

  let meterX = CANVAS_WIDTH - 320;
  let meterY = 16;
  let meterW = 300;
  let meterH = 18;
  let fill_pct = player.seasickness / SEASICK_MAX;

  textSize(20);
  textAlign(RIGHT, TOP);
  strokeWeight(5);
  stroke(62, 39, 49);
  fill(255);
  text("SEASICKNESS", meterX - 6, meterY + 2);

  fill(90, 105, 136);
  stroke(192, 203, 220);
  strokeWeight(5);
  rect(meterX, meterY, meterW, meterH, 4);

  let r = map(fill_pct, 0, 1, 60, 230);
  let g = map(fill_pct, 0, 1, 200, 60);
  noStroke();
  fill(r, g, 80);
  rect(meterX + 1, meterY + 1, (meterW - 2) * fill_pct, meterH - 2, 3);

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
  text("LEVEL COMPLETE", width / 2, height / 2 - 40);

  fill(220);
  textSize(18);
  text("Press ENTER to restart", width / 2, height / 2 + 30);
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
  if (keyCode === ENTER) {
    // Level bark active? Advance it.
    if (levelBark) {
      advanceLevelBark();
      return;
    }

    // Intro dialogue active? Advance it.
    if (dialogueActive && !dialogueCompleted) {
      advanceDialogue();
      return;
    }
  }

  if (
    keyCode === 89 &&
    (gameState === STATE.SPLASH || gameState === STATE.START)
  ) {
    skipIntroToFreeRoam();
    return;
  }

  if (dialogueActive) {
    if (keyCode === ENTER) advanceDialogue();
    return;
  }

  if (levelBark) {
    if (keyCode === ENTER) advanceLevelBark();
    return;
  }

  if (gameState === STATE.SPLASH) {
    if (keyCode === ENTER) {
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
