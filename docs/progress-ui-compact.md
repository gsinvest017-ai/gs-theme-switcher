# UI Compact — demo.html

## 目標
讓 demo.html 在 1920×1080 viewport 下無需 vertical scroll。

## 靜態 Baseline 估算

| 區塊 | 估算高度 |
|------|---------|
| header | ~60px |
| cards 1-9（18px padding × 2 + 16px margin × 9 + 各卡內容）| ~1900-2100px |
| **合計** | ~1960-2160px |
| **目標** | ≤ 1080px |

## 套用策略

| 代號 | 說明 | 預估節省 |
|------|------|---------|
| B | card padding 18→12px；margin-bottom 16→0（grid gap 代替）；header padding 20→10px | ~200px |
| C | line-height 1.6→1.45；h2 15→14px | ~80px |
| A | main 改 2-column grid（cards 1-8 各占半欄，card 9 全寬）| ~900px |

## 進度日誌

### M1 — 套用 B+C+A + commit
- 在 `<style>` 末端加 compaction overrides
- 加 `id="ide-chrome-card"` 到 card 8

## Fallback
```
git revert HEAD
```
