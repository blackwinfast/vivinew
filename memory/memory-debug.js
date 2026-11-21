// ================= Vivi Memory Debug Module (v2.3.2) =================
// 開發版 Inspector、Stats、健康檢查、面板/FAB、回歸測試與系統 API 驗證

function getMemoryStats() {
    return {
        short: typeof getShortMemories === 'function' ? getShortMemories().length : 0,
        active: typeof getActiveMemories === 'function' ? getActiveMemories().length : 0,
        profile: typeof getProfileMemory === 'function' ? Object.keys(getProfileMemory()).length : 0,
        events: typeof getEvents === 'function' ? getEvents().length : 0,
        favorites: typeof getFavorites === 'function' ? getFavorites().length : 0
    };
}

function renderMemoryInspector() {
    console.group('🧠 Vivi Memory Inspector');
    console.log('L1 對話記憶', typeof getShortMemories === 'function' ? getShortMemories() : []);
    console.log('L2 活躍記憶', typeof getActiveMemories === 'function' ? getActiveMemories() : []);
    console.log('L3 個人檔案', typeof getProfileMemory === 'function' ? getProfileMemory() : {});
    console.log('L4 事件記憶', typeof getEvents === 'function' ? getEvents() : []);
    console.log('L5 收藏記憶', typeof getFavorites === 'function' ? getFavorites() : []);
    console.groupEnd();
}

