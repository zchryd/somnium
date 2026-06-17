/* SOMNIUM · story — puzzle registry, branching node graph, endings */
'use strict';

/* ────────────────── door sigils ────────────────── */

const DOOR_SIGIL = {
  spatial: `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
    <path d="M30 8l20 11.5v21L30 52 10 40.5v-21z"/>
    <path d="M30 8v21.5M10 19.5l20 10M50 19.5l-20 10M30 29.5V52" opacity=".55"/></svg>`,
  logic: `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
    <path d="M12 44L26 22l12 8 12-20" opacity=".5"/>
    <circle cx="12" cy="44" r="2.6" fill="currentColor"/><circle cx="26" cy="22" r="2.6" fill="currentColor"/>
    <circle cx="38" cy="30" r="2.6" fill="currentColor"/><circle cx="50" cy="10" r="2.6" fill="currentColor"/>
    <circle cx="44" cy="48" r="1.8" fill="currentColor" opacity=".6"/></svg>`,
  cipher: `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M30 50c-11 0-19-8-19-18S19 14 29 14s17 7 17 15-6 13-14 13-12-5-12-11 4-9 9-9 8 3 8 7-3 6-6 6" />
  </svg>`,
  memory: `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <circle cx="30" cy="30" r="6"/><circle cx="30" cy="30" r="13" stroke-dasharray="3 5"/>
    <circle cx="30" cy="30" r="20" stroke-dasharray="2 7" opacity=".6"/></svg>`,
};

const DOOR_FLAVOR = {
  spatial: { kind: 'stone',  sub: 'something heavy waits to be moved' },
  logic:   { kind: 'stars',  sub: 'a deduction, cool and exact' },
  cipher:  { kind: 'script', sub: 'letters wearing each other’s clothes' },
  memory:  { kind: 'song',   sub: 'an echo that wants repeating' },
};

/* ────────────────── puzzle registry ────────────────── */

