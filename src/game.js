/**
 * GITFLOW ≋ RACING — Quantum F1 Game Engine
 * Pseudo-3D road renderer (Commodore F1 Simulator rebuilt)
 * + AI Game Master + Scene Director + GP Suite integration
 */
'use strict';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */
const ROAD_W       = 2000;   // world-space road width
const SEG_LEN      = 200;    // world-space segment length
const NUM_SEGS     = 600;    // total track segments
const VISIBLE_SEGS = 200;    // how many to project per frame
const CAM_HEIGHT   = 1500;   // camera height above road
const CAM_DEPTH    = 0.84;   // field of view
const MAX_SPEED    = 320;    // km/h
const ACCEL        = 4.0;
const BRAKE        = 7.0;
const DECEL        = 2.2;    // natural deceleration
// Segments 0-379 form one full lap (race + downtown circuit); 380-599 pad the buffer
const SEGS_PER_LAP = 380;
const CENTRIFUGAL  = 0.3;    // steering pull at speed
const OFFROAD_SLOW = 0.6;
const TERRAIN_W    = 3;      // number of road-widths either side

/* ═══════════════════════════════════════════════════════════
   GLOBAL STATE
   ═══════════════════════════════════════════════════════════ */
const canvas   = document.getElementById('screen');
const ctx      = canvas.getContext('2d');
const walkCvs  = document.getElementById('walk-canvas');
const walkCtx  = walkCvs.getContext('2d');

let W, H;        // canvas dimensions (updated on resize)
let running = false;
let gameTime = 0;
let dt = 0;
let lastTs = 0;

/* Scene: RACE | DOWNTOWN | WALK | CINEMATIC */
let scene = 'TITLE';

/* Player */
const player = {
  pos:      0,      // position along track (world units)
  speed:    0,      // current speed (world units/s)
  x:        0,      // lateral offset (-1 to 1, 0 = centre)
  lap:      0,
  btc:      0,      // satoshis
};

/* AI racers */
const AI_DATA = [
  { name: 'GitPin-α',  repo: 'alpha/spatial',   color: '#ff9900', speed: 0, pos:  200, x:  0.2, skill: 0.88 },
  { name: 'Gitpro-β',  repo: 'beta/prochain',   color: '#cc00ff', speed: 0, pos:  400, x: -0.2, skill: 0.82 },
  { name: 'Gitsync-γ', repo: 'gamma/harmonix',  color: '#00ff99', speed: 0, pos:   80, x:  0.0, skill: 0.75 },
  { name: 'Gitpub-δ',  repo: 'delta/livestream', color: '#00d4ff', speed: 0, pos: 300, x:  0.15, skill: 0.91 },
];

/* Input */
const keys = { up: false, down: false, left: false, right: false };

/* Track segments */
let segments = [];

/* GitPins on track */
const GITPINS = [
  { seg: 80,  id: 'PIN-001', title: 'gitflow/streamliner@main', body: 'commit a3f1c7b: "Smooth fork transition — momentum buffer engaged. No rhythm shock detected."', reward: 250 },
  { seg: 160, id: 'PIN-002', title: 'gitpulse/erythmia@v1.2',  body: 'Erythmia baseline locked at Ω[4.21, -1.87]. Off-beat variance: ±0.02 — within healing threshold.', reward: 150 },
  { seg: 240, id: 'PIN-003', title: 'gitarch/physics@patch-7',  body: 'Physics patch #7 applied: Entropy law rewritten. Gravity constant restored. World stable.', reward: 300 },
  { seg: 340, id: 'PIN-004', title: 'gitsync/harmonizer@live',  body: 'Reality re-integration at 97.3%. Patched rhythm accepted by Main Existence. Merge complete.', reward: 200 },
  { seg: 430, id: 'PIN-005', title: 'gitpub/broadcast@stream',  body: '📡 Live stream: 1,024 subscribers watching your spatial fork. Latency: 42 ms.', reward: 175 },
  { seg: 520, id: 'PIN-006', title: 'gitpin/user:∞4@real',      body: 'User reality anchor detected. Connecting repo "www-infinity4/Gitflow" to race world...', reward: 500 },
];

let triggeredPins = new Set();
let activePin = null;

/* Multiplayer slots (future real users) */
const MULTI_SLOTS = [
  { id: 'slot-1', label: '[ OPEN — join with your repo ]', color: '#3a6080' },
  { id: 'slot-2', label: '[ OPEN — scan GitPin to race ]',  color: '#3a6080' },
];

/* Downtown / walk state */
let walkState = {
  charX: 0, charY: 0,
  velX: 0,  velY: 0,
  walking: false, facing: 1, frameT: 0, frame: 0,
  carX: 0,  carY: 0, // parked car position
  npcMessages: [
    'Hey, Gitflow picked up an off-beat in sector 3!',
    'Your repo has a new fork — GitPin is anchoring it now.',
    "The Giro says: rhythm shock suppressed. You're good to re-enter.",
    'Bitcoin reward: 1000 sats added for completing the downtown run.',
  ],
  npcIdx: 0,
  npcBubble: null,
  npcBubbleT: 0,
};

/* Cinematic state */
let cinState = { phase: 0, timer: 0, done: false };

/* ═══════════════════════════════════════════════════════════
   TRACK GENERATOR
   ═══════════════════════════════════════════════════════════ */
