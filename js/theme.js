/**
 * Design Theme
 * 集中管理 JavaScript 中使用的設計變數 (如 Chart.js 顏色配置)
 * 數值應與 css/design-tokens.css 保持一致
 */

export const Theme = {
    colors: {
        primary: '#4A4A4A',
        bgMain: '#FDFCFB',
        textMain: '#4A4A4A',
        textSecondary: '#9CA3AF',

        // Status
        danger: '#fca5a5',
        googleGreen: '#16a34a',

        // Chart Palette (Monochrome/Analogous)
        chart: [
            '#4A4A4A',
            '#7A7A7A',
            '#9A9A9A',
            '#BDBDBD',
            '#D1C7BD',
            '#E5E5E5'
        ]
    },
    fonts: {
        main: '"Noto Sans TC", sans-serif'
    }
};
