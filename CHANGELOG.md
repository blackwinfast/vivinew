# 薇薇 AI 秘書 (Vivi AI Secretary) - 變更日誌 (Changelog)

## v2.0.1 (Stable Release)
- **架構模組化**：成功將單體 `styles.css` 拆分為 8 個獨立 CSS 模組 (`main.css`, `home.css`, `chat.css`, `finance.css`, `wealth.css`, `bike.css`, `calendar.css`, `settings.css`)。
- **財富模組精細化**：將財富系統拆分為 `wealth-core.js`、`wealth-assets.js`、`wealth-retirement.js` 及獨立的 `stats.js`。
- **核心資料層**：引入強固型 `StorageService` 與集中化 `STORAGE_KEYS`，確保 LocalStorage 存取安全。
- **AI 與天氣防禦**：Gemini 支援多模型與高流量自動重試；氣象模組建構 Open-Meteo 與 CWA 雙重備援、Timeout 及 GPS 定位機制。

## v2.1.0 (Refactoring & Cleanup)
- **風險清除**：封存歷史舊檔，將 `stats-wealth.js` 與 `styles.css` 移至 `archive/` 資料夾，徹底排除全域同名函式覆寫與重複宣告隱患。
- **全域治理**：移除 `main.js` 中重複的 `showSettings()` 防呆函式，統一交由 `settings.js` 掌控。