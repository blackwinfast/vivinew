// ================= Wealth Core Module =================

let wealthPieChartInstance = null;

function getDefaultWealthData() {
    return {
        cryptos: [],
        stocks: [],
        funds: [],
        insurances: []
    };
}

let wealthData = StorageService.get(STORAGE_KEYS.WEALTH_DATA, JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData());
if (!wealthData.cryptos) wealthData.cryptos = [];
if (!wealthData.stocks) wealthData.stocks = [];
if (!wealthData.funds) wealthData.funds = [];
if (!wealthData.insurances) wealthData.insurances = [];

function saveWealthData() {
    StorageService.set(STORAGE_KEYS.WEALTH_DATA, wealthData);
    localStorage.setItem('vivi_wealth_data', JSON.stringify(wealthData));
}

function openWealthPage() {
    if (typeof showPage === 'function') showPage('wealth');
    wealthData = StorageService.get(STORAGE_KEYS.WEALTH_DATA, JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData());
    if (!wealthData.cryptos) wealthData.cryptos = [];
    if (!wealthData.stocks) wealthData.stocks = [];
    if (!wealthData.funds) wealthData.funds = [];
    if (!wealthData.insurances) wealthData.insurances = [];
    
    if (typeof renderAllWealthLists === 'function') renderAllWealthLists();
    if (typeof loadRetirementGoal === 'function') loadRetirementGoal();
    fetchAllLatestPrices();
}

// ================= 完整資產重設函數 (含比特幣/加密貨幣清空) =================
function resetWealthData() {
    if (confirm('確定要重設全部資產資料嗎？（包含比特幣/加密貨幣、股票、基金、保險與退休目標設定）')) {
        wealthData = getDefaultWealthData();
        StorageService.remove(STORAGE_KEYS.WEALTH_DATA);
        StorageService.remove(STORAGE_KEYS.RETIREMENT_GOAL);
        localStorage.removeItem('vivi_wealth_data');
        localStorage.removeItem('vivi_retirement_goal');
        saveWealthData();

        if (typeof loadRetirementGoal === 'function') loadRetirementGoal();
        if (typeof renderAllWealthLists === 'function') renderAllWealthLists();
        fetchAllLatestPrices();

        if (typeof showNotification === 'function') {
            showNotification('🗑️ 全部資產（含比特幣）已重設！');
        } else {
            alert('🗑️ 全部資產（含比特幣）已重設！');
        }
    }
}

// ================= 計算總資產與圓餅圖 =================
function fetchAllLatestPrices() {
    let cashTotal = 0;
    if (typeof getAccountsList === 'function') {
        const accounts = getAccountsList();
        cashTotal = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
    } else {
        const bills = parseFloat(document.getElementById('inputBills')?.value) || 0;
        const coins = parseFloat(document.getElementById('inputCoins')?.value) || 0;
        const panda = parseFloat(document.getElementById('inputPanda')?.value) || 0;
        const bank = parseFloat(document.getElementById('inputBank')?.value) || 0;
        
        cashTotal = bills + coins + panda + bank;
        if (cashTotal === 0) {
            const savedAudit = StorageService.get(STORAGE_KEYS.LAST_AUDIT, JSON.parse(localStorage.getItem('vivi_last_audit')));
            if (savedAudit) {
                cashTotal = (parseFloat(savedAudit.bills) || 0) + (parseFloat(savedAudit.coins) || 0) + (parseFloat(savedAudit.panda) || 0) + (parseFloat(savedAudit.bank) || 0);
            }
        }
    }

    const cashDisplay = document.getElementById('wealthCashVal');
    if (cashDisplay) cashDisplay.textContent = `NT$ ${Math.round(cashTotal).toLocaleString()}`;

    const cryptoTotal = (wealthData.cryptos || []).reduce((sum, c) => sum + ((c.amount || 0) * (c.price || 0)), 0);
    const stockTotal = (wealthData.stocks || []).reduce((sum, s) => sum + ((s.shares || 0) * (s.price || 0)), 0);
    const fundTotal = (wealthData.funds || []).reduce((sum, f) => sum + (f.value || 0), 0);
    const insTotal = (wealthData.insurances || []).reduce((sum, ins) => sum + (ins.value || 0), 0);

    const grandTotal = Math.round(cashTotal + cryptoTotal + stockTotal + fundTotal + insTotal);

    const grandTotalEl = document.getElementById('grandTotalWealth');
    if (grandTotalEl) grandTotalEl.textContent = `NT$ ${grandTotal.toLocaleString()}`;

    const updateTimeEl = document.getElementById('priceUpdateTime');
    if (updateTimeEl) {
        const now = new Date();
        updateTimeEl.textContent = `最後更新時間：${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    }

    const pieCtx = document.getElementById('wealthPieChart');
    if (pieCtx) {
        if (wealthPieChartInstance) wealthPieChartInstance.destroy();
        const hasAsset = grandTotal > 0;
        wealthPieChartInstance = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['現金存款', '比特幣/加密貨幣', '股票/ETF', '基金投資', '保險/儲蓄險'],
                datasets: [{
                    data: hasAsset ? [cashTotal, cryptoTotal, stockTotal, fundTotal, insTotal] : [1, 0, 0, 0, 0],
                    backgroundColor: hasAsset ? ['#4CAF50', '#f7931a', '#2196F3', '#3F51B5', '#FF5722'] : ['#e0e0e0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (typeof updateRetirementDisplay === 'function') {
        updateRetirementDisplay(grandTotal);
    }
}

// ================= 初始化財產頁面 =================
function initWealthPage() {
    wealthData = StorageService.get(STORAGE_KEYS.WEALTH_DATA, JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData());
    if (!wealthData.cryptos) wealthData.cryptos = [];
    if (!wealthData.stocks) wealthData.stocks = [];
    if (!wealthData.funds) wealthData.funds = [];
    if (!wealthData.insurances) wealthData.insurances = [];
    if (typeof renderAllWealthLists === 'function') renderAllWealthLists();
    if (typeof loadRetirementGoal === 'function') loadRetirementGoal();
    fetchAllLatestPrices();
}