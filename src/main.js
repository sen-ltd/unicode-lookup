/**
 * main.js — DOM, events, and rendering for the Unicode Lookup tool.
 */

import {
  toCodepoint,
  fromCodepoint,
  formatCodepoint,
  parseCodepoint,
  toUTF8Bytes,
  toUTF16CodeUnits,
  toHTMLEntity,
  toCSSEscape,
  toJSEscape,
  getBlock,
  findBlocks,
  isEmoji,
  getCategory,
  getNormalizationForms,
} from './unicode.js';
import { BLOCKS } from './blocks.js';
import { t, currentLang } from './i18n.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let currentMode = 'char'; // 'char' | 'codepoint' | 'name' | 'block'
let currentTheme = 'light';
let selectedBlock = null;

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function $id(id) { return document.getElementById(id); }
function $qs(sel, el = document) { return el.querySelector(sel); }
function $qsa(sel, el = document) { return [...el.querySelectorAll(sel)]; }

function setText(id, text) {
  const el = $id(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = $id(id);
  if (el) el.innerHTML = html;
}

// ---------------------------------------------------------------------------
// i18n rendering
// ---------------------------------------------------------------------------

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  document.title = t('title');
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $id('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? t('lightTheme') : t('darkTheme');
  localStorage.setItem('ul-theme', theme);
}

// ---------------------------------------------------------------------------
// Copy to clipboard
// ---------------------------------------------------------------------------

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  }).catch(() => {
    // Fallback for environments without clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ---------------------------------------------------------------------------
// Info row builder
// ---------------------------------------------------------------------------

function makeInfoRow(label, value) {
  const row = document.createElement('div');
  row.className = 'info-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'info-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'info-value';
  valueEl.textContent = value;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = t('copy');
  copyBtn.setAttribute('aria-label', `Copy ${label}`);
  copyBtn.addEventListener('click', () => copyToClipboard(value, copyBtn));

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  row.appendChild(copyBtn);
  return row;
}

// ---------------------------------------------------------------------------
// Character display panel
// ---------------------------------------------------------------------------

function renderCharPanel(cp) {
  const panel = $id('char-panel');
  if (!panel) return;
  panel.style.display = '';

  // Large character display
  const charDisplay = $id('char-display');
  if (charDisplay) {
    charDisplay.textContent = fromCodepoint(cp);
    charDisplay.title = formatCodepoint(cp);
  }

  const infoGrid = $id('info-grid');
  if (!infoGrid) return;
  infoGrid.innerHTML = '';

  const utf8 = toUTF8Bytes(cp);
  const utf8Str = utf8.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

  const utf16 = toUTF16CodeUnits(cp);
  const utf16Str = utf16.map(u => '0x' + u.toString(16).toUpperCase().padStart(4, '0')).join(' ');

  const block = getBlock(cp) || '—';
  const category = getCategory(cp);

  const rows = [
    [t('codepoint'), formatCodepoint(cp)],
    [t('decimal'),   String(cp)],
    [t('hex'),       '0x' + cp.toString(16).toUpperCase()],
    [t('utf8Bytes'), utf8Str],
    [t('utf16Units'), utf16Str],
    [t('blockName'), block],
    [t('category'),  category],
    [t('htmlEntity'), toHTMLEntity(cp)],
    [t('cssEscape'),  toCSSEscape(cp)],
    [t('jsEscape'),   toJSEscape(cp)],
  ];

  rows.forEach(([label, value]) => {
    infoGrid.appendChild(makeInfoRow(label, value));
  });

  // Normalization section
  renderNormalization(fromCodepoint(cp));
}

// ---------------------------------------------------------------------------
// Normalization panel
// ---------------------------------------------------------------------------

function renderNormalization(str) {
  const section = $id('normalization-section');
  if (!section) return;
  section.style.display = '';

  const forms = getNormalizationForms(str);
  const container = $id('norm-grid');
  if (!container) return;
  container.innerHTML = '';

  const labels = {
    NFC:  t('nfcLabel'),
    NFD:  t('nfdLabel'),
    NFKC: t('nfkcLabel'),
    NFKD: t('nfkdLabel'),
  };

  Object.entries(forms).forEach(([formName, value]) => {
    const card = document.createElement('div');
    card.className = 'norm-card';

    const nameEl = document.createElement('div');
    nameEl.className = 'norm-name';
    nameEl.textContent = formName;

    const descEl = document.createElement('div');
    descEl.className = 'norm-desc';
    descEl.textContent = labels[formName];

    const charEl = document.createElement('div');
    charEl.className = 'norm-char';
    charEl.textContent = value;

    // Show codepoints of the normalized form
    const cps = [...value].map(ch => formatCodepoint(toCodepoint(ch))).join(' ');
    const cpEl = document.createElement('div');
    cpEl.className = 'norm-codepoints';
    cpEl.textContent = cps;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = t('copy');
    copyBtn.addEventListener('click', () => copyToClipboard(value, copyBtn));

    card.appendChild(nameEl);
    card.appendChild(descEl);
    card.appendChild(charEl);
    card.appendChild(cpEl);
    card.appendChild(copyBtn);
    container.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Hide panels
// ---------------------------------------------------------------------------

function hidePanels() {
  const panel = $id('char-panel');
  if (panel) panel.style.display = 'none';
  const normSection = $id('normalization-section');
  if (normSection) normSection.style.display = 'none';
  const results = $id('search-results');
  if (results) results.innerHTML = '';
  const blockBrowser = $id('block-browser');
  if (blockBrowser) blockBrowser.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Search modes
// ---------------------------------------------------------------------------

function handleCharMode(input) {
  if (!input) { hidePanels(); return; }
  try {
    const cp = toCodepoint(input);
    hidePanels();
    renderCharPanel(cp);
  } catch (e) {
    showError(e.message);
  }
}

function handleCodepointMode(input) {
  if (!input) { hidePanels(); return; }
  try {
    const cp = parseCodepoint(input);
    hidePanels();
    renderCharPanel(cp);
  } catch (e) {
    showError(t('invalidInput') + ' ' + e.message);
  }
}

function handleNameMode(input) {
  if (!input) {
    hidePanels();
    showMessage(t('enterToSearch'));
    return;
  }
  // Search by block name since we don't have the full Unicode name database
  const blocks = findBlocks(input);
  const resultsEl = $id('search-results');
  if (!resultsEl) return;
  hidePanels();
  resultsEl.innerHTML = '';

  if (blocks.length === 0) {
    showMessage(t('noResults'));
    return;
  }

  blocks.forEach(block => {
    const card = makeBlockResultCard(block);
    resultsEl.appendChild(card);
  });
}

function handleBlockMode() {
  hidePanels();
  renderBlockBrowser();
}

// ---------------------------------------------------------------------------
// Block browser
// ---------------------------------------------------------------------------

function renderBlockBrowser(filter = '') {
  const blockBrowser = $id('block-browser');
  if (!blockBrowser) return;
  blockBrowser.style.display = '';

  const filteredBlocks = filter
    ? BLOCKS.filter(b => b.name.toLowerCase().includes(filter.toLowerCase()))
    : BLOCKS;

  const list = $id('block-list');
  if (!list) return;
  list.innerHTML = '';

  filteredBlocks.forEach(block => {
    const item = document.createElement('div');
    item.className = 'block-item';
    if (selectedBlock && selectedBlock.name === block.name) {
      item.classList.add('selected');
    }

    const header = document.createElement('div');
    header.className = 'block-header';

    const nameEl = document.createElement('span');
    nameEl.className = 'block-name';
    nameEl.textContent = block.name;

    const rangeEl = document.createElement('span');
    rangeEl.className = 'block-range';
    rangeEl.textContent = `${formatCodepoint(block.start)}–${formatCodepoint(block.end)}`;

    const countEl = document.createElement('span');
    countEl.className = 'block-count';
    const count = block.end - block.start + 1;
    countEl.textContent = `${count} ${t('blockCharsLabel')}`;

    header.appendChild(nameEl);
    header.appendChild(rangeEl);
    header.appendChild(countEl);

    item.appendChild(header);

    // Character grid (show up to 96 chars)
    const grid = document.createElement('div');
    grid.className = 'char-grid';
    const maxChars = Math.min(count, 96);
    for (let i = 0; i < maxChars; i++) {
      const cp = block.start + i;
      try {
        const ch = fromCodepoint(cp);
        const cell = document.createElement('button');
        cell.className = 'char-cell';
        cell.textContent = ch;
        cell.title = formatCodepoint(cp);
        cell.addEventListener('click', () => {
          hidePanels();
          renderCharPanel(cp);
          // Scroll to info panel
          const panel = $id('char-panel');
          if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        grid.appendChild(cell);
      } catch (_) {
        // Skip invalid codepoints (surrogates, etc.)
      }
    }
    if (count > maxChars) {
      const more = document.createElement('span');
      more.className = 'char-grid-more';
      more.textContent = `+${count - maxChars} more…`;
      grid.appendChild(more);
    }

    item.appendChild(grid);
    list.appendChild(item);
  });
}

function makeBlockResultCard(block) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const name = document.createElement('div');
  name.className = 'result-name';
  name.textContent = block.name;

  const range = document.createElement('div');
  range.className = 'result-range';
  range.textContent = `${formatCodepoint(block.start)} – ${formatCodepoint(block.end)}`;

  card.appendChild(name);
  card.appendChild(range);
  card.addEventListener('click', () => {
    setMode('block');
    selectedBlock = block;
    renderBlockBrowser();
    // Scroll to that block
    setTimeout(() => {
      const items = document.querySelectorAll('.block-item.selected');
      if (items.length > 0) items[0].scrollIntoView({ behavior: 'smooth' });
    }, 100);
  });

  return card;
}

// ---------------------------------------------------------------------------
// Error / message display
// ---------------------------------------------------------------------------

function showError(msg) {
  const el = $id('search-results');
  if (!el) return;
  el.innerHTML = `<div class="message error">${escapeHtml(msg)}</div>`;
}

function showMessage(msg) {
  const el = $id('search-results');
  if (!el) return;
  el.innerHTML = `<div class="message">${escapeHtml(msg)}</div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Mode switching
// ---------------------------------------------------------------------------

function setMode(mode) {
  currentMode = mode;
  $qsa('.mode-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  const searchInput = $id('search-input');
  if (searchInput) {
    if (mode === 'block') {
      searchInput.style.display = 'none';
    } else {
      searchInput.style.display = '';
      // Update placeholder
      const placeholderKeys = {
        char: 'searchPlaceholder',
        codepoint: 'searchPlaceholder',
        name: 'searchPlaceholder',
      };
      searchInput.placeholder = t(placeholderKeys[mode] || 'searchPlaceholder');
    }
  }

  if (mode === 'block') {
    hidePanels();
    renderBlockBrowser();
  }
}

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

function handleSearch(value) {
  switch (currentMode) {
    case 'char':       handleCharMode(value); break;
    case 'codepoint':  handleCodepointMode(value); break;
    case 'name':       handleNameMode(value); break;
  }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function init() {
  // Theme
  const savedTheme = localStorage.getItem('ul-theme') || 'light';
  applyTheme(savedTheme);

  // Language
  const savedLang = localStorage.getItem('ul-lang') || 'en';
  currentLang(savedLang);
  applyTranslations();

  // Mode tabs
  $qsa('.mode-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      // Re-run search if there's input
      const input = $id('search-input');
      if (input && input.value && currentMode !== 'block') {
        handleSearch(input.value.trim());
      }
    });
  });

  // Search input
  const searchInput = $id('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value.trim());
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleSearch(e.target.value.trim());
      }
    });
  }

  // Block filter input
  const blockFilter = $id('block-filter');
  if (blockFilter) {
    blockFilter.addEventListener('input', (e) => {
      renderBlockBrowser(e.target.value.trim());
    });
  }

  // Theme toggle
  const themeToggle = $id('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });
  }

  // Language toggle
  const langToggle = $id('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const newLang = currentLang() === 'en' ? 'ja' : 'en';
      currentLang(newLang);
      localStorage.setItem('ul-lang', newLang);
      applyTranslations();
      // Re-render if there's active char panel
      const charDisplay = $id('char-display');
      if (charDisplay && charDisplay.textContent) {
        try {
          const cp = toCodepoint(charDisplay.textContent);
          renderCharPanel(cp);
        } catch (_) {}
      }
    });
  }

  // Set initial mode
  setMode('char');

  // Show default example
  hidePanels();
  showMessage(t('enterToSearch'));
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
