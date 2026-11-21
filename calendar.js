// ================= Google Style Calendar Module (Import & Export .ics Version) =================

let selectedDateStr = '';
let currentCalendarState = {
    generateFn: null
};

document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
});

// 簡易農曆與節氣對照表 (2026 年)
const SPECIAL_DAYS_2026 = {
    '2026-01-01': { lunar: '冬月十三', name: '元旦' },
    '2026-01-05': { lunar: '冬月十七', name: '小寒' },
    '2026-01-20': { lunar: '腊月初二', name: '大寒' },
    '2026-02-04': { lunar: '腊月十七', name: '立春' },
    '2026-02-16': { lunar: '腊月廿九', name: '除夕' },
    '2026-02-17': { lunar: '正月初一', name: '春節' },
    '2026-02-18': { lunar: '正月初二', name: '初二' },
    '2026-02-19': { lunar: '正月初三', name: '初三' },
    '2026-02-28': { lunar: '正月十二', name: '和平紀念日' },
    '2026-03-05': { lunar: '正月十七', name: '驚蟄' },
    '2026-03-21': { lunar: '二月初三', name: '春分' },
    '2026-04-04': { lunar: '二月十七', name: '清明節' },
    '2026-04-05': { lunar: '二月十八', name: '兒童節' },
    '2026-04-20': { lunar: '三月初四', name: '谷雨' },
    '2026-05-01': { lunar: '三月十五', name: '勞動節' },
    '2026-05-05': { lunar: '三月十九', name: '立夏' },
    '2026-05-21': { lunar: '四月初五', name: '小滿' },
    '2026-06-05': { lunar: '四月二十', name: '芒種' },
    '2026-06-19': { lunar: '五月初五', name: '端午節' },
    '2026-06-21': { lunar: '五月七日', name: '夏至' },
    '2026-07-07': { lunar: '五月廿三', name: '小暑' },
    '2026-07-22': { lunar: '六月初八', name: '大暑' },
    '2026-08-07': { lunar: '六月廿四', name: '立秋' },
    '2026-08-23': { lunar: '七月十一', name: '處暑' },
    '2026-09-07': { lunar: '七月廿六', name: '白露' },
    '2026-09-23': { lunar: '八月十二', name: '秋分' },
    '2026-09-25': { lunar: '八月十四', name: '中秋節' },
    '2026-10-08': { lunar: '八月廿七', name: '寒露' },
    '2026-10-10': { lunar: '八月廿九', name: '國慶日' },
    '2026-10-23': { lunar: '九月十三', name: '霜降' },
    '2026-11-07': { lunar: '九月廿八', name: '立冬' },
    '2026-11-22': { lunar: '十月十四', name: '小雪' },
    '2026-12-07': { lunar: '十月廿九', name: '大雪' },
    '2026-12-21': { lunar: '十一月十三', name: '冬至' }
};

function getLunarOrFestival(dateStr, dayNum) {
    if (SPECIAL_DAYS_2026[dateStr]) {
        return SPECIAL_DAYS_2026[dateStr].name;
    }
    const lunarList = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    return lunarList[(dayNum - 1) % 30];
}

// 🛡️ 宣告行事曆初始化的防禦旗標（Singleton Guard）
let isCalendarInitialized = false;

