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

<!-- 每完成一個 milestone 追加段落 -->

## Fallback 指引

若需手動引入，最少只需：
```html
<link rel="stylesheet" href="themes.css">
<script src="theme-switcher.js"></script>
```
或使用 jsDelivr CDN（見 README）。
