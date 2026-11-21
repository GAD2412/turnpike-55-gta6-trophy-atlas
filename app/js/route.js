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

function completionPlan(ctx) {
  const { completionGoals, completionChecklist, trophies } = ctx.data;
  const goalCount = completionGoals.length + completionChecklist.reduce((n, group) => n + group.goals.length, 0);
  const longRoad = trophies.find((t) => t.id === 14);
  const groups = completionChecklist.map(({ label, goals }) => h('section', {},
    h('h4', {}, label),
    h('ul', {}, goals.map((goal) => h('li', {}, goal)))));
  return h('section', { class: 'completion-plan', 'aria-labelledby': 'completion-title' },
    h('div', { class: 'completion-intro' },
      h('h3', { id: 'completion-title' }, h('button', { type: 'button', class: 'link', onclick: () => ctx.openTrophy(longRoad.id) }, medal(longRoad.grade), ` ${longRoad.name} · 100%`)),
      h('p', {}, cited(ctx.data, 'Scan vehicles and study animals as you go. After the credits, open Progress › Stats › 100% Completion. [2]', true))),
    h('ul', { class: 'goal-pairs', 'aria-label': 'Trophy and game completion targets' }, completionGoals.map((goal) => {
      const t = trophies.find((t) => t.id === goal.trophy);
      return h('li', {},
        h('button', { type: 'button', class: 'link', onclick: () => ctx.openTrophy(t.id), title: t.name }, goal.label),
        h('p', {}, h('b', {}, t.count), ' trophy ', h('span', { 'aria-hidden': 'true' }, '→'), ' ', h('strong', {}, `${goal.target}/${goal.available}`), ' for 100% ', cited(ctx.data, goal.sources)));
    })),
    h('details', { class: 'completion-details' },
      h('summary', {}, `All ${goalCount} requirements for 100%`),
      h('p', {}, cited(ctx.data, 'Use the paired targets above for cards, stunts and challenges. Check the rest by category in the game. [2][31]', true)),
      h('div', { class: 'completion-groups' }, groups)));
}

export function renderRoute(el, ctx) {
  const here = currentLeg(ctx);
  el.replaceChildren(
    h('header', { class: 'route-head' },
      h('h2', {}, `Platinum route · ${ctx.data.legs.length} legs, ${ctx.data.trophies.length} trophies`),
      h('p', {}, cited(ctx.data, 'One playthrough, about 200 hours. Save before Tourist Trap and at each chapter break. Free roam returns after the story. [1][29]', true))),
    completionPlan(ctx),
    h('ol', { class: 'legs' }, ctx.data.legs.map((leg) => {
      const { all, done } = legStats(ctx, leg);
      return h('li', { class: `leg${leg.id === here.id ? ' is-here' : ''}` },
        h('div', { class: 'leg-side' },
          h('span', { class: 'leg-shield' }, String(leg.id)),
          h('span', { class: 'leg-done' }, `${done}/${all.length}`)),
        h('div', { class: 'leg-body' },
          h('h3', {}, `${leg.name} · ${leg.place}`, leg.id === here.id ? h('em', {}, 'You are here') : null),
          h('p', { class: 'leg-plan' }, cited(ctx.data, leg.plan)),
          leg.save ? h('p', { class: 'leg-save' }, h('b', {}, 'Save: '), cited(ctx.data, leg.save)) : null,
          h('ul', { class: 'leg-trophies' }, sortTrophies(all, 'route').map((t) => {
            const masked = isMasked(t, ctx.progress);
            const earned = ctx.progress.earned.includes(t.id);
            const target = t.count ? `${money(t.count, t.unit)}${t.unit === '$' || t.unit === '%' ? '' : ` ${t.unit}`}` : t.description;
            const note = masked ? 'Reveal in Tracker' : target;
            return h('li', { class: `${earned ? 'is-earned' : ''}${t.missable !== 'no' ? ' is-missable' : ''}` },
              h('button', { type: 'button', onclick: () => ctx.openTrophy(t.id) },
                medal(t.grade),
                h('span', {}, masked ? `${t.kind === 'story' ? 'Story' : 'Hidden'} trophy (shielded)` : t.name,
                  earned ? ' ✓' : '', h('small', {}, note),
                  !masked && t.deadline ? h('small', { class: 'route-deadline' }, t.watch) : null)));
          }))));
    })),
  );
}
