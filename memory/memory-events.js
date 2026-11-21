// ================= Vivi Memory Events Module (v2.4.0) =================
// L4 事件記憶讀寫、CRUD、搜尋、自動抽取與防重複建立

function getEvents() {
    if (typeof readMemoryStorage !== 'function') {
        return [];
    }
    const data = readMemoryStorage('MEMORY_EVENTS', []);
    return Array.isArray(data) ? data : [];
}

function saveEvents(list) {
    if (typeof writeMemoryStorage !== 'function') {
        return false;
    }
    return writeMemoryStorage('MEMORY_EVENTS', Array.isArray(list) ? list : []);
}

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
        id: 'event_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        title: cleanTitle,
        date: typeof date === 'string' ? date.trim() : '',
        location: toStringArray(location),
        activities: toStringArray(activities),
        purchases: toStringArray(purchases),
        notes: typeof notes === 'string' ? notes.trim() : '',
        createdAt: new Date().toISOString()
    };

    events.unshift(newEvent);
    if (saveEvents(events)) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，则调用它以刷新内存适配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
        return newEvent;
    }
    return false;
}

function removeEventMemory(id) {
    if (!id) return false;
    const current = getEvents();
    const next = current.filter((item) => item && item.id !== id);
    if (next.length === current.length) return false;
    if (saveEvents(next)) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，则调用它以刷新内存适配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
        return true;
    }
    return false;
}

function findEventMemory(keyword) {
    const q = typeof keyword === 'string' ? keyword.trim().toLowerCase() : '';
    if (!q) return getEvents();

    // 對事件關鍵詞進行特殊處理，例如當查詢包含"紀念日"時，即使有前綴也能匹配到包含"紀念日"的事件
    const enhancedMatch = (haystack, needle) => {
        if (!haystack || !needle) return false;
        const lowerHaystack = String(haystack).toLowerCase();
        const lowerNeedle = String(needle).toLowerCase();
        
        // 如果直接包含，直接返回true
        if (lowerHaystack.includes(lowerNeedle)) return true;
        
        // 對於特定關鍵詞，檢查查詢中是否包含關鍵詞，即使有前綴
        const commonEventKeywords = ['紀念日', '生日', '週年', '旅遊', '旅行', '聚餐', '約會', '出差', '演唱會', '露營'];
        const matchedKeyword = commonEventKeywords.find(kw => lowerNeedle.includes(kw));
        if (matchedKeyword && lowerHaystack.includes(matchedKeyword)) return true;
        
        return false;
    };

    return getEvents().filter((item) => {
        if (!item || typeof item !== 'object') return false;
        const inTitle = enhancedMatch(item.title, q);
        const inDate = typeof item.date === 'string' && item.date.toLowerCase().includes(q);
        const inNotes = typeof item.notes === 'string' && enhancedMatch(item.notes, q);
        const inLocation = Array.isArray(item.location) && item.location.some((v) => enhancedMatch(v, q));
        const inActivities = Array.isArray(item.activities) && item.activities.some((v) => enhancedMatch(v, q));
        const inPurchases = Array.isArray(item.purchases) && item.purchases.some((v) => enhancedMatch(v, q));
        return inTitle || inDate || inNotes || inLocation || inActivities || inPurchases;
    });
}

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

function queryEventsByFilter({ keyword = '', dateFrom = '', dateTo = '', location = '' } = {}) {
    return searchEventMemory({ keyword, dateFrom, dateTo, location });
}

function buildEventMemorySummary(limit = 20) {
    const events = typeof getEvents === 'function' ? getEvents() : [];
    if (!Array.isArray(events) || !events.length) {
        return '';
    }

    const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 20;

    return events
        .slice(0, safeLimit)
        .map((ev) => {
            if (!ev || typeof ev !== 'object') return '';
            const locationText = Array.isArray(ev.location)
                ? ev.location.join('、')
                : '';
            const activityText = Array.isArray(ev.activities) ? ev.activities.join("、") : "";
            const purchaseText = Array.isArray(ev.purchases) ? ev.purchases.join("、") : "";
            return [
                `事件:${ev.title || ''}`,
                `日期:${ev.date || ''}`,
                `地點:${locationText}`,
                ...(activityText ? [`活動:${activityText}`] : []),
                ...(purchaseText ? [`花費:${purchaseText}`] : [])
            ].join(' | ');
        })
        .filter(Boolean)
        .join('\n');
}