function buildTrack() {
  segments = [];
  // Helper: fill a range with a curve value
  const fill = (start, len, curve, scene, color1, color2) => {
    for (let i = 0; i < len; i++) {
      segments.push({
        index: start + i,
        curve: curve,
        scene: scene || 'race',
        color: (Math.floor((start + i) / 4) % 2 === 0) ? (color1 || '#555') : (color2 || '#444'),
        grass1: scene === 'downtown' ? '#2a2a2a' : '#1a4a1a',
        grass2: scene === 'downtown' ? '#1e1e1e' : '#144014',
        building: scene === 'downtown',
      });
    }
  };

  // Main straight                     start  len  curve  scene
  fill(  0,  60, 0.000, 'race');
  fill( 60,  40, 0.003, 'race');   // gentle right
  fill(100,  30,-0.006, 'race');   // left kink
  fill(130,  30, 0.000, 'race');
  fill(160,  50, 0.008, 'race');   // sweeping right
  fill(210,  30,-0.004, 'race');
  fill(240,  40, 0.000, 'race');   // back straight
  fill(280,  40,-0.010, 'race');   // tight left hairpin
  fill(320,  30, 0.006, 'race');
  fill(350,  30, 0.000, 'race');   // transition
  // Downtown begins
  fill(380,  80, 0.002, 'downtown');  // city entry — slight right
  fill(460,  60, 0.000, 'downtown');  // main street
  fill(520,  20,-0.003, 'downtown');
  fill(540,  60, 0.000, 'race');   // back to track / pit lane exit
  // Pad out to NUM_SEGS
  while (segments.length < NUM_SEGS) {
    const idx = segments.length;
    segments.push(segments[idx % SEGS_PER_LAP]); // loop back over the main circuit
  }
}

function getSeg(index) {
  return segments[((index % NUM_SEGS) + NUM_SEGS) % NUM_SEGS];
}

/* ═══════════════════════════════════════════════════════════
   PROJECTION
   ═══════════════════════════════════════════════════════════ */
function project(worldX, worldY, worldZ, cameraX, cameraZ) {
  const transX = worldX - cameraX;
  const transZ = worldZ - cameraZ;
  if (transZ <= 0) return null;
  const scale = CAM_DEPTH / transZ;
  const sx = Math.round(W / 2 + scale * transX * W / 2);
  const sy = Math.round(H / 2 - scale * worldY * H / 2);
  const sw = Math.round(scale * ROAD_W * W / 2);
  return { x: sx, y: sy, w: sw, scale };
}

/* ═══════════════════════════════════════════════════════════
   ROAD RENDERER (Pseudo-3D)
   ═══════════════════════════════════════════════════════════ */
function renderRoad() {
  ctx.clearRect(0, 0, W, H);

  const playerSeg  = Math.floor(player.pos / SEG_LEN) % NUM_SEGS;
  const isDowntown = getSeg(playerSeg).scene === 'downtown';

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.5);
  if (isDowntown) {
    skyGrad.addColorStop(0, '#050505');
    skyGrad.addColorStop(1, '#0a0f18');
  } else {
    skyGrad.addColorStop(0, '#000814');
    skyGrad.addColorStop(1, '#021428');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.5);

  // Stars (only in race scene)
  if (!isDowntown) {
    ctx.fillStyle = 'rgba(180,220,255,0.6)';
    for (let s = 0; s < 60; s++) {
      const sx = ((s * 137 + 7) % W);
      const sy = ((s * 97  + 13) % (H * 0.42));
      ctx.fillRect(sx, sy, 1, 1);
    }
  } else {
    // City skyline silhouette
    drawSkyline();
  }

  // Collect projected segments
  const projected = [];
  let x = 0, dx = 0;  // accumulated curve (road center offset)

  for (let i = 0; i < VISIBLE_SEGS; i++) {
    const segIdx = (playerSeg + i) % NUM_SEGS;
    const seg = segments[segIdx];

    const worldZ = (i + 1) * SEG_LEN - (player.pos % SEG_LEN);
    const cameraZ = CAM_HEIGHT;

    // Project segment front and back
    const p = project(player.x * ROAD_W, CAM_HEIGHT, worldZ, 0, 0);
    if (!p) continue;

    dx += seg.curve;
    x  += dx;

    projected.push({ seg, p, x, i });
    if (p.y <= 0) break; // past horizon
  }

  // Draw back-to-front
  for (let i = projected.length - 1; i >= 0; i--) {
    const { seg, p, x, i: depth } = projected[i];
    const next = projected[i - 1];
    if (!next) continue;

    const fog = Math.min(1, depth / (VISIBLE_SEGS * 0.7));

    const cx1 = p.x + x * p.scale * 0.15;
    const cx2 = next.p.x + (x + projected[i].seg.curve) * next.p.scale * 0.15;

    const roadLeft1  = cx1 - p.w,     roadRight1 = cx1 + p.w;
    const roadLeft2  = cx2 - next.p.w, roadRight2 = cx2 + next.p.w;
    const y1 = p.y,    y2 = next.p.y;

    // Grass / terrain
    drawTrapezoid(0, y1, roadLeft1, y1, roadLeft2, y2, W * 0, y2,
      fogColor(seg.grass1, fog));
    drawTrapezoid(roadRight1, y1, W, y1, W, y2, roadRight2, y2,
      fogColor(seg.grass2, fog));

    // Road surface
    drawTrapezoid(roadLeft1, y1, roadRight1, y1, roadRight2, y2, roadLeft2, y2,
      fogColor(seg.color, fog));

    // Centre line (dashed)
    const midX1 = cx1, midX2 = cx2;
    const lineW1 = Math.max(2, p.scale * 20);
    const lineW2 = Math.max(2, next.p.scale * 20);
    if (Math.floor(depth / 4) % 2 === 0) {
      drawTrapezoid(midX1 - lineW1/2, y1, midX1 + lineW1/2, y1,
                    midX2 + lineW2/2, y2, midX2 - lineW2/2, y2,
                    fogColor('#ffffff', fog * 0.7));
    }

    // Road edges (white lines)
    const eW1 = Math.max(1, p.scale * 30);
    const eW2 = Math.max(1, next.p.scale * 30);
    drawTrapezoid(roadLeft1,  y1, roadLeft1  + eW1, y1, roadLeft2  + eW2, y2, roadLeft2,  y2, fogColor('#cccccc', fog));
    drawTrapezoid(roadRight1 - eW1, y1, roadRight1, y1, roadRight2, y2, roadRight2 - eW2, y2, fogColor('#cccccc', fog));

    // Buildings in downtown
    if (seg.building) {
      drawBuildings(cx1, cx2, p.w, next.p.w, y1, y2, fog);
    }

    // GitPin markers
    GITPINS.forEach(pin => {
      const pinSeg = pin.seg % NUM_SEGS;
      if (pinSeg === (playerSeg + depth) % NUM_SEGS && !triggeredPins.has(pin.id)) {
        const pinX = cx1;
        const size = Math.max(8, p.scale * 180);
        drawGitPin(pinX, y1, size, fog);
      }
    });
  }

  // Draw AI cars
  AI_DATA.forEach(ai => {
    const aiSeg = Math.floor(ai.pos / SEG_LEN) % NUM_SEGS;
    const relSeg = ((aiSeg - playerSeg) + NUM_SEGS) % NUM_SEGS;
    if (relSeg < 1 || relSeg > VISIBLE_SEGS - 2) return;
    const proj = projected[relSeg];
    if (!proj) return;
    const carX = proj.p.x + ai.x * proj.p.w + proj.x * proj.p.scale * 0.15;
    const carW = Math.max(10, proj.p.scale * 180);
    const carH = carW * 0.5;
    drawAICar(carX, proj.p.y, carW, carH, ai.color,
      Math.min(1, relSeg / (VISIBLE_SEGS * 0.8)));
  });

  // Player car (always at bottom centre)
  drawPlayerCar();
}

