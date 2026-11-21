// ================= Storage Keys Registry (v2.2.0 Factory Pattern) =================

window.STORAGE_KEYS = {
    // ================= 1. 系統與 AI 設定類 =================
    GEMINI_API_KEY: 'vivi.gemini.apiKey',
    WEATHER_API_KEY: 'vivi.weather.apiKey',
    ASSISTANT_NAME: 'vivi.assistant.name',
    ASSISTANT_AVATAR: 'vivi.assistant.avatar',
    GREETING_MESSAGE: 'vivi.assistant.greeting',
    USER_PHOTO: 'vivi.home.photo',
    CHAT_HISTORY: 'vivi.chat.history',

    // ================= 2. 財富與資產中心類 =================
    WEALTH_DATA: 'vivi.wealth.data',
    RETIREMENT_GOAL: 'vivi.retirement.goal',

    // ================= 3. 工具類 (機車與行事曆) =================
    BIKE_INFO: 'vivi.bike.info',
    BIKE_HISTORY: 'vivi.bike.history',
    BIKE_UPCOMING: 'vivi.bike.upcoming',
    CALENDAR_LAST_YM: 'vivi.calendar.lastYM',

    // ================= 4. 歷史全域相容與備份類 (保留相容) =================
    FINANCE_BALANCES: 'vivi.finance.balances',
    FINANCE_TRANSACTIONS: 'vivi.finance.transactions',
    LAST_AUDIT: 'vivi.finance.lastAudit',
    LEGACY_CREDIT_DATA: 'vivi.credit.data', // 對應舊版全域信用卡資料 Key

    // ================= 5. 多帳本動態 Key 工廠 (Ledger Key Factory) =================
    LEDGERS_LIST: 'vivi_ledgers_list_v1',
    ACCOUNTS: (ledgerId) => `vivi_accounts_${ledgerId}_v1`,
    TRANSACTIONS: (ledgerId) => `vivi_transactions_${ledgerId}_v1`,
    CREDIT_DATA: (ledgerId) => `vivi_credit_data_${ledgerId}_v1`,
    TAGS: (ledgerId) => `vivi_tags_${ledgerId}_v1`,

    // ================= 6. 記憶容器類 (Memory System v2.3.0-a) =================
    MEMORY_SHORT: 'vivi_memory_short_v1',
    MEMORY_ACTIVE: 'vivi_memory_active_v1',
    MEMORY_PROFILE: 'vivi_memory_profile_v1',
    MEMORY_EVENTS: 'vivi_memory_events_v1',
    MEMORY_FAVORITES: 'vivi_memory_favorites_v1'
};