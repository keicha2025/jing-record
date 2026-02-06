import { CONFIG } from './config.js?v=1.3';
import { API } from './api.js';
import { AddPage } from './pages/add-page.js';
import { EditPage } from './pages/edit-page.js';
import { HistoryPage } from './pages/history-page.js';
import { StatsPage } from './pages/stats-page.js';
import { SettingsPage } from './pages/settings-page.js';
import { OverviewPage } from "./pages/overview-page.js";
import { ProjectDetailPage } from './pages/project-detail-page.js';

import { ViewDashboard } from './pages/view-dashboard.js';
import { SystemModal } from './components/system-modal.js';
import { AppHeader } from './components/app-header.js';
import { AppFooter } from './components/app-footer.js';

const { createApp, ref, onMounted, computed, provide } = window.Vue;

createApp({
    components: {
        'overview-page': OverviewPage,
        'add-page': AddPage,
        'edit-page': EditPage,
        'history-page': HistoryPage,
        'stats-page': StatsPage,
        'settings-page': SettingsPage,

        'project-detail-page': ProjectDetailPage,
        'view-dashboard': ViewDashboard,
        'project-detail-page': ProjectDetailPage,
        'view-dashboard': ViewDashboard,
        'system-modal': SystemModal,
        'app-header': AppHeader,
        'app-footer': AppFooter
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

        // Scroll to top on tab change
        window.Vue.watch(currentTab, () => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        });

        const categories = ref([]);
        const friends = ref([]);
        const paymentMethods = ref([]);
        const projects = ref([]);
        const transactions = ref([]);
        const fxRate = ref(CONFIG.TWD_FIXED_RATE);
        const stats = ref({ monthlyLifeTotal: 0, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 });
        const historyFilter = ref({ mode: 'all', categoryId: null, friendName: null, currency: null, keyword: '' });
        // Load Guest Config
        const savedGuestConfig = JSON.parse(localStorage.getItem('guest_config') || '{}');
        const systemConfig = ref({
            user_name: savedGuestConfig.user_name || '',
            fx_rate: savedGuestConfig.fx_rate || 0.22,
            import_default: savedGuestConfig.import_default || false
        });

        const editForm = ref(null);
        const selectedProject = ref(null);


        // --- Global Dialog System ---
        const modalState = ref({
            visible: false,
            config: {
                type: 'info', // success, error, confirm, transaction_success
                title: '',
                message: '',
                confirmText: '確認',
                secondaryText: '',
                showCancel: false,
                data: null
            },
            resolve: null // For Promise-based confirm
        });

        const dialog = {
            alert: (message, type = 'error', title = '') => {
                return new Promise(resolve => {
                    modalState.value.config = {
                        type,
                        title: title || (type === 'error' ? '錯誤' : '提示'),
                        message,
                        confirmText: '確認',
                        secondaryText: '',
                        showCancel: false
                    };
                    modalState.value.resolve = resolve; // Resolve on confirm
                    modalState.value.visible = true;
                });
            },
            confirm: (message, title = '確認') => {
                return new Promise(resolve => {
                    modalState.value.config = {
                        type: 'confirm',
                        title,
                        message,
                        confirmText: '確定',
                        secondaryText: '取消',
                        showCancel: true // explicitly show cancel
                    };
                    modalState.value.resolve = resolve;
                    modalState.value.visible = true;
                });
            },
            // Specialized for Transaction Success (Added customizable options)
            showTransactionSuccess: (item, onSecondaryAction, options = {}) => {
                modalState.value.config = {
                    type: 'transaction_success',
                    title: options.title || '已新增',
                    message: '', // use custom data slot
                    confirmText: options.confirmText || '確認',
                    secondaryText: options.secondaryText || '看明細',
                    showCancel: false,
                    data: item,
                    onSecondary: onSecondaryAction
                };
                // If onConfirm is provided in options, use it. Otherwise default to simple resolve (Close).
                modalState.value.resolve = options.onConfirm ? options.onConfirm : () => { };
                modalState.value.visible = true;
            }
        };
        provide('dialog', dialog);

        const handleModalConfirm = () => {
            modalState.value.visible = false;
            if (modalState.value.resolve) modalState.value.resolve(true);
        };

        const handleModalCancel = () => {
            modalState.value.visible = false;
            // secondary action is usually "Cancel", but here it's "Secondary Action"
            if (modalState.value.config.onSecondary) {
                modalState.value.config.onSecondary();
            }
            if (modalState.value.resolve) modalState.value.resolve(false);
        };

        const form = ref({
            type: '支出', currency: 'JPY', amount: '', spendDate: getLocalISOString(),
            categoryId: 'cat_001', name: '', note: '', paymentMethod: '',
            isOneTime: false, isSplit: false, friendName: '', personalShare: 0, payer: '我', isAlreadyPaid: false,
            projectId: '',
            action: 'add'
        });

        const adminToken = ref(localStorage.getItem('admin_token') || '');
        const syncQueue = ref(JSON.parse(localStorage.getItem('sync_queue') || '[]'));
        const syncStatus = ref('idle'); // idle, syncing, error

        // Determine App Mode
        const appMode = computed(() => {
            if (adminToken.value) return 'ADMIN';
            if (window.location.href.includes('view') || window.location.search.includes('mode=view')) return 'VIEWER';
            return 'GUEST';
        });

        // Initialize from URL token if present (Device Registration)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('key')) {
            const key = urlParams.get('key');
            localStorage.setItem('admin_token', key);
            adminToken.value = key;
            window.history.replaceState({}, '', window.location.pathname); // Clean URL
        }

        const filteredTransactions = computed(() => {
            // Viewer Mode logic: show only what's loaded (which is masked by backend)
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
            if (filter.friendName) {
                list = list.filter(t =>
                    (t.friendName && t.friendName.includes(filter.friendName)) ||
                    (t.payer && t.payer === filter.friendName)
                );
            }
            if (filter.currency) list = list.filter(t => t.originalCurrency === filter.currency);

            // Keyword Search (Enhanced with Project Support)
            if (filter.keyword) {
                const k = filter.keyword.toLowerCase();

                // Find matching projects
                const matchingProjectIds = projects.value
                    .filter(p => p.name.toLowerCase().includes(k) || p.id.toLowerCase() === k)
                    .map(p => p.id);

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
                        pmName.includes(k) ||
                        (t.projectId && matchingProjectIds.includes(t.projectId)) || // Match by Project Name
                        (t.projectId && t.projectId.toLowerCase() === k) // Match by Exact ID
                    );
                });
            }

            return list;
        });

        // ... loadData ...

        const handleViewHistory = (keyword) => {
            // If keyword looks like a project ID (e.g., starts with proj_), stick to it.
            // Or just put it in keyword field.
            historyFilter.value = { mode: 'all', categoryId: null, friendName: null, currency: null, keyword: keyword };
            currentTab.value = 'history';
        };

        const loadData = async () => {
            loading.value = true;
            try {
                if (appMode.value === 'GUEST') {
                    // Load from LocalStorage for Guest Persistence
                    const localData = localStorage.getItem('guest_data');
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        transactions.value = parsed.transactions || [];
                        // Recalculate stats for guest? Or just mock.
                        // Simplified calc for guest stats
                        let total = 0;
                        transactions.value.forEach(t => { if (!t.isOneTime && t.type === '支出') total += parseFloat(t.amountJPY); });
                        stats.value = { monthlyLifeTotal: total, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 };
                    } else {
                        transactions.value = [];
                    }
                    if (systemConfig.value.import_default) {
                        try {
                            const data = await API.fetchInitialData('');
                            categories.value = data.categories || [];
                            paymentMethods.value = data.paymentMethods || [];

                            // If ON, also import Projects and Masked Transactions
                            // Friends? User didn't explicitly forbid, but said "OFF only Cat+PM". So ON implies others ok.
                            // But usually Guest wants clean slate friend list?
                            // Let's import friends if ON so dropdowns work, but transactions are anonymized.
                            friends.value = data.friends || [];
                            projects.value = data.projects || [];

                            // 【Fix】Import FX Rate for Guest Demo
                            // 【Fix】Import FX Rate for Guest Demo
                            if (data.config) {
                                // Logic: Only apply remote config if user hasn't customized local settings
                                // We trust 'savedGuestConfig' loaded at start or current 'systemConfig' state
                                const currentLocal = systemConfig.value;

                                // Merge remote config but let local values take precedence if they exist
                                // Specifically handle FX Rate and Name
                                const newConfig = { ...data.config, ...currentLocal };

                                // If local fx_rate is default (0.22) and remote is different, maybe update?
                                // User rule: "If guest changed it... use guest".
                                // If guest hasn't changed it (value is 0.22 default), and remote is different (e.g. 0.21), use remote?
                                // But how do we know if 0.22 is "touched" or "default"?
                                // Simplest robust way: If we are importing, we assume we want data.
                                // But if user *explicitly* went to settings and hit update, it's saved in local storage.
                                // Let's check `savedGuestConfig` from localStorage directly (it was parsed at setup).
                                // If `savedGuestConfig.fx_rate` exists, use it.

                                if (savedGuestConfig.fx_rate) {
                                    newConfig.fx_rate = savedGuestConfig.fx_rate;
                                } else if (data.config.fx_rate) {
                                    // No local override, use remote
                                    newConfig.fx_rate = parseFloat(data.config.fx_rate);
                                }

                                if (savedGuestConfig.user_name) {
                                    newConfig.user_name = savedGuestConfig.user_name;
                                }

                                systemConfig.value = newConfig;
                                fxRate.value = parseFloat(systemConfig.value.fx_rate);
                            }

                            const fetchedTransactions = data.transactions || [];
                            if (fetchedTransactions.length > 0) {
                                // Alias Logic (Override masking above to be smarter)
                                const aliasMap = new Map();
                                let aliasCount = 1;
                                const getAlias = (name) => {
                                    if (!name || name === '我') return name;
                                    if (!aliasMap.has(name)) { // Assign new alias
                                        aliasMap.set(name, '友' + aliasCount++);
                                    }
                                    return aliasMap.get(name);
                                };

                                transactions.value = fetchedTransactions.map(t => ({
                                    ...t,
                                    note: '',
                                    friendName: getAlias(t.friendName),
                                    payer: getAlias(t.payer) // Map payer to alias if it's a friend
                                }));

                                // Update friends list to match aliases
                                friends.value = Array.from(aliasMap.values()).filter(n => n !== '我');

                                // Recalculate basic stats
                                let total = 0;
                                transactions.value.forEach(t => { if (!t.isOneTime && t.type === '支出') total += parseFloat(t.amountJPY); });
                                stats.value = { monthlyLifeTotal: total, allOneTimeTotal: 0, debtTotal: 0, totalInvestment: 0 };
                            } else {
                                transactions.value = [];
                            }
                        } catch (e) {
                            console.error("Failed to fetch defaults", e);
                            dialog.alert("無法取得預設資料：請檢查網路或 Google Script 權限 (需設為 Anyone)", 'error');
                            // Fallback
                            categories.value = [{ id: 'cat_001', name: '餐飲' }, { id: 'cat_999', name: '其他' }];
                            friends.value = [];
                            paymentMethods.value = [{ id: 'pm_01', name: '現金' }];
                        }
                    } else {
                        // OFF: Only Categories & Payment Methods
                        categories.value = [
                            { id: 'cat_001', name: '餐飲', icon: 'restaurant' },
                            { id: 'cat_002', name: '交通', icon: 'train' },
                            { id: 'cat_003', name: '購物', icon: 'shopping_bag' },
                            { id: 'cat_004', name: '娛樂', icon: 'movie' },
                            { id: 'cat_999', name: '其他', icon: 'more_horiz' }
                        ];
                        // Ensure icons are present for UI stability
                        friends.value = [];
                        projects.value = [];
                        paymentMethods.value = [{ id: 'pm_01', name: '現金' }, { id: 'pm_02', name: 'PayPay' }];
                        transactions.value = []; // Clear transactions if OFF
                    }
                    projects.value = [];
                    return;
                }

                // Pass token to fetch logic (Backend handles masking if invalid)
                const data = await API.fetchInitialData(adminToken.value);
                categories.value = data.categories || [];
                friends.value = data.friends || [];
                paymentMethods.value = data.paymentMethods || [];
                projects.value = data.projects || [];

                // Merge synced transactions with potential guest ones?
                // No, Guest mode resets on refresh, so we just take remote data as base.
                transactions.value = data.transactions || [];

                if (data.stats) stats.value = data.stats;
                if (data.config) {
                    systemConfig.value = data.config;
                    fxRate.value = parseFloat(data.config.fx_rate);
                }

                if (data.is_admin === false && adminToken.value) {
                    await dialog.alert("管理員憑證無效 (Invalid Token)", 'error');
                    localStorage.removeItem('admin_token');
                    window.location.reload();
                    return;
                }

                // If Viewer, force switch to overview
                if (appMode.value === 'VIEWER') currentTab.value = 'overview';

            } finally { loading.value = false; }
        };

        const processSyncQueue = async () => {
            if (syncQueue.value.length === 0) return;
            syncStatus.value = 'syncing';

            // process queue sequentially
            const queue = [...syncQueue.value];
            const remaining = [];

            for (const item of queue) {
                try {
                    await API.saveTransaction(item, adminToken.value);
                } catch (e) {
                    console.error("Sync failed for item", item, e);
                    remaining.push(item);
                    syncStatus.value = 'error';
                }
            }

            syncQueue.value = remaining;
            localStorage.setItem('sync_queue', JSON.stringify(remaining));
            if (remaining.length === 0) syncStatus.value = 'idle';
        };

        const handleSubmit = async (targetForm) => {
            if (appMode.value === 'VIEWER') return;

            const dataToSave = targetForm || form.value;
            if (!dataToSave.amount || !dataToSave.name) return;

            // Prepare Payload
            const payload = {
                ...dataToSave,
                amountJPY: dataToSave.currency === 'JPY' ? dataToSave.amount : dataToSave.amount / fxRate.value,
                amountTWD: dataToSave.currency === 'TWD' ? dataToSave.amount : dataToSave.amount * fxRate.value,
                id: dataToSave.id || "tx_" + new Date().getTime(), // Client-side ID generation
                spendDate: dataToSave.spendDate // Keep string or date? Backend expects string readable by new Date()
            };

            // OPTIMISTIC UPDATE: Update local state immediately
            if (dataToSave.action === 'edit') {
                const idx = transactions.value.findIndex(t => t.id === payload.id);
                if (idx !== -1) transactions.value[idx] = {
                    ...payload,
                    row: transactions.value[idx].row // keep row for GAS deletion if needed?
                    // Actually row number might change on server.
                    // Ideally we don't rely on row number for edits if we use ID, but GAS needs row.
                    // For optimistic UI, we just update the list.
                };
            } else {
                transactions.value.unshift({ ...payload, row: 9999 }); // Dummy row
            }

            if (appMode.value === 'ADMIN') {
                // Push to sync queue
                syncQueue.value.push(payload);
                localStorage.setItem('sync_queue', JSON.stringify(syncQueue.value));
                processSyncQueue(); // Trigger background sync
            } else if (appMode.value === 'GUEST') {
                try {
                    // Guest mode: Save to LocalStorage
                    localStorage.setItem('guest_data', JSON.stringify({ transactions: transactions.value }));
                } catch (e) {
                    console.error("Guest Save Error", e);
                    alert("儲存失敗");
                }
            }

            const goHistory = () => { currentTab.value = 'history'; resetForm(); };
            const doReload = () => { window.location.reload(); };

            if (dataToSave.action === 'edit') {
                dialog.showTransactionSuccess({ ...dataToSave }, doReload, {
                    title: '已更新',
                    confirmText: '返回明細',
                    secondaryText: '重新整理',
                    onConfirm: goHistory
                });
            } else {
                // Show Success Modal for Add
                // Secondary (View Details) -> goHistory
                // Confirm -> just close (resetForm called below already)
                dialog.showTransactionSuccess({ ...dataToSave }, goHistory, {
                    title: '已新增',
                    confirmText: '確認',
                    secondaryText: '看明細'
                });
                resetForm();
            }
            // Don't await loadData() - separate read/write
        };

        const handleDelete = async (row) => {
            if (appMode.value === 'VIEWER') return;

            // Find Item for success dialog
            const item = transactions.value.find(t => t.row === row);

            if (appMode.value === 'GUEST') {
                if (!confirm("體驗模式：確定刪除？")) return;
                // Optimistic Delete for Guest
                transactions.value = transactions.value.filter(t => t.row !== row);
                localStorage.setItem('guest_data', JSON.stringify({ transactions: transactions.value }));
                // Show Success Dialog for Guest
                if (item) {
                    dialog.showTransactionSuccess(item, () => { currentTab.value = 'history'; editForm.value = null; }, {
                        title: '已刪除', confirmText: '返回明細', secondaryText: ''
                    });
                }
                return;
            }

            if (!await dialog.confirm("確定要永久刪除此筆資料嗎？")) return;

            // Optimistic Delete
            transactions.value = transactions.value.filter(t => t.row !== row); // This is risky if row is used as ID.
            // Better to rely on IDs if possible, but existing backend uses Row.
            // For now, assume Row is correct for existing items.

            if (appMode.value === 'ADMIN') {
                syncQueue.value.push({ action: 'delete', row: row });
                localStorage.setItem('sync_queue', JSON.stringify(syncQueue.value));
                processSyncQueue();
            }

            // Show Success Dialog
            if (item) {
                const goHistory = () => { currentTab.value = 'history'; editForm.value = null; };
                const doReload = () => { window.location.reload(); };

                dialog.showTransactionSuccess(item, doReload, {
                    title: '已刪除',
                    confirmText: '返回明細',
                    secondaryText: '重新整理',
                    onConfirm: goHistory
                });
            }
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
            appMode, syncStatus, syncQueue,
            handleSubmit, handleDelete, handleEditItem,
            formatNumber: (n) => new Intl.NumberFormat().format(Math.round(n || 0)),
            getTabIcon,
            toggleCurrency: () => form.value.currency = (form.value.currency === 'JPY' ? 'TWD' : 'JPY'),
            handleAddFriendToList: (n) => { if (!friends.value.includes(n)) friends.value.push(n) },
            resetForm,
            handleDrillDown: (id) => { historyFilter.value = { mode: 'all', categoryId: id, friendName: null, currency: null, keyword: '' }; currentTab.value = 'history'; },

            modalState, handleModalConfirm, handleModalCancel,

            handleUpdateConfig: async (c) => {
                if (appMode.value === 'GUEST') {
                    systemConfig.value = { ...systemConfig.value, ...c };
                    localStorage.setItem('guest_config', JSON.stringify(systemConfig.value));
                    await loadData();
                    dialog.alert("設定已更新 (Guest)", 'success');
                    return;
                }
                if (appMode.value !== 'ADMIN') return dialog.alert("權限不足", 'error');
                loading.value = true;
                await API.saveTransaction({ action: 'updateConfig', ...c, token: adminToken.value });
                await loadData();
            },
            handleViewFriend: (n) => { historyFilter.value = { mode: 'all', categoryId: null, friendName: n, currency: null, keyword: '' }; currentTab.value = 'history'; },
            handleViewProject: (p) => { selectedProject.value = p; currentTab.value = 'project-detail'; },
            handleViewHistory,
            handleUpdateProject: async () => { await loadData(); },
            handleRegisterDevice: (pwd) => {
                if (!pwd) return;
                // Store provisional token
                localStorage.setItem('admin_token', pwd);
                adminToken.value = pwd;
                adminToken.value = pwd;
                window.location.reload();
            },
            clearGuestData: async () => {
                if (await dialog.confirm("確定要清除所有訪客資料嗎？", "清除資料")) {
                    localStorage.removeItem('guest_data');
                    window.location.reload();
                }
            },
            retrySync: processSyncQueue,
            handleCreateProject: async (name) => {
                if (appMode.value !== 'ADMIN') return dialog.alert("權限不足");
                if (!name) return;
                loading.value = true;
                try {
                    await API.saveTransaction({
                        action: 'updateProject',
                        name: name,
                        startDate: getLocalISOString().split('T')[0],
                        endDate: getLocalISOString().split('T')[0]
                    }, adminToken.value);
                    await loadData();
                    dialog.alert("Project Created!", 'success');
                } catch (e) {
                    dialog.alert("Error creating project: " + e, 'error');
                } finally {
                    loading.value = false;
                }
            }
        };
    }
}).mount('#app');
