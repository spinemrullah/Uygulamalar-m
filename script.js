const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const playerScore = document.getElementById('player-score');
const computerScore = document.getElementById('computer-score');
const restartButton = document.getElementById('restart');

const paddle = { width: 14, height: 92, speed: 7 };
const player = { x: 28, y: canvas.height / 2 - paddle.height / 2 };
const computer = { x: canvas.width - 42, y: canvas.height / 2 - paddle.height / 2 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 9, speed: 6, vx: 6, vy: 3 };
const keys = { up: false, down: false };
let scores = { player: 0, computer: 0 };
let paused = false;
let lastTime = 0;

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.vx = ball.speed * direction;
  ball.vy = (Math.random() * 4 - 2) || 1;
}

function clampPaddle(item) {
  item.y = Math.max(0, Math.min(canvas.height - paddle.height, item.y));
}

function score(side) {
  scores[side] += 1;
  playerScore.textContent = scores.player;
  computerScore.textContent = scores.computer;
  resetBall(side === 'player' ? 1 : -1);
}

function intersectsPaddle(item) {
  return ball.x - ball.radius < item.x + paddle.width &&
    ball.x + ball.radius > item.x &&
    ball.y - ball.radius < item.y + paddle.height &&
    ball.y + ball.radius > item.y;
}

function update(delta) {
  if (keys.up) player.y -= paddle.speed * delta;
  if (keys.down) player.y += paddle.speed * delta;
  clampPaddle(player);

  // Simple computer AI that follows the ball, with a small speed limit.
  const target = ball.y - paddle.height / 2;
  computer.y += Math.max(-paddle.speed * 0.72 * delta, Math.min(paddle.speed * 0.72 * delta, target - computer.y));
  clampPaddle(computer);

  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

  if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
    ball.vy *= -1;
    ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y));
  }

  if (ball.vx < 0 && intersectsPaddle(player)) {
    ball.x = player.x + paddle.width + ball.radius;
    ball.vx = Math.abs(ball.vx) * 1.04;
    ball.vy += (ball.y - (player.y + paddle.height / 2)) * 0.08;
  } else if (ball.vx > 0 && intersectsPaddle(computer)) {
    ball.x = computer.x - ball.radius;
    ball.vx = -Math.abs(ball.vx) * 1.04;
    ball.vy += (ball.y - (computer.y + paddle.height / 2)) * 0.08;
  }

  if (ball.x + ball.radius < 0) score('computer');
  if (ball.x - ball.radius > canvas.width) score('player');
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setLineDash([10, 14]);
  ctx.strokeStyle = '#29405e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64f4ac';
  ctx.fillRect(player.x, player.y, paddle.width, paddle.height);
  ctx.fillRect(computer.x, computer.y, paddle.width, paddle.height);
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  if (paused) {
    ctx.fillStyle = '#e8f1ff';
    ctx.font = 'bold 28px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  const delta = Math.min((timestamp - lastTime) / 16.67 || 1, 2);
  lastTime = timestamp;
  if (!paused) update(delta);
  draw();
  requestAnimationFrame(loop);
}

function movePlayer(event) {
  const rect = canvas.getBoundingClientRect();
  player.y = ((event.clientY - rect.top) / rect.height) * canvas.height - paddle.height / 2;
  clampPaddle(player);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') { keys.up = true; event.preventDefault(); }
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') { keys.down = true; event.preventDefault(); }
  if (event.code === 'Space') { paused = !paused; event.preventDefault(); }
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') keys.up = false;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') keys.down = false;
});
canvas.addEventListener('mousemove', movePlayer);
canvas.addEventListener('touchmove', (event) => { movePlayer(event.touches[0]); event.preventDefault(); }, { passive: false });
restartButton.addEventListener('click', () => {
  scores = { player: 0, computer: 0 };
  playerScore.textContent = computerScore.textContent = '0';
  player.y = computer.y = canvas.height / 2 - paddle.height / 2;
  resetBall();
  paused = false;
});

resetBall();
requestAnimationFrame(loop);
