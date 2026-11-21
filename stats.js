// ================= Stats Module (收支統計分析模組) =================

let expensePieChartInstance = null;
let incExpBarChartInstance = null;
let currentStatsPeriod = 'month';

function openStatsPage() {
    if (typeof showPage === 'function') showPage('stats');
    initStatsPickers();
    renderStatsCharts();
}

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
    const btnMonth = document.getElementById('btnStatsMonth');
    const btnYear = document.getElementById('btnStatsYear');
    if (btnMonth) btnMonth.classList.toggle('active', period === 'month');
    if (btnYear) btnYear.classList.toggle('active', period === 'year');
    
    const monthPicker = document.getElementById('statsMonthPicker');
    const yearPicker = document.getElementById('statsYearPicker');
    if (monthPicker) monthPicker.style.display = period === 'month' ? 'inline-block' : 'none';
    if (yearPicker) yearPicker.style.display = period === 'year' ? 'inline-block' : 'none';
    
    renderStatsCharts();
}

function renderStatsCharts() {
    // 🛡️ 正式且安全的流水來源取得方式（直接呼叫 finance.js 介面，並嚴格防範空帳本誤觸 fallback）
    let transactions = [];
    if (typeof getTransactionsForLedger === 'function' && typeof currentLedgerId !== 'undefined') {
        transactions = getTransactionsForLedger(currentLedgerId);
    } else {
        transactions = JSON.parse(localStorage.getItem('pandaTransactions')) || [];
    }

    // 若依然不是陣列的保底防禦
    if (!Array.isArray(transactions)) {
        transactions = [];
    }

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
        // 🛡️ P1 修正：嚴格過濾未出帳信用卡刷卡紀錄，避免與繳卡費重複計算支出
        if (t.isCredit) return;

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
    const incEl = document.getElementById('statsTotalInc');
    const expEl = document.getElementById('statsTotalExp');
    const netEl = document.getElementById('statsNet');
    
    if (incEl) incEl.textContent = `NT$ ${totalInc.toLocaleString()}`;
    if (expEl) expEl.textContent = `NT$ ${totalExp.toLocaleString()}`;
    if (netEl) {
        netEl.textContent = `NT$ ${net.toLocaleString()}`;
        netEl.style.color = net >= 0 ? '#2e7d32' : '#d93025';
    }

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