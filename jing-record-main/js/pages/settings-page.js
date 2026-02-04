import { CONFIG } from '../config.js';

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
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">Project / Trips</h3>
            <div class="space-y-3">
                 <div v-if="!projects || projects.length === 0" class="text-xs text-gray-300 px-2">無專案</div>
                 <div v-for="p in projects" :key="p.id" class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ p.name }}</span>
                        <span class="text-[9px] text-gray-400">{{ p.startDate }} ~ {{ p.endDate }}</span>
                    </div>
                    <span :class="p.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'" class="text-[9px] px-2 py-1 rounded-full">{{ p.status }}</span>
                 </div>
                 <p class="text-[9px] text-gray-300 px-2 pt-1">*請至 Google Sheets 新增或修改專案</p>
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
    props: ['config', 'friends', 'projects'],
    data() {
        return {
            localConfig: { user_name: '', fx_rate: 0.22 },
            saving: false,
            sheetUrl: CONFIG.SPREADSHEET_URL // 從 config.js 讀取網址
        };
    },
    methods: {
        async saveSettings() {
            this.saving = true;
            try {
                this.$emit('update-config', this.localConfig);
            } finally {
                this.saving = false;
            }
        }
    },
    mounted() {
        this.localConfig = { ...this.config };
    }
};
