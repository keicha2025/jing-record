import { CONFIG } from './config.js';
import { API } from './api.js';
import { AddPage } from './pages/add-page.js';

const { createApp, ref, onMounted } = Vue;

createApp({
    components: {
        'add-page': AddPage
    },
    setup() {
        const currentTab = ref('add');
        const loading = ref(false);
        const lastSaved = ref(null);
        
        const categories = ref([]);
        const friends = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);

        const form = ref({
            type: '支出', currency: 'JPY', amount: '', 
            spendDate: new Date().toISOString().split('T')[0],
            categoryId: 'cat_001', name: '', note: '', 
            paymentMethod: '現金', isOneTime: false, 
            isSplit: false, friendName: '', personalShare: 0
        });

        const toggleCurrency = () => {
            form.value.currency = form.value.currency === 'JPY' ? 'TWD' : 'JPY';
        };

        const loadData = async () => {
            loading.value = true;
            try {
                const data = await API.fetchInitialData();
                categories.value = data.categories;
                friends.value = data.friends;
                if (data.config.fx_rate) fxRate.value = parseFloat(data.config.fx_rate);
            } finally {
                loading.value = false;
            }
        };

        const handleSubmit = async () => {
            loading.value = true;
            try {
                // 這裡實作 API 儲存邏輯 (同前次代碼)
                // ...
                lastSaved.value = { ...form.value };
                form.value.amount = ''; // 重置
            } finally {
                loading.value = false;
            }
        };

        onMounted(loadData);

        return { currentTab, loading, lastSaved, categories, friends, form, fxRate, toggleCurrency, handleSubmit };
    }
}).mount('#app');
