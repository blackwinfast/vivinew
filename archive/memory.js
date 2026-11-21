// ================= Vivi Memory Container Module (v2.3.0-a.5) =================
// 建立記憶容器（STORAGE_KEYS）、基礎 CRUD 與開發版 Inspector / Stats
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

// 基礎 CRUD：L1 對話記憶（陣列）
function getShortMemories() {
    const data = readMemoryStorage('MEMORY_SHORT', []);
    return Array.isArray(data) ? data : [];
}

function saveShortMemories(list) {
    return writeMemoryStorage('MEMORY_SHORT', Array.isArray(list) ? list : []);
}

// 基礎 CRUD：L2 活躍記憶（陣列）
function getActiveMemories() {
    const data = readMemoryStorage('MEMORY_ACTIVE', []);
    return Array.isArray(data) ? data : [];
}

function saveActiveMemories(list) {
    return writeMemoryStorage('MEMORY_ACTIVE', Array.isArray(list) ? list : []);
}

// 基礎 CRUD：L3 個人檔案（物件）
function getProfileMemory() {
    const data = readMemoryStorage('MEMORY_PROFILE', {});
    return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

function saveProfileMemory(profileObj) {
    const safeObj = (profileObj && typeof profileObj === 'object' && !Array.isArray(profileObj))
        ? profileObj
        : {};
    return writeMemoryStorage('MEMORY_PROFILE', safeObj);
}

// 基礎 CRUD：L4 事件記憶（陣列）
function getEvents() {
    const data = readMemoryStorage('MEMORY_EVENTS', []);
    return Array.isArray(data) ? data : [];
}

function saveEvents(list) {
    return writeMemoryStorage('MEMORY_EVENTS', Array.isArray(list) ? list : []);
}

// 基礎 CRUD：L5 收藏記憶（陣列）
function getFavorites() {
    const data = readMemoryStorage('MEMORY_FAVORITES', []);
    return Array.isArray(data) ? data : [];
}

function saveFavorites(list) {
    return writeMemoryStorage('MEMORY_FAVORITES', Array.isArray(list) ? list : []);
}

// 開發版 Inspector：在 Console 分組印出 L1~L5 現況
function renderMemoryInspector() {
    console.group('🧠 Vivi Memory Inspector');
    console.log('L1 對話記憶', getShortMemories());
    console.log('L2 活躍記憶', getActiveMemories());
    console.log('L3 個人檔案', getProfileMemory());
    console.log('L4 事件記憶', getEvents());
    console.log('L5 收藏記憶', getFavorites());
    console.groupEnd();
}

// 開發版 Stats：快速查看各層記憶數量
function getMemoryStats() {
    return {
        short: getShortMemories().length,
        active: getActiveMemories().length,
        profile: Object.keys(getProfileMemory()).length,
        events: getEvents().length,
        favorites: getFavorites().length
    };
}

const MemoryService = {
    getShortMemories,
    saveShortMemories,
    getActiveMemories,
    saveActiveMemories,
    getProfileMemory,
    saveProfileMemory,
    getEvents,
    saveEvents,
    getFavorites,
    saveFavorites,
    renderMemoryInspector,
    getMemoryStats
};

if (typeof window !== 'undefined') {
    window.MemoryService = MemoryService;
    window.getShortMemories = getShortMemories;
    window.saveShortMemories = saveShortMemories;
    window.getActiveMemories = getActiveMemories;
    window.saveActiveMemories = saveActiveMemories;
    window.getProfileMemory = getProfileMemory;
    window.saveProfileMemory = saveProfileMemory;
    window.getEvents = getEvents;
    window.saveEvents = saveEvents;
    window.getFavorites = getFavorites;
    window.saveFavorites = saveFavorites;
    window.renderMemoryInspector = renderMemoryInspector;
    window.getMemoryStats = getMemoryStats;
}

// ===== Developer Tools =====
function renderMemoryInspector() {
    console.group('🧠 Vivi Memory Inspector');
    console.log('L1 對話記憶', getShortMemories());
    console.log('L2 活躍記憶', getActiveMemories());
    console.log('L3 個人檔案', getProfileMemory());
    console.log('L4 事件記憶', getEvents());
    console.log('L5 收藏記憶', getFavorites());
    console.groupEnd();
}

function getMemoryStats() {
    return {
        short: getShortMemories().length,
        active: getActiveMemories().length,
        profile: Object.keys(getProfileMemory()).length,
        events: getEvents().length,
        favorites: getFavorites().length
    };
}

MemoryService.renderMemoryInspector = renderMemoryInspector;
MemoryService.getMemoryStats = getMemoryStats;

if (typeof window !== 'undefined') {
    window.renderMemoryInspector = renderMemoryInspector;
    window.getMemoryStats = getMemoryStats;
}

// ===== L5 Favorite Memory API (v2.3.0-b) =====
function addFavoriteMemory({ title, content, tags = [] } = {}) {
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanContent = typeof content === 'string' ? content.trim() : '';

    if (!cleanTitle && !cleanContent) {
        console.warn('addFavoriteMemory: title 與 content 不可同時為空');
        return false;
    }

    const favorites = getFavorites();
    const newItem = {
        id: 'fav_' + Date.now(),
        title: cleanTitle || cleanContent.slice(0, 24),
        content: cleanContent,
        tags: Array.isArray(tags) ? tags : [],
        createdAt: new Date().toISOString()
    };

    favorites.unshift(newItem);
    return saveFavorites(favorites) ? newItem : false;
}

function removeFavoriteMemory(id) {
    if (!id) return false;
    const current = getFavorites();
    const next = current.filter((item) => item && item.id !== id);
    if (next.length === current.length) return false;
    return saveFavorites(next);
}

function findFavoriteMemory(keyword) {
    const q = typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
    if (!q) return getFavorites();

    return getFavorites().filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const inTitle = typeof item.title === 'string' && item.title.toLowerCase().includes(q);
        const inContent = typeof item.content === 'string' && item.content.toLowerCase().includes(q);
        const inTags = Array.isArray(item.tags) && item.tags.some((t) => String(t).toLowerCase().includes(q));
        return inTitle || inContent || inTags;
    });
}

MemoryService.addFavoriteMemory = addFavoriteMemory;
MemoryService.removeFavoriteMemory = removeFavoriteMemory;
MemoryService.findFavoriteMemory = findFavoriteMemory;

