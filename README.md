# Unicode Lookup

Unicode コードポイント検索ツール。文字・コードポイント・名前・ブロックから検索、UTF-8/16 バイト表示、正規化 4 形式比較。

**Demo**: https://sen.ltd/portfolio/unicode-lookup/

## Features

- **Multi-mode search**
  - By character: paste any character → see full codepoint info
  - By codepoint: enter `U+XXXX`, `0xXXXX`, or decimal → see character
  - By name/keyword: search Unicode block names
  - Block browser: browse all Unicode blocks with character grids
- **Character info panel**
  - Large character display
  - Codepoint (U+XXXX), decimal, hex
  - UTF-8 bytes (1–4 bytes)
  - UTF-16 code units (BMP or surrogate pair)
  - Block name, category
  - HTML entity (`&#x1F600;`), CSS escape (`\1F600`), JS escape (`\u{1F600}`)
- **Unicode normalization demo**: NFC, NFD, NFKC, NFKD side-by-side
- **One-click copy** on every value
- **Japanese/English UI**
- **Dark/light theme**

## Tech

Vanilla JS, zero dependencies, no build step. Works in any modern browser.

## Usage

```sh
# Serve locally
npm run serve
# → open http://localhost:8080

# Run tests
npm test
```

## Project structure

```
unicode-lookup/
├── index.html
├── style.css
├── src/
│   ├── main.js       # DOM, events, rendering
│   ├── unicode.js    # Pure logic: codepoint conversions, UTF encoding
│   ├── blocks.js     # Unicode block definitions
│   └── i18n.js       # ja/en translations
├── tests/
│   └── unicode.test.js
└── package.json
```

## License

MIT — Copyright (c) 2026 SEN LLC (SEN 合同会社)

<!-- sen-publish:links -->
## Links

- 🌐 Demo: https://sen.ltd/portfolio/unicode-lookup/
- 📝 dev.to: https://dev.to/sendotltd/a-unicode-lookup-tool-that-shows-utf-8-bytes-surrogate-pairs-and-all-four-normalization-forms-h6p
<!-- /sen-publish:links -->
