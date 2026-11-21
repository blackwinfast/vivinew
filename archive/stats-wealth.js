// ================= Stats & Wealth Management Module (Full Reset Support) =================

let expensePieChartInstance = null;
let incExpBarChartInstance = null;
let wealthPieChartInstance = null;
let currentStatsPeriod = 'month';

function getDefaultWealthData() {
    return {
        cryptos: [],
        stocks: [],
        funds: [],
        insurances: []
    };
}

let wealthData = JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData();
if (!wealthData.cryptos) wealthData.cryptos = [];
if (!wealthData.stocks) wealthData.stocks = [];
if (!wealthData.funds) wealthData.funds = [];
if (!wealthData.insurances) wealthData.insurances = [];

function saveWealthData() {
    localStorage.setItem('vivi_wealth_data', JSON.stringify(wealthData));
}

function openStatsPage() {
    if (typeof showPage === 'function') showPage('stats');
    initStatsPickers();
    renderStatsCharts();
}

function openWealthPage() {
    if (typeof showPage === 'function') showPage('wealth');
    wealthData = JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData();
    if (!wealthData.cryptos) wealthData.cryptos = [];
    renderAllWealthLists();
    loadRetirementGoal();
    fetchAllLatestPrices();
}

// ================= 完整資產重設函數 (含比特幣/加密貨幣清空) =================
function resetWealthData() {
    if (confirm('確定要重設全部資產資料嗎？（包含比特幣/加密貨幣、股票、基金、保險與退休目標設定）')) {
        wealthData = getDefaultWealthData();
        localStorage.removeItem('vivi_wealth_data');
        localStorage.removeItem('vivi_retirement_goal');
        saveWealthData();

        loadRetirementGoal();
        renderAllWealthLists();
        fetchAllLatestPrices();

        if (typeof showNotification === 'function') {
            showNotification('🗑️ 全部資產（含比特幣）已重設！');
        } else {
            alert('🗑️ 全部資產（含比特幣）已重設！');
        }
    }
}

// ================= 收支統計分析 =================
function initStatsPickers() {
    const monthPicker = document.getElementById('statsMonthPicker');
    const yearPicker = document.getElementById('statsYearPicker');
    const now = new Date();
    
    if (monthPicker && !monthPicker.value) {
        const m = String(now.getMonth() + 1).padStart(2, '0');
        monthPicker.value = `${now.getFullYear()}-${m}`;
    }

    if (yearPicker && yearPicker.options.length === 0) {
        const currentYear = now.getFullYear();
        for (let y = currentYear; y >= currentYear - 5; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = `${y} 年`;
            yearPicker.appendChild(opt);
        }
    }
}

function setStatsPeriod(period) {
    currentStatsPeriod = period;
    document.getElementById('btnStatsMonth').classList.toggle('active', period === 'month');
    document.getElementById('btnStatsYear').classList.toggle('active', period === 'year');
    document.getElementById('statsMonthPicker').style.display = period === 'month' ? 'inline-block' : 'none';
    document.getElementById('statsYearPicker').style.display = period === 'year' ? 'inline-block' : 'none';
    renderStatsCharts();
}

