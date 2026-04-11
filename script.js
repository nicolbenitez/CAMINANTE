Array.prototype.last = function () {
  return this[this.length - 1];
};

let phase = "waiting";
let lastTimestamp;

let heroX;
let heroY;
let sceneOffset;

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10;
const paddingX = 100;
const perfectAreaSize = 10;

const stretchingSpeed = 4;
const turningSpeed = 4;
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

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
  scoreElement.innerText = score;

  platforms = [{ x: 50, w: 50 }];
  for (let i = 0; i < 4; i++) generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

window.addEventListener("mousedown", () => {
  if (phase == "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    requestAnimationFrame(animate);
  }
});

window.addEventListener("mouseup", () => {
  if (phase == "stretching") phase = "turning";
});

restartButton.addEventListener("click", () => resetGame());

requestAnimationFrame(animate);

function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return;

    case "stretching":
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;

    case "turning":
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();

        if (nextPlatform) {
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
        }

        phase = "walking";
      }
      break;

    case "walking":
      heroX += (timestamp - lastTimestamp) / walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();

      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;

    case "transitioning":
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlat] = thePlatformTheStickHits();

      if (sceneOffset > nextPlat.x + nextPlat.w - paddingX) {
        sticks.push({
          x: nextPlat.x + nextPlat.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;

    case "falling":
      heroY += (timestamp - lastTimestamp) / fallingSpeed;

      if (heroY > canvas.height) {
        restartButton.style.display = "block";
        return;
      }
      break;
  }

  draw();
  requestAnimationFrame(animate);
  lastTimestamp = timestamp;
}

function thePlatformTheStickHits() {
  const stickFarX = sticks.last().x + sticks.last().length;

  const platform = platforms.find(
    (p) => p.x < stickFarX && stickFarX < p.x + p.w
  );

  if (
    platform &&
    platform.x + platform.w / 2 - perfectAreaSize / 2 < stickFarX &&
    stickFarX < platform.x + platform.w / 2 + perfectAreaSize / 2
  ) {
    return [platform, true];
  }

  return [platform, false];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  ctx.save();
  ctx.translate(-sceneOffset, 0);

  drawPlatforms();
  drawHero();
  drawSticks();

  ctx.restore();
}

// 🔵 FONDO CON NUBES
function drawBackground() {
  var gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#4facfe");
  gradient.addColorStop(1, "#1e3c72");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.8)";

  const time = Date.now() * 0.02;

  for (let i = 0; i < 5; i++) {
    let x = (time + i * 200) % (canvas.width + 200) - 100;
    let y = 50 + i * 40;

    drawCloud(x, y);
  }
}

// ☁️ NUBE
function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, Math.PI * 2);
  ctx.arc(x + 25, y + 10, 20, 0, Math.PI * 2);
  ctx.arc(x - 25, y + 10, 20, 0, Math.PI * 2);
  ctx.arc(x, y + 20, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, canvasHeight - platformHeight, w, platformHeight);

    ctx.fillStyle = "red";
    ctx.fillRect(
      x + w / 2 - perfectAreaSize / 2,
      canvasHeight - platformHeight,
      perfectAreaSize,
      perfectAreaSize
    );
  });
}

function drawHero() {
  ctx.fillStyle = "black";
  ctx.fillRect(
    heroX,
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
