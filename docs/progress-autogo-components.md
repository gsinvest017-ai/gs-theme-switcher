# progress — autogo 前端組件移植到 gs-theme-switcher

**目標**：把 autogo 的前端設計系統（VS Code IDE style tab 欄位、Lucide icon 使用模式、utility classes）提取並加入 gs-theme-switcher，讓其他專案可方便套用，無需自行從 autogo 複製。

來源：`C:\Users\User\autogo\web\static\` — ide.css / dashboard.css / gs-theme.css / style.css / ide.js

## 計畫 Milestone

| # | 標題 | 預期產出 |
|---|------|---------|
| M1 | IDE Chrome 組件 | `components/ide-chrome.css` — titlebar / tabbar / tab（含 Lucide icon）/ statusbar + 3 theme overrides |
| M2 | Lucide utilities + themes.css utility classes | `components/lucide.css`、`themes.css` 末端新增 `.gs-card` / `.gs-toolbar` / `.gs-header` 等 |
| M3 | demo.html + build.js + package.json 更新 | 展示 IDE tab bar、Lucide 佔位圖；build script 新增 components minify |
| M4 | README.md Components 章節 | 說明 `components/` 目錄用法、CDN 路徑、各組件 HTML snippet |

## 進度日誌

### M1 — IDE Chrome 組件 (進行中)
- 新增 `components/ide-chrome.css`：titlebar / tabbar / .ide-tab（+ Lucide icon slot）/ drag-to-reorder / statusbar + genesis-gold / vscode-dark / gs-portal 三主題 override
- 來源：autogo `web/static/ide.css` — 去除 autogo 特有 iframe 細節，改用純 CSS var() 可移植版本

## Fallback 指引

若需手動引入 IDE chrome：
```html
<link rel="stylesheet" href="themes.css">
<link rel="stylesheet" href="components/ide-chrome.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
```
