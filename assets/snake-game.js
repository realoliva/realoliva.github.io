/**
 * 经典贪吃蛇 — 可键盘 / 触屏操作，60fps 平滑插值移动
 */
(function () {
  'use strict';

  var canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hudEl = document.getElementById('snakeHud');
  var wrap = canvas.parentElement;

  var COLS = 24;
  var ROWS = 16;
  var cellSize = 18;

  var snake = [];
  var prevSnake = [];
  var dir = { x: 1, y: 0 };
  var nextDir = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var score = 0;
  var highScore = 0;
  var blend = 1;
  var stepSec = 0.13;
  var state = 'idle';
  var particles = [];
  var touchStart = null;

  try {
    highScore = parseInt(localStorage.getItem('snakeHighScore') || '0', 10) || 0;
  } catch (e) {
    highScore = 0;
  }

  function key(x, y) {
    return x + ',' + y;
  }

  function cloneSegs(list) {
    var out = [];
    var i;
    for (i = 0; i < list.length; i++) out.push({ x: list[i].x, y: list[i].y });
    return out;
  }

  function resize() {
    var w = wrap ? wrap.clientWidth - 24 : 640;
    var maxW = Math.min(720, Math.max(280, w));
    cellSize = Math.max(14, Math.min(22, Math.floor(maxW / 26)));
    COLS = Math.max(18, Math.floor(maxW / cellSize));
    ROWS = Math.max(12, Math.round(COLS * 0.62));
    canvas.width = COLS * cellSize;
    canvas.height = ROWS * cellSize;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }

  function snakeSet() {
    var set = {};
    var i;
    for (i = 0; i < snake.length; i++) set[key(snake[i].x, snake[i].y)] = true;
    return set;
  }

  function inBounds(c) {
    return c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS;
  }

  function setDirection(nx, ny) {
    if (state === 'idle') startGame();
    if (nx === -dir.x && ny === -dir.y) return;
    nextDir = { x: nx, y: ny };
  }

  function placeFood() {
    var occ = snakeSet();
    var free = [];
    var x;
    var y;
    for (x = 0; x < COLS; x++) {
      for (y = 0; y < ROWS; y++) {
        if (!occ[key(x, y)]) free.push({ x: x, y: y });
      }
    }
    if (!free.length) return;
    food = free[Math.floor(Math.random() * free.length)];
  }

  function resetSnake() {
    var midY = Math.floor(ROWS / 2);
    var sx = Math.floor(COLS / 2) - 2;
    snake = [];
    var i;
    for (i = 4; i >= 0; i--) snake.push({ x: sx + i, y: midY });
    prevSnake = cloneSegs(snake);
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    blend = 1;
    stepSec = 0.13;
    placeFood();
  }

  function updateHud() {
    if (!hudEl) return;
    hudEl.innerHTML =
      '<span class="snake-hud-item">得分 <b>' +
      score +
      '</b></span>' +
      '<span class="snake-hud-item">最高 <b>' +
      highScore +
      '</b></span>' +
      '<span class="snake-hud-item">长度 <b>' +
      snake.length +
      '</b></span>';
  }

  function burst(x, y, color) {
    var i;
    for (i = 0; i < 8; i++) {
      particles.push({
        x: (x + 0.5) * cellSize,
        y: (y + 0.5) * cellSize,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1,
        color: color
      });
    }
  }

  function startGame() {
    score = 0;
    state = 'running';
    resetSnake();
    updateHud();
    canvas.focus();
  }

  function gameOver() {
    state = 'dead';
    if (score > highScore) {
      highScore = score;
      try {
        localStorage.setItem('snakeHighScore', String(highScore));
      } catch (e) {}
    }
    updateHud();
  }

  function logicStep() {
    dir = nextDir;
    var head = snake[0];
    var nx = head.x + dir.x;
    var ny = head.y + dir.y;

    if (!inBounds({ x: nx, y: ny })) {
      gameOver();
      return false;
    }

    var occ = snakeSet();
    if (occ[key(nx, ny)]) {
      gameOver();
      return false;
    }

    prevSnake = cloneSegs(snake);
    snake.unshift({ x: nx, y: ny });
    var ate = nx === food.x && ny === food.y;

    if (ate) {
      score += 10;
      stepSec = Math.max(0.065, stepSec - 0.004);
      burst(nx, ny, '#fbbf24');
      placeFood();
      if (score > highScore) highScore = score;
      updateHud();
    } else {
      snake.pop();
    }

    blend = 0;
    return true;
  }

  function segmentRenderPos(i, t) {
    var grew = snake.length > prevSnake.length;
    var from;
    var to;
    if (i === 0) {
      from = prevSnake[0];
      to = snake[0];
    } else if (grew) {
      from = prevSnake[i - 1] || prevSnake[prevSnake.length - 1];
      to = snake[i];
    } else {
      from = prevSnake[i] || snake[i];
      to = snake[i];
    }
    if (!from) from = to;
    return {
      x: (from.x + (to.x - from.x) * t) * cellSize,
      y: (from.y + (to.y - from.y) * t) * cellSize
    };
  }

  function update(dt) {
    var i;
    for (i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx * dt * 60;
      particles[i].y += particles[i].vy * dt * 60;
      particles[i].life -= dt * 2.2;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    if (state !== 'running') return;

    blend += dt / stepSec;
    while (blend >= 1) {
      blend -= 1;
      if (!logicStep()) return;
    }
  }

  function drawGrid() {
    var x;
    var y;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (x = 0; x < COLS; x++) {
      for (y = 0; y < ROWS; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1e293b' : '#172033';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  function drawFood() {
    var cx = food.x * cellSize + cellSize / 2;
    var cy = food.y * cellSize + cellSize / 2;
    var pulse = 0.9 + Math.sin(Date.now() / 140) * 0.1;
    var r = cellSize * 0.34 * pulse;
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, '#fde68a');
    grd.addColorStop(0.55, '#f59e0b');
    grd.addColorStop(1, '#b45309');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawSnake(t) {
    var i;
    var pad;
    var size;
    var p;
    for (i = snake.length - 1; i >= 0; i--) {
      p = segmentRenderPos(i, t);
      pad = i === 0 ? 1.5 : 2.5;
      size = cellSize - pad * 2;
      if (i === 0) {
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowBlur = 0;
        var ratio = i / Math.max(1, snake.length - 1);
        ctx.fillStyle = 'hsl(145, 70%, ' + (52 - ratio * 18) + '%)';
      }
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(p.x + pad, p.y + pad, size, size, i === 0 ? size * 0.28 : size * 0.18);
        ctx.fill();
      } else {
        ctx.fillRect(p.x + pad, p.y + pad, size, size);
      }
      ctx.shadowBlur = 0;
    }
  }

  function drawParticles() {
    var i;
    var p;
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlay() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === 'idle') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold ' + Math.floor(cellSize * 1.1) + 'px system-ui,sans-serif';
      ctx.fillText('🐍 经典贪吃蛇', canvas.width / 2, canvas.height / 2 - cellSize * 1.6);
      ctx.font = '500 ' + Math.floor(cellSize * 0.62) + 'px system-ui,sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('方向键 / WASD 移动', canvas.width / 2, canvas.height / 2 - cellSize * 0.2);
      ctx.fillText('点击画面或按空格开始', canvas.width / 2, canvas.height / 2 + cellSize * 0.9);
    } else if (state === 'dead') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold ' + Math.floor(cellSize * 1.05) + 'px system-ui,sans-serif';
      ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - cellSize * 1.4);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 ' + Math.floor(cellSize * 0.68) + 'px system-ui,sans-serif';
      ctx.fillText('得分 ' + score, canvas.width / 2, canvas.height / 2 - cellSize * 0.3);
      ctx.font = '500 ' + Math.floor(cellSize * 0.58) + 'px system-ui,sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('空格 / 点击再来一局', canvas.width / 2, canvas.height / 2 + cellSize * 1.1);
    }
  }

  function draw() {
    var t = state === 'running' ? Math.min(1, blend) : 1;
    drawGrid();
    if (snake.length) drawFood();
    if (snake.length) drawSnake(t);
    drawParticles();
    drawOverlay();
  }

  function onKeyDown(e) {
    var k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      setDirection(0, -1);
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      setDirection(0, 1);
    } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault();
      setDirection(-1, 0);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      setDirection(1, 0);
    } else if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (state === 'idle' || state === 'dead') startGame();
    }
  }

  function pointerToCell(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var sx = (clientX - rect.left) * (canvas.width / rect.width);
    var sy = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: sx, y: sy };
  }

  function onPointerDown(e) {
    canvas.focus();
    var p = pointerToCell(e.clientX, e.clientY);
    touchStart = { x: p.x, y: p.y, t: Date.now() };
    if (state === 'idle' || state === 'dead') {
      startGame();
    }
  }

  function onPointerUp(e) {
    if (!touchStart) return;
    var p = pointerToCell(e.clientX, e.clientY);
    var dx = p.x - touchStart.x;
    var dy = p.y - touchStart.y;
    var dt = Date.now() - touchStart.t;
    touchStart = null;
    if (dt > 600) return;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }

  var lastTime = 0;
  function loop(now) {
    if (!lastTime) lastTime = now;
    var dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.setAttribute('tabindex', '0');
  canvas.style.outline = 'none';
  canvas.style.touchAction = 'none';

  resize();
  resetSnake();
  updateHud();
  draw();

  window.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('resize', function () {
    resize();
    if (state !== 'running') {
      resetSnake();
      draw();
    }
  });

  requestAnimationFrame(loop);
})();
