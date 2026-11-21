// ================= Finance & Reconciliation Module (Independent Ledger, Tags & Cards) =================

let pendingDiff = 0;
let pendingNewTotal = 0;
let currentTxFilter = 'today';
let pendingBankDeduction = null;
let currentLedgerId = 'ledger_personal';
let quickAddTxType = 'expense'; // 'expense' | 'income'
let editTxTypesMap = {};

function getDefaultLedgers() {
    return [
        { id: 'ledger_personal', name: '👤 個人帳本', icon: '👤' },
        { id: 'ledger_joint', name: '👥 共同帳戶', icon: '👥' },
        { id: 'ledger_business', name: '🏢 公司帳戶', icon: '🏢' }
    ];
}

function getLedgersList() {
    const list = StorageService.get(STORAGE_KEYS.LEDGERS_LIST, null);
    if (Array.isArray(list) && list.length > 0) return list;
    const def = getDefaultLedgers();
    StorageService.set(STORAGE_KEYS.LEDGERS_LIST, def);
    return def;
}

function saveLedgersList(list) {
    StorageService.set(STORAGE_KEYS.LEDGERS_LIST, list);
}

function getAccountsListForLedger(ledgerId) {
    const key = STORAGE_KEYS.ACCOUNTS(ledgerId);
    const data = StorageService.get(key, null);
    if (Array.isArray(data) && data.length > 0) return data;

    const defaultAccs = [
        { id: 'acc_cash_' + Date.now(), name: '現金', icon: '💵', balance: 0 },
        { id: 'acc_bank_' + (Date.now() + 1), name: '銀行存款', icon: '🏦', balance: 0 }
    ];
    
    if (ledgerId === 'ledger_personal') {
        const oldV2 = StorageService.get('vivi_custom_accounts_v2', null);
        if (Array.isArray(oldV2) && oldV2.length > 0) {
            StorageService.set(key, oldV2);
            return oldV2;
        }
    }

    StorageService.set(key, defaultAccs);
    return defaultAccs;
}

function saveAccountsListForLedger(ledgerId, accounts) {
    StorageService.set(STORAGE_KEYS.ACCOUNTS(ledgerId), accounts);
}

function getAccountsList() {
    return getAccountsListForLedger(currentLedgerId);
}

function saveAccountsList(accounts) {
    saveAccountsListForLedger(currentLedgerId, accounts);
}

function getTransactionsForLedger(ledgerId) {
    const key = STORAGE_KEYS.TRANSACTIONS(ledgerId);
    const data = StorageService.get(key, null);
    if (Array.isArray(data)) return data;

    if (ledgerId === 'ledger_personal') {
        const oldTxs = StorageService.get(STORAGE_KEYS.FINANCE_TRANSACTIONS, JSON.parse(localStorage.getItem('pandaTransactions')) || null);
        if (Array.isArray(oldTxs)) {
            StorageService.set(key, oldTxs);
            return oldTxs;
        }
    }
    StorageService.set(key, []);
    return [];
}

function saveTransactionsForLedger(ledgerId, transactions) {
    StorageService.set(STORAGE_KEYS.TRANSACTIONS(ledgerId), transactions);
    if (ledgerId === 'ledger_personal') {
        StorageService.set(STORAGE_KEYS.FINANCE_TRANSACTIONS, transactions);
        localStorage.setItem('pandaTransactions', JSON.stringify(transactions));
    }
}

// 🗑️ 清除指定帳本底下所有關聯 Storage 資料（防範孤兒資料）
function deleteLedgerData(ledgerId) {
    if (!ledgerId || !window.STORAGE_KEYS || !window.StorageService) {
        return;
    }

    try {
        StorageService.remove(STORAGE_KEYS.ACCOUNTS(ledgerId));
        StorageService.remove(STORAGE_KEYS.TRANSACTIONS(ledgerId));
        StorageService.remove(STORAGE_KEYS.TAGS(ledgerId));
        StorageService.remove(STORAGE_KEYS.CREDIT_DATA(ledgerId));
        console.log(`🗑️ 已清除帳本資料：${ledgerId}`);
    } catch (err) {
        console.error(`刪除帳本資料失敗：${ledgerId}`, err);
    }
}

// 渲染頂部帳本切換分頁列
function renderLedgerTabs() {
    const bar = document.getElementById('ledgerTabsBar');
    if (!bar) return;

    const ledgers = getLedgersList();
    bar.innerHTML = ledgers.map(l => `
        <button type="button" class="ledger-tab-btn ${l.id === currentLedgerId ? 'active' : ''}" onclick="switchLedger('${l.id}')">
            ${l.name}
        </button>
    `).join('') + `<button type="button" class="ledger-add-btn" onclick="addNewLedger()">＋ 新增帳本</button>`;

    const cur = ledgers.find(l => l.id === currentLedgerId) || ledgers[0];
    const titleEl = document.getElementById('currentLedgerTitleDisplay');
    if (titleEl) titleEl.textContent = `💰 ${cur.name} - 總資金`;
}

function switchLedger(ledgerId) {
    currentLedgerId = ledgerId;
    renderLedgerTabs();
    initFinance();
    if (typeof renderCreditCardSection === 'function') renderCreditCardSection();
}

function addNewLedger() {
    const name = prompt('請輸入新帳本名稱 (例如：💡 裝潢基金、✈️ 旅遊帳本)：');
    if (!name || !name.trim()) return;

    const ledgers = getLedgersList();
    const newId = 'ledger_' + Date.now();
    ledgers.push({ id: newId, name: name.trim() });
    saveLedgersList(ledgers);

    getAccountsListForLedger(newId);
    switchLedger(newId);
    if (typeof showNotification === 'function') showNotification('✅ 成功新增帳本！');
}

function manageCurrentLedger() {
    const ledgers = getLedgersList();
    if (ledgers.length <= 1) {
        alert('⚠️ 至少需保留一個帳本！');
        return;
    }
    const cur = ledgers.find(l => l.id === currentLedgerId);
    if (!cur) return;

    const action = prompt(`管理「${cur.name}」：\n1. 重新命名帳本\n2. 刪除此帳本與其所有資料\n\n請輸入數字 (1 或 2)：`, '1');
    if (action === '1') {
        const newName = prompt('請輸入新的帳本名稱：', cur.name);
        if (newName && newName.trim()) {
            cur.name = newName.trim();
            saveLedgersList(ledgers);
            renderLedgerTabs();
            if (typeof showNotification === 'function') showNotification('✏️ 帳本名稱已更新！');
        }
    } else if (action === '2') {
        const accountCount = getAccountsListForLedger(currentLedgerId)?.length || 0;
        const txCount = getTransactionsForLedger(currentLedgerId)?.length || 0;
        const creditData = typeof getCreditDataForLedger === 'function'
            ? getCreditDataForLedger(currentLedgerId)
            : null;
        const cardCount = creditData?.cards?.length || 0;

        const message =
`🗑️ 確定要刪除「${cur.name}」嗎？

此帳本包含：
- ${accountCount} 個帳戶
- ${txCount} 筆流水
- ${cardCount} 張信用卡

⚠️ 刪除後無法復原！`;

        if (confirm(message)) {
            deleteLedgerData(currentLedgerId);
            const newLedgers = ledgers.filter(l => l.id !== currentLedgerId);
            saveLedgersList(newLedgers);
            switchLedger(newLedgers[0].id);
            if (typeof showNotification === 'function') {
                showNotification('🗑️ 已刪除該帳本與所有相關資料！');
            }
        }
    }
}

