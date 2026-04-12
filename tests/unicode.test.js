/**
 * unicode.test.js — Tests for src/unicode.js
 * Run: node --test tests/unicode.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

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
} from '../src/unicode.js';

// ---------------------------------------------------------------------------
// toCodepoint
// ---------------------------------------------------------------------------
test('toCodepoint: ASCII letter', () => {
  assert.equal(toCodepoint('A'), 65);
});

test('toCodepoint: emoji via surrogate pair', () => {
  assert.equal(toCodepoint('😀'), 0x1F600);
});

test('toCodepoint: Hiragana あ', () => {
  assert.equal(toCodepoint('あ'), 0x3042);
});

test('toCodepoint: takes only first char', () => {
  assert.equal(toCodepoint('Hello'), 72); // H
});

test('toCodepoint: throws on empty string', () => {
  assert.throws(() => toCodepoint(''), /Empty string/);
});

// ---------------------------------------------------------------------------
// fromCodepoint
// ---------------------------------------------------------------------------
test('fromCodepoint: 65 → A', () => {
  assert.equal(fromCodepoint(65), 'A');
});

test('fromCodepoint: emoji', () => {
  assert.equal(fromCodepoint(0x1F600), '😀');
});

test('fromCodepoint: max codepoint 0x10FFFF', () => {
  assert.equal(typeof fromCodepoint(0x10FFFF), 'string');
});

test('fromCodepoint: throws for negative', () => {
  assert.throws(() => fromCodepoint(-1));
});

test('fromCodepoint: throws for surrogate 0xD800', () => {
  assert.throws(() => fromCodepoint(0xD800));
});

// ---------------------------------------------------------------------------
// formatCodepoint
// ---------------------------------------------------------------------------
test('formatCodepoint: 65 → U+0041', () => {
  assert.equal(formatCodepoint(65), 'U+0041');
});

test('formatCodepoint: 0x3042 → U+3042', () => {
  assert.equal(formatCodepoint(0x3042), 'U+3042');
});

test('formatCodepoint: 0x1F600 → U+1F600', () => {
  assert.equal(formatCodepoint(0x1F600), 'U+1F600');
});

test('formatCodepoint: 0 → U+0000', () => {
  assert.equal(formatCodepoint(0), 'U+0000');
});

// ---------------------------------------------------------------------------
// parseCodepoint
// ---------------------------------------------------------------------------
test('parseCodepoint: U+1F600 format', () => {
  assert.equal(parseCodepoint('U+1F600'), 0x1F600);
});

test('parseCodepoint: u+1f600 (lowercase)', () => {
  assert.equal(parseCodepoint('u+1f600'), 0x1F600);
});

test('parseCodepoint: 0x1F600 format', () => {
  assert.equal(parseCodepoint('0x1F600'), 0x1F600);
});

test('parseCodepoint: 0X1F600 format (uppercase X)', () => {
  assert.equal(parseCodepoint('0X1F600'), 0x1F600);
});

test('parseCodepoint: plain hex 1F600', () => {
  assert.equal(parseCodepoint('1F600'), 0x1F600);
});

test('parseCodepoint: decimal 128512 (😀)', () => {
  assert.equal(parseCodepoint('128512'), 0x1F600);
});

test('parseCodepoint: decimal 65 (A)', () => {
  assert.equal(parseCodepoint('65'), 65);
});

test('parseCodepoint: U+0041', () => {
  assert.equal(parseCodepoint('U+0041'), 65);
});

test('parseCodepoint: throws on garbage', () => {
  assert.throws(() => parseCodepoint('hello world'));
});

test('parseCodepoint: throws on out-of-range 0x110000', () => {
  assert.throws(() => parseCodepoint('0x110000'));
});

// ---------------------------------------------------------------------------
// toUTF8Bytes
// ---------------------------------------------------------------------------
test('toUTF8Bytes: 1-byte ASCII A (0x41)', () => {
  assert.deepEqual(toUTF8Bytes(0x41), [0x41]);
});

test('toUTF8Bytes: 1-byte NULL (0x00)', () => {
  assert.deepEqual(toUTF8Bytes(0x00), [0x00]);
});

test('toUTF8Bytes: 1-byte DEL (0x7F)', () => {
  assert.deepEqual(toUTF8Bytes(0x7F), [0x7F]);
});

test('toUTF8Bytes: 2-byte é (0x00E9)', () => {
  // 0xE9 = 11101001 → 0xC3 0xA9
  assert.deepEqual(toUTF8Bytes(0x00E9), [0xC3, 0xA9]);
});

test('toUTF8Bytes: 2-byte © (0x00A9)', () => {
  assert.deepEqual(toUTF8Bytes(0x00A9), [0xC2, 0xA9]);
});

test('toUTF8Bytes: 3-byte € (0x20AC)', () => {
  assert.deepEqual(toUTF8Bytes(0x20AC), [0xE2, 0x82, 0xAC]);
});

test('toUTF8Bytes: 3-byte あ (0x3042)', () => {
  assert.deepEqual(toUTF8Bytes(0x3042), [0xE3, 0x81, 0x82]);
});

test('toUTF8Bytes: 4-byte 😀 (0x1F600)', () => {
  assert.deepEqual(toUTF8Bytes(0x1F600), [0xF0, 0x9F, 0x98, 0x80]);
});

test('toUTF8Bytes: 4-byte max (0x10FFFF)', () => {
  assert.deepEqual(toUTF8Bytes(0x10FFFF), [0xF4, 0x8F, 0xBF, 0xBF]);
});

// ---------------------------------------------------------------------------
// toUTF16CodeUnits
// ---------------------------------------------------------------------------
test('toUTF16CodeUnits: BMP A (0x41)', () => {
  assert.deepEqual(toUTF16CodeUnits(0x41), [0x41]);
});

test('toUTF16CodeUnits: BMP CJK (0x4E2D)', () => {
  assert.deepEqual(toUTF16CodeUnits(0x4E2D), [0x4E2D]);
});

test('toUTF16CodeUnits: surrogate pair 😀 (0x1F600)', () => {
  // 0x1F600 - 0x10000 = 0xF600
  // high = 0xD800 + (0xF600 >> 10) = 0xD800 + 0x3D = 0xD83D
  // low  = 0xDC00 + (0xF600 & 0x3FF) = 0xDC00 + 0x200? let's check
  // 0xF600 >> 10 = 0x3D = 61, 0xD800 + 61 = 0xD83D ✓
  // 0xF600 & 0x3FF = 0x200, 0xDC00 + 0x200 = 0xDE00 — wait, let me recalculate
  // Actually 0x1F600 - 0x10000 = 0xF600
  // high surrogate = 0xD800 + (0xF600 >> 10) = 0xD800 + 0x3D = 0xD83D
  // low  surrogate = 0xDC00 + (0xF600 & 0x3FF) = 0xDC00 + 0x200 = 0xDE00
  const units = toUTF16CodeUnits(0x1F600);
  assert.equal(units.length, 2);
  assert.equal(units[0], 0xD83D);
  assert.equal(units[1], 0xDE00);
});

test('toUTF16CodeUnits: 0x10000 (first supplementary)', () => {
  const units = toUTF16CodeUnits(0x10000);
  assert.equal(units.length, 2);
  assert.equal(units[0], 0xD800);
  assert.equal(units[1], 0xDC00);
});

test('toUTF16CodeUnits: 0x10FFFF (max)', () => {
  const units = toUTF16CodeUnits(0x10FFFF);
  assert.equal(units.length, 2);
  assert.equal(units[0], 0xDBFF);
  assert.equal(units[1], 0xDFFF);
});

// ---------------------------------------------------------------------------
// HTML entity
// ---------------------------------------------------------------------------
test('toHTMLEntity: A → &#x41;', () => {
  assert.equal(toHTMLEntity(65), '&#x41;');
});

test('toHTMLEntity: emoji', () => {
  assert.equal(toHTMLEntity(0x1F600), '&#x1F600;');
});

// ---------------------------------------------------------------------------
// CSS escape
// ---------------------------------------------------------------------------
test('toCSSEscape: A → \\41', () => {
  assert.equal(toCSSEscape(65), '\\41');
});

test('toCSSEscape: emoji', () => {
  assert.equal(toCSSEscape(0x1F600), '\\1F600');
});

// ---------------------------------------------------------------------------
// JS escape
// ---------------------------------------------------------------------------
test('toJSEscape: BMP A → \\u0041', () => {
  assert.equal(toJSEscape(65), '\\u0041');
});

test('toJSEscape: BMP € → \\u20AC', () => {
  assert.equal(toJSEscape(0x20AC), '\\u20AC');
});

test('toJSEscape: supplementary 😀 → \\u{1F600}', () => {
  assert.equal(toJSEscape(0x1F600), '\\u{1F600}');
});

test('toJSEscape: 0x10FFFF', () => {
  assert.equal(toJSEscape(0x10FFFF), '\\u{10FFFF}');
});

// ---------------------------------------------------------------------------
// Block lookup
// ---------------------------------------------------------------------------
test('getBlock: 0x0041 → Basic Latin', () => {
  assert.equal(getBlock(0x41), 'Basic Latin');
});

test('getBlock: 0x3042 → Hiragana', () => {
  assert.equal(getBlock(0x3042), 'Hiragana');
});

test('getBlock: 0x1F600 → Emoticons', () => {
  assert.equal(getBlock(0x1F600), 'Emoticons');
});

test('getBlock: 0x20AC → Currency Symbols', () => {
  assert.equal(getBlock(0x20AC), 'Currency Symbols');
});

test('getBlock: returns null for codepoint not in any block', () => {
  // 0x0800–0x083F is Samaritan (not in our BLOCKS list)
  assert.equal(getBlock(0x0800), null);
});

// ---------------------------------------------------------------------------
// findBlocks
// ---------------------------------------------------------------------------
test('findBlocks: "latin" returns multiple blocks', () => {
  const blocks = findBlocks('latin');
  assert.ok(blocks.length >= 2);
  assert.ok(blocks.every(b => b.name.toLowerCase().includes('latin')));
});

test('findBlocks: "hiragana" returns exactly Hiragana block', () => {
  const blocks = findBlocks('hiragana');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].name, 'Hiragana');
});

test('findBlocks: empty query returns all blocks', () => {
  const blocks = findBlocks('');
  assert.ok(blocks.length > 0);
});

test('findBlocks: non-string returns empty array', () => {
  assert.deepEqual(findBlocks(null), []);
});

// ---------------------------------------------------------------------------
// isEmoji
// ---------------------------------------------------------------------------
test('isEmoji: 😀 (0x1F600) is emoji', () => {
  assert.equal(isEmoji(0x1F600), true);
});

test('isEmoji: ☀ (0x2600) is emoji', () => {
  assert.equal(isEmoji(0x2600), true);
});

test('isEmoji: A (0x41) is not emoji', () => {
  assert.equal(isEmoji(0x41), false);
});

test('isEmoji: あ (0x3042) is not emoji', () => {
  assert.equal(isEmoji(0x3042), false);
});

test('isEmoji: 0 (null codepoint) is not emoji', () => {
  assert.equal(isEmoji(0), false);
});

// ---------------------------------------------------------------------------
// getCategory
// ---------------------------------------------------------------------------
test('getCategory: A is Letter', () => {
  assert.equal(getCategory(65), 'Letter');
});

test('getCategory: 0 is Number', () => {
  assert.equal(getCategory(48), 'Number');
});

test('getCategory: emoji is Emoji', () => {
  assert.equal(getCategory(0x1F600), 'Emoji');
});

test('getCategory: NUL is Control / Format', () => {
  assert.equal(getCategory(0), 'Control / Format');
});

// ---------------------------------------------------------------------------
// getNormalizationForms
// ---------------------------------------------------------------------------
test('getNormalizationForms: returns all 4 forms', () => {
  const forms = getNormalizationForms('A');
  assert.ok('NFC' in forms);
  assert.ok('NFD' in forms);
  assert.ok('NFKC' in forms);
  assert.ok('NFKD' in forms);
});

test('getNormalizationForms: ASCII stays the same in all forms', () => {
  const forms = getNormalizationForms('Hello');
  assert.equal(forms.NFC, 'Hello');
  assert.equal(forms.NFD, 'Hello');
  assert.equal(forms.NFKC, 'Hello');
  assert.equal(forms.NFKD, 'Hello');
});

test('getNormalizationForms: é normalizes correctly', () => {
  // Precomposed é = U+00E9
  const precomposed = '\u00E9';
  // Decomposed = e + combining accent U+0065 U+0301
  const decomposed = '\u0065\u0301';

  const forms1 = getNormalizationForms(precomposed);
  const forms2 = getNormalizationForms(decomposed);

  // NFC of both should be the precomposed form
  assert.equal(forms1.NFC, precomposed);
  assert.equal(forms2.NFC, precomposed);

  // NFD of both should be the decomposed form
  assert.equal(forms1.NFD, decomposed);
  assert.equal(forms2.NFD, decomposed);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
test('toCodepoint + fromCodepoint round-trip for max codepoint', () => {
  const cp = 0x10FFFF;
  const str = fromCodepoint(cp);
  assert.equal(toCodepoint(str), cp);
});

test('toUTF8Bytes + verify byte count for all boundary values', () => {
  // 1-byte boundaries
  assert.equal(toUTF8Bytes(0x0000).length, 1);
  assert.equal(toUTF8Bytes(0x007F).length, 1);
  // 2-byte boundaries
  assert.equal(toUTF8Bytes(0x0080).length, 2);
  assert.equal(toUTF8Bytes(0x07FF).length, 2);
  // 3-byte boundaries
  assert.equal(toUTF8Bytes(0x0800).length, 3);
  assert.equal(toUTF8Bytes(0xFFFF).length, 3);
  // 4-byte boundaries
  assert.equal(toUTF8Bytes(0x10000).length, 4);
  assert.equal(toUTF8Bytes(0x10FFFF).length, 4);
});

test('parseCodepoint: U+0000 (null codepoint)', () => {
  assert.equal(parseCodepoint('U+0000'), 0);
});

test('formatCodepoint: pads to at least 4 hex digits', () => {
  assert.match(formatCodepoint(0x41), /^U\+[0-9A-F]{4,}$/);
  assert.match(formatCodepoint(0x1F600), /^U\+[0-9A-F]{4,}$/);
});

test('getBlock: 0x0000 → Basic Latin', () => {
  assert.equal(getBlock(0x0000), 'Basic Latin');
});

test('getBlock: 0x007F → Basic Latin', () => {
  assert.equal(getBlock(0x007F), 'Basic Latin');
});

test('toUTF16CodeUnits: BMP values have 1 code unit', () => {
  assert.equal(toUTF16CodeUnits(0x0000).length, 1);
  assert.equal(toUTF16CodeUnits(0xFFFF).length, 1);
});

test('toUTF16CodeUnits: supplementary have 2 code units', () => {
  assert.equal(toUTF16CodeUnits(0x10000).length, 2);
  assert.equal(toUTF16CodeUnits(0x10FFFF).length, 2);
});
