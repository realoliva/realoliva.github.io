/**
 * 经典贪吃蛇 · 自动闯关 · 吃满格子
 */
(function () {
  'use strict';

  var canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hudEl = document.getElementById('snakeHud');

  var COLS = 32;
  var ROWS = 14;
  var TICK_MS = 72;

  var snake = [];
  var dir = { x: 1, y: 0 };
  var nextDir = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var score = 0;
  var level = 1;
  var eaten = 0;
  var totalCells = COLS * ROWS;
  var cellSize = 16;
  var flash = 0;
  var victoryTimer = 0;
  var particles = [];

  function key(x, y) {
    return x + ',' + y;
  }

  function resize() {
    var wrap = canvas.parentElement;
    var maxW = Math.min(920, wrap.clientWidth - 24);
    cellSize = Math.max(12, Math.floor(maxW / COLS));
    canvas.width = COLS * cellSize;
    canvas.height = ROWS * cellSize;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }

  function resetGame(keepLevel) {
    if (!keepLevel) {
      level = 1;
      score = 0;
      TICK_MS = 72;
    }
    eaten = 0;
    var midY = Math.floor(ROWS / 2);
    snake = [];
    var i;
    for (i = 4; i >= 0; i--) {
      snake.push({ x: 5 + i, y: midY });
    }
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    spawnFood();
    updateHud();
  }

  function snakeSet() {
    var set = {};
    var i;
    for (i = 0; i < snake.length; i++) {
      set[key(snake[i].x, snake[i].y)] = true;
    }
    return set;
  }

  function spawnFood() {
    var occupied = snakeSet();
    var free = [];
    var x;
    var y;
    for (x = 0; x < COLS; x++) {
      for (y = 0; y < ROWS; y++) {
        if (!occupied[key(x, y)]) free.push({ x: x, y: y });
      }
    }
    if (!free.length) return;
    food = free[Math.floor(Math.random() * free.length)];
  }

  function updateHud() {
    if (!hudEl) return;
    var pct = Math.round((snake.length / totalCells) * 100);
    hudEl.innerHTML =
      '<span class="snake-hud-item">关卡 <b>' + level + '</b></span>' +
      '<span class="snake-hud-item">得分 <b>' + score + '</b></span>' +
      '<span class="snake-hud-item">长度 <b>' + snake.length + '</b></span>' +
      '<span class="snake-hud-item">铺满 <b>' + pct + '%</b></span>';
  }

  function neighbors(cell) {
    return [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 }
    ];
  }

  function inBounds(c) {
    return c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS;
  }

  function bfsPath(start, target, allowTail) {
    var occ = snakeSet();
    if (allowTail && snake.length > 1) {
      delete occ[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    }
    var q = [{ x: start.x, y: start.y, path: [] }];
    var seen = {};
    seen[key(start.x, start.y)] = true;
    var qi = 0;
    while (qi < q.length) {
      var cur = q[qi++];
      if (cur.x === target.x && cur.y === target.y) return cur.path;
      var nb = neighbors(cur);
      var i;
      for (i = 0; i < nb.length; i++) {
        var n = nb[i];
        if (!inBounds(n) || seen[key(n.x, n.y)] || occ[key(n.x, n.y)]) continue;
        seen[key(n.x, n.y)] = true;
        q.push({ x: n.x, y: n.y, path: cur.path.concat([{ x: n.x, y: n.y }]) });
      }
    }
    return null;
  }

  function safeDirs() {
    var head = snake[0];
    var occ = snakeSet();
    if (snake.length > 1) {
      delete occ[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    }
    var dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
    ];
    var out = [];
    var i;
    for (i = 0; i < dirs.length; i++) {
      var nx = head.x + dirs[i].x;
      var ny = head.y + dirs[i].y;
      if (inBounds({ x: nx, y: ny }) && !occ[key(nx, ny)]) {
        out.push(dirs[i]);
      }
    }
    return out;
  }

  function pickDirection() {
    var head = snake[0];
    var path = bfsPath(head, food, true);
    if (path && path.length) {
      var first = path[0];
      return { x: first.x - head.x, y: first.y - head.y };
    }
    var tail = snake[snake.length - 1];
    path = bfsPath(head, tail, true);
    if (path && path.length) {
      var f = path[0];
      return { x: f.x - head.x, y: f.y - head.y };
    }
    var safe = safeDirs();
    if (safe.length) return safe[Math.floor(Math.random() * safe.length)];
    return dir;
  }

  function addParticles(x, y, color) {
    var i;
    for (i = 0; i < 10; i++) {
      particles.push({
        x: (x + 0.5) * cellSize,
        y: (y + 0.5) * cellSize,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color: color
      });
    }
  }

  function levelClear() {
    victoryTimer = 90;
    flash = 1;
    level += 1;
    score += 500 + snake.length * 10;
    TICK_MS = Math.max(38, TICK_MS - 4);
    if (hudEl) {
      hudEl.innerHTML =
        '<span class="snake-hud-victory">🏆 第 ' + (level - 1) + ' 关通关 · 格子铺满 · 最强贪吃蛇！</span>';
    }
    setTimeout(function () {
      resetGame(true);
    }, 2200);
  }

  function step() {
    nextDir = pickDirection();
    dir = nextDir;

    var head = snake[0];
    var nx = head.x + dir.x;
    var ny = head.y + dir.y;

    if (!inBounds({ x: nx, y: ny })) {
      resetGame(false);
      draw();
      return;
    }

    var occ = snakeSet();
    if (occ[key(nx, ny)]) {
      resetGame(false);
      draw();
      return;
    }

    snake.unshift({ x: nx, y: ny });
    var ate = nx === food.x && ny === food.y;

    if (ate) {
      score += 10 * level;
      eaten += 1;
      addParticles(nx, ny, '#fbbf24');
      spawnFood();
      if (snake.length >= totalCells - 1) {
        levelClear();
        draw();
        return;
      }
    } else {
      snake.pop();
    }

    if (eaten > 0 && eaten % 12 === 0) {
      level += 1;
      score += 50;
      TICK_MS = Math.max(40, TICK_MS - 2);
    }

    updateHud();
    tickParticles();
    draw();
  }

  function drawGrid() {
    var x;
    var y;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (x = 0; x < COLS; x++) {
      for (y = 0; y < ROWS; y++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        }
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    for (x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    for (y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }
  }

  function drawSnake() {
    var i;
    var seg;
    for (i = snake.length - 1; i >= 0; i--) {
      seg = snake[i];
      var t = i / Math.max(1, snake.length - 1);
      if (i === 0) {
        ctx.fillStyle = '#4ade80';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 14;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'hsl(' + (145 - t * 40) + ', 75%, ' + (55 - t * 15) + '%)';
      }
      var pad = i === 0 ? 1 : 2;
      ctx.fillRect(
        seg.x * cellSize + pad,
        seg.y * cellSize + pad,
        cellSize - pad * 2,
        cellSize - pad * 2
      );
      if (i === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#052e16';
        var eye = cellSize * 0.22;
        if (dir.x === 1) {
          ctx.fillRect(seg.x * cellSize + cellSize - eye * 2, seg.y * cellSize + 4, eye, eye);
          ctx.fillRect(seg.x * cellSize + cellSize - eye * 2, seg.y * cellSize + cellSize - eye - 4, eye, eye);
        } else if (dir.x === -1) {
          ctx.fillRect(seg.x * cellSize + 3, seg.y * cellSize + 4, eye, eye);
          ctx.fillRect(seg.x * cellSize + 3, seg.y * cellSize + cellSize - eye - 4, eye, eye);
        } else if (dir.y === -1) {
          ctx.fillRect(seg.x * cellSize + 4, seg.y * cellSize + 3, eye, eye);
          ctx.fillRect(seg.x * cellSize + cellSize - eye - 4, seg.y * cellSize + 3, eye, eye);
        } else {
          ctx.fillRect(seg.x * cellSize + 4, seg.y * cellSize + cellSize - eye * 2, eye, eye);
          ctx.fillRect(seg.x * cellSize + cellSize - eye - 4, seg.y * cellSize + cellSize - eye * 2, eye, eye);
        }
      }
    }
  }

  function drawFood() {
    var cx = food.x * cellSize + cellSize / 2;
    var cy = food.y * cellSize + cellSize / 2;
    var pulse = 0.85 + Math.sin(Date.now() / 120) * 0.15;
    var r = cellSize * 0.32 * pulse;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 16;
    var grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grd.addColorStop(0, '#fef08a');
    grd.addColorStop(0.5, '#f59e0b');
    grd.addColorStop(1, '#b45309');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold ' + Math.max(9, cellSize * 0.45) + 'px sans-serif';
    ctx.fillStyle = '#78350f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', cx, cy + 1);
  }

  function drawParticles() {
    var i;
    var p;
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.06;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawVictory() {
    if (!victoryTimer) return;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.floor(cellSize * 1.4) + 'px system-ui,sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 20;
    ctx.fillText('🏆 通关 · 铺满格子', canvas.width / 2, canvas.height / 2 - cellSize);
    ctx.font = '600 ' + Math.floor(cellSize * 0.75) + 'px system-ui,sans-serif';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText('最强贪吃蛇 · 下一关加速', canvas.width / 2, canvas.height / 2 + cellSize);
    ctx.shadowBlur = 0;
  }

  function draw() {
    drawGrid();
    drawFood();
    drawSnake();
    drawParticles();
    drawVictory();
    if (flash > 0) {
      flash -= 0.04;
      ctx.fillStyle = 'rgba(250, 204, 21, ' + flash * 0.35 + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function tickParticles() {
    var i;
    for (i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].life -= 0.05;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function gameLoop() {
    if (victoryTimer > 0) {
      victoryTimer -= 1;
      tickParticles();
      draw();
      requestAnimationFrame(gameLoop);
      return;
    }
    var now = Date.now();
    if (!gameLoop.last) gameLoop.last = now;
    if (now - gameLoop.last >= TICK_MS) {
      gameLoop.last = now;
      step();
    } else {
      tickParticles();
      draw();
    }
    requestAnimationFrame(gameLoop);
  }

  resize();
  resetGame(false);
  draw();
  requestAnimationFrame(gameLoop);
  window.addEventListener('resize', function () {
    resize();
    draw();
  });
})();
