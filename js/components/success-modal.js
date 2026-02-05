export const SuccessModal = {
    props: ['visible', 'item'],
    template: `
    <div v-if="visible" class="fixed inset-0 z-[200] flex items-end justify-center sm:items-center pointer-events-none">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300" 
             @click="$emit('close')"></div>
        
        <!-- Modal Card -->
        <div class="relative bg-white w-full max-w-sm mx-4 mb-6 sm:mb-0 p-6 rounded-[2rem] shadow-2xl pointer-events-auto transform transition-all duration-500 animate-spring-up flex flex-col items-center space-y-5">
            
            <!-- Icon -->
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <span class="material-symbols-rounded text-3xl text-[#4A4A4A]">check</span>
            </div>

            <!-- Title & Content -->
            <div class="text-center space-y-1">
                <h3 class="text-base font-bold text-gray-800 tracking-wider">已新增</h3>
                <p class="text-sm text-gray-500 font-medium tracking-wide">
                    {{ item.name }}
                    <span class="ml-1 text-[#4A4A4A] font-bold">{{ currencySymbol }} {{ formatNumber(item.amount) }}</span>
                </p>
            </div>

            <!-- Actions -->
            <div class="w-full space-y-3 pt-2">
                <!-- Confirm Button -->
                <button @click="$emit('close')" 
                        class="w-full bg-[#4A4A4A] text-white py-4 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase active:scale-[0.92] transition-transform duration-200 ease-out shadow-lg shadow-gray-200">
                    確認
                </button>
                
                <!-- View Details -->
                <button @click="$emit('view-details')" 
                        class="w-full text-gray-300 py-2 text-[10px] tracking-widest font-medium active:bg-gray-50 active:text-gray-400 rounded-xl transition-colors">
                    看明細
                </button>
            </div>
        </div>
    </div>
    `,
    computed: {
        currencySymbol() {
            return this.item && this.item.currency === 'TWD' ? '$' : '¥';
        }
    },
    methods: {
        formatNumber(num) {
            return new Intl.NumberFormat().format(Math.round(num || 0));
        }
    }
};
