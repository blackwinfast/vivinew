// ================= Chat & Message Module =================

let isChatHistoryLoaded = false;

function _viviTryAutoCreateEvent(text) {
    try {
        if (typeof autoCreateEventFromText === 'function') {
            const createdEvent = autoCreateEventFromText(text);
            if (createdEvent) {
                console.log('🧠 Event Created:', createdEvent);
                _viviRefreshMemoryDebugPanel();
            }
        }
    } catch (err) {
        console.error('Event Auto Create Error', err);
    }
}

function saveChatHistory(sender, message) {
    if (typeof message !== 'string') {
        message = typeof message === 'object' && message !== null ? (message.text || JSON.stringify(message)) : String(message || '');
    }

    // 雙軌讀取：優先從新 Storage 拿，沒有則退回舊 Key
    const chatHistory = StorageService.get(STORAGE_KEYS.CHAT_HISTORY, JSON.parse(localStorage.getItem('viviChatHistory')) || []);
    const now = new Date();
    const timestamp = now.toISOString();
    
    chatHistory.push({
        sender: sender,
        message: message,
        timestamp: timestamp
    });
    
    // v1.1 擴容：保存最新 5000 筆對話紀錄，確保長期記憶不輕易遺失
    if (chatHistory.length > 5000) {
        chatHistory.shift();
    }
    
    // 雙寫入：同時寫入新架構與舊 Key
    StorageService.set(STORAGE_KEYS.CHAT_HISTORY, chatHistory);
    localStorage.setItem('viviChatHistory', JSON.stringify(chatHistory));
}

