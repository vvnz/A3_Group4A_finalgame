// ============================================================
// Level 3 Extras — Cannon + extra patrolling rats
// ============================================================
// Kept entirely separate from sketch.js/lantern.js/phantom.js, same reason
// as debugpanel.js: this never conflicts with teammates editing those
// files. Everything here wraps sketch.js's own update/draw/collision
// functions (updateRat, drawRat, checkRatCollision, handleInput, loadLevel)
// by reassigning the global identifier to a new function that calls the
// original — no existing file is edited to wire this up.
//
// Two things live here because sketch.js's built-in rat system only
// supports one ground-level rat per level (drawRat()/checkRatCollision()
// hard-code the rat to CANVAS_HEIGHT - 16), which can't represent Level 3's
// elevated Rat 1: a cannon that fires cannonballs down the tunnel, and two
// extra patrolling rats (one on an upper ledge, one near the exit).

// Cannons, keyed by level index. Each cannon fires straight along a fixed
// y at a steady interval; `direction` is -1 (fires left) or 1 (fires
// right). Runtime fire-timer state is stored directly on each entry.
const CANNONS = {
  0: [],
  1: [],
  2: [
    // For this pass the cannon is a static BLACK SQUARE placeholder at the
    // right end of the tunnel floor (LEVELS[2], top 448) — mechanics are
    // intentionally not wired up. `placeholder: true` skips all firing.
    {
      x: 904,
      y: 424, // sits on the tunnel floor (top 448); square is 48px tall
      w: 48,
      h: 48,
      placeholder: true,
    },
  ],
};

const CANNON_BALL_RADIUS = 8;
const CANNON_KNOCKBACK_DISTANCE = 70; // medium push, away from the cannon
const CANNON_SEASICK_HIT = 35; // moderate seasickness jump on hit
const CANNON_LAG_FRAMES = 180; // ~3s at 60fps
const CANNON_LAG_SPEED_MULTIPLIER = 0.5; // noticeably slow, not crippling

let cannonballs = [];

// Extra rats, keyed by level index. Each patrols minX..maxX at a fixed y
// (unlike the single official rat, which is always at ground level).
// Runtime x/dir state is stored directly on each entry.
const EXTRA_RATS = {
  0: [],
  1: [],
  2: [
    // Mouse 1 — patrols the upper-left ledge (LEVELS[2] platform 32..208,
    // top 320); the double-arrow on the sketch is its patrol span.
    { minX: 64, maxX: 176, y: 320 - RAT_SIZE / 2 },
    // Mouse 2 — patrols the ground floor between the spikes and the exit
    // door; a bit more roam to the left now that the rightmost spike is gone
    // (nearest spike ends at x:512, so it stays well clear).
    { minX: 700, maxX: 860, y: CANVAS_HEIGHT - 16 - RAT_SIZE / 2 },
  ],
};

// Resets all per-level runtime state — called whenever a level (re)loads,
// so cannonballs/timers/rat positions never carry over from a previous
// attempt or a different level.
function resetLevel3Extras() {
  cannonballs = [];
  for (let c of CANNONS[currentLevel] || []) c.timer = 0;
  for (let r of EXTRA_RATS[currentLevel] || []) {
    r.x = r.minX;
    r.dir = 1;
  }
  player.cannonLagTimer = 0;
}

function updateExtraRats() {
  for (let r of EXTRA_RATS[currentLevel] || []) {
    if (r.x === undefined) {
      r.x = r.minX;
      r.dir = 1;
    }
    r.x += RAT_SPEED * r.dir;
    if (r.x >= r.maxX) {
      r.x = r.maxX;
      r.dir = -1;
    } else if (r.x <= r.minX) {
      r.x = r.minX;
      r.dir = 1;
    }
  }
}

function updateCannons() {
  for (let c of CANNONS[currentLevel] || []) {
    if (c.placeholder) continue; // static black square — no firing
    c.timer = (c.timer || 0) + 1;
    if (c.timer >= c.fireIntervalFrames) {
      c.timer = 0;
      cannonballs.push({
        x: c.x,
        y: c.y,
        vx: c.direction * c.ballSpeed,
        r: CANNON_BALL_RADIUS,
      });
    }
  }
  for (let ball of cannonballs) ball.x += ball.vx;
  cannonballs = cannonballs.filter(
    (b) => b.x > -50 && b.x < CANVAS_WIDTH + 50,
  );
}

