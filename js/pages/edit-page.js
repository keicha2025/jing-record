import { CONFIG } from '../config.js';

export const EditPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-24">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6">
            <div class="flex justify-between items-center px-2">
                <span class="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-medium">編輯紀錄</span>
                <button @click="$emit('cancel')" class="text-[10px] text-gray-300 uppercase tracking-widest">取消</button>
            </div>

            <!-- 金額呈現 -->
            <div class="text-center py-6 border-b border-gray-50">
                <div class="flex items-center justify-center space-x-3">
                    <span class="text-xs font-medium text-gray-300">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none" placeholder="0">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 收款/支出/付款人 邏輯 (同前) -->
                <div v-if="form.type === '收款'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2">是誰還錢？</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button v-for="f in friends" :key="'edit-r-'+f" @click="form.friendName = f"
                                :class="form.friendName === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'"
                                class="px-3 py-1.5 rounded-full text-[10px] transition-all">{{ f }}</button>
                    </div>
                </div>

                <div v-if="form.type === '支出'" class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest px-2">付款人</label>
                    <div class="flex flex-wrap gap-2 px-2">
                        <button @click="form.payer = '我'" :class="form.payer === '我' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">我</button>
                        <button v-for="f in friends" :key="'edit-p-'+f" @click="form.payer = f" :class="form.payer === f ? 'bg-[#4A4A4A] text-white' : 'bg-gray-50 text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                    </div>
                </div>

                <label class="flex items-center justify-between px-2 py-2">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">Date</span>
                    <input type="date" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right">
                </label>

                <input type="text" v-model="form.name" placeholder="項目名稱" class="w-full text-sm py-4 border-b border-gray-50 outline-none">
                <textarea v-model="form.note" placeholder="備註..." class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>

                <!-- 分帳區 (同前) -->
                <div v-if="form.type === '支出'" class="pt-4 border-t border-gray-50 space-y-4">
                    <div class="flex items-center justify-between" @click="form.isSplit = !form.isSplit">
                        <span class="text-xs text-gray-400">分帳詳細</span>
                        <div class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                    </div>
                    <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6">
                        <div class="flex flex-wrap gap-2">
                            <button v-for="f in friends" :key="'edit-s-'+f" @click="toggleFriendInSplit(f)" :class="selectedFriends.includes(f) ? 'bg-[#4A4A4A] text-white' : 'bg-white text-gray-400'" class="px-4 py-1.5 rounded-full text-[10px]">{{ f }}</button>
                        </div>
                        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span class="text-[10px] text-gray-500 uppercase font-medium">My Share: ¥ {{ formatNumber(autoShareValue) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 操作按鈕 -->
            <div class="space-y-4 pt-6">
                <button @click="prepareAndSubmit" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-[10px] font-medium tracking-[0.4em] uppercase shadow-lg active:scale-95 transition-all">
                    更新紀錄
                </button>
                <!-- 刪除按鈕 -->
                <button @click="confirmDelete" :disabled="loading" class="w-full text-red-300 py-2 text-[10px] font-medium tracking-[0.4em] uppercase">
                    刪除此筆資料
                </button>
            </div>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading'],
    data() {
        return { selectedFriends: [] };
    },
    computed: {
        autoShareValue() {
            const totalPeople = (this.selectedFriends ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(num); },
        toggleFriendInSplit(name) {
            const idx = this.selectedFriends.indexOf(name);
            if (idx > -1) this.selectedFriends.splice(idx, 1);
            else this.selectedFriends.push(name);
        },
        confirmDelete() {
            if (confirm("確定要永久刪除這筆資料嗎？")) {
                // 明確將 row 傳出
                this.$emit('delete-item', this.form.row);
            }
        },
        prepareAndSubmit() {
            const share = this.autoShareValue;
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
        }
    },
    mounted() {
        if (this.form.friendName) this.selectedFriends = this.form.friendName.split(', ');
    }
};
