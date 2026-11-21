# 📦 薇薇 AI 秘書 - Storage Keys 註冊表與生命週期規範 (v2.2.0)

本文件定義專案中所有 LocalStorage / StorageService 使用的 Key、命名空間、讀寫權責與生命週期狀態[cite: 31, 33, 34]。

## 🏷️ 狀態分類定義
- **`✅ Official`**：正式線上使用中之官方 Key[cite: 34]。
- **`⚠️ Compatibility`**：相容層 / 搬遷過渡期 Key（舊資料過渡用，短期內不可刪除）[cite: 34]。
- **`❌ Deprecated`**：已廢棄、準備在後續版本清理的歷史遺留[cite: 34]。

---

## 1. 系統與 AI 設定類 (System & AI)
- `vivi.gemini.apiKey` — **`✅ Official`**[cite: 34]
  - **用途**：Gemini 專屬 API Key[cite: 34]。
- `vivi.weather.apiKey` — **`✅ Official`**[cite: 34]
  - **用途**：中央氣象署氣象 API Key[cite: 34]。
- `vivi.assistant.name` — **`✅ Official`**[cite: 34]
  - **用途**：AI 助理名稱[cite: 34]。
- `vivi.assistant.avatar` — **`✅ Official`**[cite: 34]
  - **用途**：AI 助理頭貼設定[cite: 34]。
- `vivi.assistant.greeting` — **`✅ Official`**[cite: 34]
  - **用途**：首頁問候語[cite: 34]。
- `vivi.home.photo` — **`✅ Official`**[cite: 34]
  - **用途**：首頁用戶相片[cite: 34]。
- `vivi.chat.history` — **`✅ Official`**[cite: 34]
  - **用途**：對話聊天紀錄[cite: 34]。

---

## 2. 財務與多帳本核心類 (Finance & Ledgers)
- `vivi_ledgers_list_v1` — **`✅ Official`**
  - **用途**：儲存所有帳本清單（如個人、共同、公司）[cite: 31, 34]。
  - **讀寫模組**：`finance.js` (`getLedgersList` / `saveLedgersList`)[cite: 31, 34]
- `vivi_accounts_${ledgerId}_v1` — **`✅ Official`**[cite: 31, 34]
  - **用途**：儲存指定帳本底下的動態資產帳戶與餘額（如現金、銀行存款、數位帳戶）[cite: 31, 34]。
  - **讀寫模組**：`finance.js` (`saveAccountsListForLedger`) 讀寫；`wealth-core.js` 讀取作為財富頁現金來源[cite: 31, 34]
- `vivi_transactions_${ledgerId}_v1` — **`✅ Official`**[cite: 31, 34]
  - **用途**：儲存指定帳本底下的收支與對帳流水紀錄[cite: 31, 34]。
  - **讀寫模組**：`finance.js` (`saveTransactionsForLedger`) 寫入；`finance.js`、`stats.js` (`getTransactionsForLedger`) 讀取[cite: 31, 34]
- `vivi_credit_data_${ledgerId}_v1` — **`✅ Official`**[cite: 31, 34]
  - **用途**：儲存指定帳本底下的信用卡清單與未出帳刷卡消費（Pending Transactions）[cite: 31, 34]。
  - **讀寫模組**：`credit-card.js` (`getCreditDataForLedger` / `saveCreditDataForLedger`)[cite: 31, 34]
- `vivi_tags_${ledgerId}_v1` — **`✅ Official`**[cite: 31, 34]
  - **用途**：儲存各帳本自定義的收支快捷標籤[cite: 31, 34]。
  - **讀寫模組**：`finance.js` (`getCustomTags` / `saveCustomTags`)[cite: 31, 34]
- `vivi.finance.transactions` — **`✅ Official`**[cite: 34]
  - **用途**：歷史全域交易流水對照[cite: 34]。
- `vivi.finance.lastAudit` — **`✅ Official`**[cite: 34]
  - **用途**：上次外送對帳快照[cite: 34]。

