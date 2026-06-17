# SOMNIUM — a dream in many doors

A branching puzzle adventure. Each chamber of the dream offers several doors;
each door is a different kind of puzzle, and **the puzzle you solve decides the
story you are told**. Your puzzle profile across the night determines which of
five endings you wake into.

## Play

Open `index.html` in any modern browser. No build step, no dependencies.
Progress is saved automatically (localStorage) — the title screen offers
*return to the dream* if you left mid-descent.

## Structure

```
threshold (tutorial chime)
└─ atrium ── stone / stars / script ── 3 branches
   ├─ garden  ── bells → meadow · script → hedge
   ├─ library ── folios → archive · watchword → scriptorium
   └─ canal   ── tribunal → lockhouse · weirs → flooded
            … every path ends in one of five endings:
            Architect · Astronomer · Poet · Listener · Lucid
```

## Puzzle types

- **Stone (spatial)** — isometric sokoban. Arrow keys / WASD or the on-screen
  pad. `z` undo, `r` reset.
- **Stars (logic)** — seat the witnesses; deduce the unique order from clues.
- **Script (cipher)** — anagrams and drifted (Caesar) inscriptions.
- **Song (memory)** — watch the pedestals sing, then click the sequence back.

Every puzzle has a free retreat (*drift back*) and a hint (*a whisper of help* —
counted on your ending card).

## Dev shortcuts

- `index.html?node=canal` — jump to a story node (`&doors=1` to skip to doors)
- `index.html?puzzle=sok-h1` — jump straight into any puzzle id (see `js/story.js`)
- `index.html?end=lucid` — preview an ending

## Files

- `js/iso.js` — isometric projection, stage loop, ambient floating islands
- `js/puzzles.js` — sokoban + memory canvas scenes, logic/cipher panels
- `js/story.js` — puzzle registry, branching node graph, endings
- `js/main.js` — state machine, save/load, wiring
- `js/sound.js` — synthesized pentatonic chimes (WebAudio, no assets)
