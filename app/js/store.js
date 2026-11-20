// Progress: which trophies are earned, the counters you keep, the spoiler level and what you chose to reveal.
// It lives in localStorage under one key, and moves between browsers as a small JSON file.

const KEY = 'turnpike55.progress.v1';
export const SPOILER_LEVELS = ['story', 'hidden', 'off'];

export function blankProgress() {
  return { earned: [], counts: {}, spoiler: 'story', revealed: [], saved: null };
}

// Accepts this app's own file, or a bare array of trophy names or ids (the plain checklist format).
export function normalizeProgress(raw, trophies) {
  const p = blankProgress();
  if (!raw) return p;
  const byName = new Map(trophies.map((t) => [foldName(t.name), t.id]));
  const ids = new Set(trophies.map((t) => t.id));
  const toId = (v) => (typeof v === 'number' && ids.has(v) ? v : typeof v === 'string' ? byName.get(foldName(v)) : undefined);
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.earned) ? raw.earned : null;
  if (!list && typeof raw !== 'object') return p;
  p.earned = [...new Set((list || []).map(toId).filter(Boolean))].sort((a, b) => a - b);
  if (raw.counts && typeof raw.counts === 'object') {
    for (const t of trophies) {
      const n = Number(raw.counts[t.id]);
      if (t.count && Number.isFinite(n) && n > 0) p.counts[t.id] = Math.min(Math.round(n), t.count);
    }
  }
  if (SPOILER_LEVELS.includes(raw.spoiler)) p.spoiler = raw.spoiler;
  if (Array.isArray(raw.revealed)) p.revealed = raw.revealed.map(toId).filter(Boolean);
  if (typeof raw.saved === 'string') p.saved = raw.saved;
  return p;
}

export function foldName(s) {
  return String(s).normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function loadProgress(trophies) {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(KEY) || 'null'), trophies);
  } catch {
    return blankProgress();
  }
}

export function saveProgress(p) {
  p.saved = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function exportProgress(p, trophies) {
  const names = trophies.filter((t) => p.earned.includes(t.id)).map((t) => t.name);
  const file = { app: 'Turnpike 55', version: 1, exported: new Date().toISOString(), earned: p.earned, earnedNames: names, counts: p.counts, spoiler: p.spoiler, revealed: p.revealed };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 1)], { type: 'application/json' }));
  a.download = `turnpike55-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return names.length;
}

export async function importProgress(file, trophies) {
  let raw;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new Error(`${file.name} is not a JSON file. Choose a file made by Export.`);
  }
  const p = normalizeProgress(raw, trophies);
  const known = Array.isArray(raw) || (raw && (Array.isArray(raw.earned) || raw.counts));
  if (!known) throw new Error(`${file.name} holds no trophy progress. Choose a file made by Export.`);
  return p;
}

export function toggleEarned(p, id, on = !p.earned.includes(id)) {
  p.earned = on ? [...new Set([...p.earned, id])].sort((a, b) => a - b) : p.earned.filter((x) => x !== id);
  return on;
}

export function setCount(p, t, n) {
  const v = Math.max(0, Math.min(t.count, Math.round(n)));
  if (v) p.counts[t.id] = v;
  else delete p.counts[t.id];
  if (v >= t.count) toggleEarned(p, t.id, true);
  return v;
}
