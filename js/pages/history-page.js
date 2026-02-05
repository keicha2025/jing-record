export const HistoryPage = {
    template: `
    <section class="space-y-4 py-4 animate-in fade-in pb-24 min-h-[60vh]">
        <!-- 搜尋與篩選列 -->
        <!-- 搜尋與篩選列 -->
        <div class="space-y-2">
            <div class="flex space-x-2">
                <div class="flex-1 bg-white rounded-xl flex items-center px-3 py-2">
                    <span class="material-symbols-rounded text-gray-300 text-lg">search</span>
                    <input type="text" v-model="localFilter.keyword" class="w-full text-xs ml-2 outline-none text-gray-600 placeholder-gray-300">
                </div>
                <!-- 篩選器切換 -->
                <div class="relative">
                    <select v-model="localFilter.mode" class="appearance-none bg-white border border-gray-50 shadow-sm text-xs text-center font-medium text-gray-500 rounded-xl px-4 py-2 pr-8 outline-none h-full">
                        <option value="all">全部</option>
                        <option value="general">一般</option>
                        <option value="project">專案</option>
                    </select>
                    <span class="absolute right-2 top-1/2 transform -translate-y-1/2 material-symbols-rounded text-gray-300 text-sm pointer-events-none">expand_more</span>
                </div>
            </div>
        </div>

        <!-- 分組顯示列表 -->
        <div v-if="groupedTransactions.length === 0" class="text-center py-20">
            <span class="text-xs text-gray-300">沒有符合的紀錄</span>
        </div>

        <div v-else v-for="(group, dateKey) in groupedTransactions" :key="dateKey" class="space-y-3">
             <div class="sticky top-0 z-10 px-2 py-1 bg-white/50 backdrop-blur-sm -mx-4 mb-2">
                 <span class="text-[10px] font-medium text-gray-400 bg-[#F7F7F7] px-2 py-1 rounded-full ml-4 shadow-sm">{{ formatMonth(group.month) }}</span>
             </div>
             
             <div v-for="item in group.items" :key="item.id" 
                  @click="$emit('edit-item', item)"
                  class="bg-white p-5 rounded-[1.8rem] muji-shadow flex justify-between items-center active:scale-[0.98] transition-all">
                <div class="flex items-center space-x-4">
                    <div class="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center">
                        <span class="material-symbols-rounded text-gray-400 text-xl">{{ getIcon(item.categoryId) }}</span>
                    </div>
                    <div class="flex flex-col min-w-0 flex-1 pr-2">
                        <span class="text-sm font-medium text-gray-700 truncate block">{{ item.name }}</span>
                        <div class="flex flex-wrap items-center gap-x-2 mt-0.5 text-[9px]">
                            <span class="text-gray-300 whitespace-nowrap">{{ item.spendDate.split('T')[0] }} · {{ getPaymentName(item.paymentMethod) }}</span>
                            <span v-if="item.payer !== '我' && item.type === '支出'" class="bg-gray-100 text-gray-500 px-1.5 rounded whitespace-nowrap">{{ item.payer }} 付款</span>
                            <span v-if="item.type === '收款'" class="bg-gray-100 text-gray-400 px-1.5 rounded whitespace-nowrap">{{ item.friendName }} 還款</span>
                            <span v-if="item.projectId" class="text-gray-300 truncate max-w-[80px]">{{ getProjectName(item.projectId) }}</span>
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium" :class="getSignClass(item.type)">
                        {{ getSign(item.type) }} {{ getCurrencySymbol(item.originalCurrency) }} {{ formatNumber(item.type === '收款' ? item.amountJPY : item.personalShare) }}
                    </p>
                    <div v-if="item.debtAmount !== 0" class="text-[8px] mt-0.5 font-medium" :class="item.debtAmount > 0 ? 'text-gray-400' : 'text-red-300'">
                        {{ item.debtAmount > 0 ? '債權 +' : '債務 ' }} ¥ {{ formatNumber(Math.abs(item.debtAmount)) }}
                    </div>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories', 'paymentMethods', 'projects'],
    data() {
        return {
            localFilter: { keyword: '', mode: 'all' }
        };
    },
    computed: {
        groupedTransactions() {
            const groups = {};
            this.transactions.forEach(t => {
                const date = t.spendDate || ''; // YYYY-MM-DDTHH:mm
                const monthKey = date.slice(0, 7); // YYYY-MM
                if (!groups[monthKey]) groups[monthKey] = [];
                groups[monthKey].push(t);
            });
            // Sort keys desc (Latest month first)
            return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => ({
                month: key,
                items: groups[key].sort((a, b) => b.spendDate.localeCompare(a.spendDate))
            }));
        }
    },
    watch: {
        localFilter: {
            handler(newVal) {
                // We need to update parent filter state. 
                // Since parent passes 'filteredTransactions', filtering logic is actually in parent!
                // Wait, if I filter in parent, I should emit filter changes.
                // Currently parent computed 'filteredTransactions' uses 'historyFilter' ref.
                // So I need to modify that ref.
                // Best way: emit 'update-filter'
                this.$emit('update-filter', newVal);
            },
            deep: true
        }
    },
    methods: {
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; },
        getProjectName(id) {
            if (!this.projects) return '';
            const p = this.projects.find(proj => proj.id === id);
            return p ? p.name : '';
        },
        getIcon(id) {
            const cat = this.categories.find(c => c.id === id);
            return cat ? cat.icon : 'payments';
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getSign(type) { return type === '支出' ? '-' : '+'; },
        getCurrencySymbol(curr) { return curr === 'TWD' ? '$' : '¥'; },
        getSignClass(type) { return type === '支出' ? 'text-gray-600' : 'text-gray-400'; },
        formatMonth(ym) {
            if (!ym) return '未知日期';
            // ym is YYYY-MM
            const parts = ym.split('-');
            if (parts.length >= 2) {
                return `${parts[0]}年 ${parts[1]}月`;
            }
            return ym;
        }
    }
};
