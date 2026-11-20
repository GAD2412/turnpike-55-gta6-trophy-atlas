// The open guide: official text, missable warning, counter, cited steps, source disagreements; and its source rail.
import { h, medal, cited, trophySources, sourceById, dateLabel, money } from './dom.js';
import { KINDS, isMasked, sortTrophies } from './filters.js';

function counter(t, ctx) {
  const earned = ctx.progress.earned.includes(t.id);
  const n = earned ? t.count : ctx.progress.counts[t.id] || 0;
  const step = t.count >= 10000 ? 10000 : 1;
  const input = h('input', { type: 'number', min: '0', max: String(t.count), step: String(step), value: String(n), 'aria-label': `Your count of ${t.unit}` });
  input.addEventListener('change', () => ctx.setCount(t.id, Number(input.value)));
  return h('div', { class: 'counter' },
    h('span', { class: 'counter-label' }, 'Your count'),
    h('button', { type: 'button', class: 'step-btn', 'aria-label': 'Count down', onclick: () => ctx.setCount(t.id, n - step) }, '−'),
    input,
    h('button', { type: 'button', class: 'step-btn', 'aria-label': 'Count up', onclick: () => ctx.setCount(t.id, n + step) }, '+'),
    h('span', { class: 'counter-of' }, `of ${money(t.count, t.unit)} ${t.unit === '$' || t.unit === '%' ? '' : t.unit}`),
    h('span', { class: 'counter-bar' }, h('i', { style: `width:${(n / t.count) * 100}%` })));
}

function missableBox(t, ctx) {
  if (t.missable === 'no') return null;
  return h('div', { class: 'missable', role: 'note' },
    h('strong', {}, `Potentially missable · last chance: ${t.watch}`),
    h('p', {}, cited(ctx.data, 'The balcony meditation in Chapter 1 cannot be repeated later, and whether the trophy needs it is unconfirmed. Do it, then keep a Chapter 1 save. [1][3][8]')));
}

function differBox(t, ctx) {
  if (!t.differ) return null;
  const d = t.differ;
  return h('div', { class: 'differ', role: 'note' },
    h('strong', {}, `Sources differ: ${d.q}`),
    h('div', { class: 'differ-sides' },
      h('p', {}, h('b', {}, 'A '), cited(ctx.data, d.a)),
      h('p', {}, h('b', {}, 'B '), cited(ctx.data, d.b))),
    h('p', { class: 'differ-call' }, h('b', {}, 'Our call: '), d.call));
}

function maskedGuide(t, ctx) {
  const leg = ctx.data.legs[t.leg - 1];
  return [
    h('header', { class: 'g-head' }, medal(t.grade), h('h2', { id: 'guide-title' }, `Story trophy · ${leg.name}`)),
    h('p', { class: 'g-tags' }, `${t.grade} · ${KINDS[t.kind]} · leg ${t.leg} · #${t.id} of 55 · hidden on PSN`),
    h('div', { class: 'shielded' },
      h('p', {}, 'The spoiler shield hides this trophy’s name, description and guide until you earn it. It is a story trophy and cannot be missed.'),
      h('div', { class: 'shielded-actions' },
        h('button', { type: 'button', onclick: () => ctx.reveal(t.id) }, 'Reveal this one'),
        h('button', { type: 'button', onclick: () => ctx.toggle(t.id, true) }, 'Mark earned'))),
  ];
}

export function renderGuide(el, t, ctx) {
  if (!t) {
    el.replaceChildren(h('p', { class: 'empty' }, 'Pick a trophy from the list to open its guide.'));
    return;
  }
  if (isMasked(t, ctx.progress)) {
    el.replaceChildren(...maskedGuide(t, ctx));
    return;
  }
  const earned = ctx.progress.earned.includes(t.id);
  const leg = ctx.data.legs[t.leg - 1];
  el.replaceChildren(
    h('header', { class: 'g-head' },
      medal(t.grade),
      h('h2', { id: 'guide-title' }, t.name),
      h('button', { type: 'button', class: `earn${earned ? ' is-on' : ''}`, 'aria-pressed': String(earned), onclick: () => ctx.toggle(t.id, !earned) }, earned ? 'Earned' : 'Mark earned', h('kbd', {}, 'X'))),
    h('p', { class: 'g-tags' },
      h('span', { class: `g-grade t-${t.grade}` }, t.grade), ` · ${KINDS[t.kind]} · Leg ${t.leg}: ${leg.name}, ${leg.place} · opens ${t.opens} · #${t.id} of 55${t.hidden ? ' · hidden on PSN' : ''}`),
    h('blockquote', { class: 'official' }, h('span', {}, 'Official description'), h('q', {}, t.description), cited(ctx.data, ' [5]')),
    missableBox(t, ctx),
    h('p', { class: 'g-short' }, h('b', {}, 'In short '), cited(ctx.data, t.guide)),
    t.count ? counter(t, ctx) : null,
    h('h3', {}, `How to earn it · ${t.steps.length} steps, each cited`),
    h('ol', { class: 'steps' }, t.steps.map((s) => h('li', {}, h('span', {}, cited(ctx.data, s))))),
    differBox(t, ctx),
  );
}

function nextUp(ctx) {
  const open = sortTrophies(ctx.data.trophies.filter((t) => !ctx.progress.earned.includes(t.id) && t.id !== ctx.selected), 'route');
  return open.slice(0, 4);
}

export function renderRail(el, t, ctx) {
  const ids = t && !isMasked(t, ctx.progress) ? trophySources(t) : [5];
  el.replaceChildren(
    h('h3', {}, `Sources for this guide · ${ids.length}`),
    h('ol', { class: 'src-list' }, ids.map((id) => {
      const s = sourceById(ctx.data, id);
      return h('li', {},
        h('span', { class: 'src-no' }, String(id)),
        h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, h('b', {}, s.site), ` ${s.title}`),
        h('span', { class: 'src-date' }, `${dateLabel(s.published)} · read ${dateLabel(s.read)}`));
    })),
    h('h3', {}, 'Next up on the route'),
    h('ol', { class: 'next-list' }, nextUp(ctx).map((n) => h('li', {},
      h('button', { type: 'button', onclick: () => ctx.select(n.id) }, medal(n.grade),
        h('span', {}, isMasked(n, ctx.progress) ? `Story trophy · ${ctx.data.legs[n.leg - 1].name}` : n.name),
        h('small', {}, `leg ${n.leg} · ${n.opens}`))))),
  );
}
