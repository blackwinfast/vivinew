// ================= Settings & Backup Module =================

function ensureSettingsCardStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('vivi-settings-card-styles')) return;

    const style = document.createElement('style');
    style.id = 'vivi-settings-card-styles';
    style.textContent = `
        .settings-panel {
            background: #f5ede4;
        }
        .settings-header {
            background: #fbf7f2;
            border-bottom: 1px solid #e6d7c8;
        }
        .vivi-set-wrap {
            max-width: 960px;
            margin: 0 auto;
        }
        .vivi-set-card {
            background: #fcf9f5;
            border: 1px solid #e6d7c8;
            border-radius: 14px;
            padding: 14px 16px;
            margin-bottom: 12px;
            box-shadow: 0 3px 10px rgba(120, 82, 46, 0.06);
        }
        .vivi-set-card-danger {
            background: #fff8f7;
            border: 1px solid #f0c4c0;
        }
        .vivi-set-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            user-select: none;
        }
        .vivi-set-card-title {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: #3b2d22;
        }
        .vivi-set-card-title-danger {
            color: #b83227;
        }
        .vivi-set-toggle-btn {
            padding: 5px 12px;
            border-radius: 999px;
            border: 1px solid #dcc7b2;
            background: #f3e7da;
            color: #4d3826;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease;
        }
        .vivi-set-toggle-btn:hover {
            background: #e9d7c3;
            border-color: #c9a787;
        }
        .vivi-set-toggle-btn-danger {
            border-color: #e8b4ae;
            background: #fdeceb;
            color: #b83227;
        }
        .vivi-set-toggle-btn-danger:hover {
            background: #fad9d6;
        }
        .vivi-set-card-body {
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px dashed #e6d7c8;
        }
        .vivi-set-sub-field {
            margin-bottom: 12px;
        }
        .vivi-set-sub-field:last-child {
            margin-bottom: 0;
        }
        .vivi-set-hint {
            font-size: 11px;
            color: #7c6958;
            margin-top: 4px;
        }
        .vivi-set-input {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #dcc7b2;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
            margin-top: 4px;
            background: #ffffff;
            color: #3b2d22;
        }
        .vivi-set-input:focus {
            outline: none;
            border-color: #c68652;
        }
        .vivi-set-save-row {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
        }
        .vivi-set-save-btn {
            width: auto !important;
            min-width: 160px;
            padding: 10px 24px !important;
            border-radius: 10px !important;
            background: #c68652 !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            border: none !important;
            cursor: pointer;
            box-shadow: 0 3px 8px rgba(198, 134, 82, 0.28);
        }
        .vivi-set-save-btn:hover {
            background: #b27341 !important;
        }
    `;
    document.head.appendChild(style);
}

function toggleSettingsSection(sectionId, headEl) {
    const box = document.getElementById(sectionId);
    if (!box) return;
    const isHidden = box.style.display === 'none' || box.style.display === '';
    box.style.display = isHidden ? 'block' : 'none';
    const labelBtn = headEl && typeof headEl.querySelector === 'function'
        ? headEl.querySelector('[data-toggle-label]')
        : null;
    if (labelBtn) {
        labelBtn.textContent = isHidden ? '收合 ▲' : '展開 ▼';
    }
}

