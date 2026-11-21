// Header odometer and audit line, the missables and sources views, the filter and help dialogs, the print sheet.
import { h, medal, cited, dateLabel, trophySources, sourceDate, claimStats, claimsBacked } from './dom.js';
import { KINDS, GRADES, FLAGS, SORTS, SPOILER_TEXT, QUICK, isMasked } from './filters.js';
import { SPOILER_LEVELS } from './store.js';
import { renderDeadline } from './guide.js';

export function renderOdometer(el, ctx) {
  const { trophies } = ctx.data;
  const earned = ctx.progress.earned.length;
  const pct = Math.round((earned / trophies.length) * 100);
  el.replaceChildren(
    h('span', { class: 'odo-big' }, String(earned), h('small', {}, '/55')),
    h('span', { class: 'odo-side' },
      h('span', { class: 'odo-bar' }, h('i', { style: `width:${pct}%` })),
      h('span', { class: 'odo-grades' }, GRADES.map((g) => {
        const all = trophies.filter((t) => t.grade === g);
        const n = all.filter((t) => ctx.progress.earned.includes(t.id)).length;
        return h('span', { class: 'odo-grade' }, medal(g), `${n}/${all.length}`);
      }), h('span', { class: 'odo-pct' }, `${pct}% earned`))));
}

export function renderAudit(el, ctx) {
  const { trophies, sources } = ctx.data;
  const count = (g) => trophies.filter((t) => t.grade === g).length;
  const c = claimStats(ctx.data, trophies);
  const sites = new Set(sources.map((s) => s.site)).size;
  const items = [
    ['', `${trophies.length} trophies · ${trophies.filter((t) => t.hidden).length} hidden on PSN`],
    ['', `${count('platinum')}P ${count('gold')}G ${count('silver')}S ${count('bronze')}B`],
    ['ok', `${c.cited}/${c.steps} guide steps cited`],
    ['', `${sources.length} pages · ${sites} sites`],
  ];
  el.replaceChildren(...items.map(([k, text]) => h('span', { class: k ? `a-${k}` : '' }, text)));
}

const WATCH = [
  ['Strangers & Freaks: Game-Checklists says missing Race Against Yago (Chapter 3 hourglass) puts it at risk; PowerPyx and GTABase say every strand stays open. [1][19][21]', 25],
  ['Kenton goes quiet after Chapter 1 and texts Jason again in Chapters 2-3: his strand returns. [1][19]', 23],
  ['Let’s Go Bowling: a valuable you miss respawns after a long wait. [1][19]', 46],
  ['Stick Fiddler: the home TV is blocked in some story stretches and comes back. [1]', 21],
  ['Other hourglass missions fail over time; PowerPyx finds none that feeds a trophy or the 100% list. [1][4][19]', 14],
  ['Some fences and magazine spots disappear with the story; no trophy depends on them. [1][19]', 14],
];
const RULES = [
  'No mission replay: 15 manual slots and 1 autosave. Keep a save at the start and end of each chapter. [1][12][19]',
  'Chapter 1’s Tourist Trap wipes your cash: move $5,000 or more to Family Savings first. [19]',
  'Cheats switch off trophies and saving. [1][12][19]',
  'The Irredeemable criminal profile is permanent and makes police harsher: avoid it. [1][21]',
  'Whether Jason and Lucia get along does not affect any trophy. [1]',
  'Character-locked strands: Andy is Lucia only; Tyrone, Bret and Pilot Pete are Jason only. [1][19]',
  'Everything on the 100% list is still open after the story. [1][2][16]',
];

