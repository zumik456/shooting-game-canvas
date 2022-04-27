const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const cW = (canvas.width = innerWidth);
const cH = (canvas.height = innerHeight);
let projectiles = [];
let enemies = [];
let particles = [];
const friction = 0.98;
let animationId;
const scoreElem = document.querySelector("#scoreCount");
let score = 0;
const startGameBtn = document.getElementById("start-game-btn");
const gameOverModal = document.getElementById("game-over-modal");
const finalScoreElem = document.getElementById("final-score-elem");

function init() {
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  scoreElem.innerHTML = score;
  finalScoreElem.innerHTML = score;
}

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class Projectile extends Player {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color);
    this.velocity = velocity;
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy extends Projectile {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
  }
}

class Particle extends Projectile {
  constructor(x, y, radius, color, velocity) {
    super(x, y, radius, color, velocity);
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    super.draw();
    ctx.restore();
  }
  update() {
    super.update();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.alpha -= 0.01;
  }
}

function spawnEnemies() {
  let x, y;
  setInterval(() => {
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const radius = Math.random() * 26 + 4;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -radius : cW + radius;
      y = Math.random() * cH;
    } else {
      x = Math.random() * cW;
      y = Math.random() < 0.5 ? -radius : cH + radius;
    }
    const angle = Math.atan2(cH / 2 - y, cW / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

function animate() {
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = "rgb(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, cW, cH);
  player.draw();
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });
  projectiles.forEach((projectile, index) => {
    projectile.update();

    if (
      // remove from edges of screen
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > cW ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > cH
    ) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, eIndex) => {
    enemy.update();

    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist - enemy.radius - player.radius < 1) {
      // end game
      cancelAnimationFrame(animationId);
      gameOverModal.style.display = "block";
      finalScoreElem.innerHTML = score;
    }

    projectiles.forEach((projectile, pIndex) => {
      const dist = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
      if (dist - enemy.radius - projectile.radius < 1) {
        // when projectiles touch enemy
        score += 10;
        scoreElem.innerHTML = score;
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(projectile.x, projectile.y, 2, enemy.color, {
              x: (Math.random() - 0.5) * (Math.random() * 5),
              y: (Math.random() - 0.5) * (Math.random() * 5),
            })
          );
        }
        if (enemy.radius - 10 > 7) {
          score += 10;
          scoreElem.innerText = score;
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(pIndex, 1);
          }, 0);
        } else {
          // remove from scene altogether
          score += 25;
          scoreElem.innerHTML = score;
          setTimeout(() => {
            enemies.splice(eIndex, 1);
            projectiles.splice(pIndex, 1);
          }, 0);
        }
      }
    });
  });
}

const player = new Player(cW / 2, cH / 2, 10, "white");

addEventListener("click", (event) => {
  const angle = Math.atan2(event.clientY - cH / 2, event.clientX - cW / 2);
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5,
  };
  projectiles.push(new Projectile(cW / 2, cH / 2, 5, "white", velocity));
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  gameOverModal.style.display = "none";
});
