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
  zoom: 1.7,
  smoothing: 0.08, // 0..1, higher = snappier follow
};

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

function updateCamera() {
  let viewW = CANVAS_WIDTH / CAMERA.zoom;
  let viewH = CANVAS_HEIGHT / CAMERA.zoom;

  // Only re-target vertically when grounded, so jumps/falls don't pan the camera.
  if (player.onGround) {
    camera.targetY = player.y;
  }

  camera.x = lerp(camera.x, player.x, CAMERA.smoothing);
  camera.y = lerp(camera.y, camera.targetY, CAMERA.smoothing);

  let halfW = viewW / 2;
  let halfH = viewH / 2;
  camera.x = constrain(camera.x, halfW, CANVAS_WIDTH - halfW);
  camera.y = constrain(camera.y, halfH, CANVAS_HEIGHT - halfH);
}

function beginCameraView() {
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
  translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  scale(CAMERA.zoom);
  translate(-(camera.x + wobbleX), -(camera.y + wobbleY));
}

function endCameraView() {
  pop();
}

const STATE = {
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
const SEASICK_RATE = 0.3; // gain per frame while moving
const SEASICK_DECAY = 0.005; // loss per frame while still
const FAINT_FLASHES = 6; // total flash count before restart
const FAINT_FLASH_FRAMES = 12; // frames per flash

// Seasickness effects — past these thresholds the player moves sluggishly
// and the camera sways a little, growing worse as the meter fills further.
const SEASICK_LAG_TIER1 = SEASICK_MAX / 3;
const SEASICK_LAG_TIER2 = (SEASICK_MAX * 2) / 3;
const SEASICK_LAG_TIERS = [
  { threshold: SEASICK_LAG_TIER2, speedMultiplier: 0.55, wobbleAmp: 9, wobbleFreq: 0.35 }, // 2/3 full — slower, heavy sway
  { threshold: SEASICK_LAG_TIER1, speedMultiplier: 0.8, wobbleAmp: 7, wobbleFreq: 0.28 }, // 1/3 full — light slow, strong sway
];

// Returns the active tier config for the player's current seasickness, or null.
function getSeasickTier() {
  return SEASICK_LAG_TIERS.find((t) => player.seasickness >= t.threshold) || null;
}

// ── Intro / start-screen ship scene ────────────────────────────────────────
const INTRO = {
  // The deck platform the player stands on (tiled with platform_tile.png)
  // x: horizontal position, y: vertical position
  // tilesW: width in tiles, tilesH: height in tiles (each tile is 16px)
  platform: { x: 480, y: 464, tilesW: 16, tilesH: 1 },
  platform2: { x: 565, y: CANVAS_HEIGHT - 16, tilesW: 26, tilesH: 1 }, // right half, bottom

  // Outer-shell walls — stepped rectangles tracing the curved hull left edge.
  walls: [
    { x: 450, y: 312, w: 500, h: 52 }, // DECK
    { x: 460, y: 520, w: 100, h: 100 }, // VERTICAL WALL OML
    { x: 880, y: 330, w: 100, h: 140 }, //BOX ON THE RIGHT
    { x: 440, y: 300, w: 40, h: 300 },
  ],

  // Decorations — positioned on the deck inside the hull boundary
  hammock: { x: 540, y: 380, w: 140, h: 75 },
  parrot: { x: 590, y: 380, w: 48, h: 48 },

  // Door at the bottom-right; press E near it to enter Level 1
  door: { x: CANVAS_WIDTH - DOOR_W - 8, y: CANVAS_HEIGHT - DOOR_H - 8 },

  // Player spawns just above the deck
  playerStart: { x: 490, y: 400 },
};

const LEVELS = [
  {
    name: "Level 1 — Learning",
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
    spawnDoor: { x: 13, y: 228 },
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
let imgParrot;
let imgLantern;
let imgPlatformTile;
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
  imgParrot = loadImage("assets/images/parrot.png");
  imgLantern = loadImage("assets/images/lantern.png");
  imgPlatformTile = loadImage("assets/images/platform_tile.png");

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
  textFont("monospace");
  initIntroPlayer();
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

function drawIntroScreen() {
  // Background
  push();
  imageMode(CORNER);
  image(imgIntroBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pop();

  // Logo in upper left
  push();
  imageMode(CORNER);
  let logoX = 40;
  let logoY = 25;
  let logoW = 400;
  let logoH = logoW * (imgLogo.height / imgLogo.width);
  image(imgLogo, logoX, logoY, logoW, logoH);
  pop();

  // Instructions
  push();
  textFont("Verdana");
  textSize(14);
  textAlign(LEFT, TOP);
  strokeWeight(3);
  stroke(0);
  fill(0);
  text("A / D to move, W to jump", logoX, logoY + logoH + 20);
  text("Press E to interact", logoX, logoY + logoH + 40);
  noStroke();
  fill(255);
  text("A / D to move, W to jump", logoX, logoY + logoH + 20);
  text("Press E to interact", logoX, logoY + logoH + 40);
  pop();

  // Decorations (behind player)
  push();
  imageMode(CORNER);
  image(
    imgHammock,
    INTRO.hammock.x,
    INTRO.hammock.y,
    INTRO.hammock.w,
    INTRO.hammock.h,
  );
  image(
    imgParrot,
    INTRO.parrot.x,
    INTRO.parrot.y,
    INTRO.parrot.w,
    INTRO.parrot.h,
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

  // Door — opens when E is pressed
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

  // Interaction prompt above door (only when door is closed)
  if (!introDoorOpen) {
    let promptX = INTRO.door.x + DOOR_W / 2;
    let promptY = INTRO.door.y - 20;
    drawInteractionPrompt(promptX, promptY);
  }

  // Handle intro door delay timer
  if (introDelayTimer > 0) {
    introDelayTimer--;
    if (introDelayTimer === 0) {
      loadLevel(0);
      gameState = STATE.PLAYING;
    }
  }

  // Player physics (runs every frame in STATE.START)
  handleInput();
  resolveIntroCollisions();
  applyIntroPhysics();
  clampToBounds();
  animateSprite();

  drawCharacter();
}

function draw() {
  background(0);

  if (gameState === STATE.START) {
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
    if (darkMode) {
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

function checkExitDoor() {
  if (winDelayTimer > 0 || exitDoorOpen) return;
  let level = LEVELS[currentLevel];
  if (!level.exitDoor) return;
  let ex = level.exitDoor.x + DOOR_W / 2;
  let ey = level.exitDoor.y + DOOR_H / 2;
  if (abs(player.x - ex) < 50 && abs(player.y - ey) < 70) {
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
  textFont("Verdana");
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
  if (gameState === STATE.START) {
    if (keyCode === ENTER) {
      loadLevel(0);
      gameState = STATE.PLAYING;
    }
    // E = enter door if player is close enough (with delay animation)
    if (keyCode === 69) {
      let dx = INTRO.door.x + DOOR_W / 2;
      let dy = INTRO.door.y + DOOR_H / 2;
      if (abs(player.x - dx) < 60 && abs(player.y - dy) < 80) {
        introDoorOpen = true;
        introDelayTimer = WIN_DELAY_FRAMES;
      }
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
      initIntroPlayer();
      gameState = STATE.START;
    }
  } else if (gameState === STATE.LOSE) {
    if (keyCode === 82) {
      loadLevel(currentLevel);
      gameState = STATE.PLAYING;
    }
    if (keyCode === ENTER) {
      initIntroPlayer();
      gameState = STATE.START;
    }
  }
}
