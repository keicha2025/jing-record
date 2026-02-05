import { CONFIG } from './config.js?v=1.3';

export const API = {
    async fetchInitialData(token = '') {
        try {
            // 加入時間戳記避免快取與 CORS 重新導向錯誤，並附帶 Token
            const url = `${CONFIG.GAS_URL}?t=${new Date().getTime()}&token=${encodeURIComponent(token)}`;
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors', // GET 必須用 cors 才能讀取資料
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error("Fetch Error:", error);
            // 回傳空資料結構避免前端崩潰
            return { categories: [], friends: [], transactions: [], stats: {} };
        }
    },
    async saveTransaction(payload, token = '') {
        try {
            const finalPayload = { ...payload, token };
            const savePromise = fetch(CONFIG.GAS_URL, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(finalPayload)
            });
            const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 1000));
            await Promise.race([savePromise, timeoutPromise]);
            return true;
        } catch (error) {
            console.error("Save Error:", error);
            throw error;
        }
    }
};
