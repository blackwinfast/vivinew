// ================= Vivi Memory Core Module (v2.3.2) =================
const DEFAULT_MEMORY_KEYS = {
    MEMORY_SHORT: 'vivi_memory_short_v1',
    MEMORY_ACTIVE: 'vivi_memory_active_v1',
    MEMORY_PROFILE: 'vivi_memory_profile_v1',
    MEMORY_EVENTS: 'vivi_memory_events_v1',
    MEMORY_FAVORITES: 'vivi_memory_favorites_v1'
};

function ensureMemoryStorageKeys() {
    if (typeof window !== 'undefined') {
        if (!window.STORAGE_KEYS || typeof window.STORAGE_KEYS !== 'object') {
            window.STORAGE_KEYS = {};
        }
        Object.keys(DEFAULT_MEMORY_KEYS).forEach((keyName) => {
            if (!window.STORAGE_KEYS[keyName]) {
                window.STORAGE_KEYS[keyName] = DEFAULT_MEMORY_KEYS[keyName];
            }
        });
    }
    return DEFAULT_MEMORY_KEYS;
}

ensureMemoryStorageKeys();

function readMemoryStorage(keyName, fallbackValue) {
    ensureMemoryStorageKeys();
    const storageKey = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS[keyName])
        ? STORAGE_KEYS[keyName]
        : DEFAULT_MEMORY_KEYS[keyName];

    try {
        if (typeof StorageService !== 'undefined' && typeof StorageService.get === 'function') {
            const val = StorageService.get(storageKey, null);
            if (val !== null && val !== undefined) return val;
            StorageService.set(storageKey, fallbackValue);
            return fallbackValue;
        }

        const raw = localStorage.getItem(storageKey);
        if (raw === null || raw === undefined) {
            localStorage.setItem(storageKey, JSON.stringify(fallbackValue));
            return fallbackValue;
        }
        return JSON.parse(raw);
    } catch (err) {
        console.error(`讀取記憶容器失敗 [${keyName}]:`, err);
        return fallbackValue;
    }
}

function writeMemoryStorage(keyName, value) {
    ensureMemoryStorageKeys();
    const storageKey = (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS[keyName])
        ? STORAGE_KEYS[keyName]
        : DEFAULT_MEMORY_KEYS[keyName];

    try {
        if (typeof StorageService !== 'undefined' && typeof StorageService.set === 'function') {
            StorageService.set(storageKey, value);
        } else {
            localStorage.setItem(storageKey, JSON.stringify(value));
        }
        return true;
    } catch (err) {
        console.error(`寫入記憶容器失敗 [${keyName}]:`, err);
        return false;
    }
}

// L1 對話記憶
function getShortMemories() {
    const data = readMemoryStorage('MEMORY_SHORT', []);
    return Array.isArray(data) ? data : [];
}

function saveShortMemories(list) {
    return writeMemoryStorage('MEMORY_SHORT', Array.isArray(list) ? list : []);
}

// L2 活躍記憶
function getActiveMemories() {
    const data = readMemoryStorage('MEMORY_ACTIVE', []);
    return Array.isArray(data) ? data : [];
}

function saveActiveMemories(list) {
    return writeMemoryStorage('MEMORY_ACTIVE', Array.isArray(list) ? list : []);
}

// L3 個人檔案
function getProfileMemory() {
    const data = readMemoryStorage('MEMORY_PROFILE', {});
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

function saveProfileMemory(profileObj) {
    const safeObj = (profileObj && typeof profileObj === 'object' && !Array.isArray(profileObj))
        ? profileObj
        : {};
    const saved = writeMemoryStorage('MEMORY_PROFILE', safeObj);
    if (saved && typeof window !== 'undefined' && typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
        window.invalidateViviGeminiMemoryAdapter();
    }
    return saved;
}

// L1 / L2 / L3 Helper API
function touchShortMemory({ role = 'user', content = '', timestamp = Date.now() } = {}) {
    const cleanContent = typeof content === 'string' ? content.trim() : '';
    if (!cleanContent) {
        console.warn('touchShortMemory: content 不可為空');
        return false;
    }

    const list = getShortMemories();
    const item = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        role,
        content: cleanContent,
        timestamp
    };

    list.push(item);
    return saveShortMemories(list) ? item : false;
}