function extractEventCandidate(text = '') {
    const raw = typeof text === 'string' ? text.trim() : '';
    if (!raw) return null;

    // 過濾明顯是查詢／提問的語句，避免把問句誤建成新事件
    const isQuestion =
        /[？?]$/.test(raw) ||
        /(哪裡|哪邊|什麼時候|何時|幾號|幾月|之前|上次|有沒有|記得嗎|問一下)/.test(raw);
    if (isQuestion) {
        return null;
    }

    // 1. 嘗試抓 YYYY-MM-DD 或 YYYY/MM/DD，若無則支援常見相對日期（今天／昨天／前天）
    const dateMatch = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    let date = '';
    if (dateMatch) {
        const y = dateMatch[1];
        const m = String(dateMatch[2]).padStart(2, '0');
        const d = String(dateMatch[3]).padStart(2, '0');
        date = `${y}-${m}-${d}`;
    } else {
        const offsetMap = { '今天': 0, '昨天': -1, '前天': -2 };
        const relMatch = raw.match(/(今天|昨天|前天)/);
        if (relMatch) {
            const base = new Date();
            base.setDate(base.getDate() + offsetMap[relMatch[1]]);
            const y = base.getFullYear();
            const m = String(base.getMonth() + 1).padStart(2, '0');
            const d = String(base.getDate()).padStart(2, '0');
            date = `${y}-${m}-${d}`;
        }
    }

    // 2. 常見事件關鍵詞當 title 候選
    const titleKeywords = [
        '結婚紀念日',
        '生日',
        '週年',
        '聖誕節',
        '跨年',
        '母親節',
        '父親節',
        '情人節',
        '旅遊',
        '旅行',
        '聚餐',
        '約會',
        '出差',
        '演唱會',
        '露營'
    ];
    const matchedTitle = titleKeywords.find((kw) => raw.includes(kw)) || '';

    // 3. 簡單抓「去/到/在 + 地點」候選（先維持保守、不過度猜測）
    const locations = [];
    const locMatch = raw.match(/(?:去|到|在)([^\s，。！？、,]{2,6}?)(?=(?:過|玩|住|吃|逛|紀念|慶生|旅遊|旅行|聚餐|約會|出差|演唱會|露營|生日|結婚紀念日|週年|去|$))/);
    if (locMatch && locMatch[1]) {
        locations.push(locMatch[1].trim());
    }

    // 4. 簡單抓活動（activities）：「吃了… / 逛了… / 住了… / 玩了…」
    const activities = [];
    const actMatches = raw.matchAll(/(?:吃了|逛了|住了|玩了|看了|泡了)([^，。！？、,]{1,12})/g);
    for (const m of actMatches) {
        if (m[1]) activities.push(m[0].trim());
    }

    // 5. 簡單抓花費／購買（purchases）：金額與「買了…」物品
    const purchases = [];
    const costMatch = raw.match(/(?:花了|消費|共花)\s*(\d+(?:\.\d+)?)\s*(?:元|塊)?/);
    if (costMatch && costMatch[1]) {
        purchases.push(`花費 ${costMatch[1]} 元`);
    }
    const buyMatches = raw.matchAll(/買了([^，。！？、,]{1,12})/g);
    for (const m of buyMatches) {
        if (m[1]) purchases.push(m[1].trim());
    }

    // 若完全沒有事件跡象，先回傳 null，避免把一般閒聊誤建成事件
    if (!date && !matchedTitle && locations.length === 0) {
        return null;
    }

    return {
        title: matchedTitle || raw.slice(0, 20),
        date,
        location: locations,
        activities,
        purchases,
        notes: raw
    };
}

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

function mergeUniqueStrings(baseList = [], extraList = []) {
    const merged = [];
    const seen = new Set();
    [...(Array.isArray(baseList) ? baseList : []), ...(Array.isArray(extraList) ? extraList : [])]
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .forEach((item) => {
            const key = item.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(item);
            }
        });
    return merged;
}

