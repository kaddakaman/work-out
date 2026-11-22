import { EQUIPMENT, MUSCLES, WARMUP, BREATHING } from './data.js';
import {
  state, save, uid, itemFromExercise, starterWorkouts, allExercises, getExercise, hasEquipment,
  lastPerformance, bestLoad, records, allRecords, totalPRs, thisWeekCount, weekStreak, suggestedNext, replaceState, resetAll,
} from './store.js';
import { mountFigure } from './figure.js';
import * as fx from './fx.js';
import * as spotify from './spotify.js';

// ---------------------------------------------------------------- helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const view = $('#view');
const overlay = $('#overlay');
const tabs = $('#tabs');
const music = $('#music');
const pl = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const P = {
  home: '<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6" fill="currentColor"/><circle cx="4" cy="12" r=".6" fill="currentColor"/><circle cx="4" cy="18" r=".6" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gear: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M7.5 5.5h3v13h-3zM13.5 5.5h3v13h-3z" fill="currentColor" stroke="none"/>',
  next: '<path d="M6 6v12l8.5-6z" fill="currentColor"/><path d="M17.5 6v12"/>',
  prev: '<path d="M18 6v12l-8.5-6z" fill="currentColor"/><path d="M6.5 6v12"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  grip: '<g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></g>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.5a2.5 2.5 0 0 0 2.6 3.9M16 6h2.5a2.5 2.5 0 0 1-2.6 3.9M12 13v4M8.5 20h7M9.5 17h5"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  dn: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.2 3 2.5 3.5C11 9 11 6 12 3z"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>',
  repeat: '<path d="M4 11a8 8 0 0 1 14.5-4.5L20 8M20 3.5V8h-4.5M20 13a8 8 0 0 1-14.5 4.5L4 16M4 20.5V16h4.5"/>',
  skip: '<path d="M5 6v12l7-6zM12.5 6v12l7-6z" fill="currentColor"/>',
};
const icon = (n, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(r).padStart(2, '0');
};
const fmtSecs = (s) => (s >= 60 ? fmtClock(s * 1000) : s + 's');
const fmtNum = (n) => (Math.round(n * 10) / 10).toString();
const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const unitLabel = () => state.settings.unit;

function targetText(it, ex) {
  if (ex.mode === 'time') return fmtSecs(it.secs);
  const [a, b] = it.reps;
  return `${a === b ? a : a + '–' + b} ${ex.perSide ? 'each side' : 'reps'}`;
}
function loadText(ex, load) {
  if (ex.load === 'kg' && load != null) return `${fmtNum(load)} ${unitLabel()}`;
  if (ex.load === 'level' && load != null) return `Level ${load}`;
  return '';
}
function itemSummary(it, ex) {
  const parts = [`${it.sets} × ${targetText(it, ex)}`, `rest ${fmtSecs(it.rest)}`];
  const l = loadText(ex, it.load);
  if (l) parts.push(l);
  return parts.join(' · ');
}
function describeSet(ex, s) {
  const p = [];
  if (s.load != null) p.push(loadText(ex, s.load));
  if (s.reps != null) p.push(`${s.reps} ${ex.perSide ? 'each side' : 'reps'}`);
  if (s.secs != null) p.push(fmtSecs(s.secs));
  return p.join(' × ');
}
// Log format from the plan: "20 × 12, 12"
function logLine(ex, sets) {
  if (!sets.length) return '';
  if (ex.load === 'kg') {
    const same = sets.every((s) => s.load === sets[0].load);
    const v = (s) => (s.reps ?? fmtSecs(s.secs));
    return same ? `${fmtNum(sets[0].load)} × ${sets.map(v).join(', ')}` : sets.map((s) => `${fmtNum(s.load)} × ${v(s)}`).join(', ');
  }
  if (ex.load === 'level') return sets.map((s) => `L${s.load} · ${s.secs != null ? fmtSecs(s.secs) : s.reps}`).join(', ');
  return sets.map((s) => (s.reps != null ? s.reps : fmtSecs(s.secs))).join(', ') + (ex.perSide && sets[0].reps != null ? ' each side' : '');
}
function estMinutes(w) {
  let s = 0;
  for (const it of w.items) {
    const ex = getExercise(it.exId);
    const work = ex.mode === 'time' ? it.secs : ((it.reps[0] + it.reps[1]) / 2) * (ex.perSide ? 2 : 1) * 5;
    s += it.sets * work + (it.sets - 1) * it.rest + state.settings.exRest;
  }
  if (state.settings.warmup) s += 300;
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}
const muscleChips = (ex, n = 3) => ex.muscles.slice(0, n).map((m, i) => `<span class="chip ${i === 0 ? 'accent' : ''}">${esc(m)}</span>`).join('');
const equipChips = (ex) => (ex.equip.length ? ex.equip : ['body']).map((e) => `<span class="chip">${esc(e === 'body' ? 'Bodyweight' : EQUIPMENT.find((q) => q.id === e)?.name ?? e)}</span>`).join('');

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ---------------------------------------------------------------- figures
const viewFigs = []; const overlayFigs = [];
function mountFigures(root, list) {
  $$('[data-fig]', root).forEach((n) => list.push(mountFigure(n, getExercise(n.dataset.fig), { static: 'static' in n.dataset })));
}
const clearFigs = (list) => { list.forEach((f) => f.destroy()); list.length = 0; };

// ---------------------------------------------------------------- routing
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, ...args] = h.split('/');
  return { name: name || 'home', args: args.map(decodeURIComponent) };
}
const go = (path) => { location.hash = '#/' + path; };
let lastRouteKey = '';

const VIEWS = {
  home: homeView, library: libraryView, ex: exerciseView, edit: builderView, pick: pickerView,
  history: historyView, repeat: repeatView, settings: settingsView, play: playerView, done: summaryView, newex: customExView,
};

function render() {
  const r = route();
  if (r.name === 'play' && !state.active) { go('home'); return; }
  const key = location.hash;
  clearFigs(viewFigs);
  const fn = VIEWS[r.name] ?? homeView;
  document.body.classList.toggle('no-tabs', !['home', 'library', 'history', 'settings'].includes(r.name));
  document.body.classList.toggle('playing', r.name === 'play');
  view.innerHTML = fn(...r.args);
  renderTabs(r.name);
  mountFigures(view, viewFigs);
  if (key !== lastRouteKey) { window.scrollTo(0, 0); lastRouteKey = key; closeSheet(); }
  if (r.name === 'play') {
    fx.keepAwake(true);
    if (['rest', 'ready'].includes(state.active.phase)) showRest(); else hideRest();
  } else {
    hideRest(); fx.keepAwake(false);
  }
  updateMusicDock();
}

