export const CONFIG = {
    // 你的 GAS 部署網址
    // 你的 GAS 部署網址 (優先讀取本地 env.js，若無則使用預設值)
    GAS_URL: (window.ENV && window.ENV.GAS_URL) ? window.ENV.GAS_URL : "__GAS_URL__",

    // 你的 Google 試算表網址
    SPREADSHEET_URL: "__SPREADSHEET_URL__",

    TWD_FIXED_RATE: 0.22,
    TAB_ICONS: {
        overview: 'dashboard',
        history: 'list_alt',
        add: 'add',
        stats: 'bar_chart',
        settings: 'settings'
    }
};
