// The checklist: quick filter chips and the trophy rows, grouped by route leg when sorted by route.
import { h, medal, trophySources, money } from './dom.js';
import { KINDS, QUICK, matches, sortTrophies, quickCount, isMasked, describeFilter } from './filters.js';

export function renderQuickFilters(el, ctx) {
  const { data, filter } = ctx;
  el.replaceChildren(
    ...QUICK.map(([key, label]) =>
      h('button', { type: 'button', class: `chip${key === 'missable' ? ' chip-missable' : ''}`, 'aria-pressed': String(filter.quick === key), onclick: () => ctx.setQuick(key) },
        label, h('b', {}, String(quickCount(data.trophies, key))))),
    h('button', { type: 'button', class: 'chip chip-more', onclick: () => ctx.openFilters(), title: 'All filters (F)' }, 'More', h('kbd', {}, 'F')),
  );
}

export function visibleTrophies(ctx) {
  const { data, filter, progress } = ctx;
  return sortTrophies(data.trophies.filter((t) => matches(t, filter, progress)), filter.sort);
}

function legHead(ctx, leg) {
  const all = ctx.data.trophies.filter((t) => t.leg === leg.id);
  const done = all.filter((t) => ctx.progress.earned.includes(t.id)).length;
  return h('li', { class: 'leg-head', 'aria-hidden': 'true' },
    h('span', { class: 'leg-no' }, String(leg.id)),
    h('span', { class: 'leg-name' }, `${leg.name} · ${leg.place}`),
    h('span', { class: 'leg-count' }, `${done}/${all.length}`),
    h('span', { class: 'leg-bar' }, h('i', { style: `width:${(done / all.length) * 100}%` })));
}

function rowFlags(t, ctx) {
  const flags = [];
  if (t.missable !== 'no') flags.push(h('span', { class: 'flag flag-missable' }, 'Missable?'));
  if (t.count) {
    const n = ctx.progress.earned.includes(t.id) ? t.count : ctx.progress.counts[t.id] || 0;
    flags.push(h('span', { class: 'flag flag-count' }, `${money(n, t.unit === '$' ? '$' : '')}/${money(t.count, t.unit === '$' ? '$' : '')}`));
  }
  if (t.differ) flags.push(h('span', { class: 'flag flag-differ', title: 'Sources differ: both versions shown in the guide' }, 'Differ'));
  flags.push(h('span', { class: 'flag flag-src', title: 'Sources cited' }, `${trophySources(t).length} src`));
  return h('span', { class: 'row-flags' }, flags);
}

function row(t, ctx) {
  const earned = ctx.progress.earned.includes(t.id);
  const masked = isMasked(t, ctx.progress);
  const leg = ctx.data.legs[t.leg - 1];
  const box = h('input', { type: 'checkbox', 'aria-label': `Earned: ${masked ? `hidden story trophy, leg ${t.leg}` : t.name}` });
  box.checked = earned;
  box.addEventListener('change', () => ctx.toggle(t.id, box.checked));
  const name = masked ? h('span', { class: 'row-name' }, `Story trophy · ${leg.name}`) : h('span', { class: 'row-name' }, t.name);
  const desc = masked ? 'Hidden by the spoiler shield until earned' : t.description;
  return h('li', { class: `row${earned ? ' is-earned' : ''}${masked ? ' is-masked' : ''}${t.id === ctx.selected ? ' is-selected' : ''}`, dataset: { id: t.id } },
    box,
    h('button', { type: 'button', class: 'row-main', onclick: () => ctx.select(t.id), 'aria-current': t.id === ctx.selected ? 'true' : false },
      medal(t.grade), name,
      h('span', { class: 'row-desc' }, desc),
      h('span', { class: 'row-meta' }, h('b', { class: `t-${t.grade}` }, t.grade), ` · ${KINDS[t.kind]}${t.hidden ? ' · hidden on PSN' : ''}${t.count ? ` · PSN counts ${t.count.toLocaleString('en-US')}` : ''}`)),
    rowFlags(t, ctx));
}

export function renderChecklist(el, stateEl, ctx) {
  const list = visibleTrophies(ctx);
  stateEl.textContent = describeFilter(ctx.filter, list.length, ctx.data.trophies.length);
  if (!list.length) {
    const online = ctx.filter.quick === 'online';
    el.replaceChildren(h('li', { class: 'empty' },
      h('strong', {}, online ? 'No online trophies' : 'Nothing matches'),
      h('span', {}, online ? 'The launch list is single-player only: 55 offline, 0 online.' : 'Clear a filter or the search to see trophies again.'),
      h('button', { type: 'button', onclick: () => ctx.clearFilters() }, 'Clear filters')));
    return list;
  }
  const items = [];
  let leg = 0;
  for (const t of list) {
    if (ctx.filter.sort === 'route' && t.leg !== leg) {
      leg = t.leg;
      items.push(legHead(ctx, ctx.data.legs[leg - 1]));
    }
    items.push(row(t, ctx));
  }
  el.replaceChildren(...items);
  return list;
}
