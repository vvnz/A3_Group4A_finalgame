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

const STATE = {
  START: "start",
  PLAYING: "playing",
  WIN: "win",
  LOSE: "lose",
};

const LEVELS = [
  {
    name: "Level 1 — Learning",
    background: null,
    backgroundColor: [38, 70, 110],
    start: { x: 100, y: 320 },
  },
  {
    name: "Level 2 — Pressure",
    background: null,
    backgroundColor: [40, 55, 80],
    start: { x: 100, y: 320 },
  },
  {
    name: "Level 3 — Mastery",
    background: null,
    backgroundColor: [25, 30, 45],
    start: { x: 100, y: 320 },
  },
];

let gameState = STATE.START;
let currentLevel = 0;

let player = {
  x: 0,
  y: 0,
  speed: 3,
  currentFrame: 0,
  frameTimer: 0,
  direction: "down",
  isMoving: false,
  hw: 18,
  hh: 28,
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
    handleInput();
    clampToBounds();
    animateSprite();
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
  player.direction = "down";
  player.currentFrame = 0;
  player.frameTimer = 0;
  player.isMoving = false;
}

function drawLevel() {
  let level = LEVELS[currentLevel];

  if (levelImages[currentLevel]) {
    push();
    imageMode(CORNER);
    image(levelImages[currentLevel], 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    pop();
  } else {
    let c = level.backgroundColor;
    background(c[0], c[1], c[2]);
  }
}

function handleInput() {
  player.isMoving = false;

  if (keyIsDown(87)) {
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(83)) {
    player.y += player.speed;
    player.direction = "down";
    player.isMoving = true;
  }
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
}

function clampToBounds() {
  player.x = constrain(player.x, player.hw, CANVAS_WIDTH - player.hw);
  player.y = constrain(player.y, player.hh, CANVAS_HEIGHT - player.hh);
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
  noStroke();
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(LEVELS[currentLevel].name, 16, 16);
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
  text("WASD to move", width / 2, height / 2 + 40);
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