export function renderMissables(el, ctx) {
  const risky = ctx.data.trophies.filter((t) => t.missable !== 'no');
  const disputes = ctx.data.trophies.filter((t) => t.differ && !isMasked(t, ctx.progress));
  el.replaceChildren(
    h('header', { class: 'route-head' },
      h('h2', {}, 'Missables and save points'),
      h('p', {}, cited(ctx.data, 'The balcony scene has a chapter deadline. The risk to its PS5 trophy remains open. [3][29][30]', true))),
    h('div', { class: 'miss-grid' },
      h('section', { class: 'miss-main' }, risky.map((t) => h('article', { class: 'miss-card' },
        h('h3', {}, medal(t.grade), t.name),
        h('q', {}, t.description),
        renderDeadline(t, ctx.data),
        h('p', {}, t.differ.call),
        h('button', { type: 'button', onclick: () => ctx.openTrophy(t.id) }, 'Open the full guide'))),
        h('h3', { class: 'differ-title' }, `Unconfirmed or disputed (${disputes.length})`),
        h('ul', { class: 'watch' }, disputes.map((t) => h('li', {},
          h('b', {}, t.name), `: ${t.differ.q} `, h('span', { class: 'call' }, t.differ.call), ' ',
          h('button', { type: 'button', class: 'link', onclick: () => ctx.openTrophy(t.id) }, 'Open'))))),
      h('section', { class: 'miss-side' },
        h('h3', {}, 'Other time-sensitive content'),
        h('ul', { class: 'watch' }, WATCH.map(([text, id]) => h('li', {}, cited(ctx.data, text), ' ',
          h('button', { type: 'button', class: 'link', onclick: () => ctx.openTrophy(id) }, 'Open')))),
        h('h3', {}, 'Rules of the road'),
        h('ul', { class: 'watch' }, RULES.map((text) => h('li', {}, cited(ctx.data, text)))))),
  );
}

export function renderSources(el, ctx) {
  const { trophies, sources } = ctx.data;
  const usage = (id) => trophies.filter((t) => trophySources(t).includes(id)).length;
  const differs = trophies.filter((t) => t.differ && !isMasked(t, ctx.progress));
  const c = claimStats(ctx.data, trophies);
  const sites = new Set(sources.map((s) => s.site)).size;
  el.replaceChildren(
    h('header', { class: 'route-head' },
      h('h2', {}, `Sources · ${sources.length} pages from ${sites} sites, every one dated`),
      h('p', {}, `Each guide is written for Turnpike 55 in its own words; a number beside a fact names the page it comes from. ${c.cited} of ${c.steps} steps cite a page and ${c.multi} cite two different sites. Nothing was copied, and nothing was checked in the game by us.`)),
    h('table', { class: 'src-table' },
      h('thead', {}, h('tr', {}, ['#', 'Source', 'Published', 'Read', 'Used for', 'Steps', 'Guides'].map((x) => h('th', { scope: 'col' }, x)))),
      h('tbody', {}, sources.map((s) => h('tr', { id: `src-${s.id}`, tabindex: -1 },
        h('td', { class: 'src-no' }, String(s.id)),
        h('td', {}, h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, h('b', {}, s.site), ` ${s.title}`)),
        h('td', {}, sourceDate(s)),
        h('td', {}, dateLabel(s.read)),
        h('td', {}, s.used),
        h('td', { class: 'num' }, String(claimsBacked(trophies, s.id))),
        h('td', { class: 'num' }, `${usage(s.id)}/55`))))),
    h('h3', { class: 'differ-title' }, `Where sources differ · ${differs.length}`),
    h('div', { class: 'differ-grid' }, differs.map((t) => h('div', { class: 'differ' },
      h('strong', {}, `${t.name}: ${t.differ.q}`),
      h('p', {}, h('b', {}, 'A '), cited(ctx.data, t.differ.a)),
      h('p', {}, h('b', {}, 'B '), cited(ctx.data, t.differ.b)),
      h('p', { class: 'differ-call' }, h('b', {}, 'Our call: '), t.differ.call)))),
  );
}

function choice(name, type, value, label, checked, onchange) {
  const input = h('input', { type, name, value });
  input.checked = checked;
  input.addEventListener('change', onchange);
  return h('label', { class: 'opt' }, input, h('span', {}, label));
}