function setActiveMemory({ id = null, title = '', status = 'active', summary = [] } = {}) {
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const list = getActiveMemories();
    const nowIso = new Date().toISOString();

    const safeSummary = Array.isArray(summary)
        ? summary.map((s) => String(s).trim()).filter(Boolean)
        : (typeof summary === 'string' && summary.trim() ? [summary.trim()] : []);

    if (id) {
        const idx = list.findIndex((item) => item && item.id === id);
        if (idx !== -1) {
            const updated = {
                ...list[idx],
                title: cleanTitle || list[idx].title,
                status: status || list[idx].status || 'active',
                summary: safeSummary.length ? safeSummary : (list[idx].summary || []),
                updatedAt: nowIso
            };
            list[idx] = updated;
            return saveActiveMemories(list) ? updated : false;
        }
    }

    if (!cleanTitle) {
        console.warn('setActiveMemory: 新增時 title 不可為空');
        return false;
    }

    const created = {
        id: id || ('active_' + Date.now()),
        title: cleanTitle,
        status: status || 'active',
        startedAt: nowIso,
        updatedAt: nowIso,
        summary: safeSummary
    };

    list.unshift(created);
    return saveActiveMemories(list) ? created : false;
}

function updateProfileMemory(patchObj = {}) {
    if (!patchObj || typeof patchObj !== 'object' || Array.isArray(patchObj)) {
        console.warn('updateProfileMemory: patchObj 必須為物件');
        return false;
    }

    const current = getProfileMemory();
    const next = {
        ...current,
        ...patchObj
    };

    return saveProfileMemory(next) ? next : false;
}

function buildProfileMemorySummary() {
    const profile = typeof getProfileMemory === 'function' ? getProfileMemory() : {};
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        return '';
    }
    const labelMap = {
        city: '居住地',
        transportation: '交通工具',
        assistantName: '助理稱呼',
        nickname: '暱稱',
        name: '姓名'
    };
    const lines = Object.entries(profile)
        .map(([key, val]) => {
            const cleanKey = String(key || '').trim();
            if (!cleanKey || val === null || val === undefined) return '';
            const textVal = typeof val === 'object' ? JSON.stringify(val) : String(val).trim();
            if (!textVal) return '';
            const displayLabel = labelMap[cleanKey] || cleanKey;
            return `${displayLabel}:${textVal}`;
        })
        .filter(Boolean);
    return lines.join('\n');
}

function pruneShortMemories({ maxKeep = 50, maxAgeDays = 7 } = {}) {
    const safeKeep = Number.isFinite(Number(maxKeep)) && Number(maxKeep) >= 0 ? Number(maxKeep) : 50;
    const safeDays = Number.isFinite(Number(maxAgeDays)) && Number(maxAgeDays) > 0 ? Number(maxAgeDays) : 7;
    const cutoffMs = Date.now() - safeDays * 24 * 60 * 60 * 1000;

    const filtered = getShortMemories().filter((item) => {
        if (!item || typeof item !== 'object') return false;
        if (!item.timestamp) return true;
        return Number(item.timestamp) >= cutoffMs;
    });

    const trimmed = safeKeep === 0 ? [] : filtered.slice(-safeKeep);
    saveShortMemories(trimmed);
    return trimmed;
}

// Change Hook & Summary
const __memoryListeners = new Set();

function subscribeMemoryChange(listener) {
    if (typeof listener !== 'function') {
        return () => {};
    }
    __memoryListeners.add(listener);
    return () => {
        __memoryListeners.delete(listener);
    };
}

function emitMemoryChange(eventName = 'change', detail = {}) {
    const payload = {
        event: eventName,
        at: new Date().toISOString(),
        detail,
        summary: typeof getMemorySnapshotSummary === 'function' ? getMemorySnapshotSummary() : null
    };

    __memoryListeners.forEach((fn) => {
        try {
            fn(payload);
        } catch (err) {
            console.warn('[MemoryService] listener error:', err);
        }
    });

    return payload;
}

