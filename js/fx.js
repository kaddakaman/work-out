// The feel-good layer: praise lines, chimes, haptics, voice and confetti.
import { state } from './store.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
let lastLine = '';
function fresh(arr) {
  let s; let tries = 0;
  do { s = pick(arr); } while (s === lastLine && tries++ < 5);
  lastLine = s; return s;
}

export const PRAISE = {
  set: [
    'Nailed it!', 'Set smashed!', "That's how it's done!", 'Strong set!', 'Crushed it!',
    'Look at you go!', 'Boom. Set complete.', 'Beautiful work!', 'Another one in the bank.',
    'Solid as a rock.', 'You made that look easy.', "Yes! That's the one.", 'Clean reps. Love it.',
  ],
  setSub: [
    'Shake it out and breathe.', 'Sip of water if you need it.', 'Out on the effort, in on the return.',
    'Slow on the way down. That 3-second lower does the work.', 'Roll your shoulders and relax.',
    'Talk test: you should be able to say a short sentence.', 'Light brace, steady breathing.',
  ],
  lastSet: ['Last set of this one. Finish strong!', 'One more set and this one is done!', 'Final set coming up. Make it count!'],
  go: ["Let's go!", 'Time to shine!', "You've got this!", 'Back at it!', 'Up you get. Strong and steady!', "Next set. Let's make it count!"],
  exercise: ['{name} done and dusted!', '{name} conquered!', "That's {name} finished!", '{name}: complete. Brilliant!', 'Tick! {name} is in the books.'],
  halfway: ['Halfway there!', "You're over the hump!", 'Half done. Keep that rhythm!'],
  finalEx: ['Final exercise. Bring it home!', 'Last one! Empty the tank (with good form).'],
  workout: [
    'Workout complete!', 'You did it!', 'Session smashed!', 'That is a wrap!',
  ],
  workoutSub: [
    'You showed up and did the work. That is what builds results.',
    'Every session stacks up. Be proud of this one.',
    'Consistency beats intensity, and you just proved it.',
    'Future you says thanks.',
  ],
  pb: ['New personal best!', 'Heaviest yet!', 'PB unlocked!'],
};

export const say = (key, vars = {}) => fresh(PRAISE[key]).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

// ---- Audio ----
let ctx = null;
export function unlockAudio() {
  try {
    // Mix with Spotify instead of pausing it (Safari 16.4+).
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { /* no audio */ }
}

function tone(freq, start, dur, { type = 'sine', vol = 0.18 } = {}) {
  const o = ctx.createOscillator(); const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

const SOUNDS = {
  tick: () => tone(880, 0, 0.12, { type: 'triangle', vol: 0.12 }),
  check: () => { tone(660, 0, 0.12); tone(990, 0.07, 0.2); },
  set: () => { tone(523, 0, 0.18); tone(659, 0.09, 0.2); tone(784, 0.18, 0.35); },
  go: () => { tone(587, 0, 0.12, { type: 'triangle' }); tone(784, 0.1, 0.12, { type: 'triangle' }); tone(1175, 0.2, 0.35, { type: 'triangle' }); },
  exercise: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.3, { vol: 0.15 })),
  workout: () => {
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.56], [1047, 0.7]].forEach(([f, s]) => tone(f, s, 0.35, { type: 'triangle', vol: 0.16 }));
    tone(1568, 0.85, 0.7, { vol: 0.1 });
  },
};

export function sound(name) {
  if (!state.settings.sound) return;
  unlockAudio();
  try { ctx && SOUNDS[name]?.(); } catch { /* ignore */ }
}

export function buzz(pattern) {
  if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(pattern);
}

export function speak(text) {
  if (!state.settings.voice || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}\p{N}\s.,!?'-]/gu, ''));
    u.rate = 1.05; u.pitch = 1.05;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

// ---- Confetti ----
let canvas = null;
export function confetti(level = 1) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    document.body.appendChild(canvas);
  }
  const c = canvas; const g = c.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  g.scale(dpr, dpr);
  const colors = ['#FF5A36', '#FFB400', '#19A974', '#3D8BFD', '#B05CFF', '#FF7EB6'];
  const n = Math.round(60 * level);
  const parts = Array.from({ length: n }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * (level > 1 ? 0.35 : 0.42),
    vx: (Math.random() - 0.5) * 11 * Math.min(level, 1.6),
    vy: -Math.random() * 12 - 5,
    r: Math.random() * 360, vr: (Math.random() - 0.5) * 16,
    w: 5 + Math.random() * 6, h: 8 + Math.random() * 8,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  const dur = 1800 + level * 600;
  const frame = (now) => {
    const t = now - start;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate((p.r * Math.PI) / 180);
      g.globalAlpha = Math.max(0, 1 - t / dur);
      g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r / 30)));
      g.restore();
    }
    if (t < dur) requestAnimationFrame(frame); else g.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
}

// ---- Keep the screen awake during a workout ----
let lock = null;
export async function keepAwake(on) {
  try {
    if (on && state.settings.wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      if (!lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    } else if (!on && lock) { await lock.release(); lock = null; }
  } catch { lock = null; }
}
