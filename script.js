// ===== UTIL =====
Array.prototype.last = function () {
  return this[this.length - 1];
};

// ===== VARIABLES =====
let phase = "waiting";
let lastTimestamp;
let heroX;
let heroY;
let sceneOffset;
let platforms = [];
let sticks = [];
let trees = [];
let clouds = [];
let score = 0;
let time = 0;
let gameOver = false;

// 🎧 SONIDO
let fallSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3");

// ===== CONFIG =====
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;

const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

// ===== CANVAS =====
const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// ===== UI =====
const introductionElement = document.getElementById("introduction");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

// ===== RESET =====
resetGame();

function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;
  time = 0;
  gameOver = false;

  introductionElement.style.opacity = 1;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  for (let i = 0; i < 10; i++) generateTree();

  clouds = [];
  for (let i = 0; i < 5; i++) generateCloud();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

// ===== GENERADORES =====
function generatePlatform() {
  const gap = 50 + Math.random() * 150;
  const width = 40 + Math.random() * 80;
  const last = platforms.last();
  const x = last.x + last.w + gap;
  platforms.push({ x, w: width });
}

function generateTree() {
  const x = Math.random() * 2000;
  const colors = ["#2E7D32", "#388E3C", "#66BB6A"];
  const color = colors[Math.floor(Math.random() * 3)];
  trees.push({ x, color });
}

function generateCloud() {
  clouds.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * 200,
    size: 40 + Math.random() * 40,
    speed: 0.2 + Math.random() * 0.3
  });
}

// ===== CONTROLES =====
window.addEventListener("mousedown", () => {
  if (gameOver) {
    resetGame();
    return;
  }

  if (phase === "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", () => {
  if (phase === "stretching") {
    phase = "turning";
  }
});

window.requestAnimationFrame(animate);

// ===== LOOP =====
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
    return;
  }

  const delta = timestamp - lastTimestamp;
  const stick = sticks.last();

  time += 0.002;

  switch (phase) {
    case "stretching":
      stick.length += delta / stretchingSpeed;
      break;

    case "turning":
      stick.rotation += delta / turningSpeed;
      if (stick.rotation >= 90) {
        stick.rotation = 90;
        const [platform] = getHitPlatform();
        if (platform) {
          score += 5;
          scoreElement.innerText = score;
          generatePlatform();
          generateTree();
        }
        phase = "walking";
      }
      break;

    case "walking":
      heroX += delta / walkingSpeed;
      const [platform] = getHitPlatform();

      if (platform) {
        const max = platform.x + platform.w - heroDistanceFromEdge;
        if (heroX > max) {
          heroX = max;
          phase = "transitioning";
        }
      } else {
        if (heroX > stick.x + stick.length) {
          phase = "falling";
        }
      }
      break;

    case "transitioning":
      sceneOffset += delta / transitioningSpeed;
      const [next] = getHitPlatform();
      if (sceneOffset > next.x - 100) {
        sticks.push({
          x: next.x + next.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;

    case "falling":
      heroY += delta / fallingSpeed;

      if (heroY > canvasHeight) {
        if (!gameOver) {
          fallSound.currentTime = 0;
          fallSound.play();
        }
        gameOver = true;
      }
      break;
  }

  draw();
  requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

// ===== LOGICA =====
function getHitPlatform() {
  const stickEnd = sticks.last().x + sticks.last().length;
  const platform = platforms.find(
    (p) => stickEnd > p.x && stickEnd < p.x + p.w
  );
  return [platform];
}

// ===== DRAW =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  ctx.save();
  ctx.translate(canvas.width / 2 - sceneOffset, canvas.height / 2);

  drawPlatforms();
  drawHero();
  drawSticks();

  ctx.restore();

  // 💀 GAME OVER
  if (gameOver) {
    ctx.fillStyle = "black";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

    ctx.font = "20px Arial";
    ctx.fillText("Click para reiniciar", canvas.width / 2, canvas.height / 2 + 40);
  }
}

// ===== FONDO =====
function drawBackground() {
  const t = (Math.sin(time) + 1) / 2;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, `rgb(${255 * t},${126 * t},${95 * t})`);
  gradient.addColorStop(1, `rgb(${20 * (1 - t)},${30 * (1 - t)},${80 * (1 - t)})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawClouds();
  trees.forEach(tree => drawTree(tree.x - sceneOffset * 0.2, tree.color));
}

// ===== NUBES =====
function drawClouds() {
  clouds.forEach(c => {
    c.x += c.speed;
    if (c.x > canvas.width + 100) c.x = -100;

    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size * 0.3, 0, Math.PI * 2);
    ctx.arc(c.x + 20, c.y + 10, c.size * 0.4, 0, Math.PI * 2);
    ctx.arc(c.x - 20, c.y + 10, c.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===== PLATAFORMAS =====
function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight);

    ctx.fillStyle = "#2E7D32";
    ctx.fillRect(x, canvasHeight - platformHeight, w, 6);

    for (let i = x; i < x + w; i += 20) {
      if (Math.random() > 0.7) {
        ctx.fillStyle = "#FFEB3B";
        ctx.beginPath();
        ctx.arc(i, canvasHeight - platformHeight - 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// ===== HEROE =====
function drawHero() {
  ctx.save();

  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  ctx.shadowColor = "#90CAF9";
  ctx.shadowBlur = 10;

  ctx.fillStyle = "#2E3A59";
  ctx.fillRect(-10, -15, 20, 25);

  ctx.fillStyle = "#FFD9B3";
  ctx.beginPath();
  ctx.arc(0, -18, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ===== PALOS =====
function drawSticks() {
  sticks.forEach(stick => {
    ctx.save();
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    ctx.shadowColor = "#A1887F";
    ctx.shadowBlur = 5;

    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#5D4037";
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    ctx.restore();
  });
}

// ===== ARBOLES =====
function drawTree(x, color) {
  ctx.save();
  ctx.translate(x, canvas.height - 100);

  ctx.fillStyle = "#6D4C41";
  ctx.fillRect(-2, 0, 4, 10);

  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(0, -30);
  ctx.lineTo(10, 0);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}
