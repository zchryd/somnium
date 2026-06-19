/* SOMNIUM · puzzles — sokoban, memory chimes, vignette scenes, logic/cipher panels */
'use strict';

/* ───────────────────────── Sokoban ───────────────────────── */

class SokobanScene {
  constructor(cfg, onSolve) {
    this.cfg = cfg;
    this.onSolve = onSolve;
    this.solved = false;
    this.sparks = [];
    this.history = [];
    this.parse(cfg.map);
  }

  parse(rows) {
    this.walls = new Set();
    this.floors = new Set();
    this.targets = new Set();
    this.blocks = [];
    let minx = 99, miny = 99, maxx = -99, maxy = -99;
    rows.forEach((row, gy) => {
      [...row].forEach((ch, gx) => {
        if (ch === ' ') return;
        minx = Math.min(minx, gx); maxx = Math.max(maxx, gx);
        miny = Math.min(miny, gy); maxy = Math.max(maxy, gy);
        const k = gx + ',' + gy;
        if (ch === '#') { this.walls.add(k); return; }
        this.floors.add(k);
        if (ch === 'T') this.targets.add(k);
        if (ch === 'B') this.blocks.push({ gx, gy, rx: gx, ry: gy });
        if (ch === 'P') this.player = { gx, gy, rx: gx, ry: gy };
      });
    });
    const c = Iso.proj((minx + maxx + 1) / 2, (miny + maxy + 1) / 2, 0);
    this.cx = c.x; this.cy = c.y;
    this.bounds = { minx, miny, maxx, maxy };
    // every occupied cell, for fit-scaling (padTop: block tops + glyphs; padBot: keels)
    const cells = [...this.floors, ...this.walls].map(k => k.split(',').map(Number));
    this.contentHalf = Iso.gridHalfExtent(cells, this.cx, this.cy, 78, 58);
  }

  reset() {
    if (this.solved) return;
    this.history = [];
    this.parse(this.cfg.map);
  }

  undo() {
    if (this.solved) return;
    const h = this.history.pop();
    if (!h) return;
    Object.assign(this.player, { gx: h.px, gy: h.py });
    if (h.bi != null) Object.assign(this.blocks[h.bi], { gx: h.bx, gy: h.by });
  }

  isWall(x, y) { return this.walls.has(x + ',' + y) || !this.floors.has(x + ',' + y); }
  blockAt(x, y) { return this.blocks.findIndex(b => b.gx === x && b.gy === y); }

  tryMove(dx, dy) {
    if (this.solved) return;
    const p = this.player;
    if (Math.abs(p.rx - p.gx) > 0.18 || Math.abs(p.ry - p.gy) > 0.18) return; // mid-step
    const nx = p.gx + dx, ny = p.gy + dy;
    if (this.isWall(nx, ny)) return;
    const bi = this.blockAt(nx, ny);
    if (bi >= 0) {
      const bx = nx + dx, by = ny + dy;
      if (this.isWall(bx, by) || this.blockAt(bx, by) >= 0) { Sound.thud(); return; }
      this.history.push({ px: p.gx, py: p.gy, bi, bx: nx, by: ny });
      this.blocks[bi].gx = bx;
      this.blocks[bi].gy = by;
      if (this.targets.has(bx + ',' + by)) Sound.chime(2);
      else Sound.click();
    } else {
      this.history.push({ px: p.gx, py: p.gy, bi: null });
    }
    p.gx = nx; p.gy = ny;
    this.checkWin();
  }

