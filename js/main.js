/* SOMNIUM · main — game state, screens, save, wiring */
'use strict';

const Game = {
  node: null,
  tally: { spatial: 0, logic: 0, cipher: 0, memory: 0 },
  path: [],          // type of each counted puzzle solved, in order
  hints: 0,
  currentPuzzle: null,   // active scene or panel
  currentDoor: null,
};

const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'somnium-save';

/* ── persistence ── */

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      node: Game.node, tally: Game.tally, path: Game.path, hints: Game.hints,
    }));
  } catch (e) { /* private mode etc. */ }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.node || !STORY[data.node]) return null;
    return data;
  } catch (e) { return null; }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

/* ── screens ── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
}

function veil(text, holdMs, after) {
  const v = $('veil');
  $('veil-text').textContent = text;
  v.classList.add('show');
  setTimeout(() => {
    after();
    setTimeout(() => v.classList.remove('show'), 150);
  }, holdMs);
}

/* ── story flow ── */

function startNode(id) {
  disposePuzzle();
  Game.node = id;
  save();
  const node = STORY[id];
  const amb = new AmbientScene(id === 'threshold' ? 'title' : 'plain');
  amb.camY = 175; // sink the islands beneath the prose
  Stage.setScene(amb);

  $('story-depth').textContent = node.depth;
  const prose = $('story-prose');
  prose.innerHTML = '';
  node.lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.className = 'line';
    span.style.setProperty('--i', i);
    span.innerHTML = line;
    prose.appendChild(span);
  });
  const btn = $('btn-story-continue');
  btn.style.setProperty('--btn-delay', (0.6 + node.lines.length * 0.55) + 's');
  btn.textContent = node.doors.length > 1 ? 'approach the doors' : 'approach the door';
  showScreen('screen-story');
}

function showDoors() {
  const node = STORY[Game.node];
  $('doors-depth').textContent = node.depth;
  $('doors-title').textContent = node.doorsTitle;
  const row = $('door-row');
  row.innerHTML = '';
  node.doors.forEach((door, i) => {
    const cfg = PUZZLES[door.puzzle];
    const card = document.createElement('button');
    card.className = 'door-card';
    card.style.setProperty('--i', i);
    card.innerHTML = `
      <div class="door-sigil">${DOOR_SIGIL[cfg.type]}</div>
      <div class="door-name">${door.name}</div>
      <div class="door-kind">${DOOR_FLAVOR[cfg.type].sub}</div>`;
    card.addEventListener('click', () => { Sound.door(); startPuzzle(door); });
    row.appendChild(card);
  });
  showScreen('screen-doors');
}

/* ── puzzles ── */

function disposePuzzle() {
  if (Game.currentPuzzle && Game.currentPuzzle.dispose) Game.currentPuzzle.dispose();
  Game.currentPuzzle = null;
  Game.currentDoor = null;
  $('puzzle-panel').classList.add('hidden');
  $('puzzle-panel').innerHTML = '';
  $('dpad').classList.add('hidden');
  $('puzzle-hint').classList.add('hidden');
}

