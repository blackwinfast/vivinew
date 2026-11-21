// ================= Alarm & Timer Module =================

let alarmList = StorageService ? StorageService.get('vivi_alarms_v1', []) : [];
let activeTimerInterval = null;
let timerRemainingSeconds = 0;

window.addEventListener('DOMContentLoaded', () => {
    renderAlarmSection();
    setInterval(checkAlarms, 1000);
});

function playAlarmSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log('Audio context not supported or blocked', e);
    }
}

function renderAlarmSection() {
    let container = document.getElementById('alarmModuleContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="card" style="background: #fdfaf6; border: 1.5px solid #d4b59d; border-radius: 12px; padding: 15px;">
            <h3 style="margin: 0 0 12px 0; color: #5c4033;">⏰ 鬧鐘與倒數計時器</h3>
            
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                <button type="button" id="tabAlarmBtn" onclick="switchAlarmTab('alarm')" style="flex:1; padding:6px; background:#8d5b4c; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">鬧鐘設定</button>
                <button type="button" id="tabTimerBtn" onclick="switchAlarmTab('timer')" style="flex:1; padding:6px; background:#f0e4dc; color:#5c4033; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px;">倒數計時</button>
            </div>

            <!-- 鬧鐘面板 -->
            <div id="panelAlarm" style="display: block;">
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <input type="time" id="newAlarmTimeInput" style="flex: 2; padding: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;">
                    <input type="text" id="newAlarmLabelInput" placeholder="標題 (例: 開會)" value="鬧鐘提醒" style="flex: 3; padding: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;">
                    <button type="button" onclick="addNewAlarm()" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">＋ 新增</button>
                </div>
                <div id="alarmListContainer"></div>
            </div>

            <!-- 倒數計時面板 -->
            <div id="panelTimer" style="display: none; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #8d5b4c; margin: 10px 0;" id="timerDisplay">00:00</div>
                
                <!-- 自訂輸入分鐘區塊 -->
                <div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 10px;">
                    <input type="number" id="customTimerInput" placeholder="輸入分鐘數" min="1" max="1440" style="width: 120px; padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; text-align: center;">
                    <button type="button" onclick="startCustomTimer()" style="padding: 6px 14px; background: #8d5b4c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">開始倒數</button>
                </div>

                <!-- 快速按鈕區 -->
                <div style="display: flex; justify-content: center; gap: 6px; margin-bottom: 12px;">
                    <button type="button" onclick="startTimerMinutes(3)" style="padding: 5px 8px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-size: 12px;">3分</button>
                    <button type="button" onclick="startTimerMinutes(5)" style="padding: 5px 8px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-size: 12px;">5分</button>
                    <button type="button" onclick="startTimerMinutes(10)" style="padding: 5px 8px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-size: 12px;">10分</button>
                    <button type="button" onclick="startTimerMinutes(30)" style="padding: 5px 8px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-size: 12px;">30分</button>
                    <button type="button" onclick="startTimerMinutes(60)" style="padding: 5px 8px; background: #fff; border: 1px solid #ccc; border-radius: 6px; cursor: pointer; font-size: 12px;">60分</button>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button type="button" onclick="stopTimer()" style="padding: 6px 14px; background: #e53935; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">停止 / 重設</button>
                </div>
            </div>
        </div>
    `;
    renderAlarmList();
}

function switchAlarmTab(mode) {
    const pAlarm = document.getElementById('panelAlarm');
    const pTimer = document.getElementById('panelTimer');
    const bAlarm = document.getElementById('tabAlarmBtn');
    const bTimer = document.getElementById('tabTimerBtn');

    if (mode === 'alarm') {
        pAlarm.style.display = 'block';
        pTimer.style.display = 'none';
        bAlarm.style.background = '#8d5b4c';
        bAlarm.style.color = '#fff';
        bTimer.style.background = '#f0e4dc';
        bTimer.style.color = '#5c4033';
    } else {
        pAlarm.style.display = 'none';
        pTimer.style.display = 'block';
        bTimer.style.background = '#8d5b4c';
        bTimer.style.color = '#fff';
        bAlarm.style.background = '#f0e4dc';
        bAlarm.style.color = '#5c4033';
    }
}

function addNewAlarm() {
    const timeVal = document.getElementById('newAlarmTimeInput').value;
    const labelVal = document.getElementById('newAlarmLabelInput').value.trim() || '鬧鐘提醒';
    if (!timeVal) {
        alert('請先選擇鬧鐘時間！');
        return;
    }

    if (!Array.isArray(alarmList)) alarmList = [];
    alarmList.push({
        id: 'alarm_' + Date.now(),
        time: timeVal,
        label: labelVal,
        active: true
    });

    StorageService.set('vivi_alarms_v1', alarmList);
    renderAlarmList();
    if (typeof showNotification === 'function') showNotification('✅ 鬧鐘設定成功！');
}

function toggleAlarm(id) {
    const alarm = alarmList.find(a => a.id === id);
    if (alarm) {
        alarm.active = !alarm.active;
        StorageService.set('vivi_alarms_v1', alarmList);
        renderAlarmList();
    }
}

function deleteAlarm(id) {
    alarmList = alarmList.filter(a => a.id !== id);
    StorageService.set('vivi_alarms_v1', alarmList);
    renderAlarmList();
}

function renderAlarmList() {
    const container = document.getElementById('alarmListContainer');
    if (!container) return;

    if (!alarmList || alarmList.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888; padding:10px 0; font-size:12px;">目前尚無設定鬧鐘</div>';
        return;
    }

    container.innerHTML = alarmList.map(a => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px 10px; border-radius:8px; margin-bottom:6px; border:1px solid #eee;">
            <div>
                <span style="font-size:16px; font-weight:bold; color:${a.active ? '#333' : '#aaa'};">${a.time}</span>
                <span style="font-size:13px; color:#666; margin-left:8px;">${a.label}</span>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <button type="button" onclick="toggleAlarm('${a.id}')" style="padding:3px 8px; background:${a.active ? '#4CAF50' : '#ccc'}; color:#fff; border:none; border-radius:6px; font-size:11px; cursor:pointer;">${a.active ? '啟用中' : '已關閉'}</button>
                <button type="button" onclick="deleteAlarm('${a.id}')" style="background:none; border:none; cursor:pointer; color:#e53935; font-size:13px;">🗑️</button>
            </div>
        </div>
    `).join('');
}

