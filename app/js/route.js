// The platinum route: six legs that place all 55 trophies, as a strip over the tracker and as a full view.
import { h, medal, cited, money } from './dom.js';
import { isMasked, sortTrophies } from './filters.js';

function legStats(ctx, leg) {
  const all = ctx.data.trophies.filter((t) => t.leg === leg.id);
  return { all, done: all.filter((t) => ctx.progress.earned.includes(t.id)).length };
}

export function currentLeg(ctx) {
  return ctx.data.legs.find((leg) => {
    const { all, done } = legStats(ctx, leg);
    return done < all.length;
  }) || ctx.data.legs.at(-1);
}

export function renderStrip(el, ctx) {
  const here = currentLeg(ctx);
  el.replaceChildren(
    h('span', { class: 'strip-title' }, 'Platinum', h('br'), 'route'),
    h('ol', { class: 'road' }, ctx.data.legs.map((leg) => {
      const { all, done } = legStats(ctx, leg);
      return h('li', { class: `mile${leg.id === here.id ? ' is-here' : ''}${done === all.length ? ' is-done' : ''}` },
        h('button', { type: 'button', onclick: () => ctx.filterLeg(leg.id), title: `Show leg ${leg.id} in the checklist` },
          h('span', { class: 'mile-no' }, String(leg.id)),
          h('span', { class: 'mile-name' }, leg.name, h('small', {}, leg.place)),
          h('span', { class: 'mile-count' }, `${done}/${all.length}`),
          h('span', { class: 'mile-bar' }, h('i', { style: `width:${(done / all.length) * 100}%` }))));
    })),
  );
}

export function renderRoute(el, ctx) {
  const here = currentLeg(ctx);
  el.replaceChildren(
    h('header', { class: 'route-head' },
      h('h2', {}, 'Platinum route · 6 legs, all 55 trophies placed'),
      h('p', {}, cited(ctx.data, 'One playthrough, about 200 h, difficulty 4/10, no online trophies [1][12][16]. One potentially missable, in leg 1 [1][3][14][19]. No mission replay: save at each chapter’s start and end [1][12]. Cheats block trophies [1][19].'))),
    h('ol', { class: 'legs' }, ctx.data.legs.map((leg) => {
      const { all, done } = legStats(ctx, leg);
      return h('li', { class: `leg${leg.id === here.id ? ' is-here' : ''}` },
        h('div', { class: 'leg-side' },
          h('span', { class: 'leg-shield' }, String(leg.id)),
          h('span', { class: 'leg-done' }, `${done}/${all.length}`)),
        h('div', { class: 'leg-body' },
          h('h3', {}, `${leg.name} · ${leg.place}`, leg.id === here.id ? h('em', {}, 'You are here') : null),
          h('p', { class: 'leg-plan' }, leg.plan),
          leg.save ? h('p', { class: 'leg-save' }, h('b', {}, 'Save: '), cited(ctx.data, leg.save)) : null,
          h('ul', { class: 'leg-trophies' }, sortTrophies(all, 'route').map((t) => {
            const masked = isMasked(t, ctx.progress);
            const earned = ctx.progress.earned.includes(t.id);
            const note = t.count ? `${money(t.count, t.unit)}${t.unit === '$' || t.unit === '%' ? '' : ` ${t.unit}`} · ${t.opens}` : t.opens;
            return h('li', { class: `${earned ? 'is-earned' : ''}${t.missable !== 'no' ? ' is-missable' : ''}` },
              h('button', { type: 'button', onclick: () => ctx.openTrophy(t.id) },
                medal(t.grade),
                h('span', {}, masked ? 'Story trophy (shielded)' : t.name, earned ? ' ✓' : '', h('small', {}, t.missable !== 'no' ? `Missable? · ${t.watch}` : note))));
          }))));
    })),
  );
}