const PUZZLES = {
  /* memory */
  'mem-threshold': {
    type: 'memory', title: 'The Three Chimes',
    objective: 'listen to the song, then sing it back',
    hint: 'the chimes light as they ring — repeat them in the same order, left hand is low.',
    count: 3, glyphs: [0, 3, 5], seq: [0, 2, 1], tempoOn: 600, tempoGap: 200,
  },
  'mem-bells': {
    type: 'memory', title: 'The Choir of Branches',
    objective: 'five bells, one old song — return it whole',
    hint: 'hum along while you watch; your throat will remember what your eyes forget.',
    count: 5, glyphs: [0, 1, 2, 3, 4], seq: [1, 3, 0, 4, 2], tempoOn: 480, tempoGap: 160,
  },
  'mem-deep': {
    type: 'memory', title: 'The Meadow That Listens',
    objective: 'seven notes — the meadow forgives nothing',
    hint: 'break it into halves: learn the first four, then the last three.',
    count: 6, glyphs: [0, 1, 2, 3, 4, 5], seq: [3, 1, 5, 0, 4, 2, 5], tempoOn: 380, tempoGap: 130,
  },
  'mem-locks': {
    type: 'memory', title: 'The Seven Tumblers',
    objective: 'the lock sings its combination once',
    hint: 'one glyph rings twice — at the second and the last. anchor on it.',
    count: 6, glyphs: [5, 4, 3, 2, 1, 0], seq: [2, 5, 1, 4, 0, 3, 1], tempoOn: 380, tempoGap: 130,
  },

  /* spatial — # wall · . floor · B block · T sigil · P you */
  'sok-easy': {
    type: 'spatial', title: 'The Stone That Dreams of Moving',
    objective: 'push the sleeping stone onto the burning sigil',
    hint: 'stones only ever move away from you — walk around to its far side first.',
    map: ['#######',
          '#..#..#',
          '#.P.B.#',
          '#..T..#',
          '#######'],
  },
  'sok-m1': {
    type: 'spatial', title: 'The Fallen Folios',
    objective: 'return both great volumes to their burning shelves',
    hint: 'each stone matches the sigil across from it — push along the rows, never toward a wall.',
    map: ['########',
          '#......#',
          '#.B..T.#',
          '#......#',
          '#.T..B.#',
          '#...P..#',
          '########'],
  },
  'sok-m2': {
    type: 'spatial', title: 'The Weirs of the Black Canal',
    objective: 'seat both floodstones on their sigils',
    hint: 'the right-hand stone must travel first — you cannot reach its push-side later.',
    map: ['########',
          '#..#...#',
          '#.B#.T.#',
          '#......#',
          '#.T.#B.#',
          '#.P.#..#',
          '########'],
  },
  'sok-h1': {
    type: 'spatial', title: 'The Hedge That Rearranges',
    objective: 'three stones, three sigils — the hedge watches',
    hint: 'clear the lowest stone leftward first; the middle stone wants to travel right, then up.',
    map: ['########',
          '#......#',
          '#.TBT..#',
          '#..B...#',
          '#.TB...#',
          '#..P...#',
          '#......#',
          '########'],
  },
  'sok-h2': {
    type: 'spatial', title: 'The Drowned Cloister',
    objective: 'three stones long to burn again',
    hint: 'the high stone cannot rise — the lintel blocks it. send it left, twice, before anything else crosses its row.',
    map: ['#########',
          '#...#...#',
          '#.T.B.T.#',
          '#...B...#',
          '#..TB...#',
          '#...P...#',
          '#########'],
  },

  /* logic */
  'logic-easy': {
    type: 'logic', title: 'Three Witnesses',
    objective: 'three figures saw you fall asleep — seat them truly',
    hint: 'start from the clue that names a fixed place, then the rest has nowhere to hide.',
    names: { fox: 'the Fox', key: 'the Key', moon: 'the Moon' },
    chipOrder: ['moon', 'fox', 'key'],
    solution: ['fox', 'key', 'moon'],
    clues: [
      'The Moon hangs at the rightmost seat.',
      'The Key rests beside the Moon.',
    ],
  },
  'logic-med': {
    type: 'logic', title: 'The Lockhouse Tribunal',
    objective: 'four witnesses, four seats, one true arrangement',
    hint: 'fix the Fox first; the Key follows it; what remains is decided by the Lantern.',
    names: { fox: 'the Fox', key: 'the Key', moon: 'the Moon', lantern: 'the Lantern' },
    chipOrder: ['moon', 'lantern', 'fox', 'key'],
    solution: ['fox', 'key', 'lantern', 'moon'],
    clues: [
      'The Fox keeps the far left seat.',
      'The Key sits beside the Fox.',
      'The Moon refuses to touch the Fox.',
      'The Lantern burns to the left of the Moon.',
    ],
  },
  'logic-hard': {
    type: 'logic', title: 'The Court of the Archive',
    objective: 'five witnesses — the archive accepts only the truth',
    hint: 'try the Moon at each edge; one of them strands the Lantern with nowhere to stand.',
    names: { fox: 'the Fox', key: 'the Key', moon: 'the Moon', lantern: 'the Lantern', mirror: 'the Mirror' },
    chipOrder: ['key', 'mirror', 'moon', 'fox', 'lantern'],
    solution: ['moon', 'mirror', 'fox', 'lantern', 'key'],
    clues: [
      'The Fox stands exactly in the middle.',
      'The Moon takes one edge; the Key takes the other.',
      'The Mirror touches the Moon.',
      'The Lantern stands to the right of the Mirror.',
    ],
  },

  /* cipher */
  'ana-mirror': {
    type: 'cipher', mode: 'tiles', title: 'The Word Worn Backwards',
    objective: 'unscramble the door’s true name',
    riddle: 'I hold your face but cannot keep it. In me, left swears it is right.',
    hint: 'you are looking at one right now, in a manner of speaking.',
    scramble: 'RMORIR', answer: 'MIRROR',
  },
  'caesar-shadow': {
    type: 'cipher', mode: 'input', title: 'The Drifted Letters',
    objective: 'read the inscription that slid in its sleep',
    note: 'every letter has drifted three steps forward into sleep — walk each one three steps back',
    riddle: 'It is yours alone, yet it only appears in light — and it always falls behind you.',
    hint: 'V becomes S. K becomes H. carry on.',
    ciphertext: 'VKDGRZ', answer: 'SHADOW',
  },
  'caesar-lantern': {
    type: 'cipher', mode: 'input', title: 'The Scriptorium’s Watchword',
    objective: 'undrift the watchword',
    note: 'these letters have sunk five steps deeper than waking — raise each one five steps',
    riddle: 'I swallow the dark and spit out the path.',
    hint: 'Q rises to L. F rises to A. the word burns.',
    ciphertext: 'QFSYJWS', answer: 'LANTERN',
  },
  'ana-labyrinth': {
    type: 'cipher', mode: 'tiles', title: 'The Unbound Index',
    objective: 'nine letters, one true name',
    riddle: 'I am a thousand turnings folded into a single room; those who walk me meet themselves coming back.',
    hint: 'it begins where books are kept by Borges, and minotaurs by myth.',
    scramble: 'BRANTHILY', answer: 'LABYRINTH',
  },
};

