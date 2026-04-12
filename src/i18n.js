/**
 * i18n.js — Japanese/English translations for the UI.
 */

export const TRANSLATIONS = {
  en: {
    title: 'Unicode Lookup',
    tagline: 'Explore Unicode characters, codepoints, and encodings',
    searchPlaceholder: 'Paste a character, U+XXXX, 0xXXXX, decimal, or keyword…',
    modeChar: 'By Character',
    modeCodepoint: 'By Codepoint',
    modeName: 'By Name / Keyword',
    modeBlock: 'Browse Blocks',
    // Info panel labels
    character: 'Character',
    codepoint: 'Codepoint',
    decimal: 'Decimal',
    hex: 'Hex',
    utf8Bytes: 'UTF-8 Bytes',
    utf16Units: 'UTF-16 Code Units',
    unicodeName: 'Unicode Name',
    blockName: 'Block',
    category: 'Category',
    htmlEntity: 'HTML Entity',
    cssEscape: 'CSS Escape',
    jsEscape: 'JS Escape',
    // Normalization
    normalizationTitle: 'Unicode Normalization',
    nfcLabel: 'NFC (Canonical Decomposition, Canonical Composition)',
    nfdLabel: 'NFD (Canonical Decomposition)',
    nfkcLabel: 'NFKC (Compatibility Decomposition, Canonical Composition)',
    nfkdLabel: 'NFKD (Compatibility Decomposition)',
    codepoints: 'Codepoints',
    // Block browser
    blockBrowserTitle: 'Browse Blocks',
    blockSearchPlaceholder: 'Filter blocks…',
    blockCharsLabel: 'Characters',
    // Actions
    copy: 'Copy',
    copied: 'Copied!',
    // Errors
    noResults: 'No results found.',
    invalidInput: 'Invalid input.',
    enterToSearch: 'Type to search for characters.',
    // Theme
    lightTheme: 'Light',
    darkTheme: 'Dark',
    // Lang toggle
    langToggle: '日本語',
  },
  ja: {
    title: 'Unicode ルックアップ',
    tagline: 'Unicode 文字・コードポイント・エンコーディングを調べる',
    searchPlaceholder: '文字を貼り付け、U+XXXX、0xXXXX、10進数、またはキーワードを入力…',
    modeChar: '文字から',
    modeCodepoint: 'コードポイントから',
    modeName: '名前・キーワードから',
    modeBlock: 'ブロック一覧',
    // Info panel labels
    character: '文字',
    codepoint: 'コードポイント',
    decimal: '10進数',
    hex: '16進数',
    utf8Bytes: 'UTF-8 バイト',
    utf16Units: 'UTF-16 コードユニット',
    unicodeName: 'Unicode 名称',
    blockName: 'ブロック',
    category: 'カテゴリ',
    htmlEntity: 'HTML エンティティ',
    cssEscape: 'CSS エスケープ',
    jsEscape: 'JS エスケープ',
    // Normalization
    normalizationTitle: 'Unicode 正規化',
    nfcLabel: 'NFC（正規分解 → 正規合成）',
    nfdLabel: 'NFD（正規分解）',
    nfkcLabel: 'NFKC（互換分解 → 正規合成）',
    nfkdLabel: 'NFKD（互換分解）',
    codepoints: 'コードポイント',
    // Block browser
    blockBrowserTitle: 'ブロック一覧',
    blockSearchPlaceholder: 'ブロックを絞り込む…',
    blockCharsLabel: '文字',
    // Actions
    copy: 'コピー',
    copied: 'コピー済み',
    // Errors
    noResults: '該当なし',
    invalidInput: '入力が不正です。',
    enterToSearch: '検索キーワードを入力してください。',
    // Theme
    lightTheme: 'ライト',
    darkTheme: 'ダーク',
    // Lang toggle
    langToggle: 'English',
  },
};

let _lang = 'en';

/**
 * Get or set the current language.
 * @param {'en'|'ja'} [lang]
 * @returns {'en'|'ja'}
 */
export function currentLang(lang) {
  if (lang !== undefined) {
    if (lang !== 'en' && lang !== 'ja') throw new RangeError(`Unknown lang: ${lang}`);
    _lang = lang;
  }
  return _lang;
}

/**
 * Get a translated string for key in the current language.
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return TRANSLATIONS[_lang][key] ?? TRANSLATIONS['en'][key] ?? key;
}
