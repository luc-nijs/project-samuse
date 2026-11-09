// Dissemination: Publications, Lectures/Presentations and Events come from three
// published Google Sheets (filled in the sheets themselves or through the Content Desk).
// Used when the site is built and again in the visitor's browser, which reads the
// sheets live, so a new row shows without waiting for the daily rebuild.

// "File > Share > Publish to web > CSV" addresses. Empty = use the copy in src/data.
export const SHEETS = {
  publications: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRRPgBIoK4RGhpAi7bi8Xrq51OiMBMexEeUfZBprxbCLmo99XGFFvQkuKO8wd5u9C-vm9VyQB1JlaqR/pub?output=csv',
  lectures: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzqeC2WuT5bUWJ4vWmEs8JnphCPYEGD_3RHx7hz64IFQX47wAPIDqp7KLkeyAsT1i0KL7c0Jpz7hU9/pub?output=csv',
  events: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQjGCtN5AWwnSLIM_QGvgEW4pWTBZuvE2yskFEVSNfUgNsUeGegGWacscc7sJjLaXzDiBZT0sIEOAia/pub?output=csv',
};

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
  return rows
    .filter((r) => r.some((v) => v.trim() !== ''))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])))
    .filter((r) => !/^(no|n|false|0)$/i.test(r.publish || ''));
}

export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONTHS = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

// 2026-02-07 + 2026-02-08 -> "Feb 7-8, 2026", as written on the Wix page.
export function dateLabel(start, end) {
  const p = (s) => {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s || '');
    return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
  };
  const a = p(start), b = p(end);
  if (!a) return esc(start);
  if (!b || (b.y === a.y && b.m === a.m && b.d === a.d)) return `${MONTHS[a.m]} ${a.d}, ${a.y}`;
  if (b.y === a.y && b.m === a.m) return `${MONTHS[a.m]} ${a.d}-${b.d}, ${a.y}`;
  if (b.y === a.y) return `${MONTHS[a.m]} ${a.d} - ${MONTHS[b.m]} ${b.d}, ${a.y}`;
  return `${MONTHS[a.m]} ${a.d}, ${a.y} - ${MONTHS[b.m]} ${b.d}, ${b.y}`;
}

const link = (href, text) => {
  const ext = /^https?:/i.test(href);
  return `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
};
const end = (s) => (/[.!?"”]$/.test(s) ? s : s + '.');

function publication(r) {
  let venue = '';
  if (r.venue) {
    const lead = /^In /.test(r.venue) ? 'In ' : '';
    const name = r.venue.slice(lead.length);
    const italic = /journal/i.test(r.type) || /^Proceedings/i.test(name);
    venue = lead + (italic ? `<i>${esc(name)}</i>` : esc(name));
    if (r.details) venue += (/^\(/.test(r.details) ? ' ' : ', ') + esc(r.details);
    venue = ' ' + end(venue);
  }
  const year = r.status && !/^published$/i.test(r.status) ? r.status : (r.year || 'n.d.');
  let out = `${esc(r.authors)} (${esc(year)}). ${esc(end(r.title))}${venue}`;
  if (r.doi) {
    const url = /^https?:/.test(r.doi) ? r.doi : 'https://doi.org/' + r.doi;
    out += ' ' + link(url, esc(url));
  } else if (r.url) out += ' ' + link(r.url, esc(r.url));
  return `<p class="item">${out}</p>`;
}

function lecture(r) {
  const what = (r.kind ? esc(r.kind) + ' at ' : '') + (r.url ? link(r.url, esc(r.occasion)) : esc(r.occasion));
  const title = r.title ? `: "${esc(r.title)}"` : '';
  return `<p class="item"><span class="date">${dateLabel(r.date, r.end)}</span> ⎸ ${esc(r.speaker)}${r.speaker ? ' - ' : ''}${what}${title}</p>`;
}

function event(r) {
  return `<p class="item"><span class="date">${dateLabel(r.date, r.end)}</span> ⎸ ${esc(r.title)}${r.url ? ' ' + link(r.url, '🔗') : ''}</p>`;
}

const byDate = (a, b) => String(b.date).localeCompare(String(a.date));
// Newest year first; within a year the order of the sheet stays.
const byYear = (a, b) => (parseInt(b.year, 10) || 9999) - (parseInt(a.year, 10) || 9999);

// ---------- publications filter bar (as on lucnijs.be, without Role) ----------
export const TYPE_ORDER = ['journal article', 'book', 'book chapter', 'conference paper',
  'editorial', 'professional article', 'report', 'thesis'];
export const TYPE_LABEL = {
  'journal article': 'Journal articles',
  book: 'Books',
  'book chapter': 'Book chapters',
  'conference paper': 'Conference papers',
  editorial: 'Editorials',
  'professional article': 'Professional and practitioner articles',
  report: 'Reports',
  thesis: 'Theses',
};
const typeOf = (r) => String(r.type || '').toLowerCase();

// Grouped list: mode 'year' (newest first) or 'type'.
export function publicationsHtml(recs, mode = 'year') {
  const buckets = new Map();
  for (const r of recs) {
    const k = mode === 'type' ? (typeOf(r) || 'other') : (/^\d{4}/.test(r.year) ? r.year.slice(0, 4) : 'Undated / forthcoming');
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(r);
  }
  const keys = [...buckets.keys()].sort(mode === 'type'
    ? (a, b) => (TYPE_ORDER.indexOf(a) + 1 || 99) - (TYPE_ORDER.indexOf(b) + 1 || 99)
    : (a, b) => (!/^\d/.test(a) ? -1 : !/^\d/.test(b) ? 1 : Number(b) - Number(a)));
  const out = [];
  for (const k of keys) {
    const items = buckets.get(k).sort(byYear);
    const label = mode === 'type' ? (TYPE_LABEL[k] || k) : k;
    out.push(`<p class="group">${esc(label)} <span>${items.length}</span></p>`);
    out.push(items.map(publication).join(''));
  }
  return out.join('') || '<p class="item none">Nothing matches these filters.</p>';
}

export function filterPublications(recs, { type = '', from = 0, to = 9999, q = '' } = {}) {
  q = q.trim().toLowerCase();
  return recs.filter((r) => {
    if (type && typeOf(r) !== type) return false;
    const y = parseInt(r.year, 10);
    if (y && (y < from || y > to)) return false;   // undated items always stay
    if (q && ![r.authors, r.title, r.venue, r.details, r.type, r.year, r.doi].join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}

export function countText(recs) {
  const withDoi = recs.filter((r) => r.doi).length;
  return `${recs.length} publication${recs.length === 1 ? '' : 's'} · ${withDoi} with DOI`;
}

export function renderAll({ publications, lectures, events }) {
  return {
    publications: publicationsHtml(publications, 'year'),
    lectures: [...lectures].sort(byDate).map(lecture).join(''),
    events: [...events].sort(byDate).map(event).join(''),
  };
}
