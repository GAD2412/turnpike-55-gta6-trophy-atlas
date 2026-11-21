// The open guide and the evidence for its steps.
import { h, medal, cited, citesIn, trophySources, sourceById, dateLabel, money, sourceDate, claimStats } from './dom.js';
import { KINDS, isMasked } from './filters.js';

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

export function renderDeadline(t, data) {
  return h('div', { class: 'missable', role: 'note' },
    h('h3', {}, cited(data, t.deadline, true)),
    h('p', { class: 'deadline-action' }, cited(data, t.steps[0], true)),
    h('p', { class: 'deadline-evidence' }, h('b', {}, 'PS5 lockout unconfirmed. '), cited(data, t.missNote, true)));
}

// Both readings side by side with their sources; stacked A over B when it sits beside a missable warning.
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

function stepsHead(t, ctx) {
  const s = claimStats(ctx.data, [t]);
  return h('h3', { class: 'steps-head' }, t.deadline ? 'Continue the guide' : 'How to earn it',
    h('span', {}, `${s.cited}/${s.steps} steps cited`));
}

function maskedGuide(t, ctx) {
  const leg = ctx.data.legs[t.leg - 1];
  const label = t.kind === 'story' ? 'Story trophy' : 'Hidden trophy';
  return [
    h('header', { class: 'g-head' }, medal(t.grade), h('h2', { id: 'guide-title' }, `${label} · ${leg.name}`)),
    h('p', { class: 'g-tags' }, `${t.grade} · ${KINDS[t.kind]} · leg ${t.leg} · #${t.id} of 55 · hidden on PSN`),
    h('div', { class: 'shielded' },
      h('p', {}, 'The spoiler shield hides the name, description and guide until you earn or reveal this trophy.'),
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
  const sections = [
    h('header', { class: 'g-head' },
      medal(t.grade),
      h('h2', { id: 'guide-title' }, t.name),
      h('button', { type: 'button', class: `earn${earned ? ' is-on' : ''}`, 'aria-pressed': String(earned), onclick: () => ctx.toggle(t.id, !earned) }, earned ? 'Earned' : 'Mark earned', h('kbd', {}, 'X'))),
    h('p', { class: 'g-tags' },
      h('span', { class: `g-grade t-${t.grade}` }, t.grade), ` · ${KINDS[t.kind]} · ${t.opens}${t.hidden ? ' · hidden on PSN' : ''}`),
    h('blockquote', { class: 'official' }, h('q', {}, t.description), cited(ctx.data, ' [5]', true)),
    t.deadline ? renderDeadline(t, ctx.data) : null,
    t.count ? counter(t, ctx) : null,
    stepsHead(t, ctx),
    h('p', { class: 'g-short' }, cited(ctx.data, t.guide)),
    h('ol', { class: 'steps', start: t.deadline ? 2 : 1 }, t.steps.slice(t.deadline ? 1 : 0).map((s) => h('li', {}, h('span', {}, cited(ctx.data, s))))),
    t.deadline ? null : differBox(t, ctx),
    guideSources(t, ctx.data),
  ];
  el.replaceChildren(...sections.filter(Boolean));
}

function guideSources(t, data) {
  const ids = trophySources(t);
  return h('details', { class: 'guide-sources' },
    h('summary', {}, `Guide sources (${ids.length})`),
    h('ol', { class: 'src-list' }, ids.map((id) => {
      const s = sourceById(data, id);
      const steps = t.steps.flatMap((step, i) => citesIn(step).includes(id) ? [i + 1] : []);
      const role = id === 5 ? 'Official description' : steps.length ? `Step ${steps.join(', ')}` : 'Guide context';
      return h('li', {},
        h('span', { class: 'src-no' }, String(id)),
        h('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, h('b', {}, s.site), ` ${s.title}`),
        h('span', { class: 'src-date' }, h('b', { class: 'src-backs' }, role), ` · ${sourceDate(s)} · read ${dateLabel(s.read)}`));
    })),
  );
}
