// Animated stick-figure illustrations.
// Each exercise describes a few key poses (side view, facing right) plus the
// equipment around the figure. Poses are solved with simple forward / inverse
// kinematics so limbs keep their length while the figure moves between them.

const L = { torso: 46, neck: 4, head: 8.5, ua: 24, fa: 22, th: 30, sh: 30, foot: 9 };
const ANGLES = new Set(['t', 'ua', 'fa', 'th', 'sh', 'ua2', 'fa2', 'th2', 'sh2', 'ft', 'ft2', 'hd']);
const NS = 'http://www.w3.org/2000/svg';

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;
const dir = (a, len) => [Math.cos(rad(a)) * len, Math.sin(rad(a)) * len];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
const angleTo = (a, b) => deg(Math.atan2(b[1] - a[1], b[0] - a[0]));
const lerp = (a, b, t) => a + (b - a) * t;
const lerpAngle = (a, b, t) => {
  let d = ((b - a + 540) % 360) - 180;
  return a + d * t;
};

// Two-bone inverse kinematics. bend = +1 / -1 picks which way the joint bends.
function ik(root, target, a, b, bend) {
  let d = Math.hypot(target[0] - root[0], target[1] - root[1]);
  d = Math.min(Math.max(d, Math.abs(a - b) + 0.01), a + b - 0.01);
  const base = angleTo(root, target);
  const off = deg(Math.acos((a * a + d * d - b * b) / (2 * a * d)));
  const upper = base + bend * off;
  const mid = add(root, dir(upper, a));
  return [upper, angleTo(mid, target)];
}

function limb(root, p, targetKey, aKey, bKey, bendKey, la, lb, defBend, fallback) {
  const target = p[targetKey] ?? (fallback && fallback.target);
  let a, b;
  if (target && p[aKey] === undefined) {
    [a, b] = ik(root, target, la, lb, p[bendKey] ?? defBend);
  } else {
    a = p[aKey] ?? fallback?.a ?? 90;
    b = p[bKey] ?? fallback?.b ?? 90;
  }
  const j1 = add(root, dir(a, la));
  const j2 = add(j1, dir(b, lb));
  return { a, b, j1, j2, target };
}

export function solve(p) {
  const hip = p.hip;
  const shoulder = add(hip, dir(p.t ?? -90, L.torso));
  const head = add(shoulder, dir((p.t ?? -90) + (p.hd ?? 0), L.neck + L.head));
  const arm = limb(shoulder, p, 'hand', 'ua', 'fa', 'eb', L.ua, L.fa, 1);
  const arm2 = limb(shoulder, p, 'hand2', 'ua2', 'fa2', 'eb2', L.ua, L.fa, p.eb ?? 1,
    { target: p.hand2 ?? (p.ua === undefined ? p.hand : undefined), a: p.ua, b: p.fa });
  const leg = limb(hip, p, 'ankle', 'th', 'sh', 'kb', L.th, L.sh, -1);
  const leg2 = limb(hip, p, 'ankle2', 'th2', 'sh2', 'kb2', L.th, L.sh, p.kb ?? -1,
    { target: p.ankle2 ?? (p.th === undefined ? p.ankle : undefined), a: p.th, b: p.sh });
  const toe = add(leg.j2, dir(p.ft ?? leg.b - 90, L.foot));
  const toe2 = add(leg2.j2, dir(p.ft2 ?? p.ft ?? leg2.b - 90, L.foot));
  // Spine curve (cat / cow): control point pushed sideways from the torso midpoint.
  const mid = [(hip[0] + shoulder[0]) / 2, (hip[1] + shoulder[1]) / 2];
  const spine = add(mid, dir((p.t ?? -90) - 90, p.curve ?? 0));
  return {
    hip, shoulder, head, spine,
    elbow: arm.j1, hand: arm.j2, elbow2: arm2.j1, hand2: arm2.j2,
    knee: leg.j1, ankle: leg.j2, knee2: leg2.j1, ankle2: leg2.j2, toe, toe2,
  };
}

