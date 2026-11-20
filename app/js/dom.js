// Small DOM helpers shared by every view: element builder, citation chips, grade medals.

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : String(kid));
  return el;
}

export function sourceById(data, id) {
  return data.sources.find((s) => s.id === id);
}

export function citeChip(data, id) {
  const s = sourceById(data, id);
  return h('a', { class: 'cite', href: `#src-${id}`, title: s ? `${s.site}: ${s.title} (${dateLabel(s.published)}, read ${dateLabel(s.read)})` : `Source ${id}` }, String(id));
}

// Text with [n] markers becomes text with source chips; the marker numbers index data.sources.
export function cited(data, text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(/\s*\[(\d+)\]/g)) {
    frag.append(text.slice(last, m.index));
    frag.append(citeChip(data, Number(m[1])));
    last = m.index + m[0].length;
  }
  frag.append(text.slice(last));
  return frag;
}

export function citesIn(text) {
  return [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
}

// Every source a trophy's guide leans on, the official list [5] always first.
export function trophySources(t) {
  const all = [t.guide, ...t.steps, t.differ ? `${t.differ.a} ${t.differ.b}` : ''].flatMap(citesIn);
  return [5, ...new Set(all.filter((n) => n !== 5))];
}

export function medal(grade) {
  return h('span', { class: `medal m-${grade}`, title: grade }, grade[0].toUpperCase());
}

export function dateLabel(iso) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso || '')) return iso || '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;
}

export function money(n, unit) {
  return unit === '$' ? `$${n.toLocaleString('en-US')}` : unit === '%' ? `${n}%` : n.toLocaleString('en-US');
}
