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
    const appRoot = document.getElementById('app-root');           // 主内容区域
    const navLinks = document.querySelectorAll('.sidebar ul li a'); // 所有导航链接
    
    // 缓存各个导航链接元素，用于动态更新图标和文字
    const navElements = {
        editor: document.querySelector('a[href="#editor"]'),     // 编辑器导航
        icons: document.querySelector('a[href="#icons"]'),       // 图标库导航
        themes: document.querySelector('a[href="#themes"]'),     // 主题库导航
        drafts: document.querySelector('a[href="#drafts"]'),     // 草稿仓导航
        publish: document.querySelector('a[href="#publish"]')    // 发布仓导航
    };

    // ==================== 日志管理系统 ====================
    /**
     * 统一的日志管理器
     * 提供分级日志记录，开发环境显示调试信息，生产环境只显示错误和信息
     */
    const Logger = {
        /**
         * 调试日志 - 仅在本地开发环境显示
         * @param {string} message - 日志消息
         * @param {*} data - 附加数据（可选）
         */
        debug: (message, data = null) => {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log(`[Qulome Debug] ${message}`, data || '');
            }
        },
        /**
         * 错误日志 - 总是显示，用于错误追踪
         * @param {string} message - 错误消息
         * @param {Error|*} error - 错误对象（可选）
         */
        error: (message, error = null) => {
            console.error(`[Qulome Error] ${message}`, error || '');
        },
        /**
         * 信息日志 - 重要操作的记录
         * @param {string} message - 信息消息
         * @param {*} data - 附加数据（可选）
         */
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

    const routes = {
        '#welcome': `
            <div class="welcome-view">
                <h1>κύλημα</h1>
                <p>文字可以很美</p>
                <div class="welcome-buttons">
                    <a href="#themes" class="btn">选择模版</a>
                    <a href="#editor" class="btn">直接开始</a>
                </div>
            </div>
        `,
        '#editor': `
            <div class="editor-view">
                <div class="main-view-header">
                    <h1>主视图</h1>
                    <p>在这里挥洒您的创意，让思想流动成美丽的文字。</p>
                </div>
                <div class="editor-actions">
                    <button id="import-md-btn" class="btn btn-secondary">导入Markdown</button>
                    <button id="change-theme-btn" class="btn btn-secondary">更换主题</button>
                    <button id="copy-wechat-btn" class="btn btn-accent">一键复制</button>
                </div>
                <div class="editor-wrapper">
                    <div id="editor-container" style="height: calc(100vh - 220px);"></div>
                </div>
            </div>
        `,
        '#icons': `
            <div class="icons-view">
                <div class="icons-main">
                    <div class="main-view-header">
                        <h1>我的图标库</h1>
                        <p>管理您的SVG图标，方便在文章中随时调用。</p>
                    </div>
                    <div id="icons-grid" class="icons-grid">
                        <!-- Icons will be rendered here -->
                    </div>
                </div>
                <div class="icons-sidebar">
                    <h3>添加新图标</h3>
                    <form id="add-icon-form">
                        <div class="form-group">
                            <label for="icon-name">图标名称</label>
                            <input type="text" id="icon-name" name="icon-name" required>
                        </div>
                        <div class="form-group">
                            <label for="icon-svg">SVG 代码</label>
                            <textarea id="icon-svg" name="icon-svg" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">保存到图标库</button>
                    </form>
                    <div class="icon-resources">
                        <p>寻找灵感？试试这些免费图标库：</p>
                        <ul>
                            <li><a href="https://tabler-icons.io/" target="_blank">Tabler Icons</a></li>
                            <li><a href="https://lucide.dev/" target="_blank">Lucide</a></li>
                            <li><a href="https://heroicons.com/" target="_blank">Heroicons</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `,
        '#themes': `
            <div class="themes-view">
                <div class="themes-main">
                    <div class="main-view-header">
                        <h1>我的主题库</h1>
                        <p>在这里创建、编辑和管理您的文章主题。</p>
                    </div>
                    <div class="themes-grid">
                        <!-- Theme cards will be rendered here -->
                    </div>
                </div>
                <div class="themes-sidebar">
                    <h2>创建新主题</h2>
                    <p>从这里开始，为您的新主题命名。</p>
                    <input type="text" id="new-theme-name" placeholder="我的新主题">
                    <button id="create-theme-btn" class="btn btn-primary btn-full">创建并编辑新主题</button>
                </div>
            </div>
        `,
        '#drafts': `
            <div class="drafts-view">
                <div class="main-view-header">
                    <h1>草稿仓</h1>
                <p>这里存放着您所有未完成的作品。点击"载入"即可继续编辑。</p>
                </div>
                <div id="drafts-list" class="item-list">
                    <!-- Drafts will be rendered here -->
                </div>
            </div>
        `,
        '#publish': `
            <div class="publish-view">
                <div class="main-view-header">
                    <h1>发布仓</h1>
                <p>这里是您已完成的杰作。可以随时将它们移回草稿仓进行再次编辑。</p>
                </div>
                <div id="publish-list" class="item-list">
                    <!-- Published articles will be rendered here -->
                </div>
            </div>
        `,
        '#theme-editor': `
            <div class="theme-editor-view">
                <h2>编辑主题</h2>
                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <form id="theme-editor-form">
                            <!-- Form content will be populated by JavaScript -->
                        </form>
                    </div>
                    <div style="flex: 1;">
                        <h3>预览</h3>
                        <div id="theme-preview-pane" style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: white;">
                            <!-- Preview content will be populated by JavaScript -->
                        </div>
                    </div>
                </div>
            </div>
        `,
    };

    // ==================== 全局状态管理 ====================
    let currentDraftId = window.draftService.getCurrentDraftId(); // 当前正在编辑的草稿ID
    let quillInstance = null; // 缓存Quill编辑器实例，避免重复创建，提升性能

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
     * 将原本巨大的renderView函数拆分为独立的路由处理器
     * 每个处理器负责特定页面的初始化和事件绑定
     */
    const RouteHandlers = {
        /**
         * 编辑器页面处理器
         * 负责初始化Quill编辑器、设置工具栏、绑定事件等
         * @param {string} fullHash - 完整的路由哈希（包含查询参数）
         */
        editor: (fullHash) => {
            const editorContainer = document.getElementById('editor-container');
            
            // 性能优化：如果Quill实例不存在或容器已更改，才创建新实例
            if (!quillInstance || !document.querySelector('#editor-container .ql-editor')) {
                const toolbarOptions = [
                    ['bold', 'italic', 'underline'],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'align': [] }],
                    [{ 'color': [] }],
                    ['blockquote', 'code-block', {'list': 'ordered'}, {'list': 'bullet'}],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link', 'image']
                ];

                quillInstance = new Quill('#editor-container', {
                    modules: {toolbar: toolbarOptions},
                    theme: 'snow'
                });
            }
            
            const quill = quillInstance;

            if (!currentDraftId) {
                const newDraft = window.draftService.createDraft('');
                currentDraftId = newDraft.id;
                window.draftService.setCurrentDraftId(currentDraftId);
            }

            const draft = window.draftService.getDraft(currentDraftId);
            if (draft && draft.content) {
                quill.root.innerHTML = draft.content;
            }

            const autoSave = debounce((content) => {
                const current = window.draftService.getDraft(currentDraftId);
                const draftToSave = {
                    ...current,
                    title: content.substring(0, 30).replace(/<[^>]+>/g, ' ').trim() || '无标题草稿',
                    content: content,
                    updatedAt: new Date().toISOString()
                };
                window.draftService.saveDraft(draftToSave);
                                        Logger.debug("Draft saved successfully");
            }, 2000);

            quill.on('text-change', () => {
                const content = quill.root.innerHTML;
                autoSave(content);
            });
            
            quill.getModule('toolbar').addHandler('insertIcon', () => {
                openIconModal(quill);
            });

            // Set custom icon for the toolbar button
            const insertIconBtn = document.querySelector('.ql-insertIcon');
            if(insertIconBtn){
                insertIconBtn.innerHTML = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M5,19V5h14v14H5z"/><path fill="currentColor" d="M10.2,14.4l-1.8-1.8L6,15l4.2,4.2l6-6l-2.4-2.4L10.2,14.4z"/></svg>`;
            }

            // Change button classes for consistency
            document.getElementById('import-md-btn').className = 'btn btn-secondary';
            document.getElementById('change-theme-btn').className = 'btn btn-secondary';
            document.getElementById('copy-wechat-btn').className = 'btn btn-accent';

            // Add event listeners for new buttons
            document.getElementById('import-md-btn').addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.md, .markdown';

                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let markdownText = e.target.result;
                        // 1. 彻底去除多余空行（支持 \r\n、\n、\r）
                        markdownText = markdownText.replace(/([\r\n]+\s*){2,}/g, '\n\n');
                        
                        const converter = new showdown.Converter();
                        let html = converter.makeHtml(markdownText);
                        // 2. 去除所有空<p>和<p><br></p>段落
                        html = html.replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, '');
                        quill.root.innerHTML = html;
                    };
                    reader.onerror = () => {
                        alert('读取文件时出错！');
                    };
                    reader.readAsText(file);
                });

                fileInput.click();
            });

            document.getElementById('change-theme-btn').addEventListener('click', () => {
                window.location.hash = '#themes';
            });

            document.getElementById('copy-wechat-btn').addEventListener('click', () => {
                const activeTheme = window.themeService.getActiveTheme();
                const styles = activeTheme.styles;
                
                // Create a temporary container to process the HTML
                const tempContainer = document.createElement('div');
                tempContainer.innerHTML = quill.root.innerHTML;

                // Apply styles inline
                tempContainer.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
                    el.style.color = styles['--h1-color'];
                });
                tempContainer.querySelectorAll('p').forEach(el => {
                    el.style.color = styles['--p-color'];
                });
                tempContainer.querySelectorAll('a').forEach(el => {
                    el.style.color = styles['--a-color'];
                });
                // You can expand this to include more styles like font-size, margin, etc.

                let finalHtml = tempContainer.innerHTML;

                // Replace icon placeholders with actual SVG code (优化性能)
                const icons = window.iconService.getIcons();
                const iconMap = new Map(icons.map(icon => [icon.name, icon])); // 使用Map提高查找效率
                
                finalHtml = finalHtml.replace(/\[icon:([^\]]+)\]/g, (match, iconName) => {
                    const icon = iconMap.get(iconName.trim());
                    if (!icon) return match;
                    
                    if (icon.color) {
                        // Inject color into SVG style
                        return icon.svg.replace(/<svg/i, `<svg style="color: ${icon.color};"`);
                    }
                    return icon.svg;
                });

                // Copy to clipboard
                navigator.clipboard.writeText(finalHtml).then(() => {
                    alert('已成功复制到剪贴板！现在可以粘贴到微信编辑器中了。');
                }).catch(err => {
                                            Logger.error('复制失败', err);
                    alert('复制失败，请检查浏览器权限或手动复制。');
                });
            });

            // 在编辑器下方插入按钮容器
            const editorWrapper = document.querySelector('.editor-wrapper') || document.querySelector('#editor-container').parentNode;
            let actionBar = document.querySelector('.editor-action-bar');
            if (!actionBar) {
                actionBar = document.createElement('div');
                actionBar.className = 'editor-action-bar';
                actionBar.style.display = 'flex';
                actionBar.style.justifyContent = 'center';
                actionBar.style.gap = '16px';
                actionBar.style.margin = '24px 0 0 0';
                editorWrapper.appendChild(actionBar);
            }
            // 保存按钮
            let saveBtn = document.querySelector('.editor-save-btn');
            if (!saveBtn) {
                saveBtn = document.createElement('button');
                saveBtn.className = 'editor-save-btn main-btn';
                saveBtn.textContent = '保存修改';
                saveBtn.style.minWidth = '120px';
                actionBar.appendChild(saveBtn);
            }
            // 放弃按钮
            let discardBtn = document.querySelector('.editor-discard-btn');
            if (!discardBtn) {
                discardBtn = document.createElement('button');
                discardBtn.className = 'editor-discard-btn main-btn';
                discardBtn.textContent = '放弃修改';
                discardBtn.style.minWidth = '120px';
                actionBar.appendChild(discardBtn);
            }
            // 保存修改逻辑
            saveBtn.onclick = async () => {
                const content = quill.root.innerHTML;
                try {
                    await window.draftService.saveDraft(content); // 假设draftService有saveDraft方法
                    window.themeService.resetToDefault && window.themeService.resetToDefault();
                    // 切回主视图（假设有showMainView方法）
                    window.showMainView && window.showMainView();
                } catch (e) {
                    alert('保存失败，请重试');
                }
            };
            // 放弃修改逻辑
            discardBtn.onclick = () => {
                quill.setContents([]);
                window.themeService.resetToDefault && window.themeService.resetToDefault();
            };
        },

        icons: (fullHash) => {
            renderIconLibraryView();
        },

        themes: (fullHash) => {
            renderThemeLibraryView();
            
            const createBtn = document.getElementById('create-theme-btn');
            
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    const themeNameInput = document.getElementById('new-theme-name');
                    
                    if (themeNameInput) {
                        const newThemeName = themeNameInput.value.trim();
                        
                        if (newThemeName) {
                            try {
                                const newTheme = window.themeService.addTheme(newThemeName);
                                Logger.debug('New theme created', newTheme);
                                themeNameInput.value = ''; // Clear input
                                window.location.hash = `#theme-editor?id=${newTheme.id}`;
                            } catch (error) {
                                Logger.error('Error creating theme', error);
                                alert('创建主题时出错：' + error.message);
                            }
                        } else {
                            alert('请输入主题名称！');
                        }
                    } else {
                        Logger.error('Theme name input not found');
                    }
                });
            } else {
                Logger.error('Create theme button not found');
            }
        },

        drafts: (fullHash) => {
            renderDraftManagementView();
        },

        publish: (fullHash) => {
            renderPublishedArticlesView();
        },

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
                // Define the structure of the accordion
                const sections = {
                    '标题系统': {
                        'H1 字号': ['--h1-font-size', 'text'], 'H1 颜色': ['--h1-color', 'color'],
                        'H2 字号': ['--h2-font-size', 'text'], 'H2 颜色': ['--h2-color', 'color'],
                        'H3 字号': ['--h3-font-size', 'text'], 'H3 颜色': ['--h3-color', 'color'],
                    },
                    '正文系统': {
                        '字号': ['--p-font-size', 'text'], '颜色': ['--p-color', 'color'],
                        '行间距': ['--p-line-height', 'text'], '段落间距': ['--p-margin-bottom', 'text'],
                    },
                    '特殊文本': {
                        '链接颜色': ['--a-color', 'color'], '链接悬停颜色': ['--a-hover-color', 'color'],
                        '代码背景': ['--code-bg', 'color'], '代码颜色': ['--code-color', 'color'],
                    },
                    '块级元素': {
                        '引用块背景': ['--blockquote-bg', 'color'], '引用块边框颜色': ['--blockquote-border-color', 'color'],
                        '代码块背景': ['--code-block-bg', 'color'], '代码块颜色': ['--code-block-color', 'color'],
                    },
                    '视觉分隔': {
                        '分割线颜色': ['--hr-color', 'color'], '分割线高度': ['--hr-height', 'text'],
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
     * 主视图渲染函数 - SPA路由系统的核心
     * 负责根据URL哈希渲染对应的页面视图
     * @param {string} fullHash - 完整的URL哈希（如 #editor 或 #theme-editor?id=123）
     */
    function renderCurrentView(fullHash) {
        const hash = fullHash.split('?')[0]; // 提取基础路由，忽略查询参数

        // 获取对应的HTML模板，如果路由不存在则显示欢迎页
        const view = routes[hash] || routes['#welcome'];
        appRoot.innerHTML = view;

        // 应用当前激活的主题样式到整个文档
        applyCurrentActiveTheme();

        // 更新侧边栏导航图标，确保每次视图切换后图标都正确显示
        setupSidebar();

        // 调用对应的路由处理器进行页面特定的初始化
        const routeName = hash.replace('#', '');
        if (RouteHandlers[routeName]) {
            RouteHandlers[routeName](fullHash);
        }
    }

    // ==================== 视图渲染函数 ====================
    /**
     * 渲染图标库视图
     * 显示所有已保存的SVG图标，支持复制和删除操作
     * 使用事件委托优化性能，避免为每个图标单独绑定事件
     */
    function renderIconLibraryView() {
        const icons = window.iconService.getIcons();
        const gridContainer = document.getElementById('icons-grid');
        
        // 批量生成图标卡片HTML，减少DOM操作次数
        gridContainer.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-id="${icon.id}">
                <div class="icon-preview">${icon.svg}</div>
                <p class="icon-name">${icon.name}</p>
                <div class="icon-actions">
                    <button class="btn btn-secondary copy-svg-btn">复制</button>
                    <button class="btn btn-danger delete-icon-btn-new">删除</button>
                </div>
            </div>
        `).join('');

        // 使用事件委托优化性能：单个事件监听器处理所有图标的操作
        gridContainer.addEventListener('click', (e) => {
                e.stopPropagation();
            const iconCard = e.target.closest('.icon-card');
            if (!iconCard) return; // 如果点击的不是图标卡片，忽略事件
            
            const iconId = iconCard.dataset.iconId;
            
            // 处理复制SVG按钮点击
            if (e.target.classList.contains('copy-svg-btn')) {
                const icon = window.iconService.getIcon(iconId);
                if (icon) {
                    navigator.clipboard.writeText(icon.svg).then(() => {
                        alert(`已复制图标 "${icon.name}" 的 SVG 代码！`);
                    }).catch(err => {
                        Logger.error('复制 SVG 失败', err);
                        alert('复制失败！');
                    });
                }
            } 
            // 处理删除图标按钮点击
            else if (e.target.classList.contains('delete-icon-btn-new')) {
                if (confirm('确定要删除这个图标吗？')) {
                    window.iconService.deleteIcon(iconId);
                    renderIconLibraryView(); // 重新渲染图标列表
                }
                }
        });

        const addIconForm = document.getElementById('add-icon-form');
        addIconForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('icon-name');
            const svgInput = document.getElementById('icon-svg');
            const name = nameInput.value.trim();
            const svg = svgInput.value.trim();
            
            if (name && svg) {
                window.iconService.addIcon(name, svg);
                    renderIconLibraryView();
                nameInput.value = '';
                svgInput.value = '';
            } else {
                alert('请填写图标名称和 SVG 代码。');
            }
        });
    }

    function renderDraftManagementView() {
        const drafts = window.draftService.getDrafts().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('drafts-list');
        
        document.querySelector('.drafts-view h2').textContent = `草稿仓 (${drafts.length})`;

        if (drafts.length === 0) {
            listContainer.innerHTML = `<p>空空如也，快去创作吧！</p>`;
            return;
        }

        listContainer.innerHTML = drafts.map(draft => `
            <div class="list-item" data-draft-id="${draft.id}">
                <div class="item-info">
                    <h3 class="item-title">${draft.title}</h3>
                    <p class="item-meta">最后更新于: ${new Date(draft.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary load-draft-btn">载入</button>
                    <button class="btn-primary publish-draft-btn">发布</button>
                    <button class="btn-danger delete-draft-btn">删除</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.load-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                window.draftService.setCurrentDraftId(draftId);
                currentDraftId = draftId; // Update global currentDraftId
                window.location.hash = '#editor';
            });
        });

        document.querySelectorAll('.publish-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                const draft = window.draftService.getDraft(draftId);
                if (draft) {
                    window.publishService.addPublished(draft);
                    window.draftService.deleteDraft(draftId);
                    renderDraftManagementView(); // Refresh drafts list
                }
            });
        });

        document.querySelectorAll('.delete-draft-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const draftId = e.target.closest('.list-item').dataset.draftId;
                if (confirm('确定要删除这篇草稿吗？此操作不可撤销。')) {
                    window.draftService.deleteDraft(draftId);
                    renderDraftManagementView(); // Re-render the list
                }
            });
        });
    }

    function renderPublishedArticlesView() {
        const publishedArticles = window.publishService.getPublished().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        const listContainer = document.getElementById('publish-list');

        document.querySelector('.publish-view h2').textContent = `发布仓 (${publishedArticles.length})`;

        if (publishedArticles.length === 0) {
            listContainer.innerHTML = `<p>这里还没有已发布的文章。</p>`;
            return;
        }

        listContainer.innerHTML = publishedArticles.map(article => `
             <div class="list-item" data-article-id="${article.id}">
                <div class="item-info">
                    <h3 class="item-title">${article.title}</h3>
                    <p class="item-meta">发布于: ${new Date(article.updatedAt).toLocaleString()}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary re-edit-btn">重新编辑</button>
                    <button class="btn-danger delete-published-btn">删除</button>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.re-edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                const article = window.publishService.getPublished().find(a => a.id === articleId);
                if (article) {
                    window.draftService.saveDraft(article); // Move back to drafts
                    window.publishService.deletePublished(articleId);
                    renderPublishedArticlesView();
                }
            });
        });
        
        document.querySelectorAll('.delete-published-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const articleId = e.target.closest('.list-item').dataset.articleId;
                if (confirm('确定要删除这篇已发布的文章吗？')) {
                    window.publishService.deletePublished(articleId);
                    renderPublishedArticlesView();
                }
            });
        });
    }

    function renderThemeLibraryView() {
        const themes = window.themeService.getThemes();
        const grid = document.querySelector('.themes-grid');
        
        // 批量处理主题卡片，减少DOM操作
        const themeCardsHTML = themes.map(theme => {
            // 缓存样式字符串计算
            const styles = Object.entries(theme.styles)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
            return `
            <div class="theme-card" data-theme-id="${theme.id}" style="${styles}">
                <h3>${theme.name}</h3>
                <div class="theme-preview">
                    <h1>文章标题</h1>
                    <p>这是一段正文预览。</p>
                    <a href="#">这是一个链接</a>
                </div>
                <div class="theme-actions">
                    <button class="btn btn-primary start-btn">开始</button>
                    <button class="btn btn-secondary edit-btn">编辑</button>
                </div>
            </div>
        `}).join('');
        
        grid.innerHTML = themeCardsHTML;

        // Add event listeners for the new buttons
        document.querySelectorAll('.start-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeId = e.target.closest('.theme-card').dataset.themeId;
                window.themeService.setActiveTheme(themeId);
                window.location.hash = '#editor';
            });
        });
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeId = e.target.closest('.theme-card').dataset.themeId;
                Logger.debug('Editing theme ID', themeId);
                window.location.hash = `#theme-editor?id=${themeId}`;
            });
        });
    }

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



    function openIconSelectionModal(quill) {
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">选择一个图标</h3>
                <div id="modal-icons-grid" class="icons-grid">
                    <!-- Icons will be loaded here -->
                </div>
                <button class="modal-close-btn">&times;</button>
            </div>
        `;
        document.body.appendChild(modal);

        const icons = window.iconService.getIcons();
        const grid = modal.querySelector('#modal-icons-grid');
        grid.innerHTML = icons.map(icon => `
            <div class="icon-card" data-icon-name="${icon.name}">
                <div class="icon-preview">${icon.svg}</div>
            </div>
        `).join('');

        grid.querySelectorAll('.icon-card').forEach(card => {
            card.addEventListener('click', () => {
                const iconName = card.dataset.iconName;
                const range = quill.getSelection(true);
                quill.insertText(range.index, `[icon:${iconName}]`);
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 事件监听器管理
    const EventManager = {
        listeners: new Map(),
        
        add: (element, event, handler, key = null) => {
            const listenerKey = key || `${event}_${Date.now()}_${Math.random()}`;
            
            if (EventManager.listeners.has(listenerKey)) {
                EventManager.remove(listenerKey);
            }
            
            element.addEventListener(event, handler);
            EventManager.listeners.set(listenerKey, {
                element,
                event,
                handler
            });
            
            return listenerKey;
        },
        
        remove: (key) => {
            const listener = EventManager.listeners.get(key);
            if (listener) {
                listener.element.removeEventListener(listener.event, listener.handler);
                EventManager.listeners.delete(key);
            }
        },
        
        removeAll: () => {
            EventManager.listeners.forEach((listener, key) => {
                EventManager.remove(key);
            });
        },
        
        removeByPrefix: (prefix) => {
            const keysToRemove = [];
            EventManager.listeners.forEach((listener, key) => {
                if (key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            });
            keysToRemove.forEach(key => EventManager.remove(key));
        }
    };

    // 应用程序健康检查
    const AppHealthCheck = {
        check: () => {
            const results = {
                services: AppHealthCheck.checkServices(),
                localStorage: AppHealthCheck.checkLocalStorage(),
                dom: AppHealthCheck.checkDOM()
            };
            
            Logger.debug('Health check results', results);
            return results;
        },
        
        checkServices: () => {
            const services = ['themeService', 'draftService', 'iconService', 'publishService'];
            const results = {};
            
            services.forEach(service => {
                results[service] = window[service] ? 'OK' : 'MISSING';
            });
            
            return results;
        },
        
        checkLocalStorage: () => {
            try {
                const testKey = 'qulome_health_check';
                localStorage.setItem(testKey, 'test');
                localStorage.removeItem(testKey);
                return 'OK';
            } catch (error) {
                return 'ERROR';
            }
        },
        
        checkDOM: () => {
            const essentialElements = ['app-root'];
            const results = {};
            
            essentialElements.forEach(id => {
                results[id] = document.getElementById(id) ? 'OK' : 'MISSING';
            });
            
            return results;
        },
        
        autoFix: () => {
            const healthResults = AppHealthCheck.check();
            let fixedIssues = [];
            
            // 检查并修复localStorage问题
            if (healthResults.localStorage === 'ERROR') {
                try {
                    // 尝试清理可能损坏的数据
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('qulome_')) {
                            try {
                                JSON.parse(localStorage.getItem(key));
                            } catch (e) {
                                localStorage.removeItem(key);
                                fixedIssues.push(`Removed corrupted localStorage key: ${key}`);
                            }
                        }
                    });
                } catch (error) {
                    Logger.error('Failed to fix localStorage issues', error);
                }
            }
            
            // 检查并修复服务
            Object.entries(healthResults.services).forEach(([service, status]) => {
                if (status === 'MISSING') {
                    Logger.error(`Critical service missing: ${service}`);
                }
            });
            
            if (fixedIssues.length > 0) {
                Logger.info('Auto-fixed issues', fixedIssues);
            }
            
            return fixedIssues;
        }
    };

    // 初始化时进行健康检查
    const initHealthCheck = () => {
        try {
            const healthResults = AppHealthCheck.check();
            const fixedIssues = AppHealthCheck.autoFix();
            
            // 如果有严重问题，通知用户
            const criticalIssues = [];
            Object.entries(healthResults.services).forEach(([service, status]) => {
                if (status === 'MISSING') {
                    criticalIssues.push(service);
                }
            });
            
            if (criticalIssues.length > 0) {
                Logger.error('Critical services missing', criticalIssues);
                alert('应用程序初始化失败，请刷新页面重试。');
            }
        } catch (error) {
            Logger.error('Health check failed', error);
        }
    };
}); 