function loadChatHistory() {
    if (isChatHistoryLoaded) {
        return;
    }
    isChatHistoryLoaded = true;

    // 雙軌讀取
    const chatHistory = StorageService.get(STORAGE_KEYS.CHAT_HISTORY, JSON.parse(localStorage.getItem('viviChatHistory')) || []);
    const chatContainer = document.querySelector('#chat .chat-container');
    
    if (!chatContainer || chatHistory.length === 0) {
        return;
    }
    
    const recentHistory = chatHistory.slice(-20);
    
    recentHistory.forEach(item => {
        const isUser = item.sender === 'user';
        const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let rawMsg = item.message;
        if (typeof rawMsg !== 'string') {
            rawMsg = typeof rawMsg === 'object' && rawMsg !== null ? (rawMsg.text || JSON.stringify(rawMsg)) : String(rawMsg || '');
        }

        if (isUser) {
            const userMessage = document.createElement('div');
            userMessage.className = 'chat-message user';
            userMessage.innerHTML = `
                <div class="message-body">
                    <div class="bubble-row">
                        <div class="message-time">${timeStr}</div>
                        <div class="message-bubble">${rawMsg}</div>
                    </div>
                </div>
            `;
            chatContainer.appendChild(userMessage);
        } else {
            const assistantName = StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
            const assistantAvatar = StorageService.get(STORAGE_KEYS.ASSISTANT_AVATAR, localStorage.getItem('assistantAvatar') || DEFAULT_AVATAR);
            
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message';
            aiMessage.innerHTML = `
                <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
                <div class="message-body">
                    <div class="sender-name">${assistantName}</div>
                    <div class="bubble-row">
                        <div class="message-bubble" style="white-space: pre-line;">${rawMsg}</div>
                        <div class="message-time">${timeStr}</div>
                    </div>
                </div>
            `;
            chatContainer.appendChild(aiMessage);
        }
    });
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function restoreLastMessage() {
    // 雙軌讀取
    const chatHistory = StorageService.get(STORAGE_KEYS.CHAT_HISTORY, JSON.parse(localStorage.getItem('viviChatHistory')) || []);
    const assistantMessages = chatHistory.filter(item => item.sender === 'assistant');
    
    if (!assistantMessages.length) return;
    
    const last = assistantMessages[assistantMessages.length - 1];
    const lastMessage = document.getElementById('lastMessage');
    const lastTime = document.getElementById('lastTime');
    
    if (lastMessage) {
        let rawMessage = last.message;
        if (typeof rawMessage === 'object' && rawMessage !== null) {
            rawMessage = rawMessage.text || rawMessage.content || JSON.stringify(rawMessage);
        }
        const safeText = typeof rawMessage === 'string' ? rawMessage : String(rawMessage || '');

        let fullText = safeText.replace(/^薇薇[:：]/, '');
        const lines = fullText.split('\n');
        if (lines.length > 15) {
            fullText = lines.slice(0, 15).join('\n') + '\n\n……請到【聊聊】查看完整內容';
        }
        let compressedText = fullText.replace(/\n{2,}/g, '\n');
        lastMessage.innerHTML = compressedText.replace(/\n/g, '<br>');
    }
    if (lastTime) {
        lastTime.textContent = new Date(last.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput ? userInput.value.trim() : '';

    if (message) {
        const assistantName = StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
        const assistantAvatar = StorageService.get(STORAGE_KEYS.ASSISTANT_AVATAR, localStorage.getItem('assistantAvatar') || DEFAULT_AVATAR);
        const chatContainer = document.querySelector('#chat .chat-container');
        if (!chatContainer) return;

        saveChatHistory('user', message);
        _viviAutoSyncProfileFromText(message);
        _viviTryAutoCreateEvent(message);

        const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `
            <div class="message-body">
                <div class="bubble-row">
                    <div class="message-time">${timeStr}</div>
                    <div class="message-bubble">${message}</div>
                </div>
            </div>
        `;
        chatContainer.appendChild(userMessage);

        userInput.value = '';

        // 呼叫 finance.js 中的智慧記帳攔截器（確保寫入 pandaTransactions）
        if (typeof parseAndRecordFromChat === 'function') {
            const recordReply = parseAndRecordFromChat(message);
            if (recordReply !== null) {
                const replyText = recordReply;
                const replyTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                saveChatHistory('assistant', replyText);

                const aiMessage = document.createElement('div');
                aiMessage.className = 'chat-message';
                aiMessage.innerHTML = `
                    <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
                    <div class="message-body">
                        <div class="sender-name">${assistantName}</div>
                        <div class="bubble-row">
                            <div class="message-bubble" style="white-space: pre-line;">${replyText}</div>
                            <div class="message-time">${replyTime}</div>
                        </div>
                    </div>
                `;
                chatContainer.appendChild(aiMessage);

                const lastMessage = document.getElementById('lastMessage');
                const lastTime = document.getElementById('lastTime');
                if (lastMessage && lastTime) {
                    let fullText = replyText.replace(/^薇薇[:：]/, '');
                    const lines = fullText.split('\n');
                    if (lines.length > 15) {
                        fullText = lines.slice(0, 15).join('\n') + '\n\n⋯⋯請到【聊聊】查看完整內容';
                    }
                    lastMessage.innerHTML = fullText.replace(/\n/g, '<br>');
                    lastTime.textContent = replyTime;
                }

                chatContainer.scrollTop = chatContainer.scrollHeight;
                return;
            }
        }

        const aiRunner = typeof askGeminiAIWithMemory === 'function' ? askGeminiAIWithMemory : askGeminiAI;
        aiRunner(message).then(replyText => {
            if (typeof replyText !== 'string') {
                replyText = typeof replyText === 'object' && replyText !== null ? (replyText.text || JSON.stringify(replyText)) : String(replyText || '');
            }

            const replyTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            saveChatHistory('assistant', replyText);
            
            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message';
            aiMessage.innerHTML = `
                <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
                <div class="message-body">
                    <div class="sender-name">${assistantName}</div>
                    <div class="bubble-row">
                        <div class="message-bubble" style="white-space: pre-line;">${replyText}</div>
                        <div class="message-time">${replyTime}</div>
                    </div>
                </div>
            `;
            chatContainer.appendChild(aiMessage);

            const lastMessage = document.getElementById('lastMessage');
            const lastTime = document.getElementById('lastTime');
            if (lastMessage && lastTime) {
                const safeText = typeof replyText === 'string' ? replyText : String(replyText || '');
                let fullText = safeText.replace(/^薇薇[:：]/, '');
                const lines = fullText.split('\n');
                if (lines.length > 15) {
                    fullText = lines.slice(0, 15).join('\n') + '\n\n⋯⋯請到【聊聊】查看完整內容';
                }
                let compressedText = fullText.replace(/\n{2,}/g, '\n');
                lastMessage.innerHTML = compressedText.replace(/\n/g, '<br>');
                lastTime.textContent = replyTime;
            }

            _viviRefreshMemoryDebugPanel();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

function sendChatMessage() {
    const userInput = document.getElementById('chatUserInput');
    const message = userInput ? userInput.value.trim() : '';

    if (message) {
        const assistantName = StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
        const assistantAvatar = StorageService.get(STORAGE_KEYS.ASSISTANT_AVATAR, localStorage.getItem('assistantAvatar') || DEFAULT_AVATAR);
        const chatContainer = document.querySelector('#chat .chat-container');
        if (!chatContainer) return;

        saveChatHistory('user', message);
        _viviAutoSyncProfileFromText(message);
        _viviTryAutoCreateEvent(message);

        const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.innerHTML = `
            <div class="message-body">
                <div class="bubble-row">
                    <div class="message-time">${timeStr}</div>
                    <div class="message-bubble">${message}</div>
                </div>
            </div>
        `;
        chatContainer.appendChild(userMessage);
        userInput.value = '';
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 呼叫 finance.js 中的智慧記帳攔截器（確保寫入 pandaTransactions）
        if (typeof parseAndRecordFromChat === 'function') {
            const recordReply = parseAndRecordFromChat(message);
            if (recordReply !== null) {
                const replyText = recordReply;
                const replyTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                saveChatHistory('assistant', replyText);

                const aiMessage = document.createElement('div');
                aiMessage.className = 'chat-message';
                aiMessage.innerHTML = `
                    <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
                    <div class="message-body">
                        <div class="sender-name">${assistantName}</div>
                        <div class="bubble-row">
                            <div class="message-bubble" style="white-space: pre-line;">${replyText}</div>
                            <div class="message-time">${replyTime}</div>
                        </div>
                    </div>
                `;
                
                chatContainer.appendChild(aiMessage);

                const lastMessage = document.getElementById('lastMessage') || document.querySelector('.home-message-card .message-text');
                const lastTime = document.getElementById('lastTime') || document.querySelector('.home-message-card .message-time');
                if (lastMessage && lastTime) {
                    let fullText = replyText.replace(/^薇薇[:：]/, '');
                    const lines = fullText.split('\n');
                    if (lines.length > 15) {
                        fullText = lines.slice(0, 15).join('\n') + '\n\n……請到【聊聊】查看完整內容';
                    }
                    let compressedText = fullText.replace(/\n{2,}/g, '\n');
                    lastMessage.innerHTML = compressedText.replace(/\n/g, '<br>');
                    lastTime.textContent = replyTime;
                }

                chatContainer.scrollTop = chatContainer.scrollHeight;
                return;
            }
        }

        const aiRunner = typeof askGeminiAIWithMemory === 'function' ? askGeminiAIWithMemory : askGeminiAI;
        aiRunner(message).then(replyText => {
            if (typeof replyText !== 'string') {
                replyText = typeof replyText === 'object' && replyText !== null ? (replyText.text || JSON.stringify(replyText)) : String(replyText || '');
            }

            const replyTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            saveChatHistory('assistant', replyText);

            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message';
            aiMessage.innerHTML = `
                <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
                <div class="message-body">
                    <div class="sender-name">${assistantName}</div>
                    <div class="bubble-row">
                        <div class="message-bubble" style="white-space: pre-line;">${replyText}</div>
                        <div class="message-time">${replyTime}</div>
                    </div>
                </div>
            `;
            
            chatContainer.appendChild(aiMessage);

            const lastMessage = document.getElementById('lastMessage') || document.querySelector('.home-message-card .message-text');
            const lastTime = document.getElementById('lastTime') || document.querySelector('.home-message-card .message-time');
            if (lastMessage && lastTime) {
                const safeText = typeof replyText === 'string' ? replyText : String(replyText || '');
                let fullText = safeText.replace(/^薇薇[:：]/, '');
                const lines = fullText.split('\n');
                if (lines.length > 15) {
                    fullText = lines.slice(0, 15).join('\n') + '\n\n……請到【聊聊】查看完整內容';
                }
                let compressedText = fullText.replace(/\n{2,}/g, '\n');
                lastMessage.innerHTML = compressedText.replace(/\n/g, '<br>');
                lastTime.textContent = replyTime;
            }

            _viviRefreshMemoryDebugPanel();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        });
    }
}

// ================= Memory-Aware Chat Bridge (v2.3.2-B) =================
function _viviRefreshMemoryDebugPanel() {
    const refreshBtn =
        document.querySelector('#vivi-memory-debug-fab [data-mem-act="refresh"]') ||
        document.querySelector('[data-mem-act="refresh"]');
    if (refreshBtn && typeof refreshBtn.click === 'function') {
        try {
            refreshBtn.click();
            return;
        } catch (_) {}
    }

    if (typeof renderMemoryPanel === 'function') {
        try { renderMemoryPanel(); } catch (_) {}
    } else if (typeof runMemoryPanelAction === 'function') {
        try { runMemoryPanelAction('refresh'); } catch (_) {}
    }
}

function _viviAutoSyncProfileFromText(text) {

    if (typeof getProfileMemory !== 'function' ||
        typeof saveProfileMemory !== 'function') {
        return false;
    }

    const current = getProfileMemory() || {};
    let changed = false;

    const next = {
        ...current
    };

    // ================= 城市 =================

    const cityMatch =
        text.match(
            /(?:我|現在|目前)?(?:搬到|住在|住)\s*([一-龥]{2,10}(?:市|縣|區|街|路|巷)?)/);

    if (cityMatch && cityMatch[1]) {

        const rawPlace =
            cityMatch[1].replace(/了$/, '');

        if (rawPlace &&
            rawPlace !== next.city) {

            next.city = rawPlace;
            changed = true;
        }
    }

    // ================= 交通工具 =================

    const transportMatch =
        text.match(
            /(?:我)?(?:改)?(?:騎|開|搭)\s*(機車|汽車|開車|腳踏車|單車|捷運|公車|高鐵|火車)/
        );

    if (transportMatch && transportMatch[1]) {

        const rawTransport =
            transportMatch[1] === '開車'
                ? '汽車'
                : transportMatch[1];

        if (rawTransport !== next.transportation) {

            next.transportation = rawTransport;
            changed = true;
        }
    }

    // ==================================================
    // 收藏記憶同步：最喜歡的顏色
    // ==================================================

    const colorMatch =
        text.match(
            /我(?:現在)?(?:最)?喜歡(紅色|藍色|綠色|黃色|黑色|白色|紫色|橘色|粉紅色|粉色|灰色)/
        );

    if (colorMatch && colorMatch[1]) {

        const favoriteColor =
            colorMatch[1];

        try {

            const favorites =
                typeof getFavorites === 'function'
                    ? getFavorites()
                    : [];

            const colorFavorite =
                favorites.find(item =>
                    item &&
                    item.title &&
                    item.title.includes('最喜歡的顏色')
                );

            if (colorFavorite &&
                typeof updateFavoriteMemory === 'function') {

                updateFavoriteMemory(
                    colorFavorite.id,
                    {
                        content: favoriteColor
                    }
                );

                console.log(
                    '🎨 Favorite Color Updated:',
                    favoriteColor
                );

            }
            else if (
                typeof addFavoriteMemory === 'function'
            ) {

                addFavoriteMemory({
                    title: '最喜歡的顏色',
                    content: favoriteColor,
                    tags: ['喜好']
                });

                console.log(
                    '🎨 Favorite Color Created:',
                    favoriteColor
                );
            }

            if (
                typeof invalidateViviGeminiMemoryAdapter ===
                'function'
            ) {

                invalidateViviGeminiMemoryAdapter();
            }

        } catch (err) {

            console.error(
                'Favorite Color Sync Error',
                err
            );
        }
    }

    // ================= 儲存 =================

    if (changed) {

        saveProfileMemory(next);

        const cityInput =
            document.getElementById(
                'viviEditCity'
            );

        const transportInput =
            document.getElementById(
                'viviEditTransport'
            );

        if (cityInput &&
            next.city) {
            cityInput.value =
                next.city;
        }

        if (
            transportInput &&
            next.transportation
        ) {

            transportInput.value =
                next.transportation;
        }

        _viviRefreshMemoryDebugPanel();
    }

    return changed;
}

function _viviAppendUserBubble(message, chatContainer) {
    if (!chatContainer) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.innerHTML = `
        <div class="message-body">
            <div class="bubble-row">
                <div class="message-time">${timeStr}</div>
                <div class="message-bubble">${message}</div>
            </div>
        </div>
    `;
    chatContainer.appendChild(userMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function _viviGenerateChatReply(message) {
    if (typeof parseAndRecordFromChat === 'function') {
        const recordReply = parseAndRecordFromChat(message);
        if (recordReply !== null && typeof recordReply !== 'undefined') {
            return recordReply;
        }
    }

    if (typeof askGeminiAIWithMemory === 'function') {
        return await askGeminiAIWithMemory(message);
    }

    if (typeof askGeminiAI === 'function') {
        return await askGeminiAI(message);
    }

    return '目前尚未載入 AI 回應模組，請稍後再試。';
}

function _viviAppendAssistantReply(replyText, assistantName, assistantAvatar, chatContainer) {
    const safeReply = typeof replyText === 'string'
        ? replyText
        : (replyText && typeof replyText === 'object'
            ? (replyText.text || replyText.content || JSON.stringify(replyText))
            : String(replyText || ''));

    const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    saveChatHistory('assistant', safeReply);

    if (chatContainer) {
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message';
        aiMessage.innerHTML = `
            <img class="avatar assistant-avatar-img" src="${assistantAvatar}" alt="頭像">
            <div class="message-body">
                <div class="sender-name">${assistantName}</div>
                <div class="bubble-row">
                    <div class="message-bubble" style="white-space: pre-line;">${safeReply}</div>
                    <div class="message-time">${replyTime}</div>
                </div>
            </div>
        `;
        chatContainer.appendChild(aiMessage);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    const lastMessage = document.getElementById('lastMessage') || document.querySelector('.home-message-card .message-text');
    const lastTime = document.getElementById('lastTime') || document.querySelector('.home-message-card .message-time');
    if (lastMessage && lastTime) {
        let fullText = safeReply.replace(/^薇薇[:：]/, '');
        const lines = fullText.split('\n');
        if (lines.length > 15) {
            fullText = lines.slice(0, 15).join('\n') + '\n\n……請到【聊聊】查看完整內容';
        }
        const compressedText = fullText.replace(/\n{2,}/g, '\n');
        lastMessage.innerHTML = compressedText.replace(/\n/g, '<br>');
        lastTime.textContent = replyTime;
    }

    _viviRefreshMemoryDebugPanel();

    return safeReply;
}

async function handleUserChat(text) {
    const cleanText = String(text || '').trim();
    if (!cleanText) return '';

    const assistantName = StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
    const assistantAvatar = StorageService.get(STORAGE_KEYS.ASSISTANT_AVATAR, localStorage.getItem('assistantAvatar') || DEFAULT_AVATAR);
    const chatContainer = document.querySelector('#chat .chat-container');

    if (typeof saveChatHistory === 'function') {
        saveChatHistory('user', cleanText);
    }
    _viviAutoSyncProfileFromText(cleanText);
    _viviTryAutoCreateEvent(cleanText);
    _viviAppendUserBubble(cleanText, chatContainer);
    _viviRefreshMemoryDebugPanel();

    const replyText = await _viviGenerateChatReply(cleanText);
    return _viviAppendAssistantReply(replyText, assistantName, assistantAvatar, chatContainer);
}

function initChatModule() {
    if (typeof loadChatHistory === 'function') {
        loadChatHistory();
    }
    if (typeof restoreLastMessage === 'function') {
        restoreLastMessage();
    }
}