function initCalendar() {
    if (isCalendarInitialized) {
        if (typeof currentCalendarState.generateFn === 'function') {
            currentCalendarState.generateFn();
        }
        return;
    }
    isCalendarInitialized = true;

    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevButton = document.getElementById('prevMonth');
    const nextButton = document.getElementById('nextMonth');

    if (!calendarGrid || !currentMonthElement || !prevButton || !nextButton) return;

    // 🧠 記憶上次瀏覽的年月，若無則預設為今天
let currentDate = new Date();
// 雙軌讀取：優先使用 StorageService，退回舊 Key
const savedYearMonth = StorageService.get(
    STORAGE_KEYS.CALENDAR_LAST_YM, 
    localStorage.getItem('vivi_calendar_last_ym')
);

// 🛡️ 確保 savedYearMonth 是字串且格式正確，避免 split 崩潰
if (savedYearMonth && typeof savedYearMonth === 'string' && savedYearMonth.includes('-')) {
    const [sy, sm] = savedYearMonth.split('-');
    currentDate = new Date(parseInt(sy), parseInt(sm) - 1, 1);
} else {
    // 若格式跑掉或為空，自動清除並回退到當月
    StorageService.remove(STORAGE_KEYS.CALENDAR_LAST_YM);
    localStorage.removeItem('vivi_calendar_last_ym');
}

    const today = new Date();
    if (!selectedDateStr) {
        selectedDateStr = formatDateKey(today);
    }

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    function formatDateKey(dateObj) {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function generateCalendar(year, month) {
        calendarGrid.innerHTML = '';
        currentMonthElement.textContent = `${year}年 ${monthNames[month]}`;

        // 儲存當前瀏覽年月至 localStorage
        localStorage.setItem('vivi_calendar_last_ym', `${year}-${String(month + 1).padStart(2, '0')}`);

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        const firstDayOfWeek = firstDay.getDay();

        const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};

        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        weekDays.forEach((day, index) => {
            const dayElement = document.createElement('div');
            dayElement.style.background = '#f8f9fa';
            dayElement.style.padding = '10px 0';
            dayElement.style.textAlign = 'center';
            dayElement.style.fontSize = '14px';
            dayElement.style.fontWeight = 'bold';
            dayElement.style.color = (index === 0 || index === 6) ? '#d93025' : '#3c4043';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });

        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.style.background = '#fff';
            dayElement.style.minHeight = '90px';
            dayElement.style.padding = '6px';
            dayElement.style.color = '#bdc1c6';
            dayElement.style.fontSize = '14px';
            dayElement.textContent = prevLastDay.getDate() - i;
            calendarGrid.appendChild(dayElement);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateObj = new Date(year, month, day);
            const dateKey = formatDateKey(dateObj);
            const dayOfWeek = dateObj.getDay();

            const dayElement = document.createElement('div');
            dayElement.style.background = '#fff';
            dayElement.style.minHeight = '90px';
            dayElement.style.padding = '6px';
            dayElement.style.position = 'relative';
            dayElement.style.cursor = 'pointer';
            dayElement.style.display = 'flex';
            dayElement.style.flexDirection = 'column';
            dayElement.style.justifyContent = 'space-between';

            const isSpecial = SPECIAL_DAYS_2026[dateKey];
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isRedDay = isWeekend || isSpecial;

            const topRow = document.createElement('div');
            topRow.style.display = 'flex';
            topRow.style.justifyContent = 'space-between';
            topRow.style.alignItems = 'center';

            const numSpan = document.createElement('span');
            numSpan.textContent = day;
            numSpan.style.fontSize = '16px';
            numSpan.style.fontWeight = 'bold';
            
            if (isRedDay) {
                numSpan.style.color = '#d93025';
            } else {
                numSpan.style.color = '#202124';
            }

            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                numSpan.style.background = '#1a73e8';
                numSpan.style.color = 'white';
                numSpan.style.borderRadius = '50%';
                numSpan.style.width = '28px';
                numSpan.style.height = '28px';
                numSpan.style.display = 'flex';
                numSpan.style.alignItems = 'center';
                numSpan.style.justifyContent = 'center';
            }

            const lunarSpan = document.createElement('span');
            lunarSpan.textContent = getLunarOrFestival(dateKey, day);
            lunarSpan.style.fontSize = '12px';
            lunarSpan.style.color = isSpecial ? '#d93025' : '#5f6368';
            if (isSpecial) lunarSpan.style.fontWeight = 'bold';

            topRow.appendChild(numSpan);
            topRow.appendChild(lunarSpan);
            dayElement.appendChild(topRow);

            if (dateKey === selectedDateStr) {
                dayElement.style.background = '#e8f0fe';
                dayElement.style.border = '2px solid #1a73e8';
            }

            const eventContainer = document.createElement('div');
            eventContainer.style.marginTop = '4px';
            eventContainer.style.overflow = 'hidden';
            eventContainer.style.maxHeight = '45px';

            const dayEvents = eventsMap[dateKey] || [];
            dayEvents.forEach(item => {
                const badge = document.createElement('div');
                badge.textContent = item.title;
                badge.style.fontSize = '12px';
                badge.style.background = '#e8f4fd';
                badge.style.color = '#1967d2';
                badge.style.padding = '2px 5px';
                badge.style.borderRadius = '4px';
                badge.style.marginBottom = '2px';
                badge.style.whiteSpace = 'nowrap';
                badge.style.textOverflow = 'ellipsis';
                badge.style.overflow = 'hidden';
                badge.style.fontWeight = '500';
                eventContainer.appendChild(badge);
            });
            dayElement.appendChild(eventContainer);

            dayElement.addEventListener('click', () => {
                selectedDateStr = dateKey;
                generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
                renderDayEvents();
                closeAddEventModal();
            });

            calendarGrid.appendChild(dayElement);
        }

        const totalCells = calendarGrid.children.length - 7;
        const remainingCells = (totalCells > 28 ? 42 : 35) - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = document.createElement('div');
            dayElement.style.background = '#fff';
            dayElement.style.minHeight = '90px';
            dayElement.style.padding = '6px';
            dayElement.style.color = '#bdc1c6';
            dayElement.style.fontSize = '14px';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        }

        renderDayEvents();
    }

    currentCalendarState.generateFn = () => generateCalendar(currentDate.getFullYear(), currentDate.getMonth());

    function updateCalendar(direction) {
        if (direction === 'prev') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        currentCalendarState.generateFn();
    }

    currentCalendarState.generateFn();
    prevButton.onclick = () => updateCalendar('prev');
    nextButton.onclick = () => updateCalendar('next');
}

