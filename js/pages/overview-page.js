export const OverviewPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in">
        <!-- 1. 本日支出 (含長條圖與切換) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <div class="flex justify-between items-center px-2">
                <div class="flex flex-col">
                    <p class="text-[10px] text-gray-400 uppercase tracking-widest">{{ selectedDateLabel }} 支出</p>
                    <h2 class="text-3xl font-light text-gray-700 mt-1">¥ {{ formatNumber(displayAmount) }}</h2>
                </div>
                <button @click="isMyShare = !isMyShare" class="text-[9px] px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100 active:bg-gray-200 transition-all uppercase tracking-widest">
                    {{ isMyShare ? '我的支出' : '總支出' }}
                </button>
            </div>
            
            <div class="h-32 w-full pt-2">
                <canvas ref="barChart"></canvas>
            </div>
        </div>

        <!-- 2. 淨欠款狀態 -->
        <div class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 flex justify-between items-center" @click="$emit('go-to-history', { mode: 'debt' })">
            <div>
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Net Debt Status</p>
                <p class="text-xl font-light mt-1" :class="stats.debtTotal >= 0 ? 'text-gray-600' : 'text-red-300'">¥ {{ formatNumber(Math.abs(stats.debtTotal)) }}</p>
            </div>
            <span class="material-symbols-rounded text-gray-200">arrow_forward_ios</span>
        </div>

        <!-- 3. 本月與留學累計 (總支出) -->
        <div class="grid grid-cols-2 gap-4">
            <div @click="$emit('go-to-history', { mode: 'monthly' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">本月累計</p>
                <p class="text-xl font-light text-gray-600">¥ {{ formatNumber(monthlyOutflow) }}</p>
            </div>
            <div @click="$emit('go-to-history', { mode: 'all' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">留學累計</p>
                <p class="text-xl font-light text-gray-600">¥ {{ formatNumber(totalOutflow) }}</p>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'stats', 'fxRate'],
    data() {
        return {
            isMyShare: false,
            selectedDateStr: '',
            chartInstance: null
        };
    },
    computed: {
        todayStr() {
            const now = new Date();
            return now.getFullYear() + '/' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '/' + 
                   String(now.getDate()).padStart(2, '0');
        },
        selectedDateLabel() {
            return this.selectedDateStr === this.todayStr ? '本日' : this.selectedDateStr.substring(5);
        },
        displayAmount() {
            const targetDate = this.selectedDateStr || this.todayStr;
            const dailyTrans = this.transactions.filter(t => t.spendDate.startsWith(targetDate) && t.type === '支出');
            return dailyTrans.reduce((acc, cur) => {
                return acc + (this.isMyShare ? (cur.personalShare || 0) : (cur.amountJPY || 0));
            }, 0);
        },
        monthlyOutflow() {
            const now = new Date();
            const yearMonth = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0');
            return this.transactions
                .filter(t => t.spendDate.startsWith(yearMonth) && t.type === '支出')
                .reduce((acc, cur) => acc + (cur.amountJPY || 0), 0);
        },
        totalOutflow() {
            return this.transactions
                .filter(t => t.type === '支出')
                .reduce((acc, cur) => acc + (cur.amountJPY || 0), 0);
        },
        lastFiveDaysData() {
            const result = [];
            for (let i = 4; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.getFullYear() + '/' + 
                               String(d.getMonth() + 1).padStart(2, '0') + '/' + 
                               String(d.getDate()).padStart(2, '0');
                
                const dayTrans = this.transactions.filter(t => t.spendDate.startsWith(dateStr) && t.type === '支出');
                result.push({ 
                    date: dateStr, 
                    displayDate: dateStr.substring(5), 
                    total: dayTrans.reduce((acc, cur) => acc + (cur.amountJPY || 0), 0),
                    mine: dayTrans.reduce((acc, cur) => acc + (cur.personalShare || 0), 0)
                });
            }
            return result;
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        renderChart() {
            if (!this.$refs.barChart) return;
            const ctx = this.$refs.barChart.getContext('2d');
            if (this.chartInstance) this.chartInstance.destroy();

            const data = this.lastFiveDaysData;
            this.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(d => d.displayDate),
                    datasets: [{
                        data: data.map(d => this.isMyShare ? d.mine : d.total),
                        backgroundColor: data.map(d => d.date === this.selectedDateStr ? '#4A4A4A' : '#E5E5E5'),
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true, animation: false,
                    maintainAspectRatio: false,
                    scales: { y: { display: false }, x: { grid: { display: false }, border: { display: false } } },
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    onClick: (event, elements) => {
                        if (elements.length > 0) {
                            this.selectedDateStr = data[elements[0].index].date;
                        }
                    }
                }
            });
        }
    },
    beforeUnmount() { if (this.chartInstance) { this.chartInstance.destroy(); } },
    mounted() {
        this.selectedDateStr = this.todayStr;
        window.requestAnimationFrame(() => this.renderChart());
    },
    watch: {
        isMyShare() { this.renderChart(); },
        selectedDateStr() { this.renderChart(); },
        transactions: { 
            handler() { 
                this.$nextTick(() => this.renderChart()); 
            }, 
            deep: true 
        }
    }
};
