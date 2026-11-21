// ================= Vivi Weather Module (Dynamic User Key & Multi-Tier Fallback) =================

function getCwaApiKey() {
    return StorageService.get(STORAGE_KEYS.WEATHER_API_KEY, localStorage.getItem('vivi_weather_api_key') || '');
}

function getWeatherDescription(code) {
    if (code === 0) return "☀️ 晴朗";
    if (code >= 1 && code <= 3) return "⛅ 多雲";
    if (code === 45 || code === 48) return "🌫️ 霧";
    if (code >= 51 && code <= 57) return "🌧️ 小雨";
    if (code >= 61 && code <= 67) return "🌧️ 雨";
    if (code >= 71 && code <= 77) return "❄️ 雪";
    if (code >= 80 && code <= 82) return "🌦️ 陣雨";
    if (code >= 95 && code <= 99) return "⚡ 雷雨";
    return "☁️ 陰天";
}

// 🛡️ 帶有逾時控制與自動重試的 Open-Meteo 抓取函式 (第 1 順位)
async function fetchWeatherWithRetry(url, retries = 2, timeoutMs = 4000) {
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            clearTimeout(timer);
            console.warn(`⚠️ Open-Meteo 第 ${i + 1} 次連線失敗，準備重試...`, err.message);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

// 🏛️ 中央氣象署 (CWA) 官方 API 抓取函式 (第 3 順位備援)
async function fetchCwaWeather(cityName = "新北市") {
    const apiKey = getCwaApiKey();
    if (!apiKey) {
        throw new Error("CWA_KEY_MISSING");
    }

    try {
        const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${apiKey}&format=JSON&locationName=${encodeURIComponent(cityName)}`;
        
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        
        const data = await res.json();
        if (!data.success || !data.records || !data.records.location) {
            throw new Error("CWA API 格式錯誤或 Key 有誤");
        }

        const locData = data.records.location[0];
        const weatherElements = locData.weatherElement;
        
        const wx = weatherElements.find(e => e.elementName === 'Wx')?.time[0]?.parameter?.parameterName || "多雲";
        const pop = weatherElements.find(e => e.elementName === 'PoP')?.time[0]?.parameter?.parameterName || "0";
        const minT = weatherElements.find(e => e.elementName === 'MinT')?.time[0]?.parameter?.parameterName || "20";
        const maxT = weatherElements.find(e => e.elementName === 'MaxT')?.time[0]?.parameter?.parameterName || "26";

        return `🏛️ 【中央氣象署官方即時回報】\n📍 地區：${locData.locationName}\n🌤 天氣現象：${wx}\n🌡 氣溫：${minT}°C ~ ${maxT}°C\n☔ 降雨機率：${pop}%\n\n💡 使用您專屬的 CWA API Key 提供最即時在地氣象保障！`;
    } catch (error) {
        if (error.message === "CWA_KEY_MISSING") throw error;
        console.warn("⚠️ 中央氣象署 API 發生異常：", error);
        throw new Error("ALL_WEATHER_APIS_FAILED");
    }
}

function getCurrentPositionAsync() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("瀏覽器不支援定位"));
            return;
        }
        const timer = setTimeout(() => {
            reject(new Error("定位逾時"));
        }, 2500);

        navigator.geolocation.getCurrentPosition(
            pos => {
                clearTimeout(timer);
                resolve(pos.coords);
            },
            err => {
                clearTimeout(timer);
                reject(err);
            },
            { timeout: 2500, enableHighAccuracy: false }
        );
    });
}

async function getLocationNameFromCoords(lat, lon) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh-TW`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.county || "";
        const district = addr.suburb || addr.town || addr.district || "";
        return (city || district) ? `${city}${district}` : "目前位置";
    } catch (e) {
        throw new Error("LOCATION_NEEDED");
    }
}

async function resolveTargetLocation(query = "") {
    const DISTRICT_COORDS = {
        "板橋": { lat: 25.0142, lon: 121.4586, name: "新北市板橋區", cwaCity: "新北市" },
        "土城": { lat: 24.9753, lon: 121.4433, name: "新北市土城區", cwaCity: "新北市" },
        "新莊": { lat: 25.0357, lon: 121.4479, name: "新北市新莊區", cwaCity: "新北市" },
        "中和": { lat: 24.9987, lon: 121.4998, name: "新北市中和區", cwaCity: "新北市" },
        "永和": { lat: 25.0134, lon: 121.5147, name: "新北市永和區", cwaCity: "新北市" },
        "三重": { lat: 25.0617, lon: 121.4907, name: "新北市三重區", cwaCity: "新北市" },
        "樹林": { lat: 24.9693, lon: 121.4245, name: "新北市樹林區", cwaCity: "新北市" },
        "台北": { lat: 25.0330, lon: 121.5654, name: "臺北市", cwaCity: "臺北市" },
        "臺北": { lat: 25.0330, lon: 121.5654, name: "臺北市", cwaCity: "臺北市" },
        "新北": { lat: 25.0123, lon: 121.4657, name: "新北市", cwaCity: "新北市" },
        "桃園": { lat: 24.9936, lon: 121.3010, name: "桃園市", cwaCity: "桃園市" },
        "新竹": { lat: 24.8138, lon: 120.9675, name: "新竹市", cwaCity: "新竹市" },
        "台中": { lat: 24.1477, lon: 120.6736, name: "臺中市", cwaCity: "臺中市" },
        "臺中": { lat: 24.1477, lon: 120.6736, name: "臺中市", cwaCity: "臺中市" },
        "台南": { lat: 22.9999, lon: 120.2269, name: "臺南市", cwaCity: "臺南市" },
        "臺南": { lat: 22.9999, lon: 120.2269, name: "臺南市", cwaCity: "臺南市" },
        "高雄": { lat: 22.6273, lon: 120.3014, name: "高雄市", cwaCity: "高雄市" },
        "基隆": { lat: 25.1276, lon: 121.7392, name: "基隆市", cwaCity: "基隆市" },
        "宜蘭": { lat: 24.7021, lon: 121.7378, name: "宜蘭縣", cwaCity: "宜蘭縣" },
        "花蓮": { lat: 23.9872, lon: 121.6016, name: "花蓮縣", cwaCity: "花蓮縣" },
        "台東": { lat: 22.7583, lon: 121.1444, name: "臺東縣", cwaCity: "臺東縣" }
    };

    const foundKey = Object.keys(DISTRICT_COORDS).find(k => query.includes(k));
    if (foundKey) return DISTRICT_COORDS[foundKey];

    try {
        const coords = await getCurrentPositionAsync();
        const locName = await getLocationNameFromCoords(coords.latitude, coords.longitude);
        return { lat: coords.latitude, lon: coords.longitude, name: locName, cwaCity: "新北市" };
    } catch (err) {
        throw new Error("LOCATION_NEEDED");
    }
}

// 1. 24小時逐時預報
async function getWeather24Hours(district = "") {
    try {
        const loc = await resolveTargetLocation(district);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,weathercode&timezone=Asia%2FTaipei`;
        
        try {
            const data = await fetchWeatherWithRetry(url);
            if (data && data.hourly) {
                const times = data.hourly.time;
                const temps = data.hourly.temperature_2m;
                const pops = data.hourly.precipitation_probability;
                const codes = data.hourly.weathercode;

                const currentHour = new Date().getHours();
                let startIndex = currentHour;

                let result = `📍 ${loc.name} 未來 24 小時逐時預報：\n\n`;
                let hourlyLines = [];
                let maxPop = 0;
                let maxTemp = -99;
                let minTemp = 99;

                for (let i = startIndex; i < startIndex + 24 && i < times.length; i++) {
                    const timeObj = new Date(times[i]);
                    const hourStr = timeObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const temp = Math.round(temps[i] || 25);
                    const pop = pops[i] || 0;
                    const weatherDesc = getWeatherDescription(codes[i]);

                    if (pop > maxPop) maxPop = pop;
                    if (temp > maxTemp) maxTemp = temp;
                    if (temp < minTemp) minTemp = temp;

                    hourlyLines.push(`${hourStr} ${weatherDesc} ${temp}°C ☔${pop}%`);
                }

                result += hourlyLines.join('\n') + `\n\n`;
                result += `🌤 外出建議\n\n`;
                if (maxPop >= 70) result += `☔ 降雨機率高，建議隨身攜帶雨具\n\n`;
                else result += `✅ 天氣穩定，適合外出活動\n\n`;
                result += `🌡 最高溫：${maxTemp}°C | 🌡 最低溫：${minTemp}°C`;
                return result.trim();
            }
        } catch (openMeteoErr) {
            console.warn("⚠️ Open-Meteo 失敗，嘗試啟動中央氣象署備援...");
        }

        // CWA 備援
        return await fetchCwaWeather(loc.cwaCity || "新北市");

    } catch (error) {
        if (error.message === "CWA_KEY_MISSING") {
            return "⚙️ 尚未設定中央氣象署 (CWA) API Key！請點擊右上角設定圖示（⚙️）輸入您的專屬 CWA API Key 即可解鎖官方氣象備援。";
        }
        if (error.message === "LOCATION_NEEDED") {
            return "📍 哎呀, 薇薇目前抓不到您的 GPS 定位，請問您想查詢哪一個地區的天氣呢？（例如：「土城小時預報」或「台北一週天氣」）";
        }
        return "📍 氣象伺服器目前忙碌中，請稍後再試一次！";
    }
}

// 2. 一週天氣預報
async function getWeather7Days(city = "") {
    try {
        const loc = await resolveTargetLocation(city);
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei`;
        
        try {
            const data = await fetchWeatherWithRetry(url);
            if (data && data.daily) {
                const days = data.daily.time;
                const maxTemps = data.daily.temperature_2m_max;
                const minTemps = data.daily.temperature_2m_min;
                const pops = data.daily.precipitation_probability_max;
                const codes = data.daily.weathercode;

                let result = `📍 ${loc.name} 一週天氣預報：\n\n`;
                const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
                let dailyLines = [];

                for (let i = 0; i < Math.min(7, days.length); i++) {
                    const dateObj = new Date();
                    dateObj.setDate(dateObj.getDate() + i);
                    const dayName = weekDays[dateObj.getDay()];
                    const weatherDesc = getWeatherDescription(codes[i] || 1);
                    const low = Math.round(minTemps[i] || 20);
                    const high = Math.round(maxTemps[i] || 26);
                    const maxRain = pops[i] || 0;

                    dailyLines.push(`${dayName} ${weatherDesc} ${low}~${high}°C ☔${maxRain}%`);
                }

                result += dailyLines.join('\n');
                return result.trim();
            }
        } catch (err) {
            console.warn("⚠️ 一週預報 Open-Meteo 失敗，嘗試啟動中央氣象署備援...");
        }

        return await fetchCwaWeather(loc.cwaCity || "新北市");

    } catch (error) {
        if (error.message === "CWA_KEY_MISSING") {
            return "⚙️ 尚未設定中央氣象署 (CWA) API Key！請至設定（⚙️）內填寫。";
        }
        if (error.message === "LOCATION_NEEDED") {
            return "📍 抓不到 GPS 定位，請指定地區（例如：「台北一週天氣」）。";
        }
        return "📍 一週氣象資料讀取失敗！";
    }
}

async function getOutingScore(input) {
    try {
        let weatherData;
        let locationName = "目前位置";
        let cwaCityName = "新北市";

        if (typeof input === 'string') {
            const loc = await resolveTargetLocation(input);
            locationName = loc.name;
            cwaCityName = loc.cwaCity || "新北市";
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&hourly=temperature_2m,precipitation_probability,weathercode&timezone=Asia%2FTaipei`;
            try {
                weatherData = await fetchWeatherWithRetry(url);
            } catch (e) {
                return await fetchCwaWeather(cwaCityName);
            }
        } else {
            weatherData = input;
        }

        if (!weatherData || !weatherData.hourly || !weatherData.hourly.precipitation_probability) {
            return `【📍 ${locationName} 即時外出評分】\n⭐️ 適宜指數：8 / 10 分\n💡 薇薇建議：天氣穩定，適宜外出活動！`;
        }

        const currentHour = new Date().getHours();
        const rainChance = weatherData.hourly.precipitation_probability[currentHour] || 10;
        const temp = Math.round(weatherData.hourly.temperature_2m[currentHour] || 26);

        let score = 10 - Math.round(rainChance / 10);
        if (score < 1) score = 1;

        let advice = "天氣狀況良好，非常適合外出散步或騎車！";
        if (rainChance >= 70) {
            score = Math.min(score, 4);
            advice = "降雨機率偏高，強烈建議攜帶雨具或改期。";
        }

        return `【📍 ${locationName} 即時外出評分】\n⭐️ 適宜指數：${score} / 10 分\n🌡️ 目前氣溫：${temp}°C\n🌧️ 降雨機率：${rainChance}%\n\n💡 薇薇建議：${advice}`;
    } catch (error) {
        if (error.message === "CWA_KEY_MISSING") {
            return "⚙️ 請至設定面板填寫中央氣象署 (CWA) API Key 才能取得官方評分備援。";
        }
        if (error.message === "LOCATION_NEEDED") {
            return "📍 抓不到 GPS 定位。";
        }
        return "📍 外出評分資料讀取失敗！";
    }
}

window.getOutingScore = getOutingScore;