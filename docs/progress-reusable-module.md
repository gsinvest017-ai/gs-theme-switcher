# progress — gs-theme-switcher 跨專案複用模組

**目標**：讓其他 repo 只需一兩行就能引入完整的主題切換 UI，無需安裝 build toolchain。

## 計畫 Milestone

| # | 標題 | 預期產出 |
|---|------|---------|
| M1 | dist/ 壓縮版 + build 腳本 | `dist/themes.min.css`, `dist/theme-switcher.min.js`, `scripts/build.js` |
| M2 | CLI inject 工具 | `bin/inject.js` — `npx gs-theme-switcher inject <html-file>` |
| M3 | README CDN + 框架 snippets | jsDelivr URL、Flask/Streamlit/React/Dash 整合範例 |
| M4 | 收尾 | 更新 package.json、最終 commit |

## 進度日誌

### M1 — dist/ 壓縮版 + build 腳本 (077e31b)
- `scripts/build.js`：純 Node.js，零相依，CSS -42% / JS -50%
- `dist/themes.min.css`、`dist/theme-switcher.min.js` 供 CDN 引用
- `package.json` 新增 `build` / `prepublishOnly` 腳本，`files` 加入 dist/

### M2 — CLI inject 工具 (8abe3ad)
- `bin/inject.js`：`npx gs-theme-switcher inject <html-file>`
- 自動插入兩行到 `</head>` 前，預設使用 jsDelivr CDN
- 支援 `--base`、`--local`、`--dry-run`、`--revert`
- `package.json` 加入 `bin` 欄位

### M3 — README 框架整合範例 (02d2deb)
- jsDelivr CDN 一行引入、minified URL、pinned commit 說明
- 框架 snippet：Flask/Jinja2、Streamlit、Plotly Dash、React/Vite、Vue/Nuxt
- CLI 用法章節

## Fallback 指引

若需手動引入，最少只需：
```html
<link rel="stylesheet" href="themes.css">
<script src="theme-switcher.js"></script>
```
或使用 jsDelivr CDN（見 README）。
