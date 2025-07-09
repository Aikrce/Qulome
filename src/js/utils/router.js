/**
 * Router Module - 路由管理器
 * 
 * 将app.js中的路由处理逻辑拆分为独立模块，提供更好的代码组织
 */

window.Router = {
    // 当前活动视图跟踪
    currentActiveView: null,
    
    // 全局事件处理器跟踪
    globalEventHandlers: new Map(),

    /**
     * 清理当前视图
     */
    cleanupCurrentView() {
        try {
            if (this.currentActiveView && window[this.currentActiveView]) {
                window.Logger.debug(`Cleaning up ${this.currentActiveView}...`);
                
                if (typeof window[this.currentActiveView].cleanup === 'function') {
                    window[this.currentActiveView].cleanup();
                    window.Logger.debug(`${this.currentActiveView} cleanup completed`);
                } else {
                    window.Logger.warn(`${this.currentActiveView} has no cleanup method`);
                }
                
                this.currentActiveView = null;
            }
        } catch (error) {
            window.Logger.error('Failed to cleanup current view', error);
        }
    },

    /**
     * 添加并跟踪全局事件处理器
     */
    addGlobalEventHandler(element, event, callback, description = '') {
        if (!element) {
            window.Logger.warn('Attempted to add event handler to null element', description);
            return;
        }
        
        const existingHandler = this.globalEventHandlers.get(`${element.id || 'unknown'}-${event}`);
        if (existingHandler) {
            element.removeEventListener(event, existingHandler.callback);
            window.Logger.debug(`Removed existing ${event} handler for ${description}`);
        }

        element.addEventListener(event, callback);
        this.globalEventHandlers.set(`${element.id || 'unknown'}-${event}`, { 
            event, 
            callback, 
            description,
            element 
        });
        
        window.Logger.debug(`Added ${event} handler for ${description}`);
    },

    /**
     * 清理所有全局事件处理器
     */
    cleanupGlobalEventHandlers() {
        window.Logger.debug(`Cleaning up ${this.globalEventHandlers.size} global event handlers...`);
        
        this.globalEventHandlers.forEach((handler, key) => {
            try {
                if (handler.element && typeof handler.element.removeEventListener === 'function') {
                    handler.element.removeEventListener(handler.event, handler.callback);
                    window.Logger.debug(`Removed global ${handler.event} handler for ${handler.description}`);
                }
            } catch (error) {
                window.Logger.error(`Failed to remove global event handler for ${handler.description}`, error);
            }
        });
        
        this.globalEventHandlers.clear();
        window.Logger.debug('Global event handlers cleanup completed');
    },

    /**
     * 视图路由处理器
     */
    viewHandlers: {
        welcome() {
            window.Logger.debug('Showing welcome view');
            document.getElementById('welcome-view').style.display = 'block';
            window.Router.currentActiveView = null;
        },

        editor() {
            window.Logger.debug('Initializing editor view');
            document.getElementById('editor-view').style.display = 'block';
            if (window.EditorView) {
                window.EditorView.init();
                window.Router.currentActiveView = 'EditorView';
                window.Logger.debug('Editor view initialized successfully');
            } else {
                window.Logger.error('EditorView not found');
            }
        },

        icons() {
            window.Logger.debug('Initializing icons view');
            document.getElementById('icons-view').style.display = 'block';
            if (window.IconsView) {
                window.IconsView.init();
                window.Router.currentActiveView = 'IconsView';
                window.Logger.debug('Icons view initialized successfully');
            } else {
                window.Logger.error('IconsView not found');
            }
        },

        themes() {
            window.Logger.debug('Initializing themes view');
            document.getElementById('themes-view').style.display = 'block';
            if (window.ThemesView) {
                window.ThemesView.init();
                window.Router.currentActiveView = 'ThemesView';
                window.Logger.debug('Themes view initialized successfully');
            } else {
                window.Logger.error('ThemesView not found');
            }
        },

        drafts() {
            window.Logger.debug('Initializing drafts view');
            document.getElementById('drafts-view').style.display = 'block';
            if (window.DraftsView) {
                window.DraftsView.init();
                window.Router.currentActiveView = 'DraftsView';
                window.Logger.debug('Drafts view initialized successfully');
            } else {
                window.Logger.error('DraftsView not found');
            }
        },

        publish() {
            window.Logger.debug('Initializing publish view');
            document.getElementById('publish-view').style.display = 'block';
            if (window.PublishView) {
                window.PublishView.init();
                window.Router.currentActiveView = 'PublishView';
                window.Logger.debug('Publish view initialized successfully');
            } else {
                window.Logger.error('PublishView not found');
            }
        },

        themeEditor(fullHash) {
            window.Logger.debug('Initializing theme editor');
            const urlParams = new URLSearchParams(fullHash.split('?')[1]);
            const themeId = urlParams.get('id');
            let theme = window.themeService.getTheme(themeId);
            
            if (!theme) {
                window.Logger.error('Theme not found for editor', themeId);
                window.ErrorHandler.handle('主题未找到!');
                window.location.hash = '#themes';
                return;
            }
            
            window.Logger.debug(`Editing theme: ${theme.name} (${themeId})`);
            document.getElementById('theme-editor-view').style.display = 'block';
            
            if (window.ThemeEditorView) {
                window.ThemeEditorView.init(theme);
                window.Router.currentActiveView = 'ThemeEditorView';
                window.Logger.debug('Theme editor initialized successfully');
            } else {
                window.Logger.error('ThemeEditorView not found');
            }
        }
    },

    /**
     * 隐藏所有视图
     */
    hideAllViews() {
        const allViews = document.querySelectorAll('#welcome-view, #editor-view, #icons-view, #themes-view, #drafts-view, #publish-view, #theme-editor-view');
        allViews.forEach(v => v.style.display = 'none');
        window.Logger.debug(`Hidden ${allViews.length} views`);
    },

    /**
     * 应用当前主题
     */
    applyCurrentTheme() {
        const activeTheme = window.themeService.getActiveTheme();
        if (activeTheme) {
            window.Logger.debug(`Applying active theme: ${activeTheme.name} (${activeTheme.id})`);
            window.themeService.applyTheme(activeTheme.id);
        } else {
            window.Logger.warn('No active theme found');
        }
    },

    /**
     * 主视图渲染函数
     */
    renderCurrentView(fullHash) {
        const hash = fullHash.split('?')[0];
        
        window.Logger.debug(`Rendering view for hash: ${fullHash} (base: ${hash})`);
        
        this.cleanupCurrentView();
        this.hideAllViews();
        
        // 路由映射
        const routes = {
            '#welcome': 'welcome',
            '#': 'welcome',
            '': 'welcome',
            '#editor': 'editor',
            '#icons': 'icons',
            '#themes': 'themes',
            '#drafts': 'drafts',
            '#publish': 'publish',
            '#theme-editor': 'themeEditor'
        };

        const handlerName = routes[hash];
        
        if (handlerName && this.viewHandlers[handlerName]) {
            if (handlerName === 'themeEditor') {
                this.viewHandlers[handlerName](fullHash);
            } else {
                this.viewHandlers[handlerName]();
            }
        } else {
            window.Logger.warn(`Unknown route: ${hash}, showing welcome view`);
            this.viewHandlers.welcome();
        }

        this.applyCurrentTheme();
        
        window.Logger.debug(`View rendering completed. Current active view: ${this.currentActiveView}`);
    },

    /**
     * 更新导航链接激活状态
     */
    updateActiveLink(hash) {
        const navLinks = document.querySelectorAll('.sidebar ul li a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * 处理路由变化
     */
    handleRouteChange() {
        const fullHash = window.location.hash || '#welcome';
        const hash = fullHash.split('?')[0];
        
        window.Logger.debug(`Route changed to: ${fullHash} (base: ${hash})`);
        
        this.renderCurrentView(fullHash);
        this.updateActiveLink(hash);

        window.Logger.debug('Route change handling completed');
    },

    /**
     * 初始化路由系统
     */
    init() {
        // 添加hashchange事件监听
        this.addGlobalEventHandler(window, 'hashchange', () => this.handleRouteChange(), 'hashchange route handler');

        // 页面卸载时清理
        this.addGlobalEventHandler(window, 'beforeunload', () => {
            window.Logger.debug('Page unloading, cleaning up all event handlers...');
            this.cleanupCurrentView();
            this.cleanupGlobalEventHandlers();
        }, 'page unload cleanup');

        // 初始化加载
        window.Logger.debug('Router initialized, handling initial route...');
        this.handleRouteChange();
    }
};