export function renderFilterDialog(dlg, ctx) {
  const f = ctx.filter;
  const multi = (key, val) => () => {
    f[key] = f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val];
    ctx.applyFilter();
  };
  const set = (key, val) => () => { f[key] = val; ctx.applyFilter(); };
  dlg.replaceChildren(h('form', { method: 'dialog', class: 'filter-form' },
    h('header', {}, h('h2', { id: 'filters-title' }, 'Filters and spoiler shield'), h('p', {}, 'Changes apply as you pick. Esc closes.')),
    h('fieldset', {}, h('legend', {}, 'Spoiler shield'), SPOILER_LEVELS.map((k) => choice('spoiler', 'radio', k, `${k === 'off' ? 'Off: show all' : k === 'story' ? 'Hide story trophies' : 'Hide all 28 PSN-hidden'}`, ctx.progress.spoiler === k, () => ctx.setSpoiler(k)))),
    h('fieldset', {}, h('legend', {}, 'Quick'), QUICK.map(([k, label]) => choice('quick', 'radio', k, label, f.quick === k, set('quick', k)))),
    h('fieldset', {}, h('legend', {}, 'Kind'), Object.entries(KINDS).map(([k, label]) => choice('kind', 'checkbox', k, label, f.kinds.includes(k), multi('kinds', k)))),
    h('fieldset', {}, h('legend', {}, 'Grade'), GRADES.map((g) => choice('grade', 'checkbox', g, g[0].toUpperCase() + g.slice(1), f.grades.includes(g), multi('grades', g)))),
    h('fieldset', {}, h('legend', {}, 'Status'), [['any', 'Any'], ['open', 'Not earned'], ['earned', 'Earned']].map(([k, label]) => choice('status', 'radio', k, label, f.status === k, set('status', k)))),
    h('fieldset', {}, h('legend', {}, 'Route leg'), [[0, 'All legs'], ...ctx.data.legs.map((l) => [l.id, `${l.id} · ${l.name}`])].map(([k, label]) => choice('leg', 'radio', String(k), label, f.leg === k, set('leg', k)))),
    h('fieldset', {}, h('legend', {}, 'Flags'), Object.entries(FLAGS).map(([k, label]) => choice('flag', 'checkbox', k, label, f.flags.includes(k), multi('flags', k)))),
    h('fieldset', {}, h('legend', {}, 'Sort'), Object.entries(SORTS).map(([k, label]) => choice('sort', 'radio', k, label, f.sort === k, set('sort', k)))),
    h('footer', {},
      h('button', { type: 'button', onclick: () => { ctx.clearFilters(); renderFilterDialog(dlg, ctx); } }, 'Clear filters'),
      h('button', { value: 'close', class: 'primary' }, 'Done'))));
}

const KEYS = [
  ['/', 'Search'], ['F', 'All filters'], ['J / K or ↓ / ↑', 'Next or previous trophy'], ['X', 'Mark the open trophy earned'],
  ['+ / −', 'Count up or down'], ['H', 'Change the spoiler shield'], ['T R M S', 'Tracker, route, missables, sources'],
  ['E', 'Export progress'], ['P', 'Print the guide'], ['?', 'This help'], ['Esc', 'Close a dialog or clear the search'],
];

export function renderHelpDialog(dlg) {
  dlg.replaceChildren(h('form', { method: 'dialog', class: 'filter-form' },
    h('header', {}, h('h2', { id: 'help-title' }, 'Keyboard')),
    h('dl', { class: 'keys' }, KEYS.flatMap(([k, what]) => [h('dt', {}, h('kbd', {}, k)), h('dd', {}, what)])),
    h('footer', {}, h('button', { value: 'close', class: 'primary' }, 'Close'))));
}

export function renderPrintSheet(el, ctx) {
  const { data } = ctx;
  el.replaceChildren(
    h('h1', {}, 'Turnpike 55 · GTA VI trophy guide'),
    h('p', {}, `${ctx.progress.earned.length} of 55 earned. Spoiler shield: ${SPOILER_TEXT[ctx.progress.spoiler]}. Sources are listed at the end.`),
    ...data.legs.map((leg) => h('section', {},
      h('h2', {}, `Leg ${leg.id} · ${leg.name}, ${leg.place}`),
      h('p', {}, leg.plan),
      ...data.trophies.filter((t) => t.leg === leg.id).map((t) => {
        const masked = isMasked(t, ctx.progress);
        const box = ctx.progress.earned.includes(t.id) ? '☑' : '☐';
        if (masked) return h('div', { class: 'p-t' }, h('h3', {}, `${box} Story trophy (shielded) · ${t.grade}`));
        return h('div', { class: 'p-t' },
          h('h3', {}, `${box} ${t.name} · ${t.grade}${t.missable !== 'no' ? ' · POTENTIALLY MISSABLE' : ''}`),
          h('p', {}, h('i', {}, t.description)),
          h('p', {}, t.guide),
          h('ol', {}, t.steps.map((s) => h('li', {}, s))));
      }))),
    h('h2', {}, 'Sources'),
    h('ol', {}, data.sources.map((s) => h('li', {}, `${s.site}, ${s.title}. ${s.url} (${sourceDate(s)}, read ${dateLabel(s.read)})`))),
  );
}
