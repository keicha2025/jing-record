import { CONFIG } from './config.js';
import { API } from './api.js';
import { AddPage } from './pages/add-page.js';
import { EditPage } from './pages/edit-page.js';
import { HistoryPage } from './pages/history-page.js';
import { StatsPage } from './pages/stats-page.js';
import { SettingsPage } from './pages/settings-page.js';

const { createApp, ref, onMounted, computed } = window.Vue;

createApp({
    components: { 'add-page': AddPage, 'edit-page': EditPage, 'history-page': HistoryPage, 'stats-page': StatsPage, 'settings-page': SettingsPage },
    setup() {
        const currentTab = ref('add');
        const loading = ref(false);
        const lastSaved = ref(null); // 保留但不用於阻擋跳轉
        const categories = ref([]);
        const friends = ref([]);
        const transactions = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);
        const stats = ref({ monthlyLifeTotal: 0, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 });
        const historyFilter = ref({ mode: 'all', categoryId: null, friendName: null });
        const systemConfig = ref({ user_name: '留學生', fx_rate: 0.22 });
        const editForm = ref(null);

        const form = ref({
            type: '支出', currency: 'JPY', amount: '', spendDate: new Date().toISOString().split('T')[0],
            categoryId: 'cat_001', name: '', note: '', paymentMethod: '現金',
            isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false, action: 'add'
        });

        const filteredTransactions = computed(() => {
            let list = transactions.value;
            const filter = historyFilter.value;
            if (filter.mode === 'monthly') {
                const now = new Date();
                list = list.filter(t => new Date(t.spendDate).getMonth() === now.getMonth() && !t.isOneTime);
            } else if (filter.mode === 'onetime') {
                list = list.filter(t => t.isOneTime);
            } else if (filter.mode === 'debt') {
                list = list.filter(t => t.debtAmount !== 0 || t.type === '收款');
            }
            if (filter.categoryId) list = list.filter(t => t.categoryId === filter.categoryId);
            if (filter.friendName) list = list.filter(t => t.friendName && (t.friendName.includes(filter.friendName) || t.payer === filter.friendName));
            return list;
        });

        const loadData = async () => {
            loading.value = true;
            try {
                const data = await API.fetchInitialData();
                categories.value = data.categories || [];
                friends.value = data.friends || [];
                transactions.value = data.transactions || [];
                if (data.stats) stats.value = data.stats;
                if (data.config) {
                    systemConfig.value = data.config;
                    fxRate.value = parseFloat(data.config.fx_rate);
                }
            } finally { loading.value = false; }
        };

        const handleSubmit = async (targetForm) => {
            const dataToSave = targetForm || form.value;
            if (!dataToSave.amount || !dataToSave.name) return;
            loading.value = true;
            try {
                const payload = { 
                    ...dataToSave, 
                    amountJPY: dataToSave.currency === 'JPY' ? dataToSave.amount : dataToSave.amount / fxRate.value 
                };
                await API.saveTransaction(payload);
                
                // 【核心修改】送出後直接跳轉明細，不顯示彈窗
                currentTab.value = 'history';
                resetForm();
                await loadData();
            } finally { loading.value = false; }
        };

        const handleDelete = async (row) => {
            loading.value = true;
            try {
                await API.saveTransaction({ action: 'delete', row: row });
                currentTab.value = 'history';
                editForm.value = null;
                await loadData();
            } finally { loading.value = false; }
        };

        const resetForm = () => {
            form.value = { type: '支出', currency: 'JPY', amount: '', spendDate: new Date().toISOString().split('T')[0], categoryId: 'cat_001', name: '', note: '', paymentMethod: '現金', isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false, action: 'add' };
            editForm.value = null;
        };

        const handleEditItem = (item) => {
            editForm.value = JSON.parse(JSON.stringify({ ...item, amount: item.amountJPY, currency: 'JPY', action: 'edit' }));
            currentTab.value = 'edit';
        };

        const getTabIcon = (t) => {
            const icons = { overview:'dashboard', history:'list_alt', add:'add', stats:'bar_chart', settings:'settings' };
            return icons[t] || 'help';
        };

        onMounted(loadData);

        return { currentTab, loading, categories, friends, transactions, filteredTransactions, historyFilter, form, editForm, stats, systemConfig, fxRate, handleSubmit, handleDelete, handleEditItem, formatNumber: (n) => new Intl.NumberFormat().format(Math.round(n || 0)), getTabIcon, toggleCurrency: () => form.value.currency = (form.value.currency === 'JPY' ? 'TWD' : 'JPY'), handleAddFriendToList: (n) => !friends.value.includes(n) && friends.value.push(n), resetForm, handleDrillDown: (id) => { historyFilter.value = {mode:'all', categoryId:id, friendName:null}; currentTab.value='history'; }, handleUpdateConfig: async (c) => { loading.value=true; await API.saveTransaction({action:'updateConfig', ...c}); await loadData(); } };
    }
}).mount('#app');