function notifyAfterMemoryOp(eventName = 'memory_updated', operationFn = null, detail = {}) {
    const result = typeof operationFn === 'function' ? operationFn() : operationFn;
    emitMemoryChange(eventName, { ...detail, result });
    return result;
}

// Reset / Snapshot / Context / Turn Pipeline
const MEMORY_LAYER_RESETTERS = {
    short: () => saveShortMemories([]),
    active: () => saveActiveMemories([]),
    profile: () => saveProfileMemory({}),
    events: () => (typeof saveEvents === 'function' ? saveEvents([]) : false),
    favorites: () => (typeof saveFavorites === 'function' ? saveFavorites([]) : false)
};

function resetMemoryLayer(layer) {
    const key = typeof layer === 'string' ? layer.trim().toLowerCase() : '';
    const resetFn = MEMORY_LAYER_RESETTERS[key];
    if (!resetFn) {
        console.warn(`resetMemoryLayer: 未知的記憶層級 "${layer}"，可用值為 short / active / profile / events / favorites`);
        return false;
    }
    return resetFn();
}

function clearAllMemories() {
    const results = {};
    Object.keys(MEMORY_LAYER_RESETTERS).forEach((key) => {
        results[key] = MEMORY_LAYER_RESETTERS[key]();
    });
    return results;
}

