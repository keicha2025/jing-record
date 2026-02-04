import { CONFIG } from '../config.js';
import { API } from '../api.js';

export const SettingsPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <!-- 1. 基本設定卡片 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">System Config</h3>
            
            <div class="space-y-4">
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs text-gray-500">使用者名稱</span>
                    <input type="text" v-model="localConfig.user_name" class="text-right text-xs bg-gray-50 px-3 py-2 rounded-xl outline-none w-32">
                </div>
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs text-gray-500">當前匯率 (1 JPY = ? TWD)</span>
                    <input type="number" v-model="localConfig.fx_rate" step="0.001" class="text-right text-xs bg-gray-50 px-3 py-2 rounded-xl outline-none w-32">
                </div>
            </div>

            <button @click="saveSettings" :disabled="saving" class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-[10px] font-medium tracking-[0.3em] uppercase active:scale-95 transition-all">
                {{ saving ? 'Saving...' : 'Save Settings' }}
            </button>
        </div>

        <!-- 2. 旅行計畫 (Projects) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2 flex justify-between items-center">
                <span>旅行計畫</span>
                <button @click="isAddingProject = !isAddingProject" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-rounded text-lg">{{ isAddingProject ? 'remove' : 'add' }}</span>
                </button>
            </h3>
            
            <!-- 新增專案表單 -->
            <div v-if="isAddingProject" class="bg-gray-50 p-4 rounded-xl space-y-3 animate-in slide-in-from-top-2">
                <input type="text" v-model="newProject.name" placeholder="計畫名稱 (例如: 京都之旅)" class="w-full bg-white px-3 py-2 rounded-lg text-xs outline-none">
                <div class="flex space-x-2">
                    <input type="date" v-model="newProject.startDate" class="flex-1 bg-white px-3 py-2 rounded-lg text-xs outline-none text-gray-500">
                    <span class="text-gray-300 self-center">~</span>
                    <input type="date" v-model="newProject.endDate" class="flex-1 bg-white px-3 py-2 rounded-lg text-xs outline-none text-gray-500">
                </div>
                <button @click="createProject" :disabled="projectSaving" class="w-full bg-gray-800 text-white py-2 rounded-lg text-[10px] tracking-widest uppercase">
                    {{ projectSaving ? '新增中...' : '新增計畫' }}
                </button>
            </div>

            <div class="space-y-3">
                 <div v-if="!projects || projects.length === 0" class="text-xs text-gray-300 px-2">無專案</div>
                 <div v-for="p in projects" :key="p.id" 
                      @click="viewProjectDetail(p)"
                      class="flex justify-between items-center p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors cursor-pointer">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ p.name }}</span>
                        <span class="text-[9px] text-gray-400">{{ p.startDate }} ~ {{ p.endDate }}</span>
                    </div>
                    <span :class="p.status === 'Active' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-200 text-gray-500'" class="text-[9px] px-2 py-1 rounded-full">{{ p.status }}</span>
                 </div>
            </div>
        </div>



        <!-- 3. 朋友名單管理 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">Friends List</h3>
            <div class="grid grid-cols-1 divide-y divide-gray-50">
                <div v-for="f in friends" :key="f" @click="$emit('view-friend', f)" 
                     class="py-4 flex justify-between items-center active:bg-gray-50 transition-colors px-2 cursor-pointer">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span class="material-symbols-rounded text-gray-400 text-sm">person</span>
                        </div>
                        <span class="text-xs text-gray-600 font-medium">{{ f }}</span>
                    </div>
                    <span class="material-symbols-rounded text-gray-200 text-sm">arrow_forward_ios</span>
                </div>
            </div>
        </div>

        <!-- 4. 外部連結 -->
        <div class="px-2 space-y-3">
            <a :href="sheetUrl" target="_blank" class="flex items-center justify-between p-5 bg-white rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <div class="flex items-center space-x-3">
                    <span class="material-symbols-rounded text-green-600">table_view</span>
                    <span class="text-xs text-gray-500 font-medium">打開 Google 試算表</span>
                </div>
                <span class="material-symbols-rounded text-gray-200 text-sm">open_in_new</span>
            </a>
            
            <p class="text-[9px] text-gray-300 text-center leading-relaxed">
                資料儲存於您的私人 Google Sheets 中<br>
                Nichi-Nichi Log v1.3 (Exchange Student Edition)
            </p>
        </div>
    </section>
    `,
    props: ['config', 'friends', 'projects', 'transactions'],
    data() {
        return {
            localConfig: { user_name: '', fx_rate: 0.22 },
            saving: false,
            sheetUrl: CONFIG.SPREADSHEET_URL, // 從 config.js 讀取網址
            isAddingProject: false,
            projectSaving: false,
            newProject: { name: '', startDate: '', endDate: '' },
            selectedProject: null,
            isEditingProject: false,
            editProjectForm: {}
        };
    },
    computed: {
        projectStats() {
            if (!this.selectedProject || !this.transactions) return { total: 0, daily: 0 };

            // Filter transactions for this project
            const txs = this.transactions.filter(t => t.projectId === this.selectedProject.id && t.type === '支出');

            // Calculate total (assuming personalShare is best metric, or amountJPY?) 
            // Usually 'total spending' implies personal cost correctly converted.
            // Let's sum 'amountJPY' for now to keep it JPY base as requested "JPY is primary".
            // Or 'personalShare' derived?
            // "目前專案總花費" -> implied personal total OR total project pool?
            // Given "Personal Ledger" vibes -> using personalShare converted to JPY + amountJPY (if paid by me? no).
            // Simplest: Sum of (amountJPY) for all expense records tagged with this project.
            // Wait, t.amountJPY is the transaction amount. t.personalShare is what I pay.
            // Let's use personalShare (converted to JPY if needed, but personal Share usually stored in base currency or original?)
            // Looking at gas: personalShare is stored directly.
            // Looking at stats: processedList uses convertedAmount.
            // Let's do simple sum of JPY equivalent for simplicity first.
            let total = 0;
            txs.forEach(t => {
                total += parseFloat(t.amountJPY || 0); // Total project spending (group) or personal?
                // Context: Exchange student. Usually cares about "My Spending".
                // But "Project Total" might mean "Cost of trip".
                // Let's use Personal Share but we need to ensure currency alignment.
                // Actually, let's stick to standard amountJPY for visual simplicity as "Trip Cost".
                // If the user paid for others, it's debt. 
                // Let's sum `personalShare` (my cost) + `debtAmount` (if I paid for friends... wait).
                // Use `amountJPY` is safer for "Total money moved for this event".
                // Or `personalShare` ? Let's use `personalShare` which represents "MY Cost".
                // But personalShare is in original currency? No, let's check gas.
                // gas: `personalShare` is number. `originalCurrency` exists.
                // We need to normalize.
                // Re-use logic from stats? Too complex to copy-paste.
                // Let's just sum `amountJPY`. It's the most reliable JPY figure we have.
            });

            // Use date range for daily avg
            const start = new Date(this.selectedProject.startDate);
            const end = new Date(this.selectedProject.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                total: total,
                daily: diffDays > 0 ? total / diffDays : 0
            };
        }
    },
    methods: {
        async saveSettings() {
            this.saving = true;
            try {
                this.$emit('update-config', this.localConfig);
            } finally {
                this.saving = false;
            }
        },
        async createProject() {
            if (!this.newProject.name) return alert("Please enter a name");
            this.projectSaving = true;
            try {
                await API.saveTransaction({
                    action: 'updateProject',
                    name: this.newProject.name,
                    startDate: this.newProject.startDate,
                    endDate: this.newProject.endDate
                });
                this.isAddingProject = false;
                this.newProject = { name: '', startDate: '', endDate: '' };
                alert("Project Added! Please refresh page to see changes.");
                // 理想情況下應該重新 fetch，但這裡暫時重整或等 Parent 更新
            } catch (e) {
                alert("Error: " + e.toString());
            } finally {
                this.projectSaving = false;
            }
        },
        viewProjectDetail(p) {
            this.selectedProject = p;
            this.isEditingProject = false;
            this.editProjectForm = { ...p };
        },
        async saveProjectEdit() {
            this.projectSaving = true;
            try {
                await API.saveTransaction({
                    action: 'updateProject',
                    id: this.editProjectForm.id,
                    name: this.editProjectForm.name,
                    startDate: this.editProjectForm.startDate,
                    endDate: this.editProjectForm.endDate,
                    status: this.editProjectForm.status
                });
                // Update local state immediately for better UX (or wait for reload)
                // Need to emit event to reload data in parent
                this.$emit('update-config', {}); // Hack to trigger reload? No, create dedicated event.
                // SettingsPage emits 'update-config'. Parent handles it by reloading.
                // Let's use that or just alert.
                alert("Project Updated!");
                this.selectedProject = null;
                // Ideally reload data
                this.handleReload(); // We need a way to reload data.
            } catch (e) {
                alert("Error: " + e.toString());
            } finally {
                this.projectSaving = false;
            }
        },
        handleReload() {
            // Emit dummy update to force reload in parent
            this.$emit('update-config', this.localConfig);
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); }
    },
    mounted() {
        this.localConfig = { ...this.config };
    }
};
