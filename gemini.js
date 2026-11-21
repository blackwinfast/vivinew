// ================= Gemini AI & Prompt Module (v2.4.0-c.2 Safe IIFE) =================
(() => {
    const GEMINI_MODEL = (typeof window.GEMINI_MODEL === 'string' && window.GEMINI_MODEL)
        ? window.GEMINI_MODEL
        : "gemini-2.5-flash";

    const DEFAULT_AVATAR = (typeof window.DEFAULT_AVATAR === 'string' && window.DEFAULT_AVATAR)
        ? window.DEFAULT_AVATAR
        : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e9c4a8'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white'>👩🏻</text></svg>";

    let pendingWeatherType = null;
    const KNOWN_LOCATIONS = ['板橋', '土城', '新莊', '中和', '永和', '三重', '樹林', '台北', '臺北', '台中', '臺中', '高雄', '桃園', '新竹', '台南', '臺南', '宜蘭', '花蓮', '台東', '基隆', '苗栗', '彰化', '南投', '雲林', '嘉義', '屏東'];

    async function askGeminiAI(userPrompt) {
        const now = new Date();
        const cleanPrompt = String(userPrompt || '').trim();

        if (
            cleanPrompt.includes('現在幾點') ||
            cleanPrompt.includes('幾點了') ||
            cleanPrompt.includes('目前時間')
        ) {
            pendingWeatherType = null;
            return `目前時間是 ${now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}。`;
        }

        if (
            cleanPrompt.includes('今天幾號') ||
            cleanPrompt.includes('今天日期') ||
            cleanPrompt.includes('今天星期幾')
        ) {
            pendingWeatherType = null;
            return `今天是 ${now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}。`;
        }

        const matchedLocation = KNOWN_LOCATIONS.find(loc => cleanPrompt.includes(loc));
        const isDirectLocationReply = pendingWeatherType !== null && (matchedLocation || cleanPrompt.length <= 6);

        const isOutingQuery =
            cleanPrompt.includes('適合外出') ||
            cleanPrompt.includes('適合出門') ||
            cleanPrompt.includes('外出評分') ||
            cleanPrompt.includes('適合騎車') ||
            (isDirectLocationReply && pendingWeatherType === 'outing');

        if (isOutingQuery) {
            pendingWeatherType = null;
            if (typeof getOutingScore === 'function') {
                try {
                    const reply = await getOutingScore(cleanPrompt);
                    if (reply.includes('抓不到您的 GPS 定位')) {
                        pendingWeatherType = 'outing';
                        return reply;
                    }
                    if (!reply.includes('伺服器目前連線逾時') && !reply.includes('讀取失敗')) {
                        return reply;
                    }
                } catch (e) {
                    console.warn("內部外出評分 API 失敗，轉交 Gemini 備援...");
                }
            }
        }

        const is7DaysQuery =
            cleanPrompt.includes('一週天氣') ||
            cleanPrompt.includes('本週天氣') ||
            cleanPrompt.includes('一周天氣') ||
            cleanPrompt.includes('7天天氣') ||
            cleanPrompt.includes('七天天氣') ||
            (isDirectLocationReply && pendingWeatherType === '7days');

        if (is7DaysQuery) {
            pendingWeatherType = null;
            if (typeof getWeather7Days === 'function') {
                try {
                    const reply = await getWeather7Days(cleanPrompt);
                    if (reply.includes('抓不到您的 GPS 定位')) {
                        pendingWeatherType = '7days';
                        return reply;
                    }
                    if (!reply.includes('伺服器目前連線逾時') && !reply.includes('讀取失敗')) {
                        return reply;
                    }
                } catch (e) {
                    console.warn("內部一週天氣 API 失敗，轉交 Gemini 備援...");
                }
            }
        }

        const hourlyWeatherKeywords = [
            '小時預報',
            '逐時預報',
            '24小時',
            '每小時',
            '今天天氣',
            '天氣預報',
            '天氣預測',
            '氣象',
            '天氣',
            '氣溫',
            '會不會下雨'
        ];

        const is24HoursQuery =
            hourlyWeatherKeywords.some(keyword => cleanPrompt.includes(keyword)) ||
            (isDirectLocationReply && pendingWeatherType === '24hours');

        if (is24HoursQuery) {
            pendingWeatherType = null;
            if (typeof getWeather24Hours === 'function') {
                try {
                    const reply = await getWeather24Hours(cleanPrompt);
                    if (reply.includes('抓不到您的 GPS 定位')) {
                        pendingWeatherType = '24hours';
                        return reply;
                    }
                    if (!reply.includes('伺服器目前連線逾時') && !reply.includes('讀取失敗')) {
                        return reply;
                    }
                } catch (e) {
                    console.warn("內部 24 小時天氣 API 失敗，轉交 Gemini 備援...");
                }
            }
        }

        if (isDirectLocationReply && matchedLocation) {
            const targetType = pendingWeatherType || '24hours';
            pendingWeatherType = null;
            try {
                if (targetType === '7days' && typeof getWeather7Days === 'function') {
                    const reply = await getWeather7Days(cleanPrompt);
                    if (!reply.includes('伺服器目前連線逾時')) return reply;
                } else if (typeof getWeather24Hours === 'function') {
                    const reply = await getWeather24Hours(cleanPrompt);
                    if (!reply.includes('伺服器目前連線逾時')) return reply;
                }
            } catch (e) {
                console.warn("內部指定地區天氣 API 失敗，轉交 Gemini 備援...");
            }
        }

        pendingWeatherType = null;

        const apiKey = StorageService.get(STORAGE_KEYS.GEMINI_API_KEY, localStorage.getItem('vivi_gemini_api_key') || '');
        if (!apiKey) {
            return "內部氣象伺服器剛好在忙（連線逾時），您也尚未設定 Gemini API 喔！請點擊右上角設定填入您的 API Key 以啟用 AI 備援。";
        }

        const currentDateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        const currentTimeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const chatHistory = StorageService.get(STORAGE_KEYS.CHAT_HISTORY, JSON.parse(localStorage.getItem('viviChatHistory')) || []);
        const recentHistory = chatHistory.slice(-20);

        const contents = [
            {
                role: "user",
                parts: [{ text: `你現在是專屬的個人AI助理「薇薇」。

個性溫柔、精明能幹，熟悉記帳、行程、天氣、機車保養與生活助理相關事項。
（註：使用者剛剛詢問了氣象相關問題，但內部氣象 API 伺服器暫時逾時，請你以溫柔的口吻，根據目前系統時間與常識，提供一份實用的天氣與外出建議給使用者。）

目前系統時間：
${currentDateStr} ${currentTimeStr}

請用繁體中文回覆。

重要規則：
1. 不要在開頭加入 👩🏻、🤖 等表情符號。
2. 不要在開頭加入「薇薇：」。
3. 不要加入「主人您好」、「主子您好」、「報告主人」等固定開場白。
4. 直接回答問題即可。
5. 回答自然、簡潔即可。` }]
            },
            {
                role: "model",
                parts: [{ text: "好的，隨時準備好協助您！" }]
            }
        ];

        recentHistory.forEach(item => {
            let msgText = item.message;
            if (typeof msgText === 'object' && msgText !== null) {
                msgText = msgText.text || msgText.content || JSON.stringify(msgText);
            }
            contents.push({
                role: item.sender === 'user' ? 'user' : 'model',
                parts: [{ text: String(msgText || '') }]
            });
        });

        contents.push({
            role: "user",
            parts: [{ text: userPrompt }]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
        const requestBody = { contents: contents };

        let lastError = null;

        for (let retry = 0; retry < 3; retry++) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (!data.error) {
                    const rawText = data.candidates && data.candidates[0]?.content?.parts?.[0]?.text;
                    if (rawText) {
                        return typeof rawText === 'string' ? rawText : JSON.stringify(rawText);
                    }
                    return "我剛剛思考了一下沒抓到重點，請再說一次！";
                }

                lastError = data.error;
                const msg = data.error.message || '';
                const isHighDemand = data.error.code === 503 ||
                                     msg.includes('high demand') ||
                                     data.error.status === 'UNAVAILABLE';

                if (!isHighDemand) break;

                if (retry < 2) {
                    await new Promise(r => setTimeout(r, 3000));
                }
            } catch (error) {
                lastError = { message: "網路連線失敗了，請檢查一下網路狀況喔！" };
                if (retry < 2) {
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
        }

        if (lastError) {
            const msg = lastError.message || '';
            if (msg.includes('no longer available') || msg.includes('not found')) {
                return '目前設定的 Gemini 模型已停止支援，請更新模型設定。';
            }
            if (lastError.code === 503 || msg.includes('high demand') || lastError.status === 'UNAVAILABLE') {
                return 'Google 目前人太多啦🥺，已經自動重試 3 次還是塞車，請 10 秒後再試一次。';
            }
            return msg;
        }

        return "連線遇到未知狀況，請稍後再試一次！";
    }

    let _viviGeminiMemoryAdapter = null;

function invalidateViviGeminiMemoryAdapter() {
    _viviGeminiMemoryAdapter = null;
}

function getViviGeminiMemoryAdapter() {
    if (_viviGeminiMemoryAdapter) return _viviGeminiMemoryAdapter;
    if (typeof createMemoryChatAdapter !== 'function') return null;

    const profileSummary =
        (typeof MemoryService !== 'undefined' &&
            typeof MemoryService.buildProfileMemorySummary === 'function')
            ? MemoryService.buildProfileMemorySummary()
            : (typeof buildProfileMemorySummary === 'function'
                ? buildProfileMemorySummary()
                : '');

    const eventSummary =
        (typeof MemoryService !== 'undefined' &&
            typeof MemoryService.buildEventMemorySummary === 'function')
            ? MemoryService.buildEventMemorySummary()
            : (typeof buildEventMemorySummary === 'function'
                ? buildEventMemorySummary()
                : '');

    const favoriteSummary =
        (typeof MemoryService !== 'undefined' &&
            typeof MemoryService.buildFavoriteMemorySummary === 'function')
            ? MemoryService.buildFavoriteMemorySummary()
            : (typeof buildFavoriteMemorySummary === 'function'
                ? buildFavoriteMemorySummary()
                : '');

    const memoryRules = `
【記憶優先規則】

使用者收藏記憶（Favorite Memory）為最高優先級正式資料。

若聊天歷史、短期記憶、活躍記憶、
個人檔案記憶與收藏記憶發生衝突：

一律以收藏記憶為準。

不得使用聊天歷史中的舊資訊覆蓋收藏記憶。

當使用者詢問：
- 最喜歡什麼顏色
- 最喜歡什麼食物
- 最喜歡什麼飲料
- 收藏內容是什麼
- 我的喜好是什麼

應優先查閱「使用者收藏記憶」。

如果收藏記憶已有明確答案，
不得採用聊天歷史中的衝突資訊。

例如：

收藏記憶：
最喜歡的顏色 = 藍色

即使聊天歷史中出現：
我最喜歡紅色

回答時仍應以收藏記憶為準。
`;

    const memoryContext = [
        memoryRules,
        profileSummary
            ? `=== 使用者個人檔案 ===\n${profileSummary}`
            : '',
        eventSummary
            ? `=== 使用者事件記憶 ===\n${eventSummary}`
            : '',
        favoriteSummary
            ? `=== 使用者收藏記憶（最高優先級）===\n${favoriteSummary}`
            : ''
    ]
        .filter(Boolean)
        .join('\n\n');

    console.log('[Memory Context]', memoryContext);

    const baseSystemPrompt = [
        '你現在是專屬的個人AI助理「薇薇」。',
        '個性溫柔、精明能幹，熟悉記帳、行程、天氣、機車保養與生活助理相關事項。',
        '請用繁體中文回覆，回答自然、簡潔，不要在開頭加 👩🏻、🤖、「薇薇：」或固定稱呼。',
        memoryContext
    ]
        .filter(Boolean)
        .join('\n\n');

    _viviGeminiMemoryAdapter = createMemoryChatAdapter({
        baseSystemPrompt,
        timeoutMs: 25000,
        fallbackReply: '連線遇到未知狀況，請稍後再試一次！',

        llmRunner: async ({ systemPrompt, userMessage }) => {
            const apiKey = StorageService.get(
                STORAGE_KEYS.GEMINI_API_KEY,
                localStorage.getItem('vivi_gemini_api_key') || ''
            );

            if (!apiKey) {
                return '尚未設定 Gemini API Key 喔！請點擊右上角設定填入您的 API Key。';
            }

            const now = new Date();

            const currentDateStr = now.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });

            const currentTimeStr = now.toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            const fullPrompt =
                `${systemPrompt}\n\n目前系統時間：${currentDateStr} ${currentTimeStr}`;

            console.log('[Prompt]', fullPrompt);

            const contents = [
                {
                    role: 'user',
                    parts: [{ text: fullPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: '好的，隨時準備好協助您！' }]
                },
                {
                    role: 'user',
                    parts: [{ text: userMessage }]
                }
            ];

            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contents })
            });

            const data = await res.json();

            const rawText =
                data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (rawText) {
                return typeof rawText === 'string'
                    ? rawText
                    : JSON.stringify(rawText);
            }

            throw new Error(
                data?.error?.message || 'Gemini 回應為空'
            );
        }
    });

    return _viviGeminiMemoryAdapter;
}

    async function askGeminiAIWithMemory(userPrompt) {
        const cleanPrompt = String(userPrompt || '').trim();
        if (!cleanPrompt) return '';

        const lowerOrExactTime =
            cleanPrompt.includes('現在幾點') || cleanPrompt.includes('幾點了') || cleanPrompt.includes('目前時間') ||
            cleanPrompt.includes('今天幾號') || cleanPrompt.includes('今天日期') || cleanPrompt.includes('今天星期幾') ||
            cleanPrompt.includes('適合外出') || cleanPrompt.includes('適合出門') || cleanPrompt.includes('外出評分') || cleanPrompt.includes('適合騎車') ||
            cleanPrompt.includes('一週天氣') || cleanPrompt.includes('本週天氣') || cleanPrompt.includes('一周天氣') || cleanPrompt.includes('7天天氣') || cleanPrompt.includes('七天天氣') ||
            cleanPrompt.includes('小時預報') || cleanPrompt.includes('逐時預報') || cleanPrompt.includes('24小時') || cleanPrompt.includes('每小時') ||
            cleanPrompt.includes('今天天氣') || cleanPrompt.includes('天氣預報') || cleanPrompt.includes('天氣預測') || cleanPrompt.includes('氣象') ||
            cleanPrompt.includes('天氣') || cleanPrompt.includes('氣溫') || cleanPrompt.includes('會不會下雨');

        if (lowerOrExactTime || (typeof askGeminiAI === 'function' && pendingWeatherType !== null)) {
            return await askGeminiAI(cleanPrompt);
        }

        const adapter = getViviGeminiMemoryAdapter();
        if (adapter) {
            const turn = await adapter.sendMessage(cleanPrompt);
            if (turn && typeof turn.reply === 'string' && turn.reply) {
                return turn.reply;
            }
        }

        return await askGeminiAI(cleanPrompt);
    }

    window.GEMINI_MODEL = GEMINI_MODEL;
    window.DEFAULT_AVATAR = DEFAULT_AVATAR;
    window.askGeminiAI = askGeminiAI;
    window.getViviGeminiMemoryAdapter = getViviGeminiMemoryAdapter;
    window.invalidateViviGeminiMemoryAdapter = invalidateViviGeminiMemoryAdapter;
    window.askGeminiAIWithMemory = askGeminiAIWithMemory;
})();