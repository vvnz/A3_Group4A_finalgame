// ============================================================
// A3 Final Game — Group 4A
// ============================================================
// [DETAILS]
// ============================================================

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

const SEASICK_MAX = 100;
const SEASICK_RATE = 0.20;     // gain per frame while moving
const SEASICK_DECAY = 0.005;   // loss per frame while still
const FAINT_FLASHES = 6;       // total flash count before restart
const FAINT_FLASH_FRAMES = 12; // frames per flash

const LEVELS = [
  {
    name: "Level 1 — Learning",
    background: "assets/images/lvl1background.png",
    backgroundColor: [38, 70, 110],
    start: { x: 40, y: 278 },
    platforms: [
      { x: 0, y: 306, w: 250, h: 16 },
      { x: 344, y: 263, w: 110, h: 16 },
      { x: 273, y: 327, w: 281, h: 16 },
      { x: 548, y: 306, w: 278, h: 16 },
      { x: 293, y: 409, w: 100, h: 16 },
      { x: 429, y: 430, w: 100, h: 16 },
      { x: 849, y: 388, w: 111, h: 16 },
      { x: 0, y: 469, w: 270, h: 16 },
      { x: 577, y: 469, w: 292, h: 16 },
    ],
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

let characterSheet;
let levelImages = [];

function preload() {
  characterSheet = loadImage("assets/images/spritesheet.png");

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
}

function draw() {
  if (gameState === STATE.START) {
    drawStartScreen();
  } else if (gameState === STATE.PLAYING) {
    drawLevel();
    drawPlatforms();
    handleInput();
    updateSeasickness();
    resolveHorizontalCollisions();
    applyPhysics();
    clampToBounds();
    animateSprite();
    drawCharacter();
    drawHUD();
  } else if (gameState === STATE.FAINTING) {
    drawLevel();
    drawPlatforms();
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
  if (player.isMoving) {
    player.seasickness = min(player.seasickness + SEASICK_RATE, SEASICK_MAX);
  } else {
    player.seasickness = max(player.seasickness - SEASICK_DECAY, 0);
  }

  if (player.seasickness >= SEASICK_MAX) {
    player.seasickness = SEASICK_MAX;
    player.faintTimer = 0;
    player.faintFlash = 0;
    player.isMoving = false;
    gameState = STATE.FAINTING;
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
  fill(120, 220, 110);
  stroke(40, 120, 50);
  strokeWeight(2);
  for (let i = 0; i < platforms.length; i++) {
    let p = platforms[i];
    rect(p.x, p.y, p.w, p.h);
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
  let meterX = CANVAS_WIDTH - 170;
  let meterY = 16;
  let meterW = 150;
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
  background(15, 25, 40);

  fill(255, 220, 120);
  textAlign(CENTER, CENTER);
  textSize(64);
  text("SEALEGS", width / 2, height / 2 - 80);

  fill(220);
  textSize(20);
  text("Earn your sealegs.", width / 2, height / 2 - 20);

  fill(180);
  textSize(16);
  text("A / D to move, W to jump", width / 2, height / 2 + 40);
  text("Press ENTER to start", width / 2, height / 2 + 70);
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
      gameState = STATE.START;
    }
  } else if (gameState === STATE.LOSE) {
    if (keyCode === 82) {
      loadLevel(currentLevel);
      gameState = STATE.PLAYING;
    }
    if (keyCode === ENTER) {
      gameState = STATE.START;
    }
  }
}
