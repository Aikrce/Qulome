/**
 * Themes View Module
 * 
 * 负责主题库视图的渲染、事件绑定和交互逻辑。
 * - 渲染主题卡片列表
 * - 处理新主题创建
 * - 处理主题的应用与删除
 * - 保证事件绑定健壮、无重复
 * - 统一错误处理和用户反馈
 */
window.ThemesView = {
    // State management
    isInitialized: false,
    eventHandlers: new Map(),

    /**
     * 初始化主题库视图：渲染主题列表并绑定事件
     */
    init: () => {
        try {
            if (window.ThemesView.isInitialized) {
                window.Logger.debug('ThemesView already initialized, refreshing...');
                window.ThemesView.render();
                return;
            }

        window.ThemesView.render();
        window.ThemesView.bindEvents();
            window.ThemesView.isInitialized = true;
            window.Logger.debug('ThemesView initialized successfully');
        } catch (error) {
            window.Logger.error('Failed to initialize ThemesView', error);
            window.ThemesView.showError('主题视图初始化失败，请刷新页面重试');
        }
    },

    /**
     * 清理事件处理器和资源
     */
    cleanup: () => {
        window.ThemesView.eventHandlers.forEach((handler, element) => {
            if (element && typeof element.removeEventListener === 'function') {
                element.removeEventListener(handler.event, handler.callback);
            }
        });
        window.ThemesView.eventHandlers.clear();
        window.ThemesView.isInitialized = false;
        window.Logger.debug('ThemesView cleaned up');
    },

    /**
     * 添加事件处理器并跟踪以便清理
     */
    addEventHandler: (element, event, callback) => {
        if (!element) return;
        
        // 移除现有处理器（如果存在）
        const existingHandler = window.ThemesView.eventHandlers.get(element);
        if (existingHandler && existingHandler.event === event) {
            element.removeEventListener(event, existingHandler.callback);
        }

        // 添加新处理器
        element.addEventListener(event, callback);
        window.ThemesView.eventHandlers.set(element, { event, callback });
    },

    /**
     * 渲染主题卡片列表
     * 遍历所有主题，生成卡片HTML并插入到#themes-grid
     */
    render: () => {
        try {
        const themes = window.themeService.getThemes();
        const grid = document.getElementById('themes-grid');
            
        if (!grid) {
                throw new Error('主题列表容器 #themes-grid 未找到');
            }

            if (themes.length === 0) {
                grid.innerHTML = '<p class="empty-state">还没有主题，创建第一个主题吧！</p>';
            return;
        }

        grid.innerHTML = themes.map(theme => {
            // Defensive check for theme name and id
            const themeName = (theme && typeof theme.name === 'string' && theme.name) 
                ? window.ThemesView.escapeHtml(theme.name) 
                : '<i>无效名称</i>';
            const themeId = theme ? theme.id : null;
            if (!themeId) {
                window.Logger.warn('渲染主题卡片时 themeId 缺失', theme);
                return '';
            } // Don't render cards without an ID

            return `
            <div class="theme-card ${theme.isActive ? 'active' : ''}" data-theme-id="${themeId}">
                    ${!theme.isSystemTheme ? `<button class="theme-card-delete delete-theme-btn" title="删除主题">&times;</button>` : ''}
                <div class="theme-preview">
                        <div class="preview-h1" style="color: ${theme.styles['--h1-color'] || '#1F2937'};">标题样式</div>
                        <div class="preview-p" style="color: ${theme.styles['--p-color'] || '#374151'};">正文内容样式预览...</div>
                        <div class="preview-a" style="color: ${theme.styles['--a-color'] || '#4338CA'};">链接样式</div>
                    </div>
                    <div class="theme-info">
                        <div class="theme-name">${themeName}</div>
                        ${theme.isActive ? '<span class="theme-status">当前使用</span>' : ''}
                </div>
                <div class="theme-actions">
                        <button class="btn btn-primary apply-theme-btn" ${theme.isActive ? 'disabled' : ''}>
                            ${theme.isActive ? '已应用' : '应用'}
                        </button>
                        <button class="btn btn-secondary edit-theme-btn" title="编辑主题">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            编辑
                        </button>
                </div>
            </div>
        `;
        }).join('');

            window.Logger.debug(`Rendered ${themes.length} themes`);
        } catch (error) {
            window.Logger.error('Failed to render themes', error);
            window.ThemesView.showError('渲染主题列表失败');
        }
    },

    /**
     * 绑定主题库相关事件（表单提交、卡片点击）
     * 绑定前先解绑，防止重复绑定
     */
    bindEvents: () => {
        try {
        const form = document.getElementById('add-theme-form');
        const grid = document.getElementById('themes-grid');

            if (!form) {
                throw new Error('主题表单未找到');
            }
            if (!grid) {
                throw new Error('主题列表容器未找到');
            }

            // 绑定"添加新主题"表单提交事件
            window.ThemesView.addEventHandler(form, 'submit', (event) => {
                event.preventDefault();
                window.ThemesView.handleAddTheme();
            });

            // 绑定主题卡片的"应用/删除"事件（事件委托）
            window.ThemesView.addEventHandler(grid, 'click', (event) => {
                window.ThemesView.handleThemeCardClick(event);
            });

            // 绑定表单输入验证
            const nameInput = document.getElementById('new-theme-name');
            if (nameInput) {
                window.ThemesView.addEventHandler(nameInput, 'input', () => {
                    window.ThemesView.validateThemeNameInput(nameInput);
                });
            }

            window.Logger.debug('ThemesView events bound successfully');
        } catch (error) {
            window.Logger.error('Failed to bind events', error);
            window.ThemesView.showError('事件绑定失败');
        }
    },

    /**
     * 处理添加新主题
     */
    handleAddTheme: () => {
        try {
            const nameInput = document.getElementById('new-theme-name');
            
            if (!nameInput) {
                throw new Error('主题名称输入框未找到');
            }
            
            const themeName = nameInput.value.trim();
            if (!themeName) {
                throw new Error('主题名称不能为空');
            }

            if (themeName.length > 50) {
                throw new Error('主题名称不能超过50个字符');
            }

            // 检查主题名称是否已存在
            const existingThemes = window.themeService.getThemes();
            if (existingThemes.some(theme => theme.name === themeName)) {
                throw new Error('主题名称已存在，请使用其他名称');
            }
            
            // 创建新主题
            const newTheme = window.themeService.addTheme(themeName);
            
            // 清空输入框
            nameInput.value = '';
            nameInput.classList.remove('error');
            
            // 显示成功消息并跳转到主题编辑器
            window.ThemesView.showSuccess(`主题 "${themeName}" 创建成功！正在打开编辑器...`);
                window.Logger.debug('新主题创建成功:', themeName);
            
            // 短暂延迟后跳转到主题编辑器
            setTimeout(() => {
                window.ThemesView.showThemeEditor(newTheme.id);
            }, 1000);
            
            } catch (error) {
                window.Logger.error('创建主题失败:', error);
            window.ThemesView.showError(error.message || '创建主题失败');
            
            // 高亮错误输入框
            const nameInput = document.getElementById('new-theme-name');
            if (nameInput) {
                nameInput.classList.add('error');
            }
        }
    },

    /**
     * 处理主题卡片点击事件
     */
    handleThemeCardClick: (event) => {
        try {
            const themeCard = event.target.closest('.theme-card');
            if (!themeCard) return;
            
            const themeId = themeCard.dataset.themeId;
            if (!themeId) return;

            // 应用主题
            if (event.target.classList.contains('apply-theme-btn')) {
                if (event.target.disabled) return;
                
                window.themeService.applyTheme(themeId);
                window.ThemesView.render();
                const theme = window.themeService.getTheme(themeId);
                window.ThemesView.showSuccess(`主题 "${theme.name}" 已应用！`);
                
                // 通知其他组件主题已更改
                window.ThemesView.notifyThemeChange();
            }
            // 编辑主题
            else if (event.target.classList.contains('edit-theme-btn') || event.target.closest('.edit-theme-btn')) {
                window.ThemesView.handleEditTheme(themeId);
            }
            // 删除主题
            else if (event.target.classList.contains('delete-theme-btn')) {
                event.stopPropagation(); // 阻止事件冒泡
                window.ThemesView.handleDeleteTheme(themeId);
            }
        } catch (error) {
            window.Logger.error('处理主题卡片点击失败', error);
            window.ThemesView.showError('操作失败，请重试');
        }
    },

    /**
     * 处理编辑主题
     */
    handleEditTheme: (themeId) => {
        window.ThemesView.showThemeEditor(themeId);
    },

    /**
     * 处理删除主题
     */
    handleDeleteTheme: (themeId) => {
        try {
            window.Logger.debug('准备删除主题', { themeId, themes: window.themeService.getThemes() });
            const theme = window.themeService.getTheme(themeId);
            window.Logger.debug('待删除主题对象', theme);
            const themeName = (theme && typeof theme.name === 'string') ? theme.name : '该主题';

            window.ThemesView.showConfirmationModal(
                `您确定要删除主题 "${themeName}" 吗？`,
                "此操作无法撤销。",
                () => {
                    try {
                        window.Logger.debug('执行删除', { themeId });
                        window.themeService.deleteTheme(themeId);
                        window.Logger.debug('删除后主题列表', window.themeService.getThemes());
                    window.ThemesView.render();
                        window.ThemesView.showSuccess(`主题 "${themeName}" 已成功删除。`);
                        window.Logger.debug(`Theme deleted: ${themeId}`);
                    } catch (error) {
                        window.Logger.error('删除主题时出错', error);
                        alert('删除主题时出错: ' + (error && error.message ? error.message : error));
                        window.ThemesView.showError(error.message || '删除主题失败，请重试。');
                    }
                }
            );
        } catch (error) {
            window.Logger.error('处理主题卡片点击失败', error);
            alert('删除主题操作失败: ' + (error && error.message ? error.message : error));
            window.ThemesView.showError('操作失败，请重试');
        }
    },

    /**
     * 验证主题名称输入
     */
    validateThemeNameInput: (input) => {
        const value = input.value.trim();
        
        // 移除之前的错误状态
        input.classList.remove('error');
        
        // 实时验证
        if (value.length > 50) {
            input.classList.add('error');
        }
        
        // 检查重复名称
        if (value) {
            const existingThemes = window.themeService.getThemes();
            if (existingThemes.some(theme => theme.name === value)) {
                input.classList.add('error');
            }
        }
    },

    /**
     * 通知主题更改
     */
    notifyThemeChange: () => {
        // 发送自定义事件，其他组件可以监听
        const event = new CustomEvent('themeChanged', {
            detail: { activeTheme: window.themeService.getActiveTheme() }
        });
        document.dispatchEvent(event);
    },

    /**
     * HTML转义，防止XSS
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 显示成功消息
     */
    showSuccess: (message) => {
        // 可以扩展为更复杂的通知系统
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    },

    /**
     * 显示错误消息
     */
    showError: (message) => {
        // 可以扩展为更复杂的通知系统
        alert(message);
    },

    /**
     * 显示主题编辑器
     */
    showThemeEditor: (themeId) => {
        const theme = window.themeService.getTheme(themeId);
        if (!theme) {
            window.ThemesView.showError('未找到要编辑的主题');
            return;
        }

        const themeEditorId = 'theme-editor-modal';
        const themeEditor = document.createElement('div');
        themeEditor.className = 'theme-editor-view';
        themeEditor.innerHTML = `
            <div class="theme-editor-content">
                <div class="theme-editor-header">
                    <h2>主题编辑器: ${window.ThemesView.escapeHtml(theme.name)}</h2>
                    <button class="theme-editor-close">&times;</button>
                </div>
                <div class="theme-editor-body">
                    <div class="theme-editor-sidebar">
                        <div class="editor-tabs">
                            <button class="tab-btn active" data-tab="basic">基础设置</button>
                            <button class="tab-btn" data-tab="title">标题系统</button>
                            <button class="tab-btn" data-tab="text">正文系统</button>
                            <button class="tab-btn" data-tab="special">特殊文本</button>
                            <button class="tab-btn" data-tab="block">块级元素</button>
                            <button class="tab-btn" data-tab="layout">视觉分隔</button>
                        </div>
                        <div class="editor-form">
                            <!-- 基础设置 -->
                            <div class="tab-content active" data-tab="basic">
                                <div class="form-section">
                                    <h4>主题配色</h4>
                                    <div class="color-group">
                                        <div class="form-row">
                                            <label>主题色:</label>
                                            <input type="color" id="theme-primary" value="${theme.styles['--theme-primary'] || '#0E2A73'}">
                                            <span class="color-desc">用于重要标题和强调</span>
                                        </div>
                                        <div class="form-row">
                                            <label>辅助色:</label>
                                            <input type="color" id="theme-secondary" value="${theme.styles['--theme-secondary'] || '#E0A26F'}">
                                            <span class="color-desc">用于装饰和次级强调</span>
                                        </div>
                                        <div class="form-row">
                                            <label>正文色:</label>
                                            <input type="color" id="text-primary" value="${theme.styles['--text-primary'] || '#333333'}">
                                            <span class="color-desc">正文主要颜色</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>字体设置</h4>
                                    <div class="form-row">
                                        <label>字体族:</label>
                                        <select id="font-family">
                                            <option value='"Microsoft YaHei", "Helvetica Neue", sans-serif'>微软雅黑（推荐）</option>
                                            <option value='"PingFang SC", "Helvetica Neue", sans-serif'>苹方-简</option>
                                            <option value='"Heiti SC", "Microsoft YaHei", sans-serif'>黑体</option>
                                            <option value='system-ui, -apple-system, sans-serif'>系统默认</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- 标题系统 -->
                            <div class="tab-content" data-tab="title">
                                <div class="form-section">
                                    <h4>H1 主标题</h4>
                                    <div class="form-row">
                                        <label>字体大小:</label>
                                        <input type="range" id="h1-size" min="20" max="32" value="${parseInt(theme.styles['--h1-font-size']) || 24}">
                                        <span class="range-value">${parseInt(theme.styles['--h1-font-size']) || 24}px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>颜色:</label>
                                        <input type="color" id="h1-color" value="${theme.styles['--h1-color'] || '#0E2A73'}">
                                    </div>
                                    <div class="form-row">
                                        <label>字重:</label>
                                        <select id="h1-weight">
                                            <option value="normal">常规</option>
                                            <option value="600" selected>中粗</option>
                                            <option value="bold">粗体</option>
                                        </select>
                                    </div>
                                    <div class="form-row">
                                        <label>对齐:</label>
                                        <select id="h1-align">
                                            <option value="left" selected>左对齐</option>
                                            <option value="center">居中</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>H2 章节标题</h4>
                                    <div class="form-row">
                                        <label>字体大小:</label>
                                        <input type="range" id="h2-size" min="16" max="24" value="${parseInt(theme.styles['--h2-font-size']) || 20}">
                                        <span class="range-value">${parseInt(theme.styles['--h2-font-size']) || 20}px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>颜色:</label>
                                        <input type="color" id="h2-color" value="${theme.styles['--h2-color'] || '#0E2A73'}">
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>H3 小节标题</h4>
                                    <div class="form-row">
                                        <label>字体大小:</label>
                                        <input type="range" id="h3-size" min="14" max="20" value="${parseInt(theme.styles['--h3-font-size']) || 18}">
                                        <span class="range-value">${parseInt(theme.styles['--h3-font-size']) || 18}px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>颜色:</label>
                                        <input type="color" id="h3-color" value="${theme.styles['--h3-color'] || '#333333'}">
                                    </div>
                                </div>
                            </div>

                            <!-- 正文系统 -->
                            <div class="tab-content" data-tab="text">
                                <div class="form-section">
                                    <h4>正文段落</h4>
                                    <div class="form-row">
                                        <label>字体大小:</label>
                                        <input type="range" id="p-size" min="14" max="18" value="${parseInt(theme.styles['--p-font-size']) || 16}">
                                        <span class="range-value">${parseInt(theme.styles['--p-font-size']) || 16}px</span>
                                        <span class="size-tip">推荐15-16px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>行高:</label>
                                        <input type="range" id="p-line-height" min="1.4" max="2.0" step="0.1" value="${parseFloat(theme.styles['--p-line-height']) || 1.7}">
                                        <span class="range-value">${parseFloat(theme.styles['--p-line-height']) || 1.7}</span>
                                        <span class="size-tip">推荐1.6-1.8</span>
                                    </div>
                                    <div class="form-row">
                                        <label>颜色:</label>
                                        <input type="color" id="p-color" value="${theme.styles['--p-color'] || '#333333'}">
                                        <span class="color-desc">推荐深灰色</span>
                                    </div>
                                    <div class="form-row">
                                        <label>段落间距:</label>
                                        <input type="range" id="p-margin" min="16" max="32" value="${parseInt(theme.styles['--p-margin-bottom']) || 20}">
                                        <span class="range-value">${parseInt(theme.styles['--p-margin-bottom']) || 20}px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>对齐方式:</label>
                                        <select id="p-align">
                                            <option value="left">左对齐</option>
                                            <option value="justify" selected>两端对齐</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <!-- 特殊文本 -->
                            <div class="tab-content" data-tab="special">
                                <div class="form-section">
                                    <h4>链接样式</h4>
                                    <div class="form-row">
                                        <label>链接色:</label>
                                        <input type="color" id="a-color" value="${theme.styles['--a-color'] || '#0E2A73'}">
                                    </div>
                                    <div class="form-row">
                                        <label>悬停色:</label>
                                        <input type="color" id="a-hover-color" value="${theme.styles['--a-hover-color'] || '#2C4BA3'}">
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>强调文本</h4>
                                    <div class="form-row">
                                        <label>粗体色:</label>
                                        <input type="color" id="strong-color" value="${theme.styles['--strong-color'] || '#E0A26F'}">
                                    </div>
                                    <div class="form-row">
                                        <label>斜体色:</label>
                                        <input type="color" id="em-color" value="${theme.styles['--em-color'] || '#E0A26F'}">
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>代码样式</h4>
                                    <div class="form-row">
                                        <label>代码背景:</label>
                                        <input type="color" id="code-bg" value="${theme.styles['--code-bg'] || '#F0F0F0'}">
                                    </div>
                                    <div class="form-row">
                                        <label>代码文字:</label>
                                        <input type="color" id="code-color" value="${theme.styles['--code-color'] || '#333333'}">
                                    </div>
                                </div>
                            </div>

                            <!-- 块级元素 -->
                            <div class="tab-content" data-tab="block">
                                <div class="form-section">
                                    <h4>引用块样式</h4>
                                    <div class="form-row">
                                        <label>背景色:</label>
                                        <input type="color" id="blockquote-bg" value="${theme.styles['--blockquote-bg'] || '#F8F9FA'}">
                                    </div>
                                    <div class="form-row">
                                        <label>边框色:</label>
                                        <input type="color" id="blockquote-border" value="${theme.styles['--blockquote-border-color'] || '#0E2A73'}">
                                    </div>
                                    <div class="form-row">
                                        <label>文字色:</label>
                                        <input type="color" id="blockquote-color" value="${theme.styles['--blockquote-color'] || '#333333'}">
                                    </div>
                                    <div class="form-row">
                                        <label>内边距:</label>
                                        <input type="range" id="blockquote-padding" min="10" max="25" value="${parseInt(theme.styles['--blockquote-padding']?.split(' ')[0]) || 15}">
                                        <span class="range-value">${parseInt(theme.styles['--blockquote-padding']?.split(' ')[0]) || 15}px</span>
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>代码块样式</h4>
                                    <div class="form-row">
                                        <label>背景色:</label>
                                        <input type="color" id="code-block-bg" value="${theme.styles['--code-block-bg'] || '#0A1D4E'}">
                                    </div>
                                    <div class="form-row">
                                        <label>文字色:</label>
                                        <input type="color" id="code-block-color" value="${theme.styles['--code-block-color'] || '#F8F9FA'}">
                                    </div>
                                </div>
                            </div>

                            <!-- 视觉分隔 -->
                            <div class="tab-content" data-tab="layout">
                                <div class="form-section">
                                    <h4>分隔线样式</h4>
                                    <div class="form-row">
                                        <label>颜色:</label>
                                        <input type="color" id="hr-color" value="${theme.styles['--hr-color'] || '#E0E0E0'}">
                                    </div>
                                    <div class="form-row">
                                        <label>粗细:</label>
                                        <input type="range" id="hr-height" min="0.5" max="3" step="0.5" value="${parseFloat(theme.styles['--hr-height']) || 1}">
                                        <span class="range-value">${parseFloat(theme.styles['--hr-height']) || 1}px</span>
                                    </div>
                                    <div class="form-row">
                                        <label>上下间距:</label>
                                        <input type="range" id="hr-margin" min="20" max="50" value="${parseInt(theme.styles['--hr-margin']?.split(' ')[0]) || 30}">
                                        <span class="range-value">${parseInt(theme.styles['--hr-margin']?.split(' ')[0]) || 30}px</span>
                                    </div>
                                </div>
                                <div class="form-section">
                                    <h4>列表样式</h4>
                                    <div class="form-row">
                                        <label>有序列表:</label>
                                        <select id="ol-style">
                                            <option value="decimal" selected>1, 2, 3</option>
                                            <option value="decimal-leading-zero">01, 02, 03</option>
                                            <option value="lower-roman">i, ii, iii</option>
                                            <option value="upper-roman">I, II, III</option>
                                        </select>
                                    </div>
                                    <div class="form-row">
                                        <label>无序列表:</label>
                                        <select id="ul-style">
                                            <option value="disc" selected>实心圆点</option>
                                            <option value="circle">空心圆点</option>
                                            <option value="square">方块</option>
                                        </select>
                                    </div>
                                    <div class="form-row">
                                        <label>缩进距离:</label>
                                        <input type="range" id="list-padding" min="20" max="40" value="${parseInt(theme.styles['--list-pl']) || 30}">
                                        <span class="range-value">${parseInt(theme.styles['--list-pl']) || 30}px</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="theme-editor-preview">
                        <h3>实时预览</h3>
                        <div class="preview-content">
                            <h1 class="preview-h1">这是主标题样式 H1</h1>
                            <h2 class="preview-h2">这是章节标题样式 H2</h2>
                            <p class="preview-p">这是正文段落样式。微信文章排版需要考虑移动端阅读体验，字体大小、行高、颜色对比度都很重要。这里有一个<a href="#" class="preview-a">链接样式</a>的示例，还有<strong class="preview-strong">粗体强调</strong>和<em class="preview-em">斜体强调</em>。</p>
                            <h3 class="preview-h3">这是小节标题样式 H3</h3>
                            <p class="preview-p">正文中可能包含<code class="preview-code">内联代码</code>，需要有明显的视觉区分。</p>
                            <blockquote class="preview-blockquote">
                                这是引用块的样式示例。引用内容应该与正文有明显的视觉区分，通常使用左侧竖线和背景色。
                            </blockquote>
                            <ul class="preview-ul">
                                <li>这是无序列表项目一</li>
                                <li>这是无序列表项目二</li>
                                <li>这是无序列表项目三</li>
                            </ul>
                            <ol class="preview-ol">
                                <li>这是有序列表项目一</li>
                                <li>这是有序列表项目二</li>
                                <li>这是有序列表项目三</li>
                            </ol>
                            <hr class="preview-hr">
                            <p class="preview-p">分隔线上方的内容。</p>
                            <pre class="preview-code-block"><code>// 这是代码块样式示例
function example() {
    console.log("Hello World");
}</code></pre>
                        </div>
                    </div>
                </div>
                <div class="theme-editor-footer">
                    <button class="btn btn-secondary" id="reset-theme-edit">重置为默认</button>
                    <button class="btn btn-secondary" id="cancel-theme-edit">取消</button>
                    <button class="btn btn-primary" id="save-theme-edit">保存主题</button>
                </div>
            </div>
        `;

        document.body.appendChild(themeEditor);

        // 绑定事件
        window.ThemesView.bindThemeEditorEvents(themeEditor, theme);

        // 初始化预览
        window.ThemesView.updateThemePreview(themeEditor);
    },

    /**
     * 绑定主题编辑器事件
     */
    bindThemeEditorEvents: (modal, theme) => {
        // 关闭按钮
        const closeBtn = modal.querySelector('.theme-editor-close');
        const cancelBtn = modal.querySelector('#cancel-theme-edit');
        const saveBtn = modal.querySelector('#save-theme-edit');
        const resetBtn = modal.querySelector('#reset-theme-edit');

        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 标签页切换
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const tabContents = modal.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                
                // 更新按钮状态
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新内容显示
                tabContents.forEach(content => {
                    if (content.dataset.tab === targetTab) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });

        // 实时预览更新
        const inputs = modal.querySelectorAll('input[type="color"], input[type="range"], select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                window.ThemesView.updateThemePreview(modal);
            });
            input.addEventListener('change', () => {
                window.ThemesView.updateThemePreview(modal);
            });
        });

        // 重置为默认
        resetBtn.addEventListener('click', () => {
            if (confirm('确定要重置为默认样式吗？这将清除当前所有自定义设置。')) {
                window.ThemesView.resetThemeToDefault(modal, theme);
            }
        });

        // 保存主题
        saveBtn.addEventListener('click', () => {
            window.ThemesView.saveThemeFromEditor(modal, theme);
            closeModal();
        });
    },

    /**
     * 更新主题预览
     */
    updateThemePreview: (modal) => {
        try {
            // 更新所有范围值显示
            const rangeInputs = modal.querySelectorAll('input[type="range"]');
            rangeInputs.forEach(input => {
                const valueSpan = input.nextElementSibling;
                if (valueSpan && valueSpan.classList.contains('range-value')) {
                    const value = parseFloat(input.value);
                    const unit = input.id.includes('height') && value < 10 ? 'px' : 
                                input.id.includes('size') ? 'px' : 
                                input.id.includes('line-height') ? '' : 'px';
                    valueSpan.textContent = value + unit;
                }
            });

            // 获取所有样式值
            const getInputValue = (id) => {
                const input = modal.querySelector('#' + id);
                return input ? input.value : '';
            };

            // 字体设置
            const fontFamily = getInputValue('font-family');

            // 标题样式
            const h1Color = getInputValue('h1-color');
            const h1Size = getInputValue('h1-size');
            const h1Weight = getInputValue('h1-weight');
            const h1Align = getInputValue('h1-align');

            const h2Color = getInputValue('h2-color');
            const h2Size = getInputValue('h2-size');

            const h3Color = getInputValue('h3-color');
            const h3Size = getInputValue('h3-size');

            // 正文样式
            const pColor = getInputValue('p-color');
            const pSize = getInputValue('p-size');
            const pLineHeight = getInputValue('p-line-height');
            const pMargin = getInputValue('p-margin');
            const pAlign = getInputValue('p-align');

            // 特殊文本
            const aColor = getInputValue('a-color');
            const aHoverColor = getInputValue('a-hover-color');
            const strongColor = getInputValue('strong-color');
            const emColor = getInputValue('em-color');
            const codeColor = getInputValue('code-color');
            const codeBg = getInputValue('code-bg');

            // 块级元素
            const blockquoteBg = getInputValue('blockquote-bg');
            const blockquoteBorder = getInputValue('blockquote-border');
            const blockquoteColor = getInputValue('blockquote-color');
            const blockquotePadding = getInputValue('blockquote-padding');
            const codeBlockBg = getInputValue('code-block-bg');
            const codeBlockColor = getInputValue('code-block-color');

            // 视觉分隔
            const hrColor = getInputValue('hr-color');
            const hrHeight = getInputValue('hr-height');
            const hrMargin = getInputValue('hr-margin');
            const olStyle = getInputValue('ol-style');
            const ulStyle = getInputValue('ul-style');
            const listPadding = getInputValue('list-padding');

            // 应用样式到预览元素
            const previewContent = modal.querySelector('.preview-content');
            if (previewContent) {
                previewContent.style.fontFamily = fontFamily;
            }

            // H1 样式
            const previewH1 = modal.querySelector('.preview-h1');
            if (previewH1) {
                previewH1.style.color = h1Color;
                previewH1.style.fontSize = h1Size + 'px';
                previewH1.style.fontWeight = h1Weight;
                previewH1.style.textAlign = h1Align;
                previewH1.style.fontFamily = fontFamily;
            }

            // H2 样式
            const previewH2 = modal.querySelector('.preview-h2');
            if (previewH2) {
                previewH2.style.color = h2Color;
                previewH2.style.fontSize = h2Size + 'px';
                previewH2.style.fontWeight = '600';
                previewH2.style.fontFamily = fontFamily;
            }

            // H3 样式
            const previewH3 = modal.querySelector('.preview-h3');
            if (previewH3) {
                previewH3.style.color = h3Color;
                previewH3.style.fontSize = h3Size + 'px';
                previewH3.style.fontWeight = '600';
                previewH3.style.fontFamily = fontFamily;
            }

            // 正文样式
            const previewP = modal.querySelectorAll('.preview-p');
            previewP.forEach(p => {
                p.style.color = pColor;
                p.style.fontSize = pSize + 'px';
                p.style.lineHeight = pLineHeight;
                p.style.marginBottom = pMargin + 'px';
                p.style.textAlign = pAlign;
                p.style.fontFamily = fontFamily;
            });

            // 链接样式
            const previewA = modal.querySelector('.preview-a');
            if (previewA) {
                previewA.style.color = aColor;
                previewA.style.textDecoration = 'none';
            }

            // 强调文本样式
            const previewStrong = modal.querySelector('.preview-strong');
            if (previewStrong) {
                previewStrong.style.color = strongColor;
                previewStrong.style.fontWeight = 'bold';
            }

            const previewEm = modal.querySelector('.preview-em');
            if (previewEm) {
                previewEm.style.color = emColor;
                previewEm.style.fontStyle = 'italic';
            }

            // 内联代码样式
            const previewCode = modal.querySelector('.preview-code');
            if (previewCode) {
                previewCode.style.backgroundColor = codeBg;
                previewCode.style.color = codeColor;
                previewCode.style.padding = '2px 4px';
                previewCode.style.borderRadius = '3px';
                previewCode.style.fontFamily = 'Consolas, Monaco, "Courier New", monospace';
            }

            // 引用块样式
            const previewBlockquote = modal.querySelector('.preview-blockquote');
            if (previewBlockquote) {
                previewBlockquote.style.backgroundColor = blockquoteBg;
                previewBlockquote.style.borderLeft = `4px solid ${blockquoteBorder}`;
                previewBlockquote.style.color = blockquoteColor;
                previewBlockquote.style.padding = `${blockquotePadding}px ${blockquotePadding * 1.3}px`;
                previewBlockquote.style.margin = '16px 0';
                previewBlockquote.style.borderRadius = '4px';
                previewBlockquote.style.fontFamily = fontFamily;
            }

            // 代码块样式
            const previewCodeBlock = modal.querySelector('.preview-code-block');
            if (previewCodeBlock) {
                previewCodeBlock.style.backgroundColor = codeBlockBg;
                previewCodeBlock.style.color = codeBlockColor;
                previewCodeBlock.style.padding = '15px';
                previewCodeBlock.style.borderRadius = '6px';
                previewCodeBlock.style.margin = '16px 0';
                previewCodeBlock.style.overflow = 'auto';
            }

            // 分隔线样式
            const previewHr = modal.querySelector('.preview-hr');
            if (previewHr) {
                previewHr.style.border = 'none';
                previewHr.style.height = hrHeight + 'px';
                previewHr.style.backgroundColor = hrColor;
                previewHr.style.margin = `${hrMargin}px 0`;
            }

            // 列表样式
            const previewUl = modal.querySelector('.preview-ul');
            if (previewUl) {
                previewUl.style.listStyleType = ulStyle;
                previewUl.style.paddingLeft = listPadding + 'px';
                previewUl.style.fontFamily = fontFamily;
            }

            const previewOl = modal.querySelector('.preview-ol');
            if (previewOl) {
                previewOl.style.listStyleType = olStyle;
                previewOl.style.paddingLeft = listPadding + 'px';
                previewOl.style.fontFamily = fontFamily;
            }

        } catch (error) {
            window.Logger.error('更新预览失败:', error);
        }
    },

    /**
     * 从编辑器保存主题
     */
    saveThemeFromEditor: (modal, theme) => {
        try {
            // 获取所有表单值的辅助函数
            const getInputValue = (id) => {
                const input = modal.querySelector('#' + id);
                return input ? input.value : '';
            };

            // 收集所有样式设置
            const updatedStyles = {
                ...theme.styles,
                
                // 基础设置
                '--theme-primary': getInputValue('theme-primary'),
                '--theme-secondary': getInputValue('theme-secondary'),
                '--text-primary': getInputValue('text-primary'),
                '--p-font-family': getInputValue('font-family'),
                
                // 标题系统
                '--h1-font-size': getInputValue('h1-size') + 'px',
                '--h1-color': getInputValue('h1-color'),
                '--h1-font-weight': getInputValue('h1-weight'),
                '--h1-text-align': getInputValue('h1-align'),
                
                '--h2-font-size': getInputValue('h2-size') + 'px',
                '--h2-color': getInputValue('h2-color'),
                '--h2-font-weight': '600',
                '--h2-text-align': 'left',
                
                '--h3-font-size': getInputValue('h3-size') + 'px',
                '--h3-color': getInputValue('h3-color'),
                '--h3-font-weight': '600',
                '--h3-text-align': 'left',
                
                // 正文系统
                '--p-font-size': getInputValue('p-size') + 'px',
                '--p-color': getInputValue('p-color'),
                '--p-line-height': getInputValue('p-line-height'),
                '--p-margin-bottom': getInputValue('p-margin') + 'px',
                '--p-text-align': getInputValue('p-align'),
                
                // 特殊文本
                '--a-color': getInputValue('a-color'),
                '--a-hover-color': getInputValue('a-hover-color'),
                '--strong-color': getInputValue('strong-color'),
                '--em-color': getInputValue('em-color'),
                '--code-bg': getInputValue('code-bg'),
                '--code-color': getInputValue('code-color'),
                
                // 块级元素
                '--blockquote-bg': getInputValue('blockquote-bg'),
                '--blockquote-border-color': getInputValue('blockquote-border'),
                '--blockquote-color': getInputValue('blockquote-color'),
                '--blockquote-padding': getInputValue('blockquote-padding') + 'px ' + (getInputValue('blockquote-padding') * 1.3) + 'px',
                '--code-block-bg': getInputValue('code-block-bg'),
                '--code-block-color': getInputValue('code-block-color'),
                '--code-block-padding': '15px',
                '--code-block-border-radius': '6px',
                
                // 视觉分隔
                '--hr-color': getInputValue('hr-color'),
                '--hr-height': getInputValue('hr-height') + 'px',
                '--hr-margin': getInputValue('hr-margin') + 'px 0',
                '--ol-list-style': getInputValue('ol-style'),
                '--ul-list-style': getInputValue('ul-style'),
                '--list-pl': getInputValue('list-padding') + 'px'
            };

            const updatedTheme = {
                ...theme,
                styles: updatedStyles
            };

            window.themeService.updateTheme(updatedTheme);
            window.ThemesView.render();
            window.ThemesView.showSuccess(`主题 "${theme.name}" 已更新！`);

            // 如果是当前激活的主题，重新应用
            if (theme.isActive) {
                window.themeService.applyTheme(theme.name);
                window.ThemesView.notifyThemeChange();
            }

        } catch (error) {
            window.Logger.error('保存主题失败:', error);
            window.ThemesView.showError('保存主题失败');
        }
    },

    /**
     * 重置主题为默认设置
     */
    resetThemeToDefault: (modal, theme) => {
        try {
            // 默认样式配置
            const defaultStyles = {
                // 基础设置
                '--theme-primary': '#0E2A73',
                '--theme-secondary': '#E0A26F',
                '--text-primary': '#333333',
                '--p-font-family': '"Microsoft YaHei", "Helvetica Neue", sans-serif',
                
                // 标题系统
                '--h1-font-size': '24px',
                '--h1-color': '#0E2A73',
                '--h1-font-weight': '600',
                '--h1-text-align': 'left',
                
                '--h2-font-size': '20px',
                '--h2-color': '#0E2A73',
                '--h2-font-weight': '600',
                '--h2-text-align': 'left',
                
                '--h3-font-size': '18px',
                '--h3-color': '#333333',
                '--h3-font-weight': '600',
                '--h3-text-align': 'left',
                
                // 正文系统
                '--p-font-size': '16px',
                '--p-color': '#333333',
                '--p-line-height': '1.7',
                '--p-margin-bottom': '20px',
                '--p-text-align': 'justify',
                
                // 特殊文本
                '--a-color': '#0E2A73',
                '--a-hover-color': '#2C4BA3',
                '--strong-color': '#E0A26F',
                '--em-color': '#E0A26F',
                '--code-bg': '#F0F0F0',
                '--code-color': '#333333',
                
                // 块级元素
                '--blockquote-bg': '#F8F9FA',
                '--blockquote-border-color': '#0E2A73',
                '--blockquote-color': '#333333',
                '--blockquote-padding': '15px 20px',
                '--code-block-bg': '#0A1D4E',
                '--code-block-color': '#F8F9FA',
                '--code-block-padding': '15px',
                '--code-block-border-radius': '6px',
                
                // 视觉分隔
                '--hr-color': '#E0E0E0',
                '--hr-height': '1px',
                '--hr-margin': '30px 0',
                '--ol-list-style': 'decimal',
                '--ul-list-style': 'disc',
                '--list-pl': '30px'
            };

            // 重置表单值
            Object.entries(defaultStyles).forEach(([key, value]) => {
                const inputId = key.replace('--', '').replace(/-/g, '-');
                const input = modal.querySelector('#' + inputId);
                if (input) {
                    if (input.type === 'color') {
                        input.value = value;
                    } else if (input.type === 'range') {
                        input.value = parseFloat(value);
                    } else if (input.tagName === 'SELECT') {
                        input.value = value;
                    }
                }
            });

            // 更新预览
            window.ThemesView.updateThemePreview(modal);
            
            window.ThemesView.showSuccess('已重置为默认样式');

        } catch (error) {
            window.Logger.error('重置主题失败:', error);
            window.ThemesView.showError('重置主题失败');
        }
    },

    /**
     * 统一确认弹窗
     */
    showConfirmationModal: (message, subMessage, onConfirm) => {
        // 移除已有弹窗
        const existing = document.getElementById('confirmation-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.style.cssText = `
            position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 10001;
            background: rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div style="background: #fff; border-radius: 10px; min-width: 320px; max-width: 90vw; box-shadow: 0 4px 24px rgba(0,0,0,0.12); padding: 32px 24px; text-align: center;">
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 12px;">${message}</div>
                <div style="color: #888; margin-bottom: 24px;">${subMessage || ''}</div>
                <button id="confirm-btn" class="btn btn-danger" style="margin-right: 16px;">确认</button>
                <button id="cancel-btn" class="btn btn-secondary">取消</button>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirm-btn').onclick = () => {
            modal.remove();
            if (typeof onConfirm === 'function') onConfirm();
        };
        modal.querySelector('#cancel-btn').onclick = () => {
            modal.remove();
        };
    }
}; 