import { Theme } from '../theme.js';

export const ViewDashboard = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- Hero: Total Spending -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4 text-center">
            
            <!-- Currency Toggle -->
            <!-- Currency Toggle -->
            <div class="flex bg-gray-50 rounded-xl p-1 mb-2">
                 <button @click="baseCurrency = 'JPY'" 
                         :class="baseCurrency === 'JPY' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" 
                         class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium">JPY</button>
                 <button @click="baseCurrency = 'TWD'" 
                         :class="baseCurrency === 'TWD' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" 
                         class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium">TWD</button>
            </div>

            <div class="space-y-1">
                <p class="text-[10px] text-gray-400 uppercase tracking-widest">我的留學總支出 ({{ baseCurrency }})</p>
                <h2 class="text-4xl font-extralight text-gray-700 tracking-tight">{{ getCurrencySymbol }} {{ formatNumber(totalOutflow) }}</h2>
                <p class="text-[10px] text-gray-300 pt-1">唯讀模式 • 資料已去識別化</p>
            </div>
        </div>

        <!-- Charts: Category Distribution (Bar Chart) -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest px-2">Category Breakdown</h3>
            <div class="h-64 w-full"> 
                <canvas ref="categoryChart"></canvas>
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
            
            <!-- Enter Guest Mode -->
            <div @click="enterGuestMode" class="bg-white p-5 rounded-2xl muji-shadow border border-gray-50 active:scale-95 transition-all cursor-pointer col-span-2 flex items-center justify-between">
                <div>
                    <p class="text-xs text-gray-600 font-medium">進入體驗模式</p>
                    <p class="text-[9px] text-gray-300 mt-1">開啟沙盒試用完整功能 (不儲存)</p>
                </div>
                <span class="material-symbols-rounded text-gray-300">arrow_forward</span>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories', 'fxRate'],
    data() {
        return {
            baseCurrency: 'JPY',
            // chartInstance removed from data to avoid reactivity issues
        };
    },
    computed: {
        getCurrencySymbol() { return this.baseCurrency === 'JPY' ? '¥' : '$'; },

        // Centralized logic mimicking stats-page.js 'processedList'
        processedTransactions() {
            const rate = Number(this.fxRate) || 0.22;
            // console.log("[ViewDashboard] Calculation Rate:", rate); // Debug removed for cleanliness

            return this.transactions
                .filter(t => t.type === '支出')
                .map(t => {
                    const originalCurr = t.originalCurrency || 'JPY';
                    const personal = Number(t.personalShare || 0);
                    let finalVal = 0;

                    // Logic from stats-page.js (isMyShareOnly=true)
                    if (originalCurr === this.baseCurrency) {
                        finalVal = personal;
                    } else if (this.baseCurrency === 'JPY') {
                        // Target JPY, Orig TWD
                        finalVal = personal / rate;
                    } else {
                        // Target TWD, Orig JPY
                        finalVal = personal * rate;
                    }

                    return { ...t, convertedAmount: finalVal };
                });
        },

        totalOutflow() {
            return this.processedTransactions.reduce((acc, t) => acc + t.convertedAmount, 0);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        enterGuestMode() { window.location.href = 'index.html'; },

        renderChart() {
            if (!this.$refs.categoryChart) return;
            const ctx = this.$refs.categoryChart.getContext('2d');

            // Destroy existing chart instance if exists
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }

            // Aggregate sorted by value using processed data
            const map = {};
            this.processedTransactions.forEach(t => {
                let catName = '其他';
                if (this.categories) {
                    const c = this.categories.find(cat => cat.id === t.categoryId);
                    if (c) catName = c.name;
                }
                if (!map[catName]) map[catName] = 0;
                map[catName] += t.convertedAmount;
            });

            // Remove zero values and sort desc
            const sorted = Object.entries(map)
                .filter(s => s[1] > 0)
                .sort((a, b) => b[1] - a[1]);

            const labels = sorted.map(s => s[0]);
            const data = sorted.map(s => s[1]);

            // Create new chart instance (assigned to this, not data)
            this.chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: Theme.colors.primary,
                        borderRadius: 4,
                        barThickness: 16,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false, grid: { display: false } },
                        y: {
                            grid: { display: false },
                            ticks: {
                                font: { family: '"Noto Sans TC", sans-serif', size: 11, weight: '500' },
                                color: Theme.colors.primary
                            }
                        }
                    },
                    animation: { duration: 500 }
                }
            });
        }
    },
    mounted() {
        this.$nextTick(() => this.renderChart());
    },
    beforeUnmount() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    },
    watch: {
        transactions: { handler() { this.$nextTick(() => this.renderChart()); }, deep: true },
        fxRate: { handler() { this.$nextTick(() => this.renderChart()); } },
        baseCurrency: { handler() { this.$nextTick(() => this.renderChart()); } }
    }
};