---

## 3. 財富與資產中心類 (Wealth & Retirement)
- `vivi.wealth.data` — **`✅ Official`**[cite: 33, 34]
  - **用途**：儲存全站總資產明細（加密貨幣、股票、基金、保險）[cite: 31, 34]。
  - **讀寫模組**：`wealth-core.js` (`saveWealthData`) 寫入；`wealth-core.js` 與各資產渲染模組讀取[cite: 31, 34]
- `vivi.retirement.goal` — **`✅ Official`**[cite: 33, 34]
  - **用途**：儲存退休目標與預期年領息率等參數設定[cite: 31, 34]。
  - **讀寫模組**：`wealth-retirement.js`[cite: 31, 34]

---

## 4. 工具與擴充類 (Tools: Bike & Calendar)
- `vivi.bike.info` — **`✅ Official`**[cite: 34]
  - **用途**：機車車籍與基本資訊[cite: 34]。
- `vivi.bike.history` — **`✅ Official`**[cite: 34]
  - **用途**：機車保養維修歷史紀錄[cite: 34]。
- `vivi.bike.upcoming` — **`✅ Official`**[cite: 34]
  - **用途**：機車待辦提醒[cite: 34]。
- `vivi.calendar.lastYM` — **`✅ Official`**[cite: 34]
  - **用途**：行事曆最後檢視年月[cite: 34]。

---

## 5. 記憶容器類 (Memory System v2.3.0-a)
- `vivi_memory_short_v1` — **`✅ Official`**
  - **用途**：短期記憶容器[cite: 33]。
- `vivi_memory_active_v1` — **`✅ Official`**[cite: 33]
  - **用途**：活躍記憶容器[cite: 33]。
- `vivi_memory_profile_v1` — **`✅ Official`**[cite: 33]
  - **用途**：使用者檔案記憶容器[cite: 33]。
- `vivi_memory_events_v1` — **`✅ Official`**[cite: 33]
  - **用途**：事件記憶容器[cite: 33]。
- `vivi_memory_favorites_v1` — **`✅ Official`**[cite: 33]
  - **用途**：偏好／收藏記憶容器[cite: 33]。

---

## 6. 相容層與歷史過渡期類 (Compatibility / Migration)
- `vivi.finance.balances` — **`⚠️ Compatibility`**[cite: 33, 34]
  - **用途**：歷史全域財務餘額相容 Key[cite: 33, 34]。
- `vivi.credit.data` — **`⚠️ Compatibility`**[cite: 33, 34]
  - **用途**：舊版全域信用卡資料 Key[cite: 33, 34]。
- `pandaTransactions` — **`⚠️ Compatibility`**[cite: 31, 34]
  - **用途**：舊版全域交易流水 Key；僅在個人帳本 (`ledger_personal`) 初始化或遷移時作為一次性舊資料讀取來源[cite: 31, 34]。
  - **淘汰計畫**：待全面完成 StorageService 遷移後排入廢棄時程[cite: 31, 34]。
- `vivi_last_audit` — **`⚠️ Compatibility`**[cite: 31, 34]
  - **用途**：舊版外送對帳快照備份；在 `wealth-core.js` 中作為極端無帳戶資料時的保底備援[cite: 31, 34]。
- `vivi_custom_accounts_v2` — **`⚠️ Compatibility`**[cite: 31, 34]
  - **用途**：早期自定義帳戶備份；僅供個人帳本初始化時的向下相容遷移[cite: 31, 34]。
- `vivi_wealth_data` — **`⚠️ Compatibility`**[cite: 34]
  - **用途**：舊版全域財富 Key，現已由 `vivi.wealth.data` 接管，保留作向下相容讀取[cite: 34]。
- `vivi_retirement_goal` — **`⚠️ Compatibility`**[cite: 34]
  - **用途**：舊版全域退休目標 Key，現已由 `vivi.retirement.goal` 接管[cite: 34]。