// ================= Storage Service (Robust Version) =================

window.StorageService = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) {
                return defaultValue;
            }
            // 嘗試解析 JSON，如果失敗（代表它是純字串），直接回傳原字串
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            console.warn(`Storage 讀取失敗: ${key}`, error);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Storage 寫入失敗: ${key}`, error);
        }
    },
    
    remove(key) {
        localStorage.removeItem(key);
    },
    
    has(key) {
        return localStorage.getItem(key) !== null;
    },
    
    clear() {
        localStorage.clear();
    }
};