// ================= 各帳本獨立之收支快捷標籤管理 =================
function getDefaultTagsForLedger(ledgerId) {
    if (ledgerId === 'ledger_business') {
        return {
            income: [
                { text: '💼 銷貨收入' },
                { text: '💰 營業外收入' }
            ],
            expense: [
                { text: '📦 進貨成本' },
                { text: '📝 辦公文具' },
                { text: '💡 水電房租' },
                { text: '📢 廣告行銷' }
            ]
        };
    } else if (ledgerId === 'ledger_joint') {
        return {
            income: [
                { text: '💰 共同收入' },
                { text: '🧧 恩典紅包' }
            ],
            expense: [
                { text: '🛒 家用採買' },
                { text: '🍱 外食聚餐' },
                { text: '💡 共同帳單' },
                { text: '🚗 家庭交通' }
            ]
        };
    } else {
        // 個人預設標籤
        return {
            income: [
                { text: '💰 意外收入' },
                { text: '💼 發薪' }
            ],
            expense: [
                { text: '⛽ 加油' },
                { text: '🍱 餐費飲料' },
                { text: '🧧 孝親費' },
                { text: '🔧 機車保養費' },
                { text: '🛒 日常購物' },
                { text: '🧾 繳費/帳單' }
            ]
        };
    }
}

function getCustomTags() {
    const key = STORAGE_KEYS.TAGS(currentLedgerId);
    const saved = StorageService.get(key, null);
    if (saved && Array.isArray(saved.income) && Array.isArray(saved.expense)) {
        return saved;
    }
    const def = getDefaultTagsForLedger(currentLedgerId);
    StorageService.set(key, def);
    return def;
}

function saveCustomTags(tagsObj) {
    StorageService.set(STORAGE_KEYS.TAGS(currentLedgerId), tagsObj);
}

function renderQuickTags() {
    const tagsData = getCustomTags();
    const incContainer = document.getElementById('incomeTags');
    const expContainer = document.getElementById('expenseTags');

    if (incContainer) {
        incContainer.innerHTML = tagsData.income.map((tag, idx) => `
            <span class="tag-pill-wrapper">
                <button type="button" class="tag-pill-btn" onclick="setReason('${tag.text.replace(/'/g, "\\'")}')">${tag.text}</button>
                <button type="button" class="tag-del-btn" title="刪除此標籤" onclick="deleteCustomTag('income', ${idx})">×</button>
            </span>
        `).join('') + `<button type="button" class="tag-add-btn" onclick="addCustomTag('income')">＋ 新增</button>`;
    }

    if (expContainer) {
        expContainer.innerHTML = tagsData.expense.map((tag, idx) => `
            <span class="tag-pill-wrapper">
                <button type="button" class="tag-pill-btn" onclick="setReason('${tag.text.replace(/'/g, "\\'")}')">${tag.text}</button>
                <button type="button" class="tag-del-btn" title="刪除此標籤" onclick="deleteCustomTag('expense', ${idx})">×</button>
            </span>
        `).join('') + `<button type="button" class="tag-add-btn" onclick="addCustomTag('expense')">＋ 新增</button>`;
    }
}

function addCustomTag(type) {
    const label = type === 'income' ? '收入' : '支出';
    const newText = prompt(`請輸入新的${label}標籤名稱（可加上 Emoji，例如：🎁 獎金、☕ 咖啡）：`);
    if (!newText || !newText.trim()) return;

    const tagsData = getCustomTags();
    tagsData[type].push({ text: newText.trim() });
    saveCustomTags(tagsData);
    renderQuickTags();
    setReason(newText.trim());
    if (typeof showNotification === 'function') showNotification(`✅ 已新增${label}標籤！`);
}

function deleteCustomTag(type, index) {
    const tagsData = getCustomTags();
    const target = tagsData[type][index];
    if (!target) return;

    if (confirm(`🗑️ 確定要刪除「${target.text}」這個快捷標籤嗎？`)) {
        tagsData[type].splice(index, 1);
        saveCustomTags(tagsData);
        renderQuickTags();
        if (typeof showNotification === 'function') showNotification('🗑️ 已刪除該標籤！');
    }
}

