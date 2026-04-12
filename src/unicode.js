/**
 * unicode.js — Pure Unicode logic: codepoint conversions, UTF encoding, escapes.
 */

import { BLOCKS } from './blocks.js';

// ---------------------------------------------------------------------------
// Codepoint extraction / generation
// ---------------------------------------------------------------------------

/**
 * Return the first codepoint of a string (handles surrogate pairs).
 * @param {string} str
 * @returns {number}
 */
export function toCodepoint(str) {
  if (!str || str.length === 0) throw new RangeError('Empty string');
  const cp = str.codePointAt(0);
  if (cp === undefined) throw new RangeError('Cannot extract codepoint');
  return cp;
}

/**
 * Return the string for a given codepoint.
 * @param {number} cp
 * @returns {string}
 */
export function fromCodepoint(cp) {
  validateCodepoint(cp);
  return String.fromCodePoint(cp);
}

// ---------------------------------------------------------------------------
// Formatting / parsing
// ---------------------------------------------------------------------------

/**
 * Format a codepoint as "U+XXXX" (at least 4 hex digits).
 * @param {number} cp
 * @returns {string}
 */
export function formatCodepoint(cp) {
  validateCodepoint(cp);
  const hex = cp.toString(16).toUpperCase();
  return 'U+' + hex.padStart(4, '0');
}

/**
 * Parse a codepoint from multiple formats:
 *   "U+1F600", "u+1f600", "0x1F600", "0X1F600",
 *   "1F600" (hex without prefix), "128512" (decimal)
 * @param {string} str
 * @returns {number}
 */
export function parseCodepoint(str) {
  if (typeof str !== 'string') throw new TypeError('Expected string');
  const s = str.trim();

  let value;

  if (/^[Uu]\+([0-9A-Fa-f]+)$/.test(s)) {
    // U+XXXX format
    value = parseInt(s.slice(2), 16);
  } else if (/^0[Xx]([0-9A-Fa-f]+)$/.test(s)) {
    // 0x / 0X prefix
    value = parseInt(s.slice(2), 16);
  } else if (/^[0-9A-Fa-f]+$/.test(s) && /[A-Fa-f]/.test(s)) {
    // Hex string (must contain at least one hex letter to distinguish from decimal)
    value = parseInt(s, 16);
  } else if (/^\d+$/.test(s)) {
    // Decimal
    value = parseInt(s, 10);
  } else {
    throw new RangeError(`Cannot parse codepoint: "${str}"`);
  }

  validateCodepoint(value);
  return value;
}

// ---------------------------------------------------------------------------
// UTF-8 encoding
// ---------------------------------------------------------------------------

/**
 * Encode a codepoint to its UTF-8 bytes (1–4 bytes).
 * @param {number} cp
 * @returns {number[]} Array of byte values
 */
export function toUTF8Bytes(cp) {
  validateCodepoint(cp);
  if (cp <= 0x7F) {
    return [cp];
  } else if (cp <= 0x7FF) {
    return [
      0xC0 | (cp >> 6),
      0x80 | (cp & 0x3F),
    ];
  } else if (cp <= 0xFFFF) {
    return [
      0xE0 | (cp >> 12),
      0x80 | ((cp >> 6) & 0x3F),
      0x80 | (cp & 0x3F),
    ];
  } else {
    // cp <= 0x10FFFF
    return [
      0xF0 | (cp >> 18),
      0x80 | ((cp >> 12) & 0x3F),
      0x80 | ((cp >> 6) & 0x3F),
      0x80 | (cp & 0x3F),
    ];
  }
}

// ---------------------------------------------------------------------------
// UTF-16 encoding
// ---------------------------------------------------------------------------

/**
 * Encode a codepoint to its UTF-16 code units (1 or 2 units).
 * @param {number} cp
 * @returns {number[]} Array of 16-bit code unit values
 */
export function toUTF16CodeUnits(cp) {
  validateCodepoint(cp);
  if (cp <= 0xFFFF) {
    return [cp];
  }
  // Surrogate pair calculation
  const adjusted = cp - 0x10000;
  const high = 0xD800 + (adjusted >> 10);
  const low  = 0xDC00 + (adjusted & 0x3FF);
  return [high, low];
}

// ---------------------------------------------------------------------------
// Escape sequences
// ---------------------------------------------------------------------------

/**
 * Return an HTML numeric character reference, e.g. "&#x1F600;".
 * @param {number} cp
 * @returns {string}
 */
export function toHTMLEntity(cp) {
  validateCodepoint(cp);
  return '&#x' + cp.toString(16).toUpperCase() + ';';
}

/**
 * Return a CSS escape sequence, e.g. "\\1F600 ".
 * Note: CSS escapes a space after to terminate the sequence when needed.
 * @param {number} cp
 * @returns {string}
 */
