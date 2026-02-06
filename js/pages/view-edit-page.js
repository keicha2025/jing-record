import { CONFIG } from '../config.js';

export const ViewEditPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6">
            <!-- Header Controls Integrated in Card -->
            <div class="flex justify-between items-center px-1 border-b border-gray-50 pb-4">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">
                    查看紀錄
                </span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">
                    關閉
                </button>
            </div>

            <!-- 1. 金額 -->
            <div class="text-center py-2">
                <p class="text-[10px] text-gray-300 mb-2">{{ form.type }}金額</p>
                <div class="text-5xl font-light text-gray-700">
                    <span class="text-xl mr-1">{{ form.currency === 'TWD' ? '$' : '¥' }}</span>{{ formatNumber(form.amount) }}
                </div>
            </div>

            <div class="space-y-5">
                <!-- 2. 付款/收款對象 -->
                <div class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                        {{ form.type === '收款' ? '收款對象' : '付款人' }}
                    </label>
                    <div class="text-sm text-gray-600">
                        {{ form.type === '收款' ? form.friendName : form.payer }}
                    </div>
                </div>

                <!-- 3. 日期 -->
                <div class="flex items-center justify-between px-2 py-2 border-b border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">消費日期</span>
                    <div class="text-sm text-gray-600">{{ form.spendDate.replace('T', ' ') }}</div>
                </div>

                <!-- 4. [補回] 分類 -->
                <div v-if="form.type !== '收款'" class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">分類</label>
                    <div class="flex items-center space-x-2 text-sm text-gray-600">
                        <span class="material-symbols-rounded text-base text-gray-400">{{ getCategoryIcon(form.categoryId) }}</span>
                        <span>{{ getCategoryName(form.categoryId) }}</span>
                    </div>
                </div>

                <div class="px-2 space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">項目名稱</label>
                        <div class="text-sm text-gray-600">{{ form.name }}</div>
                    </div>
                    
                    <!-- 5. [補回] 支付方式 -->
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">支付方式</label>
                        <div class="text-sm text-gray-600">{{ getPaymentName(form.paymentMethod) }}</div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">備註</label>
                        <div class="text-xs text-gray-400 whitespace-pre-wrap">{{ form.note || '無備註' }}</div>
                    </div>
                </div>

                <!-- 6. 分帳 (同步新增頁面進階功能) -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between px-2">
                        <span class="text-xs text-gray-400">幫朋友代墊 / 需分帳</span>
                        <div class="text-xs text-gray-500">{{ form.isSplit ? '有' : '無' }}</div>
                    </div>
                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6 mx-2">
                        <div class="text-xs text-gray-600">{{ form.friendName }}</div>
                        
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span class="text-[10px] text-gray-400">我的份額</span>
                            <span class="text-sm font-medium">¥ {{ formatNumber(form.personalShare) }}</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-[10px] text-gray-400">對方已當場付清</span>
                            <div class="text-[10px] text-gray-500">{{ form.isAlreadyPaid ? '是' : '否' }}</div>
                        </div>
                    </div>
                </div>

                <!-- 7. 旅行計畫模式 -->
                <div v-if="currentProjectName" class="px-2 pt-2 border-t border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">旅行計畫</span>
                    <span class="bg-[#4A4A4A] text-white px-4 py-1.5 rounded-full text-[10px] inline-block">{{ currentProjectName }}</span>
                </div>
            </div>

            <!-- Removed Edit Buttons -->
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading', 'paymentMethods', 'projects'],
    data() {
        return {
            // Simplified data (removed edit states)
        };
    },
    computed: {
        currentProjectName() {
            if (!this.form.projectId) return null;
            const p = (this.projects || []).find(pr => pr.id === this.form.projectId);
            return p ? p.name : this.form.projectId;
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getCategoryName(id) { return this.categories.find(c => c.id === id)?.name || '未分類'; },
        getCategoryIcon(id) { return this.categories.find(c => c.id === id)?.icon || 'sell'; },
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; }
    }
};
