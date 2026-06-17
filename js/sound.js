/* SOMNIUM · sound — soft synthesized chimes, no assets */
'use strict';

const Sound = (() => {
  let actx = null;
  let muted = false;

  // G major pentatonic, airy register
  const PENTA = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];

  function ensure() {
    if (muted) return null;
    if (!actx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }

  function tone(freq, { when = 0, dur = 1.1, vol = 0.16, type = 'sine' } = {}) {
    const ctx = ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);

    // faint octave shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 2;
    gain2.gain.setValueAtTime(0.0001, t0);
    gain2.gain.exponentialRampToValueAtTime(vol * 0.22, t0 + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.7);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t0 + dur);
  }

  return {
    chime(i, when = 0)  { tone(PENTA[i % PENTA.length], { when, dur: 1.2 }); },
    click()             { tone(523.25, { dur: 0.25, vol: 0.05 }); },
    thud()              { tone(98, { dur: 0.5, vol: 0.2, type: 'triangle' }); },
    door()              { tone(196, { dur: 1.8, vol: 0.12, type: 'triangle' }); tone(392, { when: 0.12, dur: 1.6, vol: 0.07 }); },
    solve() {
      [0, 2, 4, 5].forEach((n, k) => tone(PENTA[n], { when: k * 0.14, dur: 1.5, vol: 0.13 }));
    },
    wrong()             { tone(155.56, { dur: 0.7, vol: 0.14, type: 'triangle' }); },
    setMuted(m)         { muted = m; },
    isMuted()           { return muted; },
  };
})();
