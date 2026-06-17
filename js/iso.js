/* SOMNIUM · iso — isometric projection, drawing helpers, stage loop */
'use strict';

const Iso = (() => {
  const TW = 76;   // tile width  (screen px)
  const TH = 38;   // tile height (screen px)
  const TZ = 34;   // px per unit of altitude

  const proj = (gx, gy, z = 0) => ({
    x: (gx - gy) * (TW / 2),
    y: (gx + gy) * (TH / 2) - z * TZ,
  });

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
  }

  // corners of cell (gx,gy) at altitude z: [back, right, front, left] on screen
  function corners(gx, gy, z, inset = 0) {
    return [
      proj(gx + inset,     gy + inset,     z),
      proj(gx + 1 - inset, gy + inset,     z),
      proj(gx + 1 - inset, gy + 1 - inset, z),
      proj(gx + inset,     gy + 1 - inset, z),
    ];
  }

  function drawTile(ctx, gx, gy, z, fill, { inset = 0, stroke = null } = {}) {
    const c = corners(gx, gy, z, inset);
    poly(ctx, c);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function drawBlock(ctx, gx, gy, { z0 = 0, z1 = 1, inset = 0, top, left, right, glow = null } = {}) {
    const T = corners(gx, gy, z1, inset);
    const B = corners(gx, gy, z0, inset);
    if (glow) {
      const c = proj(gx + 0.5, gy + 0.5, z1);
      const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, TW * 1.1);
      g.addColorStop(0, glow);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(c.x - TW * 1.1, c.y - TW * 1.1, TW * 2.2, TW * 2.2);
    }
    poly(ctx, [T[3], T[2], B[2], B[3]]); ctx.fillStyle = left;  ctx.fill(); // left face
    poly(ctx, [T[1], T[2], B[2], B[1]]); ctx.fillStyle = right; ctx.fill(); // right face
    poly(ctx, T);                        ctx.fillStyle = top;   ctx.fill(); // top face
  }

  // jagged rock hanging beneath a floating cell
  function drawKeel(ctx, gx, gy, color, depthSeed) {
    const B = corners(gx, gy, 0);
    const d = 26 + ((gx * 73 + gy * 131) % 7) * (8 + depthSeed);
    const tip = { x: (B[1].x + B[3].x) / 2, y: B[2].y + d };
    poly(ctx, [B[3], B[2], tip]);
    ctx.fillStyle = color;
    ctx.fill();
    poly(ctx, [B[1], B[2], tip]);
    ctx.fillStyle = shade(color, -14);
    ctx.fill();
  }

  // hex color helper: lighten (+) / darken (-) by pct
  function shade(hex, pct) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v + (pct / 100) * 255)));
    const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
    return `rgb(${r},${g},${b})`;
  }

  // dream glyphs, drawn as billboards (face the camera)
  function drawGlyph(ctx, idx, x, y, size, color, lineWidth = 2.2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const s = size;
    ctx.beginPath();
    switch (idx % 6) {
      case 0: // ringed eye
        ctx.arc(0, 0, s * 0.78, 0, Math.PI * 2);
        ctx.moveTo(s * 0.16, 0);
        ctx.arc(0, 0, s * 0.16, 0, Math.PI * 2);
        break;
      case 1: // mountain / delta
        ctx.moveTo(0, -s * 0.82);
        ctx.lineTo(s * 0.78, s * 0.62);
        ctx.lineTo(-s * 0.78, s * 0.62);
        ctx.closePath();
        break;
      case 2: // water
        for (let r = 0; r < 3; r++) {
          const yy = -s * 0.5 + r * s * 0.5;
          ctx.moveTo(-s * 0.7, yy);
          ctx.quadraticCurveTo(-s * 0.35, yy - s * 0.34, 0, yy);
          ctx.quadraticCurveTo(s * 0.35, yy + s * 0.34, s * 0.7, yy);
        }
        break;
      case 3: // star
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * s * 0.85, Math.sin(a) * s * 0.85);
          const a2 = a + Math.PI / 4;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a2) * s * 0.4, Math.sin(a2) * s * 0.4);
        }
        break;
      case 4: // spiral
        for (let a = 0; a < Math.PI * 4.4; a += 0.22) {
          const r = (a / (Math.PI * 4.4)) * s * 0.85;
          const px = Math.cos(a) * r, py = Math.sin(a) * r;
          if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        break;
      case 5: // crescent
        ctx.arc(0, 0, s * 0.8, Math.PI * 0.32, Math.PI * 1.68);
        ctx.arc(s * 0.42, 0, s * 0.62, Math.PI * 1.55, Math.PI * 0.45, true);
        break;
    }
    ctx.stroke();
    ctx.restore();
  }

  return { TW, TH, TZ, proj, poly, corners, drawTile, drawBlock, drawKeel, shade, drawGlyph };
})();

/* ───────────────────────── Stage ───────────────────────── */