// ================= 內嵌展開式快速新增記帳面板 + 標題列三按鈕（＋ 新增記帳｜📊 本月支出排行｜🔍 查全部 / 篩選） =================
function ensureQuickAddUI() {
    const listEl = document.getElementById('transactionList');
    if (!listEl || !listEl.parentNode) return;

    const card = listEl.parentNode;

    // 若先前有殘留的內嵌統計卡片，移除它以保持帳目主畫面精簡
    const legacyStatsBox = document.getElementById('categoryStatsBox');
    if (legacyStatsBox && legacyStatsBox.parentNode) {
        legacyStatsBox.parentNode.removeChild(legacyStatsBox);
    }

    // 1. 尋找包含「查全部」文字的元素，將「＋ 新增記帳」與「📊 本月支出排行」依序排在它左側並靠右對齊
    const candidates = card.querySelectorAll('button, a, span, div');
    let historyBtn = null;
    for (const el of candidates) {
        if (el.children.length === 0 && el.textContent && el.textContent.includes('查全部')) {
            historyBtn = el;
            break;
        }
    }

    if (historyBtn && historyBtn.parentNode) {
        const parent = historyBtn.parentNode;
        if (getComputedStyle(parent).display !== 'flex') {
            parent.style.display = 'flex';
            parent.style.alignItems = 'center';
            parent.style.gap = '8px';
        } else if (!parent.style.gap) {
            parent.style.gap = '8px';
        }

        if (!document.getElementById('btnOpenQuickAddTx')) {
            const addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.id = 'btnOpenQuickAddTx';
            addBtn.textContent = '＋ 新增記帳';
            addBtn.style.cssText = 'padding: 6px 12px; background: #e8cbb1; color: #4a3525; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; white-space: nowrap; line-height: 1.4; margin-left: auto;';
            addBtn.onclick = toggleQuickAddTxPanel;
            parent.insertBefore(addBtn, historyBtn);
        }

        if (!document.getElementById('btnOpenCategoryStatsPage')) {
            const statsBtn = document.createElement('button');
            statsBtn.type = 'button';
            statsBtn.id = 'btnOpenCategoryStatsPage';
            statsBtn.textContent = '📊 本月支出排行';
            statsBtn.style.cssText = 'padding: 6px 12px; background: #e8cbb1; color: #4a3525; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; white-space: nowrap; line-height: 1.4;';
            statsBtn.onclick = openCategoryStatsPage;
            parent.insertBefore(statsBtn, historyBtn);
        }
    }

    // 2. 在標題列下方、流水清單上方注入內嵌展開表單面板
    if (!document.getElementById('quickAddTxPanel')) {
        const panel = document.createElement('div');
        panel.id = 'quickAddTxPanel';
        panel.style.cssText = 'display: none; background: #fff; border: 1px solid #e0d5c8; border-radius: 12px; padding: 14px; margin: 10px 0 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);';
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <b style="font-size:14px; color:#333;">✍️ 快速新增記帳</b>
                <button type="button" onclick="closeQuickAddTxPanel()" style="background:none; border:none; font-size:16px; color:#888; cursor:pointer; padding:2px 6px;">✕</button>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <button type="button" id="qaTypeExpenseBtn" onclick="setQuickAddTxType('expense')" style="flex:1; padding:8px; border-radius:8px; font-weight:bold; cursor:pointer;">➖ 支出</button>
                <button type="button" id="qaTypeIncomeBtn" onclick="setQuickAddTxType('income')" style="flex:1; padding:8px; border-radius:8px; font-weight:bold; cursor:pointer;">➕ 收入</button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:10px;">
                <div>
                    <label style="display:block; font-size:12px; color:#666; margin-bottom:4px;">帳戶</label>
                    <select id="qaAccountSelect" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:8px; font-size:13px; background:#fff; box-sizing:border-box;"></select>
                </div>
                <div>
                    <label style="display:block; font-size:12px; color:#666; margin-bottom:4px;">金額 (NT$)</label>
                    <input type="number" id="qaAmountInput" inputmode="numeric" placeholder="輸入金額" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:8px; font-size:14px; box-sizing:border-box;">
                </div>
            </div>
            <div style="margin-bottom:8px;">
                <label style="display:block; font-size:12px; color:#666; margin-bottom:4px;">項目 / 備註</label>
                <input type="text" id="qaTitleInput" placeholder="點下方標籤或自行輸入" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:8px; font-size:13px; box-sizing:border-box;">
            </div>
            <div id="qaTagsBar" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;"></div>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="closeQuickAddTxPanel()" style="flex:1; padding:9px; background:#f5f5f5; color:#555; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">取消</button>
                <button type="button" onclick="submitQuickAddTransaction()" style="flex:2; padding:9px; background:#4CAF50; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">✅ 確認記帳</button>
            </div>
        `;
        listEl.parentNode.insertBefore(panel, listEl);
    }
}

function toggleQuickAddTxPanel() {
    ensureQuickAddUI();
    const panel = document.getElementById('quickAddTxPanel');
    if (!panel) return;
    if (panel.style.display === 'none' || !panel.style.display) {
        openQuickAddTxPanel();
    } else {
        closeQuickAddTxPanel();
    }
}

function openQuickAddTxPanel() {
    ensureQuickAddUI();
    const panel = document.getElementById('quickAddTxPanel');
    if (!panel) return;

    const accounts = getAccountsList();
    const accSelect = document.getElementById('qaAccountSelect');
    if (accSelect) {
        accSelect.innerHTML = accounts.map(acc => `
            <option value="${acc.id}">${acc.icon || '💰'} ${acc.name} ($${(Number(acc.balance) || 0).toLocaleString()})</option>
        `).join('');
    }

    const amtInput = document.getElementById('qaAmountInput');
    const titleInput = document.getElementById('qaTitleInput');
    if (amtInput) amtInput.value = '';
    if (titleInput) titleInput.value = '';

    setQuickAddTxType('expense');
    panel.style.display = 'block';
    if (amtInput) amtInput.focus();
}

function closeQuickAddTxPanel() {
    const panel = document.getElementById('quickAddTxPanel');
    if (panel) panel.style.display = 'none';
}

function setQuickAddTxType(type) {
    quickAddTxType = type;
    const expBtn = document.getElementById('qaTypeExpenseBtn');
    const incBtn = document.getElementById('qaTypeIncomeBtn');

    if (expBtn) {
        expBtn.style.background = type === 'expense' ? '#ffebee' : '#f5f5f5';
        expBtn.style.color = type === 'expense' ? '#c62828' : '#666';
        expBtn.style.border = type === 'expense' ? '1px solid #ef9a9a' : '1px solid #e0e0e0';
    }
    if (incBtn) {
        incBtn.style.background = type === 'income' ? '#e8f5e9' : '#f5f5f5';
        incBtn.style.color = type === 'income' ? '#2e7d32' : '#666';
        incBtn.style.border = type === 'income' ? '1px solid #a5d6a7' : '1px solid #e0e0e0';
    }

    const tagsBar = document.getElementById('qaTagsBar');
    if (tagsBar) {
        const tagsData = getCustomTags();
        const list = type === 'income' ? (tagsData.income || []) : (tagsData.expense || []);
        tagsBar.innerHTML = list.map((tag, idx) => {
            const escapedText = tag.text.replace(/'/g, "\\'");
            return `
                <span style="display:inline-flex; align-items:center; background:#f8f4ef; border:1px solid #e0d5c8; border-radius:14px; overflow:hidden;">
                    <button type="button" onclick="selectQuickAddTag('${escapedText}')" style="padding:4px 6px 4px 10px; background:transparent; border:none; font-size:12px; cursor:pointer; color:#444;">
                        ${tag.text}
                    </button>
                    <button type="button" title="刪除此標籤" onclick="deleteQuickAddTag(${idx})" style="padding:4px 8px 4px 2px; background:transparent; border:none; font-size:12px; line-height:1; cursor:pointer; color:#999;" onmouseover="this.style.color='#c62828'" onmouseout="this.style.color='#999'">
                        ×
                    </button>
                </span>
            `;
        }).join('') + `
            <button type="button" onclick="toggleQuickAddTagForm()" style="padding:4px 10px; background:#fff; border:1px dashed #b09a82; border-radius:14px; font-size:12px; font-weight:bold; cursor:pointer; color:#6d4c41;">
                ＋ 新增
            </button>
            <div id="qaNewTagInlineBox" style="display:none; width:100%; margin-top:6px; gap:6px; align-items:center;">
                <input type="text" id="qaNewTagInput" placeholder="輸入新標籤名稱（如：☕ 咖啡）" style="flex:1; padding:6px 10px; border:1px solid #ccc; border-radius:8px; font-size:12px; box-sizing:border-box;">
                <button type="button" onclick="saveQuickAddNewTag()" style="padding:6px 12px; background:#4CAF50; color:#fff; border:none; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">確定</button>
                <button type="button" onclick="toggleQuickAddTagForm(false)" style="padding:6px 10px; background:#eee; color:#555; border:none; border-radius:8px; font-size:12px; cursor:pointer;">取消</button>
            </div>
        `;
    }
}

function selectQuickAddTag(text) {
    const titleInput = document.getElementById('qaTitleInput');
    if (titleInput) titleInput.value = text;
}

function toggleQuickAddTagForm(forceState) {
    const box = document.getElementById('qaNewTagInlineBox');
    if (!box) return;
    const shouldShow = typeof forceState === 'boolean' ? forceState : box.style.display === 'none';
    box.style.display = shouldShow ? 'flex' : 'none';
    if (shouldShow) {
        const input = document.getElementById('qaNewTagInput');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

function saveQuickAddNewTag() {
    const input = document.getElementById('qaNewTagInput');
    const newText = (input?.value || '').trim();
    if (!newText) {
        if (typeof showNotification === 'function') showNotification('⚠️ 請輸入標籤名稱！');
        return;
    }

    const tagsData = getCustomTags();
    if (!Array.isArray(tagsData[quickAddTxType])) {
        tagsData[quickAddTxType] = [];
    }
    tagsData[quickAddTxType].push({ text: newText });
    saveCustomTags(tagsData);

    renderQuickTags();
    setQuickAddTxType(quickAddTxType);
    selectQuickAddTag(newText);

    if (typeof showNotification === 'function') showNotification('✅ 已新增快捷標籤！');
}

function deleteQuickAddTag(index) {
    const tagsData = getCustomTags();
    const list = tagsData[quickAddTxType];
    if (!Array.isArray(list) || !list[index]) return;

    const target = list[index];
    if (confirm(`🗑️ 確定要刪除「${target.text}」這個快捷標籤嗎？`)) {
        list.splice(index, 1);
        saveCustomTags(tagsData);
        renderQuickTags();
        setQuickAddTxType(quickAddTxType);
        if (typeof showNotification === 'function') showNotification('🗑️ 已刪除該標籤！');
    }
}

function submitQuickAddTransaction() {
    const accId = document.getElementById('qaAccountSelect')?.value;
    const amount = parseFloat(document.getElementById('qaAmountInput')?.value);
    const title = (document.getElementById('qaTitleInput')?.value || '').trim();

    if (!amount || isNaN(amount) || amount <= 0) {
        if (typeof showNotification === 'function') showNotification('⚠️ 請輸入大於 0 的金額！');
        return;
    }
    if (!title) {
        if (typeof showNotification === 'function') showNotification('⚠️ 請輸入項目或點選標籤！');
        return;
    }

    const accounts = getAccountsList();
    const targetAcc = accounts.find(a => a.id === accId) || accounts[0];
    if (!targetAcc) return;

    const isExpense = quickAddTxType === 'expense';
    const signedAmount = isExpense ? -Math.abs(amount) : Math.abs(amount);
    const currentBal = Number(targetAcc.balance) || 0;

    if (isExpense && currentBal < Math.abs(amount)) {
        if (typeof showNotification === 'function') {
            showNotification(`⚠️ 「${targetAcc.name}」餘額不足 NT$ ${Math.abs(amount).toLocaleString()}！`);
        }
        return;
    }

    targetAcc.balance = currentBal + signedAmount;
    saveAccountsList(accounts);

    const transactions = getTransactionsForLedger(currentLedgerId);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

transactions.unshift({
    title: `${title} (${targetAcc.icon || '💰'}${targetAcc.name})`,
    date: dateStr,
    amount: signedAmount,

    accountId: targetAcc.id,
    accountName: targetAcc.name
});
    saveTransactionsForLedger(currentLedgerId, transactions);

    closeQuickAddTxPanel();
    initFinance();
    if (typeof fetchAllLatestPrices === 'function') fetchAllLatestPrices();

    if (typeof showNotification === 'function') {
        showNotification(`✅ 已新增${isExpense ? '支出' : '收入'}：${title} (${signedAmount > 0 ? '+' : ''}NT$ ${signedAmount.toLocaleString()})`);
    }
}

// ================= 初始化財務頁面 =================
function initFinance() {
    renderLedgerTabs();
    const accounts = getAccountsList();
    const container = document.getElementById('dynamicAccountsContainer');
    
    if (container) {
        container.innerHTML = accounts.map((acc) => `
            <div class="audit-row" style="margin-bottom:8px;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;" title="點擊可修改帳戶名稱" onclick="renameAccount('${acc.id}')">
                    <span>${acc.icon}</span> <span>${acc.name}</span>
                </label>
                <div style="display:flex; align-items:center; gap:6px;">
                    <input type="number" id="accInput_${acc.id}" inputmode="numeric" value="${acc.balance}" oninput="previewTotal()" style="width:110px;">
                    <button onclick="deleteAccount('${acc.id}')" title="刪除此帳戶" style="background:none; border:none; cursor:pointer; color:#e53935; font-size:14px;">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    calculateTotalAndDisplay();
    renderQuickTags();
    ensureQuickAddUI();
    renderTransactions();
    if (typeof renderCreditCardSection === 'function') renderCreditCardSection();
}

function previewTotal() {
    calculateTotalAndDisplay();
}

function calculateTotalAndDisplay() {
    const accounts = getAccountsList();
    let total = 0;
    accounts.forEach(acc => {
        const inputVal = Number(document.getElementById(`accInput_${acc.id}`)?.value) || 0;
        total += inputVal;
    });

    const prevBalances = getAccountsList();
    const prevTotal = prevBalances.reduce((sum, a) => sum + a.balance, 0);

    const prevDisp = document.getElementById('prevTotalDisplay');
    const curDisp = document.getElementById('currentTotalDisplay');
    if (prevDisp) prevDisp.textContent = `NT$ ${prevTotal.toLocaleString()}`;
    if (curDisp) curDisp.textContent = `NT$ ${total.toLocaleString()}`;
    return total;
}

function manageCustomAccounts() {
    const name = prompt('請輸入新資產帳戶名稱 (例如：台新銀行、緊急預備金、LinePay)：', '數位帳戶');
    if (!name) return;
    const icon = prompt('請輸入代表此帳戶的 Emoji 圖示 (例如：🏦、💳、💰)：', '🏦') || '🏦';
    const initBalance = parseFloat(prompt('請輸入初始金額 (NT$)：', '0')) || 0;

    let accounts = getAccountsList();
    accounts.push({
        id: 'acc_' + Date.now(),
        name,
        icon,
        balance: initBalance
    });

    saveAccountsList(accounts);
    initFinance();
    if (typeof showNotification === 'function') showNotification('✅ 成功新增資產帳戶！');
}

function renameAccount(accId) {
    let accounts = getAccountsList();
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return;

    const newName = prompt('請修改帳戶名稱：', acc.name);
    if (!newName) return;
    const newIcon = prompt('請修改代表圖示 (Emoji)：', acc.icon) || acc.icon;

    acc.name = newName;
    acc.icon = newIcon;
    saveAccountsList(accounts);
    initFinance();
    if (typeof showNotification === 'function') showNotification('✏️ 帳戶名稱已更新！');
}

function deleteAccount(accId) {
    let accounts = getAccountsList();
    if (accounts.length <= 1) {
        alert('⚠️ 至少需保留一個資產帳戶！');
        return;
    }
    const acc = accounts.find(a => a.id === accId);
    if (!acc) return;

    if (confirm(`🗑️ 確定要刪除「${acc.icon} ${acc.name}」帳戶嗎？`)) {
        accounts = accounts.filter(a => a.id !== accId);
        saveAccountsList(accounts);
        initFinance();
        if (typeof showNotification === 'function') showNotification('🗑️ 已刪除該資產帳戶！');
    }
}

function deductFromAccount(accountId, amount) {
    let accounts = getAccountsList();
    let targetAcc = accounts.find(a => a.id === accountId) || accounts[0];

    if (targetAcc.balance < amount) {
        if (!confirm(`⚠️ 警告：「${targetAcc.icon} ${targetAcc.name}」餘額（NT$ ${targetAcc.balance.toLocaleString()}）小於扣款金額 NT$ ${amount.toLocaleString()}，確定要扣款嗎？`)) {
            return false;
        }
    }
    targetAcc.balance -= amount;
    saveAccountsList(accounts);
    initFinance();
    return true;
}

function checkReconciliation() {
    let accounts = getAccountsList();
    const prevTotal = accounts.reduce((sum, a) => sum + a.balance, 0);

    let newTotal = 0;
    accounts.forEach(acc => {
        acc.balance = Number(document.getElementById(`accInput_${acc.id}`)?.value) || 0;
        newTotal += acc.balance;
    });

    const diff = newTotal - prevTotal;
    const diffBox = document.getElementById('diffActionBox');
    const alertText = document.getElementById('diffAlertText');
    const reasonInput = document.getElementById('diffReasonInput');
    const incomeTags = document.getElementById('incomeTags');
    const expenseTags = document.getElementById('expenseTags');

    renderQuickTags();

    if (diff === 0) {
        saveAccountsList(accounts);
        if (typeof showNotification === 'function') showNotification('✅ 帳目完全吻合，無任何差額！');
        if (diffBox) diffBox.style.display = 'none';
        return;
    }

    pendingDiff = diff;
    pendingNewTotal = newTotal;
    if (diffBox) diffBox.style.display = 'block';

    if (diff > 0) {
        alertText.style.color = '#2e7d32';
        alertText.innerHTML = `🎉 總資金增加了 <b>+NT$ ${diff.toLocaleString()}</b>！<br>請點選下方收入標籤或自行新增：`;
        reasonInput.value = '💰 意外收入';
        incomeTags.style.display = 'flex';
        expenseTags.style.display = 'none';
    } else {
        alertText.style.color = '#c62828';
        alertText.innerHTML = `⚠️ 總資金減少了 <b>-NT$ ${Math.abs(diff).toLocaleString()}</b>！<br>若為日常支出請選擇用途或自行新增標籤：`;
        reasonInput.value = '';
        incomeTags.style.display = 'none';
        expenseTags.style.display = 'flex';
    }
}

function setReason(tagText) {
    document.getElementById('diffReasonInput').value = tagText;
}

function cancelReconciliation() {
    document.getElementById('diffActionBox').style.display = 'none';
    if (typeof showNotification === 'function') showNotification('請重新點算金額');
}

function confirmReconciliation() {
    const reason = document.getElementById('diffReasonInput').value.trim();
    if (!reason) {
        alert('請輸入原因或點選上方標籤！');
        return;
    }

    let accounts = getAccountsList();
    accounts.forEach(acc => {
        acc.balance = Number(document.getElementById(`accInput_${acc.id}`)?.value) || 0;
    });
    saveAccountsList(accounts);

    const transactions = getTransactionsForLedger(currentLedgerId);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    transactions.unshift({
        title: reason,
        date: dateStr,
        amount: pendingDiff
    });

    saveTransactionsForLedger(currentLedgerId, transactions);

    document.getElementById('diffActionBox').style.display = 'none';
    renderTransactions();
    calculateTotalAndDisplay();

    const curLedgerObj = getLedgersList().find(l => l.id === currentLedgerId) || { name: '帳本' };
    const actionWord = pendingDiff > 0 ? `增加 +${pendingDiff}` : `支出 ${pendingDiff}`;
    const reportMsg = `[${curLedgerObj.name}] 對帳完成（${reason} ${actionWord} 元），目前總資金 NT$ ${pendingNewTotal.toLocaleString()}。`;

    const lastMessage = document.getElementById('lastMessage') || document.querySelector('.home-message-card .message-text');
    if (lastMessage) lastMessage.textContent = reportMsg;

    if (typeof showNotification === 'function') showNotification('已成功寫入流水並更新總資金！');
}

function setTxFilter(mode) {
    currentTxFilter = mode;
    document.getElementById('btnFilterToday')?.classList.toggle('active', mode === 'today');
    document.getElementById('btnFilterAll')?.classList.toggle('active', mode === 'all');
    renderTransactions();
}

function deleteTransaction(index) {
    if (confirm('🗑️ 確定要刪除這筆流水紀錄嗎？')) {
        let transactions = getTransactionsForLedger(currentLedgerId);
        if (index >= 0 && index < transactions.length) {
            const targetTx = transactions[index];
let accounts =
    getAccountsListForLedger(
        currentLedgerId
    );
            if (targetTx && targetTx.creditTxId && typeof getCreditDataForLedger === 'function') {
                let creditData = getCreditDataForLedger(currentLedgerId);
                if (Array.isArray(creditData.pendingTxs)) {
                    creditData.pendingTxs = creditData.pendingTxs.filter(t => t.id !== targetTx.creditTxId);
                    saveCreditDataForLedger(currentLedgerId, creditData);
                    if (typeof renderCreditCardSection === 'function') renderCreditCardSection();
                }
            }
if (
    targetTx &&
    targetTx.accountId
) {

    const targetAcc =
        accounts.find(
            a => a.id === targetTx.accountId
        );

    if (targetAcc) {

        const txAmount =
            Number(targetTx.amount) || 0;

        targetAcc.balance -= txAmount;

        saveAccountsListForLedger(
            currentLedgerId,
            accounts
        );
    }
}
transactions.splice(index, 1);

saveTransactionsForLedger(
    currentLedgerId,
    transactions
);

// 重新整理整個財務頁
if (typeof initFinance === 'function') {
    initFinance();
}

// 財富中心同步刷新
if (typeof fetchAllLatestPrices === 'function') {
    fetchAllLatestPrices();
}

if (typeof showNotification === 'function') {
    showNotification('🗑️ 已成功刪除該筆流水紀錄！');
}
        }
    }
}

// ================= 內嵌修改流水紀錄（自動回滾舊帳戶餘額並套用新金額） =================
function openEditTransaction(index) {
    const transactions = getTransactionsForLedger(currentLedgerId);
    const item = transactions[index];
    if (!item || item.isCredit) return;

    const formBox = document.getElementById(`editTxForm_${index}`);
    if (!formBox) return;

    if (formBox.style.display === 'block') {
        formBox.style.display = 'none';
        return;
    }

    const accounts = getAccountsList();
    let matchedAcc = accounts[0];
    let cleanTitle = item.title || '';
    const accMatch = cleanTitle.match(/^(.*)\s*\(([^)]+)\)$/);
    if (accMatch) {
        const suffix = accMatch[2];
        const found = accounts.find(a => suffix.includes(a.name));
        if (found) {
            matchedAcc = found;
            cleanTitle = accMatch[1].trim();
        }
    }

    const initialType = item.amount < 0 ? 'expense' : 'income';
    editTxTypesMap[index] = initialType;

    formBox.style.display = 'block';
    formBox.innerHTML = `
        <div style="background:#fff; border:1px solid #e0d5c8; border-radius:10px; padding:12px; box-shadow:0 3px 10px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <b style="font-size:13px; color:#4a3525;">✏️ 修改此筆紀錄</b>
                <button type="button" onclick="closeEditTransaction(${index})" style="background:none; border:none; font-size:15px; color:#888; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; gap:8px; margin-bottom:8px;">
                <button type="button" id="editTypeExp_${index}" onclick="setEditTxType(${index}, 'expense')" style="flex:1; padding:6px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">➖ 支出</button>
                <button type="button" id="editTypeInc_${index}" onclick="setEditTxType(${index}, 'income')" style="flex:1; padding:6px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">➕ 收入</button>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
                <div>
                    <label style="display:block; font-size:11px; color:#666; margin-bottom:3px;">帳戶</label>
                    <select id="editAcc_${index}" style="width:100%; padding:7px; border:1px solid #ccc; border-radius:8px; font-size:13px; background:#fff; box-sizing:border-box;">
                        ${accounts.map(acc => `
                            <option value="${acc.id}" ${acc.id === matchedAcc?.id ? 'selected' : ''}>
                                ${acc.icon || '💰'} ${acc.name} ($${(Number(acc.balance) || 0).toLocaleString()})
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label style="display:block; font-size:11px; color:#666; margin-bottom:3px;">金額 (NT$)</label>
                    <input type="number" id="editAmt_${index}" inputmode="numeric" value="${Math.abs(item.amount)}" style="width:100%; padding:7px; border:1px solid #ccc; border-radius:8px; font-size:13px; box-sizing:border-box;">
                </div>
            </div>
            <div style="margin-bottom:10px;">
                <label style="display:block; font-size:11px; color:#666; margin-bottom:3px;">項目 / 備註</label>
                <input type="text" id="editTitle_${index}" value="${cleanTitle.replace(/"/g, '&quot;')}" style="width:100%; padding:7px; border:1px solid #ccc; border-radius:8px; font-size:13px; box-sizing:border-box;">
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" onclick="closeEditTransaction(${index})" style="flex:1; padding:8px; background:#f5f5f5; color:#555; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">取消</button>
                <button type="button" onclick="saveEditTransaction(${index})" style="flex:2; padding:8px; background:#4CAF50; color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">✅ 儲存修改</button>
            </div>
        </div>
    `;

    setEditTxType(index, initialType);
}

function setEditTxType(index, type) {
    editTxTypesMap[index] = type;
    const expBtn = document.getElementById(`editTypeExp_${index}`);
    const incBtn = document.getElementById(`editTypeInc_${index}`);
    if (expBtn) {
        expBtn.style.background = type === 'expense' ? '#ffebee' : '#f5f5f5';
        expBtn.style.color = type === 'expense' ? '#c62828' : '#666';
        expBtn.style.border = type === 'expense' ? '1px solid #ef9a9a' : '1px solid #e0e0e0';
    }
    if (incBtn) {
        incBtn.style.background = type === 'income' ? '#e8f5e9' : '#f5f5f5';
        incBtn.style.color = type === 'income' ? '#2e7d32' : '#666';
        incBtn.style.border = type === 'income' ? '1px solid #a5d6a7' : '1px solid #e0e0e0';
    }
}

function closeEditTransaction(index) {
    const formBox = document.getElementById(`editTxForm_${index}`);
    if (formBox) formBox.style.display = 'none';
}

function saveEditTransaction(index) {
    const transactions = getTransactionsForLedger(currentLedgerId);
    const oldItem = transactions[index];
    if (!oldItem) return;

    const newAccId = document.getElementById(`editAcc_${index}`)?.value;
    const newAmount = parseFloat(document.getElementById(`editAmt_${index}`)?.value);
    const newTitle = (document.getElementById(`editTitle_${index}`)?.value || '').trim();
    const newType = editTxTypesMap[index] || 'expense';

    if (!newAmount || isNaN(newAmount) || newAmount <= 0) {
        if (typeof showNotification === 'function') showNotification('⚠️ 請輸入大於 0 的金額！');
        return;
    }
    if (!newTitle) {
        if (typeof showNotification === 'function') showNotification('⚠️ 請輸入項目名稱！');
        return;
    }

    const accounts = getAccountsList();
    const targetAcc = accounts.find(a => a.id === newAccId) || accounts[0];
    if (!targetAcc) return;

    let oldAcc = null;
    const accMatch = (oldItem.title || '').match(/\(([^)]+)\)$/);
    if (accMatch) {
        const suffix = accMatch[1];
        oldAcc = accounts.find(a => suffix.includes(a.name)) || null;
    }
    if (!oldAcc) oldAcc = targetAcc;

    const oldAccRevertedBal = (Number(oldAcc.balance) || 0) - (Number(oldItem.amount) || 0);
    const newSignedAmount = newType === 'expense' ? -Math.abs(newAmount) : Math.abs(newAmount);
    const projectedTargetBal = (oldAcc.id === targetAcc.id ? oldAccRevertedBal : (Number(targetAcc.balance) || 0)) + newSignedAmount;

    if (newType === 'expense' && projectedTargetBal < 0) {
        if (typeof showNotification === 'function') {
            showNotification(`⚠️ 「${targetAcc.name}」調整後餘額不足 NT$ ${Math.abs(newAmount).toLocaleString()}！`);
        }
        return;
    }

    oldAcc.balance = oldAccRevertedBal;
    targetAcc.balance = projectedTargetBal;
    saveAccountsList(accounts);

    transactions[index] = {
        ...oldItem,
        title: `${newTitle} (${targetAcc.icon || '💰'}${targetAcc.name})`,
        amount: newSignedAmount
    };
    saveTransactionsForLedger(currentLedgerId, transactions);

    initFinance();
    if (typeof fetchAllLatestPrices === 'function') fetchAllLatestPrices();
    if (typeof showNotification === 'function') {
        showNotification(`✅ 已修改紀錄：${newTitle} (${newSignedAmount > 0 ? '+' : ''}NT$ ${newSignedAmount.toLocaleString()})`);
    }
}

// ================= 本月支出排行視圖（不走外部 showPage，避免誤跳首頁） =================
function extractCategoryFromTitle(title, tagList) {
    const raw = String(title || '').trim();
    if (Array.isArray(tagList)) {
        for (const t of tagList) {
            if (t?.text && raw.includes(t.text)) {
                return t.text;
            }
        }
    }
    const beforeParen = raw
        .replace('[秘書代記]', '')
        .split('(')[0]
        .trim();
    return beforeParen || '其他項目';
}

function getRankBadge(index) {
    const badges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    return badges[index] || `${index + 1}.`;
}

function ensureCategoryStatsView() {
    let viewEl = document.getElementById('categoryStatsStandaloneView');
    if (viewEl) return viewEl;

    const listEl = document.getElementById('transactionList');
    const anchorParent = listEl?.parentNode || document.querySelector('.main-content') || document.body;

    viewEl = document.createElement('div');
    viewEl.id = 'categoryStatsStandaloneView';
    viewEl.style.cssText = 'display: none; background: #fff; border: 1px solid #e0d5c8; border-radius: 12px; padding: 14px; margin: 10px 0 14px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);';
    viewEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <b style="font-size:14px; color:#4a3525;">📊 本月支出排行</b>
            <button type="button" onclick="closeCategoryStatsPage()" style="padding:5px 10px; background:#e8cbb1; color:#4a3525; border:none; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer;">← 返回流水</button>
        </div>
        <div id="categoryStatsStandaloneBody"></div>
    `;

    if (listEl && listEl.parentNode) {
        listEl.parentNode.insertBefore(viewEl, listEl);
    } else {
        anchorParent.appendChild(viewEl);
    }
    return viewEl;
}

