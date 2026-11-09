// News box on the home page, from the SAMUSE_news sheet (columns Text, Link,
// Picture, Until, Publish), as on the other sites. Used when the site is built,
// by the picture copies, and in the visitor's browser (to read the sheet live).
import { esc } from './dissemination.js';

// "File > Share > Publish to web > CSV" address. Empty = no news box yet.
export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS8k0pk1eL1fx9y6tPaiJXwpzephmFSk3unZOkuNdhaZVF9eudge_urTPYccwizHCFiSwLfxumt2MAU/pub?output=csv';

// The sheet's file id, from a Drive share link; empty for any other address.
export function driveId(link) {
  if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(link || '')) return '';
  const m = /\/d\/([-\w]+)/.exec(link) || /[?&]id=([-\w]+)/.exec(link);
  return m ? m[1] : '';
}
export const driveImageUrl = (id) => `https://drive.google.com/thumbnail?id=${id}&sz=w480`;

const webAddress = (s) => (/^https?:\/\//i.test(s) ? s : /^\//.test(s) ? s : /^[a-z][a-z0-9+.-]*:/i.test(s) ? '' : 'https://' + s);

// The last day an item shows: YYYY-MM-DD, or '' (the item simply stays up).
function untilDate(s) {
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export const current = (recs) => recs.filter((r) => !r.until || r.until >= today());

function parseRows(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ''));
}

// Throws when there is no Text column (an error page instead of the sheet),
// so that is not mistaken for a sheet with all its news removed.
export function recordsFromCSV(text) {
  const rows = parseRows(text);
  const header = (rows[0] || []).map((h) => String(h).trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  if (col('text') === -1) throw new Error('no Text column');
  return rows.slice(1).map((r) => {
    const get = (name) => String(r[col(name)] ?? '').trim();
    if (/^(n|no|false|0|hide)$/i.test(get('publish'))) return null;
    return {
      text: get('text').replace(/\s+/g, ' '),
      link: get('link') && webAddress(get('link')),
      picture: get('picture') && webAddress(get('picture')),
      until: untilDate(get('until')),
    };
  }).filter((r) => r && r.text);
}

// **word** in a cell shows in bold.
const textHtml = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

// A Drive picture loads from the site's own copy, made at the build. A picture
// added since then falls back to Drive, which needs no-referrer.
function pictureHtml(link) {
  if (!link) return '';
  const id = driveId(link);
  if (!id) return `<img class="news-picture" src="${esc(link)}" alt="" loading="lazy">`;
  return `<img class="news-picture" src="/news-pictures/${id}.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" ` +
    `onerror="this.onerror=null;this.src='${driveImageUrl(id)}'">`;
}

// The sheet's last row shows first, so a row added at the bottom tops the news.
// A link to this site itself (www.project-samuse.lu/…) stays on the current address.
const local = (u) => String(u || '').replace(/^https?:\/\/(www\.)?project-samuse\.lu(?=\/|$)/i, '') || (u ? '/' : '');

export function newsHtml(recs) {
  return [...recs].reverse().map((r) => {
    r = { ...r, link: local(r.link) };
    const ext = /^https?:/i.test(r.link || '');
    const see = r.link ? ` <a class="more" href="${esc(r.link)}"${ext ? ' target="_blank" rel="noopener"' : ''}>see here</a>` : '';
    return `<div class="news-item"><p>${textHtml(r.text)}${see}</p>${pictureHtml(r.picture)}</div>`;
  }).join('');
}
