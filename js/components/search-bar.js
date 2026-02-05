
export const SearchBar = {
    template: `
    <div class="sticky top-0 z-40 bg-[#FDFCFB]/95 backdrop-blur-sm py-2 -mx-4 px-4 border-b border-gray-50/50">
        <div class="flex space-x-2">
            <!-- Search Input -->
            <div class="flex-1 bg-white rounded-xl flex items-center px-3 py-2 shadow-sm border border-gray-50 transition-shadow focus-within:shadow-md">
                <span class="material-symbols-rounded text-gray-300 text-lg">search</span>
                <input 
                    type="text" 
                    :value="modelValue.keyword"
                    @input="$emit('update:modelValue', { ...modelValue, keyword: $event.target.value })"
                    placeholder="搜尋..." 
                    class="w-full text-xs ml-2 outline-none text-gray-600 placeholder-gray-300 bg-transparent"
                >
            </div>
            
            <!-- Type Filter -->
            <div class="relative group">
                <select 
                    :value="modelValue.mode"
                    @change="$emit('update:modelValue', { ...modelValue, mode: $event.target.value })"
                    class="appearance-none bg-white border border-gray-50 shadow-sm text-xs text-center font-medium text-gray-500 rounded-xl px-4 py-2 pr-8 outline-none h-full focus:ring-1 focus:ring-gray-200 transition-all cursor-pointer"
                >
                    <option value="all">全部</option>
                    <option value="general">一般</option>
                    <option value="project">專案</option>
                </select>
                <span class="absolute right-2 top-1/2 transform -translate-y-1/2 material-symbols-rounded text-gray-300 text-sm pointer-events-none group-hover:text-gray-400 transition-colors">expand_more</span>
            </div>
        </div>
    </div>
    `,
    props: ['modelValue'],
    emits: ['update:modelValue']
};
