export const OverviewPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- 1. 本日支出 (混合總額邏輯) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <div class="flex justify-between items-center px-2">
                <div class="flex flex-col">
                    <p class="text-[10px] text-gray-400 uppercase tracking-widest">{{ selectedDateLabel }} 支出 ({{ displayCurrency }})</p>
                    <h2 class="text-3xl font-light text-gray-700 mt-1">{{ currencySymbol }} {{ formatNumber(displayAmount) }}</h2>
                </div>
                <button @click="isMyShareOnly = !isMyShareOnly" class="text-[9px] px-3 py-1.5 rounded-full bg-gray-50 text-gray-400 border border-gray-100 active:bg-gray-200 transition-all uppercase tracking-widest">
                    {{ isMyShareOnly ? '我的份額' : '混合總額' }}
                </button>
            </div>
            <div class="h-32 w-full pt-2">
                <canvas ref="barChart"></canvas>
            </div>
        </div>

        <!-- 2. 本月累計 (分幣別統計) - 這部分維持固定以方便對帳 -->
        <div class="grid grid-cols-2 gap-4">
            <div @click="$emit('go-to-history', { mode: 'monthly', currency: 'JPY' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">本月日幣支出</p>
                <p class="text-xl font-light text-gray-600">¥ {{ formatNumber(monthlyOutflowJPY) }}</p>
            </div>
            <div @click="$emit('go-to-history', { mode: 'monthly', currency: 'TWD' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">本月台幣支出</p>
                <p class="text-xl font-light text-gray-600">$ {{ formatNumber(monthlyOutflowTWD) }}</p>
            </div>
        </div>

        <!-- 3. 留學累計與收入 -->
        <div class="grid grid-cols-2 gap-4">
            <div @click="$emit('go-to-history', { mode: 'all' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">留學總支出 ({{ displayCurrency }})</p>
                <p class="text-xl font-light text-gray-600">{{ currencySymbol }} {{ formatNumber(totalOutflowConverted) }}</p>
            </div>
            <div @click="$emit('go-to-history', { mode: 'all' })" class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all">
                <p class="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-widest">留學總收入 ({{ displayCurrency }})</p>
                <p class="text-xl font-light text-gray-400">{{ currencySymbol }} {{ formatNumber(totalIncomeConverted) }}</p>
            </div>
        </div>

        <!-- 4. 淨欠款狀態 -->
        <div class="bg-white p-6 rounded-2xl muji-shadow border border-gray-50 flex justify-between items-center active:scale-[0.98] transition-all" @click="$emit('go-to-history', { mode: 'debt' })">
            <div>
                <p class="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Net Debt Status ({{ displayCurrency }})</p>
                <p class="text-xl font-light mt-1" :class="stats.debtTotal >= 0 ? 'text-gray-600' : 'text-red-300'">
                    {{ currencySymbol }} {{ formatNumber(Math.abs(netDebtConverted)) }}
                </p>
            </div>
            <span class="material-symbols-rounded text-gray-200">arrow_forward_ios</span>
        </div>
    </section>
    `,
    props: ['transactions', 'stats', 'fxRate', 'displayCurrency'],
    data() {
        return { isMyShareOnly: false, selectedDateStr: '', chartInstance: null };
    },
    computed: {
        currencySymbol() { return this.displayCurrency === 'TWD' ? '$' : '¥'; },
        todayStr() {
            const now = new Date();
            return now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
        },
        selectedDateLabel() { return this.selectedDateStr === this.todayStr ? '本日' : this.selectedDateStr.substring(5); },
        displayAmount() {
            const targetDate = this.selectedDateStr || this.todayStr;
            const jpyTotal = this.transactions
                .filter(t => t.spendDate.startsWith(targetDate) && t.type === '支出')
                .reduce((acc, t) => acc + this.getNormalizedJPY(t), 0);
            return this.convertFromJPY(jpyTotal);
        },
        monthlyOutflowJPY() {
            const ym = this.todayStr.substring(0, 7);
            return this.transactions
                .filter(t => t.spendDate.startsWith(ym) && t.type === '支出' && t.originalCurrency === 'JPY')
                .reduce((acc, t) => acc + (this.isMyShareOnly || t.payer !== '我' ? Number(t.personalShare || 0) : Number(t.amountJPY || 0)), 0);
        },
        monthlyOutflowTWD() {
            const ym = this.todayStr.substring(0, 7);
            return this.transactions
                .filter(t => t.spendDate.startsWith(ym) && t.type === '支出' && t.originalCurrency === 'TWD')
                .reduce((acc, t) => acc + (this.isMyShareOnly || t.payer !== '我' ? Number(t.personalShare || 0) : Number(t.amountTWD || 0)), 0);
        },
        totalOutflowConverted() {
            const jpyTotal = this.transactions.filter(t => t.type === '支出').reduce((acc, t) => acc + this.getNormalizedJPY(t), 0);
            return this.convertFromJPY(jpyTotal);
        },
        totalIncomeConverted() {
            const jpyTotal = this.transactions.filter(t => t.type === '收入').reduce((acc, t) => acc + Number(t.amountJPY || 0), 0);
            return this.convertFromJPY(jpyTotal);
        },
        netDebtConverted() {
            const jpyDebt = Number(this.stats.debtTotal || 0);
            return this.convertFromJPY(jpyDebt);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        convertFromJPY(jpyVal) {
            if (this.displayCurrency === 'JPY') return jpyVal;
            return jpyVal * Number(this.fxRate || 0.22);
        },
        getNormalizedJPY(t) {
            const rate = Number(this.fxRate || 0.22);
            let val = (this.isMyShareOnly || t.payer !== '我') ? Number(t.personalShare || 0) : Number(t.originalAmount || t.amountJPY || 0);
            if (t.originalCurrency === 'TWD') val = val / rate;
            return val;
        },
        renderChart() {
            if (!this.$refs.barChart) return;
            const ctx = this.$refs.barChart.getContext('2d');
            if (this.chartInstance) this.chartInstance.destroy();
            const days = [];
            for (let i = 4; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i);
                const ds = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
                const jpyVal = this.transactions.filter(t => t.spendDate.startsWith(ds) && t.type === '支出').reduce((acc, t) => acc + this.getNormalizedJPY(t), 0);
                days.push({ date: ds, label: ds.substring(5), val: this.convertFromJPY(jpyVal) });
            }
            this.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: days.map(d => d.label),
                    datasets: [{ data: days.map(d => d.val), backgroundColor: days.map(d => d.date === this.selectedDateStr ? '#4A4A4A' : '#E5E5E5'), borderRadius: 4, barThickness: 20 }]
                },
                options: {
                    responsive: true, animation: false, maintainAspectRatio: false,
                    scales: { y: { display: false }, x: { grid: { display: false }, border: { display: false } } },
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    onClick: (e, el) => { if (el.length > 0) this.selectedDateStr = days[el[0].index].date; }
                }
            });
        }
    },
    beforeUnmount() { if (this.chartInstance) this.chartInstance.destroy(); },
    mounted() { this.selectedDateStr = this.todayStr; this.$nextTick(() => this.renderChart()); },
    watch: { isMyShareOnly() { this.renderChart(); }, selectedDateStr() { this.renderChart(); }, displayCurrency() { this.renderChart(); }, transactions: { handler() { this.renderChart(); }, deep: true } }
};
