// ================= Main Application Controller =================

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 更新底部導覽列按鈕狀態（支援 others, sub_calendar, sub_alarm）
    const tabButtons = document.querySelectorAll('.tabbar button');
    tabButtons.forEach(btn => btn.classList.remove('active'));

    if (pageId === 'home') tabButtons[0]?.classList.add('active');
    else if (pageId === 'chat') tabButtons[1]?.classList.add('active');
    else if (pageId === 'money' || pageId === 'history' || pageId === 'stats' || pageId === 'wealth') tabButtons[2]?.classList.add('active');
    else if (pageId === 'bike') tabButtons[3]?.classList.add('active');
    else if (pageId === 'others' || pageId === 'sub_calendar' || pageId === 'sub_alarm') tabButtons[4]?.classList.add('active');

    // 若切換到財務頁面，初始化財務模組
    if (pageId === 'money') {
        if (typeof initFinance === 'function') initFinance();
    }
    // 若切換到愛車頁面，初始化車輛與保養資訊
    else if (pageId === 'bike') {
        if (typeof initBikePage === 'function') initBikePage();
    }
    // 若切換到行事曆子頁面，初始化行事曆渲染
    else if (pageId === 'sub_calendar') {
        if (typeof initCalendar === 'function') initCalendar();
    }
    // 若切換到鬧鐘子頁面，初始化鬧鐘渲染
    else if (pageId === 'sub_alarm') {
        if (typeof renderAlarmSection === 'function') renderAlarmSection();
    }
}

// 點擊「其他」選單中的子項目跳轉
function openOtherSubPage(subType) {
    if (subType === 'calendar') {
        showPage('sub_calendar');
    } else if (subType === 'alarm') {
        showPage('sub_alarm');
    }
}

// 頂部通知提示訊息
function showNotification(message) {
    let notif = document.getElementById('viviNotificationToast');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'viviNotificationToast';
        notif.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85); color: #fff; padding: 10px 20px;
            border-radius: 20px; font-size: 14px; z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notif);
    }
    notif.textContent = message;
    notif.style.opacity = '1';

    setTimeout(() => {
        notif.style.opacity = '0';
    }, 2500);
}

// 訊息發送邏輯（首頁）
function sendMessage() {
    const userInput = document.getElementById('userInput');
    if (!userInput) return;
    const text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';

    if (typeof handleUserChat === 'function') {
        handleUserChat(text);
    }
}

// 聊天頁面發送訊息
function sendChatMessage() {
    const chatUserInput = document.getElementById('chatUserInput');
    if (!chatUserInput) return;
    const text = chatUserInput.value.trim();
    if (!text) return;

    if (typeof saveChatHistory === 'function') {
        saveChatHistory('user', text);
    }

    const chatContainer = document.querySelector('#chat .chat-container');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (chatContainer) {
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `
            <div class="message-body">
                <div class="bubble-row">
                    <div class="message-time">${timeStr}</div>
                    <div class="message-bubble">${text}</div>
                </div>
            </div>
        `;
        chatContainer.appendChild(userMessage);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    chatUserInput.value = '';

    if (typeof handleUserChat === 'function') {
        handleUserChat(text);
    }
}

function mountProfileQuickEditor() {
    const resetBtn = Array.from(document.querySelectorAll('#vivi-memory-debug-fab button, button'))
        .find(b => b.textContent && b.textContent.includes('重設基準'));
    const anchorParent = resetBtn ? resetBtn.parentElement : document.getElementById('vivi-memory-debug-fab');
    if (!anchorParent || document.getElementById('vivi-profile-quick-editor')) return;

    const profile = typeof getProfileMemory === 'function' ? (getProfileMemory() || {}) : {};
    const editor = document.createElement('div');
    editor.id = 'vivi-profile-quick-editor';
    editor.style.cssText = 'margin-top:10px;padding-top:10px;border-top:1px dashed #cbd5e1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;width:100%;';
    editor.innerHTML = `
        <input id="viviEditCity" type="text" placeholder="居住城市 (如: 台北)" value="${profile.city || ''}" style="width:96px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;">
        <input id="viviEditTransport" type="text" placeholder="交通 (如: 機車)" value="${profile.transportation || ''}" style="width:86px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;">
        <button id="viviSaveProfileBtn" type="button" style="padding:4px 10px;border-radius:6px;border:1px solid #0284c7;background:#0284c7;color:#fff;cursor:pointer;font-size:12px;">儲存檔案</button>
    `;

    if (resetBtn && resetBtn.parentElement) {
        resetBtn.parentElement.insertAdjacentElement('afterend', editor);
    } else {
        anchorParent.appendChild(editor);
    }

    document.getElementById('viviSaveProfileBtn')?.addEventListener('click', () => {
        if (typeof getProfileMemory !== 'function' || typeof saveProfileMemory !== 'function') return;
        const current = getProfileMemory() || {};
        const city = document.getElementById('viviEditCity')?.value.trim();
        const transportation = document.getElementById('viviEditTransport')?.value.trim();
        saveProfileMemory({
            ...current,
            ...(city ? { city } : {}),
            ...(transportation ? { transportation } : {})
        });
        document.querySelector('#vivi-memory-debug-fab [data-mem-act="refresh"]')?.click();
    });
}

function observeProfileQuickEditor() {
    mountProfileQuickEditor();
    if (window.__viviProfileEditorObserver) return;
    const observer = new MutationObserver(() => {
        mountProfileQuickEditor();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__viviProfileEditorObserver = observer;
}

// 頁面載入初始化
window.addEventListener('DOMContentLoaded', () => {
    if (typeof initMemoryModule === 'function' && !window.__viviMem) {
        try {
            window.__viviMem = initMemoryModule();
        } catch (err) {
            console.warn('記憶模組初始化略過或發生警告：', err);
        }
    }

    if (typeof mountMemoryDebugFab === 'function') {
        try {
            mountMemoryDebugFab();
        } catch (err) {
            console.warn('記憶除錯面板掛載略過或發生警告：', err);
        }
    }

    observeProfileQuickEditor();

    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                if (typeof sendMessage === 'function') sendMessage();
            }
        });
    }

    const chatUserInput = document.getElementById('chatUserInput');
    if (chatUserInput) {
        chatUserInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) {
                e.preventDefault();
                if (typeof sendChatMessage === 'function') sendChatMessage();
            }
        });
    }

    showPage('home');
    if (typeof initFinance === 'function') initFinance();
    if (typeof initBikePage === 'function') initBikePage();
    if (typeof initCalendar === 'function') initCalendar();
    if (typeof initChatModule === 'function') initChatModule();
});