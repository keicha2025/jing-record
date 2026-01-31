import { CONFIG } from '../config.js';

export const EditPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6">
            <div class="flex justify-between items-center px-2">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium text-gray-400">Edit {{ form.type }}</span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest">取消</button>
            </div>

            <!-- 1. 金額 -->
            <div class="text-center py-6 border-b border-gray-50">
                <div class="flex items-center justify-center space-x-3">
                    <span class="text-xs font-medium text-gray-300">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none" placeholder="0">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 2. 付款者 / 收款者 -->
                <div v-if="form.type === '收款'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2 font-medium">是誰還錢？</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button v-for="f in friends" :key="'edit-r-'+f" @click="form.friendName = f"
                                :class="form.friendName === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'"
                                class="px-3 py-1.5 rounded-full text-[10px] transition-all">{{ f }}</button>
                    </div>
                </div>

                <div v-if="form.type === '支出'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2 font-medium">付款人</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button @click="form.payer = '我'" :class="form.payer === '我' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">我</button>
                        <button v-for="f in friends" :key="'edit-p-'+f" @click="form.payer = f" :class="form.payer === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                    </div>
                </div>

                <!-- 3. 日期與分類 -->
                <label class="flex items-center justify-between px-2 py-2 cursor-pointer active:bg-gray-50 rounded-xl transition-colors">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">消費日期</span>
                    <input type="date" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right cursor-pointer">
                </label>

                <div v-if="form.type !== '收款'" class="grid grid-cols-4 gap-4 py-2">
                    <div v-for="cat in filteredCategories" :key="cat.id" @click.stop="form.categoryId = cat.id" :class="form.categoryId === cat.id ? 'bg-[#4A4A4A] text-white shadow-lg' : 'bg-gray-50 text-gray-300'" class="flex flex-col items-center p-3 rounded-2xl transition-all">
                        <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                        <span class="text-[9px] mt-1">{{ cat.name }}</span>
                    </div>
                </div>

                <input type="text" v-model="form.name" placeholder="項目名稱" class="w-full text-sm py-4 border-b border-gray-50 outline-none">
                <textarea v-model="form.note" placeholder="備註..." class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>

                <!-- 4. 分帳 (確保編輯時正確還原) -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between" @click="toggleSplit">
                        <span class="text-xs text-gray-400">幫朋友代墊 / 需分帳</span>
                        <div class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                    </div>

                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6">
                        <div class="flex flex-wrap gap-2">
                            <button v-for="f in friends" :key="'edit-s-'+f" @click="toggleFriendInSplit(f)" :class="selectedFriends.includes(f) ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        </div>
                        <div class="flex bg-white rounded-lg p-1 text-[9px] uppercase">
                            <button @click="splitMode = 'auto'" :class="splitMode === 'auto' ? 'bg-gray-100' : ''" class="flex-1 py-1 rounded">自動平分</button>
                            <button @click="splitMode = 'manual'" :class="splitMode === 'manual' ? 'bg-gray-100' : ''" class="flex-1 py-1 rounded">手動份額</button>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-[10px] text-gray-500 uppercase">My Share</span>
                            <input v-if="splitMode === 'manual'" type="number" v-model="form.personalShare" class="text-right bg-white border border-gray-100 rounded px-2 text-sm w-24 outline-none">
                            <span v-else class="text-sm font-medium">¥ {{ formatNumber(autoShareValue) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 5. 按鈕 -->
            <div class="space-y-4 pt-6">
                <button @click="prepareAndSubmit" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg active:scale-95 transition-all">
                    更新紀錄
                </button>
                <button @click="$emit('delete-item', form.row)" :disabled="loading" class="w-full text-red-300 py-2 text-[10px] font-medium tracking-[0.4em] uppercase">
                    刪除此筆資料
                </button>
            </div>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading'],
    data() {
        return { selectedFriends: [], splitMode: 'auto' };
    },
    computed: {
        filteredCategories() { return this.categories.filter(c => c.type === (this.form.type === '收款' ? '支出' : this.form.type)); },
        autoShareValue() {
            const totalPeople = (this.selectedFriends ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        toggleSplit() { this.form.isSplit = !this.form.isSplit; if(!this.form.isSplit) this.selectedFriends = []; },
        toggleFriendInSplit(name) {
            const idx = this.selectedFriends.indexOf(name);
            if (idx > -1) this.selectedFriends.splice(idx, 1);
            else this.selectedFriends.push(name);
        },
        prepareAndSubmit() {
            const share = this.splitMode === 'auto' ? this.autoShareValue : this.form.personalShare;
            let debt = 0;
            if (this.form.type === '支出') {
                debt = (this.form.payer === '我') ? (this.form.amount - share) : -share;
                this.form.friendName = this.selectedFriends.join(', ');
            } else if (this.form.type === '收款') {
                debt = -this.form.amount;
            }
            this.form.personalShare = share;
            this.form.debtAmount = debt;
            this.$emit('submit');
        },
        initLocalData() {
            // 解析朋友名單
            if (this.form.friendName && this.form.friendName.trim() !== "") {
                this.selectedFriends = this.form.friendName.split(', ');
                this.form.isSplit = true;
                // 判斷是自動還是手動
                if (Math.abs(this.form.personalShare - this.autoShareValue) > 1) {
                    this.splitMode = 'manual';
                } else {
                    this.splitMode = 'auto';
                }
            } else {
                this.selectedFriends = [];
                this.form.isSplit = false;
            }
        }
    },
    watch: {
        // 重要：當切換不同交易進行編輯時，重新執行初始化
        'form.row': {
            handler: 'initLocalData',
            immediate: true
        }
    }
};