function checkAlarms() {
    if (!Array.isArray(alarmList) || alarmList.length === 0) return;

    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const currentSec = now.getSeconds();

    if (currentSec === 0) {
        alarmList.forEach(a => {
            if (a.active && a.time === currentHHmm) {
                playAlarmSound();
                alert(`⏰ 【鬧鐘時間到】\n${a.label} (${a.time})`);
            }
        });
    }
}

// 讀取自訂輸入框的分鐘數並開始倒數
function startCustomTimer() {
    const inputVal = document.getElementById('customTimerInput').value;
    const mins = parseFloat(inputVal);
    if (isNaN(mins) || mins <= 0) {
        alert('請輸入有效的倒數分鐘數！');
        return;
    }
    startTimerMinutes(mins);
}

function startTimerMinutes(mins) {
    stopTimer();
    timerRemainingSeconds = Math.round(mins * 60);
    updateTimerDisplay();

    activeTimerInterval = setInterval(() => {
        timerRemainingSeconds--;
        updateTimerDisplay();

        if (timerRemainingSeconds <= 0) {
            stopTimer();
            playAlarmSound();
            alert('⏱️ 倒數計時結束囉！');
        }
    }, 1000);
}

function stopTimer() {
    if (activeTimerInterval) {
        clearInterval(activeTimerInterval);
        activeTimerInterval = null;
    }
    timerRemainingSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const disp = document.getElementById('timerDisplay');
    if (!disp) return;

    const m = Math.floor(timerRemainingSeconds / 60);
    const s = timerRemainingSeconds % 60;
    disp.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}