function showSettings() {
    ensureSettingsCardStyles();

    let existingPanel = document.querySelector('.settings-panel');
    if (existingPanel) existingPanel.remove();

    const savedApiKey = StorageService.get(STORAGE_KEYS.GEMINI_API_KEY, localStorage.getItem('vivi_gemini_api_key') || '');
    const savedWeatherKey = StorageService.get(STORAGE_KEYS.WEATHER_API_KEY, localStorage.getItem('vivi_weather_api_key') || '');
    const savedName = StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
    const savedGreeting = StorageService.get(STORAGE_KEYS.GREETING_MESSAGE, localStorage.getItem('greetingMessage') || '你好，我是秘書，很高興為您服務。');

    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
        <div class="settings-header">
            <h3>設定</h3>
            <button class="close-button" onclick="closeSettings()">×</button>
        </div>
        <div class="settings-content" style="background: #f5ede4;">
            <div class="vivi-set-wrap">
                <!-- 1. 秘書與首頁外觀（預設收合） -->
                <div class="vivi-set-card">
                    <div class="vivi-set-card-head" onclick="toggleSettingsSection('profileSectionBody', this)">
                        <h4 class="vivi-set-card-title">👤 秘書與首頁外觀</h4>
                        <button type="button" class="vivi-set-toggle-btn" data-toggle-label onclick="event.stopPropagation(); toggleSettingsSection('profileSectionBody', this.parentElement)">展開 ▼</button>
                    </div>
                    <div id="profileSectionBody" class="vivi-set-card-body" style="display: none;">
                        <div class="setting-item" style="margin-top: 0;">
                            <label>秘書名稱：</label>
                            <input type="text" id="assistantName" class="vivi-set-input" value="${savedName}" placeholder="輸入秘書名稱">
                        </div>
                        <div class="setting-item">
                            <label>秘書聊天頭像：</label>
                            <div class="photo-preview" id="avatarPreview" style="height: 110px;">
                                <img id="previewAvatarImg" src="" alt="頭像預覽" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: none;">
                                <div id="avatarPlaceholder">👩🏻 點擊下方按鈕上傳頭像</div>
                            </div>
                            <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                            <button class="upload-button" onclick="document.getElementById('avatarUpload').click()">選擇秘書頭像</button>
                        </div>
                        <div class="setting-item">
                            <label>初次見面語：</label>
                            <input type="text" id="greetingMessage" class="vivi-set-input" value="${savedGreeting}" placeholder="輸入初次見面語">
                        </div>
                        <div class="setting-item" style="margin-bottom: 0;">
                            <label>首頁背景照片：</label>
                            <div class="photo-preview" id="photoPreview">
                                <img id="previewImage" src="" alt="預覽圖" style="display: none;">
                                <div id="placeholderText">📷 點擊上傳照片</div>
                            </div>
                            <input type="file" id="photoUpload" accept="image/*" style="display: none;">
                            <button class="upload-button" onclick="document.getElementById('photoUpload').click()">選擇首頁照片</button>
                        </div>
                    </div>
                </div>

                <!-- 2. API 金鑰設定（預設收合） -->
                <div class="vivi-set-card">
                    <div class="vivi-set-card-head" onclick="toggleSettingsSection('apiKeysSectionBody', this)">
                        <h4 class="vivi-set-card-title">🔑 API 金鑰設定</h4>
                        <button type="button" class="vivi-set-toggle-btn" data-toggle-label onclick="event.stopPropagation(); toggleSettingsSection('apiKeysSectionBody', this.parentElement)">展開 ▼</button>
                    </div>
                    <div id="apiKeysSectionBody" class="vivi-set-card-body" style="display: none;">
                        <div class="vivi-set-sub-field">
                            <label>🤖 Gemini API Key：</label>
                            <input type="password" id="geminiApiKeyInput" class="vivi-set-input" value="${savedApiKey}" placeholder="貼上你的 Google Gemini API Key">
                            <p class="vivi-set-hint">貼上後點擊儲存設定，即可解鎖真實 AI 智慧對話。</p>
                        </div>
                        <div class="vivi-set-sub-field">
                            <label>🌤️ 中央氣象署 API Key：</label>
                            <input type="password" id="weatherApiKeyInput" class="vivi-set-input" value="${savedWeatherKey}" placeholder="貼上你的 CWA API Key (例如 CWA-xxxx...)">
                            <p class="vivi-set-hint">貼上後點擊儲存設定，即可解鎖在地即時天氣與官方氣象預報。</p>
                        </div>
                    </div>
                </div>

                <!-- 3. ⚠️ 危險區域（獨立初始化）（預設收合） -->
                <div class="vivi-set-card vivi-set-card-danger">
                    <div class="vivi-set-card-head" onclick="toggleSettingsSection('dangerSectionBody', this)">
                        <h4 class="vivi-set-card-title vivi-set-card-title-danger">⚠️ 危險區域（獨立初始化）</h4>
                        <button type="button" class="vivi-set-toggle-btn vivi-set-toggle-btn-danger" data-toggle-label onclick="event.stopPropagation(); toggleSettingsSection('dangerSectionBody', this.parentElement)">展開 ▼</button>
                    </div>
                    <div id="dangerSectionBody" class="vivi-set-card-body" style="display: none;">
                        <button type="button" onclick="if(typeof resetReconciliationOnly === 'function') { resetReconciliationOnly(); } else { alert('對帳模組尚未載入'); }" style="width: 100%; padding: 12px; background: #fff8e1; color: #e65100; border: 1px dashed #ff9800; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; margin-bottom: 8px;">
                            🧾 資金與流水初始化（僅資金與資金流水）
                        </button>

                        <button type="button" onclick="resetCreditCardOnly()" style="width: 100%; padding: 10px; margin-bottom: 8px; background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; border-radius: 8px; font-weight: bold; cursor: pointer;">
                            💳 初始化信用卡與未出帳帳單
                        </button>

                        <button type="button" onclick="if(typeof resetWealthOnly === 'function') { resetWealthOnly(); } else { alert('資產模組尚未載入'); }" style="width: 100%; padding: 12px; background: #ffebee; color: #c62828; border: 1px dashed #e53935; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; margin-bottom: 8px;">
                            💎 總資產與投資初始化（僅重設股票/基金/保險）
                        </button>

                        <button type="button" onclick="resetChatHistory()" style="width: 100%; padding: 12px; background: #f3e5f5; color: #7b1fa2; border: 1px dashed #ab47bc; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; margin-bottom: 8px;">
                            💬 聊聊紀錄初始化
                        </button>
                        <button type="button" onclick="resetBikeData()" style="width: 100%; padding: 12px; background: #e3f2fd; color: #1565c0; border: 1px dashed #2196f3; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                            🏍️ 機車與保養資料初始化
                        </button>
                    </div>
                </div>

                <!-- 4. 💾 資料備份與跨裝置轉移（預設收合） -->
                <div class="vivi-set-card">
                    <div class="vivi-set-card-head" onclick="toggleSettingsSection('backupSectionBody', this)">
                        <h4 class="vivi-set-card-title">💾 資料備份與跨裝置轉移</h4>
                        <button type="button" class="vivi-set-toggle-btn" data-toggle-label onclick="event.stopPropagation(); toggleSettingsSection('backupSectionBody', this.parentElement)">展開 ▼</button>
                    </div>
                    <div id="backupSectionBody" class="vivi-set-card-body" style="display: none;">
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button type="button" onclick="exportDataToJson()" style="padding: 8px 14px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">📥 匯出備份 (JSON)</button>
                            <label style="padding: 8px 14px; background: #c68652; color: white; border-radius: 8px; cursor: pointer; font-weight: bold; display: inline-block;">
                                📤 還原資料
                                <input type="file" id="importFile" accept=".json" onchange="importDataFromJson(event)" style="display: none;">
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 5. 🧠 記憶管理（預設收合） -->
                <div class="vivi-set-card">
                    <div class="vivi-set-card-head" onclick="toggleSettingsSection('memorySectionBody', this)">
                        <h4 class="vivi-set-card-title">🧠 記憶管理</h4>
                        <button type="button" class="vivi-set-toggle-btn" data-toggle-label onclick="event.stopPropagation(); toggleSettingsSection('memorySectionBody', this.parentElement)">展開 ▼</button>
                    </div>
                    <div id="memorySectionBody" class="vivi-set-card-body" style="display: none;">
                        <div id="settingsMemoryContainer"></div>
                    </div>
                </div>

                <div class="vivi-set-save-row">
                    <button class="save-button vivi-set-save-btn" onclick="saveSettings()">儲存設定</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(settingsPanel);

    if (typeof window.mountMemoryPanel === 'function') {
        window.mountMemoryPanel('#settingsMemoryContainer');
    }

    const savedPhoto = StorageService.get(STORAGE_KEYS.USER_PHOTO, localStorage.getItem('userPhoto'));
    const savedAvatar = StorageService.get(STORAGE_KEYS.ASSISTANT_AVATAR, localStorage.getItem('assistantAvatar'));

    const previewAvatarImg = document.getElementById('previewAvatarImg');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    if (savedAvatar) {
        previewAvatarImg.src = savedAvatar;
        previewAvatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }

    document.getElementById('avatarUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                previewAvatarImg.src = ev.target.result;
                previewAvatarImg.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    const previewImage = document.getElementById('previewImage');
    const placeholderText = document.getElementById('placeholderText');
    if (savedPhoto) {
        previewImage.src = savedPhoto;
        previewImage.style.display = 'block';
        placeholderText.style.display = 'none';
    }

    document.getElementById('photoUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                previewImage.src = ev.target.result;
                previewImage.style.display = 'block';
                placeholderText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    setTimeout(() => { settingsPanel.style.zIndex = '1000'; }, 0);
}

function closeSettings() {
    if (window.__viviMemoryUI && typeof window.__viviMemoryUI.unmount === 'function') {
        window.__viviMemoryUI.unmount();
        window.__viviMemoryUI = null;
    }
    const settingsPanel = document.querySelector('.settings-panel');
    if (settingsPanel) settingsPanel.remove();
}

function saveSettings() {
    const apiKeyInput = document.getElementById('geminiApiKeyInput')?.value.trim() ?? '';
    const weatherApiKeyInput = document.getElementById('weatherApiKeyInput')?.value.trim() ?? '';
    const assistantName = (document.getElementById('assistantName')?.value.trim()) || StorageService.get(STORAGE_KEYS.ASSISTANT_NAME, localStorage.getItem('assistantName') || '薇薇');
    const greetingMessage = (document.getElementById('greetingMessage')?.value.trim()) || StorageService.get(STORAGE_KEYS.GREETING_MESSAGE, localStorage.getItem('greetingMessage') || '你好，我是秘書，很高興為您服務。');
    const previewImage = document.getElementById('previewImage');
    const previewAvatarImg = document.getElementById('previewAvatarImg');

    if (assistantName && greetingMessage) {
        StorageService.set(STORAGE_KEYS.GEMINI_API_KEY, apiKeyInput);
        localStorage.setItem('vivi_gemini_api_key', apiKeyInput);

        StorageService.set(STORAGE_KEYS.WEATHER_API_KEY, weatherApiKeyInput);
        localStorage.setItem('vivi_weather_api_key', weatherApiKeyInput);

        StorageService.set(STORAGE_KEYS.ASSISTANT_NAME, assistantName);
        localStorage.setItem('assistantName', assistantName);

        StorageService.set(STORAGE_KEYS.GREETING_MESSAGE, greetingMessage);
        localStorage.setItem('greetingMessage', greetingMessage);

        const lastMessage = document.getElementById('lastMessage') || document.querySelector('.home-message-card .message-text');
        if (lastMessage) lastMessage.textContent = greetingMessage;

        document.querySelectorAll('.sender-name').forEach(el => { el.textContent = assistantName; });

        if (previewAvatarImg && previewAvatarImg.src && previewAvatarImg.style.display !== 'none') {
            StorageService.set(STORAGE_KEYS.ASSISTANT_AVATAR, previewAvatarImg.src);
            localStorage.setItem('assistantAvatar', previewAvatarImg.src);
            document.querySelectorAll('.assistant-avatar-img').forEach(img => { img.src = previewAvatarImg.src; });
        }

        if (previewImage && previewImage.src && previewImage.style.display !== 'none') {
            StorageService.set(STORAGE_KEYS.USER_PHOTO, previewImage.src);
            localStorage.setItem('userPhoto', previewImage.src);
            const userPhoto = document.getElementById('userPhoto');
            if (userPhoto) {
                userPhoto.innerHTML = `<img src="${previewImage.src}" alt="用戶照片" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        }

        closeSettings();
        showNotification('設定已儲存（API 金鑰與秘書設定已連動）');
    }
}

function resetChatHistory() {
    if (confirm('💬 確定要清空所有聊聊對話紀錄嗎？')) {
        StorageService.remove(STORAGE_KEYS.CHAT_HISTORY);
        localStorage.removeItem('viviChatHistory');
        location.reload();
    }
}

function resetBikeData() {
    if (confirm('🏍️ 確定要將愛車資訊與保養記錄重設嗎？')) {
        StorageService.remove(STORAGE_KEYS.BIKE_INFO);
        StorageService.remove(STORAGE_KEYS.BIKE_HISTORY);
        StorageService.remove(STORAGE_KEYS.BIKE_UPCOMING);
        localStorage.removeItem('vivi_bike_info');
        localStorage.removeItem('vivi_bike_history');
        localStorage.removeItem('vivi_bike_upcoming');
        location.reload();
    }
}

function exportDataToJson() {
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupData[key] = localStorage.getItem(key);
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Vivi_Finance_Backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importDataFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            for (const key in importedData) {
                localStorage.setItem(key, importedData[key]);
            }
            alert('✅ 資料還原成功！網頁將自動重新整理。');
            location.reload();
        } catch (error) {
            alert('❌ 檔案格式錯誤，無法還原資料！');
        }
    };
    reader.readAsText(file);
}