export function toCSSEscape(cp) {
  validateCodepoint(cp);
  return '\\' + cp.toString(16).toUpperCase();
}

/**
 * Return a JavaScript escape sequence.
 * - BMP: "\\uXXXX"
 * - Supplementary: "\\u{XXXXX}" (modern ES6+)
 * @param {number} cp
 * @returns {string}
 */
export function toJSEscape(cp) {
  validateCodepoint(cp);
  if (cp <= 0xFFFF) {
    return '\\u' + cp.toString(16).toUpperCase().padStart(4, '0');
  }
  return '\\u{' + cp.toString(16).toUpperCase() + '}';
}

// ---------------------------------------------------------------------------
// Block lookup
// ---------------------------------------------------------------------------

/**
 * Return the block name containing codepoint cp, or null if not in any block.
 * @param {number} cp
 * @returns {string|null}
 */
export function getBlock(cp) {
  validateCodepoint(cp);
  const block = BLOCKS.find(b => cp >= b.start && cp <= b.end);
  return block ? block.name : null;
}

/**
 * Return blocks whose names contain the query string (case-insensitive).
 * @param {string} query
 * @returns {Array<{name:string, start:number, end:number}>}
 */
export function findBlocks(query) {
  if (typeof query !== 'string') return [];
  const q = query.toLowerCase();
  return BLOCKS.filter(b => b.name.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// Emoji detection
// ---------------------------------------------------------------------------

/**
 * Check whether a codepoint is in a common emoji range.
 * Covers the major Unicode emoji blocks defined in Unicode Standard.
 * @param {number} cp
 * @returns {boolean}
 */
export function isEmoji(cp) {
  validateCodepoint(cp);
  return (
    // Emoticons
    (cp >= 0x1F600 && cp <= 0x1F64F) ||
    // Miscellaneous Symbols and Pictographs
    (cp >= 0x1F300 && cp <= 0x1F5FF) ||
    // Transport and Map Symbols
    (cp >= 0x1F680 && cp <= 0x1F6FF) ||
    // Supplemental Symbols and Pictographs
    (cp >= 0x1F900 && cp <= 0x1F9FF) ||
    // Symbols and Pictographs Extended-A
    (cp >= 0x1FA00 && cp <= 0x1FA6F) ||
    // Miscellaneous Symbols (subset used as emoji)
    (cp >= 0x2600 && cp <= 0x26FF) ||
    // Dingbats
    (cp >= 0x2700 && cp <= 0x27BF) ||
    // Enclosed Alphanumeric Supplement
    (cp >= 0x1F100 && cp <= 0x1F1FF) ||
    // Mahjong tile
    cp === 0x1F004 ||
    // Playing Cards
    (cp >= 0x1F0A0 && cp <= 0x1F0FF) ||
    // Enclosed Ideographic Supplement
    (cp >= 0x1F200 && cp <= 0x1F2FF)
  );
}

// ---------------------------------------------------------------------------
// Unicode general category (simplified)
// ---------------------------------------------------------------------------

/**
 * Return a simplified category label for a codepoint.
 * Uses JavaScript's own Unicode property escapes where available,
 * with a manual fallback for broader ranges.
 * @param {number} cp
 * @returns {string}
 */
export function getCategory(cp) {
  validateCodepoint(cp);
  if (isEmoji(cp)) return 'Emoji';
  const ch = String.fromCodePoint(cp);
  if (/^\p{L}$/u.test(ch)) return 'Letter';
  if (/^\p{N}$/u.test(ch)) return 'Number';
  if (/^\p{P}$/u.test(ch)) return 'Punctuation';
  if (/^\p{S}$/u.test(ch)) return 'Symbol';
  if (/^\p{Z}$/u.test(ch)) return 'Separator';
  if (/^\p{C}$/u.test(ch)) return 'Control / Format';
  if (/^\p{M}$/u.test(ch)) return 'Mark';
  return 'Other';
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Return all four Unicode normalization forms for a string.
 * @param {string} str
 * @returns {{ NFC: string, NFD: string, NFKC: string, NFKD: string }}
 */
export function getNormalizationForms(str) {
  return {
    NFC:  str.normalize('NFC'),
    NFD:  str.normalize('NFD'),
    NFKC: str.normalize('NFKC'),
    NFKD: str.normalize('NFKD'),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function validateCodepoint(cp) {
  if (!Number.isInteger(cp) || cp < 0 || cp > 0x10FFFF) {
    throw new RangeError(`Invalid codepoint: ${cp}`);
  }
  // Surrogates (0xD800–0xDFFF) are not valid scalar values
  if (cp >= 0xD800 && cp <= 0xDFFF) {
    throw new RangeError(`Surrogate codepoint not allowed: 0x${cp.toString(16).toUpperCase()}`);
  }
}
