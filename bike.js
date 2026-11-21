// ================= Bike & Maintenance Module =================

document.addEventListener('DOMContentLoaded', () => {
    loadBikeData();
});

function toggleEditBike() {
    const form = document.getElementById('bikeEditForm');
    if (!form) return;
    form.classList.toggle('active');
    if (form.classList.contains('active')) {
        // 雙軌讀取
        const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || { name: '我的愛車', model: 'Yamaha NMAX 155', plate: 'ABC-1234', mileage: 0 });
        const nameInput = document.getElementById('inputBikeName');
        const modelInput = document.getElementById('inputBikeModel');
        const plateInput = document.getElementById('inputBikePlate');
        const mileageInput = document.getElementById('inputBikeMileage');
        if (nameInput) nameInput.value = info.name || '';
        if (modelInput) modelInput.value = info.model || '';
        if (plateInput) plateInput.value = info.plate || '';
        if (mileageInput) mileageInput.value = info.mileage || 0;
    }
}

function saveBikeInfo() {
    const nameEl = document.getElementById('inputBikeName');
    const modelEl = document.getElementById('inputBikeModel');
    const plateEl = document.getElementById('inputBikePlate');
    const mileageEl = document.getElementById('inputBikeMileage');

    // 雙軌讀取
    const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || {});

    info.name = nameEl ? nameEl.value.trim() || '我的愛車' : '我的愛車';
    info.model = modelEl ? modelEl.value.trim() || '未填寫' : '未填寫';
    info.plate = plateEl ? plateEl.value.trim() || '未填寫' : '未填寫';
    info.mileage = mileageEl ? Number(mileageEl.value) || 0 : 0;

    // 雙寫入更新
    StorageService.set(STORAGE_KEYS.BIKE_INFO, info);
    localStorage.setItem('vivi_bike_info', JSON.stringify(info));

    toggleEditBike();
    loadBikeData();
    if (typeof showNotification === 'function') showNotification('✅ 愛車與車型車牌已更新！');
}

// 上傳或拍照更換愛車照片
function uploadBikePhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const base64Image = ev.target.result;
            // 雙軌讀取
            const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || {});
            info.photo = base64Image;

            // 雙寫入更新
            StorageService.set(STORAGE_KEYS.BIKE_INFO, info);
            localStorage.setItem('vivi_bike_info', JSON.stringify(info));

            loadBikeData();
            if (typeof showNotification === 'function') showNotification('📸 愛車照片已更新！');
        };
        reader.readAsDataURL(file);
    }
}

function toggleAddMaintenance() {
    const form = document.getElementById('addMaintenanceForm');
    if (!form) return;
    form.classList.toggle('active');
    if (form.classList.contains('active')) {
        const titleEl = document.getElementById('maintTitle');
        const dateEl = document.getElementById('maintDate');
        const targetKmEl = document.getElementById('maintTargetKm');
        const descEl = document.getElementById('maintDesc');
        if (titleEl) titleEl.value = '';
        if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
        if (targetKmEl) targetKmEl.value = '';
        if (descEl) descEl.value = '';
    }
}

