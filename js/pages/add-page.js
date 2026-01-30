export const AddPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in">
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow space-y-6">
            <!-- 收支切換 -->
            <div class="flex bg-gray-100 rounded-xl p-1 relative">
                <button @click.stop="form.type = '支出'" :class="form.type === '支出' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-xs rounded-lg transition-all z-10">支出</button>
                <button @click.stop="form.type = '收入'" :class="form.type === '收入' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-xs rounded-lg transition-all z-10">收入</button>
            </div>

            <!-- 金額與幣別 -->
            <div class="text-center py-6 border-b border-gray-50">
                <div class="flex items-center justify-center space-x-3">
                    <span @click.stop="$emit('toggle-currency')" class="text-sm font-medium text-gray-300 border border-gray-100 px-3 py-1 rounded-full cursor-pointer">{{ form.currency }}</span>
                    <input type="number" v-model="form.amount" class="text-5xl font-light w-48 text-center bg-transparent outline-none" placeholder="0" inputmode="decimal">
                </div>
            </div>

            <div class="space-y-5">
                <!-- 日期選擇 (優化：點擊整列皆可編輯) -->
                <label class="flex items-center justify-between px-2 cursor-pointer active:bg-gray-50 rounded-lg p-2 transition-colors">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">Date</span>
                    <input type="date" v-model="form.spendDate" class="text-sm bg-transparent outline-none text-right cursor-pointer">
                </label>

                <!-- 分類 (Grid) -->
                <div class="grid grid-cols-4 gap-4 py-2">
                    <div v-for="cat in categories" :key="cat.id" @click.stop="form.categoryId = cat.id"
                         :class="form.categoryId === cat.id ? 'bg-[#4A4A4A] text-white shadow-lg' : 'bg-gray-50 text-gray-300'"
                         class="flex flex-col items-center p-3 rounded-2xl transition-all">
                        <span class="material-symbols-rounded text-xl">{{ cat.icon }}</span>
                        <span class="text-[9px] mt-1">{{ cat.name }}</span>
                    </div>
                </div>

                <input type="text" v-model="form.name" placeholder="項目名稱" class="w-full text-sm py-4 border-b border-gray-50 outline-none">

                <!-- 支付方式 -->
                <div class="flex space-x-2 overflow-x-auto no-scrollbar py-2">
                    <button v-for="m in ['現金', '信用卡', '掃碼支付', '郵局匯款']" @click.stop="form.paymentMethod = m"
                            :class="m === form.paymentMethod ? 'bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-300'"
                            class="whitespace-nowrap px-5 py-2 rounded-full text-[10px] transition-colors">
                        {{ m }}
                    </button>
                </div>

                <!-- 備註區域 (新增加) -->
                <textarea v-model="form.note" placeholder="備註..." class="w-full text-sm p-4 bg-gray-50 rounded-2xl outline-none h-20 resize-none placeholder:text-gray-300"></textarea>

                <!-- 進階開關 -->
                <div class="space-y-4 pt-4 border-t border-gray-50">
                    <div class="flex items-center justify-between" @click.stop="form.isOneTime = !form.isOneTime">
                        <span class="text-xs text-gray-400">一次性大筆支出</span>
                        <div class="w-10 h-5 rounded-full relative transition-colors" :class="form.isOneTime ? 'bg-gray-400' : 'bg-gray-200'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isOneTime}"></div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between" @click.stop="form.isSplit = !form.isSplit">
                        <span class="text-xs text-gray-400">幫朋友代墊 / 需分帳</span>
                        <div class="w-10 h-5 rounded-full relative transition-colors" :class="form.isSplit ? 'bg-gray-400' : 'bg-gray-200'">
                            <div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform" :class="{'translate-x-5': form.isSplit}"></div>
                        </div>
                    </div>
                </div>

                <!-- 分帳詳細 (優化：多位好友與兩種計算模式) -->
                <div v-if="form.isSplit" class="bg-gray-50 p-6 rounded-3xl space-y-6">
                    <!-- 好友列表 -->
                    <div class="space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-gray-400 uppercase tracking-widest">Selected Friends</span>
                            <span class="text-[10px] text-gray-300">{{ selectedFriends.length }} 人</span>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <div v-for="name in selectedFriends" :key="name" @click="removeFriend(name)" class="bg-white px-3 py-1 rounded-full text-[10px] flex items-center space-x-1 border border-gray-100">
                                <span>{{ name }}</span>
                                <span class="material-symbols-rounded !text-xs">close</span>
                            </div>
                            <button @click="isAddingFriend = true" class="bg-gray-200 px-3 py-1 rounded-full text-[10px]">+</button>
                        </div>
                        <div v-if="isAddingFriend" class="flex mt-2">
                            <input type="text" v-model="newFriendName" list="friends-list" placeholder="輸入名字" class="text-xs flex-grow bg-white p-2 rounded-l-lg outline-none">
                            <datalist id="friends-list"><option v-for="f in friends" :value="f"></option></datalist>
                            <button @click="addFriend" class="bg-[#4A4A4A] text-white px-4 rounded-r-lg text-xs">Add</button>
                        </div>
                    </div>

                    <!-- 計算模式切換 -->
                    <div class="flex bg-white rounded-lg p-1 text-[10px]">
                        <button @click="splitMode = 'auto'" :class="splitMode === 'auto' ? 'bg-gray-100' : ''" class="flex-1 py-1 rounded">自動平分</button>
                        <button @click="splitMode = 'manual'" :class="splitMode === 'manual' ? 'bg-gray-100' : ''" class="flex-1 py-1 rounded">手動輸入我的金額</button>
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span class="text-[10px] text-gray-500 font-medium uppercase">My Share ({{ form.currency }})</span>
                        <input v-if="splitMode === 'manual'" type="number" v-model="form.personalShare" class="text-right bg-white border border-gray-100 rounded px-2 py-1 outline-none text-sm font-medium w-24">
                        <span v-else class="text-sm font-medium text-gray-800">¥ {{ formatNumber(autoShareValue) }}</span>
                    </div>
                    <p v-if="splitMode === 'auto'" class="text-[9px] text-gray-400 text-right">計算公式：總額 / ({{ selectedFriends.length }}位朋友 + 我)</p>
                </div>
            </div>

            <button @click.stop="$emit('submit')" :disabled="loading" class="w-full bg-[#4A4A4A] text-white py-5 rounded-2xl text-xs font-medium tracking-[0.3em] uppercase shadow-lg disabled:bg-gray-200 active:scale-95 transition-all">
                Confirm & Save
            </button>
        </div>
    </section>
    `,
    props: ['form', 'categories', 'friends', 'loading'],
    emits: ['toggle-currency', 'submit'],
    data() {
        return {
            isAddingFriend: false,
            newFriendName: '',
            selectedFriends: [],
            splitMode: 'auto'
        };
    },
    computed: {
        autoShareValue() {
            if (!this.form.amount) return 0;
            const totalPeople = this.selectedFriends.length + 1;
            return Math.round(this.form.amount / totalPeople);
        }
    },
    methods: {
        addFriend() {
            if (this.newFriendName && !this.selectedFriends.includes(this.newFriendName)) {
                this.selectedFriends.push(this.newFriendName);
                this.newFriendName = '';
                this.isAddingFriend = false;
                this.updatePersonalShare();
            }
        },
        removeFriend(name) {
            this.selectedFriends = this.selectedFriends.filter(f => f !== name);
            this.updatePersonalShare();
        },
        updatePersonalShare() {
            if (this.splitMode === 'auto') {
                this.form.personalShare = this.autoShareValue;
            }
            // 同步朋友名單到父層 form
            this.form.friendName = this.selectedFriends.join(', ');
        },
        formatNumber(num) {
            return new Intl.NumberFormat().format(num);
        }
    },
    watch: {
        'form.amount': 'updatePersonalShare',
        'splitMode': 'updatePersonalShare'
    }
};
