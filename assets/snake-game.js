/**
 * 经典贪吃蛇 · 哈密顿路径 AI · 只赢不输 · 吃满整盘再通关
 *
 * 逻辑梳理：
 * 1. 网格按容器宽度铺满（蛇形哈密顿路径覆盖每一格）
 * 2. 默认沿哈密顿路径下一步（保证在简单情况下永不撞车）
 * 3. 若朝食物走一步仍满足「头到尾沿路径距离 ≥ 蛇长」，则走捷径加速吃豆
 * 4. 绝不因撞墙/撞身重置；只有铺满全部格子才通关并进入下一关
 */
(function () {
  'use strict';

  var canvas = document.getElementById('snakeCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var hudEl = document.getElementById('snakeHud');

  var COLS = 32;
  var ROWS = 16;
  var TICK_MS = 68;
  var cellSize = 14;

  var snake = [];
  var dir = { x: 1, y: 0 };
  var food = { x: 0, y: 0 };
  var score = 0;
  var level = 1;
  var totalCells = COLS * ROWS;

  var hamiltonPath = [];
  var hamiltonIdx = {};
  var flash = 0;
  var victoryTimer = 0;
  var particles = [];

  function key(x, y) {
    return x + ',' + y;
  }

  function buildHamilton() {
    hamiltonPath = [];
    var y;
    var x;
    for (y = 0; y < ROWS; y++) {
      if (y % 2 === 0) {
        for (x = 0; x < COLS; x++) hamiltonPath.push({ x: x, y: y });
      } else {
        for (x = COLS - 1; x >= 0; x--) hamiltonPath.push({ x: x, y: y });
      }
    }
    hamiltonIdx = {};
    var i;
    for (i = 0; i < hamiltonPath.length; i++) {
      hamiltonIdx[key(hamiltonPath[i].x, hamiltonPath[i].y)] = i;
    }
  }

  function hamForward(fromIdx, steps) {
    var n = hamiltonPath.length;
    return (fromIdx + steps + n) % n;
  }

  function hamDistance(fromIdx, toIdx) {
    var n = hamiltonPath.length;
    return (toIdx - fromIdx + n) % n;
  }

  function resize() {
    var wrap = canvas.parentElement;
    var maxW = Math.min(960, (wrap && wrap.clientWidth ? wrap.clientWidth : 920) - 24);
    cellSize = Math.max(11, Math.min(16, Math.floor(maxW / 34)));
    COLS = Math.max(24, Math.floor(maxW / cellSize));
    if (COLS % 2 === 1) COLS -= 1;
    ROWS = Math.max(12, Math.min(18, Math.floor((maxW * 0.42) / cellSize)));
    if (ROWS % 2 === 1) ROWS -= 1;
    totalCells = COLS * ROWS;
    canvas.width = COLS * cellSize;
    canvas.height = ROWS * cellSize;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    buildHamilton();
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

  function neighbors(cell) {
    return [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 }
    ];
  }

  function bfsDist(start, target, allowTail) {
    var occ = snakeSet();
    if (allowTail && snake.length > 1) {
      delete occ[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    }
    var q = [{ x: start.x, y: start.y, d: 0 }];
    var seen = {};
    seen[key(start.x, start.y)] = true;
    var qi = 0;
    while (qi < q.length) {
      var cur = q[qi++];
      if (cur.x === target.x && cur.y === target.y) return cur.d;
      var nb = neighbors(cur);
      var i;
      for (i = 0; i < nb.length; i++) {
        var n = nb[i];
        if (!inBounds(n) || seen[key(n.x, n.y)] || occ[key(n.x, n.y)]) continue;
        seen[key(n.x, n.y)] = true;
        q.push({ x: n.x, y: n.y, d: cur.d + 1 });
      }
    }
    return Infinity;
  }

  function floodCount(start, allowTail) {
    var occ = snakeSet();
    if (allowTail && snake.length > 1) {
      delete occ[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    }
    var q = [{ x: start.x, y: start.y }];
    var seen = {};
    seen[key(start.x, start.y)] = true;
    var qi = 0;
    var count = 0;
    while (qi < q.length) {
      var cur = q[qi++];
      count++;
      var nb = neighbors(cur);
      var i;
      for (i = 0; i < nb.length; i++) {
        var n = nb[i];
        if (!inBounds(n) || seen[key(n.x, n.y)] || occ[key(n.x, n.y)]) continue;
        seen[key(n.x, n.y)] = true;
        q.push(n);
      }
    }
    return count;
  }

  function isMoveSafe(nx, ny, willEat) {
    var newLen = snake.length + (willEat ? 1 : 0);
    var newHeadIdx = hamiltonIdx[key(nx, ny)];
    if (newHeadIdx === undefined) return false;

    var tailIdxAfter;
    if (willEat) {
      tailIdxAfter = hamiltonIdx[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    } else if (snake.length > 1) {
      tailIdxAfter = hamiltonIdx[key(snake[1].x, snake[1].y)];
    } else {
      tailIdxAfter = newHeadIdx;
    }

    if (hamDistance(tailIdxAfter, newHeadIdx) < newLen) return false;
    if (floodCount({ x: nx, y: ny }, true) < newLen) return false;
    return true;
  }

  function safeDirections() {
    var head = snake[0];
    var occ = snakeSet();
    if (snake.length > 1) {
      delete occ[key(snake[snake.length - 1].x, snake[snake.length - 1].y)];
    }
    var dirs = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 }
    ];
    var out = [];
    var i;
    for (i = 0; i < dirs.length; i++) {
      var nx = head.x + dirs[i].x;
      var ny = head.y + dirs[i].y;
      if (!inBounds({ x: nx, y: ny }) || occ[key(nx, ny)]) continue;
      var willEat = nx === food.x && ny === food.y;
      if (isMoveSafe(nx, ny, willEat)) out.push(dirs[i]);
    }
    return out;
  }

  function pickDirection() {
    var head = snake[0];
    var headIdx = hamiltonIdx[key(head.x, head.y)];
    var n = hamiltonPath.length;
    var nextCell = hamiltonPath[hamForward(headIdx, 1)];
    var fallback = { x: nextCell.x - head.x, y: nextCell.y - head.y };

    var options = safeDirections();
    if (!options.length) return fallback;

    var foodDist = bfsDist(head, food, true);
    var best = null;
    var bestScore = Infinity;
    var i;
    var d;
    var nx;
    var ny;
    var willEat;
    var dist;
    var towardFood;

    for (i = 0; i < options.length; i++) {
      d = options[i];
      nx = head.x + d.x;
      ny = head.y + d.y;
      willEat = nx === food.x && ny === food.y;
      dist = bfsDist({ x: nx, y: ny }, food, true);
      towardFood = dist < foodDist ? 0 : 1;
      var nextIdx = hamiltonIdx[key(nx, ny)];
      var onPathBonus = nextIdx === hamForward(headIdx, 1) ? 0 : 1;
      var eatBonus = willEat ? -2 : 0;
      var scoreMove = towardFood * 1000 + dist * 10 + onPathBonus + eatBonus;
      if (scoreMove < bestScore) {
        bestScore = scoreMove;
        best = d;
      }
    }
    return best || fallback;
  }

  function alignSnakeOnPath() {
    var midY = Math.floor(ROWS / 2);
    var startX = Math.min(COLS - 6, Math.max(4, Math.floor(COLS * 0.2)));
    var headCell = { x: startX + 4, y: midY };
    var headIdx = hamiltonIdx[key(headCell.x, headCell.y)];
    if (headIdx === undefined) headIdx = Math.floor(hamiltonPath.length / 2);

    snake = [];
    var len = 5;
    var i;
    for (i = len - 1; i >= 0; i--) {
      var idx = hamForward(headIdx, -i);
      snake.push({ x: hamiltonPath[idx].x, y: hamiltonPath[idx].y });
    }
    dir = {
      x: snake[0].x - snake[1].x,
      y: snake[0].y - snake[1].y
    };
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
    var head = snake[0];
    var best = free[Math.floor(Math.random() * free.length)];
    var bestD = Infinity;
    var i;
    for (i = 0; i < free.length; i++) {
      var d = bfsDist(head, free[i], true);
      if (d < bestD) {
        bestD = d;
        best = free[i];
      }
    }
    food = best;
  }

  function updateHud(victoryText) {
    if (!hudEl) return;
    if (victoryText) {
      hudEl.innerHTML = victoryText;
      return;
    }
    var pct = Math.min(100, Math.round((snake.length / totalCells) * 100));
    hudEl.innerHTML =
      '<span class="snake-hud-item">关卡 <b>' + level + '</b></span>' +
      '<span class="snake-hud-item">得分 <b>' + score + '</b></span>' +
      '<span class="snake-hud-item">长度 <b>' + snake.length + '</b></span>' +
      '<span class="snake-hud-item">铺满 <b>' + pct + '%</b></span>';
  }

  function addParticles(x, y, color) {
    var i;
    for (i = 0; i < 12; i++) {
      particles.push({
        x: (x + 0.5) * cellSize,
        y: (y + 0.5) * cellSize,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.5) * 4.5,
        life: 1,
        color: color
      });
    }
  }

  function resetGame(keepLevel) {
    if (!keepLevel) {
      level = 1;
      score = 0;
      TICK_MS = 68;
    }
    victoryTimer = 0;
    flash = 0;
    particles = [];
    alignSnakeOnPath();
    spawnFood();
    updateHud();
  }

  function levelClear() {
    victoryTimer = 100;
    flash = 1;
    score += 800 + snake.length * 12;
    updateHud(
      '<span class="snake-hud-victory">🏆 第 ' +
        level +
        ' 关 · 满盘通关 · 最强贪吃蛇！</span>'
    );
    level += 1;
    TICK_MS = Math.max(36, TICK_MS - 3);
    setTimeout(function () {
      resetGame(true);
    }, 2400);
  }

  function step() {
    dir = pickDirection();
    var head = snake[0];
    var nx = head.x + dir.x;
    var ny = head.y + dir.y;
    var willEat = nx === food.x && ny === food.y;
    var occ = snakeSet();
    var tail = snake[snake.length - 1];
    var ontoTail = snake.length > 1 && nx === tail.x && ny === tail.y;
    var blocked = occ[key(nx, ny)] && !(ontoTail && !willEat);

    if (!inBounds({ x: nx, y: ny }) || blocked || !isMoveSafe(nx, ny, willEat)) {
      var safe = safeDirections();
      if (safe.length) {
        dir = safe[0];
        nx = head.x + dir.x;
        ny = head.y + dir.y;
        willEat = nx === food.x && ny === food.y;
      } else {
        var headIdx = hamiltonIdx[key(head.x, head.y)];
        var nextCell = hamiltonPath[hamForward(headIdx, 1)];
        nx = nextCell.x;
        ny = nextCell.y;
        willEat = nx === food.x && ny === food.y;
        dir = { x: nx - head.x, y: ny - head.y };
      }
    }

    snake.unshift({ x: nx, y: ny });
    var ate = willEat;

    if (ate) {
      score += 12 * level;
      addParticles(nx, ny, '#fbbf24');
      if (snake.length >= totalCells) {
        levelClear();
        draw();
        return;
      }
      spawnFood();
    } else {
      snake.pop();
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
        ctx.fillStyle = (x + y) % 2 === 0 ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
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
    ctx.font = 'bold ' + Math.floor(cellSize * 1.35) + 'px system-ui,sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 20;
    ctx.fillText('🏆 满盘通关', canvas.width / 2, canvas.height / 2 - cellSize);
    ctx.font = '600 ' + Math.floor(cellSize * 0.72) + 'px system-ui,sans-serif';
    ctx.fillStyle = '#a5f3fc';
    ctx.fillText('哈密顿 AI · 只赢不输 · 下一关加速', canvas.width / 2, canvas.height / 2 + cellSize);
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
    resetGame(true);
    draw();
  });
})();