function drawTrapezoid(x1,y1,x2,y1b,x3,y2,x4,y2b, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y1b);
  ctx.lineTo(x3, y2); ctx.lineTo(x4, y2b);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function fogColor(hex, fog) {
  const r = parseInt(hex.slice(1,3)||'44',16);
  const g = parseInt(hex.slice(3,5)||'44',16);
  const b = parseInt(hex.slice(5,7)||'44',16);
  const fr = Math.round(r + (8 - r) * fog);
  const fg = Math.round(g + (15 - g) * fog);
  const fb = Math.round(b + (24 - b) * fog);
  return `rgb(${fr},${fg},${fb})`;
}

function drawSkyline() {
  const buildings = [
    {x:0,   w:80,  h:0.32},
    {x:70,  w:50,  h:0.28},
    {x:110, w:90,  h:0.40},
    {x:190, w:60,  h:0.25},
    {x:240, w:100, h:0.45},
    {x:330, w:70,  h:0.30},
    {x:390, w:120, h:0.38},
    {x:500, w:80,  h:0.35},
  ];
  buildings.forEach(b => {
    const bw = b.w / 600 * W;
    const bx = b.x / 600 * W;
    const bh = b.h * H * 0.5;
    const by = H * 0.5 - bh;
    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(bx, by, bw, bh);
    // windows
    ctx.fillStyle = 'rgba(255,200,80,0.4)';
    for (let wy = by + 4; wy < H * 0.5 - 4; wy += 8) {
      for (let wx = bx + 4; wx < bx + bw - 4; wx += 10) {
        if (Math.random() > 0.4) ctx.fillRect(wx, wy, 4, 4);
      }
    }
  });
}

function drawBuildings(cx1, cx2, w1, w2, y1, y2, fog) {
  const bh = (y2 - y1) * 8;
  const margin = w1 * 0.1;

  // Left building
  ctx.fillStyle = fogColor('#0d1520', fog * 0.5);
  ctx.fillRect(0, y1 - bh, cx1 - w1 - margin, bh + 2);
  // Windows
  ctx.fillStyle = `rgba(255,180,0,${0.3 * (1 - fog)})`;
  for (let wy = y1 - bh + 4; wy < y1 - 4; wy += 8) {
    for (let wx = cx1 - w1 - margin - 40; wx < cx1 - w1 - margin; wx += 10) {
      if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 4, 4);
    }
  }

  // Right building
  ctx.fillStyle = fogColor('#0d1520', fog * 0.5);
  ctx.fillRect(cx1 + w1 + margin, y1 - bh, W, bh + 2);
  ctx.fillStyle = `rgba(255,180,0,${0.3 * (1 - fog)})`;
  for (let wy = y1 - bh + 4; wy < y1 - 4; wy += 8) {
    for (let wx = cx1 + w1 + margin; wx < cx1 + w1 + margin + 60; wx += 10) {
      if ((wx + wy) % 3 !== 0) ctx.fillRect(wx, wy, 4, 4);
    }
  }
}