function loadBikeData() {
    // 雙軌讀取
    const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || {
        name: '我的愛車',
        model: 'Yamaha NMAX 155',
        plate: 'ABC-1234',
        mileage: 0,
        photo: ''
    });
    const currentMileage = Number(info.mileage || 0);

    const dispName = document.getElementById('displayBikeName');
    const dispModel = document.getElementById('displayBikeModel');
    const dispPlate = document.getElementById('displayBikePlate');
    const dispMileage = document.getElementById('displayBikeMileage');
    const dispPhotoImg = document.getElementById('displayBikePhotoImg');
    const dispEmoji = document.getElementById('displayBikeEmoji');

    if (dispName) dispName.textContent = info.name;
    if (dispModel) dispModel.textContent = `型號：${info.model}`;
    if (dispPlate) dispPlate.textContent = `車牌號碼：${info.plate}`;
    if (dispMileage) dispMileage.textContent = `目前里程：${currentMileage.toLocaleString()} km`;

    // 處理愛車照片顯示
    if (dispPhotoImg && dispEmoji) {
        if (info.photo) {
            dispPhotoImg.src = info.photo;
            dispPhotoImg.style.display = 'block';
            dispEmoji.style.display = 'none';
        } else {
            dispPhotoImg.style.display = 'none';
            dispEmoji.style.display = 'block';
        }
    }

    // 雙軌讀取歷史與待辦
    const history = StorageService.get(STORAGE_KEYS.BIKE_HISTORY, JSON.parse(localStorage.getItem('vivi_bike_history')) || []);
    const upcoming = StorageService.get(STORAGE_KEYS.BIKE_UPCOMING, JSON.parse(localStorage.getItem('vivi_bike_upcoming')) || []);
    const upcomingEl = document.getElementById('upcomingList');

    if (upcomingEl) {
        let htmlContent = '';

        // 手動待辦事項
        if (upcoming.length > 0) {
            htmlContent += `<div style="font-size: 13px; font-weight: bold; color: #555; margin-bottom: 6px;">📌 手動待辦提醒</div>`;
            htmlContent += upcoming.map((item, index) => `
                <div class="maintenance-item">
                    <div class="maintenance-info" style="flex: 1;">
                        <div class="maintenance-title" style="font-weight: bold; color: #333;">${item.title}</div>
                        <div class="maintenance-date" style="font-size: 13px; color: #666; margin: 2px 0;">📅 預定日期：${item.date} ${item.targetKm ? `| 🎯 建議於 <b>${Number(item.targetKm).toLocaleString()} km</b> 時保養` : ''}</div>
                        <div class="maintenance-desc" style="font-size: 13px; color: #555;">${item.desc || '無詳細說明'}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-success" onclick="completeMaintenance(${index})">✅ 完成</button>
                        <button class="btn-danger" onclick="deleteUpcoming(${index})">刪除</button>
                    </div>
                </div>
            `).join('');
        }

        // 自動彙整各大零件最後保養時間與狀態
        htmlContent += `<div style="font-size: 13px; font-weight: bold; color: #555; margin: ${upcoming.length > 0 ? '15px' : '0'} 0 6px 0;">🔧 各大零件最後保養狀態</div>`;
        
        const latestPartsMap = {};
        history.forEach((item, originalIndex) => {
            const key = item.title.trim();
            if (!latestPartsMap[key]) {
                latestPartsMap[key] = { ...item, originalIndex };
            }
        });

        const partKeys = Object.keys(latestPartsMap);
        if (partKeys.length === 0) {
            htmlContent += '<div style="text-align: center; color: #888; padding: 15px 0; font-size: 13px;">尚無零件保養紀錄，請從下方新增或快速記錄</div>';
        } else {
            htmlContent += partKeys.map(key => {
                const p = latestPartsMap[key];
                const lastKm = Number(p.km || 0);
                const nextKm = Number(p.nextKm || 0);
                let statusText = '';
                let statusColor = '#2e7d32';

                if (nextKm > 0) {
                    const diff = nextKm - currentMileage;
                    if (diff < 0) {
                        statusText = `⚠️ 已超過建議保養里程 ${Math.abs(diff).toLocaleString()} km！`;
                        statusColor = '#e53935';
                    } else {
                        statusText = `🎯 距離下次保養還有 ${diff.toLocaleString()} km (預計 ${nextKm.toLocaleString()} km)`;
                    }
                } else {
                    statusText = `🕒 上次保養日期：${p.date}`;
                }

                return `
                    <div class="maintenance-item" style="border-left: 4px solid ${statusColor}; flex-direction: column; align-items: stretch; gap: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="maintenance-info" style="flex: 1;">
                                <div class="maintenance-title" style="font-weight: bold; color: #333;">${p.title}</div>
                                <div class="maintenance-date" style="font-size: 13px; color: #666; margin: 2px 0;">
                                    🛵 最後保養里程：<b>${lastKm.toLocaleString()} km</b> (${p.date})
                                </div>
                                <div style="font-size: 13px; color: ${statusColor}; font-weight: bold; margin-top: 2px;">
                                    ${statusText}
                                </div>
                            </div>
                        </div>
                        <!-- 展延輸入列 -->
                        <div style="display: flex; align-items: center; gap: 6px; background: #faf7f2; padding: 6px 10px; border-radius: 8px; border: 1px solid #e8d0c0;">
                            <span style="font-size: 12px; color: #666;">⏱️ 展延下次保養：</span>
                            <input type="number" id="extendInput_${p.originalIndex}" placeholder="增加公里數" value="" style="width: 130px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 12px;">
                            <span style="font-size: 12px; color: #666;">km</span>
                            <button type="button" onclick="confirmExtend(${p.originalIndex})" style="background: #ff9800; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; margin-left: auto;">確定展延</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        upcomingEl.innerHTML = htmlContent;
    }

    // 2. 渲染歷史保養紀錄
    const historyEl = document.getElementById('historyList');
    if (historyEl) {
        if (history.length === 0) {
            historyEl.innerHTML = '<div style="text-align: center; color: #888; padding: 15px 0; font-size: 13px;">尚無歷史保養記錄</div>';
        } else {
            historyEl.innerHTML = history.map((item, index) => `
                <div class="history-item">
                    <div class="history-info" style="flex: 1;">
                        <div class="maintenance-title" style="font-weight: bold; color: #333;">${item.title}</div>
                        <div class="maintenance-date" style="font-size: 13px; color: #666; margin: 2px 0;">
                            🕒 ${item.date} | 🛵 保養里程：<b>${Number(item.km || 0).toLocaleString()} km</b> 
                            ${item.cost ? `| 💰 花費：<b style="color:#e53935;">NT$ ${Number(item.cost).toLocaleString()}</b>` : ''}
                        </div>
                        ${item.nextKm ? `<div style="font-size: 12px; color: #2e7d32;">🎯 下次建議保養里程：${Number(item.nextKm).toLocaleString()} km</div>` : ''}
                        <div class="maintenance-desc" style="font-size: 13px; color: #555; margin-top: 2px;">${item.desc || ''}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn-danger" onclick="deleteHistory(${index})">刪除</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function confirmExtend(historyIndex) {
    const inputEl = document.getElementById(`extendInput_${historyIndex}`);
    const addKm = inputEl ? Number(inputEl.value) || 0 : 0;

    if (addKm <= 0) {
        alert('請輸入有效的展延公里數！');
        return;
    }

    // 雙軌讀取
    const history = StorageService.get(STORAGE_KEYS.BIKE_HISTORY, JSON.parse(localStorage.getItem('vivi_bike_history')) || []);
    if (history[historyIndex]) {
        const currentNext = Number(history[historyIndex].nextKm) || Number(history[historyIndex].km || 0) + 3000;
        history[historyIndex].nextKm = currentNext + addKm;

        // 雙寫入更新
        StorageService.set(STORAGE_KEYS.BIKE_HISTORY, history);
        localStorage.setItem('vivi_bike_history', JSON.stringify(history));

        loadBikeData();
        if (typeof showNotification === 'function') {
            showNotification(`⏱️ 已成功將【${history[historyIndex].title}】下次保養里程展延至 ${history[historyIndex].nextKm.toLocaleString()} km！`);
        } else {
            alert(`已成功展延下次保養里程至 ${history[historyIndex].nextKm.toLocaleString()} km！`);
        }
    }
}

function addUpcomingMaintenance() {
    const titleEl = document.getElementById('maintTitle');
    const dateEl = document.getElementById('maintDate');
    const targetKmEl = document.getElementById('maintTargetKm');
    const descEl = document.getElementById('maintDesc');

    const title = titleEl ? titleEl.value.trim() : '';
    const date = dateEl ? dateEl.value : '';
    const targetKm = targetKmEl ? targetKmEl.value : '';
    const desc = descEl ? descEl.value.trim() : '';

    if (!title || !date) {
        alert('請填寫保養標題與預定日期！');
        return;
    }

    // 雙軌讀取
    const upcoming = StorageService.get(STORAGE_KEYS.BIKE_UPCOMING, JSON.parse(localStorage.getItem('vivi_bike_upcoming')) || []);
    upcoming.push({ title, date, targetKm, desc });

    // 雙寫入更新
    StorageService.set(STORAGE_KEYS.BIKE_UPCOMING, upcoming);
    localStorage.setItem('vivi_bike_upcoming', JSON.stringify(upcoming));

    toggleAddMaintenance();
    loadBikeData();
    if (typeof showNotification === 'function') showNotification('📌 已成功新增待辦保養！');
}

function quickAddHistory() {
    const titleEl = document.getElementById('quickTitle');
    const costEl = document.getElementById('quickCost');
    const kmEl = document.getElementById('quickKm');
    const nextKmEl = document.getElementById('quickNextKm');

    const title = titleEl ? titleEl.value.trim() || '更換機油' : '更換機油';
    const cost = costEl ? Number(costEl.value) || 0 : 0;
    const km = kmEl ? Number(kmEl.value) || 0 : 0;
    const nextKm = nextKmEl ? Number(nextKmEl.value) || 0 : 0;

    if (km === 0) {
        alert('請輸入當前的保養里程數！');
        return;
    }

    // 雙軌讀取
    const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || { name: '我的愛車', model: 'Yamaha NMAX 155', plate: 'ABC-1234', mileage: 1000 });
    info.mileage = km;

    // 雙寫入更新車輛資訊
    StorageService.set(STORAGE_KEYS.BIKE_INFO, info);
    localStorage.setItem('vivi_bike_info', JSON.stringify(info));

    // 雙軌讀取歷史
    const history = StorageService.get(STORAGE_KEYS.BIKE_HISTORY, JSON.parse(localStorage.getItem('vivi_bike_history')) || []);
    const nowStr = new Date().toISOString().slice(0, 10);
    history.unshift({
        title,
        date: nowStr,
        km,
        cost,
        nextKm,
        desc: `車行報價 NT$ ${cost}，保養時里程 ${km} km`
    });

    // 雙寫入更新歷史
    StorageService.set(STORAGE_KEYS.BIKE_HISTORY, history);
    localStorage.setItem('vivi_bike_history', JSON.stringify(history));

    if (costEl) costEl.value = '';
    if (kmEl) kmEl.value = '';
    if (nextKmEl) nextKmEl.value = '';

    loadBikeData();
    if (typeof showNotification === 'function') showNotification('🎉 保養記錄已寫入，愛車里程已同步更新！');
}

function completeMaintenance(index) {
    // 雙軌讀取
    const upcoming = StorageService.get(STORAGE_KEYS.BIKE_UPCOMING, JSON.parse(localStorage.getItem('vivi_bike_upcoming')) || []);
    const item = upcoming.splice(index, 1)[0];
    
    // 雙寫入更新待辦
    StorageService.set(STORAGE_KEYS.BIKE_UPCOMING, upcoming);
    localStorage.setItem('vivi_bike_upcoming', JSON.stringify(upcoming));

    const history = StorageService.get(STORAGE_KEYS.BIKE_HISTORY, JSON.parse(localStorage.getItem('vivi_bike_history')) || []);
    const nowStr = new Date().toISOString().slice(0, 10);
    const info = StorageService.get(STORAGE_KEYS.BIKE_INFO, JSON.parse(localStorage.getItem('vivi_bike_info')) || { mileage: 0 });

    history.unshift({
        title: item.title,
        date: nowStr,
        km: info.mileage,
        cost: 0,
        nextKm: item.targetKm || 0,
        desc: item.desc || '如期完成保養'
    });

    // 雙寫入更新歷史
    StorageService.set(STORAGE_KEYS.BIKE_HISTORY, history);
    localStorage.setItem('vivi_bike_history', JSON.stringify(history));

    loadBikeData();
    if (typeof showNotification === 'function') showNotification('🎉 項目已完成並移至歷史記錄！');
}

function deleteUpcoming(index) {
    if (confirm('確定要刪除這項待辦保養嗎？')) {
        const upcoming = StorageService.get(STORAGE_KEYS.BIKE_UPCOMING, JSON.parse(localStorage.getItem('vivi_bike_upcoming')) || []);
        upcoming.splice(index, 1);

        StorageService.set(STORAGE_KEYS.BIKE_UPCOMING, upcoming);
        localStorage.setItem('vivi_bike_upcoming', JSON.stringify(upcoming));
        loadBikeData();
    }
}

function deleteHistory(index) {
    if (confirm('確定要刪除這筆保養記錄嗎？')) {
        const history = StorageService.get(STORAGE_KEYS.BIKE_HISTORY, JSON.parse(localStorage.getItem('vivi_bike_history')) || []);
        history.splice(index, 1);

        StorageService.set(STORAGE_KEYS.BIKE_HISTORY, history);
        localStorage.setItem('vivi_bike_history', JSON.stringify(history));
        loadBikeData();
    }
}

function clearHistory() {
    if (confirm('確定要清空所有保養記錄嗎？')) {
        StorageService.remove(STORAGE_KEYS.BIKE_HISTORY);
        localStorage.removeItem('vivi_bike_history');
        loadBikeData();
        if (typeof showNotification === 'function') showNotification('🗑️ 保養記錄已清空！');
    }
}