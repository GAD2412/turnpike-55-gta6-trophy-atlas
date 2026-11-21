// Boot: load the trophy data, restore progress, wire the views, buttons and keyboard.
import { loadProgress, saveProgress, exportProgress, importProgress, toggleEarned, setCount, SPOILER_LEVELS } from './store.js';
import { defaultFilter, SPOILER_TEXT } from './filters.js';
import { renderQuickFilters, renderChecklist, visibleTrophies } from './checklist.js';
import { renderGuide } from './guide.js';
import { renderStrip, renderRoute } from './route.js';
import { renderOdometer, renderAudit, renderMissables, renderSources, renderFilterDialog, renderHelpDialog, renderPrintSheet } from './panels.js';

const $ = (id) => document.getElementById(id);
const VIEWS = ['tracker', 'route', 'missables', 'sources'];
const sourceFragment = () => /^#src-\d+$/.test(location.hash) ? location.hash.slice(1) : null;

async function loadData() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`data/trophies.json answered ${res.status}`);
  return res.json();
}

function showStatus(text) {
  $('saved').textContent = text;
}

function savedLabel(p) {
  if (!p.saved) return 'Progress auto-saves locally';
  const d = new Date(p.saved);
  return `Saved locally at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function boot(data) {
  const ctx = {
    data,
    progress: loadProgress(data.trophies),
    filter: defaultFilter(),
    selected: 28,
    view: sourceFragment() ? 'sources' : VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'tracker',
  };
  const byId = (id) => data.trophies.find((t) => t.id === id);

  function commit() {
    const saved = saveProgress(ctx.progress);
    showStatus(saved ? savedLabel(ctx.progress) : 'Not saved: this browser blocks storage. Use Export.');
    render();
    return saved;
  }

  function renderTracker() {
    renderQuickFilters($('quick'), ctx);
    renderChecklist($('list'), $('filter-state'), ctx);
    renderGuide($('guide'), byId(ctx.selected), ctx);
  }

  function render() {
    renderOdometer($('odometer'), ctx);
    renderAudit($('audit'), ctx);
    const shield = $('spoiler');
    shield.textContent = `Spoilers: ${SPOILER_TEXT[ctx.progress.spoiler]}`;
    shield.setAttribute('aria-pressed', String(ctx.progress.spoiler !== 'off'));
    renderStrip($('strip'), ctx);
    for (const b of document.querySelectorAll('.tabs [data-view]')) b.setAttribute('aria-selected', String(b.dataset.view === ctx.view));
    for (const v of document.querySelectorAll('main .view')) v.hidden = v.dataset.view !== ctx.view;
    document.body.dataset.view = ctx.view;
    if (ctx.view === 'tracker') renderTracker();
    if (ctx.view === 'route') renderRoute($('route'), ctx);
    if (ctx.view === 'missables') renderMissables($('missables'), ctx);
    if (ctx.view === 'sources') renderSources($('sources'), ctx);
  }

  function setView(view) {
    ctx.view = view;
    history.replaceState(null, '', `#${view}`);
    render();
  }

  function focusSource(id) {
    const row = $(id);
    row?.focus({ preventScroll: true });
    row?.scrollIntoView({ block: 'center' });
  }

  Object.assign(ctx, {
    select(id) {
      const activeRow = document.activeElement?.closest('.row-main');
      ctx.selected = id;
      render();
      const row = document.querySelector(`.row[data-id="${id}"]`);
      if (activeRow) row?.querySelector('.row-main').focus({ preventScroll: true });
      row?.scrollIntoView({ block: 'nearest' });
      $('guide').scrollTop = 0;
    },
    openTrophy(id) {
      ctx.selected = id;
      setView('tracker');
      $('guide').scrollTop = 0;
      $('guide').focus({ preventScroll: true });
      document.querySelector(`.row[data-id="${id}"]`)?.scrollIntoView({ block: 'center' });
    },
    toggle(id, on) {
      toggleEarned(ctx.progress, id, on);
      commit();
    },
    reveal(id) {
      ctx.progress.revealed = [...new Set([...ctx.progress.revealed, id])];
      commit();
    },
    setCount(id, n) {
      setCount(ctx.progress, byId(id), n);
      commit();
    },
    setSpoiler(level) {
      ctx.progress.spoiler = level;
      ctx.progress.revealed = [];
      commit();
    },
    setQuick(key) {
      ctx.filter.quick = key;
      render();
    },
    filterLeg(leg) {
      ctx.filter.leg = ctx.filter.leg === leg ? 0 : leg;
      setView('tracker');
    },
    applyFilter() {
      render();
    },
    clearFilters() {
      ctx.filter = defaultFilter();
      $('q').value = '';
      render();
    },
    openFilters() {
      renderFilterDialog($('filters'), ctx);
      $('filters').showModal();
    },
  });

  function moveSelection(delta) {
    const list = visibleTrophies(ctx);
    if (!list.length) return;
    const i = list.findIndex((t) => t.id === ctx.selected);
    ctx.select(list[Math.max(0, Math.min(list.length - 1, (i < 0 ? -1 : i) + delta))].id);
  }

  function cycleSpoiler() {
    const i = SPOILER_LEVELS.indexOf(ctx.progress.spoiler);
    ctx.setSpoiler(SPOILER_LEVELS[(i + 1) % SPOILER_LEVELS.length]);
  }

  function doExport() {
    const n = exportProgress(ctx.progress, data.trophies);
    showStatus(`Exported ${n} earned trophies to a file`);
  }

  $('spoiler').addEventListener('click', cycleSpoiler);
  $('export').addEventListener('click', doExport);
  $('print').addEventListener('click', () => window.print());
  $('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      ctx.progress = await importProgress(file, data.trophies);
      if (commit()) showStatus(`Imported ${ctx.progress.earned.length} earned trophies`);
    } catch (err) {
      showStatus(err.message);
    }
    e.target.value = '';
  });
  $('q').addEventListener('input', (e) => {
    ctx.filter.q = e.target.value;
    renderTracker();
  });
  $('all-filters').addEventListener('click', ctx.openFilters);
  for (const b of document.querySelectorAll('.tabs [data-view]')) b.addEventListener('click', () => setView(b.dataset.view));
  window.addEventListener('hashchange', () => {
    const source = sourceFragment();
    const view = source ? 'sources' : location.hash.slice(1);
    ctx.view = VIEWS.includes(view) ? view : 'tracker';
    render();
    if (source) focusSource(source);
  });
  $('filters').addEventListener('close', render);
  window.addEventListener('beforeprint', () => renderPrintSheet($('print-sheet'), ctx));

  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const typing = e.target.closest?.('input, textarea, select');
    if (e.key === 'Escape' && e.target === $('q')) {
      $('q').value = '';
      ctx.filter.q = '';
      $('q').blur();
      renderTracker();
      return;
    }
    if (typing || document.querySelector('dialog[open]')) return;
    const t = byId(ctx.selected);
    const keys = {
      '/': () => { setView('tracker'); $('q').focus(); },
      f: () => ctx.openFilters(),
      j: () => moveSelection(1),
      ArrowDown: () => moveSelection(1),
      k: () => moveSelection(-1),
      ArrowUp: () => moveSelection(-1),
      x: () => ctx.toggle(ctx.selected),
      '+': () => t.count && ctx.setCount(t.id, (ctx.progress.counts[t.id] || 0) + 1),
      '-': () => t.count && ctx.setCount(t.id, (ctx.progress.counts[t.id] || 0) - 1),
      h: cycleSpoiler,
      t: () => setView('tracker'),
      r: () => setView('route'),
      m: () => setView('missables'),
      s: () => setView('sources'),
      e: doExport,
      p: () => window.print(),
      '?': () => { renderHelpDialog($('help')); $('help').showModal(); },
    };
    const run = keys[e.key] || keys[e.key.toLowerCase?.()];
    if (!run || (e.key.startsWith('Arrow') && ctx.view !== 'tracker')) return;
    e.preventDefault();
    run();
  });

  showStatus(savedLabel(ctx.progress));
  render();
  if (sourceFragment()) focusSource(sourceFragment());
}

loadData().then(boot).catch((err) => {
  document.getElementById('guide').textContent = `The trophy data did not load (${err.message}). Serve the app/ folder with a static server, for example node serve.ts, then reload.`;
});
