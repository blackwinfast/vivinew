// ================= Wealth Assets Management Module =================

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