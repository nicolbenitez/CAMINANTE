// Extend functionality
Array.prototype.last = function () {
  return this[this.length - 1];
};

Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// 🔊 SONIDOS
const sonidoGanar = new Audio("win.mp3");
const sonidoPerder = new Audio("lose.mp3");

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

// ⚡ VELOCIDAD MODIFICADA
const stretchingSpeed = 2;
const turningSpeed = 2;
const walkingSpeed = 2;
const transitioningSpeed = 2;
const fallingSpeed = 2;

// 🧍 TAMAÑO PERSONAJE
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

// LOOP PRINCIPAL
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
