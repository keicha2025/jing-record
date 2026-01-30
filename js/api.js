import { CONFIG } from './config.js';

export const API = {
    // 獲取所有初始資料
    async fetchInitialData() {
        try {
            const response = await fetch(CONFIG.GAS_URL);
            return await response.json();
        } catch (error) {
            console.error("Fetch Error:", error);
            throw error;
        }
    },

    // 儲存新帳目
    async saveTransaction(payload) {
        try {
            const response = await fetch(CONFIG.GAS_URL, {
                method: 'POST',
                mode: 'no-cors', // 為了繞過 GAS CORS 限制
                body: JSON.stringify(payload)
            });
            return true;
        } catch (error) {
            console.error("Save Error:", error);
            throw error;
        }
    }
};