function checkExtraRatCollision() {
  let ratHalf = RAT_SIZE / 2;
  for (let r of EXTRA_RATS[currentLevel] || []) {
    if (r.x === undefined) continue;
    if (
      player.x + player.hw > r.x - ratHalf &&
      player.x - player.hw < r.x + ratHalf &&
      player.y + player.hh > r.y - ratHalf &&
      player.y - player.hh < r.y + ratHalf
    ) {
      triggerFaint();
      return;
    }
  }
}

// On hit: the ball is consumed, the player is knocked away from the cannon,
// seasickness jumps, and movement is laggy (see the handleInput() wrap
// below) for the next few seconds.
function checkCannonballCollision() {
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    let ball = cannonballs[i];
    let hit =
      player.x + player.hw > ball.x - ball.r &&
      player.x - player.hw < ball.x + ball.r &&
      player.y + player.hh > ball.y - ball.r &&
      player.y - player.hh < ball.y + ball.r;
    if (!hit) continue;

    cannonballs.splice(i, 1);
    let knockDir = ball.vx < 0 ? -1 : 1;
    player.x += knockDir * CANNON_KNOCKBACK_DISTANCE;
    player.x = constrain(player.x, player.hw, CANVAS_WIDTH - player.hw);
    player.seasickness = min(
      player.seasickness + CANNON_SEASICK_HIT,
      SEASICK_MAX,
    );
    player.cannonLagTimer = CANNON_LAG_FRAMES;
  }
}

function drawExtraRats() {
  for (let r of EXTRA_RATS[currentLevel] || []) {
    if (r.x === undefined) continue;
    let ratWidth = RAT_SIZE * (imgRat.width / imgRat.height);
    push();
    imageMode(CENTER);
    translate(r.x, r.y);
    // imgRat faces left by default — flip horizontally when moving right,
    // matching sketch.js's own drawRat().
    if (r.dir === 1) scale(-1, 1);
    image(imgRat, 0, 0, ratWidth, RAT_SIZE);
    pop();
  }
}

function drawCannons() {
  push();
  rectMode(CENTER);
  for (let c of CANNONS[currentLevel] || []) {
    if (c.placeholder) {
      // Plain black square placeholder — mechanics ignored for this pass.
      noStroke();
      fill(0);
      rect(c.x, c.y, c.w || 44, c.h || 44);
      continue;
    }
    stroke(20);
    strokeWeight(2);
    fill(60);
    rect(c.x, c.y, 44, 20, 4); // barrel body
    noStroke();
    fill(30);
    circle(c.x + c.direction * 24, c.y, 16); // muzzle end
  }
  pop();
}

function drawCannonballs() {
  push();
  noStroke();
  fill(20);
  for (let ball of cannonballs) circle(ball.x, ball.y, ball.r * 2);
  pop();
}

// ── Wrapping sketch.js's functions instead of editing sketch.js ────────────

const __originalLoadLevel = loadLevel;
loadLevel = function (index) {
  __originalLoadLevel(index);
  resetLevel3Extras();
};

const __originalUpdateRat = updateRat;
updateRat = function () {
  __originalUpdateRat.apply(this, arguments);
  updateExtraRats();
  updateCannons();
  if (player.cannonLagTimer > 0) player.cannonLagTimer--;
};

const __originalCheckRatCollision = checkRatCollision;
checkRatCollision = function () {
  __originalCheckRatCollision.apply(this, arguments);
  checkExtraRatCollision();
  checkCannonballCollision();
};

const __originalDrawRat = drawRat;
drawRat = function () {
  __originalDrawRat.apply(this, arguments);
  drawExtraRats();
  drawCannons();
  drawCannonballs();
};

// Applies the post-hit movement lag by temporarily scaling player.speed
// around the original handleInput() call, so it stacks naturally with the
// existing seasickness speed tiers instead of duplicating that logic.
const __originalHandleInput = handleInput;
handleInput = function () {
  let originalSpeed = player.speed;
  if (player.cannonLagTimer > 0) {
    player.speed = originalSpeed * CANNON_LAG_SPEED_MULTIPLIER;
  }
  __originalHandleInput.apply(this, arguments);
  player.speed = originalSpeed;
};
