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

export function renderAll({ publications, lectures, events }) {
  return {
    publications: [...publications].sort(byYear).map(publication).join(''),
    lectures: [...lectures].sort(byDate).map(lecture).join(''),
    events: [...events].sort(byDate).map(event).join(''),
  };
}
