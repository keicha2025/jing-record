import { CONFIG } from './config.js';
import { API } from './api.js';

const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // 狀態管理
        const currentTab = ref('add');
        const loading = ref(false);
        const lastSaved = ref(null);
        
        // 從資料庫抓取的資料
        const categories = ref([]);
        const friends = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);
        const monthlyTotal = ref(0);
        const debtTotal = ref(0);
        const allTimeTotal = ref(0);

        // 表單預設值
        const form = ref({
            type: '支出',
            currency: 'JPY',
            amount: '',
            spendDate: new Date().toISOString().split('T')[0],
            categoryId: 'cat_001',
            name: '',
            paymentMethod: '現金',
            isOneTime: false,
            isSplit: false,
            friendName: '',
            personalShare: 0
        });

        // 核心邏輯
        const toggleCurrency = () => {
            form.value.currency = form.value.currency === 'JPY' ? 'TWD' : 'JPY';
        };

        const formatNumber = (num) => new Intl.NumberFormat().format(Math.round(num || 0));

        const getTabIcon = (tab) => CONFIG.TAB_ICONS[tab];

        const quickSplit = (n) => {
            if (!form.value.amount) return;
            form.value.personalShare = Math.round(form.value.amount / n);
        };

        const loadData = async () => {
            loading.value = true;
            try {
                const data = await API.fetchInitialData();
                categories.value = data.categories;
                friends.value = data.friends;
                if (data.config.fx_rate) fxRate.value = parseFloat(data.config.fx_rate);
                // 這裡未來可以加入計算總金額的邏輯
            } finally {
                loading.value = false;
            }
        };

        const submitForm = async () => {
            if (!form.value.amount || !form.value.name) return;
            loading.value = true;

            const payload = {
                ...form.value,
                amountJPY: form.value.currency === 'JPY' ? form.value.amount : form.value.amount / fxRate.value,
                amountTWD: form.value.currency === 'TWD' ? form.value.amount : form.value.amount * fxRate.value,
                debtAmount: form.value.isSplit ? (form.value.amount - form.value.personalShare) : 0,
                personalShare: form.value.isSplit ? form.value.personalShare : (form.value.currency === 'JPY' ? form.value.amount : form.value.amount / fxRate.value)
            };

            try {
                await API.saveTransaction(payload);
                lastSaved.value = { ...payload };
                // 清空表單
                form.value.amount = '';
                form.value.name = '';
                form.value.isSplit = false;
                form.value.friendName = '';
                await loadData(); // 重新整理清單
            } catch (e) {
                alert("儲存失敗，請檢查網路。");
            } finally {
                loading.value = false;
            }
        };

        onMounted(loadData);

        return {
            currentTab, loading, lastSaved, categories, friends, form, fxRate,
            monthlyTotal, debtTotal, allTimeTotal,
            toggleCurrency, formatNumber, getTabIcon, quickSplit, submitForm
        };
    }
}).mount('#app');
