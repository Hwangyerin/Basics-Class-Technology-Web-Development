function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
  });
}

// 충돌 판정 함수
function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

// 전역 변수
let heroImg, enemyImg, lifeImg, laserImg, laserRedShotImg, laserGreenImg, laserGreenShotImg, background;
let canvas, ctx;
let gameObjects = [];
let hero;
let eventEmitter;
let gameLoopId = null;

/* =========================================================
    스테이지 변경 관련 함수들 — initGame() 밖으로 이동
========================================================= */

function spawnEnemy(x, y) {
  const e = new Enemy(x, y);
  e.img = enemyImg;
  gameObjects.push(e);
}

function createStage(stage) {
  // 기존 Enemy 관련 오브젝트만 삭제
  gameObjects = gameObjects.filter(obj =>
    obj.type !== "Enemy" &&
    obj.type !== "Laser" &&
    obj.type !== "SubLaser" &&
    obj.type !== "Explosion" &&
    obj.type !== "GreenExplosion"
  );

  const W = 98;
  const H = 50;
  const centerX = canvas.width / 2;

  switch(stage) {
    case 1: // 기본 5x5 배열
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          spawnEnemy(centerX + (x - 2) * W, y * H);
        }
      }
      break;

    case 2: // 삼각형 배열
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x <= y; x++) {
          spawnEnemy(centerX + (x - y / 2) * W, y * H);
        }
      }
      break;

    case 3: // 짝수 열만 등장
      for (let x = 0; x < 5; x++) {
        if (x % 2 === 0) {
          for (let y = 0; y < 5; y++) {
            spawnEnemy(centerX + (x - 2) * W, y * H);
          }
        }
      }
      break;

    case 4: // 지그재그
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const offset = (y % 2 === 0) ? 0 : W / 2;
          spawnEnemy(centerX + (x - 2) * W + offset, y * H);
        }
      }
      break;

    case 5: // X자 패턴
      for (let i = 0; i < 5; i++) {
        spawnEnemy(centerX + (i - 2) * W, i * H);
        spawnEnemy(centerX + (i - 2) * W, (4 - i) * H);
      }
      break;
  }
}

/* =========================================================
    EventEmitter
========================================================= */

class EventEmitter {
  constructor() { this.listeners = {}; }
  on(message, listener) {
    if (!this.listeners[message]) this.listeners[message] = [];
    this.listeners[message].push(listener);
  }
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
  clear() { this.listeners = {}; }
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
  GAME_END_LOSS: "GAME_END_LOSS",
  GAME_END_WIN: "GAME_END_WIN",
  KEY_EVENT_ENTER: "KEY_EVENT_ENTER",
};

/* =========================================================
    GameObject
========================================================= */

class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }
  rectFromGameObject() {
    return {
      top: this.y,
      left: this.x,
      bottom: this.y + this.height,
      right: this.x + this.width,
    };
  }
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

/* =========================================================
    HERO, SubShip, Enemy, Lasers, Explosions
========================================================= */

class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = "Hero";
    this.cooldown = 0;
    this.life = 3;
    this.points = 0;
  }

  fire() {
    if (this.canFire()) {
      gameObjects.push(new Laser(this.x + this.width / 2 - 5, this.y - 10));
      this.cooldown = 500;

      const cid = setInterval(() => {
        this.cooldown -= 100;
        if (this.cooldown <= 0) clearInterval(cid);
      }, 100);
    }
  }

  canFire() { return this.cooldown === 0; }

  decrementLife() {
    this.life--;
    if (this.life <= 0) this.dead = true;
  }

  incrementPoints() { this.points += 100; }
}

class SubShip extends GameObject {
  constructor(x, y, hero) {
    super(x, y);
    this.hero = hero;
    this.width = hero.width * 0.5;
    this.height = hero.height * 0.5;
    this.type = "SubShip";
    this.img = heroImg;

    this.offsetX = 0;
    this.offsetY = (hero.height - this.height) / 2;

    this.fireLoop = setInterval(() => this.fire(), 1800);
  }

  fire() {
    gameObjects.push(new SubLaser(this.x + this.width / 2 - 3, this.y - 5));
  }

  update() {
    this.x = this.hero.x + this.offsetX;
    this.y = this.hero.y + this.offsetY;
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";

    let id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        clearInterval(id);
      }
    }, 300);
  }
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 9;
    this.height = 33;
    this.type = "Laser";
    this.img = laserImg;

    const id = setInterval(() => {
      this.y -= 15;
      if (this.y < -50) {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class SubLaser extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 6;
    this.height = 20;
    this.type = "SubLaser";
    this.img = laserGreenImg;

    const id = setInterval(() => {
      this.y -= 12;
      if (this.y < -50) {
        this.dead = true;
        clearInterval(id);
      }
    }, 100);
  }
}

class Explosion extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 40;
    this.height = 40;
    this.type = "Explosion";
    this.img = laserRedShotImg;
    setTimeout(() => this.dead = true, 150);
  }
}

class GreenExplosion extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 30;
    this.height = 30;
    this.type = "GreenExplosion";
    this.img = laserGreenShotImg;
    setTimeout(() => this.dead = true, 150);
  }
}

/* =========================================================
    게임 초기화
========================================================= */

