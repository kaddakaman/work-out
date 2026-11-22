// Local persistence. Everything lives in this browser's localStorage.
import { EXERCISES, TEMPLATES } from './data.js';

const KEY = 'repup.v1';

const DEFAULT_SETTINGS = {
  equipment: ['ig1', 'rower', 'bench'],
  unit: 'kg',
  step: 2.5, // weight increment per tap
  exRest: 90, // rest between exercises (seconds)
  weeklyGoal: 3,
  sound: true,
  vibrate: true,
  voice: false,
  wakeLock: true,
  warmup: true,
  spotify: { playlist: '', clientId: '' },
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export function itemFromExercise(ex, over = {}) {
  const d = ex.def;
  return {
    exId: ex.id,
    sets: d.sets,
    ...(ex.mode === 'time' ? { secs: d.secs } : { reps: [...d.reps] }),
    rest: d.rest,
    load: ex.load === 'level' ? 5 : null,
    ...over,
  };
}

export function starterWorkouts() {
  return TEMPLATES.map((t) => ({
    id: t.id, name: t.name, desc: t.desc, group: t.group, rotation: t.rotation ?? null,
    items: t.items.map(({ exId, ...over }) => itemFromExercise(getExercise(exId), over)),
  }));
}

function fresh() {
  return { settings: structuredClone(DEFAULT_SETTINGS), workouts: starterWorkouts(), history: [], custom: [], active: null };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = JSON.parse(raw);
    s.settings = { ...structuredClone(DEFAULT_SETTINGS), ...s.settings, spotify: { ...DEFAULT_SETTINGS.spotify, ...s.settings?.spotify } };
    s.workouts ??= starterWorkouts();
    s.history ??= [];
    s.custom ??= [];
    return s;
  } catch {
    return fresh();
  }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

export function replaceState(next) {
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  save();
}

export function resetAll() { replaceState(fresh()); }

export function allExercises() { return [...EXERCISES, ...state.custom]; }

export function getExercise(id) {
  return EXERCISES.find((e) => e.id === id) ?? state.custom.find((e) => e.id === id) ?? {
    id, name: 'Unknown exercise', equip: [], muscles: [], mode: 'reps', load: 'none', def: { sets: 2, reps: [10, 10], rest: 60 },
  };
}

export const hasEquipment = (ex) => ex.equip.every((e) => state.settings.equipment.includes(e));

// ---- History helpers ----
export function lastPerformance(exId) {
  for (let i = state.history.length - 1; i >= 0; i--) {
    const e = state.history[i].exercises.find((x) => x.exId === exId && x.sets.length);
    if (e) return { date: state.history[i].ended, sets: e.sets };
  }
  return null;
}

export function bestLoad(exId) {
  let best = null;
  for (const h of state.history) for (const e of h.exercises) if (e.exId === exId) for (const s of e.sets) {
    if (typeof s.load === 'number' && (best === null || s.load > best)) best = s.load;
  }
  return best;
}

export function weekStart(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x.getTime();
}

export function thisWeekCount() {
  const ws = weekStart();
  return state.history.filter((h) => h.ended >= ws).length;
}

// Consecutive weeks (ending this week or last week) with at least one workout.
export function weekStreak() {
  const weeks = new Set(state.history.map((h) => weekStart(new Date(h.ended))));
  let w = weekStart();
  if (!weeks.has(w)) w -= 7 * 864e5;
  let n = 0;
  while (weeks.has(w)) { n++; w = weekStart(new Date(w - 3 * 864e5)); }
  return n;
}

export function suggestedNext() {
  const rot = state.workouts.filter((w) => w.rotation);
  if (!rot.length) return null;
  const last = [...state.history].reverse().find((h) => rot.some((w) => w.id === h.workoutId));
  if (!last) return rot[0];
  const i = rot.findIndex((w) => w.id === last.workoutId);
  return rot[(i + 1) % rot.length];
}
