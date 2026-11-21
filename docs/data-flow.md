# 💰 薇薇 AI 秘書 - 金融與資產資料流稽核 (Data Flow Audit)

## 1. 資料源防禦性稽核（Key 追蹤）
- **流水的唯一來源**：
  - 目前程式碼中同時存在 `pandaTransactions`[cite: 8] 與 `vivi_transactions`。
  - **稽核結論**：必須統一收斂至 `STORAGE_KEYS.TRANSACTIONS`（對應舊版 `pandaTransactions` 或相關 Key），避免漏算。
- **現金來源連動**：
  - 財富頁的 `fetchAllLatestPrices()` 會抓取 `inputBills`, `inputCoins`, `inputBank`, `inputPanda`，若為 0 則回退讀取 `vivi_last_audit`[cite: 4]。
  - **稽核結論**：確保多帳本結算後的餘額與財富頁的現金總額採用同一套數學公式，做到 100% 雙向對齊。

## 2. 信用卡消費與收支統計的生命週期
- **刷卡記帳 ➔ 未出帳帳單 ➔ 繳卡費 ➔ 收支統計**：
  - 刷卡當下是否寫入流水？抑或是等到「繳卡費」時才算入支出？
  - **重複計算風險**：若刷卡時記了一筆支出，繳卡費時又從銀行扣款記了一筆支出，會導致「同一筆消費被扣兩次」。
  - **稽核結論**：信用卡未出帳應視為「負債或應付帳款轉移」，不應在刷卡當下直接當作現金流透支，或必須在繳卡費時明確釐清是「現金扣款繳納已記錄的卡費」。

## 3. 金流關聯依賴圖 (Data Flow Chain)
[LocalStorage / StorageService]
       ↓ (讀寫)
[finance.js] (多帳本、動態帳戶、現金結算)
       ↓ (寫入交易流水)
[credit-card.js] (信用卡扣款、未出帳)
       ↓ (讀取流水進行篩選與聚合)
[stats.js] (圓餅圖、長條圖、月/年結餘)
       ↓ (讀取現金結算與資產加總)
[wealth-core.js / wealth-assets.js] (總淨值試算)

# 💰 薇薇 AI 秘書 - 金融與資產資料流稽核 (Data Flow Audit - Draft)

## 📌 待驗證稽核事項 (Pending Verification)
1. **finance.js** 實際寫入與讀取的 Storage Key 是什麼？是否直接寫入 `pandaTransactions` 或其他 Key？
2. **credit-card.js** 實際寫入與讀取的 Storage Key 是什麼？卡費繳納與刷卡記錄的關聯為何？
3. **stats.js** 目前僅讀取 `pandaTransactions`，這與 `finance.js` 的寫入目標是否完美對齊？
4. **信用卡重複計算風險**：刷卡當下是否會直接寫入支出流水？若繳卡費時又扣款一次，是否存在重複扣款的邏輯漏洞？

## 🔑 目前已知的 Storage Key 清冊 (Storage Keys Inventory)
- `vivi_wealth_data`：儲存財產與投資細目（加密貨幣、股票、基金、保險）
- `vivi_retirement_goal`：儲存退休目標與預期年領息率參數
- `vivi_weather_api_key`：中央氣象署 CWA 專屬 API Key[cite: 2]
- `pandaTransactions`：目前已知統計圖表（stats.js）讀取的交易流水 Key
- `vivi_last_audit`：上次外送對帳的快照紀錄

---
*註：本文件將隨著接下來逐檔稽核 finance.js 與 credit-card.js 的進度逐步補完真實的資料流向圖。*