function findMatchingEventForMerge(candidate, events = getEvents()) {
    if (!candidate || typeof candidate !== 'object') return null;
    const list = Array.isArray(events) ? events : [];
    const normDate = String(candidate.date || '').trim();
    const normTitle = String(candidate.title || '').trim().toLowerCase();
    if (!normDate || !normTitle) return null;
    
    const candLocs = (Array.isArray(candidate.location) ? candidate.location : [])
        .map((v) => String(v || '').trim().toLowerCase())
        .filter(Boolean);
    
    return (
        list.find((ev) => {
            if (!ev || typeof ev !== 'object') return false;
            const evDate = String(ev.date || '').trim();
            const evTitle = String(ev.title || '').trim().toLowerCase();
            if (evDate !== normDate || evTitle !== normTitle) return false;
            
            const evLocs = (Array.isArray(ev.location) ? ev.location : [])
                .map((v) => String(v || '').trim().toLowerCase())
                .filter(Boolean);
            
            if (candLocs.length > 0 && evLocs.length > 0) {
                return candLocs.some((loc) => evLocs.includes(loc));
            }
            return true;
        }) || null
    );
}

function updateEventMemory(id, patch = {}) {
    if (!id || !patch || typeof patch !== 'object') return null;
    const current = getEvents();
    let updatedEvent = null;
    
    const next = current.map((item) => {
        if (!item || item.id !== id) return item;
        
        updatedEvent = {
            ...item,
            ...patch,
            location: patch.location !== undefined ? mergeUniqueStrings(patch.location) : mergeUniqueStrings(item.location),
            activities: patch.activities !== undefined ? mergeUniqueStrings(patch.activities) : mergeUniqueStrings(item.activities),
            purchases: patch.purchases !== undefined ? mergeUniqueStrings(patch.purchases) : mergeUniqueStrings(item.purchases)
        };
        
        return updatedEvent;
    });
    
    if (!updatedEvent) return null;
    const saved = saveEvents(next);
    if (saved) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，则调用它以刷新内存适配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
    }
    return saved ? updatedEvent : null;
}

function autoCreateEventFromText(text = '') {
    const candidate = extractEventCandidate(text);
    if (!candidate) return null;
    
    const current = getEvents();
    const matched = findMatchingEventForMerge(candidate, current);
    
    if (matched) {
        const mergedNotes = 
            candidate.notes && 
            (!matched.notes || !String(matched.notes).includes(candidate.notes))
                ? [matched.notes, candidate.notes].filter(Boolean).join(' | ')
                : matched.notes;
                
        const patch = { notes: mergedNotes };
        if (Array.isArray(candidate.location) && candidate.location.length > 0) {
            patch.location = mergeUniqueStrings(matched.location, candidate.location);
        }
        if (Array.isArray(candidate.activities) && candidate.activities.length > 0) {
            patch.activities = mergeUniqueStrings(matched.activities, candidate.activities);
        }
        if (Array.isArray(candidate.purchases) && candidate.purchases.length > 0) {
            patch.purchases = mergeUniqueStrings(matched.purchases, candidate.purchases);
        }
        
        const updated = updateEventMemory(matched.id, patch);
        if (updated) {
            // 如果存在 invalidateViviGeminiMemoryAdapter 函数，则调用它以刷新内存适配器
            if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
                window.invalidateViviGeminiMemoryAdapter();
            }
        }
        return updated;
    }
    
    const added = addEventMemory(candidate);
    if (added) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，则调用它以刷新内存适配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
    }
    return added;
}

const __eventsApis = {
    getEvents,
    saveEvents,
    addEventMemory,
    removeEventMemory,
    findEventMemory,
    searchEventMemory,
    queryEventsByFilter,
    buildEventMemorySummary,
    extractEventCandidate,
    isDuplicateEvent,
    autoCreateEventFromText,
    updateEventMemory,
    findMatchingEventForMerge,
    mergeUniqueStrings
};

if (typeof MemoryService !== 'undefined' && MemoryService && typeof MemoryService === 'object') {
    Object.assign(MemoryService, __eventsApis);
}

if (typeof window !== 'undefined') {
    if (window.MemoryService && typeof window.MemoryService === 'object') {
        Object.assign(window.MemoryService, __eventsApis);
    }
    Object.assign(window, __eventsApis);
}