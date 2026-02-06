export const ViewerFooter = {
    props: ['currentTab', 'appMode'],
    template: `
    <footer class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-50 px-6 pb-10 pt-4 z-50">
        <div class="max-w-md mx-auto flex items-center justify-between">
            <button v-for="tab in tabs" :key="tab" @click="$emit('update:currentTab', tab)"
                    :class="[currentTab === tab ? 'text-gray-800' : 'text-gray-200', 'nav-item']"
                    class="transition-colors duration-200">
                <span class="material-symbols-rounded text-2xl">{{ getTabIcon(tab) }}</span>
            </button>
        </div>
    </footer>
    `,
    data() {
        return {
            // 移除 'add' tab
            tabs: ['overview', 'history', 'stats', 'settings']
        };
    },
    methods: {
        getTabIcon(tab) {
            const icons = {
                overview: 'grid_view',
                history: 'calendar_month', // or history
                stats: 'pie_chart',
                settings: 'settings'
            };
            return icons[tab] || 'circle';
        }
    }
};