function renderTabs(name) {
  const t = [['home', 'Workouts', 'home'], ['library', 'Exercises', 'list'], ['history', 'History', 'clock'], ['settings', 'Settings', 'gear']];
  tabs.innerHTML = t.map(([id, label, ic]) => `<a href="#/${id}" ${id === name ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('');
}

// ---------------------------------------------------------------- HOME
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Late one' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
function homeView() {
  const a = state.active;
  const sug = suggestedNext();
  const wc = thisWeekCount(); const goal = state.settings.weeklyGoal;
  const streak = weekStreak();
  let hero = '';
  if (a) {
    const done = a.items.reduce((n, it) => n + it.done.length, 0);
    const total = a.items.reduce((n, it) => n + it.sets, 0);
    hero = `<div class="hero resume"><p class="eyebrow">Workout in progress</p><h2>${esc(a.name)}</h2>
      <p>${done} of ${total} sets done. Pick up where you left off.</p>
      <button class="btn" data-act="resume">${icon('play')} Resume</button></div>`;
  } else if (sug) {
    hero = `<div class="hero"><p class="eyebrow">Up next in your plan</p><h2>${esc(sug.name)}</h2>
      <p>${esc(sug.desc || '')}</p>
      <p class="small" style="margin-top:6px">${pl(sug.items.length, 'exercise')} · about ${estMinutes(sug)} min</p>
      <button class="btn" data-act="start" data-id="${sug.id}">${icon('play')} Start workout</button></div>`;
  }
  const dots = Array.from({ length: goal }, (_, i) => `<i class="${i < wc ? 'on' : ''}"></i>`).join('');
  const groups = {};
  state.workouts.forEach((w) => (groups[w.group || 'My workouts'] ??= []).push(w));
  return `
    <div class="hello"><div><p class="eyebrow">${greeting()}</p><h1>${wc >= goal ? 'Goal smashed this week!' : "Let's get moving"}</h1></div></div>
    ${hero}
    <div class="stats section" style="margin-top:16px">
      <div class="stat"><div class="week-dots">${dots}</div><b>${wc}/${goal}</b><span>This week</span></div>
      <div class="stat"><b>${streak}${streak ? ' ' + icon('flame', 'icon') : ''}</b><span>Week streak</span></div>
      <div class="stat"><b>${state.history.length}</b><span>Workouts</span></div>
    </div>
    ${recentSection()}
    ${Object.entries(groups).map(([g, ws]) => `
      <div class="section"><div class="section-head"><h2>${esc(g)}</h2></div>
        ${ws.map(workoutCard).join('')}
      </div>`).join('')}
    <div class="section"><a class="btn block" href="#/edit/new">${icon('plus')} Build a workout</a></div>`;
}
function recentSection() {
  const recent = [...state.history].reverse().slice(0, 3);
  if (!recent.length) return '';
  return `<div class="section"><div class="section-head"><h2>Do it again</h2><a class="small" href="#/history">All history</a></div>
    ${recent.map((h) => `<div class="card wk">
      <div class="grow"><h3>${esc(h.name)}</h3>
        <p class="small muted">${fmtDate(h.ended)} · ${pl(h.sets, 'set')}${prsOf(h).length ? ` · <span style="color:var(--gold);font-weight:700">${pl(prsOf(h).length, 'PR')}</span>` : ''}</p></div>
      <a class="btn" href="#/repeat/${h.id}">${icon('repeat')} Repeat</a></div>`).join('')}</div>`;
}
const prsOf = (h) => h.prs ?? (h.pbs || []).map((exId) => ({ exId, name: getExercise(exId).name, type: 'load' }));
function workoutCard(w) {
  const missing = [...new Set(w.items.flatMap((it) => getExercise(it.exId).equip))].filter((e) => !state.settings.equipment.includes(e));
  const names = w.items.slice(0, 4).map((it) => getExercise(it.exId).name).join(', ') + (w.items.length > 4 ? '…' : '');
  return `<div class="card wk">
    <div class="grow"><h3>${esc(w.name)}</h3>
      <p class="small muted">${pl(w.items.length, 'exercise')} · ~${estMinutes(w)} min${missing.length ? ' · <span style="color:var(--gold)">needs ' + esc(missing.map((m) => EQUIPMENT.find((e) => e.id === m)?.name ?? m).join(', ')) + '</span>' : ''}</p>
      <p class="small muted" style="margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(names)}</p></div>
    <a class="icon-btn flat" href="#/edit/${w.id}" aria-label="Edit ${esc(w.name)}">${icon('edit')}</a>
    <button class="play" data-act="start" data-id="${w.id}" aria-label="Start ${esc(w.name)}">${icon('play')}</button>
  </div>`;
}

// ---------------------------------------------------------------- SESSION
function prepItem(it, preset = false) {
  const ex = getExercise(it.exId);
  const last = lastPerformance(it.exId);
  let load = null;
  if (ex.load !== 'none') {
    load = preset && it.load != null ? it.load
      : last?.sets[0]?.load ?? it.load ?? (ex.load === 'level' ? 5 : ex.equip.includes('dumbbells') ? 5 : 10);
  }
  let suggest = null;
  if (ex.load === 'kg' && ex.mode === 'reps' && last && last.sets.length >= it.sets && last.sets.every((s) => s.reps >= it.reps[1] && s.load >= load)) {
    suggest = load + state.settings.step;
  }
  return { ...structuredClone(it), done: [], cur: { load, reps: it.reps?.[1] ?? null, secs: it.secs ?? null }, suggest };
}
function startSession(src, preset = false) {
  if (state.active && !confirm('You have a workout in progress. Start a new one instead?')) return;
  fx.unlockAudio();
  state.active = {
    id: uid(), workoutId: src.workoutId, name: src.name, started: Date.now(), idx: 0,
    phase: state.settings.warmup ? 'warmup' : 'work', warm: [], items: src.items.map((it) => prepItem(it, preset)),
    msg: null, restEnd: 0, restTotal: 0, timerEnd: 0, prs: [], beat: [],
  };
  save(); go('play');
}
function startWorkout(id) {
  const w = state.workouts.find((x) => x.id === id);
  if (!w || !w.items.length) { toast('Add some exercises to this workout first.'); return; }
  startSession({ workoutId: w.id, name: w.name, items: w.items });
}

// ---- Records ----
const sessionSets = (a, exId, exclude) => a.items.filter((it) => it.exId === exId).flatMap((it) => it.done).filter((s) => s !== exclude);
const maxLoadOf = (sets) => sets.reduce((m, s) => (typeof s.load === 'number' && (m === null || s.load > m) ? s.load : m), null);
function detectPR(a, ex, s) {
  const prior = records(ex.id, sessionSets(a, ex.id, s));
  if (!prior) return null; // first time ever: nothing to beat yet
  const key = s.load ?? 'bw';
  if (typeof s.load === 'number' && prior.maxLoad !== null && s.load > prior.maxLoad) return { type: ex.load === 'level' ? 'level' : 'load', from: prior.maxLoad, to: s.load };
  if (s.reps != null && prior.repsAt[key] != null && s.reps > prior.repsAt[key]) return { type: 'reps', from: prior.repsAt[key], to: s.reps, at: s.load ?? null };
  if (s.secs != null && prior.secsAt[key] != null && s.secs > prior.secsAt[key]) return { type: 'time', from: prior.secsAt[key], to: s.secs, at: s.load ?? null };
  return null;
}
function prText(ex, p) {
  if (p.from == null) return 'New best';
  const at = p.at != null ? ` at ${loadText(ex, p.at)}` : '';
  if (p.type === 'load') return `${fmtNum(p.from)} → ${fmtNum(p.to)} ${unitLabel()}`;
  if (p.type === 'level') return `Level ${p.from} → ${p.to}`;
  if (p.type === 'reps') return `${p.from} → ${p.to} reps${at}`;
  return `${fmtSecs(p.from)} → ${fmtSecs(p.to)}${at}`;
}
// Live hint under the steppers: "PR attempt!" / "Up from 20 kg last time"
function prChip(a, it, ex) {
  const r = records(ex.id, sessionSets(a, ex.id));
  if (!r) return '';
  const cur = it.cur;
  if (typeof cur.load === 'number' && r.maxLoad !== null && cur.load > r.maxLoad) {
    return `<span class="chip warn pr-try">${icon('star', 'icon')} PR attempt! Your best is ${esc(loadText(ex, r.maxLoad))}</span>`;
  }
  const key = cur.load ?? 'bw';
  if (ex.mode === 'reps' && r.repsAt[key] != null && cur.reps > r.repsAt[key]) {
    return `<span class="chip warn pr-try">${icon('star', 'icon')} Rep record attempt! Best is ${r.repsAt[key]}${cur.load != null ? ' at ' + esc(loadText(ex, cur.load)) : ''}</span>`;
  }
  if (ex.mode === 'time' && r.secsAt[key] != null && cur.secs > r.secsAt[key]) {
    return `<span class="chip warn pr-try">${icon('star', 'icon')} Time record attempt! Best is ${fmtSecs(r.secsAt[key])}</span>`;
  }
  const last = lastPerformance(ex.id);
  const lm = last ? maxLoadOf(last.sets) : null;
  if (typeof cur.load === 'number' && lm !== null && cur.load > lm) {
    return `<span class="chip good">${icon('up', 'icon')} Up from ${esc(loadText(ex, lm))} last time</span>`;
  }
  return '';
}
const totals = (a) => ({ done: a.items.reduce((n, it) => n + it.done.length, 0), all: a.items.reduce((n, it) => n + it.sets, 0) });

function playerHeader(a) {
  return `<div class="ph">
    <button class="icon-btn" data-act="quit" aria-label="End workout">${icon('x')}</button>
    <div class="ph-title"><b>${esc(a.name)}</b><small id="elapsed">${fmtClock(Date.now() - a.started)}</small></div>
    <button class="icon-btn" data-act="music" aria-label="Music">${icon('music')}</button>
  </div>`;
}
function progressBar(a) {
  return `<div class="progress" aria-hidden="true">${a.items.map((it, i) => Array.from({ length: it.sets }, (_, k) => {
    const cls = k < it.done.length ? 'done' : i === a.idx && k === it.done.length ? 'now' : '';
    return `<i class="${cls}"></i>`;
  }).join('')).join('')}</div>`;
}

function playerView() {
  const a = state.active;
  if (a.phase === 'warmup') return warmupView(a);
  const it = a.items[a.idx]; const ex = getExercise(it.exId);
  const setNo = Math.min(it.done.length + 1, it.sets);
  const timing = a.phase === 'timing';
  const last = lastPerformance(ex.id);
  const dots = Array.from({ length: it.sets }, (_, k) => k < it.done.length ? `<i class="done">${icon('check')}</i>` : `<i class="${k === it.done.length ? 'now' : ''}">${k + 1}</i>`).join('');

  const steppers = [];
  if (ex.load !== 'none') steppers.push(stepper('load', ex.load === 'kg' ? fmtNum(it.cur.load) : it.cur.load, ex.load === 'kg' ? unitLabel() : 'level'));
  if (ex.mode === 'reps') steppers.push(stepper('reps', it.cur.reps, ex.perSide ? 'each side' : 'reps'));
  else steppers.push(stepper('secs', fmtSecs(it.cur.secs), 'time'));

  let cta;
  if (timing) {
    cta = `${ring('timer', it.cur.secs, it.cur.secs, 'hold it', 'small ok')}
      <button class="btn good lg block" data-act="setDone">${icon('check')} Done</button>`;
  } else if (ex.mode === 'time') {
    cta = `<button class="btn primary lg block" data-act="startTimer">${icon('play')} Start set ${setNo} · ${fmtSecs(it.cur.secs)}</button>
      <button class="btn ghost block" data-act="setDone" style="margin-top:4px">Log it without the timer</button>`;
  } else {
    cta = `<button class="btn primary lg block" data-act="setDone">${icon('check')} Complete set ${setNo}</button>`;
  }
  const hint = it.suggest && it.cur.load < it.suggest && !it.done.length
    ? `<div class="hint">${icon('bolt')}<div><b>Ready to level up?</b> You hit the top of the range on every set last time. Try ${fmtNum(it.suggest)} ${unitLabel()}.
       <button class="btn ghost" style="min-height:32px;padding:4px 8px;color:var(--gold)" data-act="useSuggest">Use ${fmtNum(it.suggest)} ${unitLabel()}</button></div></div>` : '';
  const left = a.items.length - a.idx - 1;
  return `<div class="player">
    ${playerHeader(a)}
    ${progressBar(a)}
    <section class="excard">
      <p class="eyebrow">Exercise ${a.idx + 1} of ${a.items.length}${left === 0 ? ' · last one!' : ''}</p>
      <h1>${esc(ex.name)}</h1>
      <div class="chips">${muscleChips(ex)}${equipChips(ex)}</div>
      <div class="figwrap" data-fig="${ex.id}"></div>
      <div class="setline">
        <div class="setdots" aria-label="Set ${setNo} of ${it.sets}">${dots}</div>
        <div class="target">${esc(ex.target ?? targetText(it, ex))}<small>Set ${setNo} of ${it.sets} · rest ${fmtSecs(it.rest)}</small></div>
      </div>
      ${timing ? '' : `<div class="steppers ${steppers.length === 1 ? 'one' : ''}">${steppers.join('')}</div>
        <div class="prchip" id="prChip">${prChip(a, it, ex)}</div>`}
      ${last && !timing ? `<p class="lastline">${icon('clock', 'icon')} Last time: <b>${esc(logLine(ex, last.sets))}</b></p>` : ''}
      ${timing ? '' : hint}
      <div class="cta">${cta}</div>
      <div class="mini-actions">
        <button class="btn ghost" data-act="addSet">${icon('plus')} Add a set</button>
        <button class="btn ghost" data-act="skipEx">${icon('skip')} Skip exercise</button>
      </div>
      <details class="fold howto" ${it.done.length === 0 && a.idx === 0 ? 'open' : ''}>
        <summary>How to do it</summary>
        <div class="fold-body">${howTo(ex)}</div>
      </details>
    </section>
  </div>`;
}

function stepper(k, val, label) {
  return `<div class="stepper">
    <button data-act="step" data-k="${k}" data-d="-1" aria-label="Less">−</button>
    <button class="val" data-act="typeVal" data-k="${k}" aria-label="Type a value"><b id="val-${k}">${esc(val)}</b><small>${esc(label)}</small></button>
    <button data-act="step" data-k="${k}" data-d="1" aria-label="More">+</button>
  </div>`;
}

function howTo(ex) {
  return `<dl>
    ${ex.setup ? `<div><dt>Setup</dt><dd>${esc(ex.setup)}</dd></div>` : ''}
    ${ex.do ? `<div><dt class="do">Do</dt><dd>${esc(ex.do)}</dd></div>` : ''}
    ${ex.avoid ? `<div><dt class="avoid">Avoid</dt><dd>${esc(ex.avoid)}</dd></div>` : ''}
    ${ex.tip ? `<div><dt class="tip">Tip</dt><dd>${esc(ex.tip)}</dd></div>` : ''}
  </dl>
  <div class="breathe" style="margin-top:12px">${icon('wind')}<span>${esc(BREATHING)} About 2 seconds up, 3 seconds down.</span></div>`;
}

function ring(id, left, total, label, cls = '') {
  const C = 2 * Math.PI * 52;
  const off = C * (1 - (total ? left / total : 0));
  return `<div class="ring ${cls}" id="${id}"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="52"/>
    <circle class="fg" cx="60" cy="60" r="52" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/></svg>
    <div class="center"><b class="num">${fmtClock(left * 1000)}</b><small>${esc(label)}</small></div></div>`;
}
function updateRing(id, left, total) {
  const r = document.getElementById(id); if (!r) return;
  const C = 2 * Math.PI * 52;
  r.querySelector('.fg').style.strokeDashoffset = (C * (1 - (total ? Math.max(0, left) / total : 0))).toFixed(1);
  r.querySelector('b').textContent = fmtClock(Math.max(0, Math.ceil(left)) * 1000);
}

function warmupView(a) {
  return `<div class="player">${playerHeader(a)}
    <p class="eyebrow">Before you start · 5 minutes</p>
    <h1 style="margin:4px 0 6px">Warm-up</h1>
    <p class="muted" style="margin-bottom:16px">Tick each one off as you go.</p>
    <ul class="checklist">${WARMUP.map((t, i) => `<li><button data-act="warm" data-i="${i}" aria-pressed="${!!a.warm[i]}"><span class="check">${icon('check')}</span><span>${esc(t)}</span></button></li>`).join('')}</ul>
    <div class="cta"><button class="btn primary lg block" data-act="warmDone">I'm warm. Let's go!</button></div>
    <button class="btn ghost block" data-act="warmDone" style="margin-top:4px">Skip the warm-up</button>
  </div>`;
}

let lastBeep = null;
function completeSet() {
  const a = state.active; const it = a.items[a.idx]; const ex = getExercise(it.exId);
  fx.unlockAudio();
  const { done: before, all } = totals(a);
  const s = { at: Date.now() };
  if (ex.load !== 'none') s.load = it.cur.load;
  if (ex.mode === 'time') {
    s.secs = a.phase === 'timing' ? Math.max(1, Math.round(it.cur.secs - Math.max(0, (a.timerEnd - Date.now()) / 1000))) : it.cur.secs;
  } else s.reps = it.cur.reps;
  it.done.push(s);

  a.prs ??= []; a.beat ??= [];
  const pr = detectPR(a, ex, s);
  let bonus = null; let lastMax = null;
  if (pr) { a.prs.push({ exId: ex.id, name: ex.name, ...pr }); bonus = 'pr'; }
  else if (typeof s.load === 'number') {
    const last = lastPerformance(ex.id);
    lastMax = last ? maxLoadOf(last.sets) : null;
    const prev = it.done.at(-2);
    if (lastMax !== null && s.load > lastMax && !a.beat.includes(ex.id)) { a.beat.push(ex.id); bonus = 'beat'; }
    else if (prev && typeof prev.load === 'number' && s.load > prev.load) bonus = 'step';
  }
  const after = before + 1;
  const crossedHalf = before < all / 2 && after >= all / 2 && after < all;
  const exDone = it.done.length >= it.sets;
  if (exDone && a.idx >= a.items.length - 1) { finishWorkout(); return; }

  let msg;
  if (exDone) {
    a.idx++;
    const finalNext = a.idx === a.items.length - 1;
    msg = {
      kind: 'exercise', title: fx.say('exercise', { name: ex.name }),
      sub: `${pl(it.done.length, 'set')} · ${logLine(ex, it.done)}`,
      tip: finalNext ? fx.say('finalEx') : crossedHalf ? fx.say('halfway') : 'Set up the next one and grab a sip of water.',
    };
    a.restTotal = state.settings.exRest;
  } else {
    msg = {
      kind: 'set', title: fx.say('set'),
      sub: `Set ${it.done.length} of ${it.sets} · ${describeSet(ex, s)}`,
      tip: it.done.length === it.sets - 1 ? fx.say('lastSet') : crossedHalf ? fx.say('halfway') : fx.say('setSub'),
    };
    a.restTotal = it.rest;
    if (ex.mode === 'reps') it.cur.reps = it.reps[1];
  }
  if (bonus === 'pr') {
    msg.pr = true;
    msg.title = fx.say({ load: 'prLoad', level: 'prLevel', reps: 'prReps', time: 'prTime' }[pr.type]);
    msg.sub = `${ex.name}: ${prText(ex, pr)}`;
    msg.tip = a.prs.length > 1 ? fx.say('prMore', { n: a.prs.length }) : exDone ? `${ex.name} done. What a way to finish it!` : 'Personal record. Remember this feeling!';
  } else if (bonus === 'beat') {
    msg.beat = true;
    msg.title = fx.say('beatLast');
    msg.sub = `${ex.name}: ${loadText(ex, s.load)}, up from ${loadText(ex, lastMax)} last time`;
  } else if (bonus === 'step') {
    msg.tip = fx.say('stepUp') + ' ' + msg.tip;
  }
  a.msg = msg;
  a.phase = 'rest'; a.restEnd = Date.now() + a.restTotal * 1000; lastBeep = null;
  save();
  if (bonus === 'pr') { fx.sound('pr'); fx.buzz([80, 50, 80, 50, 80, 50, 260]); fx.confetti(2.6); }
  else if (bonus === 'beat') { fx.sound('exercise'); fx.buzz([60, 40, 140]); fx.confetti(1.8); }
  else {
    fx.sound(exDone ? 'exercise' : 'set');
    fx.buzz(exDone ? [60, 40, 60, 40, 140] : 70);
    fx.confetti(exDone ? 1.6 : 0.7);
  }
  fx.speak(msg.title);
  render();
}

function finishWorkout() {
  const a = state.active;
  const exs = a.items.filter((it) => it.done.length).map((it) => ({ exId: it.exId, name: getExercise(it.exId).name, sets: it.done }));
  hideRest(); closeSheet(); fx.keepAwake(false);
  if (!exs.length) { state.active = null; save(); go('home'); toast('Workout ended. Nothing was logged.'); return; }
  let sets = 0; let volume = 0;
  exs.forEach((e) => e.sets.forEach((s) => { sets++; if (getExercise(e.exId).load === 'kg' && s.reps) volume += s.load * s.reps; }));
  const prs = a.prs ?? [];
  const prev = [...state.history].reverse().find((x) => x.workoutId === a.workoutId && x.name === a.name);
  const h = {
    id: uid(), workoutId: a.workoutId, name: a.name, started: a.started, ended: Date.now(),
    exercises: exs, prs, pbs: [...new Set(prs.map((p) => p.exId))], sets, volume, prevVolume: prev?.volume ?? null,
    msg: prs.length
      ? { title: fx.say('workoutPR'), sub: `${pl(prs.length, 'personal record')} broken today. Stronger than ever!` }
      : { title: fx.say('workout'), sub: fx.say('workoutSub') },
  };
  state.history.push(h); state.active = null; save();
  go('done/' + h.id);
  setTimeout(() => { fx.sound('workout'); fx.confetti(prs.length ? 3.4 : 2.6); fx.buzz([100, 60, 100, 60, 300]); fx.speak(h.msg.title); }, 150);
}

// ---------------------------------------------------------------- REST OVERLAY
function showRest() {
  const a = state.active;
  const m = a.msg || { kind: 'set', title: 'Nice work!', sub: '', tip: '' };
  const ready = a.phase === 'ready';
  const it = a.items[a.idx]; const ex = getExercise(it.exId);
  const setNo = it.done.length + 1;
  const isEx = m.kind === 'exercise';
  const left = Math.max(0, (a.restEnd - Date.now()) / 1000);
  const top = ready
    ? `<div class="go-word">${esc(a.goMsg || "Let's go!")}</div>
       <p class="praise-sub" style="font-size:18px">${isEx ? `Time for ${esc(ex.name)}` : `Set ${setNo} of ${it.sets} · ${esc(ex.name)}`}</p>`
    : `<div class="medal ${m.pb || m.pr ? 'gold big' : ''} ${isEx || m.beat ? 'big' : ''}">${icon(m.pb || m.pr ? 'star' : m.beat ? 'up' : isEx ? 'trophy' : 'check')}</div>
       ${m.pr ? `<div class="pr-banner">${icon('star', 'icon')} Personal record</div>` : m.beat ? '<div class="pr-banner beat">Progress</div>' : ''}
       <h2 class="praise">${esc(m.title)}</h2>
       <p class="praise-sub">${esc(m.sub)}</p>
       ${m.tip ? `<p class="tip">${esc(m.tip)}</p>` : ''}`;
  const middle = ready
    ? `<div class="figwrap rest-fig" data-fig="${ex.id}"></div>`
    : ring('restRing', Math.ceil(left), a.restTotal, 'rest');
  const ctrls = ready
    ? `<button class="btn primary lg block go-btn" data-act="go">${icon('play')} ${isEx ? 'Start ' + esc(ex.name) : 'Start set ' + setNo}</button>`
    : `<div class="rest-ctrls">
        <button class="btn" data-act="restAdd" data-s="-15">−15s</button>
        <button class="btn primary" data-act="go">${icon('skip')} Skip rest</button>
        <button class="btn" data-act="restAdd" data-s="15">+15s</button></div>`;
  const upnext = `<div class="upnext">
      <div class="thumb" data-fig="${ex.id}" ${isEx && !ready ? '' : 'data-static'}></div>
      <div class="grow"><p class="eyebrow">Up next</p><h3>${esc(ex.name)}</h3>
      <p class="small muted">Set ${setNo} of ${it.sets} · ${esc(ex.target ?? targetText(it, ex))}${loadText(ex, it.cur.load) ? ' · ' + esc(loadText(ex, it.cur.load)) : ''}</p></div></div>`;
  clearFigs(overlayFigs);
  const { done, all } = totals(a);
  overlay.innerHTML = `<div class="rest ${ready ? 'ready' : m.pr ? 'pr' : ''}" role="dialog" aria-label="Rest">
    <div class="rest-top">${progressBar(a)}<p class="small muted rest-count">${done} of ${all} sets done</p>${top}</div>${middle}
    <div class="rest-bottom">${ctrls}${upnext}</div></div>`;
  overlay.hidden = false;
  overlay.dataset.kind = 'rest';
  mountFigures(overlay, overlayFigs);
}
function hideRest() {
  if (overlay.dataset.kind === 'rest') { clearFigs(overlayFigs); overlay.innerHTML = ''; overlay.hidden = true; overlay.dataset.kind = ''; }
}
function showSheet(html) {
  clearFigs(overlayFigs);
  overlay.innerHTML = `<div class="sheet-bg" data-act="closeSheet"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  overlay.hidden = false; overlay.dataset.kind = 'sheet';
}
function closeSheet() {
  if (overlay.dataset.kind === 'sheet') { overlay.innerHTML = ''; overlay.hidden = true; overlay.dataset.kind = ''; }
}

// Runs 4× a second: elapsed clock, rest countdown, timed holds.
function tick() {
  const a = state.active;
  if (!a || route().name !== 'play') return;
  const el = $('#elapsed'); if (el) el.textContent = fmtClock(Date.now() - a.started);
  if (a.phase === 'rest') {
    const left = (a.restEnd - Date.now()) / 1000;
    updateRing('restRing', left, a.restTotal);
    const whole = Math.ceil(left);
    if (whole <= 3 && whole > 0 && whole !== lastBeep) { lastBeep = whole; fx.sound('tick'); fx.buzz(30); }
    if (left <= 0) {
      a.phase = 'ready'; a.goMsg = fx.say('go'); save();
      fx.sound('go'); fx.buzz([180, 90, 180]); fx.speak(a.goMsg);
      showRest();
    }
  } else if (a.phase === 'timing') {
    const it = a.items[a.idx];
    const left = (a.timerEnd - Date.now()) / 1000;
    updateRing('timer', left, it.cur.secs);
    const whole = Math.ceil(left);
    if (whole <= 3 && whole > 0 && whole !== lastBeep) { lastBeep = whole; fx.sound('tick'); fx.buzz(30); }
    if (left <= 0) completeSet();
  }
}
setInterval(tick, 250);

// ---------------------------------------------------------------- SUMMARY
function summaryView(id) {
  const h = state.history.find((x) => x.id === id);
  if (!h) return '<p>Workout not found.</p><a class="btn" href="#/home">Home</a>';
  const mins = Math.max(1, Math.round((h.ended - h.started) / 60000));
  const wc = thisWeekCount(); const goal = state.settings.weeklyGoal;
  const dots = Array.from({ length: Math.max(goal, wc) }, (_, i) => `<i class="${i < wc ? 'on' : ''}"></i>`).join('');
  return `
    <div class="trophy"><div class="cup">${icon('trophy')}</div><h1>${esc(h.msg?.title ?? 'Workout complete!')}</h1>
      <p class="muted" style="margin-top:6px">${esc(h.msg?.sub ?? '')}</p></div>
    <div class="tiles section" style="margin-top:16px">
      <div class="tile"><b>${mins} min</b><span>Time</span></div>
      <div class="tile"><b>${h.sets}</b><span>Sets completed</span></div>
      <div class="tile"><b>${h.volume ? Math.round(h.volume).toLocaleString() + ' ' + unitLabel() : h.exercises.length}</b><span>${h.volume ? 'Total weight moved' : 'Exercises'}</span>
        ${h.volume && h.prevVolume && h.volume > h.prevVolume ? `<span class="chip good" style="margin-top:6px">${icon('up', 'icon')} +${Math.round(h.volume - h.prevVolume).toLocaleString()} ${unitLabel()} vs last time</span>` : ''}</div>
      <div class="tile"><b>${prsOf(h).length}${prsOf(h).length ? ' ' + icon('star', 'icon') : ''}</b><span>Personal records</span></div>
    </div>
    ${prsOf(h).length ? `<div class="card section pr-card"><div class="pr-banner">${icon('star', 'icon')} ${pl(prsOf(h).length, 'new record')}</div>
      <ul class="log">${prsOf(h).map((p) => `<li><span>${esc(p.name)}</span><span><b>${esc(prText(getExercise(p.exId), p))}</b></span></li>`).join('')}</ul></div>` : ''}
    <div class="card section" style="text-align:center">
      <div class="week-dots" style="gap:8px">${dots.replace(/<i/g, '<i style="width:16px;height:16px"')}</div>
      <h3 style="margin-top:8px">${wc >= goal ? 'Weekly goal smashed!' : `${wc} of ${goal} this week`}</h3>
      <p class="small muted">${wc >= goal ? 'Rest up and recover. You earned it.' : `${pl(goal - wc, 'more workout')} to hit your weekly goal.`}${weekStreak() > 1 ? ` ${weekStreak()}-week streak going!` : ''}</p>
    </div>
    <div class="card section"><h3 style="margin-bottom:6px">Your log</h3>${logList(h)}</div>
    <div class="section"><a class="btn primary lg block" href="#/home">Done</a></div>`;
}
function logList(h) {
  const prIds = new Set(prsOf(h).map((p) => p.exId));
  return `<ul class="log">${h.exercises.map((e) => {
    const ex = getExercise(e.exId);
    return `<li><span>${esc(e.name)}${prIds.has(e.exId) ? ' <span class="chip warn">PR</span>' : ''}</span><span>${esc(logLine(ex, e.sets))}</span></li>`;
  }).join('')}</ul>`;
}

// ---------------------------------------------------------------- HISTORY
function historyView() {
  const hs = [...state.history].reverse();
  const totalSets = state.history.reduce((n, h) => n + h.sets, 0);
  return `<div class="topbar"><h1>History</h1></div>
    <div class="tiles">
      <div class="tile"><b>${state.history.length}</b><span>Workouts</span></div>
      <div class="tile"><b>${weekStreak()}</b><span>Week streak</span></div>
      <div class="tile"><b>${thisWeekCount()}</b><span>This week</span></div>
      <div class="tile"><b>${totalPRs()}${totalPRs() ? ' ' + icon('star', 'icon') : ''}</b><span>Records broken</span></div>
    </div>
    ${recordsFold()}
    <p class="small muted" style="margin-top:20px">Tap a workout to see what you did. Tap ${icon('repeat', 'icon')} to do it again, with the option to raise the weights first.</p>
    <div class="section stack" style="margin-top:10px">
      ${hs.length ? hs.map((h) => `<details class="fold"><summary><div style="flex:1;min-width:0"><div>${esc(h.name)}</div>
          <div class="small muted" style="font-weight:500">${fmtDate(h.ended)} · ${Math.max(1, Math.round((h.ended - h.started) / 60000))} min · ${pl(h.sets, 'set')}${prsOf(h).length ? ` · <span style="color:var(--gold);font-weight:700">${pl(prsOf(h).length, 'PR')}</span>` : ''}</div></div>
          <a class="icon-btn" href="#/repeat/${h.id}" data-act="repeat" data-id="${h.id}" aria-label="Repeat ${esc(h.name)}">${icon('repeat')}</a></summary>
          <div class="fold-body">${logList(h)}
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
              <a class="btn primary" href="#/repeat/${h.id}">${icon('repeat')} Repeat this workout</a>
              <button class="btn ghost danger" data-act="delHistory" data-id="${h.id}">${icon('trash')} Delete</button></div></div></details>`).join('')
        : `<div class="card" style="text-align:center;padding:32px 16px"><h3>No workouts yet</h3><p class="muted small" style="margin-top:6px">Finish your first workout and it will show up here, logged like “20 × 12, 12”.</p></div>`}
    </div>`;
}

function recordsFold() {
  const recs = allRecords().map((r) => ({ ...r, ex: getExercise(r.exId) })).sort((x, y) => x.ex.name.localeCompare(y.ex.name));
  if (!recs.length) return '';
  const txt = (r) => {
    if (r.load != null) return loadText(r.ex, r.load) + (r.reps != null ? ` × ${r.reps}` : r.secs != null ? ` · ${fmtSecs(r.secs)}` : '');
    if (r.reps != null) return `${r.reps} ${r.ex.perSide ? 'each side' : 'reps'}`;
    return r.secs != null ? fmtSecs(r.secs) : '—';
  };
  return `<details class="fold section"><summary>${icon('trophy')} Personal records</summary><div class="fold-body">
    <ul class="log">${recs.map((r) => `<li><span>${esc(r.ex.name)}<br><span class="small muted">${fmtDate(r.date)}</span></span><span><b>${esc(txt(r))}</b></span></li>`).join('')}</ul></div></details>`;
}

// ---------------------------------------------------------------- REPEAT A PAST WORKOUT
let rep = null;
function ensureRep(hid) {
  if (rep?.hid === hid) return rep;
  const h = state.history.find((x) => x.id === hid);
  if (!h) { rep = null; return null; }
  const w = state.workouts.find((x) => x.id === h.workoutId);
  rep = {
    hid, workoutId: h.workoutId, name: h.name, date: h.ended,
    items: h.exercises.map((e) => {
      const ex = getExercise(e.exId);
      const tpl = w?.items.find((i) => i.exId === e.exId) ?? itemFromExercise(ex);
      const it = { ...structuredClone(tpl), sets: e.sets.length };
      if (ex.mode === 'time') it.secs = Math.max(...e.sets.map((s) => s.secs ?? 0)) || tpl.secs;
      it.load = ex.load === 'none' ? null : maxLoadOf(e.sets) ?? tpl.load;
      return { it, orig: it.load, origSecs: it.secs, sets: e.sets };
    }),
  };
  return rep;
}
function repeatView(hid) {
  const r = ensureRep(hid);
  if (!r) return '<p>Workout not found.</p><a class="btn" href="#/history">Back</a>';
  const anyLoad = r.items.some((x) => getExercise(x.it.exId).load !== 'none');
  return `<div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button><h2>Repeat workout</h2></div>
    <div class="card">
      <p class="eyebrow">From ${fmtDate(r.date)}</p>
      <h2 style="margin:4px 0">${esc(r.name)}</h2>
      <p class="small muted">Same exercises in the same order. Bump the weights up to chase new records, or keep them as they were.</p>
      ${anyLoad ? `<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <button class="btn good" data-act="repAll" data-d="1">${icon('up')} Level up everything</button>
        <button class="btn ghost" data-act="repAll" data-d="0">Reset</button></div>` : ''}
    </div>
    <ul class="items section">${r.items.map(repRow).join('')}</ul>
    <div class="sticky-foot"><button class="btn primary lg block" data-act="repStart">${icon('play')} Start workout</button></div>`;
}
function repRow(x, i) {
  const { it } = x; const ex = getExercise(it.exId);
  const st = (k, val, label) => `<label><span>${label}</span><div class="stepper sm">
      <button data-act="repStep" data-i="${i}" data-k="${k}" data-d="-1" aria-label="Less ${label}">−</button>
      <div class="val"><b>${esc(val)}</b></div>
      <button data-act="repStep" data-i="${i}" data-k="${k}" data-d="1" aria-label="More ${label}">+</button></div></label>`;
  const rec = records(ex.id);
  let chip = '';
  if (typeof it.load === 'number' && rec?.maxLoad != null && it.load > rec.maxLoad) chip = `<span class="chip warn">${icon('star', 'icon')} PR attempt</span>`;
  else if (typeof it.load === 'number' && x.orig != null && it.load > x.orig) chip = `<span class="chip good">${icon('up', 'icon')} +${ex.load === 'kg' ? fmtNum(it.load - x.orig) + ' ' + unitLabel() : it.load - x.orig + ' level' + (it.load - x.orig > 1 ? 's' : '')}</span>`;
  else if (ex.mode === 'time' && it.secs > x.origSecs) chip = `<span class="chip good">${icon('up', 'icon')} +${fmtSecs(it.secs - x.origSecs)}</span>`;
  return `<li class="item"><div class="item-head" style="padding-left:10px">
      <div class="thumb" data-fig="${ex.id}" data-static></div>
      <div class="grow"><h3>${i + 1}. ${esc(ex.name)}</h3><p class="small muted">Last: ${esc(logLine(ex, x.sets))}</p></div></div>
    <div class="item-edit" style="border-top:0;padding-top:0">
      <div class="grid2">
        ${ex.load !== 'none' ? st('load', ex.load === 'kg' ? fmtNum(it.load ?? 0) + ' ' + unitLabel() : 'Level ' + it.load, ex.load === 'kg' ? 'Weight' : 'Resistance') : ''}
        ${ex.mode === 'time' ? st('secs', fmtSecs(it.secs), 'Time') : ''}
        ${st('sets', it.sets, 'Sets')}
      </div>
      ${chip ? `<div>${chip}</div>` : ''}
    </div></li>`;
}

// ---------------------------------------------------------------- LIBRARY & PICKER
const filt = { q: '', m: 'All', mine: true };
let picked = [];
function filtered() {
  const q = filt.q.trim().toLowerCase();
  return allExercises().filter((ex) => (filt.m === 'All' || ex.muscles.includes(filt.m))
    && (!filt.mine || hasEquipment(ex))
    && (!q || (ex.name + ' ' + ex.muscles.join(' ')).toLowerCase().includes(q)));
}
function filterBar() {
  return `<div class="search">${icon('search')}<input type="search" id="q" placeholder="Search exercises" value="${esc(filt.q)}" autocomplete="off"></div>
    <div class="filter-chips" role="group" aria-label="Body area">${['All', ...MUSCLES].map((m) => `<button data-act="filterM" data-m="${m}" aria-pressed="${filt.m === m}">${m}</button>`).join('')}</div>
    <div class="row" style="padding:6px 0"><span class="grow small muted">Only exercises for my equipment</span>
      <label class="switch"><input type="checkbox" data-change="mine" ${filt.mine ? 'checked' : ''} aria-label="Only my equipment"><i></i></label></div>`;
}
function exRows(pick) {
  const list = filtered();
  if (!list.length) return `<p class="muted" style="text-align:center;padding:24px">No exercises match. Try another filter${filt.mine ? ' or switch off “only my equipment”' : ''}.</p>`;
  return list.map((ex) => {
    const inner = `<div class="thumb" data-fig="${ex.id}" data-static></div>
      <div class="grow"><h3>${esc(ex.name)}</h3><div class="chips">${muscleChips(ex, 2)}${equipChips(ex)}</div></div>`;
    return pick
      ? `<button class="exrow ${hasEquipment(ex) ? '' : 'missing'}" data-act="pickToggle" data-id="${ex.id}" aria-pressed="${picked.includes(ex.id)}">${inner}<span class="check">${icon('check')}</span></button>`
      : `<a class="exrow ${hasEquipment(ex) ? '' : 'missing'}" href="#/ex/${ex.id}">${inner}${icon('chev')}</a>`;
  }).join('');
}
function refreshList(pick) {
  const box = $('#exlist'); if (!box) return;
  clearFigs(viewFigs);
  box.innerHTML = exRows(pick);
  mountFigures(view, viewFigs);
}
function libraryView() {
  return `<div class="topbar"><h1>Exercises</h1><a class="btn ghost" href="#/newex">${icon('plus')} Create</a></div>
    ${filterBar()}<div class="exlist" id="exlist">${exRows(false)}</div>`;
}
function pickerView() {
  if (!draft) { setTimeout(() => go('home')); return ''; }
  return `<div class="topbar"><button class="icon-btn" data-act="pickBack" aria-label="Back">${icon('back')}</button><h2>Add exercises</h2></div>
    ${filterBar()}<div class="exlist" id="exlist">${exRows(true)}</div>
    <div class="sticky-foot"><button class="btn primary lg block" id="pickAdd" data-act="pickAdd" ${picked.length ? '' : 'disabled'}>${pickLabel()}</button></div>`;
}
const pickLabel = () => (picked.length ? `Add ${pl(picked.length, 'exercise')}` : 'Tap exercises to select');

function exerciseView(id) {
  const ex = getExercise(id);
  const best = bestLoad(id); const last = lastPerformance(id);
  const it = itemFromExercise(ex);
  return `<div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button><h2>${esc(ex.name)}</h2></div>
    <div class="figwrap" data-fig="${ex.id}"></div>
    <p class="small muted" style="text-align:center;margin-top:6px">Tap the picture to pause</p>
    <div class="chips" style="margin-top:12px">${muscleChips(ex, 4)}${equipChips(ex)}</div>
    <div class="tiles section" style="margin-top:14px">
      <div class="tile"><b style="font-size:18px">${esc(ex.target ?? `${it.sets} × ${targetText(it, ex)}`)}</b><span>Suggested</span></div>
      <div class="tile"><b style="font-size:18px">${best != null ? esc(loadText(ex, best)) : last ? esc(logLine(ex, last.sets)) : '—'}</b><span>${best != null ? 'Your best' : 'Last time'}</span></div>
    </div>
    <div class="card section howto">${howTo(ex)}</div>
    ${ex.custom ? `<div class="section"><button class="btn ghost danger" data-act="delCustom" data-id="${ex.id}">${icon('trash')} Delete this exercise</button></div>` : ''}`;
}

function customExView() {
  return `<div class="topbar"><button class="icon-btn" data-act="back" aria-label="Back">${icon('back')}</button><h2>New exercise</h2></div>
    <form id="cx" class="stack">
      <label class="field"><span>Name</span><input type="text" name="name" required placeholder="e.g. Cable crunch"></label>
      <label class="field"><span>Main body area</span><select name="muscle">${MUSCLES.map((m) => `<option>${m}</option>`).join('')}</select></label>
      <label class="field"><span>Equipment</span><select name="equip"><option value="">Bodyweight / none</option>${EQUIPMENT.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Counted in</span><select name="mode"><option value="reps">Reps</option><option value="time">Time</option></select></label>
      <label class="field"><span>Track</span><select name="load"><option value="kg">Weight (${unitLabel()})</option><option value="level">Resistance level</option><option value="none">Nothing (bodyweight)</option></select></label>
      <div class="row"><span class="grow">Reps are per side</span><label class="switch"><input type="checkbox" name="perSide"><i></i></label></div>
      <label class="field"><span>Setup</span><textarea name="setup" placeholder="How to get into position"></textarea></label>
      <label class="field"><span>Do</span><textarea name="do" placeholder="The movement itself"></textarea></label>
      <label class="field"><span>Avoid</span><textarea name="avoid" placeholder="Common mistakes"></textarea></label>
      <button class="btn primary lg block" type="submit">Save exercise</button>
    </form>`;
}

// ---------------------------------------------------------------- BUILDER
let draft = null;
const openItems = new Set();
function ensureDraft(id) {
  if (draft && (draft.id === id || (id === 'new' && draft.isNew))) return;
  openItems.clear();
  if (id === 'new') draft = { id: uid(), isNew: true, name: '', desc: '', group: 'My workouts', items: [] };
  else { const w = state.workouts.find((x) => x.id === id); draft = w ? structuredClone(w) : null; }
}
function builderView(id) {
  ensureDraft(id);
  if (!draft) return '<p>Workout not found.</p><a class="btn" href="#/home">Home</a>';
  return `<div class="topbar"><button class="icon-btn" data-act="cancelEdit" aria-label="Cancel">${icon('back')}</button>
      <h2>${draft.isNew ? 'New workout' : 'Edit workout'}</h2>
      <button class="btn primary" data-act="saveWorkout">Save</button></div>
    <div class="stack">
      <label class="field"><span>Name</span><input type="text" data-bind="name" value="${esc(draft.name)}" placeholder="e.g. Monday upper body"></label>
      <label class="field"><span>Notes (optional)</span><input type="text" data-bind="desc" value="${esc(draft.desc)}" placeholder="What is this workout for?"></label>
    </div>
    <div class="section"><div class="section-head"><h3>Exercises (${draft.items.length})</h3>${draft.items.length > 1 ? `<span class="small muted">Drag ${icon('grip', 'icon')} to reorder</span>` : ''}</div>
      <ul class="items" id="items">${draft.items.map(itemRow).join('')}</ul>
      <a class="btn block" href="#/pick" style="margin-top:12px">${icon('plus')} Add exercises</a>
    </div>
    ${draft.isNew ? '' : `<div class="section"><button class="btn ghost danger" data-act="delWorkout">${icon('trash')} Delete workout</button></div>`}`;
}
function itemRow(it, i) {
  const ex = getExercise(it.exId);
  const open = openItems.has(i);
  const st = (k, val, label) => `<label><span>${label}</span><div class="stepper sm">
      <button data-act="itemStep" data-i="${i}" data-k="${k}" data-d="-1" aria-label="Less ${label}">−</button>
      <div class="val"><b>${esc(val)}</b></div>
      <button data-act="itemStep" data-i="${i}" data-k="${k}" data-d="1" aria-label="More ${label}">+</button></div></label>`;
  const edit = open ? `<div class="item-edit">
      <div class="grid2">
        ${st('sets', it.sets, 'Sets')}
        ${st('rest', fmtSecs(it.rest), 'Rest between sets')}
        ${ex.mode === 'time' ? st('secs', fmtSecs(it.secs), 'Time per set') : st('rmin', it.reps[0], 'Reps (min)') + st('rmax', it.reps[1], 'Reps (max)')}
        ${ex.load !== 'none' ? st('load', it.load == null ? 'Auto' : ex.load === 'kg' ? fmtNum(it.load) + ' ' + unitLabel() : 'Level ' + it.load, ex.load === 'kg' ? 'Starting weight' : 'Resistance') : ''}
      </div>
      <div class="acts">
        <button class="btn" data-act="moveItem" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''}>${icon('up')} Up</button>
        <button class="btn" data-act="moveItem" data-i="${i}" data-d="1" ${i === draft.items.length - 1 ? 'disabled' : ''}>${icon('dn')} Down</button>
        <button class="btn ghost danger" data-act="removeItem" data-i="${i}">${icon('trash')} Remove</button>
      </div></div>` : '';
  return `<li class="item" data-i="${i}">
    <div class="item-head">
      <span class="handle" aria-label="Drag to reorder">${icon('grip')}</span>
      <div class="thumb" data-fig="${ex.id}" data-static></div>
      <div class="grow"><h3>${i + 1}. ${esc(ex.name)}</h3><p class="small muted">${esc(itemSummary(it, ex))}</p></div>
      <button class="icon-btn flat" data-act="toggleItem" data-i="${i}" aria-expanded="${open}" aria-label="Edit sets and reps">${icon(open ? 'down' : 'edit')}</button>
    </div>${edit}</li>`;
}

// Drag to reorder (pointer events: works with touch and mouse)
let drag = null;
document.addEventListener('pointerdown', (e) => {
  const h = e.target.closest('.handle'); if (!h) return;
  const li = h.closest('.item');
  e.preventDefault();
  drag = { li, list: li.parentNode, id: e.pointerId };
  h.setPointerCapture(e.pointerId);
  li.classList.add('dragging');
});
document.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const sibs = [...drag.list.children].filter((x) => x !== drag.li);
  const after = sibs.find((s) => { const r = s.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
  if (after) { if (drag.li.nextSibling !== after) drag.list.insertBefore(drag.li, after); } else if (drag.list.lastChild !== drag.li) drag.list.appendChild(drag.li);
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const order = [...drag.list.children].map((x) => +x.dataset.i);
  drag.li.classList.remove('dragging');
  drag = null;
  if (order.some((v, i) => v !== i)) {
    draft.items = order.map((i) => draft.items[i]);
    openItems.clear();
    render();
  }
};
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);

// ---------------------------------------------------------------- SETTINGS
function settingsView() {
  const s = state.settings;
  const sw = (key, label, desc) => `<div class="row"><div class="grow"><div>${label}</div>${desc ? `<div class="small muted">${desc}</div>` : ''}</div>
    <label class="switch"><input type="checkbox" data-change="setting" data-key="${key}" ${s[key] ? 'checked' : ''} aria-label="${esc(label)}"><i></i></label></div>`;
  const num = (key, label, val, desc) => `<div class="row"><div class="grow"><div>${label}</div>${desc ? `<div class="small muted">${desc}</div>` : ''}</div>
    <div class="stepper sm" style="width:150px"><button data-act="setNum" data-key="${key}" data-d="-1" aria-label="Less">−</button><div class="val"><b>${val}</b></div><button data-act="setNum" data-key="${key}" data-d="1" aria-label="More">+</button></div></div>`;
  const connected = spotify.isConnected();
  return `<div class="topbar"><h1>Settings</h1></div>
    <div class="section-head"><h2>Your equipment</h2></div>
    <div class="card" style="padding-top:4px;padding-bottom:4px">${EQUIPMENT.map((e) => `<div class="row"><div class="grow"><div>${esc(e.name)}</div><div class="small muted">${esc(e.note)}</div></div>
      <label class="switch"><input type="checkbox" data-change="equip" value="${e.id}" ${s.equipment.includes(e.id) ? 'checked' : ''} aria-label="${esc(e.name)}"><i></i></label></div>`).join('')}</div>
    <p class="small muted" style="margin-top:8px">Bodyweight exercises are always available.</p>

    <div class="section"><div class="section-head"><h2>Workouts</h2></div>
    <div class="card" style="padding-top:4px;padding-bottom:4px">
      ${num('step', 'Weight step', fmtNum(s.step) + ' ' + s.unit, 'How much + and − change the weight')}
      ${num('exRest', 'Rest between exercises', fmtSecs(s.exRest), 'Time to re-pin and set up')}
      ${num('weeklyGoal', 'Weekly goal', s.weeklyGoal, 'Workouts per week')}
      ${sw('warmup', 'Warm-up checklist', 'Show the 5-minute warm-up before each workout')}
    </div></div>

    <div class="section"><div class="section-head"><h2>Cheering</h2></div>
    <div class="card" style="padding-top:4px;padding-bottom:4px">
      ${sw('sound', 'Sounds', 'Chimes for finished sets and the rest countdown')}
      ${sw('vibrate', 'Vibration', 'Buzz when rest is over (Android)')}
      ${sw('voice', 'Voice cheers', 'Reads the praise out loud')}
      ${sw('wakeLock', 'Keep screen on', 'During a workout')}
      <div class="row"><button class="btn" data-act="testCheer">${icon('star')} Try a cheer</button></div>
    </div></div>

    <div class="section"><div class="section-head"><h2>Music</h2></div>
    <div class="card stack">
      <label class="field"><span>Spotify playlist or album link</span>
        <input type="url" id="spPlaylist" value="${esc(s.spotify.playlist)}" placeholder="https://open.spotify.com/playlist/…" inputmode="url"></label>
      <button class="btn primary" data-act="savePlaylist">Save playlist</button>
      <p class="small muted">A Spotify player sits at the bottom of the workout screen, so you don't need to switch apps. You get full songs when you're logged in to Spotify in this browser, and 30-second previews otherwise. In Spotify, use Share → Copy link to get the link.</p>
      <details class="fold" style="box-shadow:none;background:var(--surface-2)">
        <summary>${icon('music')} Control the Spotify app instead (Premium)</summary>
        <div class="fold-body stack small">
          <p>Shows the song playing in your Spotify app with play, pause and skip buttons on the workout screen. One-time setup:</p>
          <ol style="margin:0;padding-left:20px;display:grid;gap:6px">
            <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">developer.spotify.com/dashboard</a>, log in and create an app. Tick “Web API”.</li>
            <li>Add this Redirect URI to the app:<br><code style="word-break:break-all">${esc(spotify.redirectUri())}</code>
              <button class="btn ghost" style="min-height:32px;padding:4px 8px" data-act="copyRedirect">Copy</button></li>
            <li>Copy the app's Client ID and paste it below.</li>
          </ol>
          <label class="field"><span>Client ID</span><input type="text" id="spClient" value="${esc(s.spotify.clientId)}" autocomplete="off" spellcheck="false"></label>
          ${connected
            ? `<p style="color:var(--good);font-weight:700">${icon('check')} Connected</p><button class="btn" data-act="spDisconnect">Disconnect</button>`
            : `<button class="btn primary" data-act="spConnect">Connect Spotify</button>`}
        </div>
      </details>
    </div></div>

    <div class="section"><div class="section-head"><h2>Your data</h2></div>
    <div class="card stack">
      <p class="small muted">Everything is saved on this device only. Export a backup to move it to another phone.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" data-act="export">Export backup</button>
        <label class="btn" style="cursor:pointer">Import backup<input type="file" accept="application/json" data-change="import" hidden></label>
      </div>
      <button class="btn" data-act="restoreStarters">Restore starter workouts</button>
      <button class="btn ghost danger" data-act="resetAll">Erase everything</button>
    </div></div>

    <div class="section"><details class="fold"><summary>Stop signs</summary><div class="fold-body small">
      <p>Stop if you feel dizzy, light-headed, shaky, cold and sweaty, nauseous, chest pain, or unusual pain in your stomach. Sit down, sip some water, and contact your medical team if it doesn't settle.</p>
      <p style="margin-top:8px">A dull ache in the muscles a day or two after training is normal. Sharp pain, pain shooting down a leg, or numbness is not. Stop and get it checked.</p>
    </div></details></div>
    <p class="small muted" style="text-align:center;margin-top:24px">RepUp · made for your home gym</p>`;
}

// ---------------------------------------------------------------- MUSIC DOCK
const ms = { key: null, tall: false, np: null, err: '' };
function musicMode() {
  if (spotify.isConnected()) return 'remote';
  if (spotify.embedUrl(state.settings.spotify.playlist)) return 'embed';
  return null;
}
function updateMusicDock() {
  const mode = musicMode();
  const show = !!mode && route().name === 'play';
  document.body.classList.toggle('has-music', show);
  if (!mode) { music.hidden = true; music.innerHTML = ''; ms.key = null; return; }
  const key = mode === 'embed' ? spotify.embedUrl(state.settings.spotify.playlist) : 'remote';
  if (ms.key !== key) {
    ms.key = key;
    music.innerHTML = mode === 'embed'
      ? `<iframe id="spEmbed" src="${esc(key)}" height="${ms.tall ? 352 : 80}" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe>`
      : '<div class="remote" id="remote"></div>';
    if (mode === 'remote') { renderRemote(); refreshRemote(); }
  }
  music.hidden = false;
  // Keep the player alive (so music keeps going) but out of sight on other screens.
  music.classList.toggle('offscreen', !show);
}
async function refreshRemote() {
  try { ms.np = await spotify.nowPlaying(); ms.err = ''; } catch (e) { ms.err = spotify.friendlyError(e); }
  renderRemote();
}
function renderRemote() {
  const r = $('#remote'); if (!r) return;
  const np = ms.np;
  r.innerHTML = `${np?.art ? `<img src="${esc(np.art)}" alt="">` : `<div class="art">${icon('music')}</div>`}
    <div class="grow"><b>${esc(np?.title ?? (np?.idle ? 'Nothing playing' : 'Spotify'))}</b>
      <small>${esc(ms.err || np?.artist || (np?.idle ? 'Tap play to start your playlist' : 'Connecting…'))}</small></div>
    <button class="ctl" data-act="sp" data-c="prev" aria-label="Previous song">${icon('prev')}</button>
    <button class="ctl main" data-act="sp" data-c="${np?.playing ? 'pause' : 'play'}" aria-label="${np?.playing ? 'Pause' : 'Play'}">${icon(np?.playing ? 'pause' : 'play')}</button>
    <button class="ctl" data-act="sp" data-c="next" aria-label="Next song">${icon('next')}</button>`;
}
setInterval(() => {
  if (musicMode() === 'remote' && route().name === 'play' && !document.hidden) refreshRemote();
}, 5000);

// ---------------------------------------------------------------- ACTIONS
const A = {
  start: (el) => startWorkout(el.dataset.id),
  resume: () => go('play'),
  repeat: (el) => go('repeat/' + el.dataset.id),
  repStep: (el) => {
    const x = rep.items[+el.dataset.i]; const it = x.it; const ex = getExercise(it.exId); const d = +el.dataset.d;
    if (el.dataset.k === 'load') {
      if (ex.load === 'kg') it.load = Math.max(0, Math.round(((it.load ?? 0) + d * state.settings.step) * 100) / 100);
      else it.load = Math.min(30, Math.max(1, (it.load ?? 5) + d));
      const rec = records(ex.id);
      if (d > 0 && rec?.maxLoad != null && it.load > rec.maxLoad) { fx.unlockAudio(); fx.sound('check'); fx.buzz(20); }
    }
    if (el.dataset.k === 'sets') it.sets = Math.min(10, Math.max(1, it.sets + d));
    if (el.dataset.k === 'secs') it.secs = Math.max(5, it.secs + d * (it.secs >= 120 ? 30 : 5));
    render();
  },
  repAll: (el) => {
    const up = el.dataset.d === '1';
    rep.items.forEach((x) => {
      const ex = getExercise(x.it.exId);
      if (ex.load === 'none') return;
      if (!up) { x.it.load = x.orig; return; }
      x.it.load = ex.load === 'kg' ? Math.round(((x.it.load ?? 0) + state.settings.step) * 100) / 100 : Math.min(30, (x.it.load ?? 5) + 1);
    });
    if (up) { fx.unlockAudio(); fx.sound('check'); toast('Everything up a notch. Records incoming!'); }
    render();
  },
  repStart: () => {
    const r = rep; rep = null;
    startSession({ workoutId: r.workoutId, name: r.name, items: r.items.map((x) => x.it) }, true);
  },
  back: () => (history.length > 1 ? history.back() : go('home')),

  // player
  setDone: () => completeSet(),
  startTimer: () => {
    const a = state.active; const it = a.items[a.idx];
    fx.unlockAudio(); fx.sound('go');
    a.phase = 'timing'; a.timerEnd = Date.now() + it.cur.secs * 1000; lastBeep = null;
    save(); render();
  },
  step: (el) => {
    const a = state.active; const it = a.items[a.idx]; const ex = getExercise(it.exId);
    const d = +el.dataset.d; const k = el.dataset.k;
    if (k === 'load') {
      const inc = ex.load === 'kg' ? state.settings.step : 1;
      it.cur.load = Math.max(0, Math.round((it.cur.load + d * inc) * 100) / 100);
      $('#val-load').textContent = ex.load === 'kg' ? fmtNum(it.cur.load) : it.cur.load;
    } else if (k === 'reps') {
      it.cur.reps = Math.max(0, it.cur.reps + d);
      $('#val-reps').textContent = it.cur.reps;
    } else if (k === 'secs') {
      it.cur.secs = Math.max(5, it.cur.secs + d * (it.cur.secs >= 120 ? 30 : 5));
      render();
      return;
    }
    fx.buzz(8); save();
    const pc = $('#prChip'); if (pc) pc.innerHTML = prChip(a, it, ex);
  },
  typeVal: (el) => {
    const a = state.active; const it = a.items[a.idx];
    const k = el.dataset.k;
    const label = { load: 'Weight', reps: 'Reps', secs: 'Seconds' }[k];
    const v = prompt(label, String(it.cur[k]));
    if (v === null) return;
    const n = parseFloat(v.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return;
    it.cur[k] = k === 'secs' ? Math.max(5, Math.round(n)) : k === 'reps' ? Math.round(n) : n;
    save(); render();
  },
  useSuggest: () => {
    const it = state.active.items[state.active.idx];
    it.cur.load = it.suggest; save(); render();
    fx.sound('check'); toast(`Going up to ${fmtNum(it.suggest)} ${unitLabel()}. You've got this!`);
  },
  addSet: () => {
    const it = state.active.items[state.active.idx];
    it.sets++; save(); render(); toast(`Set ${it.sets} added. Love the ambition!`);
  },
  skipEx: () => {
    const a = state.active;
    if (a.idx >= a.items.length - 1) { A.quit(); return; }
    if (!confirm(`Skip ${getExercise(a.items[a.idx].exId).name}?`)) return;
    a.idx++; a.phase = 'work'; save(); render();
    toast('On to ' + getExercise(a.items[a.idx].exId).name);
  },
  go: () => {
    const a = state.active;
    a.phase = 'work'; save(); hideRest(); render();
    fx.sound('check');
  },
  restAdd: (el) => {
    const a = state.active;
    a.restEnd = Math.max(Date.now() + 1000, a.restEnd + +el.dataset.s * 1000);
    a.restTotal = Math.max(a.restTotal, Math.ceil((a.restEnd - Date.now()) / 1000));
    save(); tick();
  },
  warm: (el) => {
    const a = state.active; const i = +el.dataset.i;
    a.warm[i] = !a.warm[i]; save();
    el.setAttribute('aria-pressed', String(a.warm[i]));
    if (a.warm[i]) { fx.sound('check'); fx.buzz(20); }
    if (WARMUP.every((_, j) => a.warm[j]) && a.warm[i]) { fx.confetti(0.8); toast('All warmed up. Time to work!'); }
  },
  warmDone: () => { const a = state.active; a.phase = 'work'; save(); fx.unlockAudio(); fx.sound('go'); render(); },
  quit: () => {
    const { done, all } = totals(state.active);
    showSheet(`<h2>End workout?</h2><p class="muted" style="margin:6px 0 16px">You've done ${done} of ${all} sets.${done ? ' Every one of them counts.' : ''}</p>
      <div class="stack">
        ${done ? `<button class="btn good lg block" data-act="finishEarly">${icon('check')} Finish and save</button>` : ''}
        <button class="btn block lg" data-act="closeSheet">Keep going</button>
        <button class="btn ghost danger block" data-act="discard">Discard this workout</button>
      </div>`);
  },
  finishEarly: () => finishWorkout(),
  discard: () => {
    if (!confirm('Discard this workout? Nothing from it will be saved.')) return;
    state.active = null; save(); closeSheet(); go('home');
  },
  closeSheet: () => closeSheet(),
  music: () => {
    const mode = musicMode();
    if (!mode) { toast('Add a Spotify playlist in Settings to play music here.'); go('settings'); return; }
    if (mode === 'embed') {
      ms.tall = !ms.tall;
      const f = $('#spEmbed'); if (f) f.height = ms.tall ? 352 : 80;
    } else refreshRemote();
  },
  sp: async (el) => {
    const c = el.dataset.c;
    try {
      if (c === 'play' && ms.np?.idle) await spotify.control.startPlaylist();
      else await spotify.control[c]();
      if (ms.np && (c === 'play' || c === 'pause')) { ms.np.playing = c === 'play'; renderRemote(); }
    } catch (e) { ms.err = spotify.friendlyError(e); renderRemote(); }
    setTimeout(refreshRemote, 700);
  },

  // library / picker
  filterM: (el) => {
    filt.m = el.dataset.m;
    $$('.filter-chips button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    refreshList(route().name === 'pick');
  },
  pickToggle: (el) => {
    const id = el.dataset.id;
    picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    el.setAttribute('aria-pressed', String(picked.includes(id)));
    const b = $('#pickAdd'); b.disabled = !picked.length; b.textContent = pickLabel();
    if (picked.includes(id)) fx.buzz(10);
  },
  pickAdd: () => {
    picked.forEach((id) => draft.items.push(itemFromExercise(getExercise(id))));
    toast(`Added ${pl(picked.length, 'exercise')}`);
    picked = [];
    go('edit/' + (draft.isNew ? 'new' : draft.id));
  },
  pickBack: () => { picked = []; go('edit/' + (draft?.isNew ? 'new' : draft?.id)); },
  delCustom: (el) => {
    if (!confirm('Delete this exercise?')) return;
    state.custom = state.custom.filter((x) => x.id !== el.dataset.id); save(); go('library');
  },

  // builder
  toggleItem: (el) => { const i = +el.dataset.i; openItems.has(i) ? openItems.delete(i) : openItems.add(i); render(); },
  itemStep: (el) => {
    const it = draft.items[+el.dataset.i]; const ex = getExercise(it.exId); const d = +el.dataset.d;
    switch (el.dataset.k) {
      case 'sets': it.sets = Math.min(10, Math.max(1, it.sets + d)); break;
      case 'rest': it.rest = Math.min(600, Math.max(0, it.rest + d * 15)); break;
      case 'secs': it.secs = Math.max(5, it.secs + d * (it.secs >= 120 ? 30 : 5)); break;
      case 'rmin': it.reps[0] = Math.max(1, it.reps[0] + d); if (it.reps[1] < it.reps[0]) it.reps[1] = it.reps[0]; break;
      case 'rmax': it.reps[1] = Math.max(1, it.reps[1] + d); if (it.reps[0] > it.reps[1]) it.reps[0] = it.reps[1]; break;
      case 'load':
        if (ex.load === 'kg') { const v = (it.load ?? 0) + d * state.settings.step; it.load = v <= 0 ? null : Math.round(v * 100) / 100; }
        else it.load = Math.min(30, Math.max(1, (it.load ?? 5) + d));
        break;
      default: break;
    }
    render();
  },
  moveItem: (el) => {
    const i = +el.dataset.i; const j = i + +el.dataset.d;
    if (j < 0 || j >= draft.items.length) return;
    [draft.items[i], draft.items[j]] = [draft.items[j], draft.items[i]];
    openItems.clear(); openItems.add(j); render();
  },
  removeItem: (el) => { draft.items.splice(+el.dataset.i, 1); openItems.clear(); render(); },
  saveWorkout: () => {
    if (!draft.items.length) { toast('Add at least one exercise.'); return; }
    draft.name = draft.name.trim() || 'My workout';
    const isNew = draft.isNew; delete draft.isNew;
    if (isNew) state.workouts.push(draft);
    else state.workouts = state.workouts.map((w) => (w.id === draft.id ? draft : w));
    save(); draft = null; go('home'); toast(isNew ? 'Workout created!' : 'Workout saved');
  },
  cancelEdit: () => { draft = null; go('home'); },
  delWorkout: () => {
    if (!confirm(`Delete “${draft.name}”?`)) return;
    state.workouts = state.workouts.filter((w) => w.id !== draft.id); save(); draft = null; go('home');
  },

  // history
  delHistory: (el) => {
    if (!confirm('Delete this workout from your history?')) return;
    state.history = state.history.filter((h) => h.id !== el.dataset.id); save(); render();
  },

  // settings
  setNum: (el) => {
    const s = state.settings; const d = +el.dataset.d;
    if (el.dataset.key === 'step') { const opts = [0.5, 1, 1.25, 2.5, 5, 10]; const i = opts.indexOf(s.step); s.step = opts[Math.min(opts.length - 1, Math.max(0, (i < 0 ? 3 : i) + d))]; }
    if (el.dataset.key === 'exRest') s.exRest = Math.min(600, Math.max(15, s.exRest + d * 15));
    if (el.dataset.key === 'weeklyGoal') s.weeklyGoal = Math.min(7, Math.max(1, s.weeklyGoal + d));
    save(); render();
  },
  testCheer: () => {
    fx.unlockAudio(); const t = fx.say('set');
    fx.sound('set'); fx.confetti(1); fx.buzz(60); fx.speak(t); toast(t);
  },
  savePlaylist: () => {
    const v = $('#spPlaylist').value.trim();
    if (v && !spotify.embedUrl(v)) { toast("That doesn't look like a Spotify link."); return; }
    spotify.saveSpotify({ playlist: v }); updateMusicDock();
    toast(v ? 'Playlist saved. It will show on the workout screen.' : 'Playlist removed');
  },
  copyRedirect: async () => {
    try { await navigator.clipboard.writeText(spotify.redirectUri()); toast('Copied'); } catch { toast(spotify.redirectUri()); }
  },
  spConnect: async () => {
    spotify.saveSpotify({ clientId: $('#spClient').value.trim() });
    try { await spotify.connect(); } catch (e) { toast(e.message); }
  },
  spDisconnect: () => { spotify.disconnect(); ms.key = null; updateMusicDock(); render(); toast('Spotify disconnected'); },
  export: () => {
    const blob = new Blob([JSON.stringify({ ...state, active: null }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `repup-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  restoreStarters: () => {
    const ids = new Set(state.workouts.map((w) => w.id));
    const add = starterWorkouts().filter((w) => !ids.has(w.id));
    if (!add.length && !confirm('All starter workouts are already here. Reset them to their original settings?')) return;
    if (!add.length) { const fresh = starterWorkouts(); state.workouts = state.workouts.map((w) => fresh.find((f) => f.id === w.id) ?? w); }
    else state.workouts.push(...add);
    save(); toast('Starter workouts restored');
  },
  resetAll: () => {
    if (!confirm('Erase all workouts, history and settings on this device?')) return;
    resetAll(); render(); toast('Everything erased');
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'q') { filt.q = t.value; refreshList(route().name === 'pick'); }
  if (t.dataset.bind && draft) draft[t.dataset.bind] = t.value;
});
document.addEventListener('change', (e) => {
  const t = e.target; const k = t.dataset.change;
  if (!k) return;
  if (k === 'mine') { filt.mine = t.checked; refreshList(route().name === 'pick'); }
  if (k === 'setting') { state.settings[t.dataset.key] = t.checked; save(); if (t.checked && t.dataset.key === 'sound') { fx.unlockAudio(); fx.sound('check'); } }
  if (k === 'equip') {
    const eq = new Set(state.settings.equipment);
    t.checked ? eq.add(t.value) : eq.delete(t.value);
    state.settings.equipment = [...eq]; save();
  }
  if (k === 'import' && t.files[0]) {
    t.files[0].text().then((txt) => {
      const data = JSON.parse(txt);
      if (!Array.isArray(data.workouts) || !Array.isArray(data.history)) throw new Error();
      if (!confirm('Replace everything on this device with this backup?')) return;
      replaceState({ ...data, active: null }); render(); toast('Backup imported');
    }).catch(() => toast("That file isn't a RepUp backup."));
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'cx') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const mode = f.get('mode');
  const ex = {
    id: 'c-' + uid(), custom: true, name: String(f.get('name')).trim() || 'My exercise',
    equip: f.get('equip') ? [f.get('equip')] : [], muscles: [f.get('muscle')], mode,
    load: f.get('load'), perSide: f.get('perSide') === 'on',
    def: mode === 'time' ? { sets: 2, secs: 30, rest: 60 } : { sets: 2, reps: [10, 12], rest: 60 },
    setup: f.get('setup'), do: f.get('do'), avoid: f.get('avoid'),
  };
  state.custom.push(ex); save(); toast('Exercise created'); go('ex/' + ex.id);
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (route().name === 'play') fx.keepAwake(true);
    tick();
  }
});
window.addEventListener('hashchange', render);

// ---------------------------------------------------------------- boot
(async () => {
  const msg = await spotify.handleRedirect();
  render();
  if (msg) toast(msg);
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
