// ================= Credit Card Management Module (Independent per Ledger) =================

function getCreditDataForLedger(ledgerId) {
    const key = STORAGE_KEYS.CREDIT_DATA(ledgerId);
    const data = StorageService.get(key, null);
    if (data && typeof data === 'object') return data;

    // 若該帳本尚無信用卡資料，給予預設結構
    const defaultData = {
        cards: ledgerId === 'ledger_personal' ? [
            { id: 'card_default', name: '玉山信用卡', billDay: 25, linkedAccount: null }
        ] : [],
        pendingTxs: []
    };

    if (ledgerId === 'ledger_personal') {
        const oldGlobal = StorageService.get(STORAGE_KEYS.LEGACY_CREDIT_DATA, null);
        if (oldGlobal && typeof oldGlobal === 'object') {
            StorageService.set(key, oldGlobal);
            return oldGlobal;
        }
    }

    StorageService.set(key, defaultData);
    return defaultData;
}

function saveCreditDataForLedger(ledgerId, data) {
    StorageService.set(STORAGE_KEYS.CREDIT_DATA(ledgerId), data);
    if (ledgerId === 'ledger_personal') {
        StorageService.set(STORAGE_KEYS.LEGACY_CREDIT_DATA, data);
    }
}

function getCreditData() {
    return getCreditDataForLedger(typeof currentLedgerId !== 'undefined' ? currentLedgerId : 'ledger_personal');
}

function saveCreditData(data) {
    saveCreditDataForLedger(typeof currentLedgerId !== 'undefined' ? currentLedgerId : 'ledger_personal', data);
}

