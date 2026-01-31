export const StatsPage = {
    template: `
    <section class="space-y-6 py-4 animate-in fade-in pb-10">
        <!-- 1. 區間選擇與每日平均 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <div class="flex justify-between items-center">
                <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Daily Insight</h3>
                <div class="flex items-center space-x-2">
                    <input type="month" v-model="selectedMonth" class="text-[10px] bg-gray-50 px-2 py-1 rounded-full outline-none text-gray-500">
                </div>
            </div>
            <div class="flex items-baseline space-x-2">
                <span class="text-3xl font-light text-gray-700">¥ {{ formatNumber(dailyAverage) }}</span>
                <span class="text-[10px] text-gray-300">/ day (本月平均)</span>
            </div>
        </div>

        <!-- 2. 圖表區域 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-6">Category Distribution</h3>
            <div class="relative w-full aspect-square">
                <canvas ref="categoryChart"></canvas>
            </div>
        </div>

        <!-- 3. 支付方式統計 -->
        <div class="bg-white p-6 rounded-[2rem] muji-shadow border border-gray-50 space-y-4">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Payment Methods</h3>
            <div class="space-y-3">
                <div v-for="(val, method) in paymentStats" :key="method" class="space-y-1">
                    <div class="flex justify-between text-[10px] text-gray-500">
                        <span>{{ method }}</span>
                        <span>¥ {{ formatNumber(val) }}</span>
                    </div>
                    <div class="w-full bg-gray-50 h-1 rounded-full overflow-hidden">
                        <div class="bg-gray-300 h-full transition-all duration-1000" :style="{ width: (val / Math.max(...Object.values(paymentStats)) * 100) + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. 分類詳細清單 -->
        <div class="space-y-3">
            <h3 class="text-[10px] text-gray-400 uppercase tracking-widest font-medium px-2">Detailed Categories</h3>
            <div v-for="cat in sortedCategoryData" :key="cat.id" class="bg-white p-4 rounded-2xl muji-shadow flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <span class="material-symbols-rounded text-gray-300">{{ cat.icon }}</span>
                    <span class="text-xs text-gray-600">{{ cat.name }}</span>
                </div>
                <div class="text-right">
                    <p class="text-sm font-light text-gray-700">¥ {{ formatNumber(cat.total) }}</p>
                    <p class="text-[8px] text-gray-300">{{ cat.count }} 筆交易</p>
                </div>
            </div>
        </div>
    </section>
    `,
    props: ['transactions', 'categories', 'stats'],
    data() {
        return {
            selectedMonth: new Date().toISOString().slice(0, 7),
            chartInstance: null
        };
    },
    computed: {
        // 過濾出所選月份的支出
        filteredList() {
            return this.transactions.filter(t => {
                return t.spendDate.startsWith(this.selectedMonth.replace('-', '/')) && t.type === '支出';
            });
        },
        dailyAverage() {
            if (this.filteredList.length === 0) return 0;
            const now = new Date();
            const isCurrentMonth = this.selectedMonth === now.toISOString().slice(0, 7);
            const days = isCurrentMonth ? now.getDate() : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const total = this.filteredList.reduce((acc, cur) => acc + (cur.personalShare || 0), 0);
            return total / days;
        },
        paymentStats() {
            const stats = { '現金': 0, '信用卡': 0, '掃碼支付': 0, '郵局匯款': 0 };
            this.filteredList.forEach(t => {
                if (stats[t.paymentMethod] !== undefined) stats[t.paymentMethod] += (t.personalShare || 0);
            });
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
        renderChart() {
            const ctx = this.$refs.categoryChart.getContext('2d');
            if (this.chartInstance) this.chartInstance.destroy();

            const data = this.sortedCategoryData;
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d.name),
                    datasets: [{
                        data: data.map(d => d.total),
                        backgroundColor: ['#4A4A4A', '#8C8C8C', '#BDBDBD', '#D1C7BD', '#E5E5E5', '#F2F2F2'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                    },
                    cutout: '70%'
                }
            });
        }
    },
    mounted() {
        this.renderChart();
    },
    watch: {
        selectedMonth() {
            this.$nextTick(() => this.renderChart());
        },
        transactions() {
            this.$nextTick(() => this.renderChart());
        }
    }
};
