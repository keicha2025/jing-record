import { CONFIG } from './config.js';
import { API } from './api.js';
import { AddPage } from './pages/add-page.js';
import { EditPage } from './pages/edit-page.js';
import { HistoryPage } from './pages/history-page.js';
import { StatsPage } from './pages/stats-page.js';
import { SettingsPage } from './pages/settings-page.js';
import { OverviewPage } from "./pages/overview-page.js";
import { ProjectDetailPage } from './pages/project-detail-page.js';

const { createApp, ref, onMounted, computed } = window.Vue;

createApp({
    components: {
        'overview-page': OverviewPage,
        'add-page': AddPage,
        'edit-page': EditPage,
        'history-page': HistoryPage,
        'stats-page': StatsPage,
        'settings-page': SettingsPage,
        'project-detail-page': ProjectDetailPage
    },
    setup() {
        const getLocalISOString = () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        };
        const currentTab = ref('add');
        const loading = ref(false);
        const lastSaved = ref(null);
        const categories = ref([]);
        const friends = ref([]);
        const paymentMethods = ref([]);
        const projects = ref([]);
        const transactions = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);
        const stats = ref({ monthlyLifeTotal: 0, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 });
        const historyFilter = ref({ mode: 'all', categoryId: null, friendName: null, currency: null, keyword: '' });
        const systemConfig = ref({ user_name: '留學生', fx_rate: 0.22 });
        const editForm = ref(null);
        const selectedProject = ref(null);

        const form = ref({
            type: '支出', currency: 'JPY', amount: '', spendDate: getLocalISOString(),
            categoryId: 'cat_001', name: '', note: '', paymentMethod: '',
            isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false,
            projectId: '',
            action: 'add'
        });

        const filteredTransactions = computed(() => {
            let list = transactions.value;
            const filter = historyFilter.value;

            // Mode Filtering
            if (filter.mode === 'monthly') {
                const now = new Date();
                list = list.filter(t => new Date(t.spendDate).getMonth() === now.getMonth() && new Date(t.spendDate).getFullYear() === now.getFullYear() && !t.isOneTime);
            } else if (filter.mode === 'onetime') {
                list = list.filter(t => t.isOneTime);
            } else if (filter.mode === 'debt') {
                list = list.filter(t => t.debtAmount !== 0 || t.type === '收款');
            } else if (filter.mode === 'general') {
                list = list.filter(t => !t.projectId); // Only non-project
            } else if (filter.mode === 'project') {
                list = list.filter(t => !!t.projectId); // Only project
            }

            // Other filters
            if (filter.categoryId) list = list.filter(t => t.categoryId === filter.categoryId);
            if (filter.friendName) list = list.filter(t => t.friendName && (t.friendName.includes(filter.friendName) || t.payer === filter.friendName));
            if (filter.currency) list = list.filter(t => t.originalCurrency === filter.currency);

            // Keyword Search (Enhanced)
            if (filter.keyword) {
                const k = filter.keyword.toLowerCase();
                list = list.filter(t => {
                    // Pre-fetch names for search
                    const cat = categories.value.find(c => c.id === t.categoryId);
                    const catName = cat ? cat.name.toLowerCase() : '';

                    const pm = paymentMethods.value.find(p => p.id === t.paymentMethod);
                    const pmName = pm ? pm.name.toLowerCase() : (t.paymentMethod || '').toLowerCase();

                    return (
                        (t.name && t.name.toLowerCase().includes(k)) ||
                        (t.note && t.note.toLowerCase().includes(k)) ||
                        (t.friendName && t.friendName.toLowerCase().includes(k)) ||
                        catName.includes(k) ||
                        pmName.includes(k)
                    );
                });
            }

            return list;
        });

        const loadData = async () => {
            loading.value = true;
            try {
                const data = await API.fetchInitialData();
                categories.value = data.categories || [];
                friends.value = data.friends || [];
                paymentMethods.value = data.paymentMethods || [];
                projects.value = data.projects || [];
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
                    amountJPY: dataToSave.currency === 'JPY' ? dataToSave.amount : dataToSave.amount / fxRate.value,
                    amountTWD: dataToSave.currency === 'TWD' ? dataToSave.amount : dataToSave.amount * fxRate.value
                };
                await API.saveTransaction(payload);
                if (dataToSave.action === 'edit') currentTab.value = 'history';
                resetForm();
                await loadData();
            } finally { loading.value = false; }
        };

        const handleDelete = async (row) => {
            if (!confirm("確定要永久刪除此筆資料嗎？")) return;
            loading.value = true;
            try {
                await API.saveTransaction({ action: 'delete', row: row });
                currentTab.value = 'history';
                editForm.value = null;
                await loadData();
            } finally { loading.value = false; }
        };

        const resetForm = () => {
            form.value = {
                type: '支出', currency: 'JPY', amount: '', spendDate: getLocalISOString(),
                categoryId: 'cat_001', name: '', note: '', paymentMethod: '',
                isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false,
                projectId: '',
                action: 'add'
            };
            editForm.value = null;
        };

        const handleEditItem = (item) => {
            const formattedDate = item.spendDate ? item.spendDate.replace(/\//g, "-").replace(" ", "T") : getLocalISOString();
            const hasSplit = item.friendName && item.friendName.trim() !== "";
            editForm.value = JSON.parse(JSON.stringify({
                ...item,
                spendDate: formattedDate,
                amount: (item.originalCurrency === 'TWD' ? item.amountTWD : item.amountJPY),
                currency: item.originalCurrency || 'JPY',
                action: 'edit',
                isSplit: hasSplit,
                projectId: item.projectId || ''
            }));
            currentTab.value = 'edit';
        };

        const getTabIcon = (t) => {
            const icons = { overview: 'dashboard', history: 'list_alt', add: 'add', stats: 'bar_chart', settings: 'settings', 'project-detail': 'flight_takeoff' };
            return icons[t] || 'help';
        };

        onMounted(loadData);

        return {
            currentTab, loading, categories, friends, paymentMethods, projects, transactions, filteredTransactions, historyFilter, form, editForm, stats, systemConfig, fxRate, selectedProject,
            handleSubmit, handleDelete, handleEditItem,
            formatNumber: (n) => new Intl.NumberFormat().format(Math.round(n || 0)),
            getTabIcon,
            toggleCurrency: () => form.value.currency = (form.value.currency === 'JPY' ? 'TWD' : 'JPY'),
            handleAddFriendToList: (n) => { if (!friends.value.includes(n)) friends.value.push(n) },
            resetForm,
            handleDrillDown: (id) => { historyFilter.value = { mode: 'all', categoryId: id, friendName: null, currency: null, keyword: '' }; currentTab.value = 'history'; },
            handleUpdateConfig: async (c) => { loading.value = true; await API.saveTransaction({ action: 'updateConfig', ...c }); await loadData(); },
            handleViewFriend: (n) => { historyFilter.value = { mode: 'all', categoryId: null, friendName: n, currency: null, keyword: '' }; currentTab.value = 'history'; },
            handleViewProject: (p) => { selectedProject.value = p; currentTab.value = 'project-detail'; },
            handleUpdateProject: async () => { await loadData(); },
            handleCreateProject: async (name) => {
                if (!name) return;
                loading.value = true;
                try {
                    await API.saveTransaction({
                        action: 'updateProject',
                        name: name,
                        startDate: getLocalISOString().split('T')[0],
                        endDate: getLocalISOString().split('T')[0]
                    });
                    await loadData();
                    alert("Project Created!");
                } catch (e) {
                    alert("Error creating project: " + e);
                } finally {
                    loading.value = false;
                }
            }
        };
    }
}).mount('#app');