function getMemorySnapshotSummary() {
    const shortList = typeof getShortMemories === 'function' ? getShortMemories() : [];
    const activeList = typeof getActiveMemories === 'function' ? getActiveMemories() : [];
    const profile = typeof getProfileMemory === 'function' ? getProfileMemory() : {};
    const events = typeof getEvents === 'function' ? getEvents() : [];
    const favorites = typeof getFavorites === 'function' ? getFavorites() : [];
    const health = typeof validateMemorySystem === 'function' ? validateMemorySystem() : { healthy: true };

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

function validateMemorySystem() {
    const issues = [];

    const shortList = typeof getShortMemories === 'function' ? getShortMemories() : [];
    const activeList = typeof getActiveMemories === 'function' ? getActiveMemories() : [];
    const profile = typeof getProfileMemory === 'function' ? getProfileMemory() : {};
    const eventList = typeof getEvents === 'function' ? getEvents() : [];
    const favoriteList = typeof getFavorites === 'function' ? getFavorites() : [];

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

function buildMemoryPanelViewModel(options = {}) {
    const {
        shortLimit = 10,
        activeLimit = 10,
        eventLimit = 10,
        favoriteLimit = 10
    } = options;

    const summary = getMemorySnapshotSummary();
    const shortList = typeof getShortMemories === 'function' && Array.isArray(getShortMemories())
        ? getShortMemories().slice(-shortLimit)
        : [];
    const activeList = typeof getActiveMemories === 'function' && Array.isArray(getActiveMemories())
        ? getActiveMemories().slice(-activeLimit)
        : [];
    const profile = typeof getProfileMemory === 'function' && getProfileMemory() && typeof getProfileMemory() === 'object'
        ? { ...getProfileMemory() }
        : {};
    const events = typeof getEvents === 'function' && Array.isArray(getEvents())
        ? getEvents().slice(-eventLimit)
        : [];
    const favorites = typeof getFavorites === 'function' && Array.isArray(getFavorites())
        ? getFavorites().slice(-favoriteLimit)
        : [];

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

function runMemoryPanelAction(actionName = '', payload = {}) {
    try {
        let result = null;
        let eventName = `panel:${actionName || 'unknown'}`;

        switch (actionName) {
            case 'updateProfile': {
                result = typeof updateProfileMemory === 'function' ? updateProfileMemory(payload || {}) : null;
                eventName = 'profile_updated';
                break;
            }
            case 'addFavorite': {
                const item = typeof payload === 'string'
                    ? { title: payload, content: payload }
                    : (payload || {});
                result = typeof addFavoriteMemory === 'function' ? addFavoriteMemory(item) : null;
                eventName = 'favorite_added';
                break;
            }
            case 'removeFavorite': {
                result = typeof removeFavoriteMemory === 'function' ? removeFavoriteMemory(payload) : null;
                eventName = 'favorite_removed';
                break;
            }
            case 'resetLayer': {
                const layer = typeof payload === 'string' ? payload : (payload && payload.layer);
                result = typeof resetMemoryLayer === 'function' ? resetMemoryLayer(layer) : null;
                eventName = 'layer_reset';
                break;
            }
            case 'exportSnapshot': {
                result = typeof exportMemorySnapshot === 'function' ? exportMemorySnapshot() : null;
                eventName = 'snapshot_exported';
                break;
            }
            case 'importSnapshot': {
                result = typeof importMemorySnapshot === 'function' ? importMemorySnapshot(payload) : null;
                eventName = 'snapshot_imported';
                break;
            }
            case 'resetTesting': {
                result = typeof resetMemoryForTesting === 'function'
                    ? resetMemoryForTesting(payload || { keepProfile: true, seedDemo: false })
                    : null;
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

        const summary = typeof emitMemoryChange === 'function'
            ? emitMemoryChange(eventName, { action: actionName, result }).summary
            : getMemorySnapshotSummary();

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
    const unsubscribe = typeof subscribeMemoryChange === 'function'
        ? subscribeMemoryChange(() => renderMemoryPanel(target, options))
        : () => {};

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

function mountMemoryDebugFab(options = {}) {
    if (!options || options.force !== true) {
        return { ok: false, reason: 'disabled_by_default', unmount: () => {} };
    }
    
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

async function runMemoryAdapterSelfTest(options = {}) {
    const {
        testTimeoutMs = 50,
        slowDelayMs = 200,
        keepProfile = true
    } = options;

    if (typeof createMemoryChatAdapter !== 'function' || typeof resetMemoryForTesting !== 'function') {
        return { ok: false, error: '缺少必要的核心轉接器函式' };
    }

    const adapter = createMemoryChatAdapter({
        baseSystemPrompt: '你是薇薇，請用繁體中文簡潔回覆。',
        timeoutMs: testTimeoutMs,
        fallbackReply: '【測試逾時兜底】連線逾時，請稍後再試。'
    });

    const normalTurn = await adapter.sendMessage('測試正常 LLM 回合', {
        timeoutMs: 3000,
        llmRunner: async ({ userMessage }) => `已收到：${userMessage}`
    });

    const timeoutTurn = await adapter.sendMessage('測試逾時保護', {
        timeoutMs: testTimeoutMs,
        llmRunner: async () => {
            await new Promise((resolve) => setTimeout(resolve, slowDelayMs));
            return '這行逾時後不該被採用';
        }
    });

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

async function runMemoryFullRegressionCheck(options = {}) {
    const {
        keepProfile = true,
        testTimeoutMs = 50,
        slowDelayMs = 200
    } = options;

    const backupSnapshot = typeof exportMemorySnapshot === 'function' ? exportMemorySnapshot() : null;

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

        if (backupSnapshot && typeof importMemorySnapshot === 'function') {
            importMemorySnapshot(backupSnapshot);
        }
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
            if (backupSnapshot && typeof importMemorySnapshot === 'function') {
                importMemorySnapshot(backupSnapshot);
            }
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
        'searchEventMemory',
        'queryEventsByFilter',
        'extractEventCandidate',
        'isDuplicateEvent',
        'autoCreateEventFromText',
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
        'mountMemoryDebugFab',
        'renderMemoryInspector',
        'getMemoryStats'
    ];

    const serviceTarget = (typeof MemoryService !== 'undefined' && MemoryService)
        ? MemoryService
        : (typeof window !== 'undefined' ? window.MemoryService : null);

    const missingOnService = serviceTarget
        ? requiredApis.filter((fn) => typeof serviceTarget[fn] !== 'function')
        : requiredApis.slice();

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

const __debugApis = {
    getMemoryStats,
    renderMemoryInspector,
    getMemorySnapshotSummary,
    validateMemorySystem,
    buildMemoryPanelViewModel,
    formatMemoryInspectorText,
    runMemoryPanelAction,
    renderMemoryPanel,
    mountMemoryPanel,
    mountMemoryDebugFab,
    runMemoryAdapterSelfTest,
    runMemoryFullRegressionCheck,
    verifyMemorySystem
};

if (typeof MemoryService !== 'undefined' && MemoryService && typeof MemoryService === 'object') {
    Object.assign(MemoryService, __debugApis);
}

if (typeof window !== 'undefined') {
    if (window.MemoryService && typeof window.MemoryService === 'object') {
        Object.assign(window.MemoryService, __debugApis);
    }
    Object.assign(window, __debugApis);
}