function renderCreditCardSection() {
    const container = document.getElementById('creditCardContainer');
    if (!container) return;

    const creditData = getCreditData();
    const cards = creditData.cards || [];
    const pendingTxs = creditData.pendingTxs || [];
    const accounts = typeof getAccountsList === 'function' ? getAccountsList() : [];

    if (cards.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding:15px 0; font-size:13px;">目前此帳本尚無信用卡，點擊右上方「⚙️ 新增卡片」開始設定</div>';
        return;
    }

    container.innerHTML = cards.map(card => {
        const cardTxs = pendingTxs.filter(t => t.cardId === card.id);
        const cardTotal = cardTxs.reduce((sum, t) => sum + t.amount, 0);
        const linkedAcc = accounts.find(a => a.id === card.linkedAccount);
        const linkedName = linkedAcc ? `${linkedAcc.icon} ${linkedAcc.name}` : '未綁定扣款帳戶';

        return `
            <div class="credit-card-item" style="background:#fff; border:1px solid #e2c5ab; border-radius:10px; padding:12px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div>
                        <span style="font-weight:bold; font-size:15px; color:#4a3525;">💳 ${card.name}</span>
                        <div style="font-size:12px; color:#777; margin-top:2px;">結帳日：每月 ${card.billDay} 號 | 扣款：<span style="color:#1a73e8; font-weight:500;">${linkedName}</span></div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button onclick="payCreditBill('${card.id}')" class="btn-success" style="padding:4px 10px;">繳交卡費</button>
                        <button onclick="editCreditCard('${card.id}')" title="修改卡片與扣款帳戶" style="background:none; border:none; cursor:pointer; font-size:14px; color:#1a73e8;">⚙️</button>
                        <button onclick="deleteCreditCard('${card.id}')" title="刪除此卡" style="background:none; border:none; cursor:pointer; font-size:14px; color:#e53935;">🗑️</button>
                    </div>
                </div>

                <div style="background:#faf7f2; border-radius:8px; padding:8px; margin-top:8px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:bold; color:#333; margin-bottom:6px;">
                        <span>本期待繳金額：</span>
                        <span style="color:#d93025;">NT$ ${cardTotal.toLocaleString()}</span>
                    </div>
                    ${cardTxs.length === 0 ? '<div style="font-size:12px; color:#888; text-align:center; padding:4px;">目前無未出帳刷卡消費</div>' : 
                        cardTxs.map(tx => `
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:3px 0; border-top:1px dashed #eee;">
                                <span>${tx.date} - ${tx.title}</span>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-weight:bold; color:#e65100;">NT$ ${tx.amount.toLocaleString()}</span>
                                    <button onclick="deleteCreditTx('${tx.id}')" title="刪除此筆刷卡" style="background:none; border:none; cursor:pointer; font-size:12px; color:#e53935;">×</button>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

function addCreditCard() {
    const name = prompt('請輸入信用卡名稱 (例如：國泰世華 CUBE 卡、台新 @GOGO)：', '聯邦銀行信用卡');
    if (!name || !name.trim()) return;

    const billDay = parseInt(prompt('請輸入每月結帳日 (例如: 25)：', '25'), 10) || 25;

    const accounts = typeof getAccountsList === 'function' ? getAccountsList() : [];
    let linkedAccount = null;

    if (accounts.length > 0) {
        let accPrompt = '請選擇要綁定自動扣款的資產帳戶編號：\n';
        accounts.forEach((acc, idx) => {
            accPrompt += `${idx + 1}. ${acc.icon} ${acc.name}\n`;
        });
        const choice = parseInt(prompt(accPrompt, '1'), 10);
        if (!isNaN(choice) && accounts[choice - 1]) {
            linkedAccount = accounts[choice - 1].id;
        }
    }

    const creditData = getCreditData();
    if (!Array.isArray(creditData.cards)) creditData.cards = [];

    creditData.cards.push({
        id: 'card_' + Date.now(),
        name: name.trim(),
        billDay,
        linkedAccount
    });

    saveCreditData(creditData);
    renderCreditCardSection();
    if (typeof showNotification === 'function') showNotification('✅ 成功新增信用卡！');
}

function editCreditCard(cardId) {
    let creditData = getCreditData();
    const card = (creditData.cards || []).find(c => c.id === cardId);
    if (!card) return;

    const newName = prompt('請修改信用卡名稱：', card.name);
    if (!newName || !newName.trim()) return;

    const newBillDay = parseInt(prompt('請修改每月結帳日：', card.billDay), 10) || card.billDay;

    const accounts = typeof getAccountsList === 'function' ? getAccountsList() : [];
    let linkedAccount = card.linkedAccount;

    if (accounts.length > 0) {
        let accPrompt = '請選擇要重新綁定自動扣款的資產帳戶編號：\n';
        accounts.forEach((acc, idx) => {
            const isCurrent = acc.id === card.linkedAccount ? ' (目前綁定)' : '';
            accPrompt += `${idx + 1}. ${acc.icon} ${acc.name}${isCurrent}\n`;
        });
        const choice = parseInt(prompt(accPrompt, '1'), 10);
        if (!isNaN(choice) && accounts[choice - 1]) {
            linkedAccount = accounts[choice - 1].id;
        }
    }

    card.name = newName.trim();
    card.billDay = newBillDay;
    card.linkedAccount = linkedAccount;

    saveCreditData(creditData);
    renderCreditCardSection();
    if (typeof showNotification === 'function') showNotification('✏️ 信用卡扣款帳戶已成功更新！');
}

function deleteCreditCard(cardId) {
    if (confirm('🗑️ 確定要刪除這張信用卡嗎？')) {
        let creditData = getCreditData();
        creditData.cards = (creditData.cards || []).filter(c => c.id !== cardId);
        creditData.pendingTxs = (creditData.pendingTxs || []).filter(t => t.cardId !== cardId);
        saveCreditData(creditData);
        renderCreditCardSection();
        if (typeof showNotification === 'function') showNotification('🗑️ 已刪除該信用卡！');
    }
}

function addCreditTransaction() {
    const creditData = getCreditData();
    if (!creditData.cards || creditData.cards.length === 0) {
        alert('⚠️ 請先新增至少一張信用卡！');
        return;
    }

    let cardPrompt = '請選擇要記錄刷卡的信用卡：\n';
    creditData.cards.forEach((c, idx) => {
        cardPrompt += `${idx + 1}. ${c.name}\n`;
    });
    const cardChoice = parseInt(prompt(cardPrompt, '1'), 10);
    const targetCard = creditData.cards[cardChoice - 1] || creditData.cards[0];

    const title = prompt('請輸入刷卡消費項目 (例如：網購衣服、加油)：', '日常消費');
    if (!title) return;

    const amount = parseFloat(prompt('請輸入刷卡金額 (NT$)：', '0'));
    if (isNaN(amount) || amount <= 0) return;

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const fullDateStr = `${dateStr} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const txId = 'tx_' + Date.now();

    if (!Array.isArray(creditData.pendingTxs)) creditData.pendingTxs = [];
    creditData.pendingTxs.push({
        id: txId,
        cardId: targetCard.id,
        title,
        amount,
        date: dateStr
    });
    saveCreditData(creditData);

    // 同步寫入流水（標記為未出帳信用卡消費，不影響現金）
    const transactions = typeof getTransactionsForLedger === 'function' ? getTransactionsForLedger(currentLedgerId) : [];
    transactions.unshift({
        title: `[💳 ${targetCard.name}] ${title}`,
        date: fullDateStr,
        amount: -amount,
        isCredit: true,
        creditTxId: txId
    });
    if (typeof saveTransactionsForLedger === 'function') {
        saveTransactionsForLedger(currentLedgerId, transactions);
    }

    renderCreditCardSection();
    if (typeof renderTransactions === 'function') renderTransactions();
    if (typeof showNotification === 'function') showNotification('💳 刷卡記帳成功！');
}

function deleteCreditTx(txId) {
    let creditData = getCreditData();
    creditData.pendingTxs = (creditData.pendingTxs || []).filter(t => t.id !== txId);
    saveCreditData(creditData);

    // 同步從流水移除
    if (typeof getTransactionsForLedger === 'function' && typeof saveTransactionsForLedger === 'function') {
        let transactions = getTransactionsForLedger(currentLedgerId);
        transactions = transactions.filter(t => t.creditTxId !== txId);
        saveTransactionsForLedger(currentLedgerId, transactions);
    }

    renderCreditCardSection();
    if (typeof renderTransactions === 'function') renderTransactions();
    if (typeof showNotification === 'function') showNotification('🗑️ 已刪除該筆刷卡紀錄！');
}

function payCreditBill(cardId) {
    const creditData = getCreditData();
    const card = (creditData.cards || []).find(c => c.id === cardId);
    if (!card) return;

    const cardTxs = (creditData.pendingTxs || []).filter(t => t.cardId === cardId);
    const totalAmount = cardTxs.reduce((sum, t) => sum + t.amount, 0);

    if (totalAmount <= 0) {
        alert('⚠️ 此卡目前無待繳金額！');
        return;
    }

    const accounts = typeof getAccountsList === 'function' ? getAccountsList() : [];
    let linkedAcc = accounts.find(a => a.id === card.linkedAccount) || accounts[0];

    if (!confirm(`💳 確定要繳交【${card.name}】的本期卡費 NT$ ${totalAmount.toLocaleString()} 嗎？\n系統將自動從「${linkedAcc.icon} ${linkedAcc.name}」扣款！`)) {
        return;
    }

    if (linkedAcc.balance < totalAmount) {
        if (!confirm(`⚠️ 警告：「${linkedAcc.icon} ${linkedAcc.name}」餘額（NT$ ${linkedAcc.balance.toLocaleString()}）小於卡費 NT$ ${totalAmount.toLocaleString()}，確定要繼續扣款嗎？`)) {
            return;
        }
    }

    // 扣除資產帳戶餘額
    linkedAcc.balance -= totalAmount;
    if (typeof saveAccountsList === 'function') saveAccountsList(accounts);

    // 清除該卡的待繳消費
    creditData.pendingTxs = (creditData.pendingTxs || []).filter(t => t.cardId !== cardId);
    saveCreditData(creditData);

    // 寫入繳卡費流水
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    
    if (typeof getTransactionsForLedger === 'function' && typeof saveTransactionsForLedger === 'function') {
        const transactions = getTransactionsForLedger(currentLedgerId);
        transactions.unshift({
            title: `[卡費繳納] ${card.name} (${linkedAcc.icon}${linkedAcc.name})`,
            date: dateStr,
            amount: -totalAmount
        });
        saveTransactionsForLedger(currentLedgerId, transactions);
    }

    if (typeof initFinance === 'function') initFinance();
    renderCreditCardSection();
    if (typeof showNotification === 'function') showNotification(`✅ 【${card.name}】卡費 NT$ ${totalAmount.toLocaleString()} 已成功扣款繳納！`);
}