if (typeof window !== 'undefined') {
    window.addFavoriteMemory = addFavoriteMemory;
    window.removeFavoriteMemory = removeFavoriteMemory;
    window.findFavoriteMemory = findFavoriteMemory;
}

// ===== L4 Event Memory API (v2.3.0-c) =====
function addEventMemory({
    title,
    date = '',
    location = [],
    activities = [],
    purchases = [],
    notes = ''
} = {}) {
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) {
        console.warn('addEventMemory: title 不可為空');
        return false;
    }

    const toStringArray = (val) => {
        if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
        if (typeof val === 'string' && val.trim()) return [val.trim()];
        return [];
    };

    const events = getEvents();
    const newEvent = {
        id: 'event_' + Date.now(),
        title: cleanTitle,
        date: typeof date === 'string' ? date.trim() : '',
        location: toStringArray(location),
        activities: toStringArray(activities),
        purchases: toStringArray(purchases),
        notes: typeof notes === 'string' ? notes.trim() : '',
        createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    return saveEvents(events) ? newEvent : false;
}
// ===== L4 Event Search API (v2.3.0-d) =====
function searchEventMemory(options = {}) {
    const {
        keyword = '',
        location = '',
        startDate = '',
        endDate = '',
        dateFrom = '',
        dateTo = ''
    } = (options && typeof options === 'object') ? options : {};

    const kw = String(keyword || '').trim().toLowerCase();
    const loc = String(location || '').trim().toLowerCase();
    const from = String(startDate || dateFrom || '').trim();
    const to = String(endDate || dateTo || '').trim();

    return getEvents().filter((ev) => {
        if (!ev || typeof ev !== 'object') return false;

        if (from && (!ev.date || String(ev.date).trim() < from)) return false;
        if (to && (!ev.date || String(ev.date).trim() > to)) return false;

        if (loc) {
            const locList = Array.isArray(ev.location) ? ev.location : [];
            const hitLoc = locList.some((v) => String(v || '').toLowerCase().includes(loc));
            if (!hitLoc) return false;
        }

        if (kw) {
            const pool = [
                ev.title,
                ev.date,
                ev.notes,
                ...(Array.isArray(ev.location) ? ev.location : []),
                ...(Array.isArray(ev.activities) ? ev.activities : []),
                ...(Array.isArray(ev.purchases) ? ev.purchases : [])
            ];
            const hitKw = pool.some((v) => String(v || '').toLowerCase().includes(kw));
            if (!hitKw) return false;
        }

        return true;
    });
}
// ===== L4 Auto Event Extractor (v2.4.0) =====
function extractEventCandidate(text = '') {
    const raw = typeof text === 'string' ? text.trim() : '';
    if (!raw) return null;

    // 1. 嘗試抓 YYYY-MM-DD 或 YYYY/MM/DD
    const dateMatch = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    let date = '';
    if (dateMatch) {
        const y = dateMatch[1];
        const m = String(dateMatch[2]).padStart(2, '0');
        const d = String(dateMatch[3]).padStart(2, '0');
        date = `${y}-${m}-${d}`;
    }

    // 2. 常見事件關鍵詞當 title 候選
    const titleKeywords = ['結婚紀念日', '生日', '週年', '旅遊', '旅行', '聚餐', '約會', '出差', '演唱會', '露營'];
    const matchedTitle = titleKeywords.find((kw) => raw.includes(kw)) || '';

    // 3. 簡單抓「去/到/在 + 地點」候選（先維持保守、不過度猜測）
    const locations = [];
    const locMatch = raw.match(/(?:去|到|在)([^\s，。！？、,]{2,6})(?:玩|住|吃|逛|紀念|慶生)?/);
    if (locMatch && locMatch[1]) {
        locations.push(locMatch[1].trim());
    }

    // 若完全沒有事件跡象，先回傳 null，避免把一般閒聊誤建成事件
    if (!date && !matchedTitle && locations.length === 0) {
        return null;
    }

    return {
        title: matchedTitle || raw.slice(0, 20),
        date,
        location: locations,
        activities: [],
        purchases: [],
        notes: raw
    };
}

// ===== L4 Duplicate Event Guard (v2.4.0-b) =====
function isDuplicateEvent(candidate, events = getEvents()) {
    if (!candidate || typeof candidate !== 'object') return false;
    const list = Array.isArray(events) ? events : [];

    const normDate = String(candidate.date || '').trim();
    const normTitle = String(candidate.title || '').trim().toLowerCase();
    const candLocs = (Array.isArray(candidate.location) ? candidate.location : [])
        .map((v) => String(v || '').trim().toLowerCase())
        .filter(Boolean);

    return list.some((ev) => {
        if (!ev || typeof ev !== 'object') return false;
        const evDate = String(ev.date || '').trim();
        const evTitle = String(ev.title || '').trim().toLowerCase();
        const evLocs = (Array.isArray(ev.location) ? ev.location : [])
            .map((v) => String(v || '').trim().toLowerCase())
            .filter(Boolean);

        const sameDate = normDate && evDate && normDate === evDate;
        const sameTitle = normTitle && evTitle && normTitle === evTitle;
        if (!sameDate || !sameTitle) return false;

        if (candLocs.length > 0 && evLocs.length > 0) {
            return candLocs.some((loc) => evLocs.includes(loc));
        }
        return true;
    });
}

function autoCreateEventFromText(text = '') {
    const candidate = extractEventCandidate(text);
    if (!candidate) return null;
    if (typeof isDuplicateEvent === 'function' && isDuplicateEvent(candidate)) {
        return null;
    }
    return addEventMemory(candidate);
}

function removeEventMemory(id) {
    if (!id) return false;
    const current = getEvents();
    const next = current.filter((item) => item && item.id !== id);
    if (next.length === current.length) return false;
    return saveEvents(next);
}

function findEventMemory(keyword) {
    const q = typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
    if (!q) return getEvents();

    return getEvents().filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const inTitle = typeof item.title === 'string' && item.title.toLowerCase().includes(q);
        const inDate = typeof item.date === 'string' && item.date.toLowerCase().includes(q);
        const inNotes = typeof item.notes === 'string' && item.notes.toLowerCase().includes(q);
        const inLocation = Array.isArray(item.location) && item.location.some((v) => String(v).toLowerCase().includes(q));
        const inActivities = Array.isArray(item.activities) && item.activities.some((v) => String(v).toLowerCase().includes(q));
        const inPurchases = Array.isArray(item.purchases) && item.purchases.some((v) => String(v).toLowerCase().includes(q));
        return inTitle || inDate || inNotes || inLocation || inActivities || inPurchases;
    });
}

