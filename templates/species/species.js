/*
 * Species template
 *
 * Turn it on with a Metadata table in the doc:  | Template | species |
 *
 * What the template does, so authors don't have to:
 *  1. Builds the hero from the first image + the H1 at the top of the page.
 *  2. Looks up this page in the /species sheet and adds the
 *     "Latest fishing regulations" link plus any other facts in that row
 *     (Season, Size Limit, Bag Limit... any extra column shows up).
 *     Falls back to a `Regulations` metadata value if the page isn't in the sheet.
 */
import { buildBlock, getMetadata } from '../../scripts/aem.js';

const SHEET = '/species.json';
const SKIP_COLUMNS = ['path', 'regulations'];

function normalizePath(path) {
  return (path || '').trim().toLowerCase().replace(/\/$/, '');
}

function buildHero(main) {
  // author already added a Hero table: use it as-is
  if (main.querySelector('div.hero')) return true;

  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  if (!h1 || !picture) return false;

  // only when the image comes before the heading, like a classic hero
  // eslint-disable-next-line no-bitwise
  if (!(h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) return false;

  const pictureParent = picture.parentElement;
  const section = document.createElement('div');
  section.append(buildBlock('hero', { elems: [picture, h1] }));
  main.prepend(section);

  // don't leave an empty paragraph behind where the image was
  if (pictureParent && pictureParent.tagName === 'P' && !pictureParent.textContent.trim()) {
    pictureParent.remove();
  }
  return true;
}

async function fetchSpeciesRow() {
  try {
    const resp = await fetch(SHEET);
    if (!resp.ok) return null;
    const json = await resp.json();
    // single-sheet files use `data`; multi-sheet files nest it under the sheet name
    const rows = json.data || (json.species && json.species.data) || [];
    const here = normalizePath(window.location.pathname);
    return rows.find((row) => normalizePath(row.Path || row.path) === here) || null;
  } catch (e) {
    return null;
  }
}

function buildRegulationsLink(url) {
  const p = document.createElement('p');
  p.className = 'button-wrapper species-regulations';
  const a = document.createElement('a');
  a.href = url;
  a.className = 'button primary';
  a.textContent = 'Latest fishing regulations';
  if (new URL(url, window.location).origin !== window.location.origin) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  p.append(a);
  return p;
}

function buildFacts(row) {
  const entries = Object.entries(row)
    .filter(([key, value]) => !SKIP_COLUMNS.includes(key.toLowerCase()) && `${value}`.trim());
  if (!entries.length) return null;

  const dl = document.createElement('dl');
  dl.className = 'species-facts';
  entries.forEach(([key, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  });
  return dl;
}

async function addSpeciesInfo(target) {
  const row = await fetchSpeciesRow();
  const regulations = (row && (row.Regulations || row.regulations)) || getMetadata('regulations');

  const info = document.createElement('div');
  info.className = 'species-info';
  if (regulations) info.append(buildRegulationsLink(regulations));
  const facts = row && buildFacts(row);
  if (facts) info.append(facts);

  if (!info.children.length) return;
  // by now the section is decorated; sit inside its content wrapper for width/padding
  const wrapper = target.querySelector(':scope > .default-content-wrapper');
  if (wrapper) wrapper.prepend(info);
  else target.prepend(info);
}

/**
 * Runs before the page is decorated (see loadTemplate in scripts.js),
 * so anything built here gets decorated like authored content.
 * @param {Element} main The main element
 */
export default function decorate(main) {
  buildHero(main);

  // first section with something besides the hero holds the fish info;
  // facts go at its top. Fetched without awaiting so it never delays
  // the hero image (LCP).
  const content = [...main.children]
    .find((section) => [...section.children].some((el) => !el.classList.contains('hero')));
  if (content) addSpeciesInfo(content);
}