function renderStatsCharts() {
    // 修正：正確讀取外送對帳的 pandaTransactions 紀錄
    const transactions = JSON.parse(localStorage.getItem('pandaTransactions')) || [];
    const monthVal = document.getElementById('statsMonthPicker')?.value || '';
    const yearVal = document.getElementById('statsYearPicker')?.value || '';

    const filtered = transactions.filter(t => {
        if (!t.date) return false;
        if (currentStatsPeriod === 'month') {
            return t.date.startsWith(monthVal);
        } else {
            return t.date.startsWith(yearVal);
        }
    });

    let totalInc = 0;
    let totalExp = 0;
    const categoryMap = {};

    filtered.forEach(t => {
        const amt = Math.abs(parseFloat(t.amount) || 0);
        if (t.type === 'income' || parseFloat(t.amount) > 0) {
            totalInc += amt;
        } else {
            totalExp += amt;
            const cat = t.reason || t.title || '其他支出';
            categoryMap[cat] = (categoryMap[cat] || 0) + amt;
        }
    });

    const net = totalInc - totalExp;
    document.getElementById('statsTotalInc').textContent = `NT$ ${totalInc.toLocaleString()}`;
    document.getElementById('statsTotalExp').textContent = `NT$ ${totalExp.toLocaleString()}`;
    document.getElementById('statsNet').textContent = `NT$ ${net.toLocaleString()}`;
    document.getElementById('statsNet').style.color = net >= 0 ? '#2e7d32' : '#d93025';

    const pieCtx = document.getElementById('expensePieChart');
    if (pieCtx) {
        if (expensePieChartInstance) expensePieChartInstance.destroy();
        const labels = Object.keys(categoryMap);
        const dataVals = Object.values(categoryMap);

        expensePieChartInstance = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['尚無支出'],
                datasets: [{
                    data: dataVals.length ? dataVals : [1],
                    backgroundColor: dataVals.length ? ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'] : ['#e0e0e0']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        const breakdownEl = document.getElementById('categoryBreakdownList');
        if (breakdownEl) {
            breakdownEl.innerHTML = labels.map((label, idx) => `
                <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:13px;">
                    <span>${label}</span>
                    <b>NT$ ${dataVals[idx].toLocaleString()}</b>
                </div>
            `).join('');
        }
    }

    const barCtx = document.getElementById('incExpBarChart');
    if (barCtx) {
        if (incExpBarChartInstance) incExpBarChartInstance.destroy();
        incExpBarChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['總收入', '總支出'],
                datasets: [{
                    label: '金額 (NT$)',
                    data: [totalInc, totalExp],
                    backgroundColor: ['#4CAF50', '#e53935'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// ================= 加密貨幣 / 比特幣管理 =================
function addCryptoItem() {
    const name = prompt('請輸入加密貨幣名稱 (例如：比特幣 BTC、以太幣 ETH)：', '比特幣 BTC');
    if (!name) return;
    const amount = parseFloat(prompt('請輸入持有顆數 (例如：0.05)：', '0.01')) || 0;
    const price = parseFloat(prompt('請輸入目前單顆台幣市價 (NT$)：', '3000000')) || 0;

    wealthData.cryptos.push({ name, amount, price });
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

function removeCryptoItem(index) {
    if (confirm('確定要刪除此加密貨幣項目嗎？')) {
        wealthData.cryptos.splice(index, 1);
        saveWealthData();
        renderAllWealthLists();
        fetchAllLatestPrices();
    }
}

function updateCryptoField(index, field, val) {
    wealthData.cryptos[index][field] = parseFloat(val) || 0;
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

// ================= 股票 / ETF 管理 =================
function addStockItem() {
    const name = prompt('請輸入股票名稱或代號 (例如：0050、2330、NVDA)：', '0050 元大台灣50');
    if (!name) return;
    const shares = parseFloat(prompt('請輸入持有股數 (例如：1000)：', '1000')) || 0;
    const price = parseFloat(prompt('請輸入目前單股台幣現價 (NT$)：', '190')) || 0;

    wealthData.stocks.push({ name, shares, price });
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

function removeStockItem(index) {
    if (confirm('確定要刪除此股票項目嗎？')) {
        wealthData.stocks.splice(index, 1);
        saveWealthData();
        renderAllWealthLists();
        fetchAllLatestPrices();
    }
}

function updateStockField(index, field, val) {
    wealthData.stocks[index][field] = parseFloat(val) || 0;
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

// ================= 基金投資管理 =================
function addFundItem() {
    const name = prompt('請輸入基金名稱：', '安聯收益成長基金');
    if (!name) return;
    const value = parseFloat(prompt('請輸入目前台幣總現值 (NT$)：', '100000')) || 0;

    wealthData.funds.push({ name, value });
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

function removeFundItem(index) {
    if (confirm('確定要刪除此基金項目嗎？')) {
        wealthData.funds.splice(index, 1);
        saveWealthData();
        renderAllWealthLists();
        fetchAllLatestPrices();
    }
}

function updateFundValue(index, val) {
    wealthData.funds[index].value = parseFloat(val) || 0;
    saveWealthData();
    fetchAllLatestPrices();
}

// ================= 保險與儲蓄險管理 =================
function addInsuranceItem() {
    const name = prompt('請輸入保單名稱：', '美元儲蓄險 / 醫療壽險');
    if (!name) return;
    const value = parseFloat(prompt('請輸入目前保單價值準備金 / 累積解約金 (NT$)：', '200000')) || 0;

    wealthData.insurances.push({ name, value });
    saveWealthData();
    renderAllWealthLists();
    fetchAllLatestPrices();
}

function removeInsuranceItem(index) {
    if (confirm('確定要刪除此保單項目嗎？')) {
        wealthData.insurances.splice(index, 1);
        saveWealthData();
        renderAllWealthLists();
        fetchAllLatestPrices();
    }
}

function updateInsuranceValue(index, val) {
    wealthData.insurances[index].value = parseFloat(val) || 0;
    saveWealthData();
    fetchAllLatestPrices();
}

// ================= 渲染所有資產清單 =================
function renderAllWealthLists() {
    const cryptoEl = document.getElementById('cryptoListContainer');
    if (cryptoEl) {
        if (!wealthData.cryptos || wealthData.cryptos.length === 0) {
            cryptoEl.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:10px 0;">尚未新增加密貨幣，請點擊右上方按鈕新增</div>';
        } else {
            cryptoEl.innerHTML = wealthData.cryptos.map((c, i) => {
                const subTotal = Math.round((c.amount || 0) * (c.price || 0));
                return `
                    <div style="background:#fff; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid #eee;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <b style="color:#f7931a;">₿ ${c.name}</b>
                            <div>
                                <span style="font-weight:bold; color:#2e7d32; margin-right:8px;">NT$ ${subTotal.toLocaleString()}</span>
                                <button onclick="removeCryptoItem(${i})" style="background:#e53935; color:white; border:none; border-radius:4px; padding:2px 8px; font-size:11px; cursor:pointer;">刪除</button>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                            <div>持有顆數：<input type="number" step="any" value="${c.amount}" onchange="updateCryptoField(${i}, 'amount', this.value)" style="width:80px; padding:3px; border:1px solid #ccc; border-radius:4px;"></div>
                            <div>單顆市價：<input type="number" value="${c.price}" onchange="updateCryptoField(${i}, 'price', this.value)" style="width:90px; padding:3px; border:1px solid #ccc; border-radius:4px;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const stockEl = document.getElementById('stockListContainer');
    if (stockEl) {
        if (!wealthData.stocks || wealthData.stocks.length === 0) {
            stockEl.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:10px 0;">尚未新增股票 / ETF</div>';
        } else {
            stockEl.innerHTML = wealthData.stocks.map((s, i) => {
                const subTotal = Math.round((s.shares || 0) * (s.price || 0));
                return `
                    <div style="background:#fff; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid #eee;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <b>📈 ${s.name}</b>
                            <div>
                                <span style="font-weight:bold; color:#2e7d32; margin-right:8px;">NT$ ${subTotal.toLocaleString()}</span>
                                <button onclick="removeStockItem(${i})" style="background:#e53935; color:white; border:none; border-radius:4px; padding:2px 8px; font-size:11px; cursor:pointer;">刪除</button>
                            </div>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:12px;">
                            <div>持有股數：<input type="number" value="${s.shares}" onchange="updateStockField(${i}, 'shares', this.value)" style="width:80px; padding:3px; border:1px solid #ccc; border-radius:4px;"></div>
                            <div>單股現價：<input type="number" step="any" value="${s.price}" onchange="updateStockField(${i}, 'price', this.value)" style="width:80px; padding:3px; border:1px solid #ccc; border-radius:4px;"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    const fundEl = document.getElementById('fundListContainer');
    if (fundEl) {
        if (!wealthData.funds || wealthData.funds.length === 0) {
            fundEl.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:10px 0;">尚未新增基金投資</div>';
        } else {
            fundEl.innerHTML = wealthData.funds.map((f, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid #eee;">
                    <b>🛡️ ${f.name}</b>
                    <div>
                        NT$ <input type="number" value="${f.value}" onchange="updateFundValue(${i}, this.value)" style="width:100px; padding:4px; border:1px solid #ccc; border-radius:4px; margin-right:6px;">
                        <button onclick="removeFundItem(${i})" style="background:#e53935; color:white; border:none; border-radius:4px; padding:3px 8px; font-size:11px; cursor:pointer;">刪除</button>
                    </div>
                </div>
            `).join('');
        }
    }

    const insEl = document.getElementById('insuranceListContainer');
    if (insEl) {
        if (!wealthData.insurances || wealthData.insurances.length === 0) {
            insEl.innerHTML = '<div style="text-align:center; color:#888; font-size:13px; padding:10px 0;">尚未新增保險與儲蓄險</div>';
        } else {
            insEl.innerHTML = wealthData.insurances.map((ins, i) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:8px; margin-bottom:8px; border:1px solid #eee;">
                    <b>📋 ${ins.name}</b>
                    <div>
                        NT$ <input type="number" value="${ins.value}" onchange="updateInsuranceValue(${i}, this.value)" style="width:100px; padding:4px; border:1px solid #ccc; border-radius:4px; margin-right:6px;">
                        <button onclick="removeInsuranceItem(${i})" style="background:#e53935; color:white; border:none; border-radius:4px; padding:3px 8px; font-size:11px; cursor:pointer;">刪除</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// ================= 計算總資產與圓餅圖 =================
function fetchAllLatestPrices() {
    const bills = parseFloat(document.getElementById('inputBills')?.value) || 0;
    const coins = parseFloat(document.getElementById('inputCoins')?.value) || 0;
    const panda = parseFloat(document.getElementById('inputPanda')?.value) || 0;
    const bank = parseFloat(document.getElementById('inputBank')?.value) || 0;
    
    let cashTotal = bills + coins + panda + bank;
    if (cashTotal === 0) {
        const savedAudit = JSON.parse(localStorage.getItem('vivi_last_audit'));
        if (savedAudit) {
            cashTotal = (parseFloat(savedAudit.bills) || 0) + (parseFloat(savedAudit.coins) || 0) + (parseFloat(savedAudit.panda) || 0) + (parseFloat(savedAudit.bank) || 0);
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

    updateRetirementDisplay(grandTotal);
}

// ================= 退休目標設定與進度追蹤邏輯 =================
function toggleRetirementEdit() {
    const form = document.getElementById('retirementEditForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

function loadRetirementGoal() {
    const saved = JSON.parse(localStorage.getItem('vivi_retirement_goal')) || {
        targetAmount: 15000000,
        targetYield: 4.5,
        planCash: 0,
        planStock: 0,
        planFund: 0,
        planIns: 0
    };

    if (document.getElementById('targetRetirementAmount')) document.getElementById('targetRetirementAmount').value = saved.targetAmount;
    if (document.getElementById('targetRetirementYield')) document.getElementById('targetRetirementYield').value = saved.targetYield;
    if (document.getElementById('planCashAmount')) document.getElementById('planCashAmount').value = saved.planCash || '';
    if (document.getElementById('planStockAmount')) document.getElementById('planStockAmount').value = saved.planStock || '';
    if (document.getElementById('planFundAmount')) document.getElementById('planFundAmount').value = saved.planFund || '';
    if (document.getElementById('planInsAmount')) document.getElementById('planInsAmount').value = saved.planIns || '';
}

function saveRetirementGoal() {
    const goalData = {
        targetAmount: parseFloat(document.getElementById('targetRetirementAmount')?.value) || 15000000,
        targetYield: parseFloat(document.getElementById('targetRetirementYield')?.value) || 4.5,
        planCash: parseFloat(document.getElementById('planCashAmount')?.value) || 0,
        planStock: parseFloat(document.getElementById('planStockAmount')?.value) || 0,
        planFund: parseFloat(document.getElementById('planFundAmount')?.value) || 0,
        planIns: parseFloat(document.getElementById('planInsAmount')?.value) || 0
    };

    localStorage.setItem('vivi_retirement_goal', JSON.stringify(goalData));
    fetchAllLatestPrices();
}

function updateRetirementDisplay(currentActualTotal) {
    const saved = JSON.parse(localStorage.getItem('vivi_retirement_goal')) || {
        targetAmount: 15000000,
        targetYield: 4.5,
        planCash: 0,
        planStock: 0,
        planFund: 0,
        planIns: 0
    };

    const targetAmount = saved.targetAmount > 0 ? saved.targetAmount : 15000000;
    const targetYield = saved.targetYield || 0;

    const plannedTotal = (saved.planCash || 0) + (saved.planStock || 0) + (saved.planFund || 0) + (saved.planIns || 0);
    const subTotalEl = document.getElementById('plannedSubTotalDisplay');
    if (subTotalEl) {
        subTotalEl.textContent = `NT$ ${Math.round(plannedTotal).toLocaleString()}`;
    }

    const effectiveTotal = plannedTotal > 0 ? plannedTotal : (currentActualTotal || 0);

    let percent = (effectiveTotal / targetAmount) * 100;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;

    const percentEl = document.getElementById('retirementProgressPercent');
    const barEl = document.getElementById('retirementProgressBar');
    if (percentEl) percentEl.textContent = `${percent.toFixed(1)}%`;
    if (barEl) barEl.style.width = `${percent.toFixed(1)}%`;

    const annualIncome = effectiveTotal * (targetYield / 100);
    const monthlyIncome = annualIncome / 12;

    const monthlyEl = document.getElementById('retMonthlyIncome');
    const annualEl = document.getElementById('retAnnualIncome');
    if (monthlyEl) monthlyEl.textContent = `NT$ ${Math.round(monthlyIncome).toLocaleString()} /月`;
    if (annualEl) annualEl.textContent = `NT$ ${Math.round(annualIncome).toLocaleString()} /年`;
}

// ================= 初始化財產頁面 (修正後正常載入) =================
function initWealthPage() {
    wealthData = JSON.parse(localStorage.getItem('vivi_wealth_data')) || getDefaultWealthData();
    if (!wealthData.cryptos) wealthData.cryptos = [];
    if (!wealthData.stocks) wealthData.stocks = [];
    if (!wealthData.funds) wealthData.funds = [];
    if (!wealthData.insurances) wealthData.insurances = [];
    renderAllWealthLists();
    loadRetirementGoal();
    fetchAllLatestPrices();
}