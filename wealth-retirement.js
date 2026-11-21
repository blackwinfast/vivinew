// ================= Wealth Retirement Module =================

function toggleRetirementEdit() {
    const form = document.getElementById('retirementEditForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

function loadRetirementGoal() {
    const saved = StorageService.get(STORAGE_KEYS.RETIREMENT_GOAL, JSON.parse(localStorage.getItem('vivi_retirement_goal')) || {
        targetAmount: 15000000,
        targetYield: 4.5,
        planCash: 0,
        planStock: 0,
        planFund: 0,
        planIns: 0
    });

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

    StorageService.set(STORAGE_KEYS.RETIREMENT_GOAL, goalData);
    localStorage.setItem('vivi_retirement_goal', JSON.stringify(goalData));
    fetchAllLatestPrices();
}

function updateRetirementDisplay(currentActualTotal) {
    const saved = StorageService.get(STORAGE_KEYS.RETIREMENT_GOAL, JSON.parse(localStorage.getItem('vivi_retirement_goal')) || {
        targetAmount: 15000000,
        targetYield: 4.5,
        planCash: 0,
        planStock: 0,
        planFund: 0,
        planIns: 0
    });

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