  checkWin() {
    if (!this.blocks.every(b => this.targets.has(b.gx + ',' + b.gy))) return;
    this.solved = true;
    Sound.solve();
    for (const b of this.blocks) {
      const p = Iso.proj(b.gx + 0.5, b.gy + 0.5, 0.8);
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 30 + Math.random() * 90;
        this.sparks.push({
          x: p.x - this.cx, y: p.y - this.cy,
          vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50,
          life: 1.2 + Math.random() * 0.8,
        });
      }
    }
    setTimeout(() => this.onSolve(), 1300);
  }

  key(e) {
    const map = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    };
    const d = map[e.key];
    if (d) { e.preventDefault(); this.tryMove(d[0], d[1]); }
    if (e.key === 'z') this.undo();
    if (e.key === 'r') this.reset();
  }

  update(dt) {
    const ease = (e) => {
      e.rx = Math.abs(e.gx - e.rx) < 0.01 ? e.gx : e.rx + (e.gx - e.rx) * Math.min(1, 14 * dt);
      e.ry = Math.abs(e.gy - e.ry) < 0.01 ? e.gy : e.ry + (e.gy - e.ry) * Math.min(1, 14 * dt);
    };
    ease(this.player);
    this.blocks.forEach(ease);
    for (const s of this.sparks) {
      s.life -= dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.vy += 30 * dt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
  }

  draw(ctx, t) {
    const bob = Math.sin(t * 0.5) * 5;
    ctx.save();
    ctx.translate(-this.cx, -this.cy + bob);

    for (const k of this.floors) {
      const [gx, gy] = k.split(',').map(Number);
      Iso.drawKeel(ctx, gx, gy, '#0a0e1c', 1);
    }
    for (const k of this.walls) {
      const [gx, gy] = k.split(',').map(Number);
      if (this.floors.size && (this.floors.has((gx - 1) + ',' + gy) || this.floors.has((gx + 1) + ',' + gy) ||
          this.floors.has(gx + ',' + (gy - 1)) || this.floors.has(gx + ',' + (gy + 1))))
        Iso.drawKeel(ctx, gx, gy, '#0a0e1c', 1);
    }

    for (const k of this.floors) {
      const [gx, gy] = k.split(',').map(Number);
      const alt = (gx + gy) % 2 === 0;
      Iso.drawBlock(ctx, gx, gy, {
        z0: -0.4, z1: 0,
        top: alt ? '#1d2543' : '#212a4c',
        left: '#141a30', right: '#0f1425',
      });
    }
    // targets: pulsing sigils
    const pulse = 0.45 + 0.3 * Math.sin(t * 2.2);
    for (const k of this.targets) {
      const [gx, gy] = k.split(',').map(Number);
      ctx.save();
      ctx.globalAlpha = pulse;
      Iso.drawTile(ctx, gx, gy, 0.02, 'rgba(240,163,124,0.13)', { inset: 0.2, stroke: 'rgba(240,163,124,0.9)' });
      ctx.globalAlpha = 1;
      const p = Iso.proj(gx + 0.5, gy + 0.5, 0.02);
      Iso.drawGlyph(ctx, 3, p.x, p.y, 7 + pulse * 3, `rgba(255,217,163,${pulse})`, 1.4);
      ctx.restore();
    }

    // depth-sorted entities
    const ents = [];
    for (const k of this.walls) {
      const [gx, gy] = k.split(',').map(Number);
      ents.push({ d: gx + gy, draw: () => Iso.drawBlock(ctx, gx, gy, {
        z0: 0, z1: 0.85, top: '#283154', left: '#1a2140', right: '#131830',
      }) });
    }
    for (const b of this.blocks) {
      const on = this.targets.has(b.gx + ',' + b.gy);
      const fl = 0.05 + 0.035 * Math.sin(t * 1.6 + b.gx * 2 + b.gy);
      ents.push({ d: b.rx + b.ry, draw: () => Iso.drawBlock(ctx, b.rx, b.ry, {
        z0: fl, z1: 0.78 + fl, inset: 0.13,
        top:  on ? '#ffd9a3' : '#b9c6ec',
        left: on ? '#e8a87c' : '#7f8fc4',
        right:on ? '#b9744f' : '#57649a',
        glow: on ? 'rgba(240,163,124,0.4)' : 'rgba(185,198,236,0.14)',
      }) });
    }
    const pl = this.player;
    ents.push({ d: pl.rx + pl.ry, draw: () => {
      const p = Iso.proj(pl.rx + 0.5, pl.ry + 0.5, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      const hover = 0.52 + 0.06 * Math.sin(t * 2.4);
      const o = Iso.proj(pl.rx + 0.5, pl.ry + 0.5, hover);
      const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 46);
      g.addColorStop(0, 'rgba(255,217,163,0.85)');
      g.addColorStop(0.3, 'rgba(240,163,124,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(o.x - 46, o.y - 46, 92, 92);
      ctx.fillStyle = '#ffe9cb';
      ctx.beginPath();
      ctx.arc(o.x, o.y, 7.5, 0, Math.PI * 2);
      ctx.fill();
    } });

    ents.sort((a, b) => a.d - b.d);
    ents.forEach(e => e.draw());

    ctx.restore();

    // sparks live in scene-local space — draw after the centering translate
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
      ctx.fillStyle = '#ffd9a3';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ───────────────────────── Memory ───────────────────────── */

class MemoryScene {
  constructor(cfg, onSolve) {
    this.cfg = cfg;
    this.onSolve = onSolve;
    this.phase = 'idle';
    this.pos = 0;
    this.flash = null;       // {i, until}
    this.errorUntil = 0;
    this.timers = [];
    this.sparks = [];
    this.solved = false;

    const n = cfg.count;
    this.peds = [];
    for (let i = 0; i < n; i++) {
      this.peds.push({ gx: i * 1.5, gy: (n - 1 - i) * 1.5, glyph: cfg.glyphs[i] });
    }
    const c = Iso.proj((n * 1.5) / 2, (n * 1.5) / 2, 0);
    this.cx = c.x; this.cy = c.y;
    // pedestal cells, padded for floating glyph-screens above and labels below
    this.contentHalf = Iso.gridHalfExtent(
      this.peds.map(p => [p.gx, p.gy]), this.cx, this.cy, 104, 150);
    this.screens = this.peds.map(p => {
      const s = Iso.proj(p.gx + 0.5, p.gy + 0.5, 1.0);
      return { x: s.x - this.cx, y: s.y - this.cy - 40 };
    });
    this.startTimer(700);
  }

  startTimer(delay) {
    this.timers.push(setTimeout(() => this.playSequence(), delay));
  }

  playSequence() {
    this.phase = 'watch';
    this.pos = 0;
    const { seq, tempoOn, tempoGap } = this.cfg;
    seq.forEach((idx, k) => {
      this.timers.push(setTimeout(() => {
        this.flash = { i: idx, until: performance.now() + tempoOn };
        Sound.chime(this.peds[idx].glyph);
      }, k * (tempoOn + tempoGap)));
    });
    this.timers.push(setTimeout(() => { this.phase = 'echo'; },
      seq.length * (this.cfg.tempoOn + this.cfg.tempoGap) + 150));
  }

  replay() {
    if (this.solved || this.phase === 'watch') return;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.phase = 'watch';
    this.startTimer(350);
  }

  dispose() { this.timers.forEach(clearTimeout); }

  click(x, y) {
    if (this.phase !== 'echo' || this.solved) return;
    let best = -1, bd = 1e9;
    this.screens.forEach((s, i) => {
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0 || bd > 52 * 52) return;
    const want = this.cfg.seq[this.pos];
    if (best === want) {
      this.flash = { i: best, until: performance.now() + 300, good: true };
      Sound.chime(this.peds[best].glyph);
      this.pos++;
      if (this.pos >= this.cfg.seq.length) this.win();
    } else {
      Sound.wrong();
      this.errorUntil = performance.now() + 600;
      this.phase = 'watch';
      this.pos = 0;
      this.startTimer(1000);
    }
  }

  win() {
    this.solved = true;
    this.phase = 'done';
    Sound.solve();
    for (const s of this.screens) {
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 26 + Math.random() * 70;
        this.sparks.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 1.4 });
      }
    }
    setTimeout(() => this.onSolve(), 1300);
  }

  update(dt) {
    for (const s of this.sparks) {
      s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 26 * dt;
    }
    this.sparks = this.sparks.filter(s => s.life > 0);
  }

  draw(ctx, t) {
    const bob = Math.sin(t * 0.5) * 5;
    const now = performance.now();
    ctx.save();
    ctx.translate(-this.cx, -this.cy + bob);

    for (const p of this.peds) {
      Iso.drawKeel(ctx, p.gx, p.gy, '#0a0e1c', 1);
    }
    for (const p of this.peds) {
      Iso.drawBlock(ctx, p.gx, p.gy, { z0: -0.35, z1: 0, top: '#1f2847', left: '#151b33', right: '#101526' });
    }

    const order = [...this.peds.keys()].sort((a, b) =>
      (this.peds[a].gx + this.peds[a].gy) - (this.peds[b].gx + this.peds[b].gy));

    for (const i of order) {
      const p = this.peds[i];
      const flashing = this.flash && this.flash.i === i && now < this.flash.until;
      const good = flashing && this.flash.good;
      const err = now < this.errorUntil;
      Iso.drawBlock(ctx, p.gx, p.gy, {
        z0: 0, z1: 1.0, inset: 0.2,
        top:  flashing ? (good ? '#bdeee6' : '#ffd9a3') : '#2b3457',
        left: flashing ? (good ? '#79c9bd' : '#e8a87c') : '#1c2342',
        right:flashing ? (good ? '#4f9d92' : '#b9744f') : '#141a31',
        glow: flashing ? (good ? 'rgba(143,216,205,0.5)' : 'rgba(240,163,124,0.55)') : null,
      });
      const s = Iso.proj(p.gx + 0.5, p.gy + 0.5, 1.0);
      const col = err ? 'rgba(224,133,133,0.9)'
        : flashing ? (good ? '#bdeee6' : '#ffe9cb')
        : 'rgba(147,160,192,0.75)';
      const size = flashing ? 19 : 15;
      Iso.drawGlyph(ctx, p.glyph, s.x, s.y - 40, size, col);
    }

    // progress lights
    const n = this.cfg.seq.length;
    const y0 = Iso.proj(this.cfg.count * 0.75, this.cfg.count * 0.75, 0).y + 92;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 26;
      const lit = this.phase === 'echo' && i < this.pos || this.solved;
      ctx.globalAlpha = lit ? 0.95 : 0.25;
      ctx.fillStyle = lit ? '#8fd8cd' : '#93a0c0';
      ctx.beginPath();
      ctx.arc(x, y0, lit ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // phase whisper
    ctx.font = 'italic 17px "EB Garamond", serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(147,160,192,0.8)';
    const msg = this.solved ? 'the song remembers you'
      : this.phase === 'watch' ? 'listen…'
      : this.phase === 'echo' ? 'sing it back' : '';
    ctx.fillText(msg, 0, y0 + 38);

    ctx.restore();

    // sparks live in scene-local space — draw after the centering translate
    for (const s of this.sparks) {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life));
      ctx.fillStyle = '#bdeee6';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/* ────────────────── Vignette (backdrop for panel puzzles) ────────────────── */

class VignetteScene {
  constructor(kind) {
    this.kind = kind;
    this.camY = 110; // sit low; the panel floats above
  }

  draw(ctx, t) {
    const bob = Math.sin(t * 0.5) * 6;
    ctx.save();
    const c = Iso.proj(1.5, 1.5, 0);
    ctx.translate(-c.x, -c.y + bob);

    for (let gx = 0; gx < 3; gx++) for (let gy = 0; gy < 3; gy++) {
      Iso.drawKeel(ctx, gx, gy, '#0a0e1c', 1);
    }
    for (let gx = 0; gx < 3; gx++) for (let gy = 0; gy < 3; gy++) {
      Iso.drawBlock(ctx, gx, gy, {
        z0: -0.45, z1: 0,
        top: (gx + gy) % 2 ? '#202a4a' : '#1c2541',
        left: '#141a30', right: '#0f1425',
      });
    }

    if (this.kind === 'logic') {
      const ob = { top: '#39456b', left: '#222a47', right: '#171d33' };
      Iso.drawBlock(ctx, 0.15, 1.0, { z0: 0, z1: 1.7, inset: 0.34, ...ob });
      Iso.drawBlock(ctx, 1.05, 0.1, { z0: 0, z1: 2.3, inset: 0.36, ...ob });
      Iso.drawBlock(ctx, 2.1, 0.6, { z0: 0, z1: 1.9, inset: 0.35, ...ob });
      // constellation overhead
      const pts = [[-130, -300], [-40, -360], [60, -330], [150, -390], [10, -260]];
      ctx.strokeStyle = 'rgba(231,197,116,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.stroke();
      pts.forEach(([x, y], i) => {
        const a = 0.5 + 0.45 * Math.sin(t * 1.4 + i * 1.7);
        ctx.fillStyle = `rgba(231,197,116,${a})`;
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (this.kind === 'cipher') {
      const chars = 'SOMNIVMÆTHER';
      ctx.textAlign = 'center';
      for (let i = 0; i < chars.length; i++) {
        const a = t * 0.18 + (i / chars.length) * Math.PI * 2;
        const x = Math.cos(a) * 250;
        const y = -170 + Math.sin(a) * 60 + Math.sin(t * 0.9 + i) * 10;
        const alpha = 0.14 + 0.2 * (0.5 + 0.5 * Math.sin(a));
        ctx.fillStyle = `rgba(143,216,205,${alpha})`;
        ctx.font = `${22 + 8 * Math.sin(i * 2.7)}px Italiana, serif`;
        ctx.fillText(chars[i], x, y);
      }
    }
    ctx.restore();
  }
}

/* ────────────────── symbol icons (logic puzzle) ────────────────── */

const SYMBOL_SVG = {
  moon: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M27 6a14 14 0 1 0 7 22A12 12 0 0 1 27 6z"/></svg>',
  star: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 4v32M4 20h32M9.5 9.5l21 21M30.5 9.5l-21 21" opacity=".4"/><path d="M20 9v22M9 20h22"/></svg>',
  key:  '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="14" cy="14" r="7"/><path d="M19 19L33 33M33 33v-6M28 28h-5"/></svg>',
  lantern: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 4v4M14 8h12M15 8l-2 18a7 7 0 0 0 14 0L25 8M13 30h14"/><circle cx="20" cy="20" r="3" fill="currentColor" stroke="none"/></svg>',
  mirror: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="20" cy="16" rx="10" ry="13"/><path d="M20 29v7M15 36h10M16 10a6 8 0 0 1 3-3" opacity=".7"/></svg>',
  fox:  '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><path d="M8 6l6 8h12l6-8 2 14-14 14L6 20z"/><path d="M16 22l4 4 4-4" opacity=".7"/></svg>',
};

/* ────────────────── logic panel ────────────────── */

function buildLogicPanel(cfg, panel, onSolve) {
  panel.innerHTML = '';
  panel.classList.remove('hidden');

  const note = document.createElement('p');
  note.className = 'panel-clue-note';
  note.textContent = 'seat the dream’s witnesses in their true order';
  panel.appendChild(note);

  const slotRow = document.createElement('div');
  slotRow.className = 'slot-row';
  const slots = cfg.solution.map(() => null);
  const slotEls = cfg.solution.map(() => {
    const el = document.createElement('div');
    el.className = 'slot';
    slotRow.appendChild(el);
    return el;
  });
  panel.appendChild(slotRow);

  const chipRow = document.createElement('div');
  chipRow.className = 'chip-row';
  let selected = null;
  const chipEls = {};
  cfg.chipOrder.forEach(id => {
    const el = document.createElement('div');
    el.className = 'chip';
    el.innerHTML = SYMBOL_SVG[id];
    el.title = cfg.names[id];
    chipEls[id] = el;
    el.addEventListener('click', () => {
      if (el.classList.contains('ghost')) return;
      Sound.click();
      if (selected === id) { selected = null; el.classList.remove('selected'); return; }
      if (selected) chipEls[selected].classList.remove('selected');
      selected = id;
      el.classList.add('selected');
    });
    chipRow.appendChild(el);
  });
  panel.appendChild(chipRow);

  slotEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      Sound.click();
      if (selected) {
        if (slots[i]) chipEls[slots[i]].classList.remove('ghost'); // bump out occupant
        slots[i] = selected;
        el.innerHTML = SYMBOL_SVG[selected];
        el.classList.add('filled');
        chipEls[selected].classList.add('ghost');
        chipEls[selected].classList.remove('selected');
        selected = null;
      } else if (slots[i]) {
        chipEls[slots[i]].classList.remove('ghost');
        slots[i] = null;
        el.innerHTML = '';
        el.classList.remove('filled');
      }
    });
  });

  const clues = document.createElement('ul');
  clues.className = 'clue-list';
  cfg.clues.forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    clues.appendChild(li);
  });
  panel.appendChild(clues);

  const check = document.createElement('button');
  check.className = 'btn btn-primary';
  check.textContent = 'so be it';
  check.addEventListener('click', () => {
    if (slots.some(s => !s)) { shake(panel); return; }
    if (slots.join() === cfg.solution.join()) {
      slotEls.forEach(el => { el.style.borderColor = 'rgba(143,216,205,.9)'; });
      onSolve();
    } else {
      Sound.wrong();
      shake(panel);
    }
  });
  panel.appendChild(check);
}