const Stage = (() => {
  let canvas, ctx, W = 0, H = 0, dpr = 1;
  let scene = null;
  let stars = [], motes = [];
  let last = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }

  function initField() {
    stars = [];
    for (let i = 0; i < 170; i++) {
      stars.push({
        x: Math.random(), y: Math.random() * 0.92,
        r: Math.random() * 1.3 + 0.3,
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.3,
      });
    }
    motes = [];
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 2 + 0.8,
        vy: 0.006 + Math.random() * 0.014,
        drift: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawBackground(t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a101f');
    g.addColorStop(0.55, '#070b14');
    g.addColorStop(1, '#05070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // distant moon halo
    const mg = ctx.createRadialGradient(W * 0.76, H * 0.2, 10, W * 0.76, H * 0.2, H * 0.55);
    mg.addColorStop(0, 'rgba(227,233,248,0.10)');
    mg.addColorStop(0.35, 'rgba(143,216,205,0.045)');
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      const a = 0.25 + 0.7 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dfe6f7';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMotes(t, dt) {
    ctx.fillStyle = 'rgba(240,163,124,0.35)';
    for (const m of motes) {
      m.y -= m.vy * dt;
      if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
      const wob = Math.sin(t * 0.6 + m.drift) * 14;
      ctx.globalAlpha = 0.12 + 0.2 * Math.abs(Math.sin(t * 0.8 + m.drift));
      ctx.beginPath();
      ctx.arc(m.x * W + wob, m.y * H, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(ts) {
    const t = ts / 1000;
    const dt = Math.min(0.05, t - last || 0.016);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(t);
    if (scene) {
      if (scene.update) scene.update(dt, t);
      ctx.save();
      ctx.translate(W / 2 + (scene.camX || 0), H * 0.56 + (scene.camY || 0));
      scene.draw(ctx, t);
      ctx.restore();
    }
    drawMotes(t, dt);
    requestAnimationFrame(frame);
  }

  function localPoint(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left - (W / 2 + (scene && scene.camX || 0)),
      y: e.clientY - r.top - (H * 0.56 + (scene && scene.camY || 0)),
    };
  }

  return {
    init() {
      canvas = document.getElementById('dream');
      ctx = canvas.getContext('2d');
      resize();
      initField();
      window.addEventListener('resize', resize);
      canvas.addEventListener('pointerdown', (e) => {
        if (scene && scene.click) {
          const p = localPoint(e);
          scene.click(p.x, p.y);
        }
      });
      requestAnimationFrame(frame);
    },
    setScene(s) { scene = s; },
    getScene() { return scene; },
    key(e) { if (scene && scene.key) scene.key(e); },
    size() { return { W, H }; },
  };
})();

/* ───────────────── Ambient scene (title / interludes) ───────────────── */

class AmbientScene {
  // variant: 'title' shows the great door arch
  constructor(variant = 'title', palette = null) {
    this.variant = variant;
    this.pal = palette || { top: '#2c3654', side: '#1b2238', dark: '#11162a', keel: '#0b0f1e' };
    this.islands = [
      { ox: 0, oy: 30, scale: 1, ph: 0,
        cells: [[0,0,.4],[1,0,.55],[2,0,.45],[0,1,.5],[1,1,.65],[2,1,.5],[0,2,.45],[1,2,.5],[2,2,.4]] },
      { ox: -380, oy: -90, scale: 0.55, ph: 2.1,
        cells: [[0,0,.5],[1,0,.6],[0,1,.55],[1,1,.45]] },
      { ox: 360, oy: -140, scale: 0.42, ph: 4.2,
        cells: [[0,0,.55],[1,0,.4],[1,1,.6]] },
      { ox: 250, oy: 150, scale: 0.32, ph: 1.2,
        cells: [[0,0,.5],[0,1,.45]] },
    ];
  }

  draw(ctx, t) {
    const pal = this.pal;
    for (const isl of this.islands) {
      const bob = Math.sin(t * 0.45 + isl.ph) * 9 * isl.scale;
      ctx.save();
      ctx.translate(isl.ox, isl.oy + bob);
      ctx.scale(isl.scale, isl.scale);
      const c = Iso.proj(1, 1, 0); // rough centering of the small grids
      ctx.translate(-c.x, -c.y);

      const cells = [...isl.cells].sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
      for (const [gx, gy] of cells) Iso.drawKeel(ctx, gx, gy, pal.keel, isl.scale > 0.5 ? 2 : 0);
      for (const [gx, gy, h] of cells) {
        Iso.drawBlock(ctx, gx, gy, {
          z0: -h, z1: 0,
          top: pal.top, left: pal.side, right: pal.dark,
        });
      }

      // the great door on the main island (title only)
      if (this.variant === 'title' && isl.scale === 1) {
        const doorGlow = 0.5 + 0.22 * Math.sin(t * 1.1);
        const gp = Iso.proj(1.5, 1.5, 1.05);
        const grad = ctx.createRadialGradient(gp.x, gp.y, 2, gp.x, gp.y, 95);
        grad.addColorStop(0, `rgba(240,163,124,${0.5 * doorGlow})`);
        grad.addColorStop(0.5, `rgba(240,163,124,${0.16 * doorGlow})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(gp.x - 100, gp.y - 100, 200, 200);

        const pillar = { top: '#39456b', left: '#222a47', right: '#171d33' };
        Iso.drawBlock(ctx, 0.7, 1.2, { z0: 0, z1: 2.1, inset: 0.32, ...pillar });
        Iso.drawBlock(ctx, 1.9, 1.2, { z0: 0, z1: 2.1, inset: 0.32, ...pillar });
        Iso.drawBlock(ctx, 0.7, 1.2, { z0: 2.1, z1: 2.38, inset: 0.18, ...pillar }); // capitals
        Iso.drawBlock(ctx, 1.9, 1.2, { z0: 2.1, z1: 2.38, inset: 0.18, ...pillar });
        // lintel
        for (let i = 0; i < 3; i++) {
          Iso.drawBlock(ctx, 0.7 + i * 0.6, 1.2, { z0: 2.38, z1: 2.62, inset: 0.26, ...pillar });
        }
      }
      ctx.restore();
    }
  }
}
