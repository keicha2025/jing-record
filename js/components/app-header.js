export const AppHeader = {
    props: ['appMode', 'syncStatus', 'currentTab', 'historyFilter', 'displayCurrency'],
    template: `
    <header class="w-full max-w-md mx-auto px-4 h-16 flex justify-between items-center border-b border-gray-50/50">
        <div class="flex items-center">
            <h1 class="text-lg font-light tracking-[0.3em] text-gray-300 uppercase leading-none mt-4">Nichi-Nichi</h1>
        </div>

        <div class="flex items-center space-x-2 mt-4">
            <!-- NEW: Currency Toggle in Header -->
            <div v-if="currentTab === 'overview' || currentTab === 'stats'" 
                 @click="$emit('toggle-currency')"
                 class="flex items-center justify-center text-[9px] bg-white border border-gray-100 text-gray-400 px-3 h-7 rounded-full cursor-pointer transition-all hover:bg-gray-50 active:scale-95 muji-shadow uppercase tracking-widest font-medium">
                {{ displayCurrency }}
            </div>

            <!-- Filter Clear Button -->
            <div v-if="currentTab === 'history'"
                 @click="$emit('clear-filter')"
                 class="flex items-center justify-center space-x-1 text-[9px] bg-gray-100 text-gray-400 px-3 h-7 rounded-full cursor-pointer transition-colors hover:bg-gray-200">
                <span class="material-symbols-rounded !text-xs">filter_list_off</span>
                <span class="leading-none">CLEAR</span>
            </div>
        </div>
    </header>
    `
};
