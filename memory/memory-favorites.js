// ================= Vivi Memory Favorites Module (v2.3.2) =================
// L5 收藏記憶讀寫與 CRUD API

function getFavorites() {
    if (typeof readMemoryStorage !== 'function') {
        return [];
    }
    const data = readMemoryStorage('MEMORY_FAVORITES', []);
    return Array.isArray(data) ? data : [];
}

function saveFavorites(list) {
    if (typeof writeMemoryStorage !== 'function') {
        return false;
    }
    return writeMemoryStorage('MEMORY_FAVORITES', Array.isArray(list) ? list : []);
}

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
    if (saveFavorites(favorites)) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，則調用它以刷新記憶體適配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
        return newItem;
    }
    return false;
}

function removeFavoriteMemory(id) {
    if (!id) return false;
    const current = getFavorites();
    const next = current.filter((item) => item && item.id !== id);
    if (next.length === current.length) return false;
    if (saveFavorites(next)) {
        // 如果存在 invalidateViviGeminiMemoryAdapter 函数，則調用它以刷新記憶體適配器
        if (typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
            window.invalidateViviGeminiMemoryAdapter();
        }
        return true;
    }
    return false;
}

function updateFavoriteMemory(id, patch = {}) {

    if (!id) return null;

    const favorites = getFavorites();

    let updatedItem = null;

    const next = favorites.map(item => {

        if (item.id !== id) {
            return item;
        }

        updatedItem = {
            ...item,
            ...patch,
            updatedAt: new Date().toISOString()
        };

        return updatedItem;

    });

    saveFavorites(next);

    if (
        typeof window.invalidateViviGeminiMemoryAdapter === 'function'
    ) {
        window.invalidateViviGeminiMemoryAdapter();
    }

    return updatedItem;
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

function buildFavoriteMemorySummary(limit = 20) {
    const favorites = typeof getFavorites === 'function' ? getFavorites() : [];
    if (!Array.isArray(favorites) || !favorites.length) {
        return '';
    }
    const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 20;
    return favorites
        .slice(0, safeLimit)
        .map((fav) => {
            if (!fav || typeof fav !== 'object') return '';
            const rawTitle = typeof fav.title === 'string' ? fav.title.trim() : '';
            const rawContent = typeof fav.content === 'string' ? fav.content.trim() : '';
            const titleText = rawTitle || rawContent.slice(0, 24);
            const tagText = Array.isArray(fav.tags) && fav.tags.length
                ? fav.tags.filter(Boolean).join('、')
                : '';
            return [
                titleText ? `收藏:${titleText}` : '',
                rawContent ? `內容:${rawContent}` : '',
                tagText ? `標籤:${tagText}` : ''
            ]
            .filter(Boolean)
            .join(' | ');
        })
        .filter(Boolean)
        .join('\n');
}

const __favoritesApis = {
    getFavorites,
    saveFavorites,
    addFavoriteMemory,
    removeFavoriteMemory,
    updateFavoriteMemory,
    findFavoriteMemory,
    buildFavoriteMemorySummary
};

if (typeof MemoryService !== 'undefined' && MemoryService && typeof MemoryService === 'object') {
    Object.assign(MemoryService, __favoritesApis);
}

if (typeof window !== 'undefined') {
    if (window.MemoryService && typeof window.MemoryService === 'object') {
        Object.assign(window.MemoryService, __favoritesApis);
    }
    Object.assign(window, __favoritesApis);
}