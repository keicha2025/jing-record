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
                <!-- 收款/支出對象選取 -->
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

                <!-- 基礎資料 -->
                <div class="flex items-center justify-between px-2 py-2 border-b border-gray-50">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">消費日期</span>
                    <div v-if="isReadOnly" class="text-sm text-gray-600">{{ form.spendDate.replace('T', ' ') }}</div>
                    <input v-else type="datetime-local" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right">
                </div>

                <div class="px-2 space-y-4">
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">項目名稱</label>
                        <div v-if="isReadOnly" class="text-sm text-gray-600">{{ form.name }}</div>
                        <input v-else type="text" v-model="form.name" class="w-full text-sm py-2 border-b border-gray-50 outline-none">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] text-gray-400 uppercase font-medium">備註</label>
                        <div v-if="isReadOnly" class="text-xs text-gray-400 whitespace-pre-wrap">{{ form.note || '無備註' }}</div>
                        <textarea v-else v-model="form.note" class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none"></textarea>
                    </div>
                </div>

                <!-- 分帳區 -->
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
                        <!-- 已收款標示 -->
                        <div class="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span class="text-[10px] text-gray-400">對方已當場付清</span>
                            <input v-if="!isReadOnly" type="checkbox" v-model="form.isAlreadyPaid" class="accent-gray-600">
                            <div v-else class="text-[10px] text-gray-500">{{ form.isAlreadyPaid ? '是' : '否' }}</div>
                        </div>
                    </div>
                </div>
            </div>

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
    props: ['form', 'categories', 'friends', 'loading'],
    data() { return { selectedFriends: [], isReadOnly: true }; },
    computed: {
        filteredCategories() { return this.categories.filter(c => c.type === (this.form.type === '收款' ? '支出' : this.form.type)); },
        autoShareValue() {
            const totalPeople = (this.selectedFriends ? this.selectedFriends.length : 0) + 1;
            return Math.round(this.form.amount / totalPeople);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
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
                this.form.payer = this.form.friendName; // 修正收款付款人為朋友
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
