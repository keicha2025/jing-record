export const StatsPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- 1. 模式切換與統計總額 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-6">
            <div class="flex bg-gray-100 rounded-xl p-1">
                <button @click="dateMode = 'month'" :class="dateMode === 'month' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium uppercase">By Month</button>
                <button @click="dateMode = 'range'" :class="dateMode === 'range' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'" class="flex-1 py-2 text-[10px] tracking-widest rounded-lg transition-all font-medium uppercase">Range</button>
            </div>

            <div class="flex flex-col space-y-3">
                <div v-if="dateMode === 'month'" class="flex justify-between items-center px-2">
                    <span class="text-[10px] text-gray-400 uppercase tracking-widest">Select Month</span>
                    <input type="month" v-model="selectedMonth" class="text-xs bg-gray-50 px-3 py-1.5 rounded-full outline-none text-gray-600">
                </div>
                <div v-else class="grid grid-cols-2 gap-3 px-2">
                    <div class="flex flex-col space-y-1">
                        <span class="text-[9px] text-gray-400 uppercase">Start</span>
                        <input type="date" v-model="startDate" class="text-[10px] bg-gray-50 px-2 py-1 rounded-lg outline-none text-gray-600">
                    </div>
                    <div class="flex flex-col space-y-1">
                        <span class="text-[9px] text-gray-400 uppercase">End</span>
                        <input type="date" v-model="endDate" class="text-[10px] bg-gray-50 px-2 py-1 rounded-lg outline-none text-gray-600">
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 divide-x divide-gray-50 pt-2">
                <div class="px-2">
                    <p class="text-[9px] text-gray-300 uppercase tracking-tighter mb-1">Total Period</p>
                    <p class="text-xl font-light text-gray-700">¥ {{ formatNumber(totalPeriodAmount) }}</p>
                </div>
                <div class="px-4">
                    <p class="text-[9px] text-gray-300 uppercase tracking-tighter mb-1">Daily Avg</p>
                    <p class="text-xl font-light text-gray-700">¥ {{ formatNumber(dailyAverage) }}</p>
                </div>
            </div>
        </div>

        <!-- 2. 圖表區域 (優化：點擊卡片任何處皆可重置) -->
        <div @click="resetChartSelection" class="bg-white p-8 rounded-[2rem] muji-shadow border border-gray-50 cursor-pointer">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-8 text-center">Category Mix</h3>
            <div class="relative w-full aspect-square max-w-[260px] mx-auto">
                <canvas ref="categoryChart"></canvas>
            </div>
        </div>

        <!-- 3. 支付方式 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-5">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2">Payment Proportions</h3>
            <div class="space-y-4">
                <div v-for="(val, method) in paymentStats" :key="method" class="space-y-1.5 px-2">
                    <div class="flex justify-between items-baseline">
                        <span class="text-[10px] text-gray-500">{{ method }}</span>
                        <div class="flex space-x-2 items-baseline">
                            <span class="text-xs font-medium text-gray-700">¥ {{ formatNumber(val) }}</span>
                            <span class="text-[9px] text-gray-300">{{ getIntPercentage(val, totalPeriodAmount) }}%</span>
                        </div>
                    </div>
                    <div class="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                        <div class="bg-gray-300 h-full transition-all duration-1000" :style="{ width: getIntPercentage(val, totalPeriodAmount) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. 分類列表 -->
        <div class="space-y-3">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-4">Categories</h3>
            <div v-for="cat in sortedCategoryData" :key="cat.id" 
                 @click.stop="$emit('drill-down', cat.id)" 
                 class="bg-white p-5 rounded-3xl muji-shadow flex justify-between items-center active:scale-[0.98] transition-transform">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                        <span class="material-symbols-rounded text-gray-400 text-xl">{{ cat.icon }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-medium text-gray-700">{{ cat.name }}</span>
                        <span class="text-[9px] text-gray-300">{{ cat.count }}筆資料</span>
                    </div>
                </div>
                <div class="flex items-baseline space-x-2">
                    <span class="text-sm font-medium text-gray-700">¥ {{ formatNumber(cat.total) }}</span>
                    <span class="text-[10px] text-gray-300">{{ getIntPercentage(cat.total, totalPeriodAmount) }}%</span>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories'],
    data() {
        const now = new Date();
        return {
            dateMode: 'month',
            selectedMonth: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'),
            startDate: now.toISOString().slice(0, 10),
            endDate: now.toISOString().slice(0, 10),
            chartInstance: null,
            centerAmount: 0,
            centerLabel: 'TOTAL'
        };
    },
    computed: {
        filteredList() {
            return this.transactions.filter(t => {
                if (t.type !== '支出') return false;
                const tDate = t.spendDate.split(' ')[0].replace(/\//g, '-');
                if (this.dateMode === 'month') return tDate.startsWith(this.selectedMonth);
                return tDate >= this.startDate && tDate <= this.endDate;
            });
        },
        totalPeriodAmount() {
            return this.filteredList.reduce((acc, cur) => acc + (cur.personalShare || 0), 0);
        },
        dailyAverage() {
            if (this.filteredList.length === 0) return 0;
            let days = 1;
            if (this.dateMode === 'month') {
                const parts = this.selectedMonth.split('-');
                const now = new Date();
                const isCurrent = (now.getFullYear() === parseInt(parts[0]) && (now.getMonth()+1) === parseInt(parts[1]));
                days = isCurrent ? now.getDate() : new Date(parts[0], parts[1], 0).getDate();
            } else {
                const diff = new Date(this.endDate) - new Date(this.startDate);
                days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
            }
            return this.totalPeriodAmount / days;
        },
        paymentStats() {
            const stats = { '現金': 0, '信用卡': 0, '掃碼支付': 0, '郵局匯款': 0 };
            this.filteredList.forEach(t => { if (stats[t.paymentMethod] !== undefined) stats[t.paymentMethod] += (t.personalShare || 0); });
            return stats;
        },
        sortedCategoryData() {
            const map = {};
            this.filteredList.forEach(t => {
                if (!map[t.categoryId]) {
                    const cat = this.categories.find(c => c.id === t.categoryId);
                    map[t.categoryId] = { id: t.categoryId, name: cat ? cat.name : '其他', icon: cat ? cat.icon : 'sell', total: 0, count: 0 };
                }
                map[t.categoryId].total += (t.personalShare || 0);
                map[t.categoryId].count++;
            });
            return Object.values(map).sort((a, b) => b.total - a.total);
        }
    },
    methods: {
        formatNumber(num) { return new Intl.NumberFormat().format(Math.round(num || 0)); },
        getIntPercentage(val, total) { return total > 0 ? Math.round((val / total) * 100) : 0; },
        resetChartSelection() {
            this.centerLabel = 'TOTAL';
            this.updateCenterFromVisible(this.chartInstance);
        },
        updateCenterFromVisible(chart) {
            if (!chart) return;
            const datasets = chart.data.datasets[0];
            let visibleTotal = 0;
            datasets.data.forEach((val, index) => {
                if (chart.getDataVisibility(index)) visibleTotal += val;
            });
            this.centerAmount = visibleTotal;
        },
        renderChart() {
            const ctx = this.$refs.categoryChart?.getContext('2d');
            if (!ctx) return;
            if (this.chartInstance) this.chartInstance.destroy();

            const data = this.sortedCategoryData;
            this.centerAmount = this.totalPeriodAmount;
            this.centerLabel = 'TOTAL';

            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.total),
                        backgroundColor: ['#4A4A4A', '#7A7A7A', '#9A9A9A', '#BDBDBD', '#D1C7BD', '#E5E5E5'],
                        borderWidth: 0,
                        hoverOffset: 15
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '80%',
                    plugins: {
                        legend: { 
                            position: 'bottom', 
                            labels: { boxWidth: 12, padding: 20, font: { size: 10, weight: '300' } },
                            onClick: (e, legendItem, legend) => {
                                const index = legendItem.index;
                                const ci = legend.chart;
                                ci.toggleDataVisibility(index);
                                ci.update();
                                this.resetChartSelection();
                            }
                        },
                        tooltip: { enabled: false }
                    },
                    onClick: (evt, elements) => {
                        if (elements.length > 0) {
                            // 點擊色塊：停止冒泡到父層 div，避免被立即重置
                            if (evt.native) evt.native.stopPropagation();
                            const idx = elements[0].index;
                            this.centerAmount = data[idx].total;
                            this.centerLabel = data[idx].name;
                        } else {
                            // 點擊畫布空白處
                            this.resetChartSelection();
                        }
                    }
                },
                plugins: [{
                    id: 'centerText',
                    beforeDraw: (chart) => {
                        const { ctx } = chart;
                        const meta = chart.getDatasetMeta(0);
                        if (!meta.data[0]) return;
                        const x = meta.data[0].x;
                        const y = meta.data[0].y;
                        ctx.save();
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '300 10px Noto Sans TC';
                        ctx.fillStyle = '#999';
                        ctx.fillText(this.centerLabel, x, y - 12);
                        ctx.font = '400 18px Noto Sans TC';
                        ctx.fillStyle = '#4A4A4A';
                        ctx.fillText('¥ ' + this.formatNumber(this.centerAmount), x, y + 8);
                        ctx.restore();
                    }
                }]
            });
        }
    },
    mounted() { this.$nextTick(() => this.renderChart()); },
    watch: {
        dateMode() { this.$nextTick(() => this.renderChart()); },
        selectedMonth() { this.$nextTick(() => this.renderChart()); },
        startDate() { this.$nextTick(() => this.renderChart()); },
        endDate() { this.$nextTick(() => this.renderChart()); },
        transactions: { handler() { this.$nextTick(() => this.renderChart()); }, deep: true }
    }
};
