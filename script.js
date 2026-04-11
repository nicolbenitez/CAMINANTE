// SONIDOS
const sonidoGanar = new Audio("win.mp3");
const sonidoPerder = new Audio("lose.mp3");

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting";
let lastTimestamp;

let heroX;
let heroY;
let sceneOffset;

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

// Configuración
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;

const backgroundSpeedMultiplier = 0.2;

// VELOCIDAD MODIFICADA
const stretchingSpeed = 2;
const turningSpeed = 2;
const walkingSpeed = 2;
const transitioningSpeed = 2;
const fallingSpeed = 2;

// TAMAÑO MODIFICADO
const heroWidth = 25;
const heroHeight = 45;

const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

resetGame();

function resetGame() {
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  document.getElementById("gameover").style.display = "none";

  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  for (let i = 0; i < 10; i++) generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generateTree() {
  const lastTree = trees[trees.length - 1];
  let x = (lastTree ? lastTree.x : 0) + 50 + Math.random() * 100;
  const colors = ["#6D8821", "#8FAC34", "#98B333"];
  trees.push({ x, color: colors[Math.floor(Math.random() * 3)] });
}

function generatePlatform() {
  const last = platforms[platforms.length - 1];
  let x = last.x + last.w + 40 + Math.random() * 160;
  let w = 20 + Math.random() * 80;
  platforms.push({ x, w });
}

// CONTROLES
window.addEventListener("mousedown", () => {
  if (phase === "waiting") {
    phase = "stretching";
    introductionElement.style.opacity = 0;
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", () => {
  if (phase === "stretching") {
    phase = "turning";
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === " ") resetGame();
});

// LOOP
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "stretching":
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;

    case "turning":
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation >= 90) {
        sticks.last().rotation = 90;

        const [next, perfect] = checkHit();

        if (next) {
          // PUNTAJE MODIFICADO
          score += perfect ? 10 : 5;
          scoreElement.innerText = score;

          sonidoGanar.play();

          if (perfect) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
          phase = "walking";
        } else {
          phase = "falling";
        }
      }
      break;

    case "walking":
      heroX += (timestamp - lastTimestamp) / walkingSpeed;

      const [next] = checkHit();
      if (next && heroX > next.x) {
        phase = "waiting";
        sticks.push({
          x: next.x + next.w,
          length: 0,
          rotation: 0,
        });
      }
      break;

    case "falling":
      heroY += (timestamp - lastTimestamp) / fallingSpeed;

      if (heroY > canvasHeight) {
        document.getElementById("gameover").style.display = "block";
        restartButton.style.display = "block";
        sonidoPerder.play();
        return;
      }
      break;
  }

  draw();
  requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

// DETECCIÓN
function checkHit() {
  const stickEnd = sticks.last().x + sticks.last().length;

  const platform = platforms.find(
    (p) => stickEnd > p.x && stickEnd < p.x + p.w
  );

  if (
    platform &&
    stickEnd >
      platform.x + platform.w / 2 - perfectAreaSize / 2 &&
    stickEnd <
      platform.x + platform.w / 2 + perfectAreaSize / 2
  ) {
    return [platform, true];
  }

  return [platform, false];
}

// DIBUJO
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#1E3C72");
  gradient.addColorStop(1, "#2A5298");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPlatforms();
  drawHero();
  drawSticks();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "#4CAF50";
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight);
  });
}

function drawHero() {
  ctx.fillStyle = "#FF5722";
  ctx.fillRect(
    heroX - heroWidth / 2,
    canvasHeight - platformHeight - heroHeight,
    heroWidth,
    heroHeight
  );
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    ctx.restore();
  });
}

restartButton.addEventListener("click", () => {
  resetGame();
});