/* ────────────────── cipher panel ────────────────── */

function buildCipherPanel(cfg, panel, onSolve) {
  panel.innerHTML = '';
  panel.classList.remove('hidden');

  const riddle = document.createElement('p');
  riddle.className = 'panel-riddle';
  riddle.textContent = '“' + cfg.riddle + '”';
  panel.appendChild(riddle);

  if (cfg.note) {
    const note = document.createElement('p');
    note.className = 'panel-clue-note';
    note.textContent = cfg.note;
    panel.appendChild(note);
  }

  if (cfg.mode === 'tiles') {
    const answerRow = document.createElement('div');
    answerRow.className = 'answer-row';
    const cells = [...cfg.answer].map(() => {
      const el = document.createElement('div');
      el.className = 'answer-cell';
      answerRow.appendChild(el);
      return el;
    });
    panel.appendChild(answerRow);

    const tileRow = document.createElement('div');
    tileRow.className = 'tile-row';
    const placed = cells.map(() => null); // tile index per cell
    const tiles = [...cfg.scramble].map((ch, ti) => {
      const el = document.createElement('div');
      el.className = 'tile';
      el.textContent = ch;
      el.addEventListener('click', () => {
        if (el.classList.contains('used')) return;
        const i = placed.indexOf(null);
        if (i < 0) return;
        Sound.click();
        placed[i] = ti;
        cells[i].textContent = ch;
        el.classList.add('used');
        if (placed.every(p => p !== null)) {
          const word = placed.map(p => cfg.scramble[p]).join('');
          if (word === cfg.answer) {
            cells.forEach(c => { c.style.borderColor = 'rgba(143,216,205,.9)'; c.style.color = '#8fd8cd'; });
            onSolve();
          } else {
            Sound.wrong();
            shake(panel);
          }
        }
      });
      tileRow.appendChild(el);
      return el;
    });
    panel.appendChild(tileRow);

    cells.forEach((cell, i) => {
      cell.addEventListener('click', () => {
        if (placed[i] === null) return;
        Sound.click();
        tiles[placed[i]].classList.remove('used');
        placed[i] = null;
        cell.textContent = '';
      });
    });
  } else { // typed answer
    const ct = document.createElement('p');
    ct.className = 'cipher-text';
    ct.textContent = cfg.ciphertext;
    panel.appendChild(ct);

    const input = document.createElement('input');
    input.className = 'cipher-input';
    input.maxLength = cfg.answer.length + 4;
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    panel.appendChild(input);

    const submit = document.createElement('button');
    submit.className = 'btn btn-primary';
    submit.textContent = 'speak it';
    const attempt = () => {
      if (input.value.trim().toUpperCase() === cfg.answer) {
        input.style.borderColor = 'rgba(143,216,205,.9)';
        input.disabled = true;
        onSolve();
      } else {
        Sound.wrong();
        shake(panel);
      }
    };
    submit.addEventListener('click', attempt);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); e.stopPropagation(); });
    panel.appendChild(document.createElement('br'));
    panel.appendChild(submit);
    setTimeout(() => input.focus(), 600);
  }
}

function shake(panel) {
  panel.classList.remove('shake');
  void panel.offsetWidth;
  panel.classList.add('shake');
}
