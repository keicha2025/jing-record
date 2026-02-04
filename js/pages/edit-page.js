import { CONFIG } from '../config.js';

export const EditPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6">
            <div class="flex justify-between items-center px-2">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium text-gray-400">
                    {{ isReadOnly ? '查看紀錄' : '編輯' + form.type }}
                </span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest">
                    {{ isReadOnly ? '關閉' : '取消' }}
                </button>
            </div>

            <!-- 1. 金額 -->
            <div class="text-center py-6 border-b border-gray-50">
                <p class="text-[10px] text-gray-300 mb-2">{{ form.type }}金額</p>
                <div v-if="isReadOnly" class="text-5xl font-light text-gray-700">
                    <span class="text-xl mr-1">{{ form.currency === 'TWD' ? '$' : '¥' }}</span>{{ formatNumber(form.amount) }}
                </div>
                <div v-else class="flex items-center justify-center space-x-3">
                    <span class="text-xs font-medium text-gray-300">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 2. 付款/收款對象 -->
                <div class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                        {{ form.type === '收款' ? '誰還錢給我' : '付款人' }}
                    </label>
                    <div v-if="isReadOnly" class="text-sm text-gray-600">
                        {{ form.type === '收款' ? form.friendName : form.payer }}
                    </div>
                    <div v-else class="flex flex-wrap gap-2">
                        <template v-if="form.type === '收款'">
                            <button v-for="f in friends" :key="'e-r-'+f" @click="form.friendName = f" :class="form.friendName === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px] transition-all">{{ f }}</button>
                        </template>
                        <template v-else>
                            <button @click="form.payer = '我'" :class="form.payer === '我' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">我</button>
                            <button v-for="f in friends" :key="'e-p-'+f" @click="form.payer = f" :class="form.payer === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        </template>
                    </div>
                </div>

                <!-- 3. 日期 -->
                <div class="flex items-center justify-between px-2 py-2 border-b border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">消費日期</span>
                    <div v-if="isReadOnly" class="text-sm text-gray-600">{{ form.spendDate.replace('T', ' ') }}</div>
                    <input v-else type="datetime-local" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right cursor-pointer">
                </div>

                <!-- 4. [補回] 分類 -->
                <div v-if="form.type !== '收款'" class="space-y-2 px-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">分類</label>
                    <div v-if="isReadOnly" class="flex items-center space-x-2 text-sm text-gray-600">
                        <span class="material-symbols-rounded text-base text-gray-400">{{ getCategoryIcon(form.categoryId) }}</span>
                        <span>{{ getCategoryName(form.categoryId) }}</span>
                    </div>
                    <div v-else class="grid grid-cols-4 gap-4 py-2">
                        <div v-for="cat in filteredCategories" :key="cat.id" @click.stop="form.categoryId = cat.id" :class="form.categoryId === cat.id ? 'bg-[#4A4A4A] text-white shadow-lg' : 'bg-gray-50 text-gray-300'" class="flex flex-col items-center p-3 rounded-2xl transition-all">
                            <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                            <span class="text-[9px] mt-1">{{ cat.name }}</span>
                        </div>
                    </div>
                </div>

                <div class="px-2 space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">項目名稱</label>
                        <div v-if="isReadOnly" class="text-sm text-gray-600">{{ form.name }}</div>
                        <input v-else type="text" v-model="form.name" class="w-full text-sm py-2 border-b border-gray-50 outline-none">
                    </div>
                    
                    <!-- 5. [補回] 支付方式 -->
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">支付方式</label>
                        <div v-if="isReadOnly" class="text-sm text-gray-600">{{ getPaymentName(form.paymentMethod) }}</div>
                        <div v-else class="flex space-x-2 overflow-x-auto no-scrollbar py-2">
                            <button v-for="pm in paymentMethods" :key="pm.id" @click.stop="form.paymentMethod = pm.id"
                                    :class="pm.id === form.paymentMethod ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-300'"
                                    class="whitespace-nowrap px-5 py-2 rounded-full text-[10px] transition-colors">{{ pm.name }}</button>
                        </div>
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">備註</label>
                        <div v-if="isReadOnly" class="text-xs text-gray-400 whitespace-pre-wrap">{{ form.note || '無備註' }}</div>
                        <textarea v-else v-model="form.note" class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>
                    </div>
                </div>

                <!-- 6. 分帳 -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between px-2">
                        <span class="text-xs text-gray-400">幫朋友代墊 / 需分帳</span>
                        <div v-if="!isReadOnly" class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'" @click="form.isSplit = !form.isSplit">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                        <div v-else class="text-xs text-gray-500">{{ form.isSplit ? '有' : '無' }}</div>
                    </div>
                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6 mx-2">
                        <div v-if="!isReadOnly" class="flex flex-wrap gap-2">
                            <button v-for="f in friends" :key="'e-s-'+f" @click="toggleFriendInSplit(f)" :class="selectedFriends.includes(f) ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        </div>
                        <div v-else class="text-xs text-gray-600">{{ form.friendName }}</div>
                        
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
                            <span class="text-[10px] text-gray-400">我的份額</span>
                            <span class="text-sm font-medium">¥ {{ formatNumber(autoShareValue) }}</span>
                        </div>
                        <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-[10px] text-gray-400">對方已當場付清</span>
                            <input v-if="!isReadOnly" type="checkbox" v-model="form.isAlreadyPaid" class="accent-gray-600">
                            <div v-else class="text-[10px] text-gray-500">{{ form.isAlreadyPaid ? '是' : '否' }}</div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- 7. 進階功能 (專案/旅行) -->
                <div v-if="!isReadOnly" class="pt-4 border-t border-gray-50 space-y-2 px-2">
                     <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">關聯旅行計畫</label>
                     <div class="flex flex-wrap gap-2">
                        <button @click="form.projectId = ''" 
                                :class="!form.projectId ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" 
                                class="px-4 py-1.5 rounded-full text-[10px]">無</button>
                        <button v-for="p in activeProjects" :key="p.id" 
                                @click="form.projectId = p.id"
                                :class="form.projectId === p.id ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-500'" 
                                class="px-4 py-1.5 rounded-full text-[10px] border border-transparent">{{ p.name }}</button>
                     </div>
                </div>
                <div v-else-if="currentProjectName" class="px-2 pt-2 border-t border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">旅行計畫</span>
                    <span class="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{{ currentProjectName }}</span>
                </div>
            </div>

            <!-- 7. 按鈕 -->
            <div class="space-y-4 pt-6">
                <button v-if="isReadOnly" @click="isReadOnly = false" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg">開始編輯</button>
                <template v-else>
                    <button @click="prepareAndSubmit" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg active:scale-95 transition-all">更新紀錄</button>
                    <button @click="$emit('delete-item', form.row)" :disabled="loading" class="w-full text-red-300 py-2 text-[10px] font-medium tracking-[0.4em] uppercase">刪除此筆資料</button>
                </template>
            </div>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading', 'paymentMethods', 'projects'],
    data() { return { selectedFriends: [], isReadOnly: true }; },
    computed: {
        filteredCategories() { return this.categories.filter(c => c.type === (this.form.type === '收款' ? '支出' : this.form.type)); },
        autoShareValue() {
            const totalPeople = (this.selectedFriends ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        },
        activeProjects() {
            // Edit Page: show active projects OR the one currently selected (even if archived)
            const currentId = this.form.projectId;
            return (this.projects || []).filter(p =>
                (p.status !== 'Archived' && p.status !== 'archived') || p.id === currentId
            );
        },
        currentProjectName() {
            if (!this.form.projectId) return null;
            const p = (this.projects || []).find(pr => pr.id === this.form.projectId);
            return p ? p.name : this.form.projectId; // Fallback to ID if not found
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getCategoryName(id) { return this.categories.find(c => c.id === id)?.name || '未分類'; },
        getCategoryIcon(id) { return this.categories.find(c => c.id === id)?.icon || 'sell'; },
        getPaymentName(id) { const pm = this.paymentMethods.find(p => p.id === id); return pm ? pm.name : id; },
        toggleFriendInSplit(name) {
            const idx = this.selectedFriends.indexOf(name);
            if (idx > -1) this.selectedFriends.splice(idx, 1);
            else this.selectedFriends.push(name);
        },
        prepareAndSubmit() {
            const share = this.autoShareValue;
            let debt = 0;
            if (this.form.type === '支出') {
                if (!this.form.isAlreadyPaid) {
                    debt = (this.form.payer === '我') ? (this.form.amount - share) : -share;
                }
                this.form.friendName = this.selectedFriends.join(', ');
            } else if (this.form.type === '收款') {
                debt = -this.form.amount;
                this.form.payer = this.form.friendName;
            }
            this.form.personalShare = share;
            this.form.debtAmount = debt;
            this.$emit('submit');
        }
    },
    watch: {
        'form.row': {
            handler() {
                this.isReadOnly = true;
                if (this.form.friendName) this.selectedFriends = this.form.friendName.split(', ');
            },
            immediate: true
        }
    }
};