function buildMemoryContext({
    shortLimit = 8,
    activeLimit = 5,
    eventLimit = 5,
    favoriteLimit = 5
} = {}) {
    const profile = getProfileMemory();
    const active = getActiveMemories().slice(0, activeLimit);
    const events = typeof getEvents === 'function' ? getEvents().slice(0, eventLimit) : [];
    const favorites = typeof getFavorites === 'function' ? getFavorites().slice(0, favoriteLimit) : [];
    const shortList = getShortMemories().slice(-shortLimit);

    const lines = [];

    const profileEntries = Object.entries(profile || {});
    if (profileEntries.length) {
        lines.push('【L3 個人檔案】');
        profileEntries.forEach(([k, v]) => {
            lines.push(`- ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
        });
    }

    if (active.length) {
        lines.push('【L2 活躍任務】');
        active.forEach((item) => {
            const statusText = item.status ? ` (${item.status})` : '';
            lines.push(`- ${item.title || '未命名任務'}${statusText}`);
        });
    }

    if (events.length) {
        lines.push('【L4 重要事件】');
        events.forEach((ev) => {
            const locText = Array.isArray(ev.location) && ev.location.length ? ` @ ${ev.location.join('、')}` : '';
            const dateText = ev.date ? `[${ev.date}] ` : '';
            lines.push(`- ${dateText}${ev.title || '未命名事件'}${locText}`);
        });
    }

    if (favorites.length) {
        lines.push('【L5 收藏記憶】');
        favorites.forEach((fav) => {
            lines.push(`- ${fav.title || '未命名收藏'}${fav.content ? `：${fav.content}` : ''}`);
        });
    }

    if (shortList.length) {
        lines.push('【L1 近期對話】');
        shortList.forEach((msg) => {
            lines.push(`- ${msg.role || 'user'}: ${msg.content || ''}`);
        });
    }

    return {
        text: lines.join('\n'),
        data: {
            profile,
            active,
            events,
            favorites,
            short: shortList
        }
    };
}

const FAVORITE_TRIGGER_PATTERNS = [
    /永久保存/,
    /加入收藏/,
    /收藏這/,
    /記住這個規格/,
    /存成收藏/
];

const EVENT_QUERY_PATTERNS = [
    /紀念日/,
    /去了哪裡/,
    /去哪裡/,
    /什麼時候/,
    /哪一天/,
    /行程/
];

function parseMemoryIntent(input = '') {
    const raw = typeof input === 'string' ? input.trim() : '';
    if (!raw) {
        return { intent: 'unknown', raw: '', query: '', content: '' };
    }

    const isFavorite = FAVORITE_TRIGGER_PATTERNS.some((re) => re.test(raw));
    if (isFavorite) {
        const cleanedContent = raw
            .replace(/永久保存(這段|這個)?/g, '')
            .replace(/加入收藏/g, '')
            .replace(/收藏這(段|個)?/g, '')
            .replace(/記住這個規格/g, '')
            .replace(/存成收藏/g, '')
            .trim();

        return {
            intent: 'add_favorite',
            raw,
            query: '',
            content: cleanedContent || raw
        };
    }

    const isEventQuery = EVENT_QUERY_PATTERNS.some((re) => re.test(raw));
    if (isEventQuery) {
        const cleanedQuery = raw
            .replace(/去了哪裡/g, '')
            .replace(/去哪裡/g, '')
            .replace(/什麼時候/g, '')
            .replace(/哪一天/g, '')
            .replace(/[？?！!。]/g, '')
            .trim();

        return {
            intent: 'find_event',
            raw,
            query: cleanedQuery || raw,
            content: ''
        };
    }

    return { intent: 'general', raw, query: raw, content: raw };
}

function dispatchMemoryIntent(input = '') {
    const parsed = parseMemoryIntent(input);

    if (parsed.intent === 'add_favorite' && typeof addFavoriteMemory === 'function') {
        const cleanBody = String(parsed.content || '').replace(/^[:：\s]+/, '').trim();
        const created = addFavoriteMemory({
            title: cleanBody.slice(0, 24) || '收藏記憶',
            content: cleanBody || parsed.raw,
            tags: ['from_intent']
        });

        return {
            handled: Boolean(created),
            intent: parsed.intent,
            parsed,
            result: created
        };
    }

    if (parsed.intent === 'find_event' && typeof findEventMemory === 'function') {
        const matches = findEventMemory(parsed.query);
        return {
            handled: true,
            intent: parsed.intent,
            parsed,
            result: matches
        };
    }

    return {
        handled: false,
        intent: parsed.intent,
        parsed,
        result: null
    };
}

function formatMemoryDispatchResult(dispatchRes) {
    if (!dispatchRes || typeof dispatchRes !== 'object' || !dispatchRes.handled) {
        return '';
    }

    if (dispatchRes.intent === 'add_favorite') {
        const fav = dispatchRes.result;
        if (!fav) return '收藏寫入失敗，請稍後再試。';
        return `已為你永久收藏：${fav.title || fav.content || '未命名項目'}`;
    }

    if (dispatchRes.intent === 'find_event') {
        const list = Array.isArray(dispatchRes.result) ? dispatchRes.result : [];
        if (!list.length) {
            const q = dispatchRes.parsed && dispatchRes.parsed.query ? `「${dispatchRes.parsed.query}」` : '';
            return `目前沒有找到符合${q}的事件記憶。`;
        }

        const lines = [`找到 ${list.length} 筆相關事件：`];
        list.forEach((ev) => {
            const datePart = ev.date ? `[${ev.date}] ` : '';
            const locPart = Array.isArray(ev.location) && ev.location.length ? `（地點：${ev.location.join('、')}）` : '';
            lines.push(`- ${datePart}${ev.title || '未命名事件'}${locPart}`);
        });
        return lines.join('\n');
    }

    return '';
}

function handleMemoryMessage(input = '', {
    recordShort = true,
    role = 'user',
    autoPrune = false,
    pruneOptions = { maxKeep: 50, maxAgeDays: 7 },
    contextOptions = { shortLimit: 8, activeLimit: 5, eventLimit: 5, favoriteLimit: 5 }
} = {}) {
    const text = typeof input === 'string' ? input.trim() : '';
    const shortEntry = recordShort && text ? touchShortMemory({ role, content: text }) : false;
    const dispatch = dispatchMemoryIntent(text);
    const replyText = formatMemoryDispatchResult(dispatch);
    const pruned = autoPrune ? pruneShortMemories(pruneOptions) : null;
    const context = buildMemoryContext(contextOptions);

    return { input: text, shortEntry, dispatch, replyText, pruned, context };
}

function exportMemorySnapshot() {
    return {
        version: '2.3.2',
        exportedAt: new Date().toISOString(),
        layers: {
            short: getShortMemories(),
            active: getActiveMemories(),
            profile: getProfileMemory(),
            events: typeof getEvents === 'function' ? getEvents() : [],
            favorites: typeof getFavorites === 'function' ? getFavorites() : []
        }
    };
}

function importMemorySnapshot(snapshot) {
    const layers = snapshot && typeof snapshot === 'object'
        ? (snapshot.layers && typeof snapshot.layers === 'object' ? snapshot.layers : snapshot)
        : null;

    if (!layers || typeof layers !== 'object') {
        console.warn('importMemorySnapshot: 無效的快照格式');
        return false;
    }

    return {
        short: Array.isArray(layers.short) ? saveShortMemories(layers.short) : false,
        active: Array.isArray(layers.active) ? saveActiveMemories(layers.active) : false,
        profile: layers.profile && typeof layers.profile === 'object' && !Array.isArray(layers.profile)
            ? saveProfileMemory(layers.profile)
            : false,
        events: Array.isArray(layers.events) && typeof saveEvents === 'function' ? saveEvents(layers.events) : false,
        favorites: Array.isArray(layers.favorites) && typeof saveFavorites === 'function' ? saveFavorites(layers.favorites) : false
    };
}

function formatMemoryPromptBlock(options = {}) {
    const {
        header = '=== 薇薇長期與近期記憶上下文 ===',
        footer = '=== 記憶上下文結束 ===',
        maxChars = 2000,
        contextOptions = { shortLimit: 8, activeLimit: 5, eventLimit: 5, favoriteLimit: 5 }
    } = options;

    const ctx = buildMemoryContext(contextOptions);
    let body = ctx && typeof ctx.text === 'string' ? ctx.text.trim() : '';

    if (typeof maxChars === 'number' && maxChars > 0 && body.length > maxChars) {
        body = `${body.slice(0, maxChars).trim()}\n...(已截斷以控制提示詞長度)`;
    }

    const parts = [];
    if (header) parts.push(header);
    parts.push(body || '（目前尚無已記錄的記憶內容）');
    if (footer) parts.push(footer);

    return { prompt: parts.join('\n'), length: parts.join('\n').length, context: ctx };
}

function resetMemoryForTesting({ keepProfile = true, seedDemo = false } = {}) {
    const profileBackup = keepProfile ? getProfileMemory() : null;
    clearAllMemories();

    if (keepProfile && profileBackup && typeof profileBackup === 'object') {
        saveProfileMemory(profileBackup);
    }

    if (seedDemo) {
        setActiveMemory({ title: 'Vivi Memory System', status: 'active', note: '核心記憶層驗證中' });
        if (typeof addEventMemory === 'function') {
            addEventMemory({
                title: '系統架構定案',
                date: '2026-11-19',
                location: ['本地端'],
                content: '完成 L1～L5 純邏輯記憶 API 與診斷工具'
            });
        }
        if (typeof addFavoriteMemory === 'function') {
            addFavoriteMemory({
                title: 'L1～L5 記憶分層原則',
                content: 'L1 短期對話、L2 活躍任務、L3 個人檔案、L4 重要事件、L5 永久收藏',
                tags: ['architecture']
            });
        }
    }

    return {
        resetAt: new Date().toISOString(),
        keepProfile,
        seedDemo,
        stats: typeof getMemoryStats === 'function' ? getMemoryStats() : null,
        health: typeof validateMemorySystem === 'function' ? validateMemorySystem() : null
    };
}

function buildChatMemoryPayload(input = '', options = {}) {
    const { memoryOptions = {}, promptOptions = {} } = options;
    const handled = handleMemoryMessage(input, memoryOptions);
    const promptBlock = formatMemoryPromptBlock(promptOptions);

    const hasDirectReply = Boolean(
        handled &&
        handled.dispatch &&
        handled.dispatch.handled &&
        typeof handled.replyText === 'string' &&
        handled.replyText.trim().length > 0
    );

    return {
        input: handled.input,
        shouldShortCircuit: hasDirectReply,
        directReply: hasDirectReply ? handled.replyText : '',
        systemPromptBlock: promptBlock.prompt,
        promptLength: promptBlock.length,
        memory: handled
    };
}

function routeChatTurnWithMemory(input = '', options = {}) {
    const { baseSystemPrompt = '', memoryOptions = {}, promptOptions = {} } = options;
    const payload = buildChatMemoryPayload(input, { memoryOptions, promptOptions });

    if (payload.shouldShortCircuit) {
        return {
            mode: 'direct',
            reply: payload.directReply,
            systemPrompt: baseSystemPrompt,
            userMessage: payload.input,
            payload
        };
    }

    const combinedSystemPrompt = [
        typeof baseSystemPrompt === 'string' ? baseSystemPrompt.trim() : '',
        payload.systemPromptBlock
    ].filter(Boolean).join('\n\n');

    return {
        mode: 'llm',
        reply: '',
        systemPrompt: combinedSystemPrompt,
        userMessage: payload.input,
        payload
    };
}

function commitAssistantTurnToMemory(replyText = '', options = {}) {
    const {
        autoPrune = false,
        pruneOptions = { maxKeep: 50, maxAgeDays: 7 },
        contextOptions = { shortLimit: 8, activeLimit: 5, eventLimit: 5, favoriteLimit: 5 }
    } = options;

    const text = typeof replyText === 'string' ? replyText.trim() : '';
    const shortEntry = text ? touchShortMemory({ role: 'assistant', content: text }) : false;
    const pruned = autoPrune ? pruneShortMemories(pruneOptions) : null;
    const context = buildMemoryContext(contextOptions);

    return { committed: Boolean(shortEntry), role: 'assistant', content: text, shortEntry, pruned, context };
}

async function executeChatTurnWithMemory(input = '', options = {}) {
    const {
        baseSystemPrompt = '',
        memoryOptions = {},
        promptOptions = {},
        commitOptions = {},
        llmRunner = null
    } = options;

    const turn = routeChatTurnWithMemory(input, { baseSystemPrompt, memoryOptions, promptOptions });
    if (turn.mode === 'direct') {
        return { ok: true, mode: 'direct', reply: turn.reply, committed: false, commitResult: null, turn };
    }

    if (typeof llmRunner !== 'function') {
        return {
            ok: false,
            mode: 'llm',
            reply: '',
            error: '缺少 llmRunner 函式，無法執行 LLM 回合',
            committed: false,
            commitResult: null,
            turn
        };
    }

    const rawReply = await llmRunner({
        systemPrompt: turn.systemPrompt,
        userMessage: turn.userMessage,
        payload: turn.payload
    });

    const replyText = typeof rawReply === 'string'
        ? rawReply
        : (rawReply && typeof rawReply.text === 'string' ? rawReply.text : String(rawReply ?? ''));

    const commitResult = commitAssistantTurnToMemory(replyText, commitOptions);
    return { ok: true, mode: 'llm', reply: replyText, committed: commitResult.committed, commitResult, turn };
}

async function executeSafeChatTurnWithMemory(input = '', options = {}) {
    const {
        timeoutMs = 15000,
        fallbackReply = '抱歉，我剛剛連線思考時遇到一點狀況，請再試一次。',
        ...execOptions
    } = options;

    try {
        const execPromise = executeChatTurnWithMemory(input, execOptions);
        if (typeof timeoutMs === 'number' && timeoutMs > 0) {
            let timerId = null;
            const timeoutPromise = new Promise((_, reject) => {
                timerId = setTimeout(() => {
                    reject(new Error(`LLM 回合執行逾時（超過 ${timeoutMs}ms）`));
                }, timeoutMs);
            });
            try {
                return await Promise.race([execPromise, timeoutPromise]);
            } finally {
                if (timerId) clearTimeout(timerId);
            }
        }
        return await execPromise;
    } catch (err) {
        return {
            ok: false,
            mode: 'error',
            reply: fallbackReply,
            error: err && err.message ? err.message : String(err),
            committed: false,
            commitResult: null,
            turn: null
        };
    }
}

function createMemoryChatAdapter(config = {}) {
    const {
        baseSystemPrompt = '你是薇薇，請以繁體中文自然、簡潔且有幫助地回覆。',
        timeoutMs = 15000,
        fallbackReply = '抱歉，我剛剛連線思考時遇到一點狀況，請再試一次。',
        llmRunner = null,
        memoryOptions = {},
        promptOptions = {},
        commitOptions = {}
    } = config;

    return {
        async sendMessage(userText = '', overrides = {}) {
            const runner = typeof overrides.llmRunner === 'function' ? overrides.llmRunner : llmRunner;
            return executeSafeChatTurnWithMemory(userText, {
                baseSystemPrompt: overrides.baseSystemPrompt ?? baseSystemPrompt,
                timeoutMs: overrides.timeoutMs ?? timeoutMs,
                fallbackReply: overrides.fallbackReply ?? fallbackReply,
                memoryOptions: { ...memoryOptions, ...(overrides.memoryOptions || {}) },
                promptOptions: { ...promptOptions, ...(overrides.promptOptions || {}) },
                commitOptions: { ...commitOptions, ...(overrides.commitOptions || {}) },
                llmRunner: runner
            });
        },
        getSummary() {
            return typeof getMemorySnapshotSummary === 'function' ? getMemorySnapshotSummary() : null;
        }
    };
}

function initMemoryModule(options = {}) {
    const { panelContainer = null, panelOptions = {}, chatConfig = null, onChange = null } = options;
    const health = typeof validateMemorySystem === 'function' ? validateMemorySystem() : { healthy: true };
    const unsubscribeChange = typeof onChange === 'function' ? subscribeMemoryChange(onChange) : () => {};

    let panelController = { ok: false, reason: 'not_requested', unmount: () => {} };
    if (panelContainer && typeof document !== 'undefined' && typeof mountMemoryPanel === 'function') {
        panelController = mountMemoryPanel(panelContainer, panelOptions);
    }

    const chatAdapter = chatConfig && typeof chatConfig === 'object'
        ? createMemoryChatAdapter(chatConfig)
        : null;

    return {
        ok: Boolean(health && health.healthy),
        health,
        panelController,
        chatAdapter,
        summary: typeof getMemorySnapshotSummary === 'function' ? getMemorySnapshotSummary() : null,
        destroy() {
            unsubscribeChange();
            if (panelController && typeof panelController.unmount === 'function') {
                panelController.unmount();
            }
        }
    };
}

function checkMemoryIntegrationReadiness(options = {}) {
    const { llmRunner = null, panelContainer = null, timeoutMs = 15000 } = options;
    const apiReport = typeof verifyMemorySystem === 'function' ? verifyMemorySystem() : { ok: true, totalApis: 0 };
    const summary = typeof getMemorySnapshotSummary === 'function' ? getMemorySnapshotSummary() : null;
    const warnings = [];

    const hasValidRunner = typeof llmRunner === 'function';
    if (!hasValidRunner) {
        warnings.push('尚未提供有效的 llmRunner 函式（目前僅適合測試或純 direct 指令模式）。');
    }

    let panelTargetFound = false;
    if (panelContainer) {
        const el = typeof document !== 'undefined' && typeof panelContainer === 'string'
            ? document.querySelector(panelContainer)
            : panelContainer;
        panelTargetFound = Boolean(el && typeof HTMLElement !== 'undefined' && el instanceof HTMLElement);
        if (!panelTargetFound) {
            warnings.push(`找不到指定的 panelContainer：${String(panelContainer)}`);
        }
    }

    const validTimeout = typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs >= 500;
    if (!validTimeout) {
        warnings.push(`timeoutMs 建議設為 >= 500ms（目前為 ${String(timeoutMs)}）。`);
    }

    const ready = Boolean(apiReport.ok && (!panelContainer || panelTargetFound) && validTimeout);
    return {
        ready,
        checkedAt: new Date().toISOString(),
        apiOk: apiReport.ok,
        totalApis: apiReport.totalApis,
        hasValidRunner,
        panelTargetFound,
        validTimeout,
        warnings,
        summary
    };
}

function buildMemoryIntegrationSnippet(options = {}) {
    const {
        llmRunnerName = 'yourLlmRunner',
        panelSelector = '#vivi-memory-panel',
        timeoutMs = 15000,
        baseSystemPrompt = '你是薇薇，請以繁體中文自然、簡潔且有幫助地回覆。'
    } = options;

    const safeRunnerName = String(llmRunnerName || 'yourLlmRunner').replace(/[^a-zA-Z0-9_$]/g, '') || 'yourLlmRunner';
    const safeSelector = String(panelSelector || '#vivi-memory-panel').replace(/'/g, "\\'");
    const safePrompt = String(baseSystemPrompt || '').replace(/'/g, "\\'");
    const safeTimeout = typeof timeoutMs === 'number' && Number.isFinite(timeoutMs) && timeoutMs >= 500
        ? Math.floor(timeoutMs)
        : 15000;

    const snippet = [
        `const preflight = checkMemoryIntegrationReadiness({`,
        `    llmRunner: typeof ${safeRunnerName} === 'function' ? ${safeRunnerName} : null,`,
        `    panelContainer: '${safeSelector}',`,
        `    timeoutMs: ${safeTimeout}`,
        `});`,
        ``,
        `if (preflight.apiOk) {`,
        `    const viviMem = initMemoryModule({`,
        `        panelContainer: preflight.panelTargetFound ? '${safeSelector}' : null,`,
        `        chatConfig: {`,
        `            baseSystemPrompt: '${safePrompt}',`,
        `            timeoutMs: ${safeTimeout},`,
        `            llmRunner: typeof ${safeRunnerName} === 'function' ? ${safeRunnerName} : null`,
        `        }`,
        `    });`,
        `    window.__viviMem = viviMem;`,
        `}`
    ].join('\n');

    return { ok: true, runnerName: safeRunnerName, panelSelector: safeSelector, timeoutMs: safeTimeout, snippet };
}

const MemoryService = (typeof window !== 'undefined' && window.MemoryService && typeof window.MemoryService === 'object')
    ? window.MemoryService
    : {};

const __coreApis = {
    ensureMemoryStorageKeys,
    readMemoryStorage,
    writeMemoryStorage,
    getShortMemories,
    saveShortMemories,
    getActiveMemories,
    saveActiveMemories,
    getProfileMemory,
    saveProfileMemory,
    buildProfileMemorySummary,
    touchShortMemory,
    setActiveMemory,
    updateProfileMemory,
    pruneShortMemories,
    subscribeMemoryChange,
    emitMemoryChange,
    notifyAfterMemoryOp,
    resetMemoryLayer,
    clearAllMemories,
    buildMemoryContext,
    parseMemoryIntent,
    dispatchMemoryIntent,
    formatMemoryDispatchResult,
    handleMemoryMessage,
    exportMemorySnapshot,
    importMemorySnapshot,
    formatMemoryPromptBlock,
    resetMemoryForTesting,
    buildChatMemoryPayload,
    routeChatTurnWithMemory,
    commitAssistantTurnToMemory,
    executeChatTurnWithMemory,
    executeSafeChatTurnWithMemory,
    createMemoryChatAdapter,
    initMemoryModule,
    checkMemoryIntegrationReadiness,
    buildMemoryIntegrationSnippet
};

Object.assign(MemoryService, __coreApis);

if (typeof window !== 'undefined') {
    window.MemoryService = MemoryService;
    window.DEFAULT_MEMORY_KEYS = DEFAULT_MEMORY_KEYS;
    Object.assign(window, __coreApis);
}