# Repo Theme Adoption Dashboard

## 目標
在 demo.html 新增「Repo Theme Adoption」面板（Section 9），使用 `gh` CLI 掃描目前 git user 手上的 GitHub repos，檢查各 repo 的 HTML 是否已套用 gs-theme-switcher，並支援手動選取 + 一鍵 apply（clone → inject → commit，不 push）。

## 計畫 Milestone

| # | 標題 | 預期產出 |
|---|------|----------|
| M1 | 進度檔 + repo-audit.js | `scripts/repo-audit.js` — gh CLI 列舉 + 樣式採用分析核心 |
| M2 | audit-server.js | `scripts/audit-server.js` — 本地 HTTP server (port 3457) + SSE scan API + apply API |
| M3 | demo.html Section 9 + package.json | 新增 Repo Adoption Dashboard 卡片 UI + `npm run audit` 指令 |

## 進度日誌

### M1 — 進度檔 + repo-audit.js
- 建立本進度檔
- 新增 `scripts/repo-audit.js`：`listRepos(limit)` / `scanRepo(repo)` / `applyToRepo(nameWithOwner, htmlPaths)`
- 採用判定邏輯：`themes.css` + `theme-switcher.js` 同時出現 OR 有 `<!-- gs-theme-switcher:css -->` marker

### M3 — demo.html Section 9 + package.json ✓
- demo.html 新增「9. Repo Theme Adoption」卡片（離線提示 / 線上掃描 UI 雙態）
- auditDash JS object：init / scan (SSE) / onCheck / toggleAll / apply
- package.json 新增 `"audit": "node scripts/audit-server.js"`

### M2 — audit-server.js
- 新增 `scripts/audit-server.js`
- `GET /api/health` → `{ok:true}`
- `GET /api/scan` → SSE stream，每 repo 一則 event，scan 完送 `{type:"done"}`
- `POST /api/apply` → clone temp dir → inject → commit，回傳 pushCmd / prCmd

### M3 — demo.html Section 9 + package.json
- `demo.html` 新增 Section 9 卡片（Server 離線時顯示 `npm run audit` 提示，連線後顯示掃描 UI）
- `package.json` 新增 `"audit": "node scripts/audit-server.js"`

## Fallback 指引

若需要 rollback：
```
git log --oneline -10   # 找 M1/M2/M3 commit hash
git revert <hash>       # 或 git reset --hard <hash before M1>
```

涉及的檔案：
- `scripts/repo-audit.js`
- `scripts/audit-server.js`
- `demo.html`（Section 9 尾端新增）
- `package.json`（新增 audit script）