/* ────────────────── story graph ──────────────────
   Doors: { puzzle, name, leadsTo }. Solving a door commits the branch.   */

const STORY = {
  threshold: {
    depth: 'the threshold',
    doorsTitle: 'one door, breathing',
    lines: [
      'You fall asleep the way you always do — mid-thought, mid-worry, the lamp still on.',
      'But tonight the falling does not stop.',
      'You drift down through the floor of yourself and land, soft as ash, in a hall with no ceiling. Stars hang where the rafters should be.',
      'Ahead, a single door breathes slowly in and out. Three chimes hang beside it, still humming a song someone finished centuries ago.',
      'The door will open for anyone who can sing it back.',
    ],
    doors: [
      { puzzle: 'mem-threshold', name: 'the door that hums an old song', leadsTo: 'atrium', counts: false },
    ],
  },

  atrium: {
    depth: 'the first descent',
    doorsTitle: 'three doors wait, each dreaming a different dream',
    lines: [
      'The first door dissolves behind you like sugar in warm water.',
      'You stand in an atrium of impossible scale — staircases pour upward into mist, and somewhere far below, a tide turns over in its sleep.',
      'Three doors wait at the far wall.',
      'A door of <em>patient stone</em>, behind which something heavy shifts its weight. A door of <em>arranged stars</em>, cool and exact. A door <em>written in a forgotten hand</em>, its letters trading places when you blink.',
      'The dream does not care which you open. But it will remember.',
    ],
    doors: [
      { puzzle: 'sok-easy',   name: 'a door of patient stone',            leadsTo: 'garden' },
      { puzzle: 'logic-easy', name: 'a door of arranged stars',           leadsTo: 'library' },
      { puzzle: 'ana-mirror', name: 'a door written in a forgotten hand', leadsTo: 'canal' },
    ],
  },

  /* ── depth two ── */

  garden: {
    depth: 'the second descent',
    doorsTitle: 'the garden offers two gates',
    lines: [
      'The stone door grinds open onto a hanging garden, root-side up.',
      'Orchards grow downward into the sky; their fruit glows faintly, like windows of distant houses.',
      'Because you moved the stone, the dream has decided you are someone who <em>carries things</em>. Already your hands feel older. Stronger.',
      'Two gates stand among the inverted trees: a ring of bells grown straight out of the branches, and a garden wall inscribed in drifting script.',
    ],
    doors: [
      { puzzle: 'mem-bells',     name: 'the gate of grown bells',     leadsTo: 'meadow' },
      { puzzle: 'caesar-shadow', name: 'the wall of drifting script', leadsTo: 'hedge' },
    ],
  },

  library: {
    depth: 'the second descent',
    doorsTitle: 'the library permits two readers at a time — you, and you',
    lines: [
      'The stars rearrange and become a corridor of shelves.',
      'This is the library where every book you almost wrote is kept, spines uncracked, dust arranged with terrible care.',
      'Because you reasoned your way in, the dream has decided you are someone who <em>needs to know</em>. The thought pleases it. The shelves leans closer.',
      'Deeper in: a reading room where great volumes have fallen and must be reshelved, and a locked scriptorium whose watchword has drifted in its sleep.',
    ],
    doors: [
      { puzzle: 'sok-m1',         name: 'the reading room of fallen folios', leadsTo: 'archive' },
      { puzzle: 'caesar-lantern', name: 'the scriptorium’s drifting watchword', leadsTo: 'scriptorium' },
    ],
  },

  canal: {
    depth: 'the second descent',
    doorsTitle: 'the canal forks at the lockhouse',
    lines: [
      'The unscrambled word unlocks a night of black water.',
      'You stand on the towpath of a canal that flows uphill, carrying paper boats made of unsent letters. Each one is addressed in your handwriting.',
      'Because you untangled the word, the dream has decided you are someone who <em>listens to language</em>. The water spells things now, when it thinks you are watching.',
      'At the fork: a lockhouse where four witnesses argue about the order of things, and a flooded stair where the weirstones have slipped from their seats.',
    ],
    doors: [
      { puzzle: 'logic-med', name: 'the lockhouse tribunal',      leadsTo: 'lockhouse' },
      { puzzle: 'sok-m2',    name: 'the weirs of the black canal', leadsTo: 'flooded' },
    ],
  },

  /* ── depth three: the dream narrows to a single door ── */

  meadow: {
    depth: 'the third descent',
    doorsTitle: 'the last door is a held breath',
    lines: [
      'The bells go quiet all at once, the way a room does when you enter it.',
      'You are in a meadow at the absolute bottom of sleep. The grass leans toward you, listening.',
      'You carried a stone, and then you carried a song. The dream is no longer testing your hands. It is testing what they remember.',
      'In the center of the meadow, six standing stones wait to sing the longest song of the night — and they will only sing it <em>once</em>.',
    ],
    doors: [
      { puzzle: 'mem-deep', name: 'the song the meadow keeps', leadsTo: 'ending' },
    ],
  },

  hedge: {
    depth: 'the third descent',
    doorsTitle: 'the hedge opens one gap, briefly',
    lines: [
      'The shadow of the wall peels free and walks ahead of you, politely, like an usher.',
      'It leads you into a hedge maze that rearranges itself when it thinks you aren’t looking — you catch it once, mid-shuffle, and it pretends to be wind.',
      'At the maze’s heart, three great stones have wandered off their sigils. The hedge will not stop moving until they burn again.',
      'Your hands remember the atrium. Good. They will need to.',
    ],
    doors: [
      { puzzle: 'sok-h1', name: 'the heart of the moving maze', leadsTo: 'ending' },
    ],
  },

  archive: {
    depth: 'the third descent',
    doorsTitle: 'the archive grants one audience',
    lines: [
      'The last folio settles onto its shelf with a sound like a held breath released.',
      'A door you had mistaken for a bookcase swings inward, onto the Archive of Things Decided — where every conclusion ever reached is kept under glass.',
      'Five witnesses rise when you enter. The Fox smiles. The Moon does not.',
      'Seat them truly, and the archive will file <em>you</em> under whatever you prove yourself to be.',
    ],
    doors: [
      { puzzle: 'logic-hard', name: 'the court of the archive', leadsTo: 'ending' },
    ],
  },

  scriptorium: {
    depth: 'the third descent',
    doorsTitle: 'the index waits, unbound',
    lines: [
      'The watchword still warm in your mouth, you step into the scriptorium.',
      'Here the dream writes itself, badly, in nine hundred hands at once. Pages circle the ceiling like patient birds.',
      'On the central desk lies the Unbound Index: the one page that names the whole library. Its letters have been quarreling for centuries.',
      'Put the name back together, and every book falls quiet at once.',
    ],
    doors: [
      { puzzle: 'ana-labyrinth', name: 'the unbound index', leadsTo: 'ending' },
    ],
  },

  lockhouse: {
    depth: 'the third descent',
    doorsTitle: 'the great lock sings once',
    lines: [
      'The witnesses bow, satisfied, and dissolve into lamplight.',
      'Beyond the tribunal room, the canal ends at a brass lock the size of a cathedral door. Seven tumblers. No keyhole.',
      'The lock is old and proud and a little lonely; it will sing you its combination exactly once, because no one has asked it anything in years.',
      'Listen the way the water taught you.',
    ],
    doors: [
      { puzzle: 'mem-locks', name: 'the singing of the seven tumblers', leadsTo: 'ending' },
    ],
  },

  flooded: {
    depth: 'the third descent',
    doorsTitle: 'the cloister holds its breath',
    lines: [
      'The weirs seat themselves and the black water bows out of the room.',
      'You descend the emptied stair into a drowned cloister, still dripping, where stone monks once arranged stones for reasons no one wrote down.',
      'Three floodstones have drifted from their sigils. The lintel overhead has sagged too low for one of them to ever rise again.',
      'The water is coming back. The dream checks its watch.',
    ],
    doors: [
      { puzzle: 'sok-h2', name: 'the drowned cloister', leadsTo: 'ending' },
    ],
  },
};

