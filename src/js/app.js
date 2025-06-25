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
document.addEventListener('DOMContentLoaded', () => {
    // ==================== DOM元素缓存 ====================
    // 缓存常用的DOM元素引用，避免重复查询，提升性能
    const appRoot = document.getElementById('main-content');        // 主内容区域
    const navLinks = document.querySelectorAll('.sidebar ul li a'); // 所有导航链接
    
    // 缓存各个导航链接元素，用于动态更新图标和文字
    const navElements = {
        editor: document.querySelector('a[href="#editor"]'),     // 编辑器导航
        icons: document.querySelector('a[href="#icons"]'),       // 图标库导航
        themes: document.querySelector('a[href="#themes"]'),     // 主题库导航
        drafts: document.querySelector('a[href="#drafts"]'),     // 草稿仓导航
        publish: document.querySelector('a[href="#publish"]')    // 发布仓导航
    };

    // Make Logger globally available
    window.Logger = {
        debug: (message, data = null) => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log(`[Qulome Debug] ${message}`, data || '');
            }
        },
        error: (message, error = null) => {
            console.error(`[Qulome Error] ${message}`, error || '');
        },
        info: (message, data = null) => {
            console.info(`[Qulome Info] ${message}`, data || '');
        }
    };

    // ==================== 错误处理系统 ====================
    /**
     * 统一的错误处理机制
     * 负责捕获、记录和用户友好地显示错误信息
     */
    const ErrorHandler = {
        /**
         * 处理错误的主入口
         * @param {Error|string} error - 错误对象或错误消息
         * @param {string} context - 错误发生的上下文，用于调试
         */
        handle: (error, context = 'Unknown') => {
            Logger.error(`Error in ${context}`, error);
            
            // 向用户显示友好的错误提示
            const userMessage = ErrorHandler.getUserMessage(error);
            if (userMessage) {
                alert(userMessage);
            }
        },
        
        /**
         * 将技术性错误转换为用户友好的消息
         * @param {Error|string} error - 错误对象或错误消息
         * @returns {string} 用户友好的错误消息
         */
        getUserMessage: (error) => {
            // 如果错误本身就是字符串消息，直接返回
            if (typeof error === 'string') {
                return error;
            }
            
            if (error.message) {
                // 根据错误类型提供相应的用户友好提示
                if (error.message.includes('localStorage')) {
                    return '存储空间不足，请清理浏览器缓存后重试。';
                }
                if (error.message.includes('JSON')) {
                    return '数据格式错误，将重置相关设置。';
                }
                if (error.message.includes('required')) {
                    return '请填写必要的信息。';
                }
                return error.message;
            }
            
            // 兜底的通用错误消息
            return '操作失败，请重试。';
        }
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

    // ==================== 主题应用系统 ====================
    /**
     * 将当前激活主题的样式应用到页面根元素
     * 通过CSS自定义属性(CSS Variables)的方式，使主题变量在全局CSS中可用
     * 这是主题系统的核心函数，确保样式的统一性
     */
    const applyCurrentActiveTheme = () => {
        try {
            const activeTheme = window.themeService.getActiveTheme();
            if (activeTheme && activeTheme.styles) {
                // 遍历主题样式对象，将每个CSS变量设置到根元素
                for (const [key, value] of Object.entries(activeTheme.styles)) {
                    document.documentElement.style.setProperty(key, value);
                }
                Logger.debug('Theme applied successfully', activeTheme.name);
            }
        } catch (error) {
            Logger.error('Failed to apply active theme', error);
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

    // ==================== 全局状态管理 ====================
    // let currentDraftId = window.draftService.getCurrentDraftId(); // MOVED to editor-view.js
    // let quillInstance = null; // MOVED to editor-view.js

    // ==================== 工具函数 ====================
    /**
     * 防抖函数 - 限制函数的执行频率
     * 用于优化频繁触发的事件（如文本输入、窗口调整等）
     * @param {Function} func - 需要防抖的函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {Function} 防抖后的函数
     */
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // ==================== 路由系统 ====================
    /**
     * 路由处理器集合
     * 只保留需要特殊处理的路由（如主题编辑器）
     */
    const RouteHandlers = {
        'theme-editor': (fullHash) => {
            const urlParams = new URLSearchParams(fullHash.split('?')[1]);
            const themeId = urlParams.get('id');
            
            let theme = window.themeService.getTheme(themeId);

            if (!theme) {
                alert('主题未找到!');
                window.location.hash = '#themes';
                return;
            }
            
            // Set up the theme editor interface
            appRoot.innerHTML = `
                <div class="theme-editor-view">
                    <h2>编辑主题: ${theme.name}</h2>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <form id="theme-editor-form">
                                <!-- Form will be populated by JavaScript -->
                            </form>
                        </div>
                        <div style="flex: 1;">
                            <h3>预览</h3>
                            <div id="theme-preview-pane" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                                <!-- Preview will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const formContainer = document.getElementById('theme-editor-form');
            const previewPane = document.getElementById('theme-preview-pane');

            function renderPreview() {
                const styles = Object.entries(theme.styles)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('; ');
                previewPane.setAttribute('style', styles);
                
                previewPane.innerHTML = `
                    <h1>这是标题样式</h1>
                    <p>这是正文段落的样式预览。您可以在这里看到字体颜色、段落间距等效果。</p>
                    <p>这段包含<a href="#">链接样式</a>的文字，可以看到链接的颜色效果。</p>
                    <blockquote>这是引用块的样式预览，可以看到背景色效果。</blockquote>
                `;
            }

            function renderForm() {
                // Define the structure of the accordion - 支持完整的样式变量
                const sections = {
                    '标题系统': {
                        'H1 字号': ['--h1-font-size', 'text'], 'H1 颜色': ['--h1-color', 'color'],
                        'H1 字重': ['--h1-font-weight', 'text'], 'H1 对齐': ['--h1-text-align', 'text'],
                        'H2 字号': ['--h2-font-size', 'text'], 'H2 颜色': ['--h2-color', 'color'],
                        'H2 字重': ['--h2-font-weight', 'text'], 'H2 对齐': ['--h2-text-align', 'text'],
                        'H3 字号': ['--h3-font-size', 'text'], 'H3 颜色': ['--h3-color', 'color'],
                        'H3 字重': ['--h3-font-weight', 'text'], 'H3 对齐': ['--h3-text-align', 'text'],
                    },
                    '正文系统': {
                        '字体族': ['--p-font-family', 'text'], '字号': ['--p-font-size', 'text'], 
                        '颜色': ['--p-color', 'color'], '行间距': ['--p-line-height', 'text'], 
                        '段落间距': ['--p-margin-bottom', 'text'], '文本对齐': ['--p-text-align', 'text'],
                    },
                    '特殊文本': {
                        '链接颜色': ['--a-color', 'color'], '链接悬停颜色': ['--a-hover-color', 'color'],
                        '粗体颜色': ['--strong-color', 'color'], '斜体颜色': ['--em-color', 'color'],
                        '代码背景': ['--code-bg', 'color'], '代码颜色': ['--code-color', 'color'],
                    },
                    '块级元素': {
                        '引用块背景': ['--blockquote-bg', 'color'], '引用块边框颜色': ['--blockquote-border-color', 'color'],
                        '引用块内边距': ['--blockquote-padding', 'text'], '引用块颜色': ['--blockquote-color', 'color'],
                        '代码块背景': ['--code-block-bg', 'color'], '代码块颜色': ['--code-block-color', 'color'],
                        '代码块内边距': ['--code-block-padding', 'text'], '代码块圆角': ['--code-block-border-radius', 'text'],
                    },
                    '列表样式': {
                        '无序列表样式': ['--ul-list-style', 'text'], '有序列表样式': ['--ol-list-style', 'text'],
                        '列表缩进': ['--list-pl', 'text'],
                    },
                    '视觉分隔': {
                        '分割线颜色': ['--hr-color', 'color'], '分割线高度': ['--hr-height', 'text'],
                        '分割线边距': ['--hr-margin', 'text'],
                    }
                };

                let formHtml = '<div class="accordion">';
                for (const sectionTitle in sections) {
                    formHtml += `
                        <div class="accordion-item">
                            <div class="accordion-header">${sectionTitle}</div>
                            <div class="accordion-content">
                    `;
                    const fields = sections[sectionTitle];
                    for (const label in fields) {
                        const [styleKey, inputType] = fields[label];
                        formHtml += `
                            <div class="form-group">
                                <label for="${styleKey}">${label}</label>
                                <input type="${inputType}" id="${styleKey}" value="${theme.styles[styleKey] || ''}">
                            </div>
                        `;
                    }
                    formHtml += '</div></div>';
                }
                formHtml += '</div>';
                
                formContainer.innerHTML = formHtml;

                // --- Accordion Logic ---
                document.querySelectorAll('.accordion-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const content = header.nextElementSibling;
                        header.classList.toggle('active');
                        content.classList.toggle('show');
                    });
                });

                // --- Event Listeners for all inputs ---
                for (const section in sections) {
                    for (const label in sections[section]) {
                        const [styleKey] = sections[section][label];
                        const inputElement = document.getElementById(styleKey);
                        if(inputElement) {
                            const eventType = inputElement.type === 'color' ? 'input' : 'change';
                            inputElement.addEventListener(eventType, (e) => {
                                theme.styles[styleKey] = e.target.value;
                                renderPreview();
                                window.themeService.updateTheme(theme);
                            });
                        }
                    }
                }
            }
            
            renderForm();
            renderPreview();
        }
    };

    /**
     * 主视图渲染函数 - 简化的静态视图切换系统
     * 所有视图都已静态化到HTML中，这里只负责显示/隐藏切换
     * @param {string} fullHash - 完整的URL哈希（如 #editor 或 #theme-editor?id=123）
     */
    function renderCurrentView(fullHash) {
        const hash = fullHash.split('?')[0]; // 提取基础路由
        
        // 隐藏所有视图
        document.querySelectorAll('#welcome-view, #editor-view, #icons-view, #themes-view, #drafts-view, #publish-view').forEach(v => v.style.display = 'none');
        
        // 根据路由显示对应视图并初始化
        switch (hash) {
            case '#welcome':
            case '#':
            case '':
                document.getElementById('welcome-view').style.display = 'block';
                break;
            case '#editor':
                document.getElementById('editor-view').style.display = 'block';
                if (window.EditorView) window.EditorView.init();
                break;
            case '#icons':
                document.getElementById('icons-view').style.display = 'block';
                if (window.IconsView) window.IconsView.init();
                break;
            case '#themes':
                document.getElementById('themes-view').style.display = 'block';
                if (window.ThemesView) window.ThemesView.init();
                break;
            case '#drafts':
                document.getElementById('drafts-view').style.display = 'block';
                if (window.DraftsView) window.DraftsView.init();
                break;
            case '#publish':
                document.getElementById('publish-view').style.display = 'block';
                if (window.PublishView) window.PublishView.init();
                break;
            case '#theme-editor':
                // 主题编辑器仍然需要动态生成，因为需要传递参数
                const urlParams = new URLSearchParams(fullHash.split('?')[1]);
                const themeId = urlParams.get('id');
                let theme = window.themeService.getTheme(themeId);
                if (!theme) {
                    alert('主题未找到!');
                    window.location.hash = '#themes';
            return;
        }
                appRoot.innerHTML = `
                    <div class="theme-editor-view">
                        <h2>编辑主题: ${theme.name}</h2>
                        <div style="display: flex; gap: 20px;">
                            <div style="flex: 1;">
                                <form id="theme-editor-form">
                                    <!-- Form will be populated by JavaScript -->
                                </form>
                            </div>
                            <div style="flex: 1;">
                                <h3>预览</h3>
                                <div id="theme-preview-pane" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                                    <!-- Preview will be populated by JavaScript -->
                                </div>
                </div>
                </div>
            </div>
                `;
                if (RouteHandlers['theme-editor']) {
                    RouteHandlers['theme-editor'](fullHash);
                }
                break;
            default:
                // 未知路由，显示欢迎页
                document.getElementById('welcome-view').style.display = 'block';
                break;
        }

        // 应用当前激活的主题样式到整个文档
        applyCurrentActiveTheme();
        
        // 更新侧边栏导航图标，确保每次视图切换后图标都正确显示
        setupSidebar();
    }

    // 视图渲染函数已移至各自的模块中

    function updateActiveLink(hash) {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function handleRouteChange() {
        const fullHash = window.location.hash || '#welcome';
        const hash = fullHash.split('?')[0]; // Get the base route, e.g., '#theme-editor'
        renderCurrentView(fullHash); // Pass the full hash to renderCurrentView
        updateActiveLink(hash); // Use the base route for the active link
    }

    window.addEventListener('hashchange', handleRouteChange);

    // Initial load
    handleRouteChange();

    // 一键发布功能已移至editor-view.js模块中
}); 