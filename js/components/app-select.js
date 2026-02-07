export const AppSelect = {
    props: {
        modelValue: {},
        options: { type: Array, default: () => [] },
        paddingClass: { type: String, default: 'px-4 py-3.5' },
        roundedClass: { type: String, default: 'rounded-2xl' }
    },
    emits: ['update:modelValue'],
    template: `
    <div class="relative">
        <!-- Global Click Overlay -->
        <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40 bg-transparent"></div>

        <button 
            @click="isOpen = !isOpen"
            class="w-full flex items-center justify-between bg-gray-50 border border-transparent transition-all duration-300 active:scale-[0.98] z-50 relative"
            :class="[
                isOpen ? 'bg-white border-gray-100 shadow-sm' : '',
                paddingClass,
                roundedClass
            ]"
        >
            <div class="flex items-center">
                <span class="text-xs font-medium tracking-wide text-gray-700">{{ selectedLabel }}</span>
            </div>
            <span class="material-symbols-rounded text-gray-300 transition-transform duration-300" :class="{'rotate-180': isOpen}">unfold_more</span>
        </button>

        <div v-if="isOpen" class="absolute z-50 w-full mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-50 overflow-hidden animate-spring-up">
            <ul class="py-2 max-h-60 overflow-y-auto no-scrollbar">
                <li v-for="item in options" :key="item.value">
                    <button 
                        @click="selectOption(item)"
                        class="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                    >
                        <div class="flex items-center">
                            <span class="text-xs tracking-wider" :class="item.value === modelValue ? 'font-bold text-gray-800' : 'text-gray-500'">{{ item.label }}</span>
                        </div>
                        <span v-if="item.value === modelValue" class="material-symbols-rounded text-gray-800 text-sm">check_circle</span>
                    </button>
                </li>
            </ul>
        </div>
    </div>
    `,
    data() {
        return {
            isOpen: false
        };
    },
    computed: {
        selectedLabel() {
            const selected = this.options.find(opt => opt.value === this.modelValue);
            return selected ? selected.label : '請選擇';
        }
    },
    methods: {
        selectOption(item) {
            this.$emit('update:modelValue', item.value);
            this.isOpen = false;
        }
    }
};
