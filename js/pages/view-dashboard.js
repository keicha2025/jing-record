export const ViewDashboard = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- Hero: Total Spending -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-2 text-center">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest">留學總支出 (JPY)</p>
            <h2 class="text-4xl font-extralight text-gray-700 tracking-tight">¥ {{ formatNumber(totalOutflow) }}</h2>
            <p class="text-[10px] text-gray-300 pt-2">唯讀模式 • 資料已去識別化</p>
        </div>

        <!-- Charts: Monthly Trend (Simple Bars) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest px-2">Recent Trend</h3>
            <div class="h-32 w-full">
                <canvas ref="trendChart"></canvas>
            </div>
        </div>

        <!-- Navigation Tiles -->
        <div class="grid grid-cols-2 gap-4">
            <div @click="$emit('switch-tab', 'history')" class="bg-white p-5 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-rounded text-gray-400 text-2xl mb-2">list_alt</span>
                <p class="text-xs text-gray-600 font-medium">交易明細</p>
                <p class="text-[9px] text-gray-300 mt-1">檢視去個資後的紀錄</p>
            </div>
            <div @click="$emit('switch-tab', 'stats')" class="bg-white p-5 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all cursor-pointer">
                <span class="material-symbols-rounded text-gray-400 text-2xl mb-2">pie_chart</span>
                <p class="text-xs text-gray-600 font-medium">統計分析</p>
                <p class="text-[9px] text-gray-300 mt-1">支出類別分佈</p>
            </div>
            <div @click="enterGuestMode" class="bg-gray-800 p-5 rounded-2xl muji-shadow border border-gray-600 active:scale-95 transition-all cursor-pointer col-span-2 flex items-center justify-between">
                <div class="text-white">
                    <p class="text-xs font-medium">進入體驗模式</p>
                    <p class="text-[9px] text-gray-400 mt-1">開啟沙盒試用完整功能 (不儲存)</p>
                </div>
                <span class="material-symbols-rounded text-white">arrow_forward</span>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'stats'],
    data() {
        return { chartInstance: null };
    },
    computed: {
        totalOutflow() {
            return this.transactions
                .filter(t => t.type === '支出')
                .reduce((acc, t) => acc + (t.originalCurrency === 'JPY' ? Number(t.amountJPY) : Number(t.amountTWD) / 0.22), 0);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        enterGuestMode() {
            // Remove /view from URL and reload to enter Guest/Normal mode
            const newUrl = window.location.href.split('?')[0].replace('/view', '');
            window.location.href = newUrl;
        },
        renderChart() {
            if (!this.$refs.trendChart) return;
            const ctx = this.$refs.trendChart.getContext('2d');
            if (this.chartInstance) this.chartInstance.destroy();

            // Generate last 6 months data
            const labels = [];
            const data = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const ym = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0');
                labels.push(ym.substring(5)); // 'MM'

                const val = this.transactions
                    .filter(t => t.spendDate.startsWith(ym) && t.type === '支出')
                    .reduce((acc, t) => acc + (t.originalCurrency === 'JPY' ? Number(t.amountJPY) : Number(t.amountTWD) / 0.22), 0);
                data.push(val);
            }

            this.chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        borderColor: '#4A4A4A',
                        borderWidth: 1.5,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#4A4A4A',
                        pointRadius: 3,
                        tension: 0.4,
                        fill: false
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { display: false }, x: { grid: { display: false }, border: { display: false } } }
                }
            });
        }
    },
    mounted() { this.$nextTick(() => this.renderChart()); },
    watch: { transactions: { handler() { this.renderChart(); }, deep: true } }
};
