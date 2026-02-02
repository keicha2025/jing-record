export const HistoryPage = {
    template: `
    <section class="space-y-4 py-4 animate-in fade-in">
        <div v-for="item in transactions" :key="item.id" 
             @click="$emit('edit-item', item)"
             class="bg-white p-5 rounded-[1.8rem] muji-shadow flex justify-between items-center active:scale-[0.98] transition-all">
            <div class="flex items-center space-x-4">
                <div class="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center">
                    <span class="material-symbols-rounded text-gray-400 text-xl">{{ getIcon(item.categoryId) }}</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-gray-700">{{ item.name }}</span>
                    <div class="flex flex-wrap items-center gap-x-2 mt-0.5 text-[9px]">
                        <span class="text-gray-300">{{ item.spendDate }}</span>
                        <span v-if="item.payer !== '我' && item.type === '支出'" class="bg-gray-100 text-gray-500 px-1.5 rounded">{{ item.payer }} 付款</span>
                        <span v-if="item.type === '收款'" class="bg-gray-100 text-gray-400 px-1.5 rounded">{{ item.friendName }} 還款</span>
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
    </section>
    `,
    props: ['transactions', 'categories'],
    methods: {
        getIcon(id) {
            const cat = this.categories.find(c => c.id === id);
            return cat ? cat.icon : 'payments';
        },
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getSign(type) { return type === '支出' ? '-' : '+'; },
        getCurrencySymbol(curr) { return curr === 'TWD' ? '$' : '¥'; }, // 新增幣別符號判斷
        getSignClass(type) { return type === '支出' ? 'text-gray-600' : 'text-gray-400'; }
    }
};
