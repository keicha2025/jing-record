import { CONFIG } from '../config.js';

export const ViewSettingsPage = {
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24 relative">
        
        <!-- 0. System Config (Simplified) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6 pt-10">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">System Config</h3>
            
            <div class="space-y-4">
                <!-- 2. FX Rate (Read Only) -->
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs text-gray-500">當前匯率 (1 JPY = ? TWD)</span>
                    <span class="text-xs font-medium text-gray-600 font-mono">{{ displayRate }}</span>
                </div>
            </div>
            <!-- Update Button Removed -->
        </div>

        <!-- 1. Projects (Read Only) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium px-2">旅行計畫</h3>
            
            <div class="space-y-3">
                 <div v-if="!projects || projects.length === 0" class="text-xs text-gray-300 px-2">無專案</div>
                 <div v-for="p in projects" :key="p.id" 
                      @click="$emit('view-project', p)"
                      class="flex justify-between items-center p-3 bg-gray-50 rounded-xl active:bg-gray-100 transition-colors cursor-pointer">
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ p.name }}</span>
                        <span class="text-[9px] text-gray-400">{{ p.startDate }} ~ {{ p.endDate }}</span>
                    </div>
                    <span :class="p.status === 'Active' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-200 text-gray-500'" class="text-[9px] px-2 py-1 rounded-full">{{ getStatusLabel(p.status) }}</span>
                 </div>
            </div>
        </div>

        <!-- 2. Friends List (Read Only) -->
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

        <!-- 3. External Links -->
        <div class="px-2 space-y-3">
            <a :href="sheetUrl" target="_blank" class="flex items-center justify-between p-5 bg-white rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <div class="flex items-center space-x-3">
                    <span class="material-symbols-rounded text-green-600">table_view</span>
                    <span class="text-xs text-gray-500 font-medium">打開 Google 試算表</span>
                </div>
                <span class="material-symbols-rounded text-gray-200 text-sm">open_in_new</span>
            </a>
        </div>
    </section>
    `,
    props: ['config', 'friends', 'projects', 'transactions', 'appMode', 'fxRate'],
    data() {
        return {
            sheetUrl: CONFIG.SPREADSHEET_URL
        };
    },
    computed: {
        displayRate() {
            // Prefer fxRate prop if available, else config
            return this.fxRate || (this.config && this.config.fx_rate) || 0.22;
        }
    },
    methods: {
        getStatusLabel(status) {
            const map = { 'Active': '進行中', 'Archived': '已封存', 'Planned': '計劃中' };
            return map[status] || status;
        }
    }
};
