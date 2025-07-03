/**
 * Qulome Application Configuration
 * 统一管理应用程序的配置项
 */

window.QulomeConfig = {
    // 应用程序信息
    app: {
        name: 'Qulome',
        version: '1.0.0',
        description: '文字可以很美',
        author: 'Qulome Team'
    },

    // 存储配置
    storage: {
        prefix: 'qulome_',
        keys: {
            themes: 'qulome_themes',
            activeTheme: 'qulome_active_theme_id',
            drafts: 'qulome_drafts',
            currentDraft: 'qulome_current_draft_id',
            icons: 'qulome_icons',
            published: 'qulome_published',
            settings: 'qulome_settings'
        }
    },

    // 编辑器配置
    editor: {
        defaultHeight: 'calc(100vh - 220px)',
        autosaveDelay: 2000,
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{'header': 1}, {'header': 2}],
            ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image', 'insertIcon'],
            ['clean']
        ]
    },

    // 主题配置
    theme: {
        defaultStyles: {
            // 1. 标题系统
            '--h1-font-size': '24px', '--h1-color': '#1F2937', '--h1-font-weight': 'bold',
            '--h2-font-size': '20px', '--h2-color': '#1F2937', '--h2-font-weight': 'bold',
            '--h3-font-size': '18px', '--h3-color': '#1F2937', '--h3-font-weight': 'bold',
            
            // 2. 正文系统
            '--p-font-family': 'sans-serif', '--p-font-size': '16px', '--p-color': '#374151',
            '--p-line-height': '1.7', '--p-margin-bottom': '20px',
            
            // 3. 特殊文本
            '--a-color': '#4338CA', '--a-hover-color': '#312E81',
            '--code-bg': '#E5E7EB', '--code-color': '#BE123C',
            
            // 4. 块级元素
            '--blockquote-bg': '#F3F4F6', '--blockquote-border-color': '#D1D5DB',
            '--code-block-bg': '#111827', '--code-block-color': '#E5E7EB',
            
            // 5. 视觉分隔
            '--hr-color': '#D1D5DB', '--hr-height': '1px'
        }
    },

    // 日志配置
    logging: {
        enabled: true,
        level: 'debug', // debug, info, warn, error
        prefix: '[Qulome]'
    },

    // 性能配置 - 优化防卡死设置
    performance: {
        debounceDelay: 1000, // 减少到1秒，避免频繁保存
        healthCheckInterval: 30000, // 减少到30秒
        maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
        maxEventListeners: 100, // 限制事件监听器数量
        maxAutoSaveRetries: 3, // 自动保存重试次数
        previewUpdateDelay: 300, // 预览更新延迟
        modalTimeout: 5000, // 模态框超时时间
        // 防卡死机制
        preventHang: {
            maxExecutionTime: 1000, // 最大执行时间1秒
            maxMemoryUsage: 50 * 1024 * 1024, // 最大内存使用50MB
            enableWorker: false, // 暂时禁用Web Worker
            enableThrottling: true, // 启用节流
            throttleDelay: 100 // 节流延迟100ms
        }
    },

    // UI配置
    ui: {
        animationDuration: 300,
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        },
        maxContentWidth: 1200
    },

    // 错误处理配置
    errorHandling: {
        showUserFriendlyMessages: true,
        logErrors: true,
        maxRetries: 3,
        // 防卡死错误处理
        hangDetection: {
            enabled: true,
            timeout: 3000, // 3秒超时
            maxConsecutiveErrors: 5 // 最大连续错误数
        }
    },

    // 可访问性配置
    accessibility: {
        focusOutlineWidth: '2px',
        skipLinkEnabled: true,
        screenReaderSupport: true
    }
};

// 冻结配置对象，防止意外修改
Object.freeze(window.QulomeConfig); 