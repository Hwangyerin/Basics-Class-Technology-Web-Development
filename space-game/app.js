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
let heroImg, enemyImg, laserImg, laserRedShotImg;
let canvas, ctx;
let gameObjects = [];
let hero;
let eventEmitter;

// EventEmitter
class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
}

const Messages = {
  KEY_EVENT_UP: "KEY_EVENT_UP",
  KEY_EVENT_DOWN: "KEY_EVENT_DOWN",
  KEY_EVENT_LEFT: "KEY_EVENT_LEFT",
  KEY_EVENT_RIGHT: "KEY_EVENT_RIGHT",
  KEY_EVENT_SPACE: "KEY_EVENT_SPACE",
  COLLISION_ENEMY_LASER: "COLLISION_ENEMY_LASER",
};

// GameObject
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

// HERO
class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 99;
    this.height = 75;
    this.type = "Hero";
    this.cooldown = 0;
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

  canFire() {
    return this.cooldown === 0;
  }
}

// ENEMY
class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 98;
    this.height = 50;
    this.type = "Enemy";
    this.img = enemyImg;
  }
}

// LASER
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

// Explosion
class Explosion extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.width = 40;
    this.height = 40;
    this.type = "Explosion";
    this.img = laserRedShotImg;
    setTimeout(() => {
      this.dead = true;
    }, 150);
  }
}


// GAME INITIALIZE
function initGame() {
  gameObjects = [];
  eventEmitter = new EventEmitter();

  createEnemies();
  createHero();

  eventEmitter.on(Messages.KEY_EVENT_UP, () => (hero.y -= 5));
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => (hero.y += 5));
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => (hero.x -= 5));
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => (hero.x += 5));
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => hero.fire());

  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
  });
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true; 
    second.dead = true;
    const explosionX = first.x + first.width / 2 - 20;  
    const explosionY = first.y - 10;

    gameObjects.push(new Explosion(explosionX, explosionY));
});


}

// create HERO
function createHero() {
  hero = new Hero(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );
  hero.img = heroImg;
  gameObjects.push(hero);
}

// create ENEMY 
function createEnemies() {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;

  for (let x = 0; x < MONSTER_TOTAL; x++) {
    for (let y = 0; y < 5; y++) {
      const enemy = new Enemy(
        START_X + x * 98,
        y * 50
      );
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

// DRAW + UPDATE

function drawGameObjects(ctx) {
  gameObjects.forEach((obj) => obj.draw(ctx));
}

function updateGameObjects() {
  const enemies = gameObjects.filter((obj) => obj.type === "Enemy");
  const lasers = gameObjects.filter((obj) => obj.type === "Laser");

  lasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: l,
          second: m,
        });
      }
    });
  });

  gameObjects = gameObjects.filter((obj) => !obj.dead);
}

// 키 이벤트
window.addEventListener("keyup", (evt) => {
  if (evt.key === "ArrowUp") eventEmitter.emit(Messages.KEY_EVENT_UP);
  else if (evt.key === "ArrowDown") eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  else if (evt.key === "ArrowLeft") eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  else if (evt.key === "ArrowRight") eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  else if (evt.keyCode === 32) eventEmitter.emit(Messages.KEY_EVENT_SPACE);
});

window.addEventListener("keydown", (e) => {
  if ([32, 37, 38, 39, 40].includes(e.keyCode)) e.preventDefault();
});

// MAIN GAME LOOP
window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  heroImg = await loadTexture("assets/player.png");
  enemyImg = await loadTexture("assets/enemyShip.png");
  laserImg = await loadTexture("assets/laserRed.png");
  laserRedShotImg = await loadTexture("assets/laserRedShot.png");


  initGame();

  setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGameObjects(ctx);
    updateGameObjects();
  }, 100);
};