function drawGitPin(x, y, size, fog) {
  const alpha = Math.max(0, 1 - fog) * 0.9;
  if (alpha < 0.05) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Triangle marker
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.5, y);
  ctx.lineTo(x - size * 0.5, y);
  ctx.closePath();
  ctx.strokeStyle = '#00ff99';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff99';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,255,153,0.15)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#00ff99';
  ctx.font = `${Math.max(8, size * 0.25)}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText('∆', x, y - size * 0.3);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawPlayerCar() {
  const cx = W / 2 + player.x * W * 0.3;
  const cy = H * 0.78;
  const cw = Math.round(W * 0.07);
  const ch = Math.round(cw * 0.42);
  drawF1Car(ctx, cx, cy, cw, ch, '#00d4ff', true);
}

function drawAICar(x, y, w, h, color, fog) {
  const alpha = Math.max(0, 1 - fog);
  ctx.save();
  ctx.globalAlpha = alpha;
  drawF1Car(ctx, x, y, w, h, color, false);
  ctx.restore();
}

function drawF1Car(c, x, y, w, h, color, isPlayer) {
  const hw = w / 2, hh = h / 2;
  c.save();
  c.translate(x, y);

  // Main body
  c.beginPath();
  c.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = isPlayer ? 14 : 6;
  c.fill();
  c.shadowBlur = 0;

  // Nose cone
  c.beginPath();
  c.moveTo(-hw * 0.3, -hh * 0.5);
  c.lineTo(-hw * 0.3,  hh * 0.5);
  c.lineTo(-hw * 0.9,  0);
  c.closePath();
  c.fillStyle = color;
  c.fill();

  // Cockpit
  c.beginPath();
  c.ellipse(hw * 0.1, 0, hw * 0.22, hh * 0.55, 0, 0, Math.PI * 2);
  c.fillStyle = 'rgba(0,0,0,0.7)';
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.3)';
  c.lineWidth = 1;
  c.stroke();

  // Front wing
  c.beginPath();
  c.rect(-hw * 0.95, -hh * 0.85, hw * 0.5, hh * 0.25);
  c.fillStyle = 'rgba(0,0,0,0.6)';
  c.fill();
  c.beginPath();
  c.rect(-hw * 0.95,  hh * 0.6,  hw * 0.5, hh * 0.25);
  c.fillStyle = 'rgba(0,0,0,0.6)';
  c.fill();

  // Rear wing
  c.beginPath();
  c.rect(hw * 0.6, -hh * 0.95, hw * 0.25, hh * 1.9);
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.fill();

  // Wheels
  const wheelColor = '#111';
  [[-hw*0.5,-hh*0.85],[hw*0.4,-hh*0.85],[-hw*0.5,hh*0.7],[hw*0.4,hh*0.7]].forEach(([wx,wy]) => {
    c.beginPath(); c.arc(wx, wy, hh * 0.32, 0, Math.PI * 2);
    c.fillStyle = wheelColor; c.fill();
    c.strokeStyle = '#333'; c.lineWidth = 1; c.stroke();
  });

  // Repo label (AI cars only)
  if (!isPlayer) {
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.font = `${Math.max(5, h * 0.28)}px Courier New`;
    c.textAlign = 'center';
    c.fillText(isPlayer ? '≋ YOU' : '', 0, h * 0.7);
  }

  c.restore();
}

/* ═══════════════════════════════════════════════════════════
   WALK SCENE RENDERER
   ═══════════════════════════════════════════════════════════ */
function renderWalk() {
  const W2 = walkCvs.width, H2 = walkCvs.height;
  walkCtx.clearRect(0, 0, W2, H2);

  // Sky
  walkCtx.fillStyle = '#030810';
  walkCtx.fillRect(0, 0, W2, H2 * 0.45);

  // Ground
  walkCtx.fillStyle = '#111820';
  walkCtx.fillRect(0, H2 * 0.45, W2, H2 * 0.55);

  // Pavement
  walkCtx.fillStyle = '#1a2030';
  walkCtx.fillRect(0, H2 * 0.6, W2, H2 * 0.4);

  // Draw city buildings (static backdrop)
  const bldgs = [
    {x:0,  w:120, h:0.45, c:'#0a0f1a'},
    {x:110,w:80,  h:0.35, c:'#0c1220'},
    {x:180,w:150, h:0.55, c:'#080c15'},
    {x:320,w:100, h:0.42, c:'#0a1018'},
    {x:410,w:200, h:0.50, c:'#060c14'},
    {x:600,w:120, h:0.38, c:'#0c1222'},
    {x:710,w:90,  h:0.48, c:'#080e18'},
    {x:790,w:250, h:0.58, c:'#060b12'},
  ];
  const scrollOff = walkState.charX * 0.4;
  bldgs.forEach(b => {
    const bx = b.x - scrollOff;
    const bh = b.h * H2;
    const by = H2 * 0.45 - bh + H2 * 0.15;
    walkCtx.fillStyle = b.c;
    walkCtx.fillRect(bx, by, b.w, bh);
    // Windows
    for (let wy = by + 6; wy < H2 * 0.6 - 6; wy += 12) {
      for (let wx = bx + 6; wx < bx + b.w - 6; wx += 14) {
        const lit = Math.sin(wx * 0.3 + wy * 0.5 + gameTime * 0.3) > 0.2;
        if (lit) {
          walkCtx.fillStyle = 'rgba(255,200,80,0.35)';
          walkCtx.fillRect(wx, wy, 6, 6);
        }
      }
    }
  });

  // Street lights
  for (let lx = 80; lx < W2 + 80; lx += 160) {
    const lsx = lx - scrollOff * 0.8;
    walkCtx.strokeStyle = '#1a3a5c';
    walkCtx.lineWidth = 3;
    walkCtx.beginPath(); walkCtx.moveTo(lsx, H2 * 0.6); walkCtx.lineTo(lsx, H2 * 0.35);
    walkCtx.stroke();
    walkCtx.beginPath(); walkCtx.arc(lsx, H2 * 0.35, 6, 0, Math.PI*2);
    walkCtx.fillStyle = 'rgba(255,200,80,0.6)';
    walkCtx.shadowColor = '#ffcc44'; walkCtx.shadowBlur = 16;
    walkCtx.fill(); walkCtx.shadowBlur = 0;
  }

  // Parked car (F1)
  const carSX = W2 * 0.3 - (walkState.charX - walkState.carX) * 0.6;
  const carSY = H2 * 0.72;
  drawF1Car(walkCtx, carSX, carSY, 120, 52, '#00d4ff', false);
  walkCtx.fillStyle = 'rgba(0,212,255,0.4)';
  walkCtx.font = '9px Courier New';
  walkCtx.textAlign = 'center';
  walkCtx.fillText('≋ PARKED', carSX, carSY + 40);
  walkCtx.textAlign = 'left';

  // GitPin hotspots
  GITPINS.slice(0, 3).forEach((pin, i) => {
    const px = 200 + i * 260 - scrollOff * 0.5;
    const py = H2 * 0.58;
    walkCtx.beginPath();
    walkCtx.moveTo(px, py - 28); walkCtx.lineTo(px + 14, py); walkCtx.lineTo(px - 14, py);
    walkCtx.closePath();
    walkCtx.strokeStyle = '#00ff99'; walkCtx.lineWidth = 2;
    walkCtx.shadowColor = '#00ff99'; walkCtx.shadowBlur = 10;
    walkCtx.stroke(); walkCtx.shadowBlur = 0;
    walkCtx.fillStyle = 'rgba(0,255,153,0.08)'; walkCtx.fill();
    walkCtx.fillStyle = '#00ff99'; walkCtx.font = '8px Courier New';
    walkCtx.textAlign = 'center';
    walkCtx.fillText('∆ ' + pin.id, px, py + 14);
    walkCtx.textAlign = 'left';
  });

  // NPC (simple figure)
  const npcX = 500 - scrollOff * 0.5;
  const npcY = H2 * 0.67;
  drawCharacter(walkCtx, npcX, npcY, '#ffb800', false);

  // NPC speech bubble
  if (walkState.npcBubble && walkState.npcBubbleT > 0) {
    const bw = 180, bh = 40;
    walkCtx.fillStyle = 'rgba(7,15,30,0.92)';
    walkCtx.strokeStyle = '#ffb800'; walkCtx.lineWidth = 1;
    const bx = npcX - bw * 0.5, by = npcY - 80;
    walkCtx.beginPath(); walkCtx.roundRect(bx, by, bw, bh, 4);
    walkCtx.fill(); walkCtx.stroke();
    walkCtx.fillStyle = '#ffb800'; walkCtx.font = '8px Courier New';
    walkCtx.textAlign = 'center';
    const words = walkState.npcBubble.split(' ');
    let line = '', lines = [];
    words.forEach(w => {
      const test = line + w + ' ';
      if (walkCtx.measureText(test).width > bw - 12) { lines.push(line); line = w + ' '; }
      else line = test;
    });
    lines.push(line);
    lines.slice(0,3).forEach((l, i) => walkCtx.fillText(l.trim(), npcX, by + 14 + i * 11));
    walkCtx.textAlign = 'left';
    walkState.npcBubbleT -= dt;
  }

  // Player character
  const pcX = W2 * 0.45;
  const pcY = H2 * 0.67;
  drawCharacter(walkCtx, pcX, pcY, '#00d4ff', true);

  // Scene label
  walkCtx.fillStyle = 'rgba(0,212,255,0.3)';
  walkCtx.font = '9px Courier New';
  walkCtx.fillText('DOWNTOWN · GITPIN DISTRICT', 12, H2 - 8);
}

function drawCharacter(c, x, y, color, isPlayer) {
  c.save();
  const frame = walkState.frame;
  const legSwing = isPlayer
    ? (walkState.walking ? Math.sin(gameTime * 8) * 6 : 0)
    : Math.sin(gameTime * 3) * 2;

  c.shadowColor = color; c.shadowBlur = 6;

  // Head
  c.beginPath(); c.arc(x, y - 26, 7, 0, Math.PI * 2);
  c.fillStyle = color; c.fill();

  // Body
  c.beginPath(); c.moveTo(x, y - 19); c.lineTo(x, y - 2);
  c.strokeStyle = color; c.lineWidth = 3; c.stroke();

  // Arms
  c.beginPath(); c.moveTo(x - 8, y - 14); c.lineTo(x + 8, y - 14);
  c.stroke();

  // Legs
  c.beginPath(); c.moveTo(x, y - 2);
  c.lineTo(x - 5 + legSwing, y + 12); c.stroke();
  c.beginPath(); c.moveTo(x, y - 2);
  c.lineTo(x + 5 - legSwing, y + 12); c.stroke();

  if (isPlayer) {
    c.fillStyle = color; c.font = '8px Courier New';
    c.textAlign = 'center'; c.fillText('YOU', x, y + 22);
    c.textAlign = 'left';
  }

  c.shadowBlur = 0; c.restore();
}

/* ═══════════════════════════════════════════════════════════
   GAME LOGIC UPDATE
   ═══════════════════════════════════════════════════════════ */
function update() {
  if (scene === 'RACE' || scene === 'DOWNTOWN') {
    updateRace();
  } else if (scene === 'WALK') {
    updateWalk();
  } else if (scene === 'CINEMATIC') {
    updateCinematic();
  }
  updateHUD();
}

function updateRace() {
  const segIdx   = Math.floor(player.pos / SEG_LEN) % NUM_SEGS;
  const curScene = getSeg(segIdx).scene;

  const speedLimit = curScene === 'downtown' ? 80 : MAX_SPEED;

  // Throttle / brake
  if (keys.up)   player.speed = Math.min(speedLimit, player.speed + ACCEL   * dt * 60);
  if (keys.down) player.speed = Math.max(0,           player.speed - BRAKE   * dt * 60);
  if (!keys.up && !keys.down) player.speed = Math.max(0, player.speed - DECEL * dt * 60);

  // Steering
  const steerFactor = (player.speed / MAX_SPEED) * CENTRIFUGAL;
  if (keys.left)  player.x -= 0.018 + steerFactor * 0.01;
  if (keys.right) player.x += 0.018 + steerFactor * 0.01;

  // Off-road slow
  if (Math.abs(player.x) > 1.0) {
    player.speed *= (1 - OFFROAD_SLOW * dt);
    if (Math.random() < 0.03) addChat('warn', '[ GITFLOW ≋ ] Off-track — inertia pool disrupted!');
  }

  player.x = Math.max(-2, Math.min(2, player.x));
  player.pos += player.speed * dt;

  // Lap counter — one lap = SEGS_PER_LAP segments in world units
  const lapLen = SEGS_PER_LAP * SEG_LEN;
  const newLap = Math.floor(player.pos / lapLen);
  if (newLap > player.lap) {
    player.lap = newLap;
    player.btc += 1000;
    updateBTC();
    addChat('event', `[ LAP ${player.lap} ] +1,000 sats earned · GitPub broadcasting…`);
    if (player.lap === 1) triggerDowntownEntry();
  }

  // AI racer update
  AI_DATA.forEach(ai => {
    const targetSpeed = (MAX_SPEED * ai.skill) * (0.9 + Math.random() * 0.2);
    ai.speed += (targetSpeed - ai.speed) * 0.02;
    ai.pos   += ai.speed * dt;
    // Gentle path following
    ai.x += (0 - ai.x) * 0.005 + (Math.random() - 0.5) * 0.003;
    ai.x = Math.max(-0.8, Math.min(0.8, ai.x));
  });

  // GitPin detection
  GITPINS.forEach(pin => {
    if (triggeredPins.has(pin.id)) return;
    const pinWorld = pin.seg * SEG_LEN;
    const looped   = player.pos % (NUM_SEGS * SEG_LEN);
    if (looped > pinWorld - SEG_LEN * 0.5 && looped < pinWorld + SEG_LEN * 0.5) {
      triggeredPins.add(pin.id);
      player.btc += pin.reward;
      updateBTC();
      showGitpin(pin);
    }
  });

  // Scene transition detection
  if (curScene === 'downtown' && scene === 'RACE') {
    scene = 'DOWNTOWN';
    showBanner('DOWNTOWN DISTRICT', 'Slow down — speed limit 80 km/h', 3000);
    document.getElementById('h-scene').textContent = 'DOWNTOWN';
    addChat('ai', '[ GITFLOW ≋ ] Entering downtown. Momentum buffer engaging — reduce speed.');
  }
  if (curScene === 'race' && scene === 'DOWNTOWN') {
    scene = 'RACE';
    document.getElementById('h-scene').textContent = 'RACE';
  }
}

function triggerDowntownEntry() {
  // Force track position to downtown zone after first lap
  setTimeout(() => {
    addChat('ai', '[ AI-GM ] You hear brakes screaming. The track curves into a city street…');
    showBanner('ENTERING DOWNTOWN', 'The race world shifts — buildings rising', 3500);
  }, 2000);
}

function updateWalk() {
  walkState.walking = keys.left || keys.right || keys.up;
  const speed = 120;
  if (keys.left)  walkState.charX -= speed * dt;
  if (keys.right) walkState.charX += speed * dt;
  // NPC proximity check
  const npcWorldX = 200;
  if (Math.abs(walkState.charX - npcWorldX) < 40 && walkState.npcBubbleT <= 0) {
    walkState.npcBubble = walkState.npcMessages[walkState.npcIdx % walkState.npcMessages.length];
    walkState.npcBubbleT = 4;
    walkState.npcIdx++;
    addChat('event', `[ NPC ] "${walkState.npcBubble}"`);
  }
}

function updateCinematic() {
  cinState.timer += dt;
  if (cinState.timer > 1.5 && cinState.phase === 0) {
    cinState.phase = 1;
    addChat('ai', '[ AI-GM ] The car door opens. Your driver steps out onto the street…');
  }
  if (cinState.timer > 3.5 && cinState.phase === 1) {
    cinState.phase = 2;
    addChat('ai', '[ AI-GM ] A figure approaches — a GitPin node, pulsing green.');
  }
  if (cinState.timer > 5.5 && cinState.phase === 2) {
    cinState.phase = 3;
    addChat('event', '[ SCENE ] Downtown walk mode activated. Use ← → to move.');
    transitionToWalk();
  }
}

/* ═══════════════════════════════════════════════════════════
   SCENE TRANSITIONS
   ═══════════════════════════════════════════════════════════ */
function transitionToWalk() {
  scene = 'WALK';
  walkState.charX = 0;
  walkState.carX  = 0;
  document.getElementById('h-scene').textContent = 'WALK';
  canvas.style.display = 'none';
  walkCvs.style.display = 'block';
  walkCvs.width  = window.innerWidth;
  walkCvs.height = window.innerHeight;
  addChat('ai', '[ GITFLOW ≋ ] Inertia pool paused. GitPin markers are glowing nearby.');
}

function transitionToRace() {
  scene = 'RACE';
  canvas.style.display = 'block';
  walkCvs.style.display = 'none';
  document.getElementById('h-scene').textContent = 'RACE';
  player.speed = 0;
  addChat('ai', '[ GITFLOW ≋ ] Back in the car. Momentum buffer releasing — race resumed.');
  showBanner('RACE RESUMED', 'Gitflow ≋ streamliner re-engaged', 2500);
}

function startCinematic() {
  scene = 'CINEMATIC';
  cinState = { phase: 0, timer: 0, done: false };
  document.getElementById('h-scene').textContent = 'CINEMATIC';
  showBanner('STOP THE CAR', 'Pull over and get out…', 2000);
}

/* ═══════════════════════════════════════════════════════════
   HUD UPDATE
   ═══════════════════════════════════════════════════════════ */
function updateHUD() {
  // Speed
  const spd = Math.round(player.speed);
  const hSpd = document.getElementById('h-speed');
  hSpd.textContent = spd;
  // Speed colour: check highest threshold first so thresholds don't shadow each other
  let spdClass = '';
  if (spd > MAX_SPEED * 0.95)      spdClass = ' red';
  else if (spd > MAX_SPEED * 0.85) spdClass = ' warn';
  hSpd.className = 'hud-val' + spdClass;

  // Gear (simulated)
  const gear = spd < 40 ? 1 : spd < 80 ? 2 : spd < 130 ? 3 : spd < 190 ? 4 : spd < 250 ? 5 : 6;
  document.getElementById('h-gear').textContent = player.speed < 2 ? 'N' : gear;

  // Lap
  document.getElementById('h-lap').textContent = `${player.lap}/3`;

  // Race positions
  const allRacers = [
    { name: 'YOU', repo: '≋', pos: player.pos, isPlayer: true },
    ...AI_DATA.map(a => ({ name: a.name, repo: a.repo, pos: a.pos, isPlayer: false, color: a.color })),
  ].sort((a, b) => b.pos - a.pos);

  const posEl = document.getElementById('h-pos');
  posEl.innerHTML = allRacers.map((r, i) => `
    <div class="pos-row${r.isPlayer ? ' player' : ''}">
      <span class="pos-num">${i+1}.</span>
      <span class="pos-name" style="${r.color ? 'color:'+r.color : ''}">${r.name}</span>
      <span class="pos-repo">${r.repo}</span>
    </div>`).join('');
}

function updateBTC() {
  document.getElementById('h-btc').textContent = `₿ ${player.btc.toLocaleString()} sats`;
}

/* ═══════════════════════════════════════════════════════════
   GITPIN POPUP
   ═══════════════════════════════════════════════════════════ */
function showGitpin(pin) {
  activePin = pin;
  document.getElementById('gp-title').textContent  = 'GITPIN ' + pin.id;
  document.getElementById('gp-meta').textContent   = pin.title + ' · +' + pin.reward + ' sats';
  document.getElementById('gp-body').textContent   = pin.body;
  document.getElementById('h-pin').textContent     = pin.id;
  document.getElementById('gitpin-popup').classList.add('visible');
  addChat('event', `[ GITPIN ] ∆ ${pin.id} triggered — +${pin.reward} sats`);
  addChat('ai', '[ GITPUB 📡 ] Broadcasting pin content to live stream…');
}

function closeGitpin() {
  document.getElementById('gitpin-popup').classList.remove('visible');
  activePin = null;
}

/* ═══════════════════════════════════════════════════════════
   SCENE BANNER
   ═══════════════════════════════════════════════════════════ */
function showBanner(text, sub, duration) {
  const b = document.getElementById('scene-banner');
  document.getElementById('sb-text').textContent = text;
  document.getElementById('sb-sub').textContent  = sub;
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), duration);
}

/* ═══════════════════════════════════════════════════════════
   AI CHAT GAME MASTER
   ═══════════════════════════════════════════════════════════ */
function addChat(type, msg) {
  const log = document.getElementById('chat-log');
  while (log.children.length >= 12) log.removeChild(log.firstChild);
  const d = document.createElement('div');
  d.className = 'chat-msg ' + type;
  d.textContent = msg;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';
  addChat('user', '> ' + text);
  processChat(text.toLowerCase());
}

document.getElementById('chat-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
  e.stopPropagation(); // don't send keypresses to game while typing
});

const AI_RESPONSES = [
  {
    match: ['slow','brake','stop','slow down'],
    act: () => {
      addChat('ai', '[ AI-GM ] Brake now! The road curves sharply ahead — use the momentum buffer.');
      keys.down = true;
      setTimeout(() => { keys.down = false; }, 600);
      player.speed = Math.min(player.speed, 80);
    }
  },
  {
    match: ['where','location','scene','where am i'],
    act: () => {
      const seg = getSeg(Math.floor(player.pos / SEG_LEN) % NUM_SEGS);
      addChat('ai', `[ AI-GM ] You are in sector ${scene}. Road type: ${seg.scene}. Speed: ${Math.round(player.speed)} km/h.`);
    }
  },
  {
    match: ['park','pull over','pull up'],
    act: () => {
      if (scene === 'DOWNTOWN' || scene === 'RACE') {
        player.speed = 0;
        addChat('ai', '[ AI-GM ] Car slowing to a halt. GitPin district ahead…');
        setTimeout(() => startCinematic(), 1500);
      } else {
        addChat('ai', '[ AI-GM ] You need to be on the road to park. Try "slow down" first.');
      }
    }
  },
  {
    match: ['get out','exit','exit car','leave car','out of the car'],
    act: () => {
      if (scene === 'WALK') {
        addChat('ai', '[ AI-GM ] You are already out of the car! Use ← → to walk.');
      } else {
        player.speed = 0;
        addChat('ai', '[ AI-GM ] Stopping the car. Opening door…');
        setTimeout(() => startCinematic(), 800);
      }
    }
  },
  {
    match: ['back in','get in','drive','resume','race'],
    act: () => {
      if (scene === 'WALK') transitionToRace();
      else addChat('ai', '[ AI-GM ] You are already driving. Floor it!');
    }
  },
  {
    match: ['bitcoin','btc','sats','wallet'],
    act: () => {
      addChat('ai', `[ GITPUB 📡 ] Current wallet: ${player.btc.toLocaleString()} sats. Earn more by completing laps and triggering GitPins.`);
    }
  },
  {
    match: ['gitpin','pin','∆','anchor'],
    act: () => {
      const next = GITPINS.find(p => !triggeredPins.has(p.id));
      if (next) addChat('ai', `[ GITPIN ∆ ] Next pin: ${next.id} at segment ${next.seg}. Reward: ${next.reward} sats.`);
      else addChat('ai', '[ GITPIN ∆ ] All pins collected this lap. New pins spawn next lap.');
    }
  },
  {
    match: ['who','racers','players','ai','opponents'],
    act: () => {
      AI_DATA.forEach(a => addChat('ai', `[ AI ] ${a.name} · repo: ${a.repo} · skill: ${Math.round(a.skill*100)}%`));
      MULTI_SLOTS.forEach(s => addChat('ai', `[ OPEN ] ${s.label}`));
    }
  },
  {
    match: ['downtown','city','street'],
    act: () => {
      addChat('ai', '[ AI-GM ] The downtown district is at track segment 380. Speed limit 80. Buildings hide the horizon.');
      if (scene === 'RACE') addChat('ai', '[ AI-GM ] Complete the current lap to reach it naturally, or say "park" to stop now.');
    }
  },
  {
    match: ['help','commands','what can'],
    act: () => {
      addChat('ai', '[ HELP ] Commands: "slow down" · "where am I" · "park" · "get out" · "get in" · "bitcoin" · "gitpin" · "who" · "downtown"');
    }
  },
  {
    match: ['gitflow','≋','streamliner'],
    act: () => {
      addChat('ai', '[ GITFLOW ≋ ] I am the Streamliner — managing your inertia pool. Smooth transitions, no rhythm shock.');
    }
  },
  {
    match: ['gitsync','sync','harmonize'],
    act: () => addChat('ai', '[ GITSYNC ⟲ ] Rhythm re-integration at ' + Math.round(70 + Math.random()*28) + '%. Patch will push at lap end.')
  },
  {
    match: ['speed up','faster','go','floor it','accelerate'],
    act: () => {
      addChat('ai', '[ AI-GM ] Momentum buffer releasing — full throttle ahead!');
      keys.up = true; setTimeout(() => { keys.up = false; }, 500);
    }
  },
];

function processChat(text) {
  // Check for matching response
  for (const r of AI_RESPONSES) {
    if (r.match.some(m => text.includes(m))) {
      setTimeout(() => r.act(), 300 + Math.random() * 200);
      return;
    }
  }
  // Fallback: generic AI narration
  const fallbacks = [
    '[ AI-GM ] Interesting. The Giro registers a shift in your spatial frequency.',
    '[ AI-GM ] GitPin ∆ pulsing nearby — your words may anchor as a commit.',
    '[ AI-GM ] Gitpulse ♥ detects an off-beat. Say "help" for commands.',
    '[ AI-GM ] The race world is listening. Your narrative is being forked.',
    '[ AI-GM ] Gitpub 📡 is broadcasting this conversation to Main Existence.',
  ];
  addChat('ai', fallbacks[Math.floor(Math.random() * fallbacks.length)]);
}

/* ═══════════════════════════════════════════════════════════
   GP SUITE HAMBURGER MENU
   ═══════════════════════════════════════════════════════════ */
let menuOpen = false;
function toggleMenu() {
  menuOpen = !menuOpen;
  document.getElementById('gp-menu').classList.toggle('open', menuOpen);
}

function menuAction(tool) {
  menuOpen = false;
  document.getElementById('gp-menu').classList.remove('open');
  if (tool === 'dashboard') { window.location.href = 'index.html'; return; }
  const msgs = {
    gitflow: '[ GITFLOW ≋ ] Streamliner is ONLINE. Inertia pool pressure: nominal. Fork transitions: smooth.',
    gitpin:  '[ GITPIN ∆ ] ' + (GITPINS.length - triggeredPins.size) + ' pins remaining. Next reward: ' + (GITPINS.find(p=>!triggeredPins.has(p.id))?.reward || 0) + ' sats.',
    gitpro:  '[ GITPRO ◆ ] World styling: ACTIVE. Road physics v3.2 loaded. Car livery: default cyan.',
    gitial:  '[ GITIAL ⬡ ] 2 racer identities pending connection. Link your GitHub to race as yourself.',
    gitpub:  `[ GITPUB 📡 ] Live stream active. ${player.lap} laps broadcast. ${player.btc} sats earned total.`,
  };
  addChat('event', msgs[tool] || '...');
}

// Close menu on outside click
document.addEventListener('click', e => {
  if (menuOpen && !document.getElementById('gp-menu').contains(e.target)
               && !document.getElementById('menu-btn').contains(e.target)) {
    menuOpen = false;
    document.getElementById('gp-menu').classList.remove('open');
  }
});

/* ═══════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (document.activeElement === document.getElementById('chat-input')) return;
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') keys.up    = true;
  if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') keys.down  = true;
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  if (e.key === 'Escape') toggleMenu();
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'W') keys.up    = false;
  if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') keys.down  = false;
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') keys.left  = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

/* Mobile touch steering */
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  keys.up = true;
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - touchStartX;
  const dy = e.touches[0].clientY - touchStartY;
  keys.left  = dx < -20;
  keys.right = dx >  20;
  keys.down  = dy >  30;
  keys.up    = dy < -10 || Math.abs(dx) < 20;
}, { passive: true });
canvas.addEventListener('touchend', () => {
  keys.up = keys.down = keys.left = keys.right = false;
}, { passive: true });

/* ═══════════════════════════════════════════════════════════
   RESIZE
   ═══════════════════════════════════════════════════════════ */
function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  if (scene === 'WALK') {
    walkCvs.width  = window.innerWidth;
    walkCvs.height = window.innerHeight;
  }
}
window.addEventListener('resize', resize);
resize();

/* ═══════════════════════════════════════════════════════════
   MAIN LOOP
   ═══════════════════════════════════════════════════════════ */
function loop(ts) {
  if (!running) return;
  dt = Math.min((ts - lastTs) / 1000, 0.05); // cap at 50ms
  lastTs = ts;
  gameTime += dt;

  update();

  if (scene === 'RACE' || scene === 'DOWNTOWN' || scene === 'CINEMATIC') {
    renderRoad();
    if (scene === 'CINEMATIC') renderCinematic();
  } else if (scene === 'WALK') {
    renderWalk();
  }

  requestAnimationFrame(loop);
}

/* ═══════════════════════════════════════════════════════════
   CINEMATIC RENDER
   ═══════════════════════════════════════════════════════════ */
function renderCinematic() {
  const phase = cinState.phase;
  const t     = cinState.timer;

  // Overlay
  ctx.fillStyle = `rgba(3,8,16,${Math.min(0.7, t * 0.2)})`;
  ctx.fillRect(0, 0, W, H);

  if (phase >= 1) {
    // Car door opening (simple animation)
    const carX = W * 0.5, carY = H * 0.72;
    const cw = W * 0.12, ch = cw * 0.42;
    drawF1Car(ctx, carX, carY, cw, ch, '#00d4ff', true);

    // Door (rectangle swinging open)
    const doorAnim = Math.min(1, (t - 1.5) / 0.8);
    ctx.save();
    ctx.translate(carX + cw * 0.15, carY - ch * 0.2);
    ctx.rotate(-doorAnim * Math.PI * 0.5);
    ctx.fillStyle = 'rgba(0,100,150,0.8)';
    ctx.fillRect(0, 0, cw * 0.3, ch * 0.6);
    ctx.restore();
  }

  if (phase >= 2) {
    // Character stepping out
    const charProg = Math.min(1, (t - 3.5) / 1.5);
    const charX = W * 0.5 + charProg * W * 0.08;
    const charY = H * 0.72;
    drawCharacter(ctx, charX, charY, '#00d4ff', true);

    // "A figure approaches" — NPC
    if (t > 4) {
      const npcX = W * 0.62 - (t - 4) * 25;
      drawCharacter(ctx, npcX, charY, '#ffb800', false);
      ctx.fillStyle = '#ffb800';
      ctx.font = '11px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('GitPin node detected', W * 0.55, H * 0.58);
      ctx.textAlign = 'left';
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
function startGame() {
  buildTrack();
  scene = 'RACE';
  player.pos   = 0;
  player.speed = 0;
  player.x     = 0;
  player.lap   = 0;
  player.btc   = 0;
  triggeredPins.clear();
  running = true;

  document.getElementById('overlay').classList.add('hidden');

  addChat('ai', '[ GITFLOW ≋ ] Engine online — Quantum Rhythm Engine synchronized.');
  addChat('ai', '[ AI-GM ] Race start: 4 AI opponents connected. Type to talk while driving.');
  addChat('event', '[ GITPUB 📡 ] Live stream started · 0 sats · Type "help" for commands');

  lastTs = performance.now();
  requestAnimationFrame(loop);
}

// Expose for HTML onclick attributes
window.startGame   = startGame;
window.closeGitpin = closeGitpin;
window.toggleMenu  = toggleMenu;
window.menuAction  = menuAction;
window.sendChat    = sendChat;