function renderDayEvents() {
    const titleEl = document.getElementById('selectedDateTitle');
    const listEl = document.getElementById('dayEventList');
    if (!titleEl || !listEl) return;

    const specialInfo = SPECIAL_DAYS_2026[selectedDateStr];
    const festivalText = specialInfo ? ` (✨ ${specialInfo.name} / ${specialInfo.lunar})` : '';
    titleEl.textContent = `📌 ${selectedDateStr}${festivalText} 行事曆`;
    titleEl.style.fontSize = '16px';

    const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};
    const dayEvents = eventsMap[selectedDateStr] || [];

    if (dayEvents.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; color: #888; padding: 15px 0; font-size: 14px;">這一天沒有安排任何行程</div>';
        return;
    }

    listEl.innerHTML = dayEvents.map((item, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 12px 14px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #1a73e8;">
            <div style="flex: 1;">
                <div style="font-weight: bold; color: #202124; font-size: 15px;">${item.title}</div>
                ${item.desc ? `<div style="font-size: 13px; color: #5f6368; margin-top: 3px;">${item.desc}</div>` : ''}
            </div>
            <button onclick="deleteEvent('${selectedDateStr}', ${index})" style="background: #d93025; color: white; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px;">刪除</button>
        </div>
    `).join('');
}

function openAddEventModal() {
    if (!selectedDateStr) {
        alert('請先點選一個日期！');
        return;
    }
    const formBox = document.getElementById('addEventFormBox');
    const formTitle = document.getElementById('formTitleDate');
    if (formBox) formBox.style.display = 'block';
    if (formTitle) formTitle.textContent = `新增【${selectedDateStr}】行程`;
    document.getElementById('eventTitleInput').value = '';
    document.getElementById('eventDescInput').value = '';
}

function closeAddEventModal() {
    const formBox = document.getElementById('addEventFormBox');
    if (formBox) formBox.style.display = 'none';
}

function saveNewEvent() {
    const title = document.getElementById('eventTitleInput').value.trim();
    const desc = document.getElementById('eventDescInput').value.trim();

    if (!title) {
        alert('請填寫行程標題！');
        return;
    }

    const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};
    if (!eventsMap[selectedDateStr]) {
        eventsMap[selectedDateStr] = [];
    }

    eventsMap[selectedDateStr].push({ title, desc });
    localStorage.setItem('vivi_calendar_events', JSON.stringify(eventsMap));

    closeAddEventModal();
    initCalendar();
    
    if (typeof showNotification === 'function') {
        showNotification('✅ 成功新增行程！');
    }
}

function deleteEvent(dateStr, index) {
    if (confirm('確定要刪除這個行程嗎？')) {
        const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};
        if (eventsMap[dateStr]) {
            eventsMap[dateStr].splice(index, 1);
            if (eventsMap[dateStr].length === 0) {
                delete eventsMap[dateStr];
            }
            localStorage.setItem('vivi_calendar_events', JSON.stringify(eventsMap));
            initCalendar();
            if (typeof showNotification === 'function') {
                showNotification('🗑️ 行程已刪除');
            }
        }
    }
}

// ================= .ics 檔案匯入解析函數 =================
function importIcsFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        try {
            const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};
            let count = 0;

            const blocks = text.split('BEGIN:VEVENT');
            for (let i = 1; i < blocks.length; i++) {
                const block = blocks[i];
                
                const dtStartMatch = block.match(/DTSTART(?:;[^:]*)?:([0-9]{8})(?:T[0-9]{6}Z?)?/);
                if (!dtStartMatch) continue;

                const rawDate = dtStartMatch[1];
                const year = rawDate.substring(0, 4);
                const month = rawDate.substring(4, 6);
                const day = rawDate.substring(6, 8);
                const dateKey = `${year}-${month}-${day}`;

                const summaryMatch = block.match(/SUMMARY(?:\?[^:]*)?:([^\r\n]+)/);
                let title = summaryMatch ? summaryMatch[1].trim() : '未命名行程';
                title = title.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

                const descMatch = block.match(/DESCRIPTION(?:\?[^:]*)?:([^\r\n]+)/);
                let desc = descMatch ? descMatch[1].trim() : '';
                desc = desc.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';');

                if (!eventsMap[dateKey]) {
                    eventsMap[dateKey] = [];
                }

                const exists = eventsMap[dateKey].some(item => item.title === title);
                if (!exists) {
                    eventsMap[dateKey].push({ title, desc });
                    count++;
                }
            }

            localStorage.setItem('vivi_calendar_events', JSON.stringify(eventsMap));
            initCalendar();

            alert(`🎉 成功匯入 ${count} 筆手機行事曆歷史行程！`);
            if (typeof showNotification === 'function') {
                showNotification(`🎉 成功匯入 ${count} 筆行程！`);
            }
        } catch (err) {
            console.error(err);
            alert('❌ 解析 .ics 檔案失敗，請確認檔案格式是否正確！');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ================= .ics 檔案匯出函數 =================
function exportIcsFile() {
    const eventsMap = JSON.parse(localStorage.getItem('vivi_calendar_events')) || {};
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Vivi AI Assistant//Calendar//ZH\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

    let totalEvents = 0;
    for (const dateKey in eventsMap) {
        const events = eventsMap[dateKey];
        if (!events || events.length === 0) continue;

        const dateFormatted = dateKey.replace(/-/g, '');

        events.forEach(ev => {
            totalEvents++;
            const uid = `vivi-${dateFormatted}-${totalEvents}@assistant.local`;
            const summary = ev.title || '未命名行程';
            const description = ev.desc ? ev.desc.replace(/\n/g, '\\n') : '';

            icsContent += "BEGIN:VEVENT\n";
            icsContent += `UID:${uid}\n`;
            icsContent += `DTSTAMP:${dateFormatted}T000000Z\n`;
            icsContent += `DTSTART;VALUE=DATE:${dateFormatted}\n`;
            icsContent += `SUMMARY:${summary}\n`;
            if (description) {
                icsContent += `DESCRIPTION:${description}\n`;
            }
            icsContent += "END:VEVENT\n";
        });
    }

    icsContent += "END:VCALENDAR";

    if (totalEvents === 0) {
        alert('⚠️ 目前沒有任何行程可以匯出！');
        return;
    }

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `Vivi_Calendar_Export_${new Date().toISOString().substring(0, 10)}.ics`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    if (typeof showNotification === 'function') {
        showNotification(`📤 成功匯出 ${totalEvents} 筆行程 (.ics)！`);
    } else {
        alert(`📤 成功匯出 ${totalEvents} 筆行程 (.ics)！`);
    }
}