function interp(a, b, t) {
  const out = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k] ?? b[k];
    const vb = b[k] ?? a[k];
    if (Array.isArray(va)) out[k] = [lerp(va[0], vb[0], t), lerp(va[1], vb[1], t)];
    else if (typeof va === 'number') out[k] = ANGLES.has(k) ? lerpAngle(va, vb, t) : lerp(va, vb, t);
    else out[k] = t < 0.5 ? va : vb;
  }
  return out;
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function el(name, attrs = {}, parent) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function line(n, a, b) {
  n.setAttribute('x1', a[0].toFixed(1)); n.setAttribute('y1', a[1].toFixed(1));
  n.setAttribute('x2', b[0].toFixed(1)); n.setAttribute('y2', b[1].toFixed(1));
}

function poly(n, pts) {
  n.setAttribute('points', pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '));
}

// Static scenery drawn once.
function drawStatic(g, item) {
  switch (item.k) {
    case 'floor':
      el('line', { x1: 4, y1: 141, x2: 196, y2: 141, class: 'fx-floor' }, g); break;
    case 'rect':
      el('rect', { x: item.x, y: item.y, width: item.w, height: item.h, rx: item.r ?? 2, class: item.c ?? 'fx-equip' }, g); break;
    case 'line':
      el('line', { x1: item.a[0], y1: item.a[1], x2: item.b[0], y2: item.b[1], class: item.c ?? 'fx-frame' }, g); break;
    case 'pulley':
      el('circle', { cx: item.at[0], cy: item.at[1], r: 4, class: 'fx-pulley' }, g); break;
    case 'chair': {
      const { x, y } = item; // seat top-left
      el('path', { d: `M${x} ${y - 34} L${x} 141 M${x} ${y} L${x + 30} ${y} L${x + 30} 141`, class: 'fx-frame' }, g);
      el('rect', { x, y: y - 3, width: 32, height: 6, rx: 2, class: 'fx-equip' }, g);
      break;
    }
    case 'mat':
      el('rect', { x: item.x ?? 14, y: 139, width: item.w ?? 172, height: 3, rx: 1.5, class: 'fx-mat' }, g); break;
    case 'wall':
      el('line', { x1: item.x, y1: 10, x2: item.x, y2: 141, class: 'fx-frame' }, g); break;
    default: break;
  }
}

// Props that follow the body each frame.
function makeDynamic(g, item) {
  switch (item.k) {
    case 'cable': case 'lever': case 'chain':
      return { item, n: el('line', { class: item.k === 'lever' ? 'fx-lever' : 'fx-cable' }, g) };
    case 'grip':
      return { item, n: el('circle', { r: 3.4, class: 'fx-grip' }, g) };
    case 'db':
      return { item, n: el('rect', { width: 14, height: 6, rx: 2, class: 'fx-grip' }, g) };
    case 'pad':
      return { item, n: el('circle', { r: item.r ?? 5, class: 'fx-pad' }, g) };
    case 'fpad':
      return { item, n: el('line', { class: 'fx-fpad' }, g) };
    case 'seat':
      return { item, n: el('rect', { width: item.w ?? 18, height: 5, rx: 2, class: 'fx-equip' }, g) };
    default:
      return null;
  }
}

function updateDynamic(d, s) {
  const { item, n } = d;
  const at = (key) => (Array.isArray(key) ? key : s[key]);
  switch (item.k) {
    case 'cable': case 'lever': case 'chain':
      line(n, at(item.from), at(item.to)); break;
    case 'grip': case 'pad': {
      const p = at(item.at);
      n.setAttribute('cx', p[0].toFixed(1)); n.setAttribute('cy', p[1].toFixed(1)); break;
    }
    case 'db': {
      const p = at(item.at);
      n.setAttribute('x', (p[0] - 7).toFixed(1)); n.setAttribute('y', (p[1] - 3).toFixed(1)); break;
    }
    case 'fpad': {
      const a = s.elbow, b = s.hand;
      line(n, [lerp(a[0], b[0], 0.15), lerp(a[1], b[1], 0.15)], [lerp(a[0], b[0], 0.95), lerp(a[1], b[1], 0.95)]);
      break;
    }
    case 'seat': {
      const p = s.hip;
      n.setAttribute('x', (p[0] - (item.w ?? 18) / 2).toFixed(1));
      n.setAttribute('y', (item.y ?? p[1] + 7).toFixed(1));
      break;
    }
    default: break;
  }
}

/**
 * Mount an animated figure into `host`. Returns { destroy, pause, play }.
 */
export function mountFigure(host, ex, opts = {}) {
  host.innerHTML = '';
  const fig = ex.fig;
  const svg = el('svg', { viewBox: '0 0 200 150', class: 'figure', role: 'img', 'aria-label': `${ex.name} illustration` });
  host.appendChild(svg);
  if (!fig) {
    el('text', { x: 100, y: 80, 'text-anchor': 'middle', class: 'fx-empty' }, svg).textContent = 'No illustration';
    return { destroy() {}, pause() {}, play() {} };
  }
  const scene = fig.scene ?? [];
  const back = el('g', {}, svg);
  scene.filter((i) => !i.front).forEach((i) => drawStatic(back, i));
  const dynBack = scene.filter((i) => !i.front).map((i) => makeDynamic(back, i)).filter(Boolean);
  const farG = el('g', { class: 'fx-far' }, svg);
  const far = { ua: el('polyline', {}, farG), leg: el('polyline', {}, farG) };
  const body = el('g', { class: 'fx-body' }, svg);
  const torso = el('path', {}, body);
  const head = el('circle', { r: L.head, class: 'fx-head' }, body);
  const near = { leg: el('polyline', {}, body), arm: el('polyline', {}, body) };
  const front = el('g', {}, svg);
  scene.filter((i) => i.front).forEach((i) => drawStatic(front, i));
  const dynFront = scene.filter((i) => i.front).map((i) => makeDynamic(front, i)).filter(Boolean);

  const render = (pose) => {
    const s = solve(pose);
    poly(far.ua, [s.shoulder, s.elbow2, s.hand2]);
    poly(far.leg, [s.hip, s.knee2, s.ankle2, s.toe2]);
    torso.setAttribute('d', `M${s.hip[0].toFixed(1)} ${s.hip[1].toFixed(1)} Q${s.spine[0].toFixed(1)} ${s.spine[1].toFixed(1)} ${s.shoulder[0].toFixed(1)} ${s.shoulder[1].toFixed(1)}`);
    head.setAttribute('cx', s.head[0].toFixed(1)); head.setAttribute('cy', s.head[1].toFixed(1));
    poly(near.leg, [s.hip, s.knee, s.ankle, s.toe]);
    poly(near.arm, [s.shoulder, s.elbow, s.hand]);
    dynBack.forEach((d) => updateDynamic(d, s));
    dynFront.forEach((d) => updateDynamic(d, s));
  };

  const poses = fig.poses;
  const hold = fig.hold ?? 0.45;
  // Segment durations: two-pose moves use tempo [lift, lower] (default ~2s up, 3s down feel).
  const segs = poses.length === 2 ? (fig.tempo ?? [1.3, 1.9]) : poses.map(() => fig.seg ?? 0.9);
  const total = segs.reduce((a, b) => a + b + hold, 0);
  const reduce = opts.static || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  render(poses[poses.length === 1 ? 0 : 0]);
  if (poses.length === 1 || reduce) {
    if (reduce && poses.length > 1) render(poses[1]);
    return { destroy() {}, pause() {}, play() {} };
  }

  let raf = 0, start = performance.now(), paused = false, pausedAt = 0;
  const tick = (now) => {
    let t = ((now - start) / 1000) % total;
    for (let i = 0; i < poses.length; i++) {
      if (t < hold) { render(poses[i]); break; }
      t -= hold;
      if (t < segs[i]) { render(interp(poses[i], poses[(i + 1) % poses.length], ease(t / segs[i]))); break; }
      t -= segs[i];
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  svg.addEventListener('click', () => (paused ? api.play() : api.pause()));
  const api = {
    destroy() { cancelAnimationFrame(raf); },
    pause() { if (!paused) { paused = true; pausedAt = performance.now(); cancelAnimationFrame(raf); } },
    play() { if (paused) { paused = false; start += performance.now() - pausedAt; raf = requestAnimationFrame(tick); } },
  };
  return api;
}

// Small static thumbnail (end position) for lists.
export function thumb(host, ex) {
  mountFigure(host, ex, { static: true });
}