function initGame() {
  gameObjects = [];
  eventEmitter = new EventEmitter();

  createStage(1);
  createHero();

  eventEmitter.on(Messages.KEY_EVENT_UP, () => (hero.y -= 5));
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => (hero.y += 5));
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => (hero.x -= 5));
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => (hero.x += 5));
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => hero.fire());
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => resetGame());

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();
    if (isEnemiesDead()) eventEmitter.emit(Messages.GAME_END_WIN);
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    const explosionX = first.x + first.width / 2 - 20;
    const explosionY = first.y - 10;
    gameObjects.push(new Explosion(explosionX, explosionY));
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead()) eventEmitter.emit(Messages.GAME_END_LOSS);
    else if (isEnemiesDead()) eventEmitter.emit(Messages.GAME_END_WIN);
  });

  eventEmitter.on(Messages.GAME_END_WIN, () => endGame(true));
  eventEmitter.on(Messages.GAME_END_LOSS, () => endGame(false));
}

/* =========================================================
    HERO 생성
========================================================= */

function createHero() {
  hero = new Hero(canvas.width / 2 - 45, canvas.height - canvas.height / 4);
  hero.img = heroImg;
  gameObjects.push(hero);

  createSubShips(hero);
}

function createSubShips(hero) {
  const SUB_SCALE = 0.5;
  const subWidth = hero.width * SUB_SCALE;
  const subHeight = hero.height * SUB_SCALE;
  const GAP = 10;

  const left = new SubShip(
    hero.x - subWidth - GAP,
    hero.y + (hero.height - subHeight) / 2,
    hero
  );
  left.offsetX = -subWidth - GAP;

  const right = new SubShip(
    hero.x + hero.width + GAP,
    hero.y + (hero.height - subHeight) / 2,
    hero
  );
  right.offsetX = hero.width + GAP;

  gameObjects.push(left);
  gameObjects.push(right);
}

/* =========================================================
    Draw + Update
========================================================= */

function drawGameObjects(ctx) {
  gameObjects.forEach((obj) => obj.draw(ctx));
}

function updateGameObjects() {
  const enemies = gameObjects.filter((obj) => obj.type === "Enemy");
  const lasers = gameObjects.filter((obj) => obj.type === "Laser");
  const subLasers = gameObjects.filter((obj) => obj.type === "SubLaser");

  // SubShip 충돌
  const subShips = gameObjects.filter(obj => obj.type === "SubShip");
  subShips.forEach(sub => {
    enemies.forEach(enemy => {
      if (intersectRect(sub.rectFromGameObject(), enemy.rectFromGameObject())) {
        sub.dead = true;
        enemy.dead = true;
        if (sub.fireLoop) clearInterval(sub.fireLoop);
        hero.decrementLife();
        if (isHeroDead()) eventEmitter.emit(Messages.GAME_END_LOSS);
      }
    });
  });

  // SubLaser 충돌
  subLasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        l.dead = true;
        m.dead = true;

        const explosionX = l.x + l.width / 2 - 15;
        const explosionY = l.y - 5;
        gameObjects.push(new GreenExplosion(explosionX, explosionY));

        hero.incrementPoints();
      }
    });
  });

  // Laser 충돌
  lasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, { first: l, second: m });
      }
    });
  });

  // Hero 충돌
  enemies.forEach(enemy => {
    if (intersectRect(hero.rectFromGameObject(), enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  });

  gameObjects = gameObjects.filter((obj) => !obj.dead);

  gameObjects.forEach(obj => {
    if (typeof obj.update === "function") obj.update();
  });
}

/* =========================================================
    UI Draw
========================================================= */

function drawLife() {
  const START_POS = canvas.width - 180;
  for(let i = 0; i < hero.life; i++) {
    ctx.drawImage(lifeImg, START_POS + (45 * (i+1)), canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = "30px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("POINTS: " + hero.points, 10, canvas.height - 20);
}

function isHeroDead() { return hero.life <= 0; }

function isEnemiesDead() {
  return !gameObjects.some(obj => obj.type === "Enemy" && !obj.dead);
}

function displayMessage(message, color = "red") {
  ctx.font = "30px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/* =========================================================
    게임 종료 / 재시작
========================================================= */

function endGame(win) {
  clearInterval(gameLoopId);
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (win) {
      displayMessage("Victory!!! Press [Enter] to start a new game", "green");
    } else {
      displayMessage("You died !!! Press [Enter] to restart");
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) clearInterval(gameLoopId);

  gameObjects.forEach(obj => {
    if (obj.fireLoop) clearInterval(obj.fireLoop);
  });

  gameObjects = [];
  eventEmitter.clear();
  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pattern = ctx.createPattern(background, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateGameObjects();
    drawGameObjects(ctx);
    drawPoints();
    drawLife();
  }, 100);
}

/* =========================================================
    키 입력 처리
========================================================= */

window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
  else if (evt.key === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  else if (evt.key === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  else if (evt.key === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  else if (evt.key === " ") eventEmitter.emit(Messages.KEY_EVENT_SPACE);
  else if (evt.key === "Enter") eventEmitter.emit(Messages.KEY_EVENT_ENTER);

  // 숫자키 = 바로 스테이지 변경
  else if (evt.key === "1") createStage(1);
  else if (evt.key === "2") createStage(2);
  else if (evt.key === "3") createStage(3);
  else if (evt.key === "4") createStage(4);
  else if (evt.key === "5") createStage(5);
});

window.addEventListener("keydown", (e) => {
  if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
});

/* =========================================================
    MAIN GAME LOOP
========================================================= */

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");
  laserRedShotImg = await loadTexture("assets/laserRedShot.png");
  lifeImg = await loadTexture("assets/life.png");
  background = await loadTexture("assets/starBackground.png");
  laserGreenImg = await loadTexture("assets/laserGreen.png");
  laserGreenShotImg = await loadTexture("assets/laserGreenShot.png");

  initGame();

  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pattern = ctx.createPattern(background, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGameObjects(ctx);
    updateGameObjects();
    drawPoints();
    drawLife();
  }, 100);
};
