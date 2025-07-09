/**
 * Qulome 微信文章排版工具 - 主应用程序
 * 
 * 功能概述：
 * - 单页面应用(SPA)架构，支持多视图路由
 * - WYSIWYG编辑器，支持富文本编辑和Markdown导入
 * - 主题系统，支持自定义样式和实时预览
 * - 图标库管理，支持SVG图标的添加和使用
 * - 草稿自动保存和发布管理
 * - 一键复制到微信编辑器
 */

// ErrorHandler is now loaded from utils/error-handler.js

document.addEventListener('DOMContentLoaded', () => {
    // ==================== 服务初始化 ====================
    // 实例化所有服务并挂载到window对象
    window.themeService = new ThemeService();
    // ... 其他服务可以按需在这里初始化 ...

    // 应用当前主题
    const activeTheme = window.themeService.getActiveTheme();
    if (activeTheme) {
        window.themeService.applyTheme(activeTheme.id);
    }

    // ==================== DOM元素缓存 ====================
    // 缓存常用的DOM元素引用，避免重复查询，提升性能
    const appRoot = window.DOMCache.getElementById('main-content');        // 主内容区域
    const navLinks = window.DOMCache.getAll('.sidebar ul li a'); // 所有导航链接
    
    // 缓存各个导航链接元素，用于动态更新图标和文字
    const navElements = {
        editor: window.DOMCache.get('a[href="#editor"]'),     // 编辑器导航
        icons: window.DOMCache.get('a[href="#icons"]'),       // 图标库导航
        themes: window.DOMCache.get('a[href="#themes"]'),     // 主题库导航
        drafts: window.DOMCache.get('a[href="#drafts"]'),     // 草稿仓导航
        publish: window.DOMCache.get('a[href="#publish"]')    // 发布仓导航
    };

    // ==================== 数据验证工具 ====================
    /**
     * 数据验证工具集
     * 用于验证各种数据对象的完整性和有效性，确保数据安全
     */
    const DataValidator = {
        /**
         * 验证主题对象的有效性
         * @param {Object} theme - 主题对象
         * @returns {boolean} 是否为有效的主题对象
         */
        isValidTheme: (theme) => {
            return theme && 
                   typeof theme.id === 'string' && 
                   typeof theme.name === 'string' && 
                   typeof theme.styles === 'object';
        },
        
        /**
         * 验证图标对象的有效性
         * @param {Object} icon - 图标对象
         * @returns {boolean} 是否为有效的图标对象
         */
        isValidIcon: (icon) => {
            return icon && 
                   typeof icon.id === 'string' && 
                   typeof icon.name === 'string' && 
                   typeof icon.svg === 'string';
        },
        
        /**
         * 验证草稿对象的有效性
         * @param {Object} draft - 草稿对象
         * @returns {boolean} 是否为有效的草稿对象
         */
        isValidDraft: (draft) => {
            return draft && 
                   typeof draft.id === 'string' && 
                   typeof draft.title === 'string' && 
                   typeof draft.content === 'string';
        }
    };


    // ==================== 导航图标系统 ====================
    /**
     * 创建带图标的导航链接HTML
     * @param {string} path - 图标类型标识符
     * @param {string} text - 导航文字
     * @returns {string} 包含图标和文字的HTML字符串
     */
    const createNavigationIconHTML = (path, text) => {
        // 预定义的导航图标SVG集合（使用Feather Icons风格）
        const iconPaths = {
            welcome: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
            editor: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
            icons: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>`,
            themes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`,
            drafts: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
            publish: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`
        };
        return `<span class="nav-icon">${iconPaths[path]}</span> <span class="nav-text">${text}</span>`;
    };

    /**
     * 动态设置侧边栏导航链接的图标和文字
     * 使用缓存的DOM元素引用，提高性能
     * 在每次路由切换时调用，确保导航状态正确
     */
    const setupSidebar = () => {
        // 安全地更新每个导航链接，避免空指针异常
        if (navElements.editor) navElements.editor.innerHTML = createNavigationIconHTML('editor', '主视图');
        if (navElements.icons) navElements.icons.innerHTML = createNavigationIconHTML('icons', '图标库');
        if (navElements.themes) navElements.themes.innerHTML = createNavigationIconHTML('themes', '主题库');
        if (navElements.drafts) navElements.drafts.innerHTML = createNavigationIconHTML('drafts', '草稿仓');
        if (navElements.publish) navElements.publish.innerHTML = createNavigationIconHTML('publish', '发布仓');
    };

    // 所有主要视图已静态化到HTML中，不再需要动态路由模板




    // ==================== 初始化系统 ====================
    // 初始化事件管理器
    if (window.EventManager) {
        window.EventManager.init();
        window.Logger.debug('EventManager initialized');
    }

    // 初始化路由系统
    if (window.Router) {
        window.Router.init();
        window.Logger.debug('Router initialized');
    }

    // 更新侧边栏导航图标，确保每次视图切换后图标都正确显示
    setupSidebar();

    window.Logger.debug('Qulome application initialized successfully');
    
    // Clear DOM cache when page unloads to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        if (window.DOMCache) {
            window.DOMCache.clear();
        }
    });
}); 

// Logger is now loaded from utils/logger.js 