/* ────────────────── endings ────────────────── */

const ENDINGS = {
  spatial: {
    title: 'The Architect',
    lines: [
      'You wake with your hands already moving, arranging the blankets into walls.',
      'All night you moved what the dream could not move alone, and the dream took notes.',
      'For the rest of your life, heavy things will seem a little lighter to you — furniture, stones, decisions. You will always know, without being told, where a thing <em>wants</em> to go.',
      'Somewhere below sleep, an atrium is being rebuilt to your specifications.',
    ],
  },
  logic: {
    title: 'The Astronomer',
    lines: [
      'You wake at the exact moment you intended to, which has never happened before.',
      'All night you put things in their true order, and the dream — which is mostly disorder, professionally — found this hilarious, then useful, then beautiful.',
      'From now on, when you look at scattered things — stars, receipts, people in waiting rooms — you will see the one arrangement that explains them.',
      'The witnesses send their regards. The Moon, grudgingly.',
    ],
  },
  cipher: {
    title: 'The Poet',
    lines: [
      'You wake with a word on your tongue that doesn’t exist yet. You decide to let it ripen.',
      'All night you untangled what language does to itself in the dark, and the dream has decided your mouth can be trusted with the good words.',
      'From now on, things will rhyme for you slightly more than chance allows. Letters will hold still when you look at them, out of respect.',
      'The unsent boats have all, finally, been delivered.',
    ],
  },
  memory: {
    title: 'The Listener',
    lines: [
      'You wake humming a song you have never heard awake. You will hum it at odd moments for the rest of your life, and certain doors will act strangely around you.',
      'All night you proved that you keep what you are given — every chime, every bell, every tumbler returned without a note dropped.',
      'The dream keeps its oldest songs for people like you. It has so few places left to put them.',
      'Listen: even now, something is singing very quietly under the floor of the morning.',
    ],
  },
  lucid: {
    title: 'The Lucid',
    lines: [
      'You wake gently, all at once, like a lamp being carried into a room.',
      'Stone, stars, script, song — you refused to be only one thing, and the dream, which has been begging its visitors to notice it is <em>all</em> of them, nearly wept.',
      'You will return. Not tonight, maybe not this year, but the dream has issued you a standing invitation, and the doors now know your weight on the floor.',
      'Next time, they will already be unlocked. Next time it will show you the rooms it shows no one.',
    ],
  },
};

const TYPE_LABEL = { spatial: 'stone', logic: 'stars', cipher: 'script', memory: 'song' };
