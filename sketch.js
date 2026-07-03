// ============================================================
// A3 Final Game — Group 4A
// ============================================================
// [DETAILS]
// ============================================================

// Set to false once hitbox positions look right
const DEBUG_HITBOXES = true;

const SPRITE = {
  frameWidth: 171,
  frameHeight: 257,
  numFrames: 4,
  animSpeed: 20,
  scale: 0.25,
  rows: {
    down: 0,
    up: 1,
    left: 2,
    right: 3,
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
const RAT_SIZE = 48; // display size on canvas

const SEASICK_MAX = 100;
const SEASICK_RATE = 0.15; // gain per frame while moving
const SEASICK_DECAY = 0.005; // loss per frame while still
const FAINT_FLASHES = 6; // total flash count before restart
const FAINT_FLASH_FRAMES = 12; // frames per flash

// ── Intro / start-screen ship scene ────────────────────────────────────────
const INTRO = {
  // The deck platform the player stands on (drawn as brown rect)
  platform: { x: 510, y: 460, w: 250, h: 20 },

  // Outer-shell walls — stepped rectangles tracing the curved hull left edge.
  walls: [
    { x: 450, y: 312, w: 14, h: 52 }, // top of curved bow
    { x: 464, y: 364, w: 18, h: 50 },
    { x: 482, y: 414, w: 22, h: 50 },
    { x: 504, y: 464, w: 26, h: 50 },
    { x: 530, y: 514, w: 30, h: 86 }, // bottom-left curve
  ],

  // Decorations — positioned on the deck inside the hull boundary
  hammock: { x: 540, y: 380, w: 140, h: 75 },
  parrot: { x: 590, y: 380, w: 48, h: 48 },

  // Door at the bottom-right; press E near it to enter Level 1
  door: { x: CANVAS_WIDTH - DOOR_W - 8, y: CANVAS_HEIGHT - DOOR_H - 8 },

  // Player spawns just above the deck
  playerStart: { x: 580, y: 380 },
};

const LEVELS = [
  {
    name: "Level 1 — Learning",
    background: "assets/images/lvl1background.png",
    backgroundColor: [150, 75, 0],
    start: { x: 40, y: 200 },
    platforms: [
      { x: 0, y: 306, w: 250, h: 16 },
      { x: 234, y: 306, w: 16, h: 60 }, //vertical wall 1.1
      { x: 330, y: 250, w: 130, h: 16 }, //floating platform
      { x: 250, y: 350, w: 300, h: 16 }, //spike platform
      { x: 546, y: 306, w: 16, h: 60 }, //vertical wall 1.2
      { x: 548, y: 306, w: 278, h: 16 }, //after spike platform
      { x: 323, y: 430, w: 100, h: 16 }, //floating staircase 2
      { x: 463, y: 490, w: 100, h: 16 }, //floating staircase 1
      { x: 850, y: 394, w: 16, h: 140 }, //vertical wall 3
      { x: 849, y: 390, w: 111, h: 16 }, //top of vertical wall 3
      { x: 0, y: 540, w: 270, h: 16 },
      { x: 577, y: 529, w: 292, h: 16 }, //floating staircase 1
      { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
      { x: 488, y: CANVAS_HEIGHT - 16 - 44, w: 40, h: 44, barrel: true },
    ],
    spikes: [{ x: 254, y: 350, w: 295 }],
    rat: { minX: 270, maxX: 455 },
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
let exitDoorOpen = false;
let introDoorOpen = false;
let winDelayTimer = 0;
let introDelayTimer = 0;
const WIN_DELAY_FRAMES = 90; // 2 seconds at 60fps

function preload() {
  characterSheet = loadImage("assets/images/spritesheet.png");
  imgIntroBg = loadImage("assets/images/backround_intro.PNG");
  imgLogo = loadImage("assets/images/sealegs_logo.png");
  imgRat = loadImage("assets/images/rat.png");
  imgBarrel = loadImage("assets/images/barrel.png");
  imgDoorClosed = loadImage("assets/images/doorclose.png");
  imgDoorOpen = loadImage("assets/images/dooropen.png");
  imgHammock = loadImage("assets/images/hammock.png");
  imgParrot = loadImage("assets/images/parrot.png");

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
  return [INTRO.platform, ...INTRO.walls];
}

function resolveIntroCollisions() {
  let colliders = getIntroColliders();
  for (let p of colliders) {
    let withinY =
      player.y + player.hh > p.y && player.y - player.hh < p.y + p.h;
    if (!withinY) continue;

    let pl = player.x - player.hw;
    let pr = player.x + player.hw;
    let bl = p.x;
    let br = p.x + p.w;

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
  player.vy += PHYSICS.gravity;
  player.vy = constrain(player.vy, -PHYSICS.jumpStrength, PHYSICS.maxFallSpeed);

  let prevBottom = player.y + player.hh;
  let prevTop = player.y - player.hh;
  player.y += player.vy;
  player.onGround = false;

  let colliders = getIntroColliders();
  for (let p of colliders) {
    let withinX =
      player.x + player.hw > p.x && player.x - player.hw < p.x + p.w;
    if (!withinX) continue;

    let top = p.y;
    let bottom = p.y + p.h;

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

  // Brown platform (always visible)
  push();
  rectMode(CORNER);
  fill(101, 67, 33);
  stroke(60, 35, 10);
  strokeWeight(2);
  let dp = INTRO.platform;
  rect(dp.x, dp.y, dp.w, dp.h);
  pop();

  // Debug: hull outer-shell wall outlines only (no player box)
  if (DEBUG_HITBOXES) {
    push();
    rectMode(CORNER);
    noFill();
    stroke(255, 0, 0);
    strokeWeight(2);
    // platform outline
    rect(dp.x, dp.y, dp.w, dp.h);
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

  // "Press E" label above door (only when door is closed)
  if (!introDoorOpen) {
    let labelX = INTRO.door.x + DOOR_W / 2;
    let labelY = INTRO.door.y - 12;
    push();
    textSize(11);
    textAlign(CENTER, BOTTOM);
    strokeWeight(3);
    stroke(0);
    fill(0);
    text("Press E to enter", labelX, labelY);
    noStroke();
    fill(255);
    text("Press E to enter", labelX, labelY);
    pop();
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
      if (winDelayTimer === 0) gameState = STATE.WIN;
    }
    updateSeasickness();
    resolveHorizontalCollisions();
    applyPhysics();
    clampToBounds();
    checkSpikeCollision();
    updateRat();
    checkRatCollision();
    drawRat();
    animateSprite();
    drawCharacter();
    drawHUD();
  } else if (gameState === STATE.FAINTING) {
    drawLevel();
    drawPlatforms();
    drawSpikes();
    drawDoors();
    drawRat();
    updateFainting();
    drawCharacter();
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

  if (keyIsDown(65)) {
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    player.x += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
  if (keyIsDown(87) && player.onGround) {
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
  push();
  imageMode(CENTER);
  translate(rat.x, ratY);
  // image faces left by default — flip horizontally when moving right
  if (rat.dir === 1) scale(-1, 1);
  image(imgRat, 0, 0, RAT_SIZE, RAT_SIZE);
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
  let spikes = LEVELS[currentLevel].spikes || [];
  for (let i = 0; i < spikes.length; i++) {
    let s = spikes[i];
    let left = s.x;
    let right = s.x + s.w;
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
  let platforms = LEVELS[currentLevel].platforms || [];
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    let withinY =
      player.y + player.hh > p.y && player.y - player.hh < p.y + p.h;
    if (!withinY) continue;

    let pl = player.x - player.hw;
    let pr = player.x + player.hw;
    let bl = p.x;
    let br = p.x + p.w;

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
  player.vy += PHYSICS.gravity;
  player.vy = constrain(player.vy, -PHYSICS.jumpStrength, PHYSICS.maxFallSpeed);

  let prevTop = player.y - player.hh;
  let prevBottom = player.y + player.hh;
  player.y += player.vy;
  player.onGround = false;

  let platforms = LEVELS[currentLevel].platforms || [];
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    let withinX =
      player.x + player.hw > p.x && player.x - player.hw < p.x + p.w;
    if (!withinX) continue;

    let top = p.y;
    let bottom = p.y + p.h;

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
  let platforms = LEVELS[currentLevel].platforms || [];
  push();
  rectMode(CORNER);
  imageMode(CORNER);
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    if (p.barrel) {
      image(imgBarrel, p.x, p.y, p.w, p.h);
    } else {
      fill(101, 67, 33);
      stroke(60, 35, 10);
      strokeWeight(2);
      rect(p.x, p.y, p.w, p.h);
    }
  }
  pop();
}

function drawSpikes() {
  let spikes = LEVELS[currentLevel].spikes || [];
  push();
  rectMode(CORNER);
  fill(150);
  stroke(90);
  strokeWeight(1);
  for (let i = 0; i < spikes.length; i++) {
    let s = spikes[i];
    let count = floor(s.w / SPIKE_W);
    for (let j = 0; j < count; j++) {
      let lx = s.x + j * SPIKE_W;
      triangle(lx, s.y, lx + SPIKE_W, s.y, lx + SPIKE_W / 2, s.y - SPIKE_H);
    }
  }
  pop();
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

  // "Press E to open" label above exit door
  if (!exitDoorOpen) {
    let labelX = ex + DOOR_W / 2;
    let labelY = ey - 14;
    textSize(11);
    textAlign(CENTER, BOTTOM);
    strokeWeight(3);
    stroke(0);
    fill(0);
    text("Press E to open", labelX, labelY);
    noStroke();
    fill(255);
    text("Press E to open", labelX, labelY);
  }

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
    if (keyCode === 69) {
      let level = LEVELS[currentLevel];
      if (level.exitDoor) {
        let ex = level.exitDoor.x + DOOR_W / 2;
        let ey = level.exitDoor.y + DOOR_H / 2;
        if (abs(player.x - ex) < 50 && abs(player.y - ey) < 70) {
          exitDoorOpen = true;
          winDelayTimer = WIN_DELAY_FRAMES;
        }
      }
    }
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
