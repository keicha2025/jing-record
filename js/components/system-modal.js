export const SystemModal = {
    props: ['visible', 'config'],
    template: `
    <div v-show="visible" class="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
        
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
             :class="visible ? 'opacity-100' : 'opacity-0'" 
             @click="handleBackdropClick"></div>
        
        <!-- Modal Card -->
        <div class="relative bg-white w-[90%] max-w-[320px] p-6 rounded-[2rem] shadow-2xl pointer-events-auto transform transition-all duration-300 flex flex-col items-center space-y-4"
             :class="visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'">
            
            <!-- Icon -->
            <div class="w-14 h-14 rounded-full flex items-center justify-center mb-1" 
                 :class="iconBgClass">
                <span class="material-symbols-rounded text-3xl" :class="iconColorClass">{{ iconName }}</span>
            </div>

            <!-- Title & Content -->
            <div class="text-center space-y-2 w-full">
                <h3 v-if="config.title" class="text-base font-bold text-gray-800 tracking-wider">{{ config.title }}</h3>
                
                <!-- Simple Message -->
                <p v-if="config.message" class="text-sm text-gray-500 font-medium leading-relaxed whitespace-pre-wrap">{{ config.message }}</p>

                <!-- Transaction Details Slot (Custom Content) -->
                <div v-if="config.type === 'transaction_success' && config.data" class="pt-1">
                    <p class="text-sm text-gray-500 font-medium tracking-wide">
                        {{ config.data.name }}
                        <span class="ml-1 text-[#4A4A4A] font-bold">{{ currencySymbol }} {{ formatNumber(config.data.amount) }}</span>
                    </p>
                </div>
            </div>

            <!-- Actions -->
            <div class="w-full space-y-3 pt-2">
                <!-- Primary Action -->
                <button @click="$emit('confirm')" 
                        class="w-full text-white py-3.5 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase active:scale-[0.96] transition-transform duration-200 shadow-md"
                        :class="primaryBtnClass">
                    {{ config.confirmText || '確認' }}
                </button>
                
                <!-- Secondary Action (Cancel / View Details) -->
                <button v-if="config.showCancel || config.secondaryText"
                        @click="$emit('cancel')" 
                        class="w-full text-gray-400 py-2 text-[11px] tracking-widest font-medium active:bg-gray-50 rounded-xl transition-colors">
                    {{ config.secondaryText || '取消' }}
                </button>
            </div>
        </div>
    </div>
    `,
    computed: {
        iconName() {
            const map = {
                success: 'check',
                transaction_success: 'check',
                error: 'priority_high', // exclamation mark
                confirm: 'help',        // question mark
                warning: 'warning'
            };
            return map[this.config.type] || 'info';
        },
        iconBgClass() {
            // 所有狀態統一使用灰色背景
            return 'bg-gray-50';
        },
        iconColorClass() {
            const map = {
                success: 'text-[#4A4A4A]',
                transaction_success: 'text-[#4A4A4A]',
                // error, warning, confirm 使用灰色
            };
            return map[this.config.type] || 'text-gray-400';
        },
        primaryBtnClass() {
            // 所有按鈕統一使用主色
            return 'bg-[#4A4A4A] shadow-gray-200';
        },
        currencySymbol() {
            return this.config.data && this.config.data.currency === 'TWD' ? '$' : '¥';
        }
    },
    methods: {
        handleBackdropClick() {
            // Dismiss if it's just an alert or success, but maybe block for confirm?
            // User UX: clicking backdrop usually cancels.
            this.$emit('cancel');
        },
        formatNumber(num) {
            return new Intl.NumberFormat().format(Math.round(num || 0));
        }
    }
};