MemoryService.addEventMemory = addEventMemory;
MemoryService.removeEventMemory = removeEventMemory;
MemoryService.findEventMemory = findEventMemory;
MemoryService.isDuplicateEvent = isDuplicateEvent;

if (typeof window !== 'undefined') {
    window.addEventMemory = addEventMemory;
    window.removeEventMemory = removeEventMemory;
    window.findEventMemory = findEventMemory;
    window.isDuplicateEvent = isDuplicateEvent;
}

// ===== L1 / L2 / L3 Helper API (v2.3.0-d) =====
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

MemoryService.touchShortMemory = touchShortMemory;
MemoryService.setActiveMemory = setActiveMemory;
MemoryService.updateProfileMemory = updateProfileMemory;

if (typeof window !== 'undefined') {
    window.touchShortMemory = touchShortMemory;
    window.setActiveMemory = setActiveMemory;
    window.updateProfileMemory = updateProfileMemory;
}

// ===== Event Filter & L1 Retention Helper (v2.3.0-e) =====
function queryEventsByFilter({ keyword = '', dateFrom = '', dateTo = '', location = '' } = {}) {
    const kw = typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
    const from = typeof dateFrom === 'string' ? dateFrom.trim() : '';
    const to = typeof dateTo === 'string' ? dateTo.trim() : '';
    const loc = typeof location === 'string' ? location.trim().toLowerCase() : '';

    return getEvents().filter((item) => {
        if (!item || typeof item !== 'object') return false;

        if (from && (!item.date || item.date < from)) return false;
        if (to && (!item.date || item.date > to)) return false;

        if (loc) {
            const locMatch = Array.isArray(item.location) &&
                item.location.some((v) => String(v).toLowerCase().includes(loc));
            if (!locMatch) return false;
        }

        if (kw) {
            const inTitle = typeof item.title === 'string' && item.title.toLowerCase().includes(kw);
            const inDate = typeof item.date === 'string' && item.date.toLowerCase().includes(kw);
            const inNotes = typeof item.notes === 'string' && item.notes.toLowerCase().includes(kw);
            const inLocation = Array.isArray(item.location) && item.location.some((v) => String(v).toLowerCase().includes(kw));
            const inActivities = Array.isArray(item.activities) && item.activities.some((v) => String(v).toLowerCase().includes(kw));
            const inPurchases = Array.isArray(item.purchases) && item.purchases.some((v) => String(v).toLowerCase().includes(kw));
            if (!inTitle && !inDate && !inNotes && !inLocation && !inActivities && !inPurchases) {
                return false;
            }
        }

        return true;
    });
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

MemoryService.queryEventsByFilter = queryEventsByFilter;
MemoryService.pruneShortMemories = pruneShortMemories;

if (typeof window !== 'undefined') {
    window.queryEventsByFilter = queryEventsByFilter;
    window.pruneShortMemories = pruneShortMemories;
}

// ===== Context Assembler API (v2.3.0-f) =====
function buildMemoryContext({
    shortLimit = 8,
    activeLimit = 5,
    eventLimit = 5,
    favoriteLimit = 5
} = {}) {
    const profile = getProfileMemory();
    const active = getActiveMemories().slice(0, activeLimit);
    const events = getEvents().slice(0, eventLimit);
    const favorites = getFavorites().slice(0, favoriteLimit);
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

MemoryService.buildMemoryContext = buildMemoryContext;

if (typeof window !== 'undefined') {
    window.buildMemoryContext = buildMemoryContext;
}

// ===== Reset / Cleanup Helper API (v2.3.0-g) =====
const MEMORY_LAYER_RESETTERS = {
    short: () => saveShortMemories([]),
    active: () => saveActiveMemories([]),
    profile: () => saveProfileMemory({}),
    events: () => saveEvents([]),
    favorites: () => saveFavorites([])
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

MemoryService.resetMemoryLayer = resetMemoryLayer;
MemoryService.clearAllMemories = clearAllMemories;

if (typeof window !== 'undefined') {
    window.resetMemoryLayer = resetMemoryLayer;
    window.clearAllMemories = clearAllMemories;
}

// ===== Intent Parser API (v2.3.0-h) =====
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
        return {
            intent: 'unknown',
            raw: '',
            query: '',
            content: ''
        };
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

    return {
        intent: 'general',
        raw,
        query: raw,
        content: raw
    };
}

MemoryService.parseMemoryIntent = parseMemoryIntent;

if (typeof window !== 'undefined') {
    window.parseMemoryIntent = parseMemoryIntent;
}

// ===== Intent Dispatcher API (v2.3.0-i) =====
function dispatchMemoryIntent(input = '') {
    const parsed = parseMemoryIntent(input);

    if (parsed.intent === 'add_favorite') {
        const cleanBody = String(parsed.content || '')
            .replace(/^[:：\s]+/, '')
            .trim();

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

    if (parsed.intent === 'find_event') {
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

MemoryService.dispatchMemoryIntent = dispatchMemoryIntent;

if (typeof window !== 'undefined') {
    window.dispatchMemoryIntent = dispatchMemoryIntent;
}

// ===== Dispatch Result Formatter API (v2.3.0-j) =====
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

MemoryService.formatMemoryDispatchResult = formatMemoryDispatchResult;

if (typeof window !== 'undefined') {
    window.formatMemoryDispatchResult = formatMemoryDispatchResult;
}

// ===== Unified Memory Flow Coordinator (v2.3.0-k) =====
function handleMemoryMessage(input = '', {
    recordShort = true,
    role = 'user',
    autoPrune = false,
    pruneOptions = { maxKeep: 50, maxAgeDays: 7 },
    contextOptions = { shortLimit: 8, activeLimit: 5, eventLimit: 5, favoriteLimit: 5 }
} = {}) {
    const text = typeof input === 'string' ? input.trim() : '';
    const shortEntry = recordShort && text
        ? touchShortMemory({ role, content: text })
        : false;

    const dispatch = dispatchMemoryIntent(text);
    const replyText = formatMemoryDispatchResult(dispatch);

    const pruned = autoPrune ? pruneShortMemories(pruneOptions) : null;
    const context = buildMemoryContext(contextOptions);

    return {
        input: text,
        shortEntry,
        dispatch,
        replyText,
        pruned,
        context
    };
}

MemoryService.handleMemoryMessage = handleMemoryMessage;

if (typeof window !== 'undefined') {
    window.handleMemoryMessage = handleMemoryMessage;
}

// ===== Snapshot Export / Import Helper API (v2.3.0-L) =====
function exportMemorySnapshot() {
    return {
        version: '2.3.0',
        exportedAt: new Date().toISOString(),
        layers: {
            short: getShortMemories(),
            active: getActiveMemories(),
            profile: getProfileMemory(),
            events: getEvents(),
            favorites: getFavorites()
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

    const results = {
        short: Array.isArray(layers.short) ? saveShortMemories(layers.short) : false,
        active: Array.isArray(layers.active) ? saveActiveMemories(layers.active) : false,
        profile: layers.profile && typeof layers.profile === 'object' && !Array.isArray(layers.profile)
            ? saveProfileMemory(layers.profile)
            : false,
        events: Array.isArray(layers.events) ? saveEvents(layers.events) : false,
        favorites: Array.isArray(layers.favorites) ? saveFavorites(layers.favorites) : false
    };

    return results;
}

MemoryService.exportMemorySnapshot = exportMemorySnapshot;
MemoryService.importMemorySnapshot = importMemorySnapshot;

if (typeof window !== 'undefined') {
    window.exportMemorySnapshot = exportMemorySnapshot;
    window.importMemorySnapshot = importMemorySnapshot;
}

// ===== Memory Health & Integrity Validator API (v2.3.0-M) =====
function validateMemorySystem() {
    const issues = [];

    const shortList = getShortMemories();
    const activeList = getActiveMemories();
    const profile = getProfileMemory();
    const eventList = getEvents();
    const favoriteList = getFavorites();

    if (!Array.isArray(shortList)) issues.push('L1 (short) 非陣列結構');
    if (!Array.isArray(activeList)) issues.push('L2 (active) 非陣列結構');
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
        issues.push('L3 (profile) 非物件結構');
    }
    if (!Array.isArray(eventList)) issues.push('L4 (events) 非陣列結構');
    if (!Array.isArray(favoriteList)) issues.push('L5 (favorites) 非陣列結構');

    if (Array.isArray(eventList)) {
        eventList.forEach((ev, idx) => {
            if (!ev || typeof ev !== 'object') {
                issues.push(`L4 事件第 ${idx} 筆不是有效物件`);
                return;
            }
            if (!ev.title && !ev.content) {
                issues.push(`L4 事件第 ${idx} 筆缺少 title / content`);
            }
            if (ev.date && Number.isNaN(Date.parse(ev.date))) {
                issues.push(`L4 事件第 ${idx} 筆日期格式無法解析：${ev.date}`);
            }
        });
    }

    if (Array.isArray(favoriteList)) {
        favoriteList.forEach((fav, idx) => {
            if (!fav || typeof fav !== 'object') {
                issues.push(`L5 收藏第 ${idx} 筆不是有效物件`);
                return;
            }
            if (!fav.title && !fav.content) {
                issues.push(`L5 收藏第 ${idx} 筆缺少 title / content`);
            }
        });
    }

    return {
        healthy: issues.length === 0,
        checkedAt: new Date().toISOString(),
        stats: getMemoryStats(),
        issues
    };
}

MemoryService.validateMemorySystem = validateMemorySystem;

if (typeof window !== 'undefined') {
    window.validateMemorySystem = validateMemorySystem;
}

// ===== Prompt Block Builder API (v2.3.0-N) =====
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

    return {
        prompt: parts.join('\n'),
        length: parts.join('\n').length,
        context: ctx
    };
}

MemoryService.formatMemoryPromptBlock = formatMemoryPromptBlock;

if (typeof window !== 'undefined') {
    window.formatMemoryPromptBlock = formatMemoryPromptBlock;
}


// ===== Clean-Slate Reset Helper API (v2.3.0-O) =====
function resetMemoryForTesting({ keepProfile = true, seedDemo = false } = {}) {
    const profileBackup = keepProfile ? getProfileMemory() : null;

    clearAllMemories();

    if (keepProfile && profileBackup && typeof profileBackup === 'object') {
        saveProfileMemory(profileBackup);
    }

    if (seedDemo) {
        setActiveMemory({ title: 'Vivi Memory System', status: 'active', note: '核心記憶層驗證中' });
        addEventMemory({
            title: '系統架構定案',
            date: '2026-11-19',
            location: ['本地端'],
            content: '完成 L1～L5 純邏輯記憶 API 與診斷工具'
        });
        addFavoriteMemory({
            title: 'L1～L5 記憶分層原則',
            content: 'L1 短期對話、L2 活躍任務、L3 個人檔案、L4 重要事件、L5 永久收藏',
            tags: ['architecture']
        });
    }

    return {
        resetAt: new Date().toISOString(),
        keepProfile,
        seedDemo,
        stats: getMemoryStats(),
        health: validateMemorySystem()
    };
}

MemoryService.resetMemoryForTesting = resetMemoryForTesting;

if (typeof window !== 'undefined') {
    window.resetMemoryForTesting = resetMemoryForTesting;
}

// ===== Chat & Prompt Integration Bridge API (v2.3.0-P) =====
function buildChatMemoryPayload(input = '', options = {}) {
    const {
        memoryOptions = {},
        promptOptions = {}
    } = options;

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

MemoryService.buildChatMemoryPayload = buildChatMemoryPayload;

if (typeof window !== 'undefined') {
    window.buildChatMemoryPayload = buildChatMemoryPayload;
}

// ===== System Self-Check & API Readiness Helper (v2.3.0-Q) =====
function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Pure Turn Router Helper API (v2.3.0-R) =====
function routeChatTurnWithMemory(input = '', options = {}) {
    const {
        baseSystemPrompt = '',
        memoryOptions = {},
        promptOptions = {}
    } = options;

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

MemoryService.routeChatTurnWithMemory = routeChatTurnWithMemory;

if (typeof window !== 'undefined') {
    window.routeChatTurnWithMemory = routeChatTurnWithMemory;
}

// ===== Assistant Reply Commit Helper API (v2.3.0-S) =====
function commitAssistantTurnToMemory(replyText = '', options = {}) {
    const {
        autoPrune = false,
        pruneOptions = { maxKeep: 50, maxAgeDays: 7 },
        contextOptions = { shortLimit: 8, activeLimit: 5, eventLimit: 5, favoriteLimit: 5 }
    } = options;

    const text = typeof replyText === 'string' ? replyText.trim() : '';
    const shortEntry = text
        ? touchShortMemory({ role: 'assistant', content: text })
        : false;

    const pruned = autoPrune ? pruneShortMemories(pruneOptions) : null;
    const context = buildMemoryContext(contextOptions);

    return {
        committed: Boolean(shortEntry),
        role: 'assistant',
        content: text,
        shortEntry,
        pruned,
        context
    };
}

MemoryService.commitAssistantTurnToMemory = commitAssistantTurnToMemory;

if (typeof window !== 'undefined') {
    window.commitAssistantTurnToMemory = commitAssistantTurnToMemory;
}
// ===== Full Turn Executor Helper API (v2.3.0-T) =====
async function executeChatTurnWithMemory(input = '', options = {}) {
    const {
        baseSystemPrompt = '',
        memoryOptions = {},
        promptOptions = {},
        commitOptions = {},
        llmRunner = null
    } = options;

    const turn = routeChatTurnWithMemory(input, {
        baseSystemPrompt,
        memoryOptions,
        promptOptions
    });

    if (turn.mode === 'direct') {
        return {
            ok: true,
            mode: 'direct',
            reply: turn.reply,
            committed: false,
            commitResult: null,
            turn
        };
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

    return {
        ok: true,
        mode: 'llm',
        reply: replyText,
        committed: commitResult.committed,
        commitResult,
        turn
    };
}

MemoryService.executeChatTurnWithMemory = executeChatTurnWithMemory;

if (typeof window !== 'undefined') {
    window.executeChatTurnWithMemory = executeChatTurnWithMemory;
}

// ===== Safe Turn Executor & Final Readiness Check (v2.3.0-U) =====
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

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.executeSafeChatTurnWithMemory = executeSafeChatTurnWithMemory;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.executeSafeChatTurnWithMemory = executeSafeChatTurnWithMemory;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Memory Summary & Lightweight Change Hook API (v2.3.0-V) =====
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
        summary: getMemorySnapshotSummary()
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

function getMemorySnapshotSummary() {
    const shortList = getShortMemories();
    const activeList = getActiveMemories();
    const profile = getProfileMemory();
    const events = getEvents();
    const favorites = getFavorites();
    const health = validateMemorySystem();

    const lastShort = Array.isArray(shortList) && shortList.length > 0
        ? shortList[shortList.length - 1]
        : null;

    return {
        healthy: Boolean(health && health.healthy),
        counts: {
            l1Short: Array.isArray(shortList) ? shortList.length : 0,
            l2Active: Array.isArray(activeList) ? activeList.length : 0,
            l3ProfileKeys: profile && typeof profile === 'object' ? Object.keys(profile).length : 0,
            l4Events: Array.isArray(events) ? events.length : 0,
            l5Favorites: Array.isArray(favorites) ? favorites.length : 0
        },
        profile: profile && typeof profile === 'object' ? { ...profile } : {},
        lastShortMessage: lastShort
            ? {
                role: lastShort.role || 'unknown',
                content: lastShort.content || ''
            }
            : null
    };
}

MemoryService.subscribeMemoryChange = subscribeMemoryChange;
MemoryService.emitMemoryChange = emitMemoryChange;
MemoryService.getMemorySnapshotSummary = getMemorySnapshotSummary;

if (typeof window !== 'undefined') {
    window.subscribeMemoryChange = subscribeMemoryChange;
    window.emitMemoryChange = emitMemoryChange;
    window.getMemorySnapshotSummary = getMemorySnapshotSummary;
}

// ===== Memory Operation Broadcast Wrapper & Final 37-API Check (v2.3.0-W) =====
function notifyAfterMemoryOp(eventName = 'memory_updated', operationFn = null, detail = {}) {
    const result = typeof operationFn === 'function' ? operationFn() : operationFn;
    emitMemoryChange(eventName, { ...detail, result });
    return result;
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.notifyAfterMemoryOp = notifyAfterMemoryOp;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.notifyAfterMemoryOp = notifyAfterMemoryOp;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Memory Panel ViewModel & Text Formatter API (v2.3.0-X) =====
function buildMemoryPanelViewModel(options = {}) {
    const {
        shortLimit = 10,
        activeLimit = 10,
        eventLimit = 10,
        favoriteLimit = 10
    } = options;

    const summary = getMemorySnapshotSummary();
    const shortList = Array.isArray(getShortMemories()) ? getShortMemories().slice(-shortLimit) : [];
    const activeList = Array.isArray(getActiveMemories()) ? getActiveMemories().slice(-activeLimit) : [];
    const profile = getProfileMemory() && typeof getProfileMemory() === 'object' ? { ...getProfileMemory() } : {};
    const events = Array.isArray(getEvents()) ? getEvents().slice(-eventLimit) : [];
    const favorites = Array.isArray(getFavorites()) ? getFavorites().slice(-favoriteLimit) : [];

    return {
        generatedAt: new Date().toISOString(),
        healthy: summary.healthy,
        counts: summary.counts,
        layers: {
            l1Short: shortList,
            l2Active: activeList,
            l3Profile: profile,
            l4Events: events,
            l5Favorites: favorites
        },
        lastShortMessage: summary.lastShortMessage
    };
}

function formatMemoryInspectorText(options = {}) {
    const vm = buildMemoryPanelViewModel(options);
    const { counts, layers } = vm;

    const lines = [
        `=== 薇薇記憶面板摘要 (healthy: ${vm.healthy}) ===`,
        `L1 近期對話: ${counts.l1Short} 筆 | L2 活躍任務: ${counts.l2Active} 筆 | L3 個人檔案: ${counts.l3ProfileKeys} 欄 | L4 事件: ${counts.l4Events} 筆 | L5 收藏: ${counts.l5Favorites} 筆`,
        '',
        '【L3 個人檔案】',
        JSON.stringify(layers.l3Profile, null, 2),
        '',
        `【L1 近期對話（顯示最近 ${layers.l1Short.length} 筆）】`,
        layers.l1Short.length
            ? layers.l1Short.map((m, i) => `${i + 1}. [${m.role || 'unknown'}] ${m.content || ''}`).join('\n')
            : '（無資料）',
        '',
        `【L5 收藏記憶（顯示最近 ${layers.l5Favorites.length} 筆）】`,
        layers.l5Favorites.length
            ? layers.l5Favorites.map((f, i) => `${i + 1}. ${f.title || f.content || JSON.stringify(f)}`).join('\n')
            : '（無資料）'
    ];

    return lines.join('\n');
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.buildMemoryPanelViewModel = buildMemoryPanelViewModel;
MemoryService.formatMemoryInspectorText = formatMemoryInspectorText;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.buildMemoryPanelViewModel = buildMemoryPanelViewModel;
    window.formatMemoryInspectorText = formatMemoryInspectorText;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Memory Panel Action Dispatcher API (v2.3.0-Y) =====
function runMemoryPanelAction(actionName = '', payload = {}) {
    try {
        let result = null;
        let eventName = `panel:${actionName || 'unknown'}`;

        switch (actionName) {
            case 'updateProfile': {
                result = updateProfileMemory(payload || {});
                eventName = 'profile_updated';
                break;
            }
            case 'addFavorite': {
                const item = typeof payload === 'string'
                    ? { title: payload, content: payload }
                    : (payload || {});
                result = addFavoriteMemory(item);
                eventName = 'favorite_added';
                break;
            }
            case 'removeFavorite': {
                result = removeFavoriteMemory(payload);
                eventName = 'favorite_removed';
                break;
            }
            case 'resetLayer': {
                const layer = typeof payload === 'string' ? payload : (payload && payload.layer);
                result = resetMemoryLayer(layer);
                eventName = 'layer_reset';
                break;
            }
            case 'exportSnapshot': {
                result = exportMemorySnapshot();
                eventName = 'snapshot_exported';
                break;
            }
            case 'importSnapshot': {
                result = importMemorySnapshot(payload);
                eventName = 'snapshot_imported';
                break;
            }
            case 'resetTesting': {
                result = resetMemoryForTesting(payload || { keepProfile: true, seedDemo: false });
                eventName = 'testing_reset';
                break;
            }
            default: {
                return {
                    ok: false,
                    action: actionName,
                    error: `不支援的記憶面板操作：${actionName}`,
                    result: null,
                    summary: getMemorySnapshotSummary()
                };
            }
        }

        const summary = emitMemoryChange(eventName, { action: actionName, result }).summary;

        return {
            ok: true,
            action: actionName,
            error: null,
            result,
            summary
        };
    } catch (err) {
        return {
            ok: false,
            action: actionName,
            error: err && err.message ? err.message : String(err),
            result: null,
            summary: getMemorySnapshotSummary()
        };
    }
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.runMemoryPanelAction = runMemoryPanelAction;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.runMemoryPanelAction = runMemoryPanelAction;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Optional DOM Memory Panel Controller API (v2.3.0-Z) =====
function renderMemoryPanel(container, options = {}) {
    const target = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!target || !(target instanceof HTMLElement)) {
        return { ok: false, reason: 'target_not_found' };
    }

    const vm = buildMemoryPanelViewModel(options);
    const { counts, layers } = vm;

    const favItemsHtml = layers.l5Favorites.length
        ? layers.l5Favorites.map((f, idx) => {
            const title = String(f.title || f.content || '未命名收藏')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            return `<li style="margin:4px 0;">#${idx + 1} ${title}</li>`;
        }).join('')
        : '<li style="color:#888;">（目前無收藏）</li>';

    const profileText = String(JSON.stringify(layers.l3Profile))
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    target.innerHTML = `
        <div style="border:1px solid #d0d7de;border-radius:10px;padding:12px;font-family:sans-serif;font-size:13px;background:#fafafa;color:#1f2328;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
                <strong>🧠 薇薇記憶面板</strong>
                <span style="font-size:12px;color:${vm.healthy ? '#1a7f37' : '#cf222e'};">
                    ${vm.healthy ? '● 系統正常' : '● 需檢查'}
                </span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;text-align:center;margin-bottom:10px;">
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">L1<br><b>${counts.l1Short}</b></div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">L2<br><b>${counts.l2Active}</b></div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">L3<br><b>${counts.l3ProfileKeys}</b></div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">L4<br><b>${counts.l4Events}</b></div>
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:6px;">L5<br><b>${counts.l5Favorites}</b></div>
            </div>
            <div style="margin-bottom:8px;font-size:12px;word-break:break-all;">
                <b>L3 個人檔案：</b>${profileText}
            </div>
            <div style="margin-bottom:10px;">
                <b style="font-size:12px;">L5 收藏：</b>
                <ul style="margin:4px 0 0 18px;padding:0;">${favItemsHtml}</ul>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button type="button" data-mem-act="refresh" style="padding:4px 10px;border-radius:6px;border:1px solid #c8d1da;background:#fff;cursor:pointer;">重新整理</button>
                <button type="button" data-mem-act="demoFav" style="padding:4px 10px;border-radius:6px;border:1px solid #c8d1da;background:#fff;cursor:pointer;">+ 測試收藏</button>
                <button type="button" data-mem-act="resetClean" style="padding:4px 10px;border-radius:6px;border:1px solid #c8d1da;background:#fff;cursor:pointer;">重設基準</button>
            </div>
        </div>
    `;

    return { ok: true, counts };
}

function mountMemoryPanel(container, options = {}) {
    const target = typeof container === 'string'
        ? document.querySelector(container)
        : container;

    if (!target || !(target instanceof HTMLElement)) {
        return {
            ok: false,
            reason: 'target_not_found',
            unmount: () => {}
        };
    }

    const handleClick = (event) => {
        const btn = event.target.closest('[data-mem-act]');
        if (!btn) return;
        const act = btn.getAttribute('data-mem-act');

        if (act === 'refresh') {
            renderMemoryPanel(target, options);
        } else if (act === 'demoFav') {
            runMemoryPanelAction('addFavorite', {
                title: '面板快捷收藏',
                content: `建立於 ${new Date().toLocaleTimeString()}`
            });
        } else if (act === 'resetClean') {
            runMemoryPanelAction('resetTesting', {
                keepProfile: true,
                seedDemo: false
            });
        }
    };

    target.addEventListener('click', handleClick);
    const unsubscribe = subscribeMemoryChange(() => {
        renderMemoryPanel(target, options);
    });

    renderMemoryPanel(target, options);

    return {
        ok: true,
        unmount: () => {
            target.removeEventListener('click', handleClick);
            unsubscribe();
            target.innerHTML = '';
        }
    };
}

MemoryService.renderMemoryPanel = renderMemoryPanel;
MemoryService.mountMemoryPanel = mountMemoryPanel;

if (typeof window !== 'undefined') {
    window.renderMemoryPanel = renderMemoryPanel;
    window.mountMemoryPanel = mountMemoryPanel;
}

// ===== Chat Main Flow Adapter API (v2.3.1-A) =====
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
            const runner = typeof overrides.llmRunner === 'function'
                ? overrides.llmRunner
                : llmRunner;

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
            return getMemorySnapshotSummary();
        }
    };
}

MemoryService.createMemoryChatAdapter = createMemoryChatAdapter;

if (typeof window !== 'undefined') {
    window.createMemoryChatAdapter = createMemoryChatAdapter;
}

// ===== Adapter Self-Test & 41-API Readiness Check (v2.3.1-B) =====
async function runMemoryAdapterSelfTest(options = {}) {
    const {
        testTimeoutMs = 50,
        slowDelayMs = 200,
        keepProfile = true
    } = options;

    const adapter = createMemoryChatAdapter({
        baseSystemPrompt: '你是薇薇，請用繁體中文簡潔回覆。',
        timeoutMs: testTimeoutMs,
        fallbackReply: '【測試逾時兜底】連線逾時，請稍後再試。'
    });

    // 1. 正常 LLM 回合
    const normalTurn = await adapter.sendMessage('測試正常 LLM 回合', {
        timeoutMs: 3000,
        llmRunner: async ({ userMessage }) => `已收到：${userMessage}`
    });

    // 2. 逾時保護測試
    const timeoutTurn = await adapter.sendMessage('測試逾時保護', {
        timeoutMs: testTimeoutMs,
        llmRunner: async () => {
            await new Promise((resolve) => setTimeout(resolve, slowDelayMs));
            return '這行逾時後不該被採用';
        }
    });

    // 3. 還原乾淨基準並檢查系統狀態
    resetMemoryForTesting({ keepProfile, seedDemo: false });
    const summaryAfterReset = getMemorySnapshotSummary();

    return {
        ok: Boolean(
            normalTurn && normalTurn.ok && normalTurn.committed &&
            timeoutTurn && timeoutTurn.ok === false && timeoutTurn.mode === 'error' &&
            summaryAfterReset.counts.l1Short === 0
        ),
        normalOk: normalTurn.ok,
        timeoutCaught: timeoutTurn.ok === false && timeoutTurn.mode === 'error',
        timeoutReply: timeoutTurn.reply,
        summaryAfterReset
    };
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.runMemoryAdapterSelfTest = runMemoryAdapterSelfTest;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.runMemoryAdapterSelfTest = runMemoryAdapterSelfTest;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Memory Module Unified Initializer & 45-API Check (v2.3.1-C) =====
function initMemoryModule(options = {}) {
    const {
        panelContainer = null,
        panelOptions = {},
        chatConfig = null,
        onChange = null
    } = options;

    const health = validateMemorySystem();
    const unsubscribeChange = typeof onChange === 'function'
        ? subscribeMemoryChange(onChange)
        : () => {};

    let panelController = { ok: false, reason: 'not_requested', unmount: () => {} };
    if (panelContainer && typeof document !== 'undefined') {
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
        summary: getMemorySnapshotSummary(),
        destroy() {
            unsubscribeChange();
            if (panelController && typeof panelController.unmount === 'function') {
                panelController.unmount();
            }
        }
    };
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest',
        'initMemoryModule'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.initMemoryModule = initMemoryModule;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.initMemoryModule = initMemoryModule;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Integration Readiness Pre-Flight Check & 46-API Check (v2.3.1-D) =====
function checkMemoryIntegrationReadiness(options = {}) {
    const {
        llmRunner = null,
        panelContainer = null,
        timeoutMs = 15000
    } = options;

    const apiReport = verifyMemorySystem();
    const summary = getMemorySnapshotSummary();
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

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest',
        'initMemoryModule',
        'checkMemoryIntegrationReadiness'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.checkMemoryIntegrationReadiness = checkMemoryIntegrationReadiness;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.checkMemoryIntegrationReadiness = checkMemoryIntegrationReadiness;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Full Regression Runner & 47-API Check (v2.3.1-E) =====
async function runMemoryFullRegressionCheck(options = {}) {
    const {
        keepProfile = true,
        testTimeoutMs = 50,
        slowDelayMs = 200
    } = options;

    const backupSnapshot = exportMemorySnapshot();

    try {
        const apiReport = verifyMemorySystem();
        const vm = buildMemoryPanelViewModel();
        const inspectorText = formatMemoryInspectorText();

        const favTest = runMemoryPanelAction('addFavorite', {
            title: '回歸測試收藏',
            content: '全套回歸驗證項目'
        });

        const adapterTest = await runMemoryAdapterSelfTest({
            testTimeoutMs,
            slowDelayMs,
            keepProfile
        });

        importMemorySnapshot(backupSnapshot);
        const restoredSummary = getMemorySnapshotSummary();

        return {
            ok: Boolean(
                apiReport && apiReport.ok &&
                vm && vm.healthy &&
                typeof inspectorText === 'string' && inspectorText.length > 0 &&
                favTest && favTest.ok &&
                adapterTest && adapterTest.ok &&
                restoredSummary && restoredSummary.healthy
            ),
            checkedAt: new Date().toISOString(),
            totalApis: apiReport.totalApis,
            apiOk: apiReport.ok,
            panelHealthy: vm.healthy,
            favActionOk: favTest.ok,
            adapterTestOk: adapterTest.ok,
            restoredSummary
        };
    } catch (err) {
        try {
            importMemorySnapshot(backupSnapshot);
        } catch (_) {}

        return {
            ok: false,
            checkedAt: new Date().toISOString(),
            error: err && err.message ? err.message : String(err),
            restoredSummary: getMemorySnapshotSummary()
        };
    }
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest',
        'initMemoryModule',
        'checkMemoryIntegrationReadiness',
        'runMemoryFullRegressionCheck'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.runMemoryFullRegressionCheck = runMemoryFullRegressionCheck;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.runMemoryFullRegressionCheck = runMemoryFullRegressionCheck;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Integration Snippet Generator & 48-API Check (v2.3.1-F) =====
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

    return {
        ok: true,
        runnerName: safeRunnerName,
        panelSelector: safeSelector,
        timeoutMs: safeTimeout,
        snippet
    };
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest',
        'initMemoryModule',
        'checkMemoryIntegrationReadiness',
        'runMemoryFullRegressionCheck',
        'buildMemoryIntegrationSnippet'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.buildMemoryIntegrationSnippet = buildMemoryIntegrationSnippet;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.buildMemoryIntegrationSnippet = buildMemoryIntegrationSnippet;
    window.verifyMemorySystem = verifyMemorySystem;
}

// ===== Collapsible Floating Memory Debug FAB & 49-API Check (v2.3.1-G) =====
function mountMemoryDebugFab(options = {}) {
    if (typeof document === 'undefined' || !document.body) {
        return { ok: false, reason: 'no_document_body', unmount: () => {} };
    }

    const {
        fabId = 'vivi-memory-debug-fab',
        startExpanded = false
    } = options;

    const existing = document.getElementById(fabId);
    if (existing) {
        existing.remove();
    }

    const host = document.createElement('div');
    host.id = fabId;
    host.style.cssText = [
        'position:fixed',
        'right:16px',
        'bottom:16px',
        'z-index:99999',
        'font-family:sans-serif',
        'font-size:12px'
    ].join(';');

    host.innerHTML = `
        <button type="button" data-fab-toggle style="padding:7px 12px;border-radius:999px;border:1px solid #c8d1da;background:#1f2328;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.18);">
            🧠 薇薇記憶
        </button>
        <div data-fab-drawer style="display:${startExpanded ? 'block' : 'none'};width:320px;max-height:70vh;overflow:auto;margin-top:8px;background:#fff;border:1px solid #d0d7de;border-radius:12px;padding:10px;box-shadow:0 8px 24px rgba(0,0,0,.18);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong>記憶除錯抽屜</strong>
                <button type="button" data-fab-close style="padding:2px 8px;border-radius:6px;border:1px solid #d0d7de;background:#f6f8fa;cursor:pointer;">收合</button>
            </div>
            <div data-fab-panel></div>
        </div>
    `;

    document.body.appendChild(host);

    const toggleBtn = host.querySelector('[data-fab-toggle]');
    const closeBtn = host.querySelector('[data-fab-close]');
    const drawer = host.querySelector('[data-fab-drawer]');
    const panelSlot = host.querySelector('[data-fab-panel]');

    const panelCtrl = mountMemoryPanel(panelSlot);

    const setOpen = (open) => {
        drawer.style.display = open ? 'block' : 'none';
    };

    const onToggle = () => setOpen(drawer.style.display === 'none');
    const onClose = () => setOpen(false);

    toggleBtn.addEventListener('click', onToggle);
    closeBtn.addEventListener('click', onClose);

    return {
        ok: true,
        id: fabId,
        open: () => setOpen(true),
        close: () => setOpen(false),
        unmount() {
            toggleBtn.removeEventListener('click', onToggle);
            closeBtn.removeEventListener('click', onClose);
            if (panelCtrl && typeof panelCtrl.unmount === 'function') {
                panelCtrl.unmount();
            }
            host.remove();
        }
    };
}

function verifyMemorySystem() {
    const requiredApis = [
        'getShortMemories',
        'getActiveMemories',
        'getProfileMemory',
        'getEvents',
        'getFavorites',
        'touchShortMemory',
        'setActiveMemory',
        'updateProfileMemory',
        'addEventMemory',
        'removeEventMemory',
        'findEventMemory',
        'queryEventsByFilter',
        'pruneShortMemories',
        'addFavoriteMemory',
        'removeFavoriteMemory',
        'findFavoriteMemory',
        'resetMemoryLayer',
        'clearAllMemories',
        'buildMemoryContext',
        'parseMemoryIntent',
        'dispatchMemoryIntent',
        'formatMemoryDispatchResult',
        'handleMemoryMessage',
        'exportMemorySnapshot',
        'importMemorySnapshot',
        'validateMemorySystem',
        'formatMemoryPromptBlock',
        'resetMemoryForTesting',
        'buildChatMemoryPayload',
        'routeChatTurnWithMemory',
        'commitAssistantTurnToMemory',
        'executeChatTurnWithMemory',
        'executeSafeChatTurnWithMemory',
        'subscribeMemoryChange',
        'emitMemoryChange',
        'getMemorySnapshotSummary',
        'notifyAfterMemoryOp',
        'buildMemoryPanelViewModel',
        'formatMemoryInspectorText',
        'runMemoryPanelAction',
        'renderMemoryPanel',
        'mountMemoryPanel',
        'createMemoryChatAdapter',
        'runMemoryAdapterSelfTest',
        'initMemoryModule',
        'checkMemoryIntegrationReadiness',
        'runMemoryFullRegressionCheck',
        'buildMemoryIntegrationSnippet',
        'mountMemoryDebugFab'
    ];

    const missingOnService = requiredApis.filter(
        (fn) => typeof MemoryService[fn] !== 'function'
    );
    const missingOnWindow = typeof window !== 'undefined'
        ? requiredApis.filter((fn) => typeof window[fn] !== 'function')
        : [];

    const health = validateMemorySystem();

    return {
        ok: missingOnService.length === 0 && missingOnWindow.length === 0 && health.healthy,
        checkedAt: new Date().toISOString(),
        totalApis: requiredApis.length,
        missingOnService,
        missingOnWindow,
        health
    };
}

MemoryService.mountMemoryDebugFab = mountMemoryDebugFab;
MemoryService.verifyMemorySystem = verifyMemorySystem;

if (typeof window !== 'undefined') {
    window.mountMemoryDebugFab = mountMemoryDebugFab;
    window.verifyMemorySystem = verifyMemorySystem;
}