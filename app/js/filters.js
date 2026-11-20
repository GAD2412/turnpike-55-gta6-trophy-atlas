// Which trophies show, in what order, and which stay behind the spoiler shield.

export const KINDS = {
  story: 'Story',
  side: 'Side strands',
  collectible: 'Collectibles',
  activity: 'Activities',
  crime: 'Crime',
  feat: 'Feats',
  money: 'Money',
  completion: 'Completion',
};
export const QUICK = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectible', 'Collectibles'],
  ['activity', 'Activities'],
  ['online', 'Online'],
];
export const GRADES = ['platinum', 'gold', 'silver', 'bronze'];
export const FLAGS = {
  hidden: 'Hidden on PSN',
  differ: 'Sources differ',
  counter: 'Has a counter',
  watch: 'On the watch list',
};
export const SORTS = { route: 'Route order', official: 'Official order', grade: 'Grade', name: 'A to Z' };
export const SPOILER_TEXT = { story: 'story hidden', hidden: 'all 28 hidden', off: 'off' };

export function defaultFilter() {
  return { quick: 'all', kinds: [], grades: [], status: 'any', leg: 0, flags: [], q: '', sort: 'route' };
}

export function isMasked(t, p) {
  if (p.earned.includes(t.id) || p.revealed.includes(t.id) || p.spoiler === 'off') return false;
  return p.spoiler === 'story' ? t.kind === 'story' : t.hidden;
}

function quickMatch(t, quick) {
  if (quick === 'all') return true;
  if (quick === 'missable') return t.missable !== 'no';
  if (quick === 'online') return false; // the launch list has no online trophies
  return t.kind === quick;
}

function flagMatch(t, flag) {
  if (flag === 'hidden') return t.hidden;
  if (flag === 'differ') return Boolean(t.differ);
  if (flag === 'counter') return Boolean(t.count);
  if (flag === 'watch') return Boolean(t.watch) || t.missable !== 'no';
  return true;
}

function searchText(t, masked) {
  const words = masked ? [`leg ${t.leg}`, KINDS[t.kind], t.grade] : [t.name, t.description, t.guide, ...t.steps, KINDS[t.kind], t.grade];
  return words.join(' ').toLowerCase();
}

export function matches(t, f, p) {
  const earned = p.earned.includes(t.id);
  if (!quickMatch(t, f.quick)) return false;
  if (f.kinds.length && !f.kinds.includes(t.kind)) return false;
  if (f.grades.length && !f.grades.includes(t.grade)) return false;
  if (f.status === 'earned' && !earned) return false;
  if (f.status === 'open' && earned) return false;
  if (f.leg && t.leg !== f.leg) return false;
  if (!f.flags.every((x) => flagMatch(t, x))) return false;
  const q = f.q.trim().toLowerCase();
  return !q || q.split(/\s+/).every((w) => searchText(t, isMasked(t, p)).includes(w));
}

export function sortTrophies(list, sort) {
  const rank = (g) => GRADES.indexOf(g);
  const by = {
    // within a leg, anything that can be missed comes first
    route: (a, b) => a.leg - b.leg || (a.missable === 'no') - (b.missable === 'no') || a.id - b.id,
    official: (a, b) => a.id - b.id,
    grade: (a, b) => rank(a.grade) - rank(b.grade) || a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
  }[sort] || ((a, b) => a.id - b.id);
  return [...list].sort(by);
}

export function quickCount(trophies, key) {
  return trophies.filter((t) => quickMatch(t, key)).length;
}

// One plain sentence naming every active filter, so the state is readable at a glance.
export function describeFilter(f, shown, total) {
  const parts = [];
  if (f.quick !== 'all') parts.push(QUICK.find(([k]) => k === f.quick)[1]);
  if (f.kinds.length) parts.push(f.kinds.map((k) => KINDS[k]).join(' or '));
  if (f.grades.length) parts.push(f.grades.join(' or '));
  if (f.status !== 'any') parts.push(f.status === 'earned' ? 'earned' : 'not earned');
  if (f.leg) parts.push(`leg ${f.leg}`);
  if (f.flags.length) parts.push(f.flags.map((x) => FLAGS[x].toLowerCase()).join(', '));
  if (f.q.trim()) parts.push(`“${f.q.trim()}”`);
  const what = parts.length ? parts.join(' · ') : 'no filter';
  return `${shown} of ${total} shown · ${what} · ${SORTS[f.sort]}`;
}