function hudButton(label, onClick) {
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function startPuzzle(door) {
  disposePuzzle();
  Game.currentDoor = door;
  const cfg = PUZZLES[door.puzzle];

  $('puzzle-kicker').textContent = STORY[Game.node].depth + ' · door of ' + TYPE_LABEL[cfg.type];
  $('puzzle-title').textContent = cfg.title;
  $('puzzle-objective').textContent = cfg.objective;
  const hintEl = $('puzzle-hint');
  hintEl.classList.add('hidden');
  hintEl.textContent = cfg.hint;

  const controls = $('puzzle-controls');
  controls.innerHTML = '';
  controls.appendChild(hudButton('drift back', () => { disposePuzzle(); showDoors(); }));
  controls.appendChild(hudButton('a whisper of help', () => {
    if (hintEl.classList.contains('hidden')) { Game.hints++; save(); }
    hintEl.classList.remove('hidden');
  }));

  const onSolve = () => onPuzzleSolved(door, cfg);

  if (cfg.type === 'spatial') {
    const scene = new SokobanScene(cfg, onSolve);
    Game.currentPuzzle = scene;
    Stage.setScene(scene);
    $('dpad').classList.remove('hidden');
    controls.appendChild(hudButton('undo', () => scene.undo()));
    controls.appendChild(hudButton('begin again', () => scene.reset()));
  } else if (cfg.type === 'memory') {
    const scene = new MemoryScene(cfg, onSolve);
    Game.currentPuzzle = scene;
    Stage.setScene(scene);
    controls.appendChild(hudButton('hear it again', () => scene.replay()));
  } else if (cfg.type === 'logic') {
    Stage.setScene(new VignetteScene('logic'));
    buildLogicPanel(cfg, $('puzzle-panel'), onSolve);
    Game.currentPuzzle = { dispose() {} };
  } else { // cipher
    Stage.setScene(new VignetteScene('cipher'));
    buildCipherPanel(cfg, $('puzzle-panel'), onSolve);
    Game.currentPuzzle = { dispose() {} };
  }

  showScreen('screen-puzzle');
}

const VEIL_LINES = [
  'the door remembers you',
  'the dream takes note',
  'somewhere, a lock forgets its shape',
  'the other doors sigh, and seal',
];
let veilIdx = 0;

function onPuzzleSolved(door, cfg) {
  if (door.counts !== false) {
    Game.tally[cfg.type]++;
    Game.path.push(cfg.type);
  }
  save();
  Sound.door();
  const line = VEIL_LINES[veilIdx++ % VEIL_LINES.length];
  setTimeout(() => {
    veil(line, 2100, () => {
      disposePuzzle();
      if (door.leadsTo === 'ending') showEnding();
      else startNode(door.leadsTo);
    });
  }, 500);
}

/* ── ending ── */

function pickEnding() {
  const t = Game.tally;
  const entries = Object.entries(t).sort((a, b) => b[1] - a[1]);
  const [bestType, bestN] = entries[0];
  const tied = entries.filter(([, n]) => n === bestN).length > 1;
  return tied ? 'lucid' : bestType;
}

function showEnding() {
  const key = pickEnding();
  const end = ENDINGS[key];
  const amb = new AmbientScene('title');
  amb.camY = 160;
  Stage.setScene(amb);

  $('ending-title').textContent = end.title;
  const prose = $('ending-prose');
  prose.innerHTML = '';
  end.lines.forEach((line, i) => {
    const span = document.createElement('span');
    span.className = 'line';
    span.style.setProperty('--i', i);
    span.innerHTML = line;
    prose.appendChild(span);
  });

  const delay = (0.6 + end.lines.length * 0.55) + 's';
  const stats = $('ending-stats');
  stats.style.setProperty('--btn-delay', delay);
  $('btn-wake').style.setProperty('--btn-delay', delay);
  const pathStr = Game.path.map(t => TYPE_LABEL[t]).join(' · ');
  stats.innerHTML =
    `your path — ${pathStr || 'unwalked'}<br>` +
    `whispers of help — ${Game.hints}`;

  clearSave();
  showScreen('screen-ending');
}

/* ── reset / boot ── */

function freshDream() {
  Game.tally = { spatial: 0, logic: 0, cipher: 0, memory: 0 };
  Game.path = [];
  Game.hints = 0;
  veilIdx = 0;
  startNode('threshold');
}

function boot() {
  Stage.init();
  Stage.setScene(new AmbientScene('title'));
  showScreen('screen-title');

  const saved = loadSave();
  if (saved && saved.node !== 'threshold') {
    $('btn-continue').classList.remove('hidden');
  }

  $('btn-begin').addEventListener('click', () => { Sound.door(); freshDream(); });
  $('btn-continue').addEventListener('click', () => {
    const s = loadSave();
    if (!s) { freshDream(); return; }
    Game.tally = s.tally; Game.path = s.path; Game.hints = s.hints;
    Sound.door();
    startNode(s.node);
  });
  $('btn-story-continue').addEventListener('click', () => { Sound.click(); showDoors(); });
  $('btn-wake').addEventListener('click', () => {
    Sound.click();
    showScreen('screen-title');
    Stage.setScene(new AmbientScene('title'));
  });

  $('btn-mute').addEventListener('click', () => {
    const m = !Sound.isMuted();
    Sound.setMuted(m);
    $('btn-mute').classList.toggle('muted', m);
  });

  document.querySelectorAll('#dpad button').forEach(b => {
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    b.addEventListener('click', () => {
      const s = Game.currentPuzzle;
      if (s && s.tryMove) s.tryMove(...dirs[b.dataset.dir]);
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    Stage.key(e);
    if (e.key === 'Enter') {
      const active = document.querySelector('.screen.active');
      if (active && active.id === 'screen-story') $('btn-story-continue').click();
    }
  });

  // dev shortcuts: ?node=atrium · ?node=atrium&doors=1 · ?puzzle=sok-h1 · ?end=poet
  const params = new URLSearchParams(location.search);
  if (params.get('end')) {
    const key = params.get('end');
    if (key !== 'lucid' && Game.tally[key] !== undefined) Game.tally[key] = 2;
    Game.path = ['cipher', 'logic', 'memory'];
    showEnding();
    return;
  }
  if (params.get('puzzle') && PUZZLES[params.get('puzzle')]) {
    Game.node = 'atrium';
    startPuzzle({ puzzle: params.get('puzzle'), leadsTo: 'ending' });
  } else if (params.get('node') && STORY[params.get('node')]) {
    startNode(params.get('node'));
    if (params.get('doors')) showDoors();
  }
}

boot();
