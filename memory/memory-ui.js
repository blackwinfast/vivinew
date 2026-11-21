// ================= 記憶管理介面 =================
(() => {
    const STYLE_ID = 'vivi-memory-ui-styles-v4';
    const DRAWER_ID = 'vivi-memory-ui-drawer';

    const PROFILE_LABELS = {
        city: '居住地 / 城市（city）',
        transportation: '交通工具（transportation）',
        assistantName: '助理名稱（assistantName）'
    };

    function formatProfileLabel(key) {
        return PROFILE_LABELS[key] || key;
    }

    function escapeHtml(val) {
        return String(val ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function ensureStyles() {
        if (typeof document === 'undefined') return;
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .vmui-backdrop {
                position: fixed;
                inset: 0;
                z-index: 1005;
                background: rgba(15, 23, 42, 0.45);
                display: none;
                justify-content: flex-end;
            }
            .vmui-backdrop.is-open {
                display: flex;
            }
            .vmui-panel {
                width: min(540px, 100vw);
                height: 100%;
                background: #ffffff;
                color: #202124;
                display: flex;
                flex-direction: column;
                box-shadow: -8px 0 30px rgba(15, 23, 42, 0.2);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
            }
            .vmui-inline-box {
                border: 1px solid #e6ddd5;
                border-radius: 12px;
                background: #ffffff;
                color: #202124;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
            }
            .vmui-header {
                padding: 12px 14px;
                border-bottom: 1px solid #efe7e0;
                background: #fcfaf8;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                flex-wrap: wrap;
            }
            .vmui-title {
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                color: #333333;
            }
            .vmui-actions {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
            }
            .vmui-btn {
                padding: 5px 10px;
                border-radius: 8px;
                border: 1px solid #dfd3c8;
                background: #ffffff;
                color: #3c4043;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s ease, border-color 0.15s ease;
            }
            .vmui-btn:hover {
                background: #f7f2ed;
                border-color: #d4b89c;
            }
            .vmui-btn-primary {
                border-color: #d49b72;
                background: #d49b72;
                color: #ffffff;
            }
            .vmui-btn-primary:hover {
                background: #c3875d;
                border-color: #c3875d;
            }
            .vmui-btn-danger {
                border-color: #f5c2c7;
                background: #fff5f5;
                color: #c62828;
            }
            .vmui-btn-danger:hover {
                background: #ffe5e8;
            }
            .vmui-tabs {
                display: flex;
                border-bottom: 1px solid #efe7e0;
                background: #faf6f2;
                padding: 0 6px;
            }
            .vmui-tab {
                flex: 1;
                padding: 9px 6px;
                border: none;
                background: transparent;
                color: #5f6368;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                border-bottom: 2px solid transparent;
            }
            .vmui-tab.is-active {
                color: #b87446;
                border-bottom-color: #d49b72;
                background: rgba(212, 155, 114, 0.08);
            }
            .vmui-toolbar {
                padding: 8px 14px;
                border-bottom: 1px solid #f3ede7;
                background: #ffffff;
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .vmui-search, .vmui-input, .vmui-textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 7px 10px;
                border: 1px solid #dcd3ca;
                border-radius: 8px;
                font-size: 13px;
                color: #202124;
                background: #ffffff;
            }
            .vmui-search:focus, .vmui-input:focus, .vmui-textarea:focus {
                outline: none;
                border-color: #d49b72;
            }
            .vmui-search {
                flex: 1;
            }
            .vmui-body {
                max-height: 360px;
                overflow-y: auto;
                padding: 12px 14px;
                background: #ffffff;
            }
            .vmui-panel .vmui-body {
                flex: 1;
                max-height: none;
            }
            .vmui-card {
                border: 1px solid #ece3da;
                border-radius: 10px;
                padding: 10px 12px;
                margin-bottom: 10px;
                background: #fdfbfa;
            }
            .vmui-card-head {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 8px;
                margin-bottom: 6px;
            }
            .vmui-card-title {
                font-weight: 700;
                font-size: 13px;
                color: #202124;
                word-break: break-word;
            }
            .vmui-card-btns {
                display: flex;
                gap: 6px;
                flex-shrink: 0;
            }
            .vmui-meta {
                font-size: 12px;
                color: #555555;
                line-height: 1.55;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .vmui-tag {
                display: inline-block;
                margin-top: 6px;
                margin-right: 6px;
                padding: 2px 8px;
                font-size: 11px;
                border-radius: 999px;
                background: #f5ebe2;
                color: #9e5d32;
                font-weight: 600;
            }
            .vmui-field {
                margin-bottom: 8px;
            }
            .vmui-label {
                display: block;
                font-size: 12px;
                color: #555555;
                margin-bottom: 3px;
                font-weight: 600;
            }
            .vmui-empty {
                text-align: center;
                color: #777777;
                padding: 24px 12px;
                font-size: 13px;
            }
            .vmui-status {
                padding: 7px 14px;
                font-size: 12px;
                color: #555555;
                background: #faf6f2;
                border-top: 1px solid #efe7e0;
            }
        `;
        document.head.appendChild(style);
    }

    function notifyAfterMutation(eventName, detail = {}) {
        try {
            if (typeof invalidateViviGeminiMemoryAdapter === 'function') {
                invalidateViviGeminiMemoryAdapter(eventName);
            } else if (typeof window !== 'undefined' && typeof window.invalidateViviGeminiMemoryAdapter === 'function') {
                window.invalidateViviGeminiMemoryAdapter(eventName);
            }
        } catch (_) {}

        try {
            if (typeof notifyAfterMemoryOp === 'function') {
                notifyAfterMemoryOp(eventName, detail);
            } else if (typeof emitMemoryChange === 'function') {
                emitMemoryChange(eventName, detail);
            }
        } catch (_) {}
    }

    function readProfileSafe() {
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.getProfileMemory === 'function') {
            return MemoryService.getProfileMemory();
        }
        return typeof getProfileMemory === 'function' ? getProfileMemory() : {};
    }

    function saveProfileFieldSafe(key, nextValue) {
        const cleanKey = String(key || '').trim();
        if (!cleanKey) return false;
        const patch = { [cleanKey]: nextValue };
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.updateProfileMemory === 'function') {
            MemoryService.updateProfileMemory(patch);
        } else if (typeof updateProfileMemory === 'function') {
            updateProfileMemory(patch);
        } else {
            return false;
        }
        notifyAfterMutation('profile_updated', { key: cleanKey, value: nextValue });
        return true;
    }

    function readEventsSafe(keyword = '') {
        const q = String(keyword || '').trim();
        if (q) {
            if (typeof MemoryService !== 'undefined' && typeof MemoryService.findEventMemory === 'function') {
                return MemoryService.findEventMemory(q);
            }
            if (typeof findEventMemory === 'function') {
                return findEventMemory(q);
            }
        }
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.getEvents === 'function') {
            return MemoryService.getEvents();
        }
        return typeof getEvents === 'function' ? getEvents() : [];
    }

    function parseCommaList(text) {
        return String(text || '')
            .split(/[、,，]/)
            .map((s) => s.trim())
            .filter(Boolean);
    }

    function saveEventItemSafe(ev, draft) {
        if (!ev) return false;
        const updated = {
            ...ev,
            title: String(draft.title || '').trim() || ev.title || '未命名事件',
            date: String(draft.date || '').trim(),
            location: parseCommaList(draft.location),
            activities: parseCommaList(draft.activities),
            purchases: parseCommaList(draft.purchases),
            notes: String(draft.notes || '').trim(),
            updatedAt: new Date().toISOString()
        };

        if (typeof MemoryService !== 'undefined' && typeof MemoryService.updateEventMemory === 'function') {
            MemoryService.updateEventMemory(ev.id, updated);
            notifyAfterMutation('event_updated', { event: updated });
            return true;
        }
        if (typeof updateEventMemory === 'function') {
            updateEventMemory(ev.id, updated);
            notifyAfterMutation('event_updated', { event: updated });
            return true;
        }

        const all = readEventsSafe('');
        if (!Array.isArray(all)) return false;
        const idx = all.findIndex((item) => item === ev || (ev.id && item && item.id === ev.id));
        if (idx === -1) return false;
        all[idx] = updated;

        if (typeof saveEvents === 'function') {
            saveEvents(all);
        } else if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.MEMORY_EVENTS && typeof setStorageItem === 'function') {
            setStorageItem(STORAGE_KEYS.MEMORY_EVENTS, all);
        } else {
            return false;
        }
        notifyAfterMutation('event_updated', { event: updated });
        return true;
    }

    function createEventItemSafe(draft) {
        const newItem = {
            title: String(draft.title || '').trim() || '未命名事件',
            date: String(draft.date || '').trim(),
            location: parseCommaList(draft.location),
            activities: parseCommaList(draft.activities),
            purchases: parseCommaList(draft.purchases),
            notes: String(draft.notes || '').trim()
        };
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.addEventMemory === 'function') {
            MemoryService.addEventMemory(newItem);
            notifyAfterMutation('event_added', { event: newItem });
            return true;
        }
        if (typeof addEventMemory === 'function') {
            addEventMemory(newItem);
            notifyAfterMutation('event_added', { event: newItem });
            return true;
        }
        return false;
    }

    function removeEventItemSafe(ev) {
        if (!ev) return false;
        const targetId = ev.id || ev.title;
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.removeEventMemory === 'function') {
            MemoryService.removeEventMemory(targetId);
            notifyAfterMutation('event_removed', { id: targetId });
            return true;
        }
        if (typeof removeEventMemory === 'function') {
            removeEventMemory(targetId);
            notifyAfterMutation('event_removed', { id: targetId });
            return true;
        }
        return false;
    }

    function readFavoritesSafe(keyword = '') {
        const q = String(keyword || '').trim();
        if (q) {
            if (typeof MemoryService !== 'undefined' && typeof MemoryService.findFavoriteMemory === 'function') {
                return MemoryService.findFavoriteMemory(q);
            }
            if (typeof findFavoriteMemory === 'function') {
                return findFavoriteMemory(q);
            }
        }
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.getFavorites === 'function') {
            return MemoryService.getFavorites();
        }
        return typeof getFavorites === 'function' ? getFavorites() : [];
    }

    function saveFavoriteItemSafe(fav, draft) {
        if (!fav) return false;
        const updated = {
            ...fav,
            title: String(draft.title || '').trim() || fav.title || '未命名收藏',
            content: String(draft.content || '').trim(),
            tags: parseCommaList(draft.tags),
            updatedAt: new Date().toISOString()
        };

        if (typeof MemoryService !== 'undefined' && typeof MemoryService.updateFavoriteMemory === 'function') {
            MemoryService.updateFavoriteMemory(fav.id, updated);
            notifyAfterMutation('favorite_updated', { favorite: updated });
            return true;
        }
        if (typeof updateFavoriteMemory === 'function') {
            updateFavoriteMemory(fav.id, updated);
            notifyAfterMutation('favorite_updated', { favorite: updated });
            return true;
        }

        const all = readFavoritesSafe('');
        if (!Array.isArray(all)) return false;
        const idx = all.findIndex((item) => item === fav || (fav.id && item && item.id === fav.id));
        if (idx === -1) return false;
        all[idx] = updated;

        if (typeof saveFavorites === 'function') {
            saveFavorites(all);
        } else if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.MEMORY_FAVORITES && typeof setStorageItem === 'function') {
            setStorageItem(STORAGE_KEYS.MEMORY_FAVORITES, all);
        } else {
            return false;
        }
        notifyAfterMutation('favorite_updated', { favorite: updated });
        return true;
    }

    function createFavoriteItemSafe(draft) {
        const newItem = {
            title: String(draft.title || '').trim() || '未命名收藏',
            content: String(draft.content || '').trim(),
            tags: parseCommaList(draft.tags)
        };
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.addFavoriteMemory === 'function') {
            MemoryService.addFavoriteMemory(newItem);
            notifyAfterMutation('favorite_added', { favorite: newItem });
            return true;
        }
        if (typeof addFavoriteMemory === 'function') {
            addFavoriteMemory(newItem);
            notifyAfterMutation('favorite_added', { favorite: newItem });
            return true;
        }
        return false;
    }

    function removeFavoriteItemSafe(fav) {
        if (!fav) return false;
        const targetId = fav.id || fav.title || fav.content;
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.removeFavoriteMemory === 'function') {
            MemoryService.removeFavoriteMemory(targetId);
            notifyAfterMutation('favorite_removed', { id: targetId });
            return true;
        }
        if (typeof removeFavoriteMemory === 'function') {
            removeFavoriteMemory(targetId);
            notifyAfterMutation('favorite_removed', { id: targetId });
            return true;
        }
        return false;
    }

    function buildSnapshotSafe() {
        if (typeof MemoryService !== 'undefined' && typeof MemoryService.exportMemorySnapshot === 'function') {
            return MemoryService.exportMemorySnapshot();
        }
        if (typeof exportMemorySnapshot === 'function') {
            return exportMemorySnapshot();
        }
        return {
            exportedAt: new Date().toISOString(),
            layers: {
                profile: readProfileSafe(),
                events: readEventsSafe(''),
                favorites: readFavoritesSafe('')
            }
        };
    }

    function importSnapshotSafe(rawData) {
        const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (!parsed || typeof parsed !== 'object') {
            throw new Error('備份格式不正確');
        }

        if (typeof MemoryService !== 'undefined' && typeof MemoryService.importMemorySnapshot === 'function') {
            MemoryService.importMemorySnapshot(parsed);
            notifyAfterMutation('snapshot_imported', { importedAt: new Date().toISOString() });
            return true;
        }
        if (typeof importMemorySnapshot === 'function') {
            importMemorySnapshot(parsed);
            notifyAfterMutation('snapshot_imported', { importedAt: new Date().toISOString() });
            return true;
        }

        const layers = parsed.layers && typeof parsed.layers === 'object' ? parsed.layers : parsed;
        if (layers.profile && typeof layers.profile === 'object') {
            if (typeof updateProfileMemory === 'function') {
                updateProfileMemory(layers.profile);
            } else if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.MEMORY_PROFILE && typeof setStorageItem === 'function') {
                setStorageItem(STORAGE_KEYS.MEMORY_PROFILE, layers.profile);
            }
        }
        if (Array.isArray(layers.events)) {
            if (typeof saveEvents === 'function') {
                saveEvents(layers.events);
            } else if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.MEMORY_EVENTS && typeof setStorageItem === 'function') {
                setStorageItem(STORAGE_KEYS.MEMORY_EVENTS, layers.events);
            }
        }
        if (Array.isArray(layers.favorites)) {
            if (typeof saveFavorites === 'function') {
                saveFavorites(layers.favorites);
            } else if (typeof STORAGE_KEYS !== 'undefined' && STORAGE_KEYS.MEMORY_FAVORITES && typeof setStorageItem === 'function') {
                setStorageItem(STORAGE_KEYS.MEMORY_FAVORITES, layers.favorites);
            }
        }

        notifyAfterMutation('snapshot_imported', { importedAt: new Date().toISOString() });
        return true;
    }

    function triggerJsonDownload(snapshot) {
        const jsonStr = JSON.stringify(snapshot, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const stamp = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-snapshot-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function mountMemoryPanel(targetContainer = null, options = {}) {
        if (typeof document === 'undefined') {
            return { ok: false, reason: 'no_document', unmount: () => {} };
        }

        ensureStyles();

        let activeTab = ['profile', 'events', 'favorites'].includes(options.defaultTab)
            ? options.defaultTab
            : 'profile';
        let searchKeyword = '';
        let statusMessage = '就緒（可檢視、搜尋、編輯、刪除、匯入與匯出）';
        let editingKey = null;
        let addingProfileField = false;
        let addingEvent = false;
        let editingEventIdx = null;
        let addingFavorite = false;
        let editingFavoriteIdx = null;

        const hostEl = targetContainer
            ? (typeof targetContainer === 'string' ? document.querySelector(targetContainer) : targetContainer)
            : null;

        let backdropEl = null;
        let panelContainerEl = null;

        if (hostEl) {
            hostEl.innerHTML = '<div class="vmui-inline-box"></div>';
            panelContainerEl = hostEl.querySelector('.vmui-inline-box');
        } else {
            backdropEl = document.getElementById(DRAWER_ID);
            if (!backdropEl) {
                backdropEl = document.createElement('div');
                backdropEl.id = DRAWER_ID;
                backdropEl.className = 'vmui-backdrop';
                backdropEl.innerHTML = '<div class="vmui-panel" role="dialog" aria-label="記憶管理面板"></div>';
                document.body.appendChild(backdropEl);
            }
            panelContainerEl = backdropEl.querySelector('.vmui-panel');
        }

        function resetEditStates() {
            editingKey = null;
            addingProfileField = false;
            addingEvent = false;
            editingEventIdx = null;
            addingFavorite = false;
            editingFavoriteIdx = null;
        }

        function setOpen(nextOpen) {
            if (!backdropEl) return;
            backdropEl.classList.toggle('is-open', Boolean(nextOpen));
            if (nextOpen) {
                render();
            }
        }

        function renderProfileTab() {
            const profile = readProfileSafe();
            const entries = profile && typeof profile === 'object' ? Object.entries(profile) : [];

            const addBoxHtml = addingProfileField ? `
                <div class="vmui-card" style="background:#faf6f2;border-color:#e4c9b2;">
                    <div class="vmui-field">
                        <label class="vmui-label">欄位名稱</label>
                        <input type="text" class="vmui-input" data-role="new-profile-key" placeholder="例如：喜歡喝的飲料" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">欄位內容</label>
                        <input type="text" class="vmui-input" data-role="new-profile-val" placeholder="例如：無糖拿鐵" />
                    </div>
                    <div class="vmui-card-btns">
                        <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-new-profile">儲存新增</button>
                        <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                    </div>
                </div>
            ` : '';

            const headerAddHtml = `
                <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
                    <button type="button" class="vmui-btn" data-action="add-profile-field">＋ 新增欄位</button>
                </div>
            `;

            if (!entries.length) {
                return headerAddHtml + addBoxHtml + '<div class="vmui-empty">目前尚無個人檔案資料（L3）</div>';
            }

            const cardsHtml = entries.map(([key, val]) => {
                const rawText = typeof val === 'object' && val !== null
                    ? JSON.stringify(val, null, 2)
                    : String(val ?? '');
                const labelText = formatProfileLabel(key);

                if (editingKey === key) {
                    return `
                        <div class="vmui-card" style="border-color:#d49b72;background:#fff;">
                            <div class="vmui-card-title">${escapeHtml(labelText)}</div>
                            <div class="vmui-field" style="margin-top:6px;">
                                <textarea class="vmui-textarea" rows="3" data-role="edit-profile-val">${escapeHtml(rawText)}</textarea>
                            </div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-profile" data-key="${escapeHtml(key)}">儲存</button>
                                <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="vmui-card">
                        <div class="vmui-card-head">
                            <div class="vmui-card-title">${escapeHtml(labelText)}</div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn" data-action="edit-profile" data-key="${escapeHtml(key)}">編輯</button>
                                <button type="button" class="vmui-btn vmui-btn-danger" data-action="del-profile" data-key="${escapeHtml(key)}">刪除</button>
                            </div>
                        </div>
                        <div class="vmui-meta">${escapeHtml(rawText)}</div>
                    </div>
                `;
            }).join('');

            return headerAddHtml + addBoxHtml + cardsHtml;
        }

        function renderEventsTab() {
            const list = readEventsSafe(searchKeyword);
            const headerAddHtml = `
                <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
                    <button type="button" class="vmui-btn" data-action="add-event">＋ 新增事件</button>
                </div>
            `;
            const addBoxHtml = addingEvent ? `
                <div class="vmui-card" style="background:#faf6f2;border-color:#e4c9b2;">
                    <div class="vmui-field">
                        <label class="vmui-label">事件標題</label>
                        <input type="text" class="vmui-input" data-role="new-ev-title" placeholder="例如：週末板橋聚餐" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">日期</label>
                        <input type="text" class="vmui-input" data-role="new-ev-date" placeholder="例如：2026-11-21" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">地點（多筆以逗號或頓號分隔）</label>
                        <input type="text" class="vmui-input" data-role="new-ev-location" placeholder="例如：板橋" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">活動</label>
                        <input type="text" class="vmui-input" data-role="new-ev-activities" placeholder="例如：吃火鍋、聊天" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">花費</label>
                        <input type="text" class="vmui-input" data-role="new-ev-purchases" placeholder="例如：850 元" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">備註</label>
                        <textarea class="vmui-textarea" rows="2" data-role="new-ev-notes" placeholder="補充說明..."></textarea>
                    </div>
                    <div class="vmui-card-btns">
                        <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-new-event">儲存新增</button>
                        <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                    </div>
                </div>
            ` : '';

            if (!Array.isArray(list) || !list.length) {
                return headerAddHtml + addBoxHtml + `<div class="vmui-empty">${searchKeyword ? '找不到符合的事件記憶' : '目前尚無事件記憶（L4）'}</div>`;
            }

            const cardsHtml = list.map((ev, idx) => {
                const locs = Array.isArray(ev.location) ? ev.location.join('、') : String(ev.location || '');
                const acts = Array.isArray(ev.activities) ? ev.activities.join('、') : String(ev.activities || '');
                const purs = Array.isArray(ev.purchases) ? ev.purchases.join('、') : String(ev.purchases || '');

                if (editingEventIdx === idx) {
                    return `
                        <div class="vmui-card" style="border-color:#d49b72;background:#fff;">
                            <div class="vmui-field">
                                <label class="vmui-label">事件標題</label>
                                <input type="text" class="vmui-input" data-role="ev-title" value="${escapeHtml(ev.title || '')}" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">日期</label>
                                <input type="text" class="vmui-input" data-role="ev-date" value="${escapeHtml(ev.date || '')}" placeholder="年-月-日（例如：2026-11-20）" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">地點（多筆以逗號或頓號分隔）</label>
                                <input type="text" class="vmui-input" data-role="ev-location" value="${escapeHtml(locs)}" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">活動</label>
                                <input type="text" class="vmui-input" data-role="ev-activities" value="${escapeHtml(acts)}" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">花費</label>
                                <input type="text" class="vmui-input" data-role="ev-purchases" value="${escapeHtml(purs)}" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">備註</label>
                                <textarea class="vmui-textarea" rows="2" data-role="ev-notes">${escapeHtml(ev.notes || '')}</textarea>
                            </div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-event" data-idx="${idx}">儲存</button>
                                <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                            </div>
                        </div>
                    `;
                }

                const lines = [
                    ev.date ? `日期：${ev.date}` : '',
                    locs ? `地點：${locs}` : '',
                    acts ? `活動：${acts}` : '',
                    purs ? `花費：${purs}` : '',
                    ev.notes ? `備註：${ev.notes}` : ''
                ].filter(Boolean).join('\n');

                return `
                    <div class="vmui-card">
                        <div class="vmui-card-head">
                            <div class="vmui-card-title">${escapeHtml(ev.title || '未命名事件')}</div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn" data-action="edit-event" data-idx="${idx}">編輯</button>
                                <button type="button" class="vmui-btn vmui-btn-danger" data-action="del-event" data-idx="${idx}">刪除</button>
                            </div>
                        </div>
                        <div class="vmui-meta">${escapeHtml(lines || '（無詳細欄位）')}</div>
                    </div>
                `;
            }).join('');

            return headerAddHtml + addBoxHtml + cardsHtml;
        }

        function renderFavoritesTab() {
            const list = readFavoritesSafe(searchKeyword);
            const headerAddHtml = `
                <div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
                    <button type="button" class="vmui-btn" data-action="add-favorite">＋ 新增收藏</button>
                </div>
            `;
            const addBoxHtml = addingFavorite ? `
                <div class="vmui-card" style="background:#faf6f2;border-color:#e4c9b2;">
                    <div class="vmui-field">
                        <label class="vmui-label">收藏標題</label>
                        <input type="text" class="vmui-input" data-role="new-fav-title" placeholder="例如：板橋必吃清單" />
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">收藏內容</label>
                        <textarea class="vmui-textarea" rows="3" data-role="new-fav-content" placeholder="輸入收藏內容..."></textarea>
                    </div>
                    <div class="vmui-field">
                        <label class="vmui-label">標籤（以逗號或頓號分隔）</label>
                        <input type="text" class="vmui-input" data-role="new-fav-tags" placeholder="例如：美食, 板橋, 聚餐" />
                    </div>
                    <div class="vmui-card-btns">
                        <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-new-favorite">儲存新增</button>
                        <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                    </div>
                </div>
            ` : '';

            if (!Array.isArray(list) || !list.length) {
                return headerAddHtml + addBoxHtml + `<div class="vmui-empty">${searchKeyword ? '找不到符合的收藏記憶' : '目前尚無收藏記憶（L5）'}</div>`;
            }

            const cardsHtml = list.map((fav, idx) => {
                const tags = Array.isArray(fav.tags) ? fav.tags.filter(Boolean) : [];

                if (editingFavoriteIdx === idx) {
                    return `
                        <div class="vmui-card" style="border-color:#d49b72;background:#fff;">
                            <div class="vmui-field">
                                <label class="vmui-label">收藏標題</label>
                                <input type="text" class="vmui-input" data-role="fav-title" value="${escapeHtml(fav.title || '')}" />
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">收藏內容</label>
                                <textarea class="vmui-textarea" rows="3" data-role="fav-content">${escapeHtml(fav.content || '')}</textarea>
                            </div>
                            <div class="vmui-field">
                                <label class="vmui-label">標籤（以逗號或頓號分隔）</label>
                                <input type="text" class="vmui-input" data-role="fav-tags" value="${escapeHtml(tags.join('、'))}" />
                            </div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn vmui-btn-primary" data-action="save-favorite" data-idx="${idx}">儲存</button>
                                <button type="button" class="vmui-btn" data-action="cancel-edit">取消</button>
                            </div>
                        </div>
                    `;
                }

                const tagsHtml = tags.map((t) => `<span class="vmui-tag">#${escapeHtml(t)}</span>`).join('');
                return `
                    <div class="vmui-card">
                        <div class="vmui-card-head">
                            <div class="vmui-card-title">${escapeHtml(fav.title || '未命名收藏')}</div>
                            <div class="vmui-card-btns">
                                <button type="button" class="vmui-btn" data-action="edit-favorite" data-idx="${idx}">編輯</button>
                                <button type="button" class="vmui-btn vmui-btn-danger" data-action="del-favorite" data-idx="${idx}">刪除</button>
                            </div>
                        </div>
                        <div class="vmui-meta">${escapeHtml(fav.content || '')}</div>
                        ${tagsHtml ? `<div>${tagsHtml}</div>` : ''}
                    </div>
                `;
            }).join('');

            return headerAddHtml + addBoxHtml + cardsHtml;
        }

        function render() {
            if (!panelContainerEl) return;

            const showSearch = activeTab === 'events' || activeTab === 'favorites';
            const bodyHtml = activeTab === 'profile'
                ? renderProfileTab()
                : (activeTab === 'favorites' ? renderFavoritesTab() : renderEventsTab());

            panelContainerEl.innerHTML = `
                <div class="vmui-header">
                    <h3 class="vmui-title">記憶管理</h3>
                    <div class="vmui-actions">
                        <button type="button" class="vmui-btn" data-action="import">匯入備份</button>
                        <button type="button" class="vmui-btn vmui-btn-primary" data-action="export">匯出備份</button>
                        <input type="file" accept=".json,application/json" data-role="import-file" style="display:none;" />
                        ${backdropEl ? '<button type="button" class="vmui-btn" data-action="close">關閉</button>' : ''}
                    </div>
                </div>
                <div class="vmui-tabs">
                    <button type="button" class="vmui-tab ${activeTab === 'profile' ? 'is-active' : ''}" data-tab="profile">L3 個人檔案</button>
                    <button type="button" class="vmui-tab ${activeTab === 'events' ? 'is-active' : ''}" data-tab="events">L4 事件記憶</button>
                    <button type="button" class="vmui-tab ${activeTab === 'favorites' ? 'is-active' : ''}" data-tab="favorites">L5 收藏記憶</button>
                </div>
                ${showSearch ? `
                    <div class="vmui-toolbar">
                        <input type="search" class="vmui-search" data-role="search" placeholder="輸入關鍵字篩選..." value="${escapeHtml(searchKeyword)}" />
                        ${searchKeyword ? '<button type="button" class="vmui-btn" data-action="clear-search">清除</button>' : ''}
                    </div>
                ` : ''}
                <div class="vmui-body">${bodyHtml}</div>
                <div class="vmui-status">${escapeHtml(statusMessage)}</div>
            `;

            panelContainerEl.querySelectorAll('[data-tab]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    activeTab = btn.getAttribute('data-tab');
                    searchKeyword = '';
                    resetEditStates();
                    statusMessage = `已切換至 ${btn.textContent}`;
                    render();
                });
            });

            const searchInput = panelContainerEl.querySelector('[data-role="search"]');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchKeyword = e.target.value || '';
                    resetEditStates();
                    statusMessage = searchKeyword ? `篩選關鍵字：「${searchKeyword}」` : '顯示全部項目';
                    render();
                    const nextInput = panelContainerEl.querySelector('[data-role="search"]');
                    if (nextInput) {
                        nextInput.focus();
                        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
                    }
                });
            }

            const fileInput = panelContainerEl.querySelector('[data-role="import-file"]');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target && e.target.files && e.target.files[0];
                    if (!file) return;
                    if (typeof confirm === 'function' && !confirm(`確定要從「${file.name}」匯入記憶備份嗎？這可能會覆蓋現有記憶資料。`)) {
                        fileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            importSnapshotSafe(reader.result);
                            resetEditStates();
                            statusMessage = `已匯入備份「${file.name}」（${new Date().toLocaleTimeString('zh-TW')}）`;
                        } catch (err) {
                            statusMessage = `匯入失敗：${err && err.message ? err.message : '檔案格式錯誤'}`;
                        }
                        render();
                    };
                    reader.onerror = () => {
                        statusMessage = '匯入失敗：無法讀取檔案';
                        render();
                    };
                    reader.readAsText(file, 'utf-8');
                });
            }

            panelContainerEl.querySelectorAll('[data-action]').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const act = btn.getAttribute('data-action');

                    if (act === 'close') {
                        setOpen(false);
                        return;
                    }
                    if (act === 'import') {
                        if (fileInput) {
                            fileInput.value = '';
                            fileInput.click();
                        }
                        return;
                    }
                    if (act === 'export') {
                        triggerJsonDownload(buildSnapshotSafe());
                        statusMessage = `已匯出備份（${new Date().toLocaleTimeString('zh-TW')}）`;
                        render();
                        return;
                    }
                    if (act === 'clear-search') {
                        searchKeyword = '';
                        resetEditStates();
                        statusMessage = '已清除篩選';
                        render();
                        return;
                    }
                    if (act === 'cancel-edit') {
                        resetEditStates();
                        statusMessage = '已取消編輯';
                        render();
                        return;
                    }

                    if (act === 'add-profile-field') {
                        resetEditStates();
                        addingProfileField = true;
                        render();
                        return;
                    }
                    if (act === 'save-new-profile') {
                        const keyInput = panelContainerEl.querySelector('[data-role="new-profile-key"]');
                        const valInput = panelContainerEl.querySelector('[data-role="new-profile-val"]');
                        const k = keyInput ? keyInput.value.trim() : '';
                        const v = valInput ? valInput.value : '';
                        if (!k) {
                            statusMessage = '請先輸入欄位名稱';
                            render();
                            return;
                        }
                        if (saveProfileFieldSafe(k, v)) {
                            resetEditStates();
                            statusMessage = `已新增欄位「${formatProfileLabel(k)}」`;
                        } else {
                            statusMessage = '新增欄位失敗：找不到個人檔案儲存函式';
                        }
                        render();
                        return;
                    }
                    if (act === 'edit-profile') {
                        resetEditStates();
                        editingKey = btn.getAttribute('data-key');
                        render();
                        return;
                    }
                    if (act === 'del-profile') {
                        console.log('DEL PROFILE CLICK');
                        const key = btn.getAttribute('data-key');
                        const profile = readProfileSafe();
                        if (!profile || !key) {
                            return;
                        }
                        if (
                            typeof confirm === 'function' &&
                            !confirm(`確定要刪除「${formatProfileLabel(key)}」嗎？`)
                        ) {
                            return;
                        }
                        delete profile[key];
                        if (
                            typeof MemoryService !== 'undefined' &&
                            typeof MemoryService.updateProfileMemory === 'function'
                        ) {
                            MemoryService.updateProfileMemory(profile);
                        } else if (
                            typeof updateProfileMemory === 'function'
                        ) {
                            updateProfileMemory(profile);
                        }
                        notifyAfterMutation(
                            'profile_deleted',
                            { key }
                        );
                        resetEditStates();
                        statusMessage = `已刪除「${formatProfileLabel(key)}」`;
                        render();
                        return;
                    }

                    if (act === 'edit-event') {
                        resetEditStates();
                        editingEventIdx = Number(btn.getAttribute('data-idx'));
                        render();
                        return;
                    }
                    if (act === 'save-event') {
                        const idx = Number(btn.getAttribute('data-idx'));
                        const list = readEventsSafe(searchKeyword);
                        const targetEv = Array.isArray(list) ? list[idx] : null;
                        const draft = {
                            title: panelContainerEl.querySelector('[data-role="ev-title"]')?.value || '',
                            date: panelContainerEl.querySelector('[data-role="ev-date"]')?.value || '',
                            location: panelContainerEl.querySelector('[data-role="ev-location"]')?.value || '',
                            activities: panelContainerEl.querySelector('[data-role="ev-activities"]')?.value || '',
                            purchases: panelContainerEl.querySelector('[data-role="ev-purchases"]')?.value || '',
                            notes: panelContainerEl.querySelector('[data-role="ev-notes"]')?.value || ''
                        };
                        if (saveEventItemSafe(targetEv, draft)) {
                            resetEditStates();
                            statusMessage = `已更新事件「${draft.title}」`;
                        } else {
                            statusMessage = '事件更新失敗';
                        }
                        render();
                        return;
                    }
                    if (act === 'del-event') {
                        const idx = Number(btn.getAttribute('data-idx'));
                        const list = readEventsSafe(searchKeyword);
                        const targetEv = Array.isArray(list) ? list[idx] : null;
                        if (!targetEv) return;
                        if (typeof confirm === 'function' && !confirm(`確定要刪除事件「${targetEv.title || '未命名事件'}」嗎？`)) {
                            return;
                        }
                        if (removeEventItemSafe(targetEv)) {
                            resetEditStates();
                            statusMessage = `已刪除事件「${targetEv.title || '未命名事件'}」`;
                        } else {
                            statusMessage = '事件刪除失敗';
                        }
                        render();
                        return;
                    }

                    if (act === 'edit-favorite') {
                        resetEditStates();
                        editingFavoriteIdx = Number(btn.getAttribute('data-idx'));
                        render();
                        return;
                    }
                    if (act === 'save-favorite') {
                        const idx = Number(btn.getAttribute('data-idx'));
                        const list = readFavoritesSafe(searchKeyword);
                        const targetFav = Array.isArray(list) ? list[idx] : null;
                        const draft = {
                            title: panelContainerEl.querySelector('[data-role="fav-title"]')?.value || '',
                            content: panelContainerEl.querySelector('[data-role="fav-content"]')?.value || '',
                            tags: panelContainerEl.querySelector('[data-role="fav-tags"]')?.value || ''
                        };
                        if (saveFavoriteItemSafe(targetFav, draft)) {
                            resetEditStates();
                            statusMessage = `已更新收藏「${draft.title}」`;
                        } else {
                            statusMessage = '收藏更新失敗';
                        }
                        render();
                        return;
                    }
                    if (act === 'del-favorite') {
                        const idx = Number(btn.getAttribute('data-idx'));
                        const list = readFavoritesSafe(searchKeyword);
                        const targetFav = Array.isArray(list) ? list[idx] : null;
                        if (!targetFav) return;
                        if (typeof confirm === 'function' && !confirm(`確定要刪除收藏「${targetFav.title || '未命名收藏'}」嗎？`)) {
                            return;
                        }
                        if (removeFavoriteItemSafe(targetFav)) {
                            resetEditStates();
                            statusMessage = `已刪除收藏「${targetFav.title || '未命名收藏'}」`;
                        } else {
                            statusMessage = '收藏刪除失敗';
                        }
                        render();
                        return;
                    }

                    if (act === 'add-event') {
                        resetEditStates();
                        addingEvent = true;
                        render();
                        return;
                    }
                    if (act === 'save-new-event') {
                        const draft = {
                            title: panelContainerEl.querySelector('[data-role="new-ev-title"]')?.value || '',
                            date: panelContainerEl.querySelector('[data-role="new-ev-date"]')?.value || '',
                            location: panelContainerEl.querySelector('[data-role="new-ev-location"]')?.value || '',
                            activities: panelContainerEl.querySelector('[data-role="new-ev-activities"]')?.value || '',
                            purchases: panelContainerEl.querySelector('[data-role="new-ev-purchases"]')?.value || '',
                            notes: panelContainerEl.querySelector('[data-role="new-ev-notes"]')?.value || ''
                        };
                        if (!draft.title.trim()) {
                            statusMessage = '請先輸入事件標題';
                            render();
                            return;
                        }
                        if (createEventItemSafe(draft)) {
                            resetEditStates();
                            statusMessage = `已新增事件「${draft.title.trim()}」`;
                        } else {
                            statusMessage = '新增事件失敗';
                        }
                        render();
                        return;
                    }

                    if (act === 'add-favorite') {
                        resetEditStates();
                        addingFavorite = true;
                        render();
                        return;
                    }
                    if (act === 'save-new-favorite') {
                        const draft = {
                            title: panelContainerEl.querySelector('[data-role="new-fav-title"]')?.value || '',
                            content: panelContainerEl.querySelector('[data-role="new-fav-content"]')?.value || '',
                            tags: panelContainerEl.querySelector('[data-role="new-fav-tags"]')?.value || ''
                        };
                        if (!draft.title.trim() && !draft.content.trim()) {
                            statusMessage = '請先輸入收藏標題或內容';
                            render();
                            return;
                        }
                        if (createFavoriteItemSafe(draft)) {
                            resetEditStates();
                            statusMessage = `已新增收藏「${draft.title.trim() || '未命名收藏'}」`;
                        } else {
                            statusMessage = '新增收藏失敗';
                        }
                        render();
                        return;
                    }
                });
            });
        }

        const onBackdropClick = (e) => {
            if (e.target === backdropEl) {
                setOpen(false);
            }
        };

        if (backdropEl) backdropEl.addEventListener('click', onBackdropClick);

        render();

        return {
            ok: true,
            open: () => setOpen(true),
            close: () => setOpen(false),
            toggle: () => setOpen(!(backdropEl && backdropEl.classList.contains('is-open'))),
            refresh: () => render(),
            unmount() {
                if (backdropEl) backdropEl.removeEventListener('click', onBackdropClick);
                if (backdropEl && backdropEl.parentNode) backdropEl.parentNode.removeChild(backdropEl);
                if (hostEl) hostEl.innerHTML = '';
            }
        };
    }

    function initMemoryUI(options = {}) {
        const controller = mountMemoryPanel(options.container || null, options);
        if (typeof window !== 'undefined') {
            window.__viviMemoryUI = controller;
        }
        return controller;
    }

    if (typeof window !== 'undefined') {
        window.mountMemoryPanel = mountMemoryPanel;
        window.initMemoryUI = initMemoryUI;
    }
})();