function renderCategoryStatsPage() {
    const viewEl = ensureCategoryStatsView();
    const bodyEl = document.getElementById('categoryStatsStandaloneBody');
    if (!viewEl || !bodyEl) return;

    const ledgers = getLedgersList();
    const curLedger = ledgers.find(l => l.id === currentLedgerId) || { name: '帳本' };
    const transactions = getTransactionsForLedger(currentLedgerId);
    const tagsData = getCustomTags();
    const expenseMap = new Map();

    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    transactions.forEach(item => {
        if (!item || item.isCredit) return;
        if (!item.date || !item.date.startsWith(monthPrefix)) return;

        const amount = Number(item.amount) || 0;
        if (amount >= 0) return;

        const category = extractCategoryFromTitle(item.title, tagsData.expense || []);
        expenseMap.set(category, (expenseMap.get(category) || 0) + Math.abs(amount));
    });

    const totalExpense = [...expenseMap.values()].reduce((sum, value) => sum + value, 0);

    const topExpenses = [...expenseMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const rowsHtml = topExpenses.length === 0
        ? `<div style="text-align:center; color:#999; font-size:13px; padding:18px 0;">${curLedger.name} 本月尚無支出紀錄</div>`
        : topExpenses.map(([name, value], idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 2px; font-size:13px; border-bottom:1px dashed #f3ece2;">
                <span style="color:#333;">${getRankBadge(idx)} ${name}</span>
                <b style="color:#c62828;">NT$ ${value.toLocaleString()}</b>
            </div>
        `).join('');

    bodyEl.innerHTML = `
        <div style="background:#fffaf5; border:1px solid #efe4d6; border-radius:10px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #efe4d6;">
                <span style="font-size:12px; color:#666;">${curLedger.name}（${monthPrefix}）</span>
                <span style="color:#c62828; font-weight:bold; font-size:13px;">本月總支出 NT$ ${totalExpense.toLocaleString()}</span>
            </div>
            ${rowsHtml}
        </div>
    `;
}

function openCategoryStatsPage() {
    renderCategoryStatsPage();
    const viewEl = document.getElementById('categoryStatsStandaloneView');
    const listEl = document.getElementById('transactionList');
    if (!viewEl) return;

    const isOpen = viewEl.style.display === 'block';
    if (isOpen) {
        closeCategoryStatsPage();
        return;
    }

    viewEl.style.display = 'block';
    if (listEl) listEl.style.display = 'none';
}

function closeCategoryStatsPage() {
    const viewEl = document.getElementById('categoryStatsStandaloneView');
    const listEl = document.getElementById('transactionList');
    if (viewEl) viewEl.style.display = 'none';
    if (listEl) listEl.style.display = '';
}

function renderTransactions() {
    ensureQuickAddUI();
    const listEl = document.getElementById('transactionList');
    if (!listEl) return;
    const transactions = getTransactionsForLedger(currentLedgerId);

    const now = new Date();
    const todayPrefix = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    let todayTip = 0;
    let todayExp = 0;

    const todayItemsWithIndex = [];
    transactions.forEach((item, originalIndex) => {
        if (item.date && item.date.startsWith(todayPrefix)) {
            if (!item.isCredit) {
                if (item.amount > 0) {
                    todayTip += item.amount;
                } else {
                    todayExp += Math.abs(item.amount);
                }
            }
            todayItemsWithIndex.push({ item, originalIndex });
        }
    });

    if (todayItemsWithIndex.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; color:#888; padding:20px 0;">今日尚無對帳流水紀錄</div>';
    } else {
        listEl.innerHTML = todayItemsWithIndex.map(({ item, originalIndex }) => {
            const isIncome = item.amount > 0;
            const isCredit = Boolean(item.isCredit);
            
            let amountText = '';
            let amountStyle = '';
            let subDateText = item.date;

            if (isCredit) {
                amountText = `刷卡 NT$ ${Math.abs(item.amount).toLocaleString()}`;
                amountStyle = 'color: #ef6c00; font-weight: bold;';
                subDateText = `${item.date} <span style="background:#fff3e0; color:#e65100; padding:1px 6px; border-radius:4px; font-size:11px; margin-left:4px;">未出帳・不扣現金</span>`;
            } else {
                amountText = isIncome ? `+NT$ ${item.amount.toLocaleString()}` : `-NT$ ${Math.abs(item.amount).toLocaleString()}`;
            }

            return `
                <div class="transaction-item" style="display: flex; flex-direction: column; padding: 10px 0; border-bottom: 1px solid #f0e6d8;">
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="transaction-info" style="flex-grow: 1;">
                            <div class="transaction-title">${item.title}</div>
                            <div class="transaction-date">${subDateText}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="transaction-amount ${isCredit ? '' : (isIncome ? 'income' : 'expense')}" style="${amountStyle}">${amountText}</div>
                            ${isCredit ? '' : `<button type="button" onclick="openEditTransaction(${originalIndex})" title="修改此筆" style="background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">✏️</button>`}
                            <button type="button" onclick="deleteTransaction(${originalIndex})" title="刪除此筆" style="background: none; border: none; cursor: pointer; font-size: 15px; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">🗑️</button>
                        </div>
                    </div>
                    <div id="editTxForm_${originalIndex}" style="display: none; width: 100%; margin-top: 10px;"></div>
                </div>
            `;
        }).join('');
    }

    const tipDisp = document.getElementById('todayTipDisplay');
    const expDisp = document.getElementById('todayExpDisplay');
    if (tipDisp) tipDisp.textContent = `+${todayTip.toLocaleString()}`;
    if (expDisp) expDisp.textContent = `-${todayExp.toLocaleString()}`;
}

function openHistoryPage() {
    if (typeof showPage === 'function') showPage('history');
    const tabButtons = document.querySelectorAll('.tabbar button');
    tabButtons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes('money')) {
            btn.classList.add('active');
        }
    });
    filterHistoryTransactions();
}

function clearHistoryFilter() {
    document.getElementById('historySearchInput').value = '';
    document.getElementById('historyStartDate').value = '';
    document.getElementById('historyEndDate').value = '';
    filterHistoryTransactions();
}

function filterHistoryTransactions() {
    const transactions = getTransactionsForLedger(currentLedgerId);
    const keywordEl = document.getElementById('historySearchInput');
    const startEl = document.getElementById('historyStartDate');
    const endEl = document.getElementById('historyEndDate');
    if (!keywordEl || !startEl || !endEl) return;

    const keyword = keywordEl.value.trim().toLowerCase();
    const startDate = startEl.value;
    const endDate = endEl.value;

    let totalInc = 0;
    let totalExp = 0;

    const results = [];
    transactions.forEach((item, originalIndex) => {
        const itemDateOnly = (item.date || '').slice(0, 10);
        const matchKeyword = !keyword || item.title.toLowerCase().includes(keyword);
        const matchStart = !startDate || itemDateOnly >= startDate;
        const matchEnd = !endDate || itemDateOnly <= endDate;
        if (matchKeyword && matchStart && matchEnd) {
            results.push({ item, originalIndex });
        }
    });

    const fullListEl = document.getElementById('historyFullList');
    if (!fullListEl) return;

    if (results.length === 0) {
        fullListEl.innerHTML = '<div style="text-align:center; color:#888; padding:30px 0;">找不到符合條件的流水紀錄</div>';
    } else {
        fullListEl.innerHTML = results.map(({ item, originalIndex }) => {
            const isCredit = Boolean(item.isCredit);
            if (!isCredit) {
                if (item.amount > 0) totalInc += item.amount;
                else totalExp += Math.abs(item.amount);
            }

            const isIncome = item.amount > 0;
            let amountText = '';
            let amountStyle = '';
            let subDateText = `🕒 ${item.date}`;

            if (isCredit) {
                amountText = `刷卡 NT$ ${Math.abs(item.amount).toLocaleString()}`;
                amountStyle = 'color: #ef6c00; font-weight: bold;';
                subDateText = `🕒 ${item.date} <span style="background:#fff3e0; color:#e65100; padding:1px 6px; border-radius:4px; font-size:11px; margin-left:4px;">未出帳・不扣現金</span>`;
            } else {
                amountText = isIncome ? `+NT$ ${item.amount.toLocaleString()}` : `-NT$ ${Math.abs(item.amount).toLocaleString()}`;
            }
            
            let displayTitle = item.title;
            if (keyword) {
                const regex = new RegExp(`(${keyword})`, 'gi');
                displayTitle = displayTitle.replace(regex, '<mark style="background:#ffe082; border-radius:4px; padding:0 2px;">$1</mark>');
            }

            return `
                <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="transaction-info" style="flex-grow: 1;">
                        <div class="transaction-title">${displayTitle}</div>
                        <div class="transaction-date">${subDateText}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="transaction-amount ${isCredit ? '' : (isIncome ? 'income' : 'expense')}" style="${amountStyle}">${amountText}</div>
                        <button onclick="deleteTransaction(${originalIndex})" title="刪除此筆" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    const countEl = document.getElementById('filteredCount');
    const incEl = document.getElementById('filteredIncome');
    const expEl = document.getElementById('filteredExpense');
    if (countEl) countEl.textContent = results.length;
    if (incEl) incEl.textContent = `+${totalInc.toLocaleString()}`;
    if (expEl) expEl.textContent = `-${totalExp.toLocaleString()}`;
}

function resetReconciliationOnly() {
    if (confirm('🧾 確定要將目前帳本的資產與流水紀錄全部初始化歸零嗎？')) {
        const defaultAccounts = [
            { id: 'acc_cash_' + Date.now(), name: '現金', icon: '💵', balance: 0 },
            { id: 'acc_bank_' + (Date.now() + 1), name: '銀行存款', icon: '🏦', balance: 0 }
        ];
        saveAccountsList(defaultAccounts);
        saveTransactionsForLedger(currentLedgerId, []);
        
        if (typeof initFinance === 'function') initFinance();
        const diffBox = document.getElementById('diffActionBox');
        if (diffBox) diffBox.style.display = 'none';

        if (typeof showNotification === 'function') showNotification('🔄 目前帳本資料已成功初始化歸零！');
    }
}

function resetWealthOnly() {
    if (confirm('💎 確定要將「總資產與投資設定（股票/基金/保險/退休）」初始化重設嗎？')) {
        StorageService.remove(STORAGE_KEYS.WEALTH_DATA);
        StorageService.remove(STORAGE_KEYS.RETIREMENT_GOAL);
        localStorage.removeItem('vivi_wealth_data');
        localStorage.removeItem('vivi_retirement_goal');
        localStorage.removeItem('userStocks');
        localStorage.removeItem('userFunds');
        localStorage.removeItem('userInsurances');
        
        if (typeof initWealthPage === 'function') initWealthPage();
        if (typeof showNotification === 'function') showNotification('🔄 總資產與投資設定已成功初始化重設！');
    }
}

// 💬 聊天代記與智慧對話扣款解析（支援指定帳本，如「公司帳戶花...」、「共同帳戶賺...」）
function parseAndRecordFromChat(text) {
    if (!text) return null;
    const trimmedText = text.trim();

    const ledgers = getLedgersList();
    let targetLedger = ledgers.find(l => l.id === currentLedgerId) || ledgers[0];

    if (trimmedText.includes('公司') || trimmedText.includes('企業') || trimmedText.includes('工作室')) {
        const found = ledgers.find(l => l.name.includes('公司') || l.name.includes('企業'));
        if (found) targetLedger = found;
    } else if (trimmedText.includes('共同') || trimmedText.includes('夫妻') || trimmedText.includes('聯名') || trimmedText.includes('家庭')) {
        const found = ledgers.find(l => l.name.includes('共同') || l.name.includes('夫妻') || l.name.includes('家庭'));
        if (found) targetLedger = found;
    } else if (trimmedText.includes('個人') || trimmedText.includes('自己') || trimmedText.includes('私房')) {
        const found = ledgers.find(l => l.name.includes('個人') || l.name.includes('自己'));
        if (found) targetLedger = found;
    }

    if (pendingBankDeduction) {
        const confirmWords = ['從銀行扣', '銀行', '好', '可以', '行', '對', '是的', 'ok', 'yes', '好低'];
        const cancelWords = ['不用', '取消', '不要', '算了'];

        if (cancelWords.some(w => trimmedText.includes(w))) {
            pendingBankDeduction = null;
            return '已為您取消此筆扣款。';
        }

        if (confirmWords.some(w => trimmedText.includes(w))) {
            const { category, amount, ledgerId } = pendingBankDeduction;
            pendingBankDeduction = null;

            let accounts = getAccountsListForLedger(ledgerId);
            let bankAcc = accounts.find(a => a.name.includes('銀行') || a.name.includes('存款')) || accounts[0];

            if (bankAcc.balance < amount) {
                return `⚠️ 您的「${bankAcc.icon} ${bankAcc.name}」餘額（NT$ ${bankAcc.balance.toLocaleString()}）不足支付此筆 NT$ ${amount.toLocaleString()}！`;
            }

            bankAcc.balance -= amount;
            saveAccountsListForLedger(ledgerId, accounts);

            const transactions = getTransactionsForLedger(ledgerId);
            const now = new Date();
            const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

transactions.unshift({
    title: `[秘書代記] ${category} (${targetAcc.icon}${targetAcc.name})`,
    date: dateStr,
    amount: signedAmount,

    accountId: targetAcc.id,
    accountName: targetAcc.name
});

            saveTransactionsForLedger(ledgerId, transactions);

            if (ledgerId === currentLedgerId) {
                if (typeof renderTransactions === 'function') renderTransactions();
                if (typeof initFinance === 'function') initFinance();
            }

            const lObj = ledgers.find(l => l.id === ledgerId) || { name: '帳本' };
            return `✅ 已幫您在【${lObj.name}】改從「${bankAcc.icon} ${bankAcc.name}」順利扣款！\n📌 【${category}】 -NT$ ${amount.toLocaleString()}`;
        }
    }

    const questionWords = ['嗎', '如何', '怎麼', '哪裡', '多少', '推薦', '為什麼', '多久', '?', '？'];
    if (questionWords.some(word => trimmedText.includes(word))) return null;

    const incomeKeywords = ['賺', '收入', '薪水', '發薪', '小費', '意外收入', '入帳', '銷貨'];
    const expenseKeywords = ['花', '買', '支出', '扣', '記帳', '加油', '吃', '餐', '飯', '飲料', '喝', '繳', '保養', '機油', '孝親', '午餐', '晚餐', '早餐', '進貨', '文具', '水電', '租金', '行銷'];

    const amountMatch = trimmedText.match(/\d+/);
    if (!amountMatch) return null;

    const isIncomeMatch = incomeKeywords.some(keyword => trimmedText.includes(keyword));
    const isExpenseMatch = expenseKeywords.some(keyword => trimmedText.includes(keyword));
    if (!isIncomeMatch && !isExpenseMatch) return null;

    const amount = parseInt(amountMatch[0], 10);
    const isExpense = isExpenseMatch;
    const type = isExpense ? 'expense' : 'income';
    
    let category = targetLedger.id === 'ledger_business' ? '💼 銷貨收入' : '🧧 其他入帳';
    if (trimmedText.includes('發薪') || trimmedText.includes('薪水') || trimmedText.includes('薪資')) {
        category = '💼 發薪';
    } else if (trimmedText.includes('小費') || trimmedText.includes('意外')) {
        category = '💰 意外收入';
    } else if (trimmedText.includes('加油')) {
        category = '⛽ 加油';
    } else if (trimmedText.includes('餐') || trimmedText.includes('飯') || trimmedText.includes('飲料') || trimmedText.includes('吃') || trimmedText.includes('喝') || trimmedText.includes('午餐') || trimmedText.includes('晚餐') || trimmedText.includes('早餐')) {
        category = '🍱 餐費飲料';
    } else if (trimmedText.includes('孝親')) {
        category = '🧧 孝親費';
    } else if (trimmedText.includes('機車') || trimmedText.includes('保養') || trimmedText.includes('機油')) {
        category = '🔧 機車保養費';
    } else if (trimmedText.includes('購物') || trimmedText.includes('買')) {
        category = '🛒 日常購物';
    } else if (trimmedText.includes('帳單') || trimmedText.includes('繳')) {
        category = '🧾 繳費/帳單';
    } else if (trimmedText.includes('進貨')) {
        category = '📦 進貨成本';
    } else if (trimmedText.includes('文具')) {
        category = '📝 辦公文具';
    } else if (trimmedText.includes('水電') || trimmedText.includes('房租')) {
        category = '💡 水電房租';
    } else if (trimmedText.includes('廣告') || trimmedText.includes('行銷')) {
        category = '📢 廣告行銷';
    }

    let accounts = getAccountsListForLedger(targetLedger.id);
    let targetAcc = accounts[0];

    if (trimmedText.includes('銀行') || (!isExpense && amount >= 500)) {
        targetAcc = accounts.find(a => a.name.includes('銀行') || a.name.includes('存款')) || accounts[0];
    }

    const signedAmount = type === 'income' ? amount : -amount;

    if (isExpense && targetAcc.balance < amount) {
        let bankAcc = accounts.find(a => a.name.includes('銀行') || a.name.includes('存款')) || accounts[1] || accounts[0];
        if (bankAcc && bankAcc.balance >= amount) {
            pendingBankDeduction = { category, amount, ledgerId: targetLedger.id };
            return `⚠️ 在【${targetLedger.name}】中，您的「${targetAcc.icon} ${targetAcc.name}」餘額不足 NT$ ${amount.toLocaleString()}！\n是否要改從「${bankAcc.icon} ${bankAcc.name}」扣款？（直接回覆：從銀行扣）`;
        }
    }
    
    targetAcc.balance += signedAmount;
    if (targetAcc.balance < 0) targetAcc.balance = 0;
    saveAccountsListForLedger(targetLedger.id, accounts);

    const transactions = getTransactionsForLedger(targetLedger.id);
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    transactions.unshift({
        title: `[秘書代記] ${category} (${targetAcc.icon}${targetAcc.name})`,
        date: dateStr,
        amount: signedAmount
    });
    
    saveTransactionsForLedger(targetLedger.id, transactions);

    if (targetLedger.id === currentLedgerId) {
        if (typeof renderTransactions === 'function') renderTransactions();
        if (typeof initFinance === 'function') initFinance();
    }

    const sign = type === 'income' ? '+' : '-';
    return `已幫您自動記在【${targetLedger.name}】囉（更新 ${targetAcc.icon}${targetAcc.name} 結餘）：\n📌 【${category}】 ${sign}NT$ ${amount.toLocaleString()}\n已同步寫入該帳本流水！`;
}