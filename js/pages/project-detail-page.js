import { API } from '../api.js';

export const ProjectDetailPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in">
        <!-- Header / Navigation -->
        <div class="flex items-center justify-between px-2">
            <button @click="$emit('back')" class="text-gray-400 hover:text-gray-600 transition-colors">
                <span class="material-symbols-rounded text-2xl">arrow_back</span>
            </button>
            <h2 class="text-xs font-medium text-gray-500 tracking-widest uppercase">旅行計畫詳情</h2>
            <div class="w-6"></div> <!-- Spacer -->
        </div>

        <!-- Main Content Card -->
        <div class="bg-white p-6 rounded-[2.5rem] muji-shadow border border-gray-50 space-y-6 min-h-[60vh] relative">
            
            <!-- Edit Toggle (Top Right) -->
            <div class="absolute top-6 right-6 z-10">
                <button v-if="!isEditing" @click="isEditing = true" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <span class="material-symbols-rounded text-lg">edit</span>
                </button>
                <button v-else @click="saveProject" :disabled="saving" class="text-gray-800 font-bold text-xs uppercase disabled:text-gray-300">
                    {{ saving ? 'Saving...' : 'Save' }}
                </button>
            </div>

            <!-- Read Only View -->
            <div v-if="!isEditing" class="space-y-8 pt-4">
                <div class="text-center space-y-3">
                    <span :class="project.status === 'Active' ? 'bg-[#4A4A4A] text-white' : 'bg-gray-200 text-gray-500'" 
                          class="text-[10px] px-3 py-1 rounded-full inline-block tracking-widest uppercase">
                          {{ getStatusLabel(project.status) }}
                    </span>
                    <h2 class="text-2xl font-light text-gray-800 tracking-wide">{{ project.name }}</h2>
                    <p class="text-[11px] text-gray-400 tracking-wider font-light">{{ project.startDate }} ~ {{ project.endDate }}</p>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-4 bg-gray-50 p-6 rounded-3xl">
                     <div class="text-center">
                         <p class="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-medium">總花費</p>
                         <p class="text-xl font-light text-gray-700">¥{{ formatNumber(stats.total) }}</p>
                     </div>
                     <div class="text-center border-l border-gray-200">
                         <p class="text-[9px] text-gray-400 uppercase tracking-widest mb-1 font-medium">平均日花費</p>
                         <p class="text-xl font-light text-gray-700">¥{{ formatNumber(stats.daily) }}</p>
                     </div>
                </div>
            </div>

            <!-- Edit View -->
            <div v-else class="space-y-6 pt-2">
                <div class="space-y-2">
                    <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">計畫名稱</label>
                    <input type="text" v-model="editForm.name" class="w-full bg-gray-50 px-5 py-4 rounded-2xl text-sm outline-none text-gray-700 placeholder-gray-300 transition-all focus:bg-white focus:shadow-sm border border-transparent focus:border-gray-100">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">開始日期</label>
                        <input type="date" v-model="editForm.startDate" class="w-full bg-gray-50 px-4 py-3 rounded-2xl text-xs outline-none text-gray-600">
                    </div>
                    <div class="space-y-2">
                         <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">結束日期</label>
                         <input type="date" v-model="editForm.endDate" class="w-full bg-gray-50 px-4 py-3 rounded-2xl text-xs outline-none text-gray-600">
                    </div>
                </div>

                <div class="space-y-2">
                     <label class="text-[10px] text-gray-400 uppercase tracking-widest font-medium ml-2">狀態</label>
                     <div class="grid grid-cols-3 gap-2">
                        <button v-for="status in ['Active', 'Planned', 'Archived']" :key="status"
                                @click="editForm.status = status"
                                :class="editForm.status === status ? 'bg-[#4A4A4A] text-white shadow-md' : 'bg-gray-50 text-gray-400'"
                                class="py-3 rounded-xl text-[10px] transition-all font-medium">
                            {{ getStatusLabel(status) }}
                        </button>
                     </div>
                </div>
                
                <div class="pt-4">
                    <button @click="isEditing = false" class="w-full py-4 text-[10px] text-gray-400 tracking-widest uppercase hover:text-gray-600">取消編輯</button>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['project', 'transactions'],
    data() {
        return {
            isEditing: false,
            editForm: {},
            saving: false
        };
    },
    computed: {
        stats() {
            if (!this.project || !this.transactions) return { total: 0, daily: 0 };

            // Filter transactions for this project
            const txs = this.transactions.filter(t => t.projectId === this.project.id && t.type === '支出');

            let total = 0;
            txs.forEach(t => {
                total += parseFloat(t.amountJPY || 0);
            });

            // Use date range for daily avg
            const start = new Date(this.project.startDate);
            const end = new Date(this.project.endDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return {
                total: total,
                daily: diffDays > 0 ? total / diffDays : 0
            };
        }
    },
    watch: {
        project: {
            handler(newVal) {
                if (newVal) this.editForm = { ...newVal };
            },
            immediate: true
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getStatusLabel(status) {
            const map = { 'Active': '進行中', 'Planned': '計劃中', 'Archived': '已歸檔' };
            return map[status] || status;
        },
        async saveProject() {
            this.saving = true;
            try {
                await API.saveTransaction({
                    action: 'updateProject',
                    id: this.editForm.id,
                    name: this.editForm.name,
                    startDate: this.editForm.startDate,
                    endDate: this.editForm.endDate,
                    status: this.editForm.status
                });
                // Emit update to parent to refresh listing and current project view
                this.$emit('update-project', this.editForm);
                this.isEditing = false;
                alert("已儲存變更");
            } catch (e) {
                alert("儲存失敗: " + e.toString());
            } finally {
                this.saving = false